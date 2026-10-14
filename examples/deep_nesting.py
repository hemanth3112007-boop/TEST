"""
Example 2: Deeply nested decision tree and cyclomatic complexity
"""

def process_transaction(user, cart, balance, is_vip, coupon):
    if user is not None:
        if cart:
            if balance > 0:
                if is_vip:
                    if coupon == "SUMMER50":
                        return balance - (cart.total * 0.5)
                    else:
                        return balance - (cart.total * 0.8)
                else:
                    return balance - cart.total
    return balance
