#!/usr/bin/env python3
"""
Code Reviewer CLI
A command-line tool that parses Python files using Python's `ast` module,
detects code problems, and provides plain language explanations and suggested
fixes using Gemini / LLM structured responses.

Works with zero external dependencies (pure Python 3 standard library).
"""

import ast
import json
import os
import sys
import argparse
import urllib.request
import urllib.error
from typing import List, Dict, Any, Optional

# Built-in sensible fallbacks if LLM is offline or no API key is provided
FALLBACK_EXPLANATIONS = {
    "missing_docstring": {
        "why": "Readers and team members cannot tell what this function or class does without inspecting its full implementation.",
        "fix": "Add a descriptive docstring explaining purpose, parameters, and return value.",
        "severity": "low"
    },
    "deeply_nested_code": {
        "why": "Deeply nested blocks increase cognitive complexity, make edge cases harder to test, and often lead to bugs.",
        "fix": "Use guard clauses (early returns) or extract inner logic into dedicated helper functions.",
        "severity": "medium"
    },
    "unused_variable": {
        "why": "Unused variables clutter the scope, waste memory, and mislead readers into thinking the value is used.",
        "fix": "Remove the unused variable or prefix it with an underscore (e.g., _unused) if required by an unpack pattern.",
        "severity": "low"
    },
    "mutable_default_arg": {
        "why": "Default mutable arguments (lists/dicts/sets) are instantiated once at function definition time, causing unintended state persistence across multiple calls.",
        "fix": "Use None as the default argument value and initialize the mutable object inside the function (e.g., if arg is None: arg = []).",
        "severity": "high"
    },
    "bare_except": {
        "why": "A bare except catches all exceptions including SystemExit and KeyboardInterrupt, masking fatal crashes and making debugging difficult.",
        "fix": "Specify the exact exception class, or at least catch 'Exception' instead of a bare 'except:'.",
        "severity": "high"
    },
    "comparison_to_none": {
        "why": "Equality comparison (== None) can trigger overloaded __eq__ methods and is not idiomatic in Python.",
        "fix": "Use identity comparison 'is None' or 'is not None'.",
        "severity": "medium"
    },
    "shadowed_builtin": {
        "why": "Overriding Python standard built-ins (like list, dict, id, type, sum) prevents accessing the original built-in in that scope.",
        "fix": "Rename the variable to a descriptive domain name (e.g., item_list instead of list).",
        "severity": "medium"
    },
    "dead_code": {
        "why": "Statements placed immediately after unconditional return, raise, or break can never be reached during execution.",
        "fix": "Remove unreachable dead code statements or reposition them before the return/raise.",
        "severity": "medium"
    }
}

PYTHON_BUILTINS = {
    "list", "dict", "set", "str", "int", "float", "bool", "type",
    "id", "sum", "min", "max", "len", "open", "input", "print",
    "range", "map", "filter", "zip", "all", "any", "dir", "help"
}


