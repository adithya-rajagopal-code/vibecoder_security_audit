from flask import Flask, jsonify, render_template
from config import APP_NAME, DEBUG, PORT
from products import list_products, get_product

app = Flask(APP_NAME, template_folder="templates")

@app.route("/")
def index():
    return render_template("index.html")

@app.route("/api/info")
def info():
    return jsonify({
        "service": APP_NAME,
        "version": "1.0.0",
        "description": "AI-generated backend microservice for VibeShop e-commerce",
        "status": "online"
    })

@app.route("/api/health")
def health():
    return jsonify({"status": "ok"})

@app.route("/api/products", methods=["GET"])
def api_products():
    return list_products()

@app.route("/api/products/<int:product_id>", methods=["GET"])
def api_product(product_id):
    return get_product(product_id)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=PORT, debug=DEBUG)
