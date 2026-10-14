# Problem 8: Code Reviewer CLI

An AST-powered command-line tool that reads Python files, identifies code smells and structural anti-patterns using Python's `ast` module, and generates plain-language explanations and suggested fixes using Gemini AI.

## Quick CLI Usage

You can run `reviewer.py` directly from your terminal using Python 3 (pure standard library, zero external pip dependencies needed):

```bash
# Basic review on sample file
python reviewer.py sample.py

# Review with suggested code fixes / diffs
python reviewer.py sample.py --diff

# Print overall code health score (0-100)
python reviewer.py sample.py --score

# Review an entire directory (batch scan)
python reviewer.py examples/ --score

# Output machine-readable JSON
python reviewer.py sample.py --json

# Save report to a file
python reviewer.py sample.py --report report.md
```

## Sample Output Format

Matches the exact assignment specification:

```text
Line 12 | missing docstring | calc()
  Why: readers cannot tell what calc() does.
  Fix: add a one-line docstring.
```

## Detected Problems (8 Rules)

1. **Missing Docstring**: Public functions and classes lacking docstrings.
2. **Deeply Nested Code**: Cyclomatic complexity with nesting depth $\ge 4$.
3. **Unused Variable**: Variables assigned locally within a scope but never referenced.
4. **Mutable Default Argument**: Risky defaults such as `def fn(items=[])` or `def fn(data={})`.
5. **Bare Except Clause**: Unbounded `except:` catching `KeyboardInterrupt` and `SystemExit`.
6. **Comparison to None**: Non-idiomatic equality check `x == None` instead of identity `x is None`.
7. **Shadowed Built-in**: Overwriting Python built-in symbols like `list`, `id`, `dict`, `sum`.
8. **Dead / Unreachable Code**: Statements placed directly after unconditional `return` or `raise`.

## Bonus Features Included

- **Severity Levels**: Calibrated `[HIGH]`, `[MEDIUM]`, and `[LOW]` categories.
- **Show Corrected Code**: Side-by-side diff viewer and suggested fix code snippets.
- **Directory & Folder Review**: Recursively scan all `.py` files in any folder.
- **Health Score & Metrics**: 0-100 scoring based on penalty weights and code volume.
- **Interactive Web Studio**: Integrated terminal simulator, code editor with gutter indicators, and report exporter.
