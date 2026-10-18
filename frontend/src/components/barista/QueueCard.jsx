import React, { useState } from "react";
import {
  Clock,
  Play,
  CheckCheck,
  CheckCircle2,
  Coffee,
  AlertTriangle,
  Flame,
  XCircle,
} from "lucide-react";

export default function QueueCard({
  order,
  optionsMap,
  onUpdateStatus,
  onCancelOrder,
  isUpdating,
  isCancelling,
}) {
  const [errorMsg, setErrorMsg] = useState("");

  // Status mapping
  const statusConfig = {
    pending: {
      label: "รอทำเครื่องดื่ม",
      badgeClass: "status-pending",
      nextAction: "cooking",
      nextLabel: "เริ่มทำเครื่องดื่ม",
      nextIcon: Play,
      btnClass: "btn-start-cooking",
    },
    cooking: {
      label: "กำลังชงเครื่องดื่ม",
      badgeClass: "status-cooking",
      nextAction: "ready",
      nextLabel: "พร้อมเสิร์ฟ (Ready)",
      nextIcon: CheckCheck,
      btnClass: "btn-mark-ready",
    },
    ready: {
      label: "พร้อมรับที่เคาน์เตอร์",
      badgeClass: "status-ready",
      nextAction: "completed",
      nextLabel: "ลูกค้ารับแล้ว (Complete)",
      nextIcon: CheckCircle2,
      btnClass: "btn-mark-completed",
    },
    completed: {
      label: "เสร็จสมบูรณ์",
      badgeClass: "status-completed",
      nextAction: null,
      nextLabel: null,
      nextIcon: null,
      btnClass: "",
    },
  };

  const currentConfig = statusConfig[order.status] || statusConfig.pending;
  const NextIcon = currentConfig.nextIcon;

  // Format creation time
  const createdDate = new Date(order.created_at);
  const timeString = createdDate.toLocaleTimeString("th-TH", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleAction = async () => {
    if (!currentConfig.nextAction || isUpdating) return;
    setErrorMsg("");
    try {
      await onUpdateStatus(order.id, currentConfig.nextAction);
    } catch (err) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    }
  };

  // Helper to extract option names
  const renderItemFormula = (item) => {
    let opts = {};
    if (typeof item.options_json === "string") {
      try {
        opts = JSON.parse(item.options_json);
      } catch (e) {
        opts = {};
      }
    } else if (item.options_json && typeof item.options_json === "object") {
      opts = item.options_json;
    }

    const tempName =
      opts.temperatureName ||
      optionsMap.temperature?.[opts.temperatureId] ||
      null;
    const sizeName = opts.sizeName || optionsMap.sizes?.[opts.sizeId] || null;
    const sweetnessName =
      opts.sweetnessName || optionsMap.sweetness?.[opts.sweetnessId] || null;
    const toppingNames =
      opts.toppingNames && opts.toppingNames.length > 0
        ? opts.toppingNames
        : (opts.toppingIds || [])
            .map((id) => optionsMap.toppings?.[id])
            .filter(Boolean);
    const bakeryOptionName =
      opts.bakeryOptionName ||
      optionsMap.bakery_option?.[opts.bakeryOptionId] ||
      null;

    if (opts.isBakery || bakeryOptionName) {
      return (
        <div className="formula-tags">
          <span className="formula-tag bakery-badge">🥐 เบเกอรี่</span>
          {bakeryOptionName && (
            <span
              className={`formula-tag ${
                bakeryOptionName.includes("อุ่น")
                  ? "bakery-warm"
                  : "bakery-normal"
              }`}
            >
              {bakeryOptionName.includes("อุ่น")
                ? "🔥 อุ่นร้อน"
                : "📦 ไม่ต้องอุ่น"}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="formula-tags">
        {tempName && (
          <span
            className={`formula-tag temp ${
              tempName.includes("ร้อน")
                ? "hot"
                : tempName.includes("ปั่น")
                  ? "frappe"
                  : "iced"
            }`}
          >
            {tempName.includes("ร้อน")
              ? "☕ ร้อน"
              : tempName.includes("ปั่น")
                ? "🥤 ปั่น"
                : "🧊 เย็น"}
          </span>
        )}
        {sizeName && <span className="formula-tag size">{sizeName}</span>}
        {sweetnessName && (
          <span className="formula-tag sweetness">
            {sweetnessName.split(" ")[0]}
          </span>
        )}
        {toppingNames.map((name, i) => (
          <span key={i} className="formula-tag topping">
            +{name}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className={`barista-order-card ${order.status}`}>
      {/* Card Header */}
      <div className="card-top-bar">
        <div className="queue-chip">
          <span className="queue-chip-prefix">คิวที่</span>
          <span className="queue-chip-num">
            #{String(order.queue_no).padStart(3, "0")}
          </span>
        </div>

        <div className="card-status-and-time">
          <span className={`status-badge-pill ${currentConfig.badgeClass}`}>
            {currentConfig.label}
          </span>
          <span className="order-time-text">
            <Clock size={12} />
            <span>{timeString} น.</span>
          </span>
        </div>
      </div>

      <div className="card-order-no-sub">
        <span>
          รหัสออเดอร์: <strong>{order.order_no}</strong>
        </span>
        {order.branch_name && (
          <span className="card-branch-tag">
            🏪 {order.branch_name.split(":")[0] || order.branch_name}
          </span>
        )}
      </div>

      {errorMsg && (
        <div className="card-error-alert">
          <AlertTriangle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Drink / Item List (Formulas) */}
      <div className="card-items-formula-list">
        {(order.items || []).map((item, idx) => (
          <div key={item.id || idx} className="formula-item-row">
            <div className="formula-item-main">
              <span className="item-qty-badge">{item.quantity}x</span>
              <span className="item-product-name">{item.product_name}</span>
            </div>
            {renderItemFormula(item)}
          </div>
        ))}
      </div>

      {/* Action Button */}
      {currentConfig.nextAction && (
        <div className="card-action-bar">
          <button
            className={`barista-action-btn ${currentConfig.btnClass}`}
            onClick={handleAction}
            disabled={isUpdating || isCancelling}
          >
            {NextIcon && <NextIcon size={16} />}
            <span>{currentConfig.nextLabel}</span>
          </button>
        </div>
      )}

      {/* Cancel Button — เฉพาะ pending และ cooking */}
      {(order.status === "pending" || order.status === "cooking") &&
        onCancelOrder && (
          <div className="card-cancel-bar">
            <button
              className="barista-cancel-btn"
              disabled={isUpdating || isCancelling}
              onClick={() => {
                if (
                  window.confirm(
                    `ยืนยันยกเลิกออเดอร์ #${String(order.queue_no).padStart(3, "0")} (${order.order_no}) ใช่หรือไม่?`,
                  )
                ) {
                  onCancelOrder(order.id);
                }
              }}
            >
              <XCircle size={15} />
              <span>{isCancelling ? "กำลังยกเลิก..." : "ยกเลิกออเดอร์"}</span>
            </button>
          </div>
        )}
    </div>
  );
}
