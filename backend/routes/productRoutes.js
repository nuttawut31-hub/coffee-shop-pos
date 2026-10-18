const express = require("express");
const fs = require("fs");
const path = require("path");
const productController = require("../controllers/productController");

// <<boundary>> ProductRoutes — รับ HTTP request แล้วส่งต่อให้ Controller
// ไม่มี Business Logic ในชั้นนี้
const router = express.Router();

/**
 * POST /api/upload
 * อัปโหลดรูปภาพสินค้า (รับ base64 data URL) แล้วบันทึกลงโฟลเดอร์ uploads
 */
router.post("/upload", async (req, res) => {
  try {
    const data = req.body.data || req.body.image;
    if (!data) {
      return res.status(400).json({ error: "ไม่พบข้อมูลรูปภาพที่อัปโหลด" });
    }

    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = "png";

    if (matches && matches.length === 3) {
      const mime = matches[1].toLowerCase();
      if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("gif")) ext = "gif";
      else ext = "png";
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(data, "base64");
    }

    const filename = `menu-${Date.now()}-${Math.floor(Math.random() * 10000)}.${ext}`;

    // บันทึกลง backend/public/uploads
    const backendDir = path.join(__dirname, "../public/uploads");
    await fs.promises.mkdir(backendDir, { recursive: true });
    await fs.promises.writeFile(path.join(backendDir, filename), buffer);

    // คัดลอกลง frontend/public/uploads เพื่อรองรับ vite dev server
    try {
      const frontendDir = path.join(__dirname, "../../frontend/public/uploads");
      await fs.promises.mkdir(frontendDir, { recursive: true });
      await fs.promises.writeFile(path.join(frontendDir, filename), buffer);
    } catch (e) {
      // ignore
    }

    const publicUrl = `/uploads/${filename}`;
    res.status(200).json({ url: publicUrl, success: true });
  } catch (err) {
    console.error("POST /api/upload error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการบันทึกรูปภาพ" });
  }
});

/**
 * GET /api/products
 * ดึงเมนูทั้งหมดที่เปิดขาย จัดกลุ่มตามหมวดหมู่ พร้อมตัวเลือก
 * อ้างอิง: FR-01, FR-02
 */
router.get("/products", async (req, res) => {
  try {
    const result = await productController.listProducts();
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/products error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * GET /api/categories
 * ดึงรายการหมวดหมู่ทั้งหมด
 */
router.get("/categories", async (req, res) => {
  try {
    const result = await productController.listCategories();
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/categories error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * POST /api/products
 * เพิ่มเมนูใหม่ (สำหรับเจ้าของร้าน)
 * อ้างอิง: Use Case 07, FR-04
 */
router.post("/products", async (req, res) => {
  try {
    const result = await productController.createProduct(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("POST /api/products error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * PUT /api/products/:id
 * แก้ไขเมนูและราคา (สำหรับเจ้าของร้าน)
 * อ้างอิง: Use Case 07, FR-04
 */
router.put("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const result = await productController.updateProduct(productId, req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("PUT /api/products/:id error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * DELETE /api/products/:id
 * ลบเมนู (สำหรับเจ้าของร้าน)
 * อ้างอิง: Use Case 07, FR-04
 */
router.delete("/products/:id", async (req, res) => {
  try {
    const productId = parseInt(req.params.id, 10);
    const result = await productController.deleteProduct(productId);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("DELETE /api/products/:id error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

module.exports = router;
