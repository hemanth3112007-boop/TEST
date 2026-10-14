"""
Example 4: Clean, well-documented, PEP 8 compliant Python code.
"""

from typing import List, Optional


def calculate_average(numbers: List[float]) -> Optional[float]:
    """Calculate the arithmetic mean of a list of floating-point numbers.

    Args:
        numbers: A list of float or integer values.

    Returns:
        The average value, or None if the list is empty.
    """
    if not numbers:
        return None

    return sum(numbers) / len(numbers)


class BankAccount:
    """Represents a simple bank account with deposit and withdrawal operations."""

    def __init__(self, owner: str, initial_balance: float = 0.0) -> None:
        """Initialize a new bank account with owner and balance."""
        self.owner = owner
        self.balance = initial_balance

    def deposit(self, amount: float) -> float:
        """Deposit money into the account and return the new balance."""
        if amount <= 0:
            raise ValueError("Deposit amount must be positive.")
        self.balance += amount
        return self.balance
