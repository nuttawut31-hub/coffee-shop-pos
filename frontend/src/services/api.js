/**
 * Client API Service for Coffee Shop POS
 * Interacts with Backend REST endpoints
 */

const API_BASE = "/api";

export async function fetchProducts() {
  const res = await fetch(`${API_BASE}/products`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch products: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCategories() {
  const res = await fetch(`${API_BASE}/categories`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch categories: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBranches() {
  const res = await fetch(`${API_BASE}/branches`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch branches: ${res.statusText}`);
  }
  return res.json();
}

export async function createOrder(orderData) {
  const res = await fetch(`${API_BASE}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(orderData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถสร้างออเดอร์ได้");
  }
  return data;
}

export async function fetchQueue(branchId = null) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  const res = await fetch(`${API_BASE}/orders/queue${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch queue: ${res.statusText}`);
  }
  return res.json();
}

export async function updateOrderStatus(orderId, newStatus) {
  const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status: newStatus }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถเปลี่ยนสถานะออเดอร์ได้");
  }
  return data;
}

export async function cancelOrder(orderId) {
  const res = await fetch(`${API_BASE}/orders/${orderId}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถยกเลิกออเดอร์ได้");
  }
  return data;
}

export async function fetchSalesReport(branchId = null) {
  const query = branchId ? `?branchId=${encodeURIComponent(branchId)}` : "";
  const res = await fetch(`${API_BASE}/reports/sales${query}`);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to fetch sales report: ${res.statusText}`);
  }
  return res.json();
}

export async function createProduct(productData) {
  const res = await fetch(`${API_BASE}/products`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถเพิ่มเมนูได้");
  }
  return data;
}

export async function updateProduct(id, productData) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(productData),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถแก้ไขเมนูได้");
  }
  return data;
}

export async function deleteProduct(id) {
  const res = await fetch(`${API_BASE}/products/${id}`, {
    method: "DELETE",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถลบเมนูได้");
  }
  return data;
}

export async function uploadImage(base64Data) {
  const res = await fetch(`${API_BASE}/upload`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data: base64Data }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || "ไม่สามารถอัปโหลดรูปภาพได้");
  }
  return data;
}
