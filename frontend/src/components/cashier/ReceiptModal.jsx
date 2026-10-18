import React from "react";
import { CheckCircle2, Printer, PlusCircle, ArrowRight, X } from "lucide-react";

const SHOP_NAME = "Coffee Shop";
const CASHIER_NAME = "Cashier";
const POS_NAME = "POS 1";

export default function ReceiptModal({
  orderResult,
  cartItems = [],
  branchName = "สาขา 1: หน้า ม.บูรพา (Main Campus)",
  onClose,
  onSwitchToBarista,
}) {
  if (!orderResult) return null;

  const paymentLabels = {
    cash: "เงินสด",
    transfer: "เงินโอน",
    qr: "QR Code",
  };

  // Format datetime for receipt
  const now = new Date();
  const receiptDateTime = now.toLocaleString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const queueDisplay = `#${String(orderResult.queueNo).padStart(3, "0")}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop">
      {/* === Screen UI (Hidden when printing) === */}
      <div className="modal-dialog modal-receipt animate-popIn no-print">
        {/* Close Button */}
        <button className="receipt-close-btn" onClick={onClose} aria-label="ปิด">
          <X size={20} />
        </button>

        {/* Success Icon */}
        <div className="receipt-success-badge">
          <CheckCircle2 size={44} className="success-icon" />
        </div>

        <h2 className="receipt-title">สั่งซื้อและออกคิวสำเร็จ!</h2>
        <p className="receipt-subtitle">
          ออเดอร์ถูกส่งไปยังหน้าจอบาริสต้าเรียบร้อยแล้ว
        </p>

        {/* Queue Card Display */}
        <div className="receipt-queue-card">
          <span className="queue-card-label">หมายเลขคิวของคุณ</span>
          <div className="queue-card-number">{queueDisplay}</div>
          <div className="queue-card-order-no">
            รหัสออเดอร์: <strong>{orderResult.orderNo}</strong>
          </div>
        </div>

        {/* Order Details Summary */}
        <div className="receipt-details">
          <div className="receipt-detail-row">
            <span>สาขา:</span>
            <strong>{branchName}</strong>
          </div>
          <div className="receipt-detail-row">
            <span>วิธีชำระเงิน:</span>
            <strong>
              {paymentLabels[orderResult.paymentMethod] ||
                orderResult.paymentMethod}
            </strong>
          </div>
          <div className="receipt-detail-row">
            <span>ยอดชำระสุทธิ:</span>
            <strong className="receipt-amount-text">
              ฿{Number(orderResult.totalAmount).toFixed(2)}
            </strong>
          </div>
          <div className="receipt-detail-row">
            <span>สถานะเริ่มต้น:</span>
            <span className="status-pill-pending">รอทำ (Pending)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="receipt-actions">
          <button className="receipt-btn-secondary" onClick={handlePrint}>
            <Printer size={18} />
            <span>พิมพ์ใบเสร็จ</span>
          </button>

          <button className="receipt-btn-primary" onClick={onClose}>
            <PlusCircle size={18} />
            <span>รับออเดอร์ใหม่</span>
          </button>
        </div>

        {onSwitchToBarista && (
          <div className="receipt-barista-link">
            <button className="link-to-barista-btn" onClick={onSwitchToBarista}>
              <span>ไปดูคิวที่หน้าจอบาริสต้า</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* === Print Receipt Paper (Only visible when printing) === */}
      <div className="print-receipt-paper print-only">
        {/* ── Queue Number Block ──  */}
        <div className="pr-queue-block">
          <div className="pr-queue-label">คิวของคุณ</div>
          <div className="pr-queue-number">{queueDisplay}</div>
          <div className="pr-queue-order">{orderResult.orderNo}</div>
        </div>

        <div className="pr-divider-solid" />

        {/* ── Shop Header ── */}
        <div className="pr-header">
          <div className="pr-logo">☕</div>
          <div className="pr-shop-name">{SHOP_NAME}</div>
          <div className="pr-shop-sub">{branchName}</div>
        </div>

        <div className="pr-divider-dashed" />

        {/* ── Transaction Info ── */}
        <div className="pr-info-row">Branch: {branchName}</div>
        <div className="pr-info-row">Cashier: {CASHIER_NAME}</div>
        <div className="pr-info-row">POS: {POS_NAME}</div>
        <div className="pr-info-row">Order: {orderResult.orderNo}</div>

        <div className="pr-divider-dashed" />

        {/* ── Items ── */}
        <div className="pr-items">
          {cartItems.length === 0 ? (
            <div className="pr-item-detail">(ไม่มีรายการ)</div>
          ) : (
            cartItems.map((item, idx) => (
              <div key={idx} className="pr-item-block">
                <div className="pr-item-header-row">
                  <span className="pr-item-name">
                    {item.product?.name || "รายการ"}
                  </span>
                  <span className="pr-item-subtotal">
                    {Number(item.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="pr-item-detail">
                  {item.quantity} x {Number(item.unitPrice).toFixed(2)}
                  {item.isBakery ? (
                    item.bakeryOptionName ? ` · ${item.bakeryOptionName}` : ""
                  ) : (
                    <>
                      {item.temperatureName ? ` · ${item.temperatureName.split(" ")[0]}` : ""}
                      {item.sizeName ? ` · ${item.sizeName}` : ""}
                      {item.sweetnessName
                        ? ` · ${item.sweetnessName.split(" ")[0]}`
                        : ""}
                      {item.toppingNames && item.toppingNames.length > 0
                        ? ` · ${item.toppingNames.join(", ")}`
                        : ""}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pr-divider-dashed" />

        {/* ── Total ── */}
        <div className="pr-total-row">
          <span className="pr-total-label">TOTAL</span>
          <span className="pr-total-amount">
            {Number(orderResult.totalAmount).toFixed(2)}
          </span>
        </div>

        <div className="pr-divider-dashed" />

        {/* ── Payment & Footer ── */}
        <div className="pr-payment-row">
          ชำระด้วย:{" "}
          <strong>
            {paymentLabels[orderResult.paymentMethod] ||
              orderResult.paymentMethod}
          </strong>
        </div>

        <div className="pr-footer">
          <div className="pr-datetime">{receiptDateTime}</div>
          <div className="pr-order-ref">{orderResult.orderNo}</div>
        </div>
      </div>
    </div>
  );
}
