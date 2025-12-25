# server.py
# server.py
from flask import Flask, request, jsonify, send_from_directory, render_template_string
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from werkzeug.utils import secure_filename
import uuid
from ai_routes import ai_bp  # استيراد Blueprint
import subprocess
from datetime import datetime


app = Flask(__name__)
CORS(app)
app.register_blueprint(ai_bp)

# ----- إعدادات أساسية -----
app.config['MAX_CONTENT_LENGTH'] = 2 * 1024 * 1024  # 2MB limit
app.config['UPLOAD_FOLDER'] = os.path.join(os.getcwd(), 'uploads')
app.config['ALLOWED_EXTENSIONS'] = {'jpeg', 'jpg', 'png', 'gif'}

if not os.path.exists(app.config['UPLOAD_FOLDER']):
    os.makedirs(app.config['UPLOAD_FOLDER'])

# ----- Helpers -----
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in app.config['ALLOWED_EXTENSIONS']

def save_image(file):
    if file and allowed_file(file.filename):
        filename = secure_filename(str(uuid.uuid4()) + os.path.splitext(file.filename)[1])
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(filepath)
        return f'/uploads/{filename}'
    return None

# ----- Routes for uploads -----
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# ----- Database connection -----
def get_db_connection():
    return psycopg2.connect(
        user="postgres",
        host="localhost",
        database="restaurant_db",
        password="sara",
        port=5432,
        cursor_factory=RealDictCursor
    )

# ------------------ API Meals ------------------
@app.route('/api/meals', methods=['GET'])
def get_meals():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("""
            SELECT m.*, c.category_name
            FROM meals m
            LEFT JOIN meal_categories c ON m.category_id = c.category_id
            ORDER BY meal_id DESC
        """)
        meals = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(meal) for meal in meals])
    except Exception as e:
        print(f"GET /api/meals: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/meals', methods=['POST'])
def add_meal():
    try:
        # استلام البيانات من الفورم
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        meal_time = request.form.get('meal_time')
        category_id = request.form.get('category_id')
        image = request.files.get('image')

        # تحقق من القيم المطلوبة
        if not name or not price or not category_id or not meal_time:
            return jsonify({"error": "All fields: name, price, category_id, meal_time are required"}), 400

        # تحويل السعر والـ category_id لأنهما يجب أن يكونا أرقام
        try:
            price_num = float(price)
        except ValueError:
            return jsonify({"error": "price must be a number"}), 400

        try:
            category_id = int(category_id)
        except ValueError:
            return jsonify({"error": "category_id must be an integer"}), 400

        # حفظ الصورة إذا أُرسلت
        image_url = save_image(image)

        # التحقق من وجود category_id في جدول meal_categories
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM meal_categories WHERE category_id=%s", (category_id,))
        category = cur.fetchone()
        if not category:
            cur.close()
            conn.close()
            return jsonify({"error": f"category_id {category_id} does not exist"}), 400

        # إدخال الوجبة
        cur.execute(
            "INSERT INTO meals (name, description, price, meal_time, category_id, image_url) "
            "VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
            (name, description, price_num, meal_time, category_id, image_url)
        )
        meal = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(meal)), 201

    except Exception as e:
        print(f"POST /api/meals: {e}")
        return jsonify({"error": "Server errorلاررلارىلار"}), 500

@app.route('/api/meals/<int:id>', methods=['PUT'])
def update_meal(id):
    try:
        name = request.form.get('name')
        description = request.form.get('description')
        price = request.form.get('price')
        meal_time = request.form.get('meal_time')
        category_id = request.form.get('category_id')
        image = request.files.get('image')

        if not name or not price or not category_id or not meal_time:
            return jsonify({"error": "name, price, category_id, meal_time are required"}), 400

        price_num = float(price)
        image_url = save_image(image) if image else None

        conn = get_db_connection()
        cur = conn.cursor()

        if image_url:
            cur.execute(
                "UPDATE meals SET name=%s, description=%s, price=%s, meal_time=%s, category_id=%s, image_url=%s "
                "WHERE meal_id=%s RETURNING *",
                (name, description, price_num, meal_time, category_id, image_url, id)
            )
        else:
            cur.execute(
                "UPDATE meals SET name=%s, description=%s, price=%s, meal_time=%s, category_id=%s "
                "WHERE meal_id=%s RETURNING *",
                (name, description, price_num, meal_time, category_id, id)
            )

        meal = cur.fetchone()
        if not meal:
            return jsonify({"error": "meal not found"}), 404
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(meal))
    except Exception as e:
        print(f"PUT /api/meals/{id}: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/meals/<int:id>', methods=['DELETE'])
def delete_meal(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM meals WHERE meal_id=%s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return '', 204
    except Exception as e:
        print(f"DELETE /api/meals/{id}: {e}")
        return jsonify({"error": "Server error"}), 500

# ------------------ API Meal Categories ------------------
@app.route('/api/meal-categories', methods=['GET'])
def get_categories():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM meal_categories ORDER BY category_name ASC")
        categories = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(cat) for cat in categories])
    except Exception as e:
        print(f"GET /api/meal-categories: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/meal-categories', methods=['POST'])
def add_category():
    try:
        data = request.get_json()
        name = data.get('category_name')
        if not name:
            return jsonify({"error": "category_name is required"}), 400
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("INSERT INTO meal_categories (category_name) VALUES (%s) RETURNING *", (name,))
        category = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(category)), 201
    except Exception as e:
        print(f"POST /api/meal-categories: {e}")
        return jsonify({"error": "Server error"}), 500
