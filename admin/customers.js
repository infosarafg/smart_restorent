const customersTableBody = document.querySelector('#customersTable tbody');
const customerModal = document.getElementById('customerModal');
const closeModal = document.querySelector('.modal .close');
const customerInfo = document.getElementById('customerInfo');

let customers = [];

// ------------------ Load customers ------------------
async function loadCustomers() {
  try {
    // تحديث المنفذ إلى 5000
    const res = await fetch("http://localhost:5000/api/customers-with-orders");
    customers = await res.json();
    renderCustomers();
  } catch (err) {
    console.error(err);
  }
}

// ------------------ Render table ------------------
function renderCustomers() {
  customersTableBody.innerHTML = "";
  customers.forEach((cust, index) => {
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${cust.first_name}</td>
      <td>${cust.last_name}</td>
      <td>${cust.email || '-'}</td>
      <td>${cust.phone || '-'}</td>
      <td>${cust.address || '-'}</td>
      <td><button class="view" onclick="viewCustomer(${index})">View</button></td>
    `;
    customersTableBody.appendChild(row);
  });
}

// ------------------ View customer ------------------
function viewCustomer(index) {
  const cust = customers[index];
  let html = `
    <p><strong>Name:</strong> ${cust.first_name} ${cust.last_name}</p>
    <p><strong>Email:</strong> ${cust.email || '-'}</p>
    <p><strong>Phone:</strong> ${cust.phone || '-'}</p>
    <p><strong>Address:</strong> ${cust.address || '-'}</p>
  `;

  if (cust.orders && cust.orders.length) {
    html += `<h4>Orders:</h4><ul>`;
    cust.orders.forEach(order => {
      const total = (order.price * order.quantity).toFixed(2);
      html += `<li>${order.meal} - $${order.price} × ${order.quantity} = $${total} - ${order.order_date} ${order.order_time}</li>`;
    });
    html += `</ul>`;
  } else {
    html += `<p>No orders yet.</p>`;
  }

  customerInfo.innerHTML = html;
  customerModal.style.display = 'block';
}

// ------------------ Close modal ------------------
closeModal.addEventListener('click', () => customerModal.style.display = 'none');
window.addEventListener('click', e => {
  if (e.target == customerModal) customerModal.style.display = 'none';
});

// ------------------ Init ------------------
loadCustomers();