class CodeIssueDetector(ast.NodeVisitor):
    def __init__(self, filename: str, source_code: str):
        self.filename = filename
        self.source_code = source_code
        self.lines = source_code.splitlines()
        self.issues: List[Dict[str, Any]] = []
        self._current_function_depth = 0
        self._nesting_depth = 0

    def get_line_snippet(self, lineno: int, context: int = 1) -> str:
        start = max(0, lineno - 1 - context)
        end = min(len(self.lines), lineno + context)
        return "\n".join(self.lines[start:end])

    def visit_FunctionDef(self, node: ast.FunctionDef):
        self._check_function_or_class_docstring(node, is_class=False)
        self._check_mutable_defaults(node)
        self._check_unused_variables(node)
        self._check_dead_code(node.body)

        old_depth = self._nesting_depth
        self._nesting_depth += 1
        self.generic_visit(node)
        self._nesting_depth = old_depth

    def visit_AsyncFunctionDef(self, node: ast.AsyncFunctionDef):
        self._check_function_or_class_docstring(node, is_class=False)
        self._check_mutable_defaults(node)
        self._check_unused_variables(node)
        self._check_dead_code(node.body)

        old_depth = self._nesting_depth
        self._nesting_depth += 1
        self.generic_visit(node)
        self._nesting_depth = old_depth

    def visit_ClassDef(self, node: ast.ClassDef):
        self._check_function_or_class_docstring(node, is_class=True)
        old_depth = self._nesting_depth
        self._nesting_depth += 1
        self.generic_visit(node)
        self._nesting_depth = old_depth

    def _check_function_or_class_docstring(self, node: Any, is_class: bool):
        # Only require docstrings for public functions and classes (not private helper __init__, _func, etc unless desired)
        doc = ast.get_docstring(node)
        target_name = node.name
        if not doc:
            # Special exemption for trivial dunder methods other than __init__ if needed, but flag standard methods
            category = "missing docstring"
            rule_id = "missing_docstring"
            entity_type = "class" if is_class else "function"
            target_str = f"{target_name}()" if not is_class else target_name
            self.issues.append({
                "rule_id": rule_id,
                "category": category,
                "entity": target_str,
                "entity_type": entity_type,
                "line": node.lineno,
                "col": node.col_offset,
                "filename": self.filename,
                "context": self.get_line_snippet(node.lineno, context=2),
                "severity": "low",
            })

    def _check_mutable_defaults(self, node: Any):
        # Check defaults in args, posonlyargs, kw_defaults
        for default in node.args.defaults + [d for d in node.args.kw_defaults if d]:
            if isinstance(default, (ast.List, ast.Dict, ast.Set)):
                repr_str = "[]" if isinstance(default, ast.List) else ("{}" if isinstance(default, ast.Dict) else "set()")
                self.issues.append({
                    "rule_id": "mutable_default_arg",
                    "category": "mutable default argument",
                    "entity": f"{node.name}()",
                    "line": default.lineno,
                    "col": default.col_offset,
                    "filename": self.filename,
                    "context": self.get_line_snippet(default.lineno, context=1),
                    "severity": "high",
                })

    def _check_unused_variables(self, func_node: Any):
        # Collect assigned local variables vs loaded variables in the function body
        assigned_vars: Dict[str, int] = {}
        loaded_vars = set()

        for subnode in ast.walk(func_node):
            if isinstance(subnode, ast.Name):
                if isinstance(subnode.ctx, ast.Store):
                    # Don't flag '_' or variable starting with '_'
                    if not subnode.id.startswith("_") and subnode.id not in assigned_vars:
                        assigned_vars[subnode.id] = subnode.lineno
                elif isinstance(subnode.ctx, ast.Load):
                    loaded_vars.add(subnode.id)

        # Remove function parameter names from unused check if they are parameters (parameters are inspected separately if needed)
        arg_names = {a.arg for a in getattr(func_node.args, "posonlyargs", [])} | \
                    {a.arg for a in func_node.args.args} | \
                    {a.arg for a in func_node.args.kwonlyargs}

        for var_name, lineno in assigned_vars.items():
            if var_name not in loaded_vars and var_name not in arg_names:
                self.issues.append({
                    "rule_id": "unused_variable",
                    "category": "unused variable",
                    "entity": var_name,
                    "line": lineno,
                    "col": 0,
                    "filename": self.filename,
                    "context": self.get_line_snippet(lineno, context=1),
                    "severity": "low",
                })

    def _check_dead_code(self, body: List[ast.stmt]):
        for i, stmt in enumerate(body):
            if isinstance(stmt, (ast.Return, ast.Raise, ast.Break, ast.Continue)):
                if i + 1 < len(body):
                    unreachable_stmt = body[i + 1]
                    self.issues.append({
                        "rule_id": "dead_code",
                        "category": "unreachable code",
                        "entity": f"after {stmt.__class__.__name__.lower()}",
                        "line": unreachable_stmt.lineno,
                        "col": unreachable_stmt.col_offset,
                        "filename": self.filename,
                        "context": self.get_line_snippet(unreachable_stmt.lineno, context=1),
                        "severity": "medium",
                    })
                break

    # Nesting depth checks
    def _track_nesting(self, node: ast.AST):
        self._nesting_depth += 1
        if self._nesting_depth >= 4:
            # Deeply nested code problem
            self.issues.append({
                "rule_id": "deeply_nested_code",
                "category": "deeply nested code",
                "entity": f"nesting level {self._nesting_depth}",
                "line": getattr(node, "lineno", 1),
                "col": getattr(node, "col_offset", 0),
                "filename": self.filename,
                "context": self.get_line_snippet(getattr(node, "lineno", 1), context=1),
                "severity": "medium",
            })
        self.generic_visit(node)
        self._nesting_depth -= 1

    def visit_If(self, node: ast.If):
        self._track_nesting(node)

    def visit_For(self, node: ast.For):
        self._track_nesting(node)

    def visit_AsyncFor(self, node: ast.AsyncFor):
        self._track_nesting(node)

    def visit_While(self, node: ast.While):
        self._track_nesting(node)

    def visit_Try(self, node: ast.Try):
        # Check for bare except:
        for handler in node.handlers:
            if handler.type is None:
                self.issues.append({
                    "rule_id": "bare_except",
                    "category": "bare except clause",
                    "entity": "except:",
                    "line": handler.lineno,
                    "col": handler.col_offset,
                    "filename": self.filename,
                    "context": self.get_line_snippet(handler.lineno, context=1),
                    "severity": "high",
                })
        self._track_nesting(node)

    def visit_Compare(self, node: ast.Compare):
        # Check comparison to None with == or !=
        for op, comparator in zip(node.ops, node.comparators):
            is_eq = isinstance(op, (ast.Eq, ast.NotEq))
            is_none = (isinstance(comparator, ast.Constant) and comparator.value is None) or \
                      (isinstance(node.left, ast.Constant) and node.left.value is None)
            if is_eq and is_none:
                op_symbol = "==" if isinstance(op, ast.Eq) else "!="
                self.issues.append({
                    "rule_id": "comparison_to_none",
                    "category": "comparison to None using equality",
                    "entity": f"{op_symbol} None",
                    "line": node.lineno,
                    "col": node.col_offset,
                    "filename": self.filename,
                    "context": self.get_line_snippet(node.lineno, context=1),
                    "severity": "medium",
                })
        self.generic_visit(node)

    def visit_Assign(self, node: ast.Assign):
        # Check shadowed builtins (e.g. list = [1, 2], id = 5)
        for target in node.targets:
            if isinstance(target, ast.Name) and target.id in PYTHON_BUILTINS:
                self.issues.append({
                    "rule_id": "shadowed_builtin",
                    "category": "shadowed built-in name",
                    "entity": target.id,
                    "line": target.lineno,
                    "col": target.col_offset,
                    "filename": self.filename,
                    "context": self.get_line_snippet(target.lineno, context=1),
                    "severity": "medium",
                })
        self.generic_visit(node)


