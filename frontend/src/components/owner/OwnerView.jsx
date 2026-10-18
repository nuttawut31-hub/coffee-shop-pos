import React, { useState, useEffect, useRef } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  QrCode,
  CreditCard,
  Banknote,
  Search,
  Filter,
  Flame,
  Store,
  Coffee,
  ChevronDown,
  Check,
} from "lucide-react";
import { fetchSalesReport } from "../../services/api";
import MenuManager from "./MenuManager";

export default function OwnerView({
  selectedBranch = 1,
  branches = [],
  onSelectBranch,
}) {
  const [activeOwnerTab, setActiveOwnerTab] = useState("analytics"); // 'analytics' | 'menu'
  const [dashboardBranch, setDashboardBranch] = useState(
    selectedBranch ? String(selectedBranch) : "all"
  );
  const [branchDropdownOpen, setBranchDropdownOpen] = useState(false);
  const branchDropdownRef = useRef(null);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target)
      ) {
        setBranchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync with selectedBranch when parent changes
  useEffect(() => {
    if (selectedBranch) {
      setDashboardBranch(String(selectedBranch));
    }
  }, [selectedBranch]);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await fetchSalesReport(
        dashboardBranch === "all" ? null : dashboardBranch
      );
      setData(res);
      setError(null);
    } catch (err) {
      console.error("Failed to load sales report:", err);
      setError("ไม่สามารถโหลดรายงานยอดขายได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(() => loadData(), 5000);
    return () => clearInterval(interval);
  }, [dashboardBranch]);

  if (loading) {
    return (
      <div className="owner-loading-container">
        <div className="owner-spinner"></div>
        <p>กำลังโหลดข้อมูลรายงานและสถิติยอดขาย...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="owner-error-container">
        <AlertCircle size={48} className="text-red-500" />
        <h3>เกิดข้อผิดพลาด</h3>
        <p>{error}</p>
        <button className="owner-refresh-btn" onClick={() => loadData(true)}>
          <RefreshCw size={18} /> ลองใหม่อีกครั้ง
        </button>
      </div>
    );
  }

  const { today, allTime, queueStats, paymentBreakdown, topProducts, recentOrders } = data || {
    today: { sales: 0, orders: 0 },
    allTime: { sales: 0, orders: 0, avgOrderValue: 0 },
    queueStats: { active: 0, completed: 0, cancelled: 0, pending: 0, cooking: 0, ready: 0 },
    paymentBreakdown: [],
    topProducts: [],
    recentOrders: [],
  };

  // Filter recent orders
  const filteredOrders = (recentOrders || []).filter((ord) => {
    const matchStatus = statusFilter === "all" ? true : ord.status === statusFilter;
    const matchSearch =
      searchTerm.trim() === ""
        ? true
        : ord.order_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
          `a-${ord.queue_no}`.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  // รายการตัวเลือกสาขาสำหรับตัวกรองรายงานแดชบอร์ด
  const allBranchesList = [
    { id: "all", name: "ทุกสาขา (รวมยอดทั้งหมด)" },
    ...(branches || []),
  ];

  // ชื่อสาขาที่กำลังเลือกอยู่
  const currentBranchLabel =
    allBranchesList.find((b) => String(b.id) === String(dashboardBranch))?.name ||
    "ทุกสาขา (รวมยอดทั้งหมด)";

  // Calculate max qty for top products bar calculation
  const maxTopQty = topProducts.length > 0 ? Math.max(...topProducts.map((p) => p.total_qty)) : 1;

  // Format payment name & icon
  const getPaymentDetails = (method) => {
    switch (method) {
      case "qr":
        return { label: "PromptPay QR", icon: <QrCode size={16} />, class: "pay-qr" };
      case "cash":
        return { label: "เงินสด (Cash)", icon: <Banknote size={16} />, class: "pay-cash" };
      case "transfer":
        return { label: "โอนผ่านธนาคาร", icon: <CreditCard size={16} />, class: "pay-transfer" };
      default:
        return { label: method, icon: <DollarSign size={16} />, class: "pay-other" };
    }
  };

  // Format status badge
  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <span className="order-badge badge-pending">รอรับออเดอร์</span>;
      case "cooking":
        return <span className="order-badge badge-cooking">กำลังชง</span>;
      case "ready":
        return <span className="order-badge badge-ready">พร้อมเสิร์ฟ</span>;
      case "completed":
        return <span className="order-badge badge-completed">เสร็จสิ้น</span>;
      case "cancelled":
        return <span className="order-badge badge-cancelled">ยกเลิกแล้ว</span>;
      default:
        return <span className="order-badge">{status}</span>;
    }
  };

  return (
    <div className="owner-dashboard-container">
      {/* Owner Sub-Navigation Tabs */}
      <div className="owner-subtabs-bar">
        <button
          className={`owner-subtab-btn ${activeOwnerTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveOwnerTab("analytics")}
        >
          <TrendingUp size={18} />
          <span>รายงานยอดขายและสถิติ (Sales Analytics)</span>
        </button>

        <button
          className={`owner-subtab-btn ${activeOwnerTab === "menu" ? "active" : ""}`}
          onClick={() => setActiveOwnerTab("menu")}
        >
          <Coffee size={18} />
          <span>จัดการเมนูและราคาขาย (Manage Menu & Pricing)</span>
        </button>
      </div>

      {activeOwnerTab === "menu" ? (
        <MenuManager onMenuUpdated={() => loadData()} />
      ) : (
        <>
          {/* Dashboard Header */}
          <div className="owner-header">
            <div>
              <div className="owner-title-row">
                <div className="owner-icon-box">
                  <TrendingUp size={24} />
                </div>
                <div>
                  <h1 className="owner-main-title">แดชบอร์ดเจ้าของร้าน (Owner Overview)</h1>
                  <p className="owner-subtitle">
                    รายงานยอดขาย สถิติความนิยมของเมนู และประวัติออเดอร์แบบเรียลไทม์ (FR-05, Use Case 08)
                  </p>
                </div>
              </div>
            </div>

            <div className="owner-header-actions">
              {/* Custom Branch Filter Dropdown (ดีไซน์พรีเมียม สไตล์ร้านกาแฟ คลีน เข้ากับ Navbar) */}
              <div
                className="custom-dropdown-container owner-branch-container"
                ref={branchDropdownRef}
                title="เลือกสาขาสำหรับรายงาน"
              >
                <button
                  type="button"
                  className={`owner-branch-trigger ${branchDropdownOpen ? "open" : ""}`}
                  onClick={() => setBranchDropdownOpen(!branchDropdownOpen)}
                  aria-expanded={branchDropdownOpen}
                >
                  <Store size={16} className="owner-branch-icon" />
                  <span className="owner-branch-label">{currentBranchLabel}</span>
                  <ChevronDown
                    size={14}
                    className={`dropdown-chevron ${branchDropdownOpen ? "rotate" : ""}`}
                  />
                </button>

                {branchDropdownOpen && (
                  <div className="custom-dropdown-menu owner-branch-menu animate-fadeIn">
                    <div className="dropdown-menu-header-light">กรองข้อมูลตามสาขา</div>
                    {allBranchesList.map((b) => (
                      <button
                        type="button"
                        key={b.id}
                        className={`dropdown-menu-item ${
                          String(dashboardBranch) === String(b.id) ? "active" : ""
                        }`}
                        onClick={() => {
                          setDashboardBranch(String(b.id));
                          setBranchDropdownOpen(false);
                        }}
                      >
                        <span className="dropdown-item-name">{b.name}</span>
                        {String(dashboardBranch) === String(b.id) && (
                          <Check size={15} className="dropdown-item-check" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>อัปเดตอัตโนมัติ (Live)</span>
              </div>
              <button
                className={`owner-refresh-btn ${refreshing ? "rotating" : ""}`}
                onClick={() => loadData(true)}
                title="รีเฟรชข้อมูลล่าสุด"
              >
                <RefreshCw size={16} />
                <span>รีเฟรช</span>
              </button>
            </div>
          </div>

      {/* KPI Stats Cards */}
      <div className="owner-stats-grid">
        {/* Card 1: Today Sales */}
        <div className="owner-stat-card card-gradient-amber">
          <div className="stat-card-top">
            <span className="stat-card-label">ยอดขายวันนี้</span>
            <div className="stat-icon-wrapper bg-amber-light">
              <DollarSign size={22} />
            </div>
          </div>
          <div className="stat-card-value">฿{today.sales.toLocaleString()}</div>
          <div className="stat-card-sub">
            <span>คำสั่งซื้อสำเร็จวันนี้: <strong>{today.orders}</strong> บิล</span>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="owner-stat-card card-gradient-emerald">
          <div className="stat-card-top">
            <span className="stat-card-label">ยอดขายรวมสะสม</span>
            <div className="stat-icon-wrapper bg-emerald-light">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="stat-card-value">฿{allTime.sales.toLocaleString()}</div>
          <div className="stat-card-sub">
            <span>เฉลี่ย <strong>฿{allTime.avgOrderValue}</strong> ต่อบิล ({allTime.orders} บิลทั้งหมด)</span>
          </div>
        </div>

        {/* Card 3: Active Queue */}
        <div className="owner-stat-card card-gradient-sky">
          <div className="stat-card-top">
            <span className="stat-card-label">คิวที่กำลังรอ/ทำ</span>
            <div className="stat-icon-wrapper bg-sky-light">
              <Clock size={22} />
            </div>
          </div>
          <div className="stat-card-value">{queueStats.active} <span className="stat-unit">คิว</span></div>
          <div className="stat-card-sub">
            <span>รอทำ: <strong>{queueStats.pending}</strong> | กำลังทำ: <strong>{queueStats.cooking}</strong></span>
          </div>
        </div>

        {/* Card 4: Completed Orders */}
        <div className="owner-stat-card card-gradient-purple">
          <div className="stat-card-top">
            <span className="stat-card-label">ออเดอร์เสร็จสิ้นสะสม</span>
            <div className="stat-icon-wrapper bg-purple-light">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="stat-card-value">{queueStats.completed} <span className="stat-unit">บิล</span></div>
          <div className="stat-card-sub">
            <span>ยกเลิก: <strong>{queueStats.cancelled}</strong> บิล</span>
          </div>
        </div>
      </div>

      {/* Middle Grid: Top Products & Payment Methods */}
      <div className="owner-middle-grid">
        {/* Top 5 Products */}
        <div className="owner-section-box">
          <div className="section-box-header">
            <div className="box-title-group">
              <Flame size={20} className="text-amber-500" />
              <h2>5 อันดับเมนูขายดีที่สุด (Top Selling Products)</h2>
            </div>
            <span className="section-tag">เรียงตามจำนวนแก้ว</span>
          </div>

          <div className="top-products-list">
            {topProducts && topProducts.length > 0 ? (
              topProducts.map((prod, idx) => {
                const percent = Math.round((prod.total_qty / maxTopQty) * 100);
                return (
                  <div key={prod.id} className="top-product-item">
                    <div className="top-product-rank">#{idx + 1}</div>
                    <div className="top-product-info">
                      <div className="top-product-name-row">
                        <span className="top-product-name">{prod.name}</span>
                        <span className="top-product-stats">
                          <strong>{prod.total_qty}</strong> ชิ้น · ฿{prod.total_revenue.toLocaleString()}
                        </span>
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-bar"
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-box">ยังไม่มีข้อมูลยอดขายเมนู</div>
            )}
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="owner-section-box">
          <div className="section-box-header">
            <div className="box-title-group">
              <CreditCard size={20} className="text-emerald-500" />
              <h2>สัดส่วนช่องทางชำระเงิน (Payment Methods)</h2>
            </div>
            <span className="section-tag">ยอดรวมทั้งหมด</span>
          </div>

          <div className="payment-breakdown-list">
            {paymentBreakdown && paymentBreakdown.length > 0 ? (
              paymentBreakdown.map((pm) => {
                const details = getPaymentDetails(pm.payment_method);
                const percent = allTime.sales > 0 ? Math.round((pm.total / allTime.sales) * 100) : 0;
                return (
                  <div key={pm.payment_method} className={`payment-card ${details.class}`}>
                    <div className="payment-card-left">
                      <div className="payment-icon-pill">{details.icon}</div>
                      <div>
                        <div className="payment-name">{details.label}</div>
                        <div className="payment-count">{pm.count} รายการ ({percent}%)</div>
                      </div>
                    </div>
                    <div className="payment-total">฿{pm.total.toLocaleString()}</div>
                  </div>
                );
              })
            ) : (
              <div className="empty-box">ยังไม่มีข้อมูลการชำระเงิน</div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Orders Table */}
      <div className="owner-section-box orders-table-box">
        <div className="table-box-header">
          <div className="box-title-group">
            <ShoppingBag size={20} className="text-blue-500" />
            <h2>ประวัติรายการสั่งซื้อล่าสุด (Recent Orders Ledger)</h2>
            <span className="order-count-chip">{filteredOrders.length} รายการ</span>
          </div>

          <div className="table-controls">
            {/* Search Box */}
            <div className="table-search-input">
              <Search size={16} />
              <input
                type="text"
                placeholder="ค้นหาเลขออเดอร์ / คิว..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Status Filter Tabs */}
            <div className="status-filter-group">
              <button
                className={`filter-btn ${statusFilter === "all" ? "active" : ""}`}
                onClick={() => setStatusFilter("all")}
              >
                ทั้งหมด
              </button>
              <button
                className={`filter-btn ${statusFilter === "pending" ? "active" : ""}`}
                onClick={() => setStatusFilter("pending")}
              >
                รอทำ
              </button>
              <button
                className={`filter-btn ${statusFilter === "cooking" ? "active" : ""}`}
                onClick={() => setStatusFilter("cooking")}
              >
                กำลังทำ
              </button>
              <button
                className={`filter-btn ${statusFilter === "completed" ? "active" : ""}`}
                onClick={() => setStatusFilter("completed")}
              >
                เสร็จสิ้น
              </button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="table-responsive">
          <table className="owner-orders-table">
            <thead>
              <tr>
                <th>เลขคิว / บิล</th>
                <th>เวลาสั่ง</th>
                <th>รายการสินค้าและตัวเลือก (Items & Options)</th>
                <th>วิธีชำระ</th>
                <th>ยอดเงิน</th>
                <th>สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.length > 0 ? (
                filteredOrders.map((ord) => {
                  const pay = getPaymentDetails(ord.payment_method);
                  const dateStr = new Date(ord.created_at).toLocaleTimeString("th-TH", {
                    hour: "2-digit",
                    minute: "2-digit",
                  });
                  return (
                    <tr key={ord.id}>
                      <td>
                        <div className="order-id-cell">
                          <span className="queue-pill">คิว A-{ord.queue_no}</span>
                          <span className="order-no-sub">{ord.order_no}</span>
                        </div>
                      </td>
                      <td className="time-cell">{dateStr} น.</td>
                      <td>
                        <div className="order-items-compact">
                          {(ord.items || []).map((it, i) => {
                            let optText = "";
                            try {
                              const opts = typeof it.options_json === "string" ? JSON.parse(it.options_json) : it.options_json;
                              const parts = [];
                              if (opts?.size) parts.push(`ไซส์ ${opts.size}`);
                              if (opts?.sweetness) parts.push(opts.sweetness);
                              if (opts?.toppings?.length) parts.push(`ท็อปปิง: ${opts.toppings.join(", ")}`);
                              if (opts?.note) parts.push(`หมายเหตุ: ${opts.note}`);
                              optText = parts.join(" · ");
                            } catch (e) {
                              optText = "";
                            }
                            return (
                              <div key={i} className="item-line">
                                <span className="item-name">{it.product_name} x{it.quantity}</span>
                                {optText && <span className="item-opt">({optText})</span>}
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td>
                        <div className="pay-method-badge">
                          {pay.icon}
                          <span>{pay.label}</span>
                        </div>
                      </td>
                      <td className="amount-cell">฿{ord.total_amount.toLocaleString()}</td>
                      <td>{getStatusBadge(ord.status)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-gray-400">
                    ไม่พบรายการออเดอร์ตามเงื่อนไขที่เลือก
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )}
</div>
);
}
