"""
Sample Python File for Code Reviewer CLI testing
"""

import sys

GLOBAL_CONFIG = {"debug": True}


def greet(name):
    print(f"Hello, {name}")


def calc(a, b, cache=[]):
    total = a + b
    unused_var = 42
    if a > 0:
        if b > 0:
            if a != b:
                if total > 10:
                    print("Deep calculation reached")
    return total
    print("This is dead code that will never run")


def process_data(items):
    list = [x for x in items]
    try:
        val = list[0]
        if val == None:
            return 0
    except:
        return -1
    return val