def parse_and_analyze_python(filename: str, source_code: str) -> List[Dict[str, Any]]:
    try:
        tree = ast.parse(source_code, filename=filename)
    except SyntaxError as e:
        return [{
            "rule_id": "syntax_error",
            "category": "syntax error",
            "entity": f"SyntaxError at line {e.lineno}",
            "line": e.lineno or 1,
            "col": e.offset or 0,
            "filename": filename,
            "context": e.text or "",
            "severity": "high",
            "why": f"Python cannot parse this file: {e.msg}.",
            "fix": "Fix the syntax error to allow AST parsing."
        }]

    detector = CodeIssueDetector(filename, source_code)
    detector.visit(tree)

    # Sort issues by line number
    sorted_issues = sorted(detector.issues, key=lambda x: (x["line"], x["col"]))
    return sorted_issues


def call_gemini_for_issues(issues: List[Dict[str, Any]], source_code: str, api_key: str) -> List[Dict[str, Any]]:
    """
    Sends each issue to Gemini API for a plain language explanation and suggested fix in structured JSON form.
    If the API call fails, falls back gracefully to standard rules.
    """
    if not api_key or not issues:
        return issues

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

    # Prepare structured prompt
    issues_summary = []
    for idx, iss in enumerate(issues):
        issues_summary.append({
            "id": idx,
            "rule_id": iss.get("rule_id"),
            "category": iss.get("category"),
            "entity": iss.get("entity"),
            "line": iss.get("line"),
            "context": iss.get("context")
        })

    prompt_text = f"""You are a friendly, expert Python code reviewer.
A Python AST analyzer detected the following problems in a file:

File snippet / source preview:
{source_code[:1500]}

Issues detected:
{json.dumps(issues_summary, indent=2)}

For each issue, return a JSON array of objects with the exact schema:
[
  {{
    "id": <issue id integer matching input>,
    "why": "<1-2 sentence plain language explanation of why this is a problem, friendly and clear>",
    "fix": "<1-2 sentence actionable fix advice>",
    "corrected_snippet": "<short 1-4 line code snippet showing the fixed code>",
    "severity": "<high | medium | low>"
  }}
]

Respond with VALID JSON ONLY. Do not wrap in markdown or backticks."""

    payload = {
        "contents": [{
            "parts": [{"text": prompt_text}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "temperature": 0.2
        }
    }

    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            content_text = data["candidates"][0]["content"]["parts"][0]["text"]
            gemini_results = json.loads(content_text)

            # Map back to issues
            for res in gemini_results:
                issue_id = res.get("id")
                if isinstance(issue_id, int) and 0 <= issue_id < len(issues):
                    if res.get("why"):
                        issues[issue_id]["why"] = res["why"]
                    if res.get("fix"):
                        issues[issue_id]["fix"] = res["fix"]
                    if res.get("severity"):
                        issues[issue_id]["severity"] = res["severity"].lower()
                    if res.get("corrected_snippet"):
                        issues[issue_id]["corrected_snippet"] = res["corrected_snippet"]
    except Exception as e:
        # Graceful fallback: Still print the basic finding
        pass

    return issues


def enhance_issues_with_defaults(issues: List[Dict[str, Any]]):
    for iss in issues:
        rule_id = iss.get("rule_id", "")
        defaults = FALLBACK_EXPLANATIONS.get(rule_id, {
            "why": f"Potential code quality issue detected with {iss.get('category')}.",
            "fix": "Refactor according to Python PEP 8 guidelines.",
            "severity": "medium"
        })
        if "why" not in iss or not iss["why"]:
            iss["why"] = defaults["why"]
        if "fix" not in iss or not iss["fix"]:
            iss["fix"] = defaults["fix"]
        if "severity" not in iss or not iss["severity"]:
            iss["severity"] = defaults["severity"]


def calculate_score(issues: List[Dict[str, Any]], loc: int) -> int:
    """Calculate a code health score out of 100 based on severity and issue count."""
    if not issues:
        return 100
    penalty = 0
    for iss in issues:
        sev = iss.get("severity", "medium").lower()
        if sev == "high":
            penalty += 15
        elif sev == "medium":
            penalty += 8
        else:
            penalty += 3
    return max(0, 100 - penalty)


def format_cli_report(results_by_file: Dict[str, List[Dict[str, Any]]], show_diff: bool = False, show_severity: bool = True) -> str:
    blocks = []
    
    for filename, issues in results_by_file.items():
        if not issues:
            blocks.append(f"[OK] {filename}: No issues found! Clean code.\n")
            continue

        for iss in issues:
            line_no = iss.get("line", 1)
            cat = iss.get("category", "issue")
            entity = iss.get("entity", "")
            why = iss.get("why", "").strip()
            fix = iss.get("fix", "").strip()
            sev = iss.get("severity", "medium").upper()

            # Format matching the prompt example:
            # Line 12 | missing docstring | calc()
            #   Why: readers cannot tell what calc() does.
            #   Fix: add a one-line docstring.
            lines = []
            if show_severity:
                lines.append(f"Line {line_no} | {cat} | {entity} [{sev}]")
            else:
                lines.append(f"Line {line_no} | {cat} | {entity}")

            lines.append(f"  Why: {why}")
            lines.append(f"  Fix: {fix}")

            if show_diff and iss.get("corrected_snippet"):
                lines.append("  Suggested Fix:")
                for sline in iss["corrected_snippet"].splitlines():
                    lines.append(f"    {sline}")

            blocks.append("\n".join(lines))

    return "\n\n".join(blocks)


def review_path(path: str, api_key: str = "", use_llm: bool = True) -> Dict[str, List[Dict[str, Any]]]:
    files_to_check = []
    if os.path.isfile(path):
        files_to_check.append(path)
    elif os.path.isdir(path):
        for root, _, files in os.walk(path):
            for f in files:
                if f.endswith(".py"):
                    files_to_check.append(os.path.join(root, f))
    else:
        raise FileNotFoundError(f"Path does not exist: {path}")

    results = {}
    for fpath in files_to_check:
        try:
            with open(fpath, "r", encoding="utf-8") as f:
                code = f.read()
            issues = parse_and_analyze_python(fpath, code)
            enhance_issues_with_defaults(issues)
            if use_llm and api_key:
                issues = call_gemini_for_issues(issues, code, api_key)
            results[fpath] = issues
        except Exception as err:
            results[fpath] = [{
                "rule_id": "read_error",
                "category": "file read error",
                "entity": str(err),
                "line": 1,
                "why": f"Could not read file: {err}",
                "fix": "Ensure file exists and has read permissions.",
                "severity": "high"
            }]

    return results


def main():
    parser = argparse.ArgumentParser(
        description="Python AST Code Reviewer CLI with Gemini/LLM Plain Explanations and Fixes"
    )
    parser.add_argument("target", help="Python file or directory to review")
    parser.add_argument("--key", default=os.getenv("GEMINI_API_KEY", ""), help="Gemini API Key")
    parser.add_argument("--no-llm", action="store_true", help="Disable LLM calls, use standard rules engine")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON format")
    parser.add_argument("--score", action="store_true", help="Print overall code health score")
    parser.add_argument("--diff", action="store_true", help="Include corrected code snippet")
    parser.add_argument("--report", help="Save review report to specified markdown/text file")

    args = parser.parse_args()

    try:
        results = review_path(args.target, api_key=args.key, use_llm=not args.no_llm)
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    if args.json:
        print(json.dumps(results, indent=2))
        return

    report_text = format_cli_report(results, show_diff=args.diff)
    print(report_text)

    total_issues = sum(len(v) for v in results.values())
    if args.score:
        score = calculate_score([iss for sublist in results.values() for iss in sublist], 100)
        print(f"\n==========================================")
        print(f"Overall Code Health Score: {score}/100")
        print(f"Total Issues Detected: {total_issues}")
        print(f"==========================================")

    if args.report:
        with open(args.report, "w", encoding="utf-8") as f:
            f.write(f"# Code Review Report\n\nTarget: `{args.target}`\n\n")
            f.write("```\n" + report_text + "\n```\n")
        print(f"\nReport written to {args.report}")


if __name__ == "__main__":
    main()
