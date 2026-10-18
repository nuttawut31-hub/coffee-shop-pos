const Product = require("../entities/Product");
const ProductOption = require("../entities/ProductOption");
const Category = require("../entities/Category");

// <<control>> ProductController — Business Logic สำหรับจัดการเมนูสินค้า
// อ้างอิง: FR-01 (แสดงเมนู), FR-02 (ตัวเลือกขนาด/หวาน/ท็อปปิง)

/**
 * ดึงเมนูทั้งหมดที่เปิดขาย จัดกลุ่มตามหมวดหมู่ พร้อมตัวเลือก
 * ตอบกลับ { categories: [...], options: { size: [...], sweetness: [...], topping: [...] } }
 */
async function listProducts() {
  const allCategories = await Category.findAll();
  const products = await Product.findAllActive();
  const allOptions = await ProductOption.findAll();

  // จัดกลุ่มเมนูตามหมวดหมู่ทั้งหมด
  const categoryMap = {};
  for (const cat of allCategories) {
    categoryMap[cat.id] = {
      id: cat.id,
      name: cat.name,
      products: [],
    };
  }

  for (const product of products) {
    if (!categoryMap[product.category_id]) {
      categoryMap[product.category_id] = {
        id: product.category_id,
        name: product.category_name,
        products: [],
      };
    }
    categoryMap[product.category_id].products.push({
      id: product.id,
      category_id: product.category_id,
      category_name: product.category_name,
      name: product.name,
      base_price: product.base_price,
      image_url: product.image_url,
    });
  }

  // จัดกลุ่มตัวเลือกตามประเภท
  const options = {};
  for (const opt of allOptions) {
    if (!options[opt.option_type]) {
      options[opt.option_type] = [];
    }
    options[opt.option_type].push({
      id: opt.id,
      name: opt.name,
      extra_price: opt.extra_price,
    });
  }

  return {
    status: 200,
    body: {
      categories: Object.values(categoryMap),
      options,
    },
  };
}

/**
 * เพิ่มเมนูใหม่
 * อ้างอิง: Use Case 07, FR-04
 */
async function createProduct(data) {
  const { categoryId, name, basePrice, imageUrl } = data;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return { status: 400, body: { error: "กรุณาระบุชื่อเมนู" } };
  }

  const price = parseInt(basePrice, 10);
  if (isNaN(price) || price < 0) {
    return { status: 400, body: { error: "ราคาฐานต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0" } };
  }

  const catId = parseInt(categoryId, 10);
  if (isNaN(catId) || catId <= 0) {
    return { status: 400, body: { error: "กรุณาเลือกหมวดหมู่สินค้า" } };
  }

  const created = await Product.create({
    categoryId: catId,
    name: name.trim(),
    basePrice: price,
    imageUrl: imageUrl ? imageUrl.trim() : null,
  });

  return { status: 201, body: created };
}

/**
 * แก้ไขข้อมูลเมนูและราคา
 * อ้างอิง: Use Case 07, FR-04
 */
async function updateProduct(id, data) {
  const product = await Product.findById(id);
  if (!product) {
    return { status: 404, body: { error: `ไม่พบเมนู id ${id}` } };
  }

  const { categoryId, name, basePrice, imageUrl } = data;

  if (!name || typeof name !== "string" || name.trim() === "") {
    return { status: 400, body: { error: "กรุณาระบุชื่อเมนู" } };
  }

  const price = parseInt(basePrice, 10);
  if (isNaN(price) || price < 0) {
    return { status: 400, body: { error: "ราคาฐานต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0" } };
  }

  const catId = parseInt(categoryId, 10);
  if (isNaN(catId) || catId <= 0) {
    return { status: 400, body: { error: "กรุณาเลือกหมวดหมู่สินค้า" } };
  }

  const updated = await Product.update(id, {
    categoryId: catId,
    name: name.trim(),
    basePrice: price,
    imageUrl: imageUrl ? imageUrl.trim() : null,
  });

  return { status: 200, body: updated };
}

/**
 * ลบเมนู
 * อ้างอิง: Use Case 07, FR-04
 */
async function deleteProduct(id) {
  const product = await Product.findById(id);
  if (!product) {
    return { status: 404, body: { error: `ไม่พบเมนู id ${id}` } };
  }

  await Product.delete(id);
  return { status: 200, body: { id, message: "ลบเมนูเรียบร้อยแล้ว" } };
}

/**
 * ดึงรายการหมวดหมู่ทั้งหมด
 */
async function listCategories() {
  const categories = await Category.findAll();
  return { status: 200, body: categories };
}

module.exports = { listProducts, listCategories, createProduct, updateProduct, deleteProduct };
