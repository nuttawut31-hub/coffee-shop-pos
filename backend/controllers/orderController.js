const Product = require("../entities/Product");
const ProductOption = require("../entities/ProductOption");
const Order = require("../entities/Order");

// <<control>> OrderController — Business Logic สำหรับจัดการออเดอร์
// ตัดสินใจตามกฎ Use Case 01: รับออเดอร์และคำนวณราคา

/**
 * สร้างออเดอร์ใหม่
 * อ้างอิง: FR-03 (Validate), FR-04 (เลขคิว), FR-05 (คำนวณราคา), FR-06 (ชำระเงิน), FR-07 (ส่งให้บาริสต้า)
 *
 * @param {Object} data - { paymentMethod, items: [{ productId, quantity, size, sweetness, toppings }] }
 */
async function createOrder(data) {
  const { paymentMethod, items, branchId } = data;

  // --- FR-03: Validate ข้อมูลที่จำเป็น ---
  if (!items || !Array.isArray(items) || items.length === 0) {
    return { status: 400, body: { error: "ต้องมีรายการสินค้าอย่างน้อย 1 รายการ" } };
  }

  const validPayments = ["cash", "transfer", "qr"];
  if (!paymentMethod || !validPayments.includes(paymentMethod)) {
    return { status: 400, body: { error: "กรุณาเลือกวิธีชำระเงิน (cash, transfer, qr)" } };
  }

  // --- FR-05: คำนวณราคาแต่ละรายการ ---
  let totalAmount = 0;
  const resolvedItems = [];

  for (const item of items) {
    const {
      productId,
      quantity,
      sizeId,
      sweetnessId,
      toppingIds,
      temperatureId,
      bakeryOptionId,
      temperatureName,
      sizeName,
      sweetnessName,
      toppingNames,
      bakeryOptionName,
    } = item;

    // Validate: ต้องมี productId และ quantity
    if (!productId || !quantity || quantity <= 0) {
      return { status: 400, body: { error: "ข้อมูลรายการสินค้าไม่ถูกต้อง (ต้องระบุ productId และ quantity)" } };
    }

    // ตรวจสอบว่าเมนูมีอยู่จริง
    const product = await Product.findById(productId);
    if (!product) {
      return { status: 404, body: { error: `ไม่พบเมนู id ${productId}` } };
    }

    // ตรวจสอบว่าเป็นขนม/เบเกอรี่หรือไม่
    const isBakery =
      product.category_name === "เบเกอรี่" ||
      product.category_id === 4 ||
      (product.category_name &&
        (product.category_name.includes("ขนม") ||
          product.category_name.includes("อาหาร") ||
          product.category_name.toLowerCase().includes("bakery")));

    // FR-03: ต้องเลือกขนาด (sizeId) เฉพาะสำหรับเครื่องดื่ม (ถ้าเป็นขนมไม่ต้องเลือก)
    if (!isBakery && !sizeId) {
      return { status: 400, body: { error: "กรุณาเลือกขนาดเครื่องดื่ม (sizeId)" } };
    }

    // คำนวณราคา: base_price + ประเภทเครื่องดื่ม (ร้อน/เย็น/ปั่น) + ขนาด + ท็อปปิง
    let unitPrice = product.base_price;

    // 1. ตัวเลือกประเภทเครื่องดื่ม (ร้อน/เย็น/ปั่น)
    if (temperatureId) {
      const tempOption = await ProductOption.findById(temperatureId);
      if (tempOption) {
        unitPrice += tempOption.extra_price;
      }
    }

    // 2. ตัวเลือกขนาดแก้ว (เฉพาะเครื่องดื่ม)
    if (sizeId) {
      const sizeOption = await ProductOption.findById(sizeId);
      if (sizeOption) {
        unitPrice += sizeOption.extra_price;
      }
    }

    // 3. ท็อปปิงเสริม (ถ้ามี)
    if (toppingIds && toppingIds.length > 0) {
      const toppings = await ProductOption.findByIds(toppingIds);
      for (const topping of toppings) {
        unitPrice += topping.extra_price;
      }
    }

    // 4. ตัวเลือกเบเกอรี่ (ถ้ามี)
    if (bakeryOptionId) {
      const bakeryOpt = await ProductOption.findById(bakeryOptionId);
      if (bakeryOpt) {
        unitPrice += bakeryOpt.extra_price;
      }
    }

    const subtotal = unitPrice * quantity;
    totalAmount += subtotal;

    // เก็บข้อมูลตัวเลือกเป็น JSON ครบถ้วน
    const optionsJson = JSON.stringify({
      temperatureId: temperatureId || null,
      temperatureName: temperatureName || null,
      sizeId: sizeId || null,
      sizeName: sizeName || null,
      sweetnessId: sweetnessId || null,
      sweetnessName: sweetnessName || null,
      toppingIds: toppingIds || [],
      toppingNames: toppingNames || [],
      bakeryOptionId: bakeryOptionId || null,
      bakeryOptionName: bakeryOptionName || null,
      isBakery: !!isBakery,
    });

    resolvedItems.push({
      productId,
      quantity,
      unitPrice,
      subtotal,
      optionsJson,
    });
  }

  // --- FR-04: สร้างเลขออเดอร์และเลขคิวที่ไม่ซ้ำกัน ---
  const lastQueue = await Order.getLastQueueNoToday();
  const queueNo = lastQueue + 1;

  // สร้างเลขออเดอร์: POS-YYYYMMDD-XXXX
  const now = new Date();
  const dateStr = now.getFullYear().toString()
    + String(now.getMonth() + 1).padStart(2, "0")
    + String(now.getDate()).padStart(2, "0");
  const orderNo = `POS-${dateStr}-${String(queueNo).padStart(4, "0")}`;

  // --- บันทึกลง DB ---
  const order = await Order.create({
    branchId: parseInt(branchId, 10) || 1,
    orderNo,
    queueNo,
    totalAmount,
    paymentMethod,
  });

  // บันทึกรายการสินค้า
  for (const item of resolvedItems) {
    await Order.createItem({
      orderId: order.id,
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      optionsJson: item.optionsJson,
    });
  }

  // --- FR-07: ส่งข้อมูลกลับ (หน้าจอบาริสต้าจะ poll จาก GET /api/orders/queue) ---
  return {
    status: 201,
    body: {
      orderId: order.id,
      branchId: order.branchId,
      orderNo: order.orderNo,
      queueNo: order.queueNo,
      totalAmount,
      paymentMethod,
      status: "pending",
    },
  };
}

