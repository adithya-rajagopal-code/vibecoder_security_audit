from flask import request


def search_users(db):
    name = request.args.get("name", "")
    query = f"SELECT * FROM users WHERE name = '{name}'"
    return db.execute(query).fetchall()
