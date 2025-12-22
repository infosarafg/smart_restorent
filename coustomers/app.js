// ---------- app.js (Final & Fixed) ----------

// Default API URLs
const API_URL = "https://smart-restorent-1.onrender.com/api";
const UPLOADS_URL = "https://smart-restorent-1.onrender.com/uploads";

// ---------- Shortcuts ----------
const q = sel => document.querySelector(sel);
const qAll = sel => Array.from(document.querySelectorAll(sel));
let cart = [];
let selectedMealForOrder = null;
// ---------- State ----------
let state = {
    meals: [],
    categories: [],
    orders: [],
    currentCategory: 'all',
    currentMealTime: 'all',
    searchKeyword: ''
};

// ---------- Utils ----------
function normalizeImageUrl(raw) {
    if (!raw) return null;
    if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
    const name = raw.split('/').pop();
    return `${UPLOADS_URL}/${name}`;
}
const profileInput = q('#setProfileImage');
const profilePreview = q('#profilePreview');

profileInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => profilePreview.src = ev.target.result;
        reader.readAsDataURL(file);
    }
});

function showAlert(msg) { alert(msg); }

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

// ---------- API calls ----------
async function apiGet(path) {
    const res = await fetch(`${API_URL}${path}`);
    if (!res.ok) throw new Error(`API GET ${path} failed (${res.status})`);
    return res.json();
}

async function apiPost(path, body, headers = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers,
        body
    });
    const contentType = res.headers.get('content-type') || '';
    const data = contentType.includes('application/json') ? await res.json() : null;
    if (!res.ok) throw data || new Error(`API POST ${path} failed (${res.status})`);
    return data;
}
async function loadAvailableTables() {
    const tableSelect = document.getElementById('tableSelect');
    tableSelect.innerHTML = '<option>Loading tables...</option>';

    try {
        const res = await fetch(`${API_URL}/available-tables`);
        const tables = await res.json();

        tableSelect.innerHTML = '';

        if (!Array.isArray(tables) || tables.length === 0) {
            tableSelect.innerHTML = '<option>No available tables</option>';
            return;
        }

        tables.forEach(t => {
            const opt = document.createElement('option');
            opt.value = t.table_id;
            opt.textContent = `Table ${t.table_number} — ${t.capacity} chairs`;
            tableSelect.appendChild(opt);
        });

    } catch (e) {
        console.error(e);
        tableSelect.innerHTML = '<option>Error loading tables</option>';
    }
}


  

// فتح المودال للطلب
function openOrderModal(meal) {
    selectedMealForOrder = meal;
    document.getElementById('orderModal').classList.remove('hidden');

    const orderType = document.getElementById('orderType');
    toggleOrderTypeFields(orderType.value);

    orderType.onchange = (e) => toggleOrderTypeFields(e.target.value);
}

// تبديل الحقول بناءً على نوع الطلب
function toggleOrderTypeFields(type) {
    document.getElementById('tableSelectGroup').classList.toggle('hidden', type === 'delivery');
    document.getElementById('reservationTimeGroup').classList.toggle('hidden', type === 'delivery');
    document.getElementById('addressGroup').classList.toggle('hidden', type === 'dinein');
}

// إغلاق المودال
function closeOrderModal() {
    document.getElementById('orderModal').classList.add('hidden');
}

// الضغط على زر التأكيد
document.getElementById('confirmOrderBtn').addEventListener('click', () => {
    const type = document.getElementById('orderType').value;
    const quantity = parseInt(document.getElementById('orderQuantityModal').value) || 1;
    const table_id = document.getElementById('tableSelect').value;
    const address = document.getElementById('deliveryAddress').value.trim();
    const reservationTime = document.getElementById('reservationTime').value;

    // التحقق من وقت الحجز
    if (type === 'dinein') {
        if (!reservationTime) {
            alert('يرجى اختيار وقت الحجز');
            return;
        }
        const now = new Date();
        const selectedTime = new Date(reservationTime);
        if (selectedTime < now) {
            alert('⚠️ وقت الحجز قد مضى، يرجى اختيار وقت صالح');
            return;
        }
    }

    // إضافة الطلب إلى السلة
    cart.push({
        meal_id: selectedMealForOrder.meal_id,
        meal_name: selectedMealForOrder.name,
        price: selectedMealForOrder.price,
        quantity,
        type,
        table_id: type === 'dinein' ? table_id : null,
        address: type === 'delivery' ? address : null,
        reservationTime: type === 'dinein' ? reservationTime : null
    });

    renderCart();
    closeOrderModal();
});

