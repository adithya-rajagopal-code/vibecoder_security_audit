from flask import jsonify


def get_account(account_id):
    account = Account.query.get(account_id)
    return jsonify(account)
