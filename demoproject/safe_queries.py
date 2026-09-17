def safe_search(db, name):
    """
    Safely search users using parameterized SQL queries.
    """
    query = "SELECT id, username, email FROM users WHERE name = %s"
    return db.execute(query, (name,)).fetchall()

def safe_list_orders(db, user_id):
    """
    Safely fetch orders filtered by authenticated user_id.
    """
    query = "SELECT id, total, status FROM orders WHERE user_id = :uid"
    return db.execute(query, {"uid": user_id}).fetchall()
