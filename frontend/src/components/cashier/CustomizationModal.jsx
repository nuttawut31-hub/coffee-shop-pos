import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Minus,
  Check,
  AlertCircle,
  ShoppingCart,
  Coffee,
  Flame,
  Droplets,
  Sparkles,
  PackageCheck,
} from "lucide-react";

export default function CustomizationModal({
  product,
  options,
  onClose,
  onAddToCart,
}) {
  const isBakery =
    product?.category_name === "เบเกอรี่" ||
    product?.category_id === 4 ||
    (product?.category_name &&
      (product.category_name.includes("ขนม") ||
        product.category_name.includes("อาหาร") ||
        product.category_name.toLowerCase().includes("bakery")));

  const tempOptions = options.temperature || [];
  const sizeOptions = options.size || [];
  const sweetnessOptions = options.sweetness || [];
  const toppingOptions = options.topping || [];
  const bakeryOptions = options.bakery_option || [];

  // Default Drink Type (Hot / Iced / Frappe)
  // If product is in "ปั่น", default to Frappe, otherwise default to Iced (เย็น)
  const defaultTemp = () => {
    if (product?.category_name === "ปั่น") {
      const frappeOpt = tempOptions.find((t) => t.name.includes("ปั่น"));
      if (frappeOpt) return frappeOpt.id;
    }
    const icedOpt = tempOptions.find((t) => t.name.includes("เย็น"));
    if (icedOpt) return icedOpt.id;
    return tempOptions.length > 0 ? tempOptions[0].id : null;
  };

  const [selectedTempId, setSelectedTempId] = useState(defaultTemp);
  const [selectedSizeId, setSelectedSizeId] = useState(
    sizeOptions.length > 0 ? sizeOptions[0].id : null,
  );
  const [selectedSweetnessId, setSelectedSweetnessId] = useState(
    sweetnessOptions.length > 2
      ? sweetnessOptions[2].id
      : sweetnessOptions[0]?.id || null,
  );
  const [selectedToppingIds, setSelectedToppingIds] = useState([]);

  // Bakery Serving Option (Default: อุ่นร้อน)
  const [selectedBakeryOptionId, setSelectedBakeryOptionId] = useState(
    bakeryOptions.length > 0 ? bakeryOptions[0].id : null,
  );

  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");

  // Reset or re-evaluate when product changes
  useEffect(() => {
    setSelectedTempId(defaultTemp());
    setSelectedSizeId(sizeOptions.length > 0 ? sizeOptions[0].id : null);
    setSelectedSweetnessId(
      sweetnessOptions.length > 2
        ? sweetnessOptions[2].id
        : sweetnessOptions[0]?.id || null,
    );
    setSelectedToppingIds([]);
    setSelectedBakeryOptionId(
      bakeryOptions.length > 0 ? bakeryOptions[0].id : null,
    );
    setQuantity(1);
    setErrorMsg("");
  }, [product]);

  // Toggle topping
  const toggleTopping = (toppingId) => {
    setSelectedToppingIds((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId],
    );
  };

  // Price Calculation
  const basePrice = parseFloat(product?.base_price || 0);

  let unitPrice = basePrice;
  if (isBakery) {
    const bExtra = parseFloat(
      bakeryOptions.find((b) => b.id === selectedBakeryOptionId)?.extra_price ||
        0,
    );
    unitPrice = basePrice + bExtra;
  } else {
    const tempExtra = parseFloat(
      tempOptions.find((t) => t.id === selectedTempId)?.extra_price || 0,
    );
    const sizeExtra = parseFloat(
      sizeOptions.find((s) => s.id === selectedSizeId)?.extra_price || 0,
    );
    const toppingsExtra = selectedToppingIds.reduce((sum, tid) => {
      const t = toppingOptions.find((item) => item.id === tid);
      return sum + (t ? parseFloat(t.extra_price) : 0);
    }, 0);
    unitPrice = basePrice + tempExtra + sizeExtra + toppingsExtra;
  }

  const subtotal = unitPrice * quantity;

  const handleConfirm = () => {
    if (isBakery) {
      const selectedBakeryOpt = bakeryOptions.find(
        (b) => b.id === selectedBakeryOptionId,
      );
      onAddToCart({
        product,
        productId: product.id,
        quantity,
        isBakery: true,
        bakeryOptionId: selectedBakeryOptionId,
        bakeryOptionName: selectedBakeryOpt?.name || "รับปกติ ไม่ต้องอุ่น",
        temperatureId: null,
        temperatureName: "",
        sizeId: null,
        sizeName: "",
        sweetnessId: null,
        sweetnessName: "",
        toppingIds: [],
        toppingNames: [],
        unitPrice,
        subtotal,
      });
      onClose();
      return;
    }

    // Drinks Validation: Must select size (FR-03)
    if (!selectedSizeId) {
      setErrorMsg("กรุณาเลือกขนาดเครื่องดื่ม (Size)");
      return;
    }

    const selectedTemp = tempOptions.find((t) => t.id === selectedTempId);
    const selectedSize = sizeOptions.find((s) => s.id === selectedSizeId);
    const selectedSweetness = sweetnessOptions.find(
      (sw) => sw.id === selectedSweetnessId,
    );
    const selectedToppings = toppingOptions.filter((tp) =>
      selectedToppingIds.includes(tp.id),
    );

    onAddToCart({
      product,
      productId: product.id,
      quantity,
      isBakery: false,
      temperatureId: selectedTempId,
      temperatureName: selectedTemp?.name || "",
      sizeId: selectedSizeId,
      sizeName: selectedSize?.name || "",
      sweetnessId: selectedSweetnessId,
      sweetnessName: selectedSweetness?.name || "",
      toppingIds: selectedToppingIds,
      toppingNames: selectedToppings.map((t) => t.name),
      unitPrice,
      subtotal,
    });
    onClose();
  };

  if (!product) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-dialog modal-customization"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <h2 className="modal-title">{product.name}</h2>
            <span className="modal-base-price">
              ราคาเริ่มต้น ฿{basePrice.toFixed(2)}
            </span>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="ปิด"
          >
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div className="validation-alert animate-fadeIn">
            <AlertCircle size={18} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="modal-body custom-scroll">
          {/* =========================================================================
              A. สำหรับหมวดเบเกอรี่ / ขนม (Bakery Mode)
              ไม่มีขนาดเครื่องดื่ม / ไม่มีระดับความหวาน / ไม่มีท็อปปิงเครื่องดื่ม
             ========================================================================= */}
          {isBakery ? (
            <div className="bakery-custom-flow">
              {/* บริการอุ่นร้อน */}
              <div className="custom-section">
                <div className="section-label-group">
                  <label className="section-label">
                    การบริการเสิร์ฟ{" "}
                    <span className="optional-tag">(เลือกได้)</span>
                  </label>
                </div>
                <div className="options-pill-grid">
                  {(bakeryOptions.length > 0
                    ? bakeryOptions
                    : [
                        { id: 16, name: "อุ่นร้อน (Warm Up)", extra_price: 0 },
                        {
                          id: 17,
                          name: "รับปกติ ไม่ต้องอุ่น (Take as is)",
                          extra_price: 0,
                        },
                      ]
                  ).map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`option-card-btn ${
                        selectedBakeryOptionId === opt.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedBakeryOptionId(opt.id)}
                    >
                      <div className="opt-main-info">
                        <span className="opt-name">
                          {opt.name.includes("อุ่น") ? "อุ่นร้อน" : "รับปกติ"}
                        </span>
                        <span className="opt-desc-sub">
                          {opt.name.includes("อุ่น")
                            ? "อุ่นเตาอบหอมกรุ่นพร้อมทาน"
                            : "ไม่นำเข้าเตาอบ"}
                        </span>
                      </div>
                      {selectedBakeryOptionId === opt.id && (
                        <Check size={16} className="opt-check-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* ข้อความแจ้งเตือนสำหรับขนม */}
              <div className="bakery-hint-notice">
                <PackageCheck size={18} className="hint-icon" />
                <span>
                  เมนูหมวดขนมและเบเกอรี่คิดราคาคงที่ตามราคาฐาน
                  พร้อมจัดใส่ถุง/จานให้ทันที
                </span>
              </div>
            </div>
          ) : (
            /* =========================================================================
               B. สำหรับหมวดเครื่องดื่ม (Drink Mode)
               มี: ร้อน/เย็น/ปั่น + ขนาด (S/M/L) + ความหวาน + ท็อปปิง
               ========================================================================= */
            <div className="drink-custom-flow">
              {/* Section 1: ประเภทเครื่องดื่ม (ร้อน / เย็น / ปั่น) */}
              <div className="custom-section">
                <div className="section-label-group">
                  <label className="section-label">
                    ประเภทเครื่องดื่ม{" "}
                    <span className="required-tag">*จำเป็น</span>
                  </label>
                </div>
                {/* รายการตัวเลือกประเภทเครื่องดื่ม: ใช้ option-card-btn สไตล์เดียวกับขนาดแก้ว (Size) */}
                <div className="options-pill-grid">
                  {(tempOptions.length > 0
                    ? tempOptions
                    : [
                        { id: 13, name: "ร้อน (Hot)", extra_price: 0 },
                        { id: 14, name: "เย็น (Iced)", extra_price: 5 },
                        { id: 15, name: "ปั่น (Frappe)", extra_price: 10 },
                      ]
                  ).map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`option-card-btn ${
                        selectedTempId === opt.id ? "selected" : ""
                      }`}
                      onClick={() => setSelectedTempId(opt.id)}
                    >
                      <div className="opt-main-info">
                        <span className="opt-name">{opt.name}</span>
                        {Number(opt.extra_price) > 0 ? (
                          <span className="opt-extra">
                            +{Number(opt.extra_price).toFixed(2)}฿
                          </span>
                        ) : (
                          <span className="opt-extra-zero"></span>
                        )}
                      </div>
                      {selectedTempId === opt.id && (
                        <Check size={16} className="opt-check-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 2: ขนาด (Size) - บังคับเลือก (FR-03) */}
              <div className="custom-section">
                <div className="section-label-group">
                  <label className="section-label">
                    ขนาดแก้ว (Size){" "}
                    <span className="required-tag">*จำเป็น</span>
                  </label>
                </div>
                <div className="options-pill-grid">
                  {sizeOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      className={`option-card-btn ${
                        selectedSizeId === opt.id ? "selected" : ""
                      }`}
                      onClick={() => {
                        setSelectedSizeId(opt.id);
                        setErrorMsg("");
                      }}
                    >
                      <div className="opt-main-info">
                        <span className="opt-name">ขนาด {opt.name}</span>
                        {Number(opt.extra_price) > 0 ? (
                          <span className="opt-extra">
                            +{Number(opt.extra_price).toFixed(2)}฿
                          </span>
                        ) : (
                          <span className="opt-extra-zero"></span>
                        )}
                      </div>
                      {selectedSizeId === opt.id && (
                        <Check size={16} className="opt-check-icon" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section 3: ระดับความหวาน (Sweetness) */}
              {sweetnessOptions.length > 0 && (
                <div className="custom-section">
                  <label className="section-label">ระดับความหวาน</label>
                  <div className="sweetness-pill-bar">
                    {sweetnessOptions.map((opt) => (
                      <button
                        type="button"
                        key={opt.id}
                        className={`sweetness-btn ${
                          selectedSweetnessId === opt.id ? "selected" : ""
                        }`}
                        onClick={() => setSelectedSweetnessId(opt.id)}
                      >
                        {opt.name.replace(" (", "\n(")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Section 4: ท็อปปิง (Toppings) */}
              {toppingOptions.length > 0 && (
                <div className="custom-section">
                  <label className="section-label">
                    เพิ่มท็อปปิง (เลือกได้หลายอย่าง)
                  </label>
                  <div className="toppings-grid">
                    {toppingOptions.map((opt) => {
                      const isChecked = selectedToppingIds.includes(opt.id);
                      return (
                        <button
                          type="button"
                          key={opt.id}
                          className={`topping-item-btn ${
                            isChecked ? "checked" : ""
                          }`}
                          onClick={() => toggleTopping(opt.id)}
                        >
                          <div className="topping-checkbox">
                            {isChecked && <Check size={14} />}
                          </div>
                          <span className="topping-name">{opt.name}</span>
                          <span className="topping-price">
                            +{Number(opt.extra_price).toFixed(2)}฿
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section: จำนวน (Quantity) — ใช้ร่วมกันทั้งขนมและเครื่องดื่ม */}
          <div className="custom-section quantity-section">
            <label className="section-label">จำนวน (Quantity)</label>
            <div className="quantity-controller">
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
              >
                <Minus size={18} />
              </button>
              <span className="qty-number">{quantity}</span>
              <button
                type="button"
                className="qty-btn"
                onClick={() => setQuantity((q) => q + 1)}
              >
                <Plus size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <div className="modal-footer-price">
            <span className="footer-price-label">
              ราคารวม ({quantity} ชิ้น/แก้ว)
            </span>
            <span className="footer-total-price">฿{subtotal.toFixed(2)}</span>
          </div>

          <button className="confirm-add-btn" onClick={handleConfirm}>
            <ShoppingCart size={18} />
            <span>ใส่ตะกร้า • ฿{subtotal.toFixed(2)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
