const db = require("../db");

// <<entity>> Branch — ติดต่อฐานข้อมูลตาราง branches
class Branch {
  static async findAll() {
    return db.all("SELECT id, name, address FROM branches ORDER BY id ASC");
  }

  static async findById(id) {
    return db.get("SELECT id, name, address FROM branches WHERE id = ?", [id]);
  }
}

module.exports = Branch;
