// ---------- Helpers ----------
const $id = id => document.getElementById(id);
const $qs = sel => document.querySelector(sel);
const $all = sel => Array.from(document.querySelectorAll(sel));
const safe = v => v == null ? "" : v;

const formatDateTimeForDisplay = dt => {
  if(!dt) return "";
  const d = new Date(dt);
  return d.toLocaleString('en-US', { // Changed to English
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);

// ---------- State ----------
let orders = [];
let customers = [];
let meals = [];

// ---------- DOM ----------
const ordersBody = $qs(".orders-table tbody");
const filterDate = $id("filterDate");
const filterTimeFrom = $id("filterTimeFrom");
const filterTimeTo = $id("filterTimeTo");
const applyFilter = $id("applyFilter");
const clearFilter = $id("clearFilter");
const btnAdd = $id("btnAdd");
const statusQuickFilter = $id("statusQuickFilter");
const globalSearch = $id("globalSearch");
const exportBtn = $id("exportBtn");

// modal elements
const orderModal = $id("orderModal");
const orderForm = $id("orderForm");
const modalTitle = $id("modalTitle");
const orderIdInput = $id("orderId");

// select fields
const customerSelect = $id("customerSelect");
const mealSelect = $id("mealSelect");
const quantityInput = $id("quantity");
const priceInput = $id("price");
const totalInput = $id("total");
const statusSelect = $id("status");
const orderDatetime = $id("orderDatetime");
const cancelModalBtn = $id("cancelModal");

// fallback text inputs (optional)
const custName = $id("custName");
const custPhone = $id("custPhone");
const custAddress = $id("custAddress");
const itemsInput = $id("items");

// ---------- Utility ----------
function elExists(el){ return !!el && el.nodeType; }

function buildCustomerOptions(){
  if(!elExists(customerSelect)) return;
  customerSelect.innerHTML = `<option value="">-- Select Customer --</option>` +
    customers.map(c=>`<option value="${c.customer_id}">${escapeHtml(safe(c.first_name))} ${escapeHtml(safe(c.last_name))}</option>`).join("");
}

function buildMealOptions(){
  if(!elExists(mealSelect)) return;
  mealSelect.innerHTML = `<option value="">-- Select Meal --</option>` +
    meals.map(m=>`<option value="${m.meal_id}" data-price="${m.price}">${escapeHtml(safe(m.name))} — ${Number(m.price).toLocaleString("en-US")} DZD</option>`).join("");
}

// ---------- Circles ----------
function updateCircle(selector, value, total) {
  const el = document.querySelector(selector);
  if (!el) return;
  const percent = total === 0 ? 0 : Math.round((value / total) * 100);
  const circle = el.querySelector(".progress");
  const number = el.querySelector(".number");
  if(circle){
    const radius = circle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference * (1 - percent/100);
  }
  if(number) number.textContent = percent + "%";
}

function updateAllCircles(filteredOrders){
  const arr = filteredOrders || orders;
  const pending = arr.filter(o=>o.status==="pending").length;
  const preparing = arr.filter(o=>o.status==="preparing").length;
  const onway = arr.filter(o=>o.status==="onway").length;
  const delivered = arr.filter(o=>o.status==="delivered").length;
  updateCircle(".circle-pending", pending, arr.length);
  updateCircle(".circle-preparing", preparing, arr.length);
  updateCircle(".circle-onway", onway, arr.length);
  updateCircle(".circle-delivered", delivered, arr.length);
}

// ---------- Rendering ----------
function escapeHtml(s){
  return (s==null ? '' : String(s)).replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;");
}

function renderStatusBadge(status){
  const map = {
    pending:"status-pending",
    preparing:"status-preparing",
    onway:"status-onway",
    delivered:"status-delivered",
    canceled:"status-canceled"
  };
  const label = {
    pending: "New",
    preparing: "Preparing",
    onway: "On Way",
    delivered: "Delivered",
    canceled: "Canceled"
  }[status] || status;
  return `<span class="badge ${map[status]||""}">${escapeHtml(label)}</span>`;
}

function attachRowListeners(){
  $all(".tbtn.edit").forEach(btn=>btn.onclick=()=>openEditModal(btn.dataset.id));
  $all(".tbtn.delete").forEach(btn=>btn.onclick=()=>{ if(confirm("Do you want to delete this order?")) deleteOrder(btn.dataset.id); });
  $all(".tbtn.status").forEach(btn=>btn.onclick=()=>openStatusMenu(btn.dataset.id));
}

function renderOrdersTable(filtered){
  ordersBody.innerHTML = "";
  const data = filtered || orders;
  data.forEach(o=>{
    const tr = document.createElement("tr");

    const mealDisplay = `${safe(o.meal_name)}${o.quantity ? " ×"+o.quantity : ""}`;
    const phone = safe(o.phone) || "";
    const address = safe(o.address) || "";

    tr.innerHTML=`
      <td>${o.order_id}</td>
      <td>${escapeHtml(safe(o.customer_name))}</td>
      <td>${escapeHtml(phone)}</td>
      <td>${escapeHtml(address)}</td>
      <td>${escapeHtml(mealDisplay)}</td>
      <td>${(o.total!=null) ? Number(o.total).toLocaleString("en-US") + " DZD" : ""}</td>
      <td>${renderStatusBadge(o.status)}</td>
      <td>${formatDateTimeForDisplay(o.order_datetime)}</td>
      <td>
        <button class="tbtn edit" data-id="${o.order_id}">Edit</button>
        <button class="tbtn status" data-id="${o.order_id}">Status</button>
      </td>
    `;
    ordersBody.appendChild(tr);
  });
  attachRowListeners();
}

// ---------- Filters ----------
function applyFiltersAndRender(){
  let f = [...orders];
  if(filterDate?.value){
    const d = new Date(filterDate.value+"T00:00:00");
    f = f.filter(o=>{
      const od = new Date(o.order_datetime);
      return od.getFullYear()===d.getFullYear() && od.getMonth()===d.getMonth() && od.getDate()===d.getDate();
    });
  }
  if(filterTimeFrom?.value || filterTimeTo?.value){
    f = f.filter(o=>{
      const od = new Date(o.order_datetime);
      const h = String(od.getHours()).padStart(2,"0");
      const m = String(od.getMinutes()).padStart(2,"0");
      const val = `${h}:${m}`;
      if(filterTimeFrom?.value && val < filterTimeFrom.value) return false;
      if(filterTimeTo?.value && val > filterTimeTo.value) return false;
      return true;
    });
  }
  if(statusQuickFilter?.value) f = f.filter(o=>o.status===statusQuickFilter.value);
  if(globalSearch?.value?.trim()){
    const q = globalSearch.value.toLowerCase();
    f = f.filter(o=>{
      const s = [
        o.order_id,
        o.customer_name,
        o.meal_name,
        o.status,
        o.phone,
        o.address
      ].join(" ").toLowerCase();
      return s.includes(q);
    });
  }
  renderOrdersTable(f);
  updateAllCircles(f);
  renderCharts(f);
}

// ---------- Load reference data & orders ----------
async function loadCustomers(){
  try{
    const res = await fetch("https://smart-restorant.onrender.com/api/customers");
    customers = await res.json();
    buildCustomerOptions();
  }catch(err){ console.error("loadCustomers:", err); }
}

async function loadMeals(){
  try{
    const res = await fetch("https://smart-restorant.onrender.com/api/meals");
    meals = await res.json();
    buildMealOptions();
  }catch(err){ console.error("loadMeals:", err); }
}

async function loadOrders(){
  try{
    const res = await fetch("https://smart-restorant.onrender.com/api/orders");
    const data = await res.json();

    orders = data.map(o => ({
      order_id: Number(o.order_id),
      customer_id: o.customer_id != null ? Number(o.customer_id) : null,
      customer_name: safe(o.customer_name),
      meal_id: o.meal_id != null ? Number(o.meal_id) : null,
      meal_name: safe(o.meal_name),
      quantity: o.quantity != null ? Number(o.quantity) : 1,
      price: o.price != null ? Number(o.price) : null,
      total: o.total != null ? Number(o.total) : (o.price != null ? Number(o.price) * (o.quantity || 1) : null),
      status: safe(o.status),
      order_datetime: o.order_datetime || o.orderDatetime || o.datetime || null,
      phone: safe(o.phone),
      address: safe(o.address)
    }));

    applyFiltersAndRender();
  }catch(err){ console.error("loadOrders:", err); }
}

// ---------- Modal (Add / Edit) ----------
function openAddModal(){
  modalTitle.textContent="Add New Order";
  if(elExists(orderForm)) orderForm.reset();
  if(elExists(orderIdInput)) orderIdInput.value = "";
  if(elExists(quantityInput)) quantityInput.value = 1;
  if(elExists(priceInput)) priceInput.value = "";
  if(elExists(totalInput)) totalInput.value = "";
  if(elExists(statusSelect)) statusSelect.value = "pending";
  if(elExists(orderDatetime)) orderDatetime.value = new Date().toISOString().slice(0,16);
  if(elExists(customerSelect) && customerSelect.options.length>0) customerSelect.selectedIndex = 0;
  if(elExists(mealSelect) && mealSelect.options.length>0) mealSelect.selectedIndex = 0;
  if(elExists(orderModal)) orderModal.setAttribute("aria-hidden","false");
}

async function openEditModal(id){
  try{
    const o = orders.find(x=>x.order_id==id);
    if(!o) return alert("Order not found");
    modalTitle.textContent="Edit Order";
    if(elExists(orderIdInput)) orderIdInput.value = o.order_id;
    if(elExists(customerSelect) && o.customer_id) customerSelect.value = o.customer_id;
    if(elExists(mealSelect) && o.meal_id) mealSelect.value = o.meal_id;
    if(elExists(quantityInput)) quantityInput.value = o.quantity || 1;
    if(elExists(priceInput)) priceInput.value = o.price != null ? o.price : "";
    if(elExists(totalInput)) totalInput.value = o.total != null ? o.total : "";
    if(elExists(statusSelect)) statusSelect.value = o.status || "pending";
    if(elExists(orderDatetime)) orderDatetime.value = new Date(o.order_datetime).toISOString().slice(0,16);
    if(elExists(orderModal)) orderModal.setAttribute("aria-hidden","false");
  }catch(err){ console.error(err); }
}

// compute total
function computeTotal(){
  if(!elExists(priceInput) || !elExists(quantityInput) || !elExists(totalInput)) return;
  const p = Number(priceInput.value) || 0;
  const q = Number(quantityInput.value) || 0;
  totalInput.value = (p * q).toFixed(2);
}

// meal select updates price
if(elExists(mealSelect)){
  mealSelect.addEventListener("change", ()=>{
    const opt = mealSelect.selectedOptions[0];
    if(!opt) return;
    const p = Number(opt.dataset.price) || 0;
    if(elExists(priceInput)) priceInput.value = p;
    computeTotal();
  });
}
if(elExists(priceInput)) priceInput.addEventListener("input", computeTotal);
if(elExists(quantityInput)) quantityInput.addEventListener("input", computeTotal);

// ---------- Save ----------
async function saveOrderFromForm(e){
  if(e) e.preventDefault();

  if(!elExists(customerSelect) || !elExists(mealSelect)){
    alert("Please add select fields for customers and meals (customerSelect, mealSelect).");
    return;
  }

  const customer_id = Number(customerSelect.value);
  const meal_id = Number(mealSelect.value);
  const quantity = Number(quantityInput.value) || 1;
  const price = Number(priceInput.value) || 0;
  const status = statusSelect ? statusSelect.value : "pending";

  if(!customer_id || !meal_id) return alert("Please select a customer and a meal from the lists.");

  const payload = { customer_id, meal_id, quantity, price, status };

  try{
    let res, json;
    if(orderIdInput && orderIdInput.value){
      const id = orderIdInput.value;
      res = await fetch(`https://smart-restorant.onrender.com/api/orders/${id}`, {
        method: "PUT",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      json = await res.json();
      const idx = orders.findIndex(o=>o.order_id == json.order_id);
      if(idx>-1){
        orders[idx] = {
          ...orders[idx],
          customer_id: json.customer_id,
          customer_name: customers.find(c=>c.customer_id==json.customer_id) ? `${customers.find(c=>c.customer_id==json.customer_id).first_name} ${customers.find(c=>c.customer_id==json.customer_id).last_name}`.trim() : orders[idx].customer_name,
          meal_id: json.meal_id,
          meal_name: meals.find(m=>m.meal_id==json.meal_id)?.name || orders[idx].meal_name,
          quantity: Number(json.quantity),
          price: json.price != null ? Number(json.price) : orders[idx].price,
          total: (json.price != null ? Number(json.price) : orders[idx].price) * (Number(json.quantity)||1),
          status: json.status,
          order_datetime: orders[idx].order_datetime
        };
      }
    } else {
      res = await fetch("https://smart-restorant.onrender.com/api/orders", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify(payload)
      });
      json = await res.json();
      const cust = customers.find(c=>c.customer_id==json.customer_id);
      const meal = meals.find(m=>m.meal_id==json.meal_id);
      const newOrder = {
        order_id: Number(json.order_id),
        customer_id: Number(json.customer_id),
        customer_name: cust ? `${cust.first_name} ${cust.last_name}`.trim() : "",
        meal_id: Number(json.meal_id),
        meal_name: meal ? meal.name : "",
        quantity: Number(json.quantity),
        price: json.price != null ? Number(json.price) : price,
        total: (json.price != null ? Number(json.price) : price) * (Number(json.quantity)||1),
        status: json.status,
        order_datetime: json.order_datetime || new Date().toISOString()
      };
      orders.unshift(newOrder);
    }

    if(elExists(orderModal)) orderModal.setAttribute("aria-hidden","true");
    applyFiltersAndRender();
  }catch(err){ console.error("saveOrder:", err); alert("An error occurred while saving"); }
}


// ---------- Change status ----------
async function openStatusMenu(id) {
  const o = orders.find(x => x.order_id == id);
  if (!o) return;

  // إنشاء نافذة مؤقتة
  const modal = document.createElement("div");
  modal.style.position = "fixed";
  modal.style.top = 0;
  modal.style.left = 0;
  modal.style.width = "100%";
  modal.style.height = "100%";
  modal.style.backgroundColor = "rgba(0,0,0,0.5)";
  modal.style.display = "flex";
  modal.style.alignItems = "center";
  modal.style.justifyContent = "center";
  modal.style.zIndex = 9999;

  // محتوى النافذة
  const box = document.createElement("div");
  box.style.background = "#fff";
  box.style.padding = "20px";
  box.style.borderRadius = "8px";
  box.style.minWidth = "250px";
  box.style.textAlign = "center";

  const msg = document.createElement("p");
  msg.textContent = "Select status for the order:";

  const select = document.createElement("select");
  select.style.marginTop = "10px";
  select.style.width = "100%";
  select.innerHTML = `
    <option value="pending">New</option>
    <option value="preparing">Preparing</option>
    <option value="onway">On Way</option>
    <option value="delivered">Delivered</option>
    <option value="canceled">Canceled</option>
  `;
  select.value = o.status;

  const btnSave = document.createElement("button");
  btnSave.textContent = "Save";
  btnSave.style.marginTop = "15px";

  const btnCancel = document.createElement("button");
  btnCancel.textContent = "Cancel";
  btnCancel.style.marginTop = "15px";
  btnCancel.style.marginLeft = "10px";

  box.appendChild(msg);
  box.appendChild(select);
  box.appendChild(btnSave);
  box.appendChild(btnCancel);
  modal.appendChild(box);
  document.body.appendChild(modal);

  // وظائف الأزرار
  btnCancel.onclick = () => document.body.removeChild(modal);

  btnSave.onclick = async () => {
    const next = select.value;
    if (["pending","preparing","onway","delivered","canceled"].includes(next)) {
      try {
        const res = await fetch(`https://smart-restorant.onrender.com/api/orders/${id}`, {
          method: "PUT",
          headers: {"Content-Type":"application/json"},
          body: JSON.stringify({ status: next })
        });
        const updated = await res.json();
        const idx = orders.findIndex(x => x.order_id == updated.order_id);
        if(idx > -1) orders[idx].status = updated.status;

        applyFiltersAndRender();
        document.body.removeChild(modal);
      } catch(err) {
        console.error("openStatusMenu:", err);
        alert("An error occurred while updating status");
      }
    }
  };
}



// ---------- CSV Export ----------
function exportCSV(){
  const header = ["order_id","customer_name","meal_name","quantity","price","total","status","order_datetime"];
  const rows = orders.map(o=>{
    const row = [
      o.order_id,
      o.customer_name,
      o.meal_name,
      o.quantity,
      o.price,
      o.total,
      o.status,
      o.order_datetime
    ];
    return header.map((_,i)=>`"${String(row[i] ?? "").replace(/"/g,'""')}"`).join(",");
  });
  const csv = [header.join(","), ...rows].join("\n");
  const blob = new Blob([csv], {type:"text/csv;charset=utf-8"});
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "orders.csv";
  a.click();
}

// ---------- Charts ----------
function getSalesData(filteredOrders){
  const arr = filteredOrders || orders;
  const salesMap = {};
  arr.forEach(o=>{
    const d = new Date(o.order_datetime);
    if(isNaN(d)) return;
    const key = `${d.getDate()}/${d.getMonth()+1}`;
    salesMap[key] = (salesMap[key]||0) + (Number(o.total) || 0);
  });
  return {labels:Object.keys(salesMap), data:Object.values(salesMap)};
}

function getStatusData(filteredOrders){
  const arr = filteredOrders || orders;
  const statusCounts = {pending:0, preparing:0, onway:0, delivered:0, canceled:0};
  arr.forEach(o=> statusCounts[o.status] = (statusCounts[o.status]||0)+1 );
  return statusCounts;
}

function getTopCustomers(filteredOrders){
  const arr = filteredOrders || orders;
  const custMap = {};
  arr.forEach(o=> custMap[o.customer_name] = (custMap[o.customer_name]||0) + (Number(o.total)||0) );
  return Object.entries(custMap).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

let salesChartInstance = null;
let statusPieInstance = null;

function renderCharts(filteredOrders){
  const sales = getSalesData(filteredOrders);
  const status = getStatusData(filteredOrders);

  const salesEl = document.getElementById("salesChart");
  if(salesEl){
    const ctxSales = salesEl.getContext ? salesEl.getContext("2d") : salesEl.querySelector("canvas")?.getContext("2d");
    if(ctxSales){
      if(salesChartInstance) salesChartInstance.destroy();
      salesChartInstance = new Chart(ctxSales,{
        type:"line",
        data:{
          labels:sales.labels,
          datasets:[{
            label:'Daily Sales (DZD)',
            data:sales.data,
            borderWidth:2,
            fill:true,
            tension:0.4
          }]
        },
        options:{responsive:true, plugins:{legend:{display:true}}}
      });
    }
  }

  const statusEl = document.getElementById("statusPie");
  if(statusEl){
    const ctxStatus = statusEl.getContext("2d");
    if(statusPieInstance) statusPieInstance.destroy();
    statusPieInstance = new Chart(ctxStatus,{
      type:"pie",
      data:{
        labels:["New","Preparing","On Way","Delivered","Canceled"],
        datasets:[{
          data:[status.pending,status.preparing,status.onway,status.delivered,status.canceled]
        }]
      },
      options:{responsive:true}
    });
  }

  const topCustEl = $id("topCustomers");
  if(elExists(topCustEl)){
    topCustEl.innerHTML = "";
    getTopCustomers(filteredOrders).forEach(([name,total])=>{
      const li = document.createElement("li");
      li.textContent = `${name} — ${total.toLocaleString("en-US")} DZD`;
      topCustEl.appendChild(li);
    });
  }
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", async ()=>{
  await Promise.all([ loadCustomers(), loadMeals() ]);
  await loadOrders();

  if(elExists(orderForm)) orderForm.onsubmit = saveOrderFromForm;
  if(elExists(btnAdd)) btnAdd.onclick = openAddModal;
  if(elExists(cancelModalBtn)) cancelModalBtn.onclick = ()=> orderModal.setAttribute("aria-hidden","true");
  if(elExists(applyFilter)) applyFilter.onclick = applyFiltersAndRender;
  if(elExists(clearFilter)) clearFilter.onclick = ()=>{
    if(elExists(filterDate)) filterDate.value="";
    if(elExists(filterTimeFrom)) filterTimeFrom.value="";
    if(elExists(filterTimeTo)) filterTimeTo.value="";
    if(elExists(statusQuickFilter)) statusQuickFilter.value="";
    if(elExists(globalSearch)) globalSearch.value="";
    applyFiltersAndRender();
  };
  if(elExists(exportBtn)) exportBtn.onclick = exportCSV;
  if(elExists(globalSearch)) globalSearch.addEventListener("input", applyFiltersAndRender);
});
// ---------- Filters ----------
// عند تغيير فلتر الحالة Quick Filter
if(elExists(statusQuickFilter)){
  statusQuickFilter.addEventListener("change", applyFiltersAndRender);
}
// ---------- Update Stats ----------
function updateStats(filteredOrders){
  const arr = filteredOrders || orders;
  const totalRevenue = arr.reduce((sum,o)=> sum + (Number(o.total)||0), 0);
  const statRevenueEl = $id("statRevenue");
  if(elExists(statRevenueEl)) statRevenueEl.textContent = totalRevenue.toLocaleString("en-US") + " DZD";
}

// --- ضمن applyFiltersAndRender() ---
function applyFiltersAndRender(){
  let f = [...orders];
  
  // ... هنا نفس كود الفلاتر الموجود لديك ...
  
  renderOrdersTable(f);
  updateAllCircles(f);
  renderCharts(f);
  updateStats(f); // ← هذه السطر الجديد لتحديث البطاقة
}