// عرض الطلبات في الصفحة
function renderCart() {
    const ul = document.getElementById('ordersList');
    ul.innerHTML = '';

    cart.forEach((o, index) => {
        ul.innerHTML += `
            <li>
                <strong>${o.meal_name}</strong> × ${o.quantity} <br>
                ${o.type === 'dinein'
                    ? `Table ${o.table_id} — الحجز عند ${new Date(o.reservationTime).toLocaleString()}`
                    : `Delivery to ${o.address}`}
                <br>
                ${o.price * o.quantity} DZD
                <button onclick="removeFromCart(${index})">❌</button>
            </li>
        `;
    });

    document.getElementById('totalOrders').textContent = cart.length;
}

// إزالة عنصر من السلة
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}





// ---------- Loaders ----------
async function loadCategories() {
    try {
        const cats = await apiGet('/meal-categories');
        state.categories = Array.isArray(cats) ? cats : [];
        renderCategoryFilters();
        fillCategorySelects();
    } catch (e) {
        console.error('loadCategories:', e);
        state.categories = [];
    }
}
function renderCart() {
    const ul = q('#ordersList');
    ul.innerHTML = '';

    cart.forEach((o, index) => {
        ul.innerHTML += `
            <li>
                <strong>${o.meal_name}</strong> × ${o.quantity}
                <br>
                ${o.type === 'dinein'
                    ? `Table ${o.table_id}`
                    : `Delivery to ${o.address}`}
                <br>
                ${o.price * o.quantity} DZD
                <button onclick="removeFromCart(${index})">❌</button>
            </li>
        `;
    });

    q('#totalOrders').textContent = cart.length;
}

async function loadMeals() {
    try {
        const mealsRaw = await apiGet('/meals');
        state.meals = (Array.isArray(mealsRaw) ? mealsRaw : []).map(m => ({
            ...m,
            image_url: normalizeImageUrl(m.image_url || m.image || null)
        }));
        renderMeals();
        fillOrderMealSelect();
    } catch (e) {
        console.error('loadMeals:', e);
        state.meals = [];
    }
}

async function loadOrders() {
    try {
        const orders = await apiGet('/orders');
        state.orders = Array.isArray(orders) ? orders : [];
        renderOrders();
    } catch (e) {
        console.error('loadOrders:', e);
        state.orders = [];
    }
}

// ---------- Render Functions ----------
function renderCategoryFilters() {
    const container = q('.category-buttons');
    if (!container) return;
    container.innerHTML = '';

    const allBtn = document.createElement('button');
    allBtn.className = state.currentCategory === 'all' ? 'active' : '';
    allBtn.textContent = 'All';
    allBtn.onclick = () => setCategory('all');
    container.appendChild(allBtn);

    state.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.textContent = cat.category_name;
        btn.dataset.categoryId = String(cat.category_id);
        btn.className = (state.currentCategory === String(cat.category_id)) ? 'active' : '';
        btn.onclick = () => setCategory(String(cat.category_id));
        container.appendChild(btn);
    });
}

function fillCategorySelects() {
    const sel = q('#categorySelect');
    if (!sel) return;
    sel.innerHTML = `<option value="">Select category</option>`;
    state.categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.category_id;
        opt.textContent = c.category_name;
        sel.appendChild(opt);
    });
}

function fillOrderMealSelect() {
    const sel = q('#orderMeal');
    if (!sel) return;
    sel.innerHTML = '<option value="">Select meal</option>';
    state.meals.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.meal_id;
        opt.textContent = `${m.name} - ${m.price} DZD`;
        sel.appendChild(opt);
    });
}

function getFilteredMeals() {
    const keyword = state.searchKeyword.trim().toLowerCase();
    return state.meals.filter(m => {
        const categoryMatch = state.currentCategory === 'all' || String(m.category_id) === String(state.currentCategory);
        const timeMatch = state.currentMealTime === 'all' || (m.meal_time && String(m.meal_time) === String(state.currentMealTime));
        const searchMatch = !keyword || (m.name && m.name.toLowerCase().includes(keyword)) || (m.description && m.description.toLowerCase().includes(keyword));
        return categoryMatch && timeMatch && searchMatch;
    });
}

