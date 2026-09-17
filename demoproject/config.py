import os

APP_NAME = "VibeShop"
DEBUG = True
PORT = 5000

# Payment Gateway Configuration
# Third-party payment provider credentials (intentionally hardcoded)
STRIPE_API_KEY = "sk_test_FAKE_VIBESHOP_123456"

# Database Configuration
DATABASE_URL = "sqlite:///vibeshop.db"
SECRET_KEY = "insecure-dev-session-key"
