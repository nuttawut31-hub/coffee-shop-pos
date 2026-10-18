# Software Requirements Specification (SRS)

## โครงการ: ระบบจุดขายและจัดการร้านกาแฟ (Coffee Shop POS System)

**รายวิชา:** 88734065 การวิเคราะห์และออกแบบระบบ (System Analysis and Design)  
**ทีมผู้พัฒนา:** ทีม 2 คนไทยออกมาบ่งชี้ ฝรั่งออกมาบ่งชู้  
**เวอร์ชันเอกสาร:** 1.0 (Reverse-engineered & Verified with Implementation)  
**วันที่:** ตุลาคม 2026

---

## 1. บทนำ (Introduction)

### 1.1 วัตถุประสงค์ (Purpose)

เอกสารข้อกำหนดความต้องการระบบซอฟต์แวร์ (Software Requirements Specification - SRS) ฉบับนี้ จัดทำขึ้นเพื่อระบุข้อกำหนดเชิงหน้าที่ (Functional Requirements) และข้อกำหนดที่ไม่ใช่เชิงหน้าที่ (Non-functional Requirements) ของระบบจุดขายร้านกาแฟ (Coffee Shop POS System) อย่างละเอียด โดยเอกสารนี้ได้รับการปรับปรุงแบบย้อนกลับ (Reverse Engineered) ให้สอดคล้องกับระบบซอฟต์แวร์ที่พัฒนาขึ้นจริงในโครงการ

### 1.2 ขอบเขตของระบบ (Scope)

ระบบ Coffee Shop POS ทำหน้าที่จัดการการรับออเดอร์หน้าร้าน การส่งข้อมูลแบบเรียลไทม์ไปยังบาริสต้า และการบริหารคิวการชงเครื่องดื่ม

- **ขอบเขตที่ระบบครอบคลุม (In Scope):**
  - การแสดงรายการเมนูเครื่องดื่มและเบเกอรี่แยกตามหมวดหมู่ พร้อมรูปภาพและราคา
  - การปรับแต่งตัวเลือกสินค้า (Product Options) เช่น ขนาดแก้ว ระดับความหวาน และท็อปปิง
  - การจัดการตะกร้าสินค้า การคำนวณราคารวม ส่วนลด และยอดสุทธิแบบเรียลไทม์
  - การเลือกและบันทึกช่องทางการชำระเงิน (เงินสด, โอนเงิน/PromptPay QR)
  - การออกเลขออเดอร์และเลขคิวอัตโนมัติ (Queue Ticket Generation)
  - หน้าจอแสดงคิวการชงสำหรับบาริสต้า (Barista Queue Screen) พร้อมการปรับปรุงสถานะ (Pending -> In Progress -> Completed)
  - การยกเลิกออเดอร์ในระบบ
- **ขอบเขตที่อยู่นอกเหนือระบบ (Out of Scope):**
  - ระบบภาษีมูลค่าเพิ่มและบัญชีเต็มรูปแบบ (Full Accounting System)
  - ระบบจัดส่งแบบเดลิเวอรี่ผ่านผู้ให้บริการภายนอก (Delivery Rider Integration)
  - ระบบตัดยอดสต็อกวัตถุดิบระดับกรัม/มิลลิลิตรแบบละเอียด (ย้ายเป็นส่วนขยายในอนาคต)

### 1.3 คำจำกัดความและคำย่อ (Definitions & Acronyms)

- **POS (Point of Sale):** จุดรับชำระเงินและสั่งซื้อสินค้าหน้าร้าน
- **BCM Pattern:** สถาปัตยกรรมซอฟต์แวร์แบ่งเป็น Boundary (Routes/Views), Control (Controllers), Entity (Models/Tables)
- **Queue Number:** หมายเลขคิวลำดับการชงเครื่องดื่มประจำวัน เช่น `A-001`, `A-002`
- **SPA (Single Page Application):** เว็บแอปพลิเคชันที่โหลดหน้าเว็บเดียวและทำงานผ่านการเรียก API (React + Vite)
- **REST API:** สถาปัตยกรรมบริการข้อมูลผ่านโปรโตคอล HTTP ด้วยฟอร์แมต JSON

---

## 2. ภาพรวมระบบ (Overall Description)

### 2.1 มุมมองของระบบ (Product Perspective)

ระบบเป็นเว็บแอปพลิเคชันแบบ **Monolithic 3-Tier Layered Architecture** ประกอบด้วย:

1. **Presentation Layer (Frontend):** พัฒนาด้วย React 19 + Vite ทำงานบน Web Browser สำหรับ Cashier และ Barista
2. **Application Logic Layer (Backend):** พัฒนาด้วย Node.js + Express ให้บริการ RESTful API และ Serve Static Files บน Port 3000
3. **Data Layer (Database):** ใช้ฐานข้อมูล SQLite (`cafe_pos.db`) จัดเก็บข้อมูลภายในเครื่องแบบเบ็ดเสร็จ

