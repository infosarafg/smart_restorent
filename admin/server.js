// server.js (مصحّح ومُحسّن)
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// ----- إعدادات أساسية -----
app.use(cors());
app.use(express.json({ limit: "2mb" })); // نستعمل express.json بدل body-parser
app.use(express.urlencoded({ extended: true }));

// تأكد من وجود مجلد uploads
const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
app.use("/uploads", express.static(UPLOADS_DIR));

// ----- إعداد multer لتحميل الصور -----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // قبول الصور فقط
    const allowed = /jpeg|jpg|png|gif/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error("Only image files are allowed (jpeg,jpg,png,gif)"));
  },
});

// ----- اتصال PostgreSQL -----
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "restaurant_db",
  password: "sara",
  port: 5432,
});

/* ============================
   API: Meals (وجبات)
   ============================ */

// جلب كل الوجبات
app.get("/api/meals", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM meals ORDER BY meal_id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/meals:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// إضافة وجبة (مع صورة اختيارية)
app.post("/api/meals", upload.single("image"), async (req, res) => {
  try {
    const { name, description, price, meal_type } = req.body;
    if (!name || !price) return res.status(400).json({ error: "name and price are required" });

    const priceNum = Number(price);
    if (isNaN(priceNum)) return res.status(400).json({ error: "price must be a number" });

    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await pool.query(
      "INSERT INTO meals (name, description, price, meal_type, image_url) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [name, description || null, priceNum, meal_type || null, image_url]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/meals:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// تعديل وجبة
app.put("/api/meals/:id", upload.single("image"), async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const { name, description, price, meal_type } = req.body;
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;

    let query, params;
    if (image_url) {
      query = "UPDATE meals SET name=$1, description=$2, price=$3, meal_type=$4, image_url=$5 WHERE meal_id=$6 RETURNING *";
      params = [name, description || null, Number(price), meal_type || null, image_url, id];
    } else {
      query = "UPDATE meals SET name=$1, description=$2, price=$3, meal_type=$4 WHERE meal_id=$5 RETURNING *";
      params = [name, description || null, Number(price), meal_type || null, id];
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "meal not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/meals/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// حذف وجبة
app.delete("/api/meals/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    await pool.query("DELETE FROM meals WHERE meal_id=$1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /api/meals/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   API: Customers (زبائن)
   ============================ */

// جلب كل الزبائن (النسخة الأصلية)
app.get("/api/customers", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM customers ORDER BY customer_id DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/customers:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// إضافة زبون
app.post("/api/customers", async (req, res) => {
  try {
    const { first_name, last_name, email, phone, address } = req.body;
    if (!first_name) return res.status(400).json({ error: "first_name is required" });

    const result = await pool.query(
      "INSERT INTO customers (first_name, last_name, email, phone, address) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [first_name, last_name || null, email || null, phone || null, address || null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/customers:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// تعديل زبون
app.put("/api/customers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const { first_name, last_name, email, phone, address } = req.body;
    const result = await pool.query(
      "UPDATE customers SET first_name=$1, last_name=$2, email=$3, phone=$4, address=$5 WHERE customer_id=$6 RETURNING *",
      [first_name, last_name || null, email || null, phone || null, address || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "customer not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/customers/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// حذف زبون
app.delete("/api/customers/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    await pool.query("DELETE FROM customers WHERE customer_id=$1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /api/customers/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   API: Orders (طلبات)
   ============================ */

// جلب كل الطلبات مع معلومات الزبون والوجبة
app.get("/api/orders", async (req, res) => {
  try {
    const q = `
      SELECT
        o.order_id,
        o.customer_id,
        c.first_name AS customer_first_name,
        c.last_name  AS customer_last_name,
        o.meal_id,
        m.name AS meal_name,
        o.quantity,
        o.price,
        o.status,
        o.order_datetime
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN meals m ON o.meal_id = m.meal_id
      ORDER BY o.order_datetime DESC
    `;
    const result = await pool.query(q);
    const rows = result.rows.map(r => ({
      order_id: r.order_id,
      customer_id: r.customer_id,
      customer_name: `${r.customer_first_name || ""} ${r.customer_last_name || ""}`.trim(),
      meal_id: r.meal_id,
      meal_name: r.meal_name,
      quantity: Number(r.quantity),
      price: Number(r.price),
      total: r.price != null ? Number(r.price) * (Number(r.quantity) || 1) : null,
      status: r.status,
      order_datetime: r.order_datetime,
    }));
    res.json(rows);
  } catch (err) {
    console.error("GET /api/orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// إضافة طلب
app.post("/api/orders", async (req, res) => {
  try {
    let { customer_id, meal_id, quantity, price, status } = req.body;
    customer_id = Number(customer_id);
    meal_id = Number(meal_id);
    quantity = Number(quantity) || 1;
    price = price != null ? Number(price) : null;
    status = status || "pending";

    if (!customer_id || !meal_id) return res.status(400).json({ error: "customer_id and meal_id are required" });

    const result = await pool.query(
      `INSERT INTO orders (customer_id, meal_id, quantity, price, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [customer_id, meal_id, quantity, price, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// تعديل طلب
app.put("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    const fields = [];
    const params = [];
    let idx = 1;
    const updatable = ["customer_id", "meal_id", "quantity", "price", "status"];
    updatable.forEach(key => {
      if (req.body[key] !== undefined) {
        fields.push(`${key}=$${idx++}`);
        if (key === "customer_id" || key === "meal_id" || key === "quantity") params.push(Number(req.body[key]));
        else if (key === "price") params.push(req.body[key] != null ? Number(req.body[key]) : null);
        else params.push(req.body[key]);
      }
    });

    if (fields.length === 0) return res.status(400).json({ error: "no updatable fields provided" });

    const query = `UPDATE orders SET ${fields.join(", ")} WHERE order_id=$${idx} RETURNING *`;
    params.push(id);

    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: "order not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error("PUT /api/orders/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// حذف طلب
app.delete("/api/orders/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "invalid id" });

    await pool.query("DELETE FROM orders WHERE order_id=$1", [id]);
    res.sendStatus(204);
  } catch (err) {
    console.error("DELETE /api/orders/:id:", err);
    res.status(500).json({ error: "Server error" });
  }
});
/* ============================
   API: Tables (طاولات)
============================ */

app.get("/api/tables", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tables ORDER BY table_id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("GET /api/tables:", err);
    res.status(500).json({ error: "Server error" });
  }
});
app.post("/api/reservations", async (req, res) => {
  try {
    const { customer_id, table_id, reservation_datetime, notes } = req.body;

    if (!customer_id || !table_id || !reservation_datetime) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const result = await pool.query(
      `INSERT INTO reservations (customer_id, table_id, reservation_datetime, notes)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [customer_id, table_id, reservation_datetime, notes || null]
    );

    // تحديث حالة الطاولة إلى "reserved"
    await pool.query(
      "UPDATE tables SET status='reserved' WHERE table_id=$1",
      [table_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("POST /api/reservations:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ============================
   API جديد: الزبائن مع الطلبات
   للصفحة التي تحتاج كل الطلبات لكل زبون
   ============================ */
app.get("/api/customers-with-orders", async (req, res) => {
  try {
    const custResult = await pool.query("SELECT * FROM customers ORDER BY customer_id DESC");
    const customers = custResult.rows;

    for (let cust of customers) {
      const ordersResult = await pool.query(
        `SELECT o.order_id, m.name AS meal, o.price, o.quantity, o.order_datetime
         FROM orders o
         LEFT JOIN meals m ON o.meal_id = m.meal_id
         WHERE o.customer_id = $1
         ORDER BY o.order_datetime DESC`,
        [cust.customer_id]
      );

      cust.orders = ordersResult.rows.map(o => ({
        meal: o.meal,
        price: Number(o.price),
        quantity: Number(o.quantity),
        order_date: o.order_datetime.toISOString().split('T')[0],
        order_time: o.order_datetime.toISOString().split('T')[1].substring(0,5)
      }));
    }

    res.json(customers);
  } catch (err) {
    console.error("GET /api/customers-with-orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

/* ---------------------------
   تشغيل السيرفر
   --------------------------- */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔥 Server running on http://localhost:${PORT}`));
