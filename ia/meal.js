// meal.js
const addMealBtn = document.getElementById('addMealBtn');
const mealModal = document.getElementById('mealModal');
const closeModal = mealModal.querySelector('.close');
const mealForm = document.getElementById('mealForm');
const mealsTableBody = document.querySelector('#mealsTable tbody');
const categorySelect = document.getElementById('categorySelect');
const addCategoryBtn = document.getElementById('addCategoryBtn');
const categoryModal = document.getElementById('categoryModal');
const closeCategoryModal = document.getElementById('closeCategoryModal');
const categoryForm = document.getElementById('categoryForm');
const searchMealInput = document.getElementById('searchMeal');

let meals = [];
let categories = [];
let editIndex = null;

// ------------------ Open Modal ------------------
addMealBtn.addEventListener('click', () => {
  mealForm.reset();
  editIndex = null;
  document.getElementById('modalTitle').innerText = 'Add Meal';
  mealModal.style.display = 'block';
});

// Close modal
closeModal.addEventListener('click', () => mealModal.style.display = 'none');
window.addEventListener('click', e => {
  if (e.target === mealModal) mealModal.style.display = 'none';
});

// ------------------ Load Categories ------------------
async function loadCategories() {
  try {
    const res = await fetch("https://smart-restorent-1.onrender.com/api/meal-categories");
    categories = await res.json();
    categorySelect.innerHTML = categories
      .map(cat => `<option value="${cat.category_id}">${cat.category_name}</option>`)
      .join('');
  } catch (err) {
    console.error(err);
  }
}
loadCategories();

// ------------------ Load Meals ------------------
async function loadMeals() {
  try {
    const res = await fetch("https://smart-restorent-1.onrender.com/api/meals");
    meals = await res.json();
    renderMeals();
  } catch (err) {
    console.error(err);
  }
}
loadMeals();

// ------------------ Render Meals ------------------
function renderMeals(list = meals) {
  mealsTableBody.innerHTML = '';
  list.forEach((meal, index) => {
    const categoryName = meal.category_name || '';
    const imageUrl = meal.image_url ? `https://smart-restorent-1.onrender.com${meal.image_url}` : 'default.png';
    const row = document.createElement('tr');
    row.innerHTML = `
      <td><img src="${imageUrl}" width="60" height="60" style="object-fit:cover;border-radius:8px;"></td>
      <td>${meal.name}</td>
      <td>${categoryName}</td>
      <td>${meal.meal_time}</td>
      <td>$${meal.price}</td>
      <td>${meal.description || ''}</td>
      <td>
        <button class="edit" onclick="editMeal(${index})">Edit</button>
        <button class="delete" onclick="deleteMeal(${index})">Delete</button>
      </td>
    `;
    mealsTableBody.appendChild(row);
  });
}

// ------------------ Add / Edit Meal ------------------
mealForm.addEventListener('submit', async e => {
  e.preventDefault();

  const name = mealForm.name.value.trim();
  const price = mealForm.price.value;
  const category_id = categorySelect.value;
  const meal_time = mealForm['meal_time'].value;

  if (!name || !price || !category_id || !meal_time) {
    return alert("Please fill all required fields.");
  }

  const formData = new FormData(mealForm);

  if (editIndex !== null && (!mealForm.image.files || mealForm.image.files.length === 0)) {
    formData.delete('image');
  }

  let url = "https://smart-restorent-1.onrender.com/api/meals";
  let method = "POST";

  if (editIndex !== null) {
    url += `/${meals[editIndex].meal_id}`;
    method = "PUT";
  }

  try {
    const res = await fetch(url, { method, body: formData });
    const contentType = res.headers.get("content-type") || "";
    let data = null;

    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      console.error("Server returned non-JSON:", text);
    }

    if (!res.ok) {
      const msg = (data && (data.error || data.message))
        ? (data.error || data.message)
        : `Server error (${res.status})`;
      return alert("Failed to save meal: " + msg);
    }

    if (editIndex !== null) {
      meals[editIndex] = data;
    } else {
      meals.push(data);
    }

    renderMeals();
    mealModal.style.display = 'none';
  } catch (err) {
    console.error("Error saving meal:", err);
    alert("An error occurred while saving meal.");
  }
});

// ------------------ Edit Meal ------------------
function editMeal(index) {
  const meal = meals[index];
  editIndex = index;
  document.getElementById('modalTitle').innerText = 'Edit Meal';

  mealForm.name.value = meal.name || '';
  mealForm.description.value = meal.description || '';
  mealForm.price.value = meal.price || '';
  categorySelect.value = meal.category_id || '';

  // ✔ IMPORTANT FIX  
  mealForm['meal_time'].value = meal.meal_time || '';

  mealForm.image.value = '';
  mealModal.style.display = 'block';
}

// ------------------ Delete Meal ------------------
async function deleteMeal(index) {
  if (!confirm("Are you sure you want to delete this meal?")) return;
  try {
    const mealId = meals[index].meal_id;
    await fetch(`https://smart-restorent-1.onrender.com/api/meals/${mealId}`, { method: "DELETE" });
    meals.splice(index, 1);
    renderMeals();
  } catch (err) {
    console.error(err);
    alert("Failed to delete meal.");
  }
}

// ------------------ Search Meals ------------------
searchMealInput.addEventListener('input', e => {
  const keyword = e.target.value.toLowerCase();
  const filtered = meals.filter(m => m.name.toLowerCase().includes(keyword));
  renderMeals(filtered);
});

// ------------------ Category Modal ------------------
addCategoryBtn.addEventListener('click', () => {
  categoryForm.reset();
  categoryModal.style.display = 'block';
});
closeCategoryModal.addEventListener('click', () => categoryModal.style.display = 'none');
window.addEventListener('click', e => { if (e.target === categoryModal) categoryModal.style.display='none'; });

// ------------------ Add Category ------------------
categoryForm.addEventListener('submit', async e => {
  e.preventDefault();
  const categoryName = categoryForm.category_name.value.trim();
  if (!categoryName) return alert("Enter category name.");

  try {
    const res = await fetch("https://smart-restorent-1.onrender.com/api/meal-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category_name: categoryName })
    });

    const newCategory = await res.json();
    const option = document.createElement('option');
    option.value = newCategory.category_id;
    option.textContent = newCategory.category_name;
    categorySelect.appendChild(option);
    categorySelect.value = newCategory.category_id;
    categoryModal.style.display = 'none';
  } catch (err) {
    console.error(err);
    alert("Failed to add category.");
  }
});
