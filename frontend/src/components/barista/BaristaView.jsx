import React, { useState, useEffect, useRef } from 'react';
import {
  RefreshCw,
  Coffee,
  CheckCircle,
  Clock,
  Play,
  Flame,
  CheckCheck,
  AlertCircle,
  Inbox,
} from 'lucide-react';
import QueueCard from './QueueCard';
import { fetchQueue, updateOrderStatus, fetchProducts, cancelOrder } from '../../services/api';

export default function BaristaView({ selectedBranch = 1, branches = [] }) {
  const [orders, setOrders] = useState([]);
  const [optionsMap, setOptionsMap] = useState({ sizes: {}, sweetness: {}, toppings: {} });
  const [activeFilter, setActiveFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState(selectedBranch ? String(selectedBranch) : 'all');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [cancellingId, setCancellingId] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(new Date());

  // Update branch filter when parent navbar changes selected branch
  useEffect(() => {
    if (selectedBranch) {
      setBranchFilter(String(selectedBranch));
    }
  }, [selectedBranch]);

  // Load option definitions once for decoding formulas
  useEffect(() => {
    async function loadOptions() {
      try {
        const prodData = await fetchProducts();
        const map = {
          sizes: {},
          sweetness: {},
          toppings: {},
          temperature: {},
          bakery_option: {},
        };
        (prodData.options?.temperature || []).forEach((opt) => {
          map.temperature[opt.id] = opt.name;
        });
        (prodData.options?.size || []).forEach((opt) => {
          map.sizes[opt.id] = opt.name;
        });
        (prodData.options?.sweetness || []).forEach((opt) => {
          map.sweetness[opt.id] = opt.name;
        });
        (prodData.options?.topping || []).forEach((opt) => {
          map.toppings[opt.id] = opt.name;
        });
        (prodData.options?.bakery_option || []).forEach((opt) => {
          map.bakery_option[opt.id] = opt.name;
        });
        setOptionsMap(map);
      } catch (err) {
        console.error('Failed to load options metadata:', err);
      }
    }
    loadOptions();
  }, []);

  // Fetch queue data filtered by branch
  const loadQueueData = async (showLoadingSpinner = false) => {
    if (showLoadingSpinner) setIsRefreshing(true);
    try {
      const data = await fetchQueue(branchFilter === 'all' ? null : branchFilter);
      // Ensure it's an array
      const queueList = Array.isArray(data) ? data : data.value || [];
      setOrders(queueList);
      setLastRefreshedAt(new Date());
      setErrorMsg('');
    } catch (err) {
      console.error('Error fetching queue:', err);
      setErrorMsg(err.message || 'ไม่สามารถโหลดข้อมูลคิวได้');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Polling every 3 seconds according to NFR-02
  useEffect(() => {
    loadQueueData(false);
    const interval = setInterval(() => {
      loadQueueData(false);
    }, 3000);
    return () => clearInterval(interval);
  }, [branchFilter]);

  // Update order status handler
  const handleUpdateStatus = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      await updateOrderStatus(orderId, newStatus);
      // Immediately reload queue data
      await loadQueueData(false);
    } finally {
      setUpdatingId(null);
    }
  };

  // Cancel order handler
  const handleCancelOrder = async (orderId) => {
    setCancellingId(orderId);
    try {
      await cancelOrder(orderId);
      await loadQueueData(false);
    } catch (err) {
      setErrorMsg(err.message || 'ไม่สามารถยกเลิกออเดอร์ได้');
    } finally {
      setCancellingId(null);
    }
  };

  // Calculate counts for badges
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const cookingOrders = orders.filter((o) => o.status === 'cooking');
  const readyOrders = orders.filter((o) => o.status === 'ready');

  // Filtered orders
  const displayedOrders = orders.filter((order) => {
    if (activeFilter === 'pending') return order.status === 'pending';
    if (activeFilter === 'cooking') return order.status === 'cooking';
    if (activeFilter === 'ready') return order.status === 'ready';
    return true; // 'all'
  });

  return (
    <div className="barista-view-container animate-fadeIn">
      {/* Top Station Header */}
      <div className="barista-top-header">
        <div className="station-brand-group">
          <div className="station-icon-box">
            <Coffee size={24} />
          </div>
          <div>
            <h2 className="station-title">สถานีชงเครื่องดื่ม (Barista Station)</h2>
            <div className="station-subtitle">
              <span>อัปเดตอัตโนมัติทุก 3 วินาที</span>
              <span className="dot-separator">•</span>
              <span>
                อัปเดตล่าสุด {lastRefreshedAt.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
              </span>
            </div>
          </div>
        </div>

        <div className="barista-header-actions">
          {/* Branch Filter Pills */}
          <div className="barista-branch-pills">
            <button
              className={`branch-pill ${branchFilter === 'all' ? 'active' : ''}`}
              onClick={() => setBranchFilter('all')}
            >
              ทุกสาขา
            </button>
            {(branches || []).map((b) => (
              <button
                key={b.id}
                className={`branch-pill ${branchFilter === String(b.id) ? 'active' : ''}`}
                onClick={() => setBranchFilter(String(b.id))}
              >
                {b.name.split(':')[0] || b.name}
              </button>
            ))}
          </div>

          <button
            className={`manual-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
            onClick={() => loadQueueData(true)}
            title="รีเฟรชข้อมูลเดี๋ยวนี้"
          >
            <RefreshCw size={16} />
            <span>รีเฟรช</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="barista-stats-grid">
        <div
          className={`stat-card pending ${activeFilter === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'pending' ? 'all' : 'pending')}
        >
          <div className="stat-card-icon">
            <Clock size={20} />
          </div>
          <div className="stat-card-info">
            <span className="stat-num">{pendingOrders.length}</span>
            <span className="stat-label">รอทำ (Pending)</span>
          </div>
        </div>

        <div
          className={`stat-card cooking ${activeFilter === 'cooking' ? 'active' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'cooking' ? 'all' : 'cooking')}
        >
          <div className="stat-card-icon">
            <Flame size={20} />
          </div>
          <div className="stat-card-info">
            <span className="stat-num">{cookingOrders.length}</span>
            <span className="stat-label">กำลังชง (In Progress)</span>
          </div>
        </div>

        <div
          className={`stat-card ready ${activeFilter === 'ready' ? 'active' : ''}`}
          onClick={() => setActiveFilter(activeFilter === 'ready' ? 'all' : 'ready')}
        >
          <div className="stat-card-icon">
            <CheckCheck size={20} />
          </div>
          <div className="stat-card-info">
            <span className="stat-num">{readyOrders.length}</span>
            <span className="stat-label">พร้อมเสิร์ฟ (Ready)</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="barista-filter-bar">
        <div className="filter-pills">
          <button
            className={`filter-pill ${activeFilter === 'all' ? 'active' : ''}`}
            onClick={() => setActiveFilter('all')}
          >
            ทั้งหมด ({orders.length})
          </button>
          <button
            className={`filter-pill pending ${activeFilter === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveFilter('pending')}
          >
            🟡 รอทำ ({pendingOrders.length})
          </button>
          <button
            className={`filter-pill cooking ${activeFilter === 'cooking' ? 'active' : ''}`}
            onClick={() => setActiveFilter('cooking')}
          >
            🟠 กำลังชง ({cookingOrders.length})
          </button>
          <button
            className={`filter-pill ready ${activeFilter === 'ready' ? 'active' : ''}`}
            onClick={() => setActiveFilter('ready')}
          >
            🟢 พร้อมเสิร์ฟ ({readyOrders.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="barista-error-banner animate-fadeIn">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Orders Grid / Queue Cards */}
      {isLoading ? (
        <div className="barista-loading-state">
          <RefreshCw size={32} className="spin-slow" />
          <p>กำลังเชื่อมต่อระบบคิวบาริสต้า...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div className="barista-empty-state animate-popIn">
          <div className="empty-icon-circle">
            <CheckCircle size={44} className="empty-check-icon" />
          </div>
          <h3>ยอดเยี่ยม! ไม่มีคิวค้างในขณะนี้</h3>
          <p>
            {activeFilter === 'all'
              ? 'ออเดอร์ทั้งหมดถูกจัดทำและส่งมอบเรียบร้อยแล้ว เมื่อมีคำสั่งซื้อใหม่จะปรากฏขึ้นอัตโนมัติ'
              : `ไม่มีออเดอร์ในสถานะ "${activeFilter}"`}
          </p>
        </div>
      ) : (
        <div className="barista-cards-grid">
          {displayedOrders.map((order) => (
            <QueueCard
              key={order.id}
              order={order}
              optionsMap={optionsMap}
              onUpdateStatus={handleUpdateStatus}
              onCancelOrder={handleCancelOrder}
              isUpdating={updatingId === order.id}
              isCancelling={cancellingId === order.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
