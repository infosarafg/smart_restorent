// ============================
// Fetch data from server
// ============================

async function fetchOrders() {
  try {
    const res = await fetch('https://smart-restorant.onrender.com/api/orders');
    if (!res.ok) throw new Error('Failed to fetch orders');
    return await res.json(); // [{order_id, customer_name, meal_name, quantity, price, total, status, order_datetime, phone?, address?}, ...]
  } catch (err) {
    console.error('Error fetching orders:', err);
    return [];
  }
}

async function fetchReviews() {
  try {
    const res = await fetch('https://smart-restorant.onrender.com/api/reviews');
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return await res.json(); // [{user, text}, ...]
  } catch (err) {
    console.error('Error fetching reviews:', err);
    return [];
  }
}

// ============================
// Compute statistics for cards
// ============================

async function fetchStats() {
  const orders = await fetchOrders();

  const totalOrders = orders.length;
  const pending = orders.filter(o => o.status === 'pending').length;
  const preparing = orders.filter(o => o.status === 'preparing').length;
  const onway = orders.filter(o => o.status === 'onway').length;
  const delivered = orders.filter(o => o.status === 'delivered').length;

  const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);

  // Most ordered meals
  const mealCounts = {};
  orders.forEach(o => {
    if (!mealCounts[o.meal_name]) mealCounts[o.meal_name] = 0;
    mealCounts[o.meal_name] += o.quantity;
  });
  const topMeals = Object.entries(mealCounts)
    .sort((a,b) => b[1]-a[1])
    .slice(0,3);

  return {
    totalOrders, pending, preparing, onway, delivered, totalRevenue, topMeals
  };
}

// ============================
// Render Orders Table
// ============================

async function renderOrders() {
  const tbody = document.getElementById('ordersBody');
  tbody.innerHTML = '';

  const orders = await fetchOrders();

  const statusMap = {
    pending: 'Pending',
    preparing: 'Preparing',
    onway: 'On the way',
    delivered: 'Completed',
    canceled: 'Canceled'
  };

  orders.forEach(o => {
    const tr = document.createElement('tr');
    const statusText = statusMap[o.status] || 'Unknown';

    tr.innerHTML = `
      <td>#${o.order_id}</td>
      <td>${o.customer_name || '-'}</td>
      <td>${o.phone || '-'}</td>
      <td>${o.address || '-'}</td>
      <td>${o.meal_name || '-'}</td>
      <td>${o.total != null ? o.total.toFixed(2) : '-'}</td>
      <td><span class="status ${o.status}">${statusText}</span></td>
      <td>${new Date(o.order_datetime).toLocaleString('en-US')}</td>
    `;

    tbody.appendChild(tr);
  });
}

// ============================
// Render Reviews
// ============================

async function renderReviews() {
  const box = document.getElementById('reviewsList');
  box.innerHTML = '';

  const reviews = await fetchReviews();
  reviews.forEach(r => {
    const div = document.createElement('div');
    div.className = 'review';
    div.innerHTML = `<div class="meta">${r.user}</div><div>${r.text}</div>`;
    box.appendChild(div);
  });
}

// ============================
// Render Cards with dynamic values
// ============================

async function renderCards() {
  const stats = await fetchStats();

  // Card 1: Total Revenue
  const revenueCircle = document.querySelector('.card.primary .circle');
  const revenuePercent = Math.min(Math.round(stats.totalRevenue / 1000), 100);
  revenueCircle.dataset.value = revenuePercent;
  revenueCircle.querySelector('.number').textContent = `${Math.round(stats.totalRevenue)} دج`;

  // Card 2: Active Orders
  const activeCircle = document.querySelector('.card.gradient .circle');
  const activeCount = stats.pending + stats.preparing + stats.onway;
  activeCircle.dataset.value = Math.min(activeCount * 5, 100);
  document.querySelector('.card.gradient .card-value').textContent = activeCount;
  document.querySelector('.card.gradient .card-sub').textContent =
    `Pending ${stats.pending} — Preparing ${stats.preparing} — On the way ${stats.onway}`;

  // Card 3: Today's Bookings (example: fetchReservations can be added)
  const bookingsCircle = document.querySelector('.card.light .circle');
  const bookingsToday = 7; // Example static, replace with real API if available
  bookingsCircle.dataset.value = Math.min(bookingsToday * 10, 100);
  document.querySelector('.card.light .card-value').textContent = bookingsToday;

  // Card 4: Top Meals
  const topCircle = document.querySelector('.card.stats .circle');
  topCircle.dataset.value = Math.min(stats.topMeals[0]?.[1] || 0, 100);
  const topList = document.querySelector('.card.stats ul');
  topList.innerHTML = '';
  stats.topMeals.forEach(([meal, count]) => {
    const li = document.createElement('li');
    li.textContent = `${meal} — ${count}`;
    topList.appendChild(li);
  });

  initCircles();
}

// ============================
// Initialize Charts
// ============================

function initCharts() {
  const ctx = document.getElementById('salesChart').getContext('2d');
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: ['Jan','Feb','Mar','Apr','May','Jun'],
      datasets: [{
        label: 'Monthly Sales',
        data: [42000,48000,51000,47000,55000,60000],
        borderColor: '#ef6c00',
        backgroundColor: 'rgba(239,108,0,0.2)',
        fill: true,
        tension: 0.35
      }]
    },
    options: {
      plugins: { legend: { labels: { color:'#fff' } } },
      scales: {
        x: { ticks: { color:'#98a0ad' } },
        y: { ticks: { color:'#98a0ad' } }
      }
    }
  });
}

// ============================
// Initialize Progress Circles
// ============================

function initCircles() {
  document.querySelectorAll('.circle').forEach(circle => {
    const value = parseInt(circle.dataset.value) || 0;
    const progress = circle.querySelector('.progress');
    const radius = progress.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;

    progress.style.strokeDasharray = circumference;
    progress.style.strokeDashoffset = circumference;

    setTimeout(() => {
      const offset = circumference - (value / 100) * circumference;
      progress.style.strokeDashoffset = offset;
    }, 100);
  });
}

// ============================
// Initialize everything on page load
// ============================

document.addEventListener('DOMContentLoaded', async () => {
  await renderOrders();
  await renderReviews();
  await renderCards();
  initCharts();
});