```
[ Web Browser (Cashier / Barista) ]
               │ HTTP / JSON
               ▼
   [ Express.js REST API (Port 3000) ]
        ├── Routes (Boundary)
        ├── Controllers (Control)
        └── Entities (Entity)
               │ SQL Queries
               ▼
      [ SQLite: cafe_pos.db ]
```

### 2.2 ลักษณะผู้ใช้งาน (User Characteristics)

1. **พนักงานแคชเชียร์ (Cashier):** ผู้ใช้งานหลักหน้าร้าน ใช้งานหน้าจอสัมผัสหรือคอมพิวเตอร์เพื่อเลือกเมนูและรับเงิน
2. **บาริสต้า (Barista):** ผู้ปฏิบัติงานในโซนชงเครื่องดื่ม ดูรายการคำสั่งซื้อผ่านแท็บเล็ต/มอนิเตอร์ และกดเปลี่ยนสถานะเมื่อเครื่องดื่มพร้อมเสิร์ฟ
3. **ผู้จัดการ/เจ้าของร้าน (Owner/Manager):** ตรวจสอบประวัติการขายและภาพรวมคิวในร้าน

### 2.3 ข้อจำกัดของระบบ (General Constraints)

- ระบบต้องสามารถรันและทดสอบได้บนเครื่องเดี่ยว (Standalone Development Environment) โดยใช้ Port 3000
- ฐานข้อมูลต้องพร้อมใช้งานทันทีโดยไม่ต้องติดตั้ง Database Server ภายนอกขนาดใหญ่ (ใช้ Embedded SQLite พร้อม Auto-migration & Seed Data)

---

## 3. ข้อกำหนดส่วนต่อประสานภายนอก (External Interface Requirements)

### 3.1 ส่วนต่อประสานกับผู้ใช้ (User Interfaces)

- **UI-01 (Cashier POS View):**
  - ด้านซ้าย: Header ค้นหา, แถบหมวดหมู่ (Coffee, Tea, Milk, Bakery), Grid แสดงการ์ดสินค้าพร้อมรูปภาพและราคา
  - ด้านขวา: Summary Panel ตะกร้าสินค้า แสดงรายการที่เลือก, ตัวเลือกย่อย, จำนวน, ราคารวม, ปุ่ม Clear Cart และปุ่ม "สั่งซื้อ / ชำระเงิน"
  - Modal: หน้าต่างปรับแต่งตัวเลือก (Option Modal) และหน้าต่างเลือกวิธีชำระเงิน (Payment Modal)
- **UI-02 (Barista View):**
  - แสดงรายการ Ticket คิวเครื่องดื่มแบบ Kanban Cards จัดเรียงตามเวลาที่สั่ง
  - แต่ละ Ticket ระบุ: เลขคิว, เวลารอ, รายการเครื่องดื่มพร้อม Option หวาน/ขนาด/ท็อปปิง
  - ปุ่ม Action: "เริ่มทำ (In Progress)", "เสร็จสิ้น (Ready/Complete)"
- **UI-03 (Owner Dashboard View):**
  - แสดงการ์ด KPI ยอดขายวันนี้, ยอดขายสะสม, คิวที่กำลังทำ, และบิลที่เสร็จสิ้น
  - รายงาน 5 อันดับเมนูขายดีที่สุด (Top Selling Products) พร้อมแถบสัดส่วน
  - สรุปสัดส่วนยอดขายตามช่องทางชำระเงิน (Cash, QR Payment, Bank Transfer)
  - ตารางประวัติออเดอร์ย้อนหลังแบบเรียลไทม์ พร้อมค้นหาและ Filter ตามสถานะ

### 3.2 ส่วนต่อประสานซอฟต์แวร์ (Software Interfaces - RESTful API)

