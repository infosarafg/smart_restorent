import pandas as pd
import numpy as np
from sklearn.preprocessing import OneHotEncoder, MinMaxScaler
from sklearn.cluster import KMeans
import psycopg2

# -----------------------------
# 1️⃣ الاتصال بقاعدة البيانات
# -----------------------------
conn = psycopg2.connect(
    host="localhost",
    database="restaurant_db",
    user="postgres",
    password="yourpassword"
)

customers = pd.read_sql("SELECT * FROM customers", conn)
orders = pd.read_sql("SELECT * FROM orders", conn)
meals = pd.read_sql("SELECT * FROM meals", conn)
meal_categories = pd.read_sql("SELECT * FROM meal_categories", conn)

conn.close()

# -----------------------------
# 2️⃣ حساب الفئة المفضلة لكل زبون
# -----------------------------
def favorite_category(customer_id):
    past_orders = orders[orders['customer_id'] == customer_id]
    if past_orders.empty:
        return 'Unknown'
    past_meals = meals[meals['meal_id'].isin(past_orders['meal_id'])]
    if past_meals.empty:
        return 'Unknown'
    return past_meals['category_id'].mode()[0]

customers['fav_category'] = customers['customer_id'].apply(favorite_category)

# -----------------------------
# 3️⃣ تجهيز ميزات الزبون للتجميع
# -----------------------------
# ترميز الحالة الصحية والفئة المفضلة
encoder = OneHotEncoder()
encoded_features = encoder.fit_transform(customers[['health_condition','fav_category']].astype(str)).toarray()

# تطبيع العمر
scaler = MinMaxScaler()
age_scaled = scaler.fit_transform(customers[['age']].fillna(customers['age'].median()))

# دمج الميزات
X = np.hstack([age_scaled, encoded_features])

# -----------------------------
# 4️⃣ تطبيق K-Means لتجميع الزبائن
# -----------------------------
kmeans = KMeans(n_clusters=4, random_state=42)
customers['cluster'] = kmeans.fit_predict(X)

# -----------------------------
# 5️⃣ دالة لفحص سلامة الوجبة حسب الحالة الصحية
# -----------------------------
def is_safe(meal_name, health_condition):
    diabetic_risky = ["كسرة بالزبدة والعسل","عصير طبيعي"]
    hypertension_risky = ["برغر لحم","بيتزا مارجريتا"]
    
    if health_condition=='Diabetic' and meal_name in diabetic_risky:
        return False
    if health_condition=='Hypertension' and meal_name in hypertension_risky:
        return False
    return True

# -----------------------------
# 6️⃣ دالة التوصية للزبون بناءً على المجموعة
# -----------------------------
def recommend_meals(customer_id, top_n=5):
    customer = customers.loc[customers['customer_id']==customer_id].iloc[0]
    cluster_id = customer['cluster']
    
    # كل الزبائن في نفس المجموعة
    cluster_customers = customers[customers['cluster']==cluster_id]['customer_id'].tolist()
    
    # أكثر الوجبات طلبًا في المجموعة
    cluster_orders = orders[orders['customer_id'].isin(cluster_customers)]
    popular_meals_ids = cluster_orders['meal_id'].value_counts().index.tolist()
    
    # استبعاد الوجبات غير الآمنة
    safe_meals_ids = [m for m in popular_meals_ids 
                      if is_safe(meals.loc[meals['meal_id']==m,'name'].values[0], customer['health_condition'])]
    
    # اقتراح أفضل الوجبات
    recommended = meals[meals['meal_id'].isin(safe_meals_ids)].head(top_n)
    
    return recommended[['name','category_id','meal_time','price','description']]

# -----------------------------
# 7️⃣ تجربة التوصية
# -----------------------------
customer_id = 1  # مثال: Sara Azouz
recommendations = recommend_meals(customer_id)
print(recommendations)