function renderMeals() {
    const container = q('#menuGrid');
    if (!container) return;

    const list = getFilteredMeals();
    container.innerHTML = '';

    if (list.length === 0) {
        container.innerHTML = `<div class="no-results">No meals found.</div>`;
        return;
    }

    list.forEach(m => {
        const div = document.createElement('div');
        div.className = 'item card';
        div.innerHTML = `
            <div class="card-image" style="height:180px;overflow:hidden;border-radius:8px;">
                <img src="${m.image_url || 'placeholder.png'}" alt="${escapeHtml(m.name)}" style="width:100%;height:100%;object-fit:cover;">
            </div>
            <div class="card-body" style="padding:10px;">
                <h3 style="margin:4px 0 6px 0;">${escapeHtml(m.name)}</h3>
                <div style="font-size:14px;color:var(--muted)">${escapeHtml(m.meal_time || '')} ${m.category_name ? '— ' + escapeHtml(m.category_name) : ''}</div>
                <p style="margin:8px 0;font-weight:700;">${m.price} DZD</p>
                <p class="meal-description" style="display:none;color:#555;font-size:13px;margin-top:6px;">${escapeHtml(m.description || 'No description available.')}</p>
                <div style="display:flex;gap:8px;justify-content:center;margin-top:10px;">
                         <button class="btn small" data-meal-id="${m.meal_id}" onclick="toggleDescription(this)">View Description</button>
                         <button class="btn small" onclick='openOrderModal(${JSON.stringify(m)})'>
                                Add to Order
                           </button>

                 </div>
            </div>
        `;
        container.appendChild(div);
    });
}




// ---------- Order Functions ----------
async function addOrder(mealId, mealName, price, quantity = 1, notes = '') {
    const loggedUser = JSON.parse(localStorage.getItem('loggedUser') || '{}');
    const customer_id = loggedUser.customer_id || 1;

    const orderData = {
        customer_id,
        meal_id: mealId,
        quantity,
        price: Number(price) * quantity,
        status: 'pending',
        notes
    };

    try {
        await apiPost('/orders', JSON.stringify(orderData), { 'Content-Type': 'application/json' });
        showAlert('Order added to cart successfully');
        await loadOrders();
    } catch (e) {
        console.error('addOrder:', e);
        showAlert('Error adding order');
    }
}

// ---------- UI Functions ----------
function toggleDescription(btn) {
    const desc = btn.closest('.item')?.querySelector('.meal-description');
    if (!desc) return;
    const isHidden = desc.style.display === 'none' || getComputedStyle(desc).display === 'none';
    desc.style.display = isHidden ? 'block' : 'none';
    btn.textContent = isHidden ? 'Hide Description' : 'View Description';
}

function toggleOrderForm(show = true) {
    const form = document.getElementById('orderForm');
    if (!form) return;
    form.style.display = show ? 'block' : 'none';
}
window.toggleOrderForm = toggleOrderForm;

async function showOrderForm() {
    await loadMeals();
    toggleOrderForm(true);
}
window.showOrderForm = showOrderForm;

// ---------- Filters ----------
function setCategory(categoryId) {
    state.currentCategory = categoryId;
    const btns = qAll('.category-buttons button');
    btns.forEach(b => b.classList.toggle('active', (b.dataset.categoryId === categoryId || (categoryId === 'all' && !b.dataset.categoryId))));
    renderMeals();
}

function setMealTime(mealTime) {
    state.currentMealTime = mealTime;
    const btns = qAll('.sub-buttons button');
    btns.forEach(b => b.classList.toggle('active', b.dataset.mealTime === mealTime || (mealTime === 'all' && !b.dataset.mealTime)));
    renderMeals();
}

function onSearchInput(e) {
    state.searchKeyword = (e.target.value || '').trim();
    renderMeals();
}

// ---------- Login / Register / Logout ----------
async function loginUser() {
    const email = q('#loginEmail')?.value?.trim();
    const password = q('#loginPassword')?.value?.trim();
    const msg = q('#loginMessage');
    if (!email || !password) { if (msg) msg.textContent = "Please fill both fields."; return; }

    try {
        const data = await apiPost('/login', JSON.stringify({ email, password }), { 'Content-Type': 'application/json' });
        const user = data.customer || data;
        localStorage.setItem('loggedUser', JSON.stringify(user));
        if (msg) msg.textContent = "Login successful!";
        updateUIForLoggedUser();
        showSection('menu');
        loadAISuggestions();
    } catch (e) {
        console.error('loginUser:', e);
        if (msg) msg.textContent = (e && e.error) ? e.error : 'Login failed';
    }
}

