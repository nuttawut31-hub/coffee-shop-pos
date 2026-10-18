const db = require("../db");

// <<entity>> Order — ติดต่อฐานข้อมูลตาราง orders และ order_items
// ไม่มี Business Logic (การคำนวณราคา, Validation) ในชั้นนี้
class Order {
  /**
   * ดึงเลขคิวล่าสุดของวันนี้ เพื่อให้ Controller ใช้สร้างเลขคิวถัดไป
   * อ้างอิง: FR-04
   */
  static async getLastQueueNoToday() {
    const row = await db.get(`
      SELECT MAX(queue_no) AS last_queue
      FROM orders
      WHERE DATE(created_at) = DATE('now','localtime')
    `);
    return row ? row.last_queue || 0 : 0;
  }

  /**
   * บันทึกหัวออเดอร์ (รองรับ branchId)
   */
  static async create({ branchId = 1, orderNo, queueNo, totalAmount, paymentMethod }) {
    const result = await db.run(
      `INSERT INTO orders (branch_id, order_no, queue_no, total_amount, payment_method, status)
       VALUES (?, ?, ?, ?, ?, 'pending')`,
      [branchId || 1, orderNo, queueNo, totalAmount, paymentMethod],
    );
    return { id: result.lastID, branchId: branchId || 1, orderNo, queueNo };
  }

