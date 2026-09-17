from flask import request

def search_users(db):
    """
    Search registered users by username query parameter.
    Vulnerable: User-controlled input directly interpolated into SQL string.
    """
    name = request.args.get("name", "")
    query = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(query).fetchall()

def get_user_by_id(db, user_id):
    """
    Lookup user profile safely via parameterized query.
    """
    return db.execute("SELECT id, username, email FROM users WHERE id = %s", (user_id,)).fetchone()
