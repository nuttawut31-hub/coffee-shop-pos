import React, { useState } from "react";
import {
  ShoppingCart,
  Trash2,
  Plus,
  Minus,
  CreditCard,
  Banknote,
  QrCode,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const PAYMENT_METHODS = [
  { id: "cash", label: "เงินสด", icon: Banknote },
  { id: "transfer", label: "เงินโอน", icon: CreditCard },
  { id: "qr", label: "QR Code", icon: QrCode },
];

export default function CartSidebar({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
  isSubmitting,
}) {
  const [selectedPayment, setSelectedPayment] = useState("cash");

  const totalQuantity = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cartItems.reduce((acc, item) => acc + item.subtotal, 0);

  const handleCheckoutClick = () => {
    if (cartItems.length === 0 || isSubmitting) return;
    onCheckout({
      paymentMethod: selectedPayment,
      items: cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        sizeId: item.sizeId,
        sweetnessId: item.sweetnessId,
        toppingIds: item.toppingIds || [],
      })),
      totalAmount,
    });
  };

  return (
    <aside className="cart-sidebar">
      {/* Cart Header */}
      <div className="cart-header">
        <div className="cart-header-title">
          <ShoppingCart size={22} className="cart-header-icon" />
          <h2>รายการสั่งซื้อ</h2>
          {totalQuantity > 0 && (
            <span className="cart-item-count">{totalQuantity}</span>
          )}
        </div>

        {cartItems.length > 0 && (
          <button
            className="clear-cart-btn"
            onClick={onClearCart}
            title="ล้างรายการทั้งหมด"
          >
            <Trash2 size={16} />
            <span>ล้าง</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="cart-items-list custom-scroll">
        {cartItems.length === 0 ? (
          <div className="cart-empty-state">
            <div className="cart-empty-icon-circle">
              <ShoppingCart size={32} />
            </div>
            <p className="cart-empty-title">ยังไม่มีสินค้าในตะกร้า</p>
            <p className="cart-empty-desc">
              คลิกเลือกเมนูจากทางซ้าย เพื่อปรับแต่งขนาดและท็อปปิง
            </p>
          </div>
        ) : (
          cartItems.map((item, index) => (
            <div
              key={`${item.productId}-${item.temperatureId || "t"}-${item.sizeId || "s"}-${item.bakeryOptionId || "b"}-${index}`}
              className="cart-item-card"
            >
              <div className="cart-item-top">
                <span className="cart-item-name">{item.product.name}</span>
                <span className="cart-item-subtotal">
                  ฿{item.subtotal.toFixed(2)}
                </span>
              </div>

              {/* Customization Badges */}
              <div className="cart-item-badges">
                {item.isBakery ? (
                  <>
                    <span className="cart-badge bakery">🥐 เบเกอรี่</span>
                    {item.bakeryOptionName && (
                      <span
                        className={`cart-badge ${item.bakeryOptionName.includes("อุ่น") ? "bakery-warm" : "bakery-normal"}`}
                      >
                        {item.bakeryOptionName.includes("อุ่น")
                          ? " อุ่นร้อน"
                          : " ไม่ต้องอุ่น"}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {item.temperatureName && (
                      <span
                        className={`cart-badge temp ${item.temperatureName.includes("ร้อน") ? "hot" : item.temperatureName.includes("ปั่น") ? "frappe" : "iced"}`}
                      >
                        {item.temperatureName.includes("ร้อน")
                          ? " ร้อน"
                          : item.temperatureName.includes("ปั่น")
                            ? "ปั่น"
                            : "เย็น"}
                      </span>
                    )}
                    {item.sizeName && (
                      <span className="cart-badge size">{item.sizeName}</span>
                    )}
                    {item.sweetnessName && (
                      <span className="cart-badge sweetness">
                        {item.sweetnessName.split(" ")[0]}
                      </span>
                    )}
                    {item.toppingNames && item.toppingNames.length > 0 && (
                      <span className="cart-badge topping">
                        +{item.toppingNames.join(", ")}
                      </span>
                    )}
                  </>
                )}
              </div>

              {/* Item Controls */}
              <div className="cart-item-controls">
                <span className="unit-price-hint">
                  ฿{item.unitPrice.toFixed(2)} /{" "}
                  {item.isBakery ? "ชิ้น" : "แก้ว"}
                </span>

                <div className="qty-control-compact">
                  <button
                    className="qty-btn-sm"
                    onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                  >
                    <Minus size={14} />
                  </button>
                  <span className="qty-val">{item.quantity}</span>
                  <button
                    className="qty-btn-sm"
                    onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                  >
                    <Plus size={14} />
                  </button>
                  <button
                    className="remove-item-btn"
                    onClick={() => onRemoveItem(index)}
                    title="ลบรายการนี้"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Cart Summary & Checkout */}
      {cartItems.length > 0 && (
        <div className="cart-footer">
          {/* Payment Method Selector (FR-06) */}
          <div className="payment-method-section">
            <span className="payment-label">วิธีชำระเงิน</span>
            <div className="payment-methods-grid">
              {PAYMENT_METHODS.map((method) => {
                const Icon = method.icon;
                const isSelected = selectedPayment === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    className={`payment-pill ${isSelected ? "selected" : ""}`}
                    onClick={() => setSelectedPayment(method.id)}
                  >
                    <Icon size={16} />
                    <span>{method.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="cart-pricing-breakdown">
            <div className="pricing-row total">
              <span>ยอดสุทธิรวม</span>
              <span className="total-highlight">฿{totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit Checkout Button */}
          <button
            className="checkout-btn"
            onClick={handleCheckoutClick}
            disabled={isSubmitting || cartItems.length === 0}
          >
            {isSubmitting ? (
              <span>กำลังบันทึกออเดอร์...</span>
            ) : (
              <>
                <span>ยืนยันการสั่งซื้อ</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      )}
    </aside>
  );
}