  /**
   * บันทึกรายการสินค้าในออเดอร์
   */
  static async createItem({
    orderId,
    productId,
    quantity,
    unitPrice,
    subtotal,
    optionsJson,
  }) {
    return db.run(
      `INSERT INTO order_items (order_id, product_id, quantity, unit_price, subtotal, options_json)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [orderId, productId, quantity, unitPrice, subtotal, optionsJson || "{}"],
    );
  }

  /**
   * ดึงออเดอร์ที่อยู่ในคิว (pending, cooking) สำหรับหน้าจอบาริสต้า
   * รองรับการกรองตาม branchId หรือดูรวมทั้งหมด
   * อ้างอิง: FR-07, FR-08
   */
  static async findQueue(branchId = null) {
    let query = `
      SELECT o.id, o.branch_id, b.name AS branch_name, o.order_no, o.queue_no,
             o.total_amount, o.payment_method, o.status, o.created_at
      FROM orders o
      LEFT JOIN branches b ON b.id = o.branch_id
      WHERE o.status IN ('pending', 'cooking', 'ready')
    `;
    const params = [];
    if (branchId && branchId !== "all") {
      query += ` AND o.branch_id = ? `;
      params.push(parseInt(branchId, 10));
    }
    query += ` ORDER BY o.queue_no ASC `;

    const orders = await db.all(query, params);

    // ดึง items ของแต่ละออเดอร์
    for (const order of orders) {
      order.items = await db.all(
        `
        SELECT oi.id, oi.product_id, p.name AS product_name,
               oi.quantity, oi.unit_price, oi.subtotal, oi.options_json
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
      `,
        [order.id],
      );
    }

    return orders;
  }

  /**
   * ดึงออเดอร์ตาม ID
   */
  static async findById(id) {
    return db.get("SELECT * FROM orders WHERE id = ?", [id]);
  }

  /**
   * อัปเดตสถานะออเดอร์
   * อ้างอิง: FR-08
   */
  static async updateStatus(id, status) {
    return db.run("UPDATE orders SET status = ? WHERE id = ?", [status, id]);
  }

  /**
   * ดึงข้อมูลรายงานยอดขายและสถิติสำหรับหน้าจอเจ้าของร้าน (Owner View)
   * รองรับการดูรวมทุกสาขา หรือแยกตาม branchId
   * อ้างอิง: FR-05, Use Case 08 (ดูรายงานยอดขาย)
   */
  static async getSalesReport(branchId = null) {
    const branches = await db.all("SELECT * FROM branches ORDER BY id ASC");
    const isFiltered = branchId && branchId !== "all" && branchId !== "undefined";
    const bId = isFiltered ? parseInt(branchId, 10) : null;

    const branchFilter = isFiltered ? "AND branch_id = ?" : "";
    const branchParams = isFiltered ? [bId] : [];

    const todayRow = await db.get(
      `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS today_sales,
        COUNT(*) AS today_orders
      FROM orders 
      WHERE DATE(created_at) = DATE('now', 'localtime') AND status != 'cancelled' ${branchFilter}
    `,
      branchParams,
    );

    const allTimeRow = await db.get(
      `
      SELECT 
        COALESCE(SUM(total_amount), 0) AS total_sales,
        COUNT(*) AS total_orders,
        COALESCE(AVG(total_amount), 0) AS avg_order_value
      FROM orders
      WHERE status != 'cancelled' ${branchFilter}
    `,
      branchParams,
    );

    const statusRows = await db.all(
      `
      SELECT status, COUNT(*) AS count 
      FROM orders 
      WHERE 1=1 ${branchFilter}
      GROUP BY status
    `,
      branchParams,
    );
    const statusMap = { pending: 0, cooking: 0, ready: 0, completed: 0, cancelled: 0 };
    (statusRows || []).forEach((r) => {
      statusMap[r.status] = r.count;
    });

    const paymentRows = await db.all(
      `
      SELECT payment_method, COUNT(*) AS count, COALESCE(SUM(total_amount), 0) AS total
      FROM orders
      WHERE status != 'cancelled' ${branchFilter}
      GROUP BY payment_method
    `,
      branchParams,
    );

    const orderBranchFilter = isFiltered ? "AND o.branch_id = ?" : "";
    const topProducts = await db.all(
      `
      SELECT 
        p.id, p.name, p.image_url, c.name AS category_name,
        SUM(oi.quantity) AS total_qty,
        SUM(oi.subtotal) AS total_revenue
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      LEFT JOIN categories c ON c.id = p.category_id
      JOIN orders o ON o.id = oi.order_id
      WHERE o.status != 'cancelled' ${orderBranchFilter}
      GROUP BY p.id
      ORDER BY total_qty DESC
      LIMIT 5
    `,
      branchParams,
    );

    const recentOrders = await db.all(
      `
      SELECT o.id, o.branch_id, b.name AS branch_name, o.order_no, o.queue_no,
             o.total_amount, o.payment_method, o.status, o.created_at
      FROM orders o
      LEFT JOIN branches b ON b.id = o.branch_id
      WHERE 1=1 ${orderBranchFilter}
      ORDER BY o.id DESC
      LIMIT 50
    `,
      branchParams,
    );

    for (const order of recentOrders) {
      order.items = await db.all(
        `
        SELECT oi.id, oi.product_id, p.name AS product_name,
               oi.quantity, oi.unit_price, oi.subtotal, oi.options_json
        FROM order_items oi
        JOIN products p ON p.id = oi.product_id
        WHERE oi.order_id = ?
      `,
        [order.id],
      );
    }

    return {
      selectedBranchId: branchId || "all",
      branches: branches || [],
      today: {
        sales: todayRow ? todayRow.today_sales : 0,
        orders: todayRow ? todayRow.today_orders : 0,
      },
      allTime: {
        sales: allTimeRow ? allTimeRow.total_sales : 0,
        orders: allTimeRow ? allTimeRow.total_orders : 0,
        avgOrderValue: allTimeRow ? Math.round(allTimeRow.avg_order_value) : 0,
      },
      queueStats: {
        active: (statusMap.pending || 0) + (statusMap.cooking || 0) + (statusMap.ready || 0),
        completed: statusMap.completed || 0,
        cancelled: statusMap.cancelled || 0,
        pending: statusMap.pending || 0,
        cooking: statusMap.cooking || 0,
        ready: statusMap.ready || 0,
      },
      paymentBreakdown: paymentRows || [],
      topProducts: topProducts || [],
      recentOrders: recentOrders || [],
    };
  }
}

module.exports = Order;