| Method   | Endpoint                 | คำอธิบาย                                                       | Request Body                                | Response                  |
| -------- | ------------------------ | -------------------------------------------------------------- | ------------------------------------------- | ------------------------- |
| `GET`    | `/api/products`          | ดึงข้อมูลสินค้าทั้งหมดพร้อมตัวเลือก                            | None                                        | Array of Product Objects  |
| `POST`   | `/api/products`          | เพิ่มเมนูสินค้าใหม่ (เจ้าของร้าน)                              | `{ name, categoryId, basePrice, imageUrl }` | Created Product Object    |
| `PUT`    | `/api/products/:id`      | แก้ไขเมนูและราคา (เจ้าของร้าน)                                 | `{ name, categoryId, basePrice, imageUrl }` | Updated Product Object    |
| `DELETE` | `/api/products/:id`      | ลบเมนูสินค้า (Soft Delete)                                     | None                                        | Success Confirmation      |
| `GET`    | `/api/categories`        | ดึงรายการหมวดหมู่สินค้าทั้งหมด                                 | None                                        | Array of Category Objects |
| `GET`    | `/api/branches`          | ดึงรายการสาขาของร้านทั้งหมด (3 สาขา)                           | None                                        | Array of Branch Objects   |
| `POST`   | `/api/orders`            | บันทึกการสั่งซื้อใหม่ (รองรับ branchId)                        | `{ items, paymentMethod, branchId }`        | Created Order + Queue No. |
| `GET`    | `/api/orders/queue`      | ดึงรายการคิวที่ยังไม่เสร็จสิ้น (กรองตาม branchId ได้)          | Query: `?branchId=...`                      | Array of Active Orders    |
| `PATCH`  | `/api/orders/:id/status` | อัปเดตสถานะการทำคิว                                            | `{ status }`                                | Updated Order Status      |
| `DELETE` | `/api/orders/:id`        | ยกเลิกออเดอร์ (pending / cooking)                              | None                                        | Success Confirmation      |
| `GET`    | `/api/reports/sales`     | ดึงรายงานสรุปยอดขาย สถิติ และประวัติออเดอร์ (กรองตาม branchId) | Query: `?branchId=...`                      | Sales Report Object       |

---

## 4. ข้อกำหนดเชิงหน้าที่ (Functional Requirements)

| รหัส      | ข้อกำหนด (Functional Requirement)                                                                                                                | การนำไปใช้งานจริงในระบบ (Implementation Details)                                                                |  สถานะ  |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | :-----: |
| **FR-01** | **การแสดงรายการสินค้าและราคา**<br>ระบบต้องแสดงรายการสินค้าทั้งหมดที่เปิดจำหน่าย โดยแบ่งตามหมวดหมู่ พร้อมรูปภาพ ชื่อ และราคาเริ่มต้น              | Backend: `GET /api/products`<br>Frontend: `CategoryTabs.jsx`, `ProductGrid.jsx`, `ProductCard.jsx`              | ✅ ผ่าน |
| **FR-02** | **การเลือกขนาด ความหวาน และท็อปปิง**<br>ระบบต้องอนุญาตให้เลือกขนาด (S/M/L), ความหวาน (0%, 25%, 50%, 100%), และท็อปปิงเสริม (ไข่มุก, วิปครีม ฯลฯ) | ตาราง: `product_options`<br>Frontend: `CustomizationModal.jsx`<br>คำนวณราคา Option เสริมใน Entity               | ✅ ผ่าน |
| **FR-03** | **การตรวจสอบความถูกต้องก่อนยืนยันออเดอร์**<br>ระบบต้องตรวจสอบว่ามีสินค้าในตะกร้าอย่างน้อย 1 รายการ และมีการเลือกตัวเลือกครบถ้วนก่อนยืนยัน        | Frontend: Disable ปุ่มสั่งซื้อเมื่อตะกร้าว่าง<br>Backend: ตรวจสอบ Payload ใน `orderController.js`               | ✅ ผ่าน |
| **FR-04** | **การจัดการเมนูสินค้าและราคา (เจ้าของร้าน)**<br>ระบบต้องให้เจ้าของร้านสามารถเพิ่มเมนูใหม่ แก้ไขชื่อ/ราคา ลบเมนู และใส่รูปภาพเมนูได้              | Backend: `POST/PUT/DELETE /api/products`<br>Frontend: `MenuManager.jsx`, Modal ฟอร์มพร้อม Live Image Preview    | ✅ ผ่าน |
| **FR-05** | **การคำนวณราคารวมและยอดสุทธิอัตโนมัติ**<br>ระบบต้องคำนวณยอดรวมจาก (ราคาฐาน + ผลรวมราคา Option) × จำนวนชิ้น อัปเดตทันทีเมื่อแก้ไขตะกร้า           | ฟังก์ชัน `calculateTotal()` ใน `CartSidebar.jsx` และตรวจเช็กความถูกต้องอีกครั้งฝั่ง Backend Entity              | ✅ ผ่าน |
| **FR-06** | **การบันทึกช่องทางการชำระเงินและออกเลขคิว**<br>ระบบต้องรองรับการเลือกชำระเงิน (Cash, PromptPay QR, โอนเงิน) และออกเลขคิวรันต่อเนื่องอัตโนมัติ    | Frontend: `CartSidebar.jsx`, `ReceiptModal.jsx`<br>Database: บันทึกในฟิลด์ `orders.payment_method`, `queue_no`  | ✅ ผ่าน |
| **FR-07** | **การส่งข้อมูลออเดอร์ไปยังบาริสต้า**<br>เมื่อชำระเงินเสร็จสิ้น ข้อมูลออเดอร์พร้อมรายละเอียดตัวเลือกการชง ต้องปรากฏบนหน้าจอบาริสต้าทันที          | Backend: `GET /api/orders/queue`<br>Frontend: `BaristaView.jsx`, `QueueCard.jsx`                                | ✅ ผ่าน |
| **FR-08** | **การปรับปรุงสถานะออเดอร์โดยบาริสต้า**<br>บาริสต้าต้องสามารถปรับสถานะคิวเป็น `pending` → `cooking` → `ready` → `completed` หรือยกเลิกออเดอร์ได้  | Backend: `PATCH /api/orders/:id/status`, `DELETE /api/orders/:id`<br>Frontend: `QueueCard.jsx` Action Buttons   | ✅ ผ่าน |
| **FR-09** | **การสลับสาขาและการดูรายงานแยกสาขา (Multi-Branch)**<br>ระบบต้องมีตัวเลือกสลับสาขา (3 สาขา) และแยกคิว/รายงานยอดขายตามสาขาที่เลือกได้              | Backend: `GET /api/branches`, `orders.branch_id`<br>Frontend: `Navbar.jsx` Switcher, `BaristaView`, `OwnerView` | ✅ ผ่าน |