/**
 * ดึงรายการคิวสำหรับหน้าจอบาริสต้า (รองรับการกรองตามสาขา)
 * อ้างอิง: FR-07, FR-08
 */
async function getQueue(branchId = null) {
  const orders = await Order.findQueue(branchId);
  return { status: 200, body: orders };
}

/**
 * เปลี่ยนสถานะออเดอร์
 * อ้างอิง: FR-08 — ลำดับสถานะ: pending → cooking → ready → completed
 */
async function updateStatus(orderId, newStatus) {
  const validStatuses = ["pending", "cooking", "ready", "completed"];
  if (!validStatuses.includes(newStatus)) {
    return { status: 400, body: { error: `สถานะไม่ถูกต้อง ต้องเป็น: ${validStatuses.join(", ")}` } };
  }

  const order = await Order.findById(orderId);
  if (!order) {
    return { status: 404, body: { error: `ไม่พบออเดอร์ id ${orderId}` } };
  }

  // ตรวจสอบลำดับสถานะ (ห้ามย้อนกลับ)
  const statusOrder = { pending: 0, cooking: 1, ready: 2, completed: 3 };
  if (statusOrder[newStatus] <= statusOrder[order.status]) {
    return { status: 400, body: { error: `ไม่สามารถเปลี่ยนสถานะจาก "${order.status}" เป็น "${newStatus}" ได้` } };
  }

  await Order.updateStatus(orderId, newStatus);
  return { status: 200, body: { id: orderId, status: newStatus } };
}

/**
 * ยกเลิกออเดอร์ — ยกเลิกได้เฉพาะสถานะ pending หรือ cooking เท่านั้น
 * ออเดอร์ที่ ready หรือ completed ไม่สามารถยกเลิกได้
 */
async function cancelOrder(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    return { status: 404, body: { error: `ไม่พบออเดอร์ id ${orderId}` } };
  }

  const cancellable = ["pending", "cooking"];
  if (!cancellable.includes(order.status)) {
    return {
      status: 400,
      body: { error: `ไม่สามารถยกเลิกออเดอร์ที่อยู่ในสถานะ "${order.status}" ได้` },
    };
  }

  await Order.updateStatus(orderId, "cancelled");
  return { status: 200, body: { id: orderId, status: "cancelled", message: "ยกเลิกออเดอร์เรียบร้อยแล้ว" } };
}

/**
 * ดึงรายงานยอดขายและสถิติภาพรวมสำหรับมุมมองเจ้าของร้าน (Owner View)
 * อ้างอิง: FR-05, Use Case 08 (ดูรายงานยอดขาย)
 */
async function getSalesReport(branchId = null) {
  const report = await Order.getSalesReport(branchId);
  return { status: 200, body: report };
}

module.exports = { createOrder, getQueue, updateStatus, cancelOrder, getSalesReport };

