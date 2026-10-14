"""
Example 1: Calculator with typical beginner code smells
"""

def add(a, b):
    return a + b


def calculate_discount(price, rate, history=[]):
    total = price * (1 - rate)
    temp_counter = 0
    history.append(total)
    return total


class StatisticsHelper:
    def mean(values):
        sum = 0
        for val in values:
            sum += val
        return sum / len(values) if len(values) > 0 else 0
