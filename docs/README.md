# 📁 เอกสารโครงการ Coffee Shop POS System

**รายวิชา:** 88734065 การวิเคราะห์และออกแบบระบบ (System Analysis and Design)  
**โครงงาน:** ระบบ POS สำหรับร้านกาแฟ (Coffee Shop POS System)  
**สถาปัตยกรรม:** BCM (Boundary-Control-Entity) Pattern  
**เทคโนโลยี:** React 19 + Vite · Node.js + Express · SQLite / MySQL

---

## 👥 สมาชิกทีม: ทีม 2 คนไทยออกมาบ่งชี้ ฝรั่งออกมาบ่งชู้

| ลำดับ | ชื่อ-นามสกุล          | รหัสนักศึกษา | บทบาท        |
| ----- | --------------------- | ------------ | ------------ |
| 1     | [นายวราวุฒิ จำนงค์ผล] | [67160197]   | Project Lead |
| 2     | [นายณภัทร ทองนาค]     | [67160182]   | Analyst      |
| 3     | [นายปฏิญญา พูลผล]     | [67160016]   | Designer     |
| 4     | [นายณัฐวุฒิ รู้การนา] | [67160028]   | Developer    |
| 5     | [นายธนพล ภู่เพ็ง]     | [67160396]   | Documenter   |

---

## 📋 สารบัญเอกสารตามสัปดาห์

| สัปดาห์  | เอกสาร                                             | ลิงก์                                                                             |
| -------- | -------------------------------------------------- | --------------------------------------------------------------------------------- |
| **wk01** | Team Charter (ข้อตกลงทีม + SDLC)                   | [wk01-team-charter.md](./wk01-team-charter.md)                                    |
| **wk02** | Feasibility Study + BPMN                           | [wk02-feasibility-report.md](./wk02-feasibility-report.md)                        |
| **wk03** | Requirements (FR + NFR + Use Cases)                | [wk03-requirements.md](./wk03-requirements.md)                                  |
| **wk04** | User Stories (INVEST + Use Case Diagram)           | [wk04-user-stories.md](./wk04-user-stories.md)                                  |
| **wk06** | Class Diagram + Object Diagram (BCM)               | [wk06-class-diagram.md](./wk06-class-diagram.md)                                  |
| **wk07** | ER Diagram + Database Schema                       | [wk07-er-diagram.md](./wk07-er-diagram.md) · [wk07-schema.sql](./wk07-schema.sql) |
| **wk09** | Sequence Diagrams (BCM Flow)                       | [sequence-diagrams.md](./sequence-diagrams.md)                                    |
| **wk10** | Wireframe & Input/Output Design                    | [wk10-wireframe.md](./wk10-wireframe.md)                                          |
| **wk10** | Software Requirements Specification (SRS)          | [wk10-srs.md](./wk10-srs.md)                                                      |
| **wk11** | Architecture Diagram (Physical + Development View) | [wk11-architecture.md](./wk11-architecture.md)                                    |
| **wk12** | Usability Testing Report (NFR-03 & SUS Score)      | [wk12-usability-testing.md](./wk12-usability-testing.md)                          |
| **wk13** | System Integration & E2E Testing (TC-01 to TC-08)  | [wk13-test-cases.md](./wk13-test-cases.md)                                        |
| **wk14** | Quality Review & Code Review Checklist             | [wk14-quality-review.md](./wk14-quality-review.md)                                |
| **wk15** | Presentation & Live Demo Guide (สคริปต์นำเสนอ)     | [presentation-guide.md](./presentation-guide.md)                                  |
| **Etc.** | AI Disclosure Form (แบบเปิดเผยการใช้ AI)           | [ai-disclosure.md](./ai-disclosure.md)                                            |

---

## 🚀 วิธีรันระบบ

```bash
# 1. Build Frontend
cd project/frontend
npm install && npm run build

# 2. Start Backend (Port 3000)
cd ../backend
npm install && npm start

# 3. เปิดเว็บ
# http://localhost:3000
```

---

## 📡 REST API Endpoints

| Method   | Endpoint                 | รายละเอียด                                                |
| -------- | ------------------------ | --------------------------------------------------------- |
| `GET`    | `/api/products`          | ดึงเมนูทั้งหมด + ตัวเลือก (Cashier POS View)              |
| `POST`   | `/api/orders`            | สร้างออเดอร์ใหม่ พร้อมคำนวณราคาและออกเลขคิว               |
| `GET`    | `/api/orders/queue`      | ดึงคิวสำหรับบาริสต้า (Barista Queue View)                 |
| `PATCH`  | `/api/orders/:id/status` | อัปเดตสถานะคิว (pending → cooking → ready → completed)    |
| `DELETE` | `/api/orders/:id`        | ยกเลิกออเดอร์                                             |
| `GET`    | `/api/reports/sales`     | ดึงรายงานยอดขาย สถิติ และประวัติออเดอร์ (Owner Dashboard) |
