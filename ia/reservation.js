// --------------------------
// عناصر DOM
// --------------------------
const tablesGrid = document.getElementById('tables-grid');
const addTableBtn = document.getElementById('add-table-btn');
const tableMsg = document.getElementById('table-msg');

const API_BASE = "https://smart-restorent-1.onrender.com/api";

// --------------------------
// جلب الطاولات من السيرفر
// --------------------------
async function loadTables() {
  try {
    const res = await fetch(`${API_BASE}/tables`);
    const data = await res.json();
    tables = data.map(t => ({
      id: t.table_id,
      number: t.table_number,
      seats: t.capacity,
      status: t.status   // Available | Reserved
    }));
    renderTables();
  } catch (err) {
    console.error("Error loading tables:", err);
  }
}

// --------------------------
// إضافة طاولة إلى السيرفر
// --------------------------
async function addTable() {
  const number = document.getElementById('table-number').value.trim();
  const seats = document.getElementById('table-seats').value.trim();

  if (!number || !seats) {
    tableMsg.textContent = 'Please fill all fields.';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        table_number: number,
        capacity: seats
      })
    });

    if (res.status === 201) {
      tableMsg.textContent = "Table added!";
      document.getElementById('table-number').value = '';
      document.getElementById('table-seats').value = '';
      loadTables();
    } else {
      tableMsg.textContent = "Error adding table.";
    }
  } catch (err) {
    console.error("Add table error:", err);
  }
}

addTableBtn.addEventListener('click', addTable);

// --------------------------
// تغيير حالة الطاولة
// --------------------------
async function toggleTableStatus(table) {
  const newStatus = table.status === "Reserved" ? "Available" : "Reserved";

  try {
    await fetch(`${API_BASE}/tables/${table.id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    });

    loadTables();
  } catch (err) {
    console.error("Error changing status:", err);
  }
}

// --------------------------
// عرض الطاولات
// --------------------------
function renderTables() {
  tablesGrid.innerHTML = '';

  tables.forEach(table => {
    const card = document.createElement('div');
    card.className = 'table-card ' + (table.status === "Reserved" ? 'booked' : 'available');

    card.innerHTML = `
      <h4>Table ${table.number}</h4>
      <p>Seats: ${table.seats}</p>
      <p>Status: ${table.status}</p>
      <button class="toggle-btn">
        ${table.status === "Reserved" ? "Unreserve" : "Reserve"}
      </button>
    `;

    // زر تغيير الحالة
    card.querySelector('.toggle-btn').addEventListener('click', () => {
      toggleTableStatus(table);
    });

    tablesGrid.appendChild(card);
  });
}

// --------------------------
// تحميل الطاولات عند فتح الصفحة
// --------------------------
let tables = [];
loadTables();
