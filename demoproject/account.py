from flask import Flask, jsonify, request

app = Flask(__name__)

class Order:
    query = None

@app.get("/orders/<int:order_id>")
def get_order(order_id):
    """
    Retrieve customer order by order ID.
    Vulnerable: Retrieves order by user-supplied identifier without an ownership check.
    """
    order = Order.query.get(order_id)
    return jsonify(order)

def safe_get_order(order_id, current_user):
    """
    Retrieve customer order with explicit ownership authorization check.
    """
    order = Order.query.get(order_id)
    if order.user_id != current_user.id:
        raise PermissionError("Access denied: User is not authorized to view this order")
    return jsonify(order)
