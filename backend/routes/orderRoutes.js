const express = require("express");
const orderController = require("../controllers/orderController");

// <<boundary>> OrderRoutes — รับ HTTP request แล้วส่งต่อให้ Controller
// ไม่มี Business Logic ในชั้นนี้
const router = express.Router();

/**
 * POST /api/orders
 * รับออเดอร์ใหม่ คำนวณราคา ออกเลขคิว
 * อ้างอิง: FR-03, FR-04, FR-05, FR-06, FR-07
 *
 * Body: { paymentMethod, items: [{ productId, quantity, sizeId, sweetnessId, toppingIds }] }
 */
router.post("/orders", async (req, res) => {
  try {
    const result = await orderController.createOrder(req.body);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("POST /api/orders error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * GET /api/orders/queue
 * ดึงรายการออเดอร์ที่อยู่ในคิว (pending, cooking) สำหรับหน้าจอบาริสต้า
 * อ้างอิง: FR-07, FR-08
 */
router.get("/orders/queue", async (req, res) => {
  try {
    const result = await orderController.getQueue(req.query.branchId);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/orders/queue error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * PATCH /api/orders/:id/status
 * เปลี่ยนสถานะออเดอร์ (pending → cooking → ready → completed)
 * อ้างอิง: FR-08
 *
 * Body: { status: "cooking" | "ready" | "completed" }
 */
router.patch("/orders/:id/status", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const { status } = req.body;
    const result = await orderController.updateStatus(orderId, status);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("PATCH /api/orders/:id/status error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * DELETE /api/orders/:id
 * ยกเลิกออเดอร์ (ได้เฉพาะ pending / cooking)
 */
router.delete("/orders/:id", async (req, res) => {
  try {
    const orderId = parseInt(req.params.id, 10);
    const result = await orderController.cancelOrder(orderId);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("DELETE /api/orders/:id error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * GET /api/reports/sales
 * ดึงรายงานสรุปยอดขาย สถิติตะกร้า และประวัติออเดอร์ สำหรับหน้าจอเจ้าของร้าน (Owner View)
 * อ้างอิง: FR-05, Use Case 08 (ดูรายงานยอดขาย)
 */
router.get("/reports/sales", async (req, res) => {
  try {
    const result = await orderController.getSalesReport(req.query.branchId);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/reports/sales error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

// Alias: GET /api/orders/report
router.get("/orders/report", async (req, res) => {
  try {
    const result = await orderController.getSalesReport(req.query.branchId);
    res.status(result.status).json(result.body);
  } catch (err) {
    console.error("GET /api/orders/report error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

/**
 * GET /api/branches
 * ดึงรายการสาขาทั้งหมด
 */
const Branch = require("../entities/Branch");
router.get("/branches", async (req, res) => {
  try {
    const branches = await Branch.findAll();
    res.status(200).json(branches);
  } catch (err) {
    console.error("GET /api/branches error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดภายในระบบ" });
  }
});

module.exports = router;
