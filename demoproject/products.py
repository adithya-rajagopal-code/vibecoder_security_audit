from flask import jsonify

PRODUCTS = [
    {"id": 1, "name": "Mechanical Keyboard Pro", "price": 129.99, "stock": 25},
    {"id": 2, "name": "Ergonomic Optical Mouse", "price": 59.99, "stock": 40},
    {"id": 3, "name": "Active Noise-Cancelling Headphones", "price": 249.99, "stock": 15},
    {"id": 4, "name": "UltraWide Gaming Monitor 34-inch", "price": 499.99, "stock": 8},
]

def list_products():
    """
    Return list of all available catalog products.
    """
    return jsonify({"products": PRODUCTS, "count": len(PRODUCTS)})

def get_product(product_id):
    """
    Lookup a product by ID from catalog.
    """
    product = next((p for p in PRODUCTS if p["id"] == product_id), None)
    if not product:
        return jsonify({"error": "Product not found"}), 404
    return jsonify(product)