# ------------------ API Customers ------------------
@app.route('/api/customers', methods=['GET'])
def get_customers():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM customers ORDER BY customer_id DESC")
        customers = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(customer) for customer in customers])
    except Exception as e:
        print(f"GET /api/customers: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/customers', methods=['POST'])
def add_customer():
    try:
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name')
        email = data.get('email')
        phone = data.get('phone')
        address = data.get('address')
        username = data.get('username')
        password = data.get('password')

        if not first_name or not password:
            return jsonify({"error": "first_name and password are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO customers (first_name, last_name, email, phone, address, username, password) VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *",
            (first_name, last_name, email, phone, address, username, password)
        )
        customer = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(customer)), 201
    except Exception as e:
        print(f"POST /api/customers: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/customers/<int:id>/profile', methods=['POST'])
def update_profile(id):
 try:
     conn = get_db_connection()
     cur = conn.cursor()

     first_name = request.form.get('first_name')
     phone = request.form.get('phone')
     address = request.form.get('address')
     health = request.form.get('health_condition')

     profile_image = request.files.get('profile_image')
     image_filename = None

     if profile_image and allowed_file(profile_image.filename):
        filename = secure_filename(profile_image.filename)
        profile_image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
        image_filename = filename

     updates = []
     values = []

     if first_name: updates.append("first_name=%s"); values.append(first_name)
     if phone: updates.append("phone=%s"); values.append(phone)
     if address: updates.append("address=%s"); values.append(address)
     if health: updates.append("health_condition=%s"); values.append(health)
     if image_filename: updates.append("profile_image_url=%s"); values.append(image_filename)

     values.append(id)
     cur.execute(f"UPDATE customers SET {', '.join(updates)} WHERE customer_id=%s RETURNING *", tuple(values))
     updated_user = cur.fetchone()
     conn.commit()
     cur.close()
     conn.close()

     return jsonify(dict(updated_user))
 except Exception as e:
        print(f"PUT /api/customers/{id}: {e}")
        return jsonify({"error": "Server error"}), 500


@app.route('/api/customers/<int:id>', methods=['DELETE'])
def delete_customer(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM customers WHERE customer_id=%s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return '', 204
    except Exception as e:
        print(f"DELETE /api/customers/{id}: {e}")
        return jsonify({"error": "Server error"}), 500

# ------------------ API Login ------------------
@app.route('/api/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        first_name = data.get('first_name')
        last_name = data.get('last_name') or ''
        email = data.get('email')
        username = data.get('username') or ''
        phone = data.get('phone') or ''
        address = data.get('address') or ''
        password = data.get('password')
        age = data.get('age') or None
        health_condition = data.get('health') or ''

        if not first_name or not email or not password:
            return jsonify({"error": "first_name, email, and password are required"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM customers WHERE email=%s", (email,))
        if cur.fetchone():
            return jsonify({"error": "Email already registered"}), 400

        cur.execute(
            """INSERT INTO customers 
               (first_name, last_name, phone, address, email, username, password, age, health_condition) 
               VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING *""",
            (first_name, last_name, phone, address, email, username, password, age, health_condition)
        )
        customer = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"customer": dict(customer)}), 201
    except Exception as e:
        print(f"POST /api/register: {e}")
        return jsonify({"error": "Server error"}), 500

# ------------------ API Login ------------------
@app.route('/api/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM customers WHERE email=%s AND password=%s", (email, password))
        customer = cur.fetchone()
        cur.close()
        conn.close()

        if not customer:
            return jsonify({"error": "Invalid credentials"}), 401

        return jsonify({"message": "Login successful", "customer": dict(customer)})
    except Exception as e:
        print(f"POST /api/login: {e}")
        return jsonify({"error": "Server error"}), 500



# ------------------ API Orders ------------------
@app.route('/api/orders', methods=['GET'])
def get_orders():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        query = """
            SELECT
                o.order_id,
                o.customer_id,
                c.first_name,
                c.last_name,
                o.meal_id,
                m.name AS meal_name,
                o.quantity,
                o.price,
                o.status,
                o.order_type,
                o.address,
                o.table_id,
                t.table_number,
                o.reservation_time,
                o.order_datetime
            FROM orders o
            JOIN customers c ON o.customer_id = c.customer_id
            JOIN meals m ON o.meal_id = m.meal_id
            LEFT JOIN tables t ON o.table_id = t.table_id
            ORDER BY o.order_datetime DESC
        """
        cur.execute(query)
        rows = cur.fetchall()
        cur.close()
        conn.close()

        orders = []
        for r in rows:
            orders.append({
                "order_id": r["order_id"],
                "customer_name": f"{r['first_name']} {r['last_name']}",
                "meal_name": r["meal_name"],
                "quantity": r["quantity"],
                "price": float(r["price"]),
                "total": float(r["price"]) * r["quantity"],
                "status": r["status"],
                "order_type": r["order_type"],
                "address": r["address"],
                "table_number": r["table_number"],
                "reservation_time": r["reservation_time"].isoformat() if r["reservation_time"] else None,
                "order_datetime": r["order_datetime"].isoformat()
            })

        return jsonify(orders)

    except Exception as e:
        print("GET /api/orders:", e)
        return jsonify({"error": "Server error"}), 500


@app.route('/api/orders', methods=['POST'])
def add_order():
    try:
        data = request.get_json()

        customer_id = int(data["customer_id"])
        meal_id = int(data["meal_id"])
        quantity = int(data.get("quantity", 1))
        price = float(data["price"])
        status = data.get("status", "pending")
        order_type = data.get("order_type", "delivery")

        address = data.get("address")
        table_id = data.get("table_id")
        reservation_time = data.get("reservation_time")

        if reservation_time:
                reservation_time = datetime.fromisoformat(
                reservation_time.replace("Z", "")
           )

        # تحقق ذكي
        if order_type == "delivery" and not address:
            return jsonify({"error": "Address required for delivery"}), 400

        if order_type == "dinein" and (not table_id or not reservation_time):
            return jsonify({"error": "Table & reservation time required for dine-in"}), 400

        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            INSERT INTO orders
            (customer_id, meal_id, quantity, price, status, order_type, address, table_id, reservation_time)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING *
        """, (
            customer_id,
            meal_id,
            quantity,
            price,
            status,
            order_type,
            address,
            table_id,
            reservation_time
        ))

        order = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        return jsonify(dict(order)), 201

    except Exception as e:
        print("POST /api/orders:", e)
        return jsonify({"error": "Server error"}), 500

@app.route('/api/orders/<int:id>', methods=['PUT'])
def update_order(id):
    try:
        data = request.get_json()
        updates = {}
        if 'order_type' in data:
               updates['order_type'] = data['order_type']
        if 'address' in data:
                updates['address'] = data['address']
        if 'table_id' in data:
                updates['table_id'] = data['table_id']
        if 'reservation_time' in data and data['reservation_time']:
                    updates['reservation_time'] = datetime.fromisoformat(
                    data['reservation_time'].replace("Z", "")
         )

        if 'status' in data:
                updates['status'] = data['status']


        if not updates:
            return jsonify({"error": "no updatable fields provided"}), 400

        set_clause = ', '.join([f"{k}=%s" for k in updates.keys()])
        values = list(updates.values()) + [id]

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute(f"UPDATE orders SET {set_clause} WHERE order_id=%s RETURNING *", values)
        order = cur.fetchone()
        if not order:
            return jsonify({"error": "order not found"}), 404
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(order))
    except Exception as e:
        print(f"PUT /api/orders/{id}: {e}")
        return jsonify({"error": "Server error"}), 500

@app.route('/api/orders/<int:id>', methods=['DELETE'])
def delete_order(id):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("DELETE FROM orders WHERE order_id=%s", (id,))
        conn.commit()
        cur.close()
        conn.close()
        return '', 204
    except Exception as e:
        print(f"DELETE /api/orders/{id}: {e}")
        return jsonify({"error": "Server error"}), 500

# ------------------ API Tables ------------------
@app.route('/api/tables', methods=['GET'])
def get_tables():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM tables ORDER BY table_id ASC")
        tables = cur.fetchall()
        cur.close()
        conn.close()
        return jsonify([dict(table) for table in tables])
    except Exception as e:
        print(f"GET /api/tables: {e}")
        return jsonify({"error": "Server error"}), 500
@app.route('/api/tables', methods=['POST'])
def add_table():
    data = request.get_json()
    table_number = data.get('table_number')
    capacity = data.get('capacity')
    # تحقق من الحقول
    if not table_number or not capacity:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("INSERT INTO tables (table_number, capacity, status) VALUES (%s, %s, 'Available') RETURNING *",
                (table_number, capacity))
    table = cur.fetchone()
    conn.commit()
    cur.close()
    conn.close()
    return jsonify(dict(table)), 201

# ------------------ API Reservations ------------------


# ------------------ Customers with Orders ------------------
@app.route('/api/customers-with-orders', methods=['GET'])
def get_customers_with_orders():
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("SELECT * FROM customers ORDER BY customer_id DESC")
        customers = cur.fetchall()

        for customer in customers:
            cur.execute(
                "SELECT o.order_id, m.name AS meal, o.price, o.quantity, o.order_datetime "
                "FROM orders o LEFT JOIN meals m ON o.meal_id = m.meal_id "
                "WHERE o.customer_id = %s ORDER BY o.order_datetime DESC",
                (customer['customer_id'],)
            )
            orders = cur.fetchall()
            customer['orders'] = [{
                'meal': o['meal'],
                'price': float(o['price']) if o['price'] else None,
                'quantity': int(o['quantity']),
                'order_date': o['order_datetime'].date().isoformat() if o['order_datetime'] else None,
                'order_time': o['order_datetime'].time().strftime('%H:%M') if o['order_datetime'] else None
            } for o in orders]

        cur.close()
        conn.close()
        return jsonify([dict(customer) for customer in customers])
    except Exception as e:
        print(f"GET /api/customers-with-orders: {e}")
        return jsonify({"error": "Server error"}), 500
@app.route('/api/tables/<int:table_id>/status', methods=['PUT'])
def update_table_status(table_id):
    try:
        data = request.get_json()
        new_status = data.get('status')
        if new_status not in ['Available', 'Reserved']:
            return jsonify({"error": "Invalid status"}), 400

        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute("UPDATE tables SET status=%s WHERE table_id=%s", (new_status, table_id))
        conn.commit()
        cur.close()
        conn.close()
        return jsonify({"table_id": table_id, "status": new_status})
    except Exception as e:
        print(f"PUT /api/tables/{table_id}/status: {e}")
        return jsonify({"error": "Server error"}), 500
    
@app.route('/api/available-tables', methods=['GET'])
def get_available_tables():
    try:
        conn = get_db_connection()
        cur = conn.cursor()

        cur.execute("""
            SELECT table_id, table_number, capacity
            FROM tables
            WHERE status = 'Available'
            ORDER BY table_number ASC
        """)

        tables = cur.fetchall()
        cur.close()
        conn.close()

        return jsonify([dict(t) for t in tables])

    except Exception as e:
        print(f"GET /api/available-tables: {e}")
        return jsonify({"error": "Server error"}), 500
@app.route('/api/reservations', methods=['POST'])
def reserve_table():
    data = request.get_json()

    customer_id = data.get('customer_id')
    table_id = data.get('table_id')
    reservation_time = data.get('reservation_time')

    if not reservation_time:
        reservation_time = datetime.now()

    if not customer_id or not table_id:
        return jsonify({"error": "Missing fields"}), 400

    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # تحقق أن الطاولة متاحة
    cur.execute("SELECT status FROM tables WHERE table_id=%s", (table_id,))
    table = cur.fetchone()

    if not table or table['status'] != 'Available':
        return jsonify({"error": "Table not available"}), 400

    # إدخال الحجز
    cur.execute("""
        INSERT INTO reservations (customer_id, table_id, reservation_datetime)
        VALUES (%s, %s, %s)
        RETURNING *
    """, (customer_id, table_id, reservation_time))

    reservation = cur.fetchone()

    # تغيير حالة الطاولة
    cur.execute("""
        UPDATE tables SET status='Reserved'
        WHERE table_id=%s
    """, (table_id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify(reservation), 201
# ----- Run server -----

# ----- Run server -----
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
try:
    conn = get_db_connection()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM meals;")
    result = cur.fetchone()
    print("✅ Meals in DB:", result)
    cur.close()
    conn.close()
except Exception as e:
    print("❌ DB connection failed:", e)

    app.run(host='0.0.0.0', port=port, debug=True)