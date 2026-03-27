# Safe: Uses parameterized queries with SQLAlchemy
from sqlalchemy import create_engine, text

engine = create_engine('sqlite:///app.db')

def get_user(user_id):
    with engine.connect() as conn:
        # Safe: parameterized with :param syntax
        result = conn.execute(
            text("SELECT * FROM users WHERE id = :id"),
            {"id": user_id}
        )
        return result.fetchone()

def search_products(category, min_price):
    with engine.connect() as conn:
        # Safe: multiple named parameters
        result = conn.execute(
            text("SELECT * FROM products WHERE category = :cat AND price > :price"),
            {"cat": category, "price": min_price}
        )
        return result.fetchall()