---

## 5. ข้อกำหนดที่ไม่ใช่เชิงหน้าที่ (Non-Functional Requirements)

### 5.1 ประสิทธิภาพ (Performance - NFR-01, NFR-02)

- **NFR-01 (Response Time):** การเปิดหน้ารับออเดอร์และโหลดข้อมูลเมนูทั้งหมด ต้องใช้เวลาไม่เกิน 2 วินาที (ผลการทดสอบจริง: ใช้เวลาเฉลี่ย ~350-500 ms)
- **NFR-02 (Queue Dispatch Time):** หลังการกดยืนยันออเดอร์ ข้อมูลต้องเข้าสู่คิวบาริสต้าภายใน 5 วินาที (ผลการทดสอบจริง: ประมวลผลและตอบกลับภายใน < 1 วินาที)

### 5.2 ความง่ายในการใช้งาน (Usability - NFR-03)

- **NFR-03 (Ease of Use):** แคชเชียร์ใหม่ต้องสามารถเรียนรู้และสร้างออเดอร์สำเร็จอย่างน้อย 4 ใน 5 ครั้ง หลังรับการแนะนำไม่เกิน 5 นาที (ผลการทดสอบ Usability Test ได้คะแนน SUS = 87.5 ระดับ Excellent)

### 5.3 ความเข้ากันได้ของอุปกรณ์ (Portability & Responsive - NFR-04)

- **NFR-04 (Cross-Device Compatibility):** ระบบต้องรองรับการแสดงผลบนแท็บเล็ตและหน้าจอคอมพิวเตอร์ที่มีความกว้างตั้งแต่ 768px ขึ้นไปอย่างเหมาะสม

### 5.4 ความปลอดภัยและความสมบูรณ์ของข้อมูล (Security & Integrity)

- การบันทึกออเดอร์และรายการสินค้าย่อยใช้ Database Transaction เพื่อป้องกันปัญหาข้อมูลกำพร้าหรือบันทึกไม่สมบูรณ์ (Atomic Transaction)

---

## 6. เมทริกซ์การติดตามความต้องการ (Traceability Matrix)

| Requirement | Use Case | UI Component                          | Controller / Route                         | Database Table           |
| ----------- | -------- | ------------------------------------- | ------------------------------------------ | ------------------------ |
| **FR-01**   | UC-01    | `ProductGrid.jsx`, `CategoryTabs.jsx` | `productController.js` (`/api/products`)   | `products`, `categories` |
| **FR-02**   | UC-02    | `CustomizationModal.jsx`              | `productController.js`                     | `product_options`        |
| **FR-03**   | UC-01    | `CartSidebar.jsx`                     | `orderController.js` (Validate)            | -                        |
| **FR-04**   | UC-07    | `MenuManager.jsx`                     | `productController.js` (`POST/PUT/DELETE`) | `products`               |
| **FR-05**   | UC-01    | `CartSidebar.jsx`, `ReceiptModal.jsx` | `Order.js` (`calculateTotal`)              | `order_items`            |
| **FR-06**   | UC-03    | `ReceiptModal.jsx`                    | `orderController.js` (`createOrder`)       | `orders.payment_method`  |
| **FR-07**   | UC-04    | `BaristaView.jsx`                     | `orderController.js` (`/api/orders/queue`) | `orders`, `order_items`  |
| **FR-08**   | UC-04    | `QueueCard.jsx`                       | `orderController.js` (`updateStatus`)      | `orders.status`          |
| **FR-09**   | UC-06    | `Navbar.jsx`, `OwnerView.jsx`         | `orderRoutes.js` (`/api/branches`)         | `branches`               |
