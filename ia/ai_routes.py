from flask import Blueprint, jsonify
import pandas as pd
import os
from sqlalchemy import create_engine

ai_bp = Blueprint('ai', __name__, url_prefix='/api/ai')

# ==========================
# إعداد الاتصال بقاعدة البيانات
# ==========================
DB_USER = os.environ.get("DB_USER")
DB_PASS = os.environ.get("DB_PASSWORD")
DB_HOST = os.environ.get("DB_HOST")
DB_NAME = os.environ.get("DB_NAME")

engine = create_engine(
    f'postgresql+psycopg2://{DB_USER}:{DB_PASS}@{DB_HOST}/{DB_NAME}'
)

# ==========================
# تحميل البيانات مرة واحدة
# ==========================
def load_data():
    try:
        customers = pd.read_sql("SELECT * FROM customers", engine)
        meals = pd.read_sql("SELECT * FROM meals", engine)

        # تعويض القيم الفارغة
        customers['age'] = customers['age'].fillna(customers['age'].median())
        customers['health_condition'] = customers['health_condition'].fillna('None')

        # حساب الفئة المفضلة لكل عميل
        # ملاحظة: لتسريع العملية نتجنب تحميل كل Orders
        # فقط نفترض أن fav_category مخزنة أو نضع 'Unknown'
        customers['fav_category'] = 'Unknown'

        return customers, meals
    except Exception as e:
        print("Error loading data:", e)
        return pd.DataFrame(), pd.DataFrame()

customers, meals = load_data()

# ==========================
# قواعد الصحة
# ==========================
HEALTH_RULES = {
    "Diabetic": {"bad": ["سكر", "عسل", "sweet", "cake"], "good": ["مشوي", "سلطة", "بدون سكر"]},
    "Hypertension": {"bad": ["ملح", "fried", "مقلي"], "good": ["steam", "مشوي", "low salt"]}
}

def health_score(description, health_condition):
    if not description or health_condition not in HEALTH_RULES:
        return 1.0
    desc = description.lower()
    score = 1.0
    for bad in HEALTH_RULES[health_condition]["bad"]:
        if bad in desc: score -= 0.7
    for good in HEALTH_RULES[health_condition]["good"]:
        if good in desc: score += 0.4
    return max(score, 0)

def description_score(description):
    if not description: return 0.5
    healthy_words = ["fresh", "طبيعي", "سلطة", "مشوي"]
    score = sum(0.2 for w in healthy_words if w in description.lower())
    return min(score, 1)

def category_score(meal_category, fav_category):
    return 1.0 if meal_category == fav_category else 0.4

def age_score(age, meal_time):
    if age < 18 and meal_time == "LateNight": return 0.2
    if age > 50 and meal_time == "Heavy": return 0.4
    return 1.0

def price_score(price):
    if price < 500: return 1.0
    if price < 1000: return 0.7
    return 0.4

def recommendation_score(customer, meal):
    hs = health_score(meal['description'], customer['health_condition'])
    ds = description_score(meal['description'])
    cs = category_score(meal['category_id'], customer['fav_category'])
    ag = age_score(customer['age'], meal['meal_time'])
    ps = price_score(meal['price'])
    final_score = hs*0.4 + ds*0.2 + cs*0.15 + ag*0.15 + ps*0.1
    return round(final_score, 3)

# ==========================
# Route التوصية
# ==========================
@ai_bp.route('/recommend/<int:customer_id>')
def recommend(customer_id):
    try:
        if customer_id not in customers['customer_id'].values:
            return jsonify({"error": "Customer not found"}), 404

        customer = customers[customers['customer_id'] == customer_id].iloc[0]

        meals_copy = meals.copy()
        meals_copy['score'] = meals_copy.apply(
            lambda m: recommendation_score(customer, m),
            axis=1
        )

        meals_copy = meals_copy.sort_values(by='score', ascending=False)
        result = meals_copy.head(5)[
            ['meal_id','name','price','meal_time','description','image_url','score']
        ]
        return jsonify(result.to_dict(orient='records'))
    except Exception as e:
        print("Error in /recommend:", e)
        return jsonify({"error": "Server error"}), 500
