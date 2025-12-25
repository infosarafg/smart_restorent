import pandas as pd
from sklearn.preprocessing import OneHotEncoder
from sklearn.metrics.pairwise import cosine_similarity

# 1. بيانات الوجبات
meals = pd.DataFrame([
    {'meal_id': 1, 'category': 'تقليدية', 'meal_time': 'Breakfast'},
    {'meal_id': 2, 'category': 'سريعة', 'meal_time': 'Lunch'},
    {'meal_id': 3, 'category': 'صحية', 'meal_time': 'Dinner'},
    {'meal_id': 4, 'category': 'مشروبات', 'meal_time': 'Always'}
])

# 2. بيانات الطلبات
orders = pd.DataFrame([
    {'customer_id': 1, 'meal_id': 1, 'quantity': 2},
    {'customer_id': 2, 'meal_id': 3, 'quantity': 1},
])

# 3. تحويل خصائص الوجبات إلى one-hot encoding
encoder = OneHotEncoder()
meal_features = encoder.fit_transform(meals[['category', 'meal_time']])

# 4. دالة اقتراح وجبات لزبون معين
def recommend_meals(customer_id, top_n=2):
    # وجبات الزبون السابقة
    customer_orders = orders[orders['customer_id'] == customer_id]['meal_id'].tolist()
    
    # وجبات غير مطلوبة بعد
    candidate_meals = meals[~meals['meal_id'].isin(customer_orders)]
    
    # Similarity بين كل وجبة سابقة للزبون والوجبات المرشحة
    if not customer_orders:
        return candidate_meals['meal_id'].tolist()[:top_n]  # إذا لا توجد طلبات، اقتراح أول وجبتين
    
    sims = []
    for m_id in candidate_meals['meal_id']:
        sim_scores = []
        for c_id in customer_orders:
            sim = cosine_similarity(meal_features[m_id-1], meal_features[c_id-1])
            sim_scores.append(sim[0][0])
        sims.append((m_id, sum(sim_scores)/len(sim_scores)))
    
    sims_sorted = sorted(sims, key=lambda x: x[1], reverse=True)
    recommended_ids = [m[0] for m in sims_sorted[:top_n]]
    return recommended_ids

print("Recommended for customer 1:", recommend_meals(1))
print("Recommended for customer 2:", recommend_meals(2))
