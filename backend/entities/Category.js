const db = require("../db");

// <<entity>> Category — ติดต่อฐานข้อมูลตาราง categories
class Category {
  static async findAll() {
    return db.all("SELECT id, name, sort_order FROM categories ORDER BY sort_order, id");
  }

  static async findById(id) {
    return db.get("SELECT id, name, sort_order FROM categories WHERE id = ?", [id]);
  }
}

module.exports = Category;