async function registerUser() {
    const first_name = q('#regFullName')?.value?.trim();
    const last_name = q('#regUsername')?.value?.trim() || '';
    const email = q('#regEmail')?.value?.trim();
    const username = q('#regUsername')?.value?.trim() || '';
    const phone = q('#regPhone')?.value?.trim() || '';
    const address = q('#regAddress')?.value?.trim() || '';
    const password = q('#regPassword')?.value?.trim();
    const password2 = q('#regPassword2')?.value?.trim();
    const age = q('#regAge')?.value?.trim() || '';
    const health = q('#regHealth')?.value?.trim() || '';
    const msgEl = q('#registerMessage');

    if (!first_name || !email || !password) {
        if (msgEl) msgEl.textContent = 'Please fill all required fields';
        return;
    }

    if (password !== password2) {
        if (msgEl) msgEl.textContent = 'Passwords do not match';
        return;
    }

    try {
        const data = await apiPost('/register', JSON.stringify({
            first_name, last_name, email, username, phone, address, password, age, health
        }), { 'Content-Type': 'application/json' });

        if (data.customer) {
            if (msgEl) msgEl.textContent = 'Registered successfully';
            localStorage.setItem('loggedUser', JSON.stringify(data.customer));
            updateUIForLoggedUser();
            showSection('menu');
        } else {
            if (msgEl) msgEl.textContent = 'Registration successful';
        }
    } catch (e) {
        console.error('registerUser:', e);
        if (msgEl) msgEl.textContent = (e && e.error) ? e.error : 'Registration failed';
    }
}

function logout() {
    localStorage.removeItem('loggedUser');
    updateUIForLoggedUser();
    showSection('login');
}

function updateUIForLoggedUser() {
    const user = JSON.parse(localStorage.getItem('loggedUser') || '{}');
    const guestControls = q('#guestControls');
    const userControls = q('#userControls');

    if (user && user.customer_id) {
        guestControls?.classList.add('hidden');
        userControls?.classList.remove('hidden');
        q('#userHello') && (q('#userHello').textContent = `Welcome, ${user.first_name || 'User'}`);
        q('#userEmailSmall') && (q('#userEmailSmall').textContent = user.email || '');
        if (q('#orderClientName')) q('#orderClientName').value = `${user.first_name || ''} ${user.last_name || ''}`.trim();
    } else {
        guestControls?.classList.remove('hidden');
        userControls?.classList.add('hidden');
        if (q('#orderClientName')) q('#orderClientName').value = '';
    }
}

// ---------- AI Suggestions ----------
// ---------- Load AI Recommendations (Unified) ----------
async function loadAISuggestions() {
    const container = document.getElementById("aiSuggestions");
    container.innerHTML = "<p>Loading suggestions...</p>";

    const userStr = localStorage.getItem('loggedUser');
    if (!userStr) {
        container.innerHTML = '<p>يرجى تسجيل الدخول لرؤية التوصيات</p>';
        return;
    }

    const user = JSON.parse(userStr);
    const customerId = user.customer_id || 1;

    const apiUrl = `https://smart-restorent-1.onrender.com/api/ai/recommend/${customerId}`;

    try {
        const res = await fetch(apiUrl);

        if (!res.ok) {
            throw new Error(`API returned status ${res.status}`);
        }

        const meals = await res.json();

        if (!Array.isArray(meals) || meals.length === 0) {
            container.innerHTML = "<p>No recommendations available.</p>";
            return;
        }

        container.innerHTML = "";
        meals.forEach(meal => {
            const card = document.createElement('div');
            card.className = 'meal-card';
            card.innerHTML = `
                <img src="${meal.image_url ? 'https://smart-restorent-1.onrender.com' + meal.image_url : '/placeholder.png'}">
                <h3>${meal.name}</h3>
                <p>${meal.description || ''}</p>
                <p>السعر: ${meal.price} DZD</p>
            `;
            container.appendChild(card);
        });

    } catch (err) {
        console.error('Error loading AI suggestions:', err);
        container.innerHTML = `<p>❌ حدث خطأ في جلب التوصيات</p>`;
    }
}



// ---------- Event Handlers ----------
function attachEventHandlers() {
    q('#searchMeal')?.addEventListener('input', onSearchInput);
    qAll('.sub-buttons button').forEach(btn => btn.addEventListener('click', () => setMealTime(btn.dataset.mealTime || 'all')));
    q('#loginBtn')?.addEventListener('click', loginUser);
    q('#registerBtn')?.addEventListener('click', registerUser);

    const orderForm = q('#orderForm');
    if (orderForm) orderForm.addEventListener('submit', ev => { ev.preventDefault(); addOrder(); });
}

