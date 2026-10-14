"""
Example 3: Anti-patterns including bare except, None comparison, and dead code
"""

def fetch_record(db_id):
    result = None
    try:
        if db_id == None:
            return None
        result = {"id": db_id, "active": True}
        return result
        print("Record retrieved successfully")
    except:
        return {"error": "fetch failed"}
