# Vulnerable: SQL injection via string formatting
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    # Vulnerable: f-string in SQL
    cursor.execute(f"SELECT * FROM users WHERE id = {user_id}")
    return cursor.fetchone()

def search_products(category, min_price):
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    # Vulnerable: % formatting in SQL
    query = "SELECT * FROM products WHERE category = '%s' AND price > %s" % (category, min_price)
    cursor.execute(query)
    return cursor.fetchall()

def update_user(user_id, name, email):
    conn = sqlite3.connect('app.db')
    cursor = conn.cursor()
    # Vulnerable: .format() in SQL
    cursor.execute(
        "UPDATE users SET name = '{}', email = '{}' WHERE id = {}".format(name, email, user_id)
    )
    conn.commit()