// ---------- Show Section ----------
function showSection(id) {
    document.querySelectorAll(".section").forEach(sec => sec.classList.remove("active"));
    const target = document.getElementById(id);
    if (target) target.classList.add("active");

    const logged = !!JSON.parse(localStorage.getItem('loggedUser') || '{}').customer_id;
    q('#guestControls')?.classList.toggle('hidden', logged && id !== 'login' && id !== 'register');
    q('#userControls')?.classList.toggle('hidden', !logged);

    if (id === 'menu') loadAISuggestions(); // Reload AI suggestions when showing menu
}
async function deleteOrder(orderId) {
    if (!confirm('Are you sure you want to delete this order?')) return;

    try {
        const res = await fetch(`${API_URL}/orders/${orderId}`, {
            method: 'DELETE'
        });
        if (!res.ok) throw new Error(`Failed to delete order (${res.status})`);
        showAlert('Order deleted successfully');
        await loadOrders(); // إعادة تحميل الطلبات بعد الحذف
    } catch (e) {
        console.error('deleteOrder:', e);
        showAlert('Error deleting order');
    }
}



async function confirmAllOrders() {
    if (cart.length === 0) {
        alert("Cart is empty");
        return;
    }

    const user = JSON.parse(localStorage.getItem('loggedUser') || '{}');

    try {
        for (const o of cart) {
            await apiPost('/orders', JSON.stringify({
                customer_id: user.customer_id,
                meal_id: o.meal_id,
                quantity: o.quantity,
                price: o.price * o.quantity,
                status: 'pending',
                notes: o.type === 'dinein'
                    ? `Dine-in Table ${o.table_id}`
                    : `Delivery to ${o.address}`
            }), { 'Content-Type': 'application/json' });
        }

        cart = [];
        renderCart();
        alert("✅ All orders confirmed successfully");

    } catch (e) {
        console.error(e);
        alert("❌ Error confirming orders");
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    renderCart();
}


function openSettings(){
    const user = JSON.parse(localStorage.getItem("loggedUser"));
    if(!user) return;

    setName.value = user.first_name || "";
    setEmail.value = user.email || "";
    setPhone.value = user.phone || "";
    setAddress.value = user.address || "";
    setHealth.value = user.health || "";

    settingsModal.classList.remove("hidden");
}


function closeSettings(){
    settingsModal.classList.add("hidden");
}

async function saveSettings() {
    let user = JSON.parse(localStorage.getItem("loggedUser"));
    if (!user || !user.customer_id) return;

    const formData = new FormData();
    formData.append('first_name', setName.value);
    formData.append('phone', setPhone.value);
    formData.append('address', setAddress.value);
    formData.append('health_condition', setHealth.value);

    const file = profileInput.files[0];
    if (file) formData.append('profile_image', file);

    try {
        const res = await fetch(`${API_URL}/customers/${user.customer_id}/profile`, {
            method: 'POST',
            body: formData
        });

        if (!res.ok) throw new Error("Update failed");

        const updatedUser = await res.json();
        localStorage.setItem("loggedUser", JSON.stringify(updatedUser));

        document.getElementById("userHello").textContent = "Welcome, " + updatedUser.first_name;

        if (updatedUser.profile_image_url) {
            profilePreview.src = `${UPLOADS_URL}/${updatedUser.profile_image_url}`;
            q('#userAvatar').textContent = ''; // إزالة الحرف الافتراضي
            q('#userAvatar').style.backgroundImage = `url(${UPLOADS_URL}/${updatedUser.profile_image_url})`;
            q('#userAvatar').style.backgroundSize = 'cover';
            q('#userAvatar').style.backgroundPosition = 'center';
        }

        closeSettings();
        alert("✅ Information updated successfully");
    } catch (e) {
        console.error("saveSettings:", e);
        alert("❌ Failed to update information");
    }
}




window.deleteOrder = deleteOrder;

// ---------- Init ----------
async function init() {
    attachEventHandlers();
    updateUIForLoggedUser();
    await Promise.all([loadCategories(), loadMeals(), loadOrders()]);
    loadAISuggestions();
}

init();

// Expose to window
window.toggleDescription = toggleDescription;
window.loginUser = loginUser;
window.registerUser = registerUser;
window.logout = logout;
window.showSection = showSection;
