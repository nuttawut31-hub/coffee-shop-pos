import React, { useState, useEffect, useRef } from "react";
import {
  Coffee,
  Monitor,
  Layers,
  Clock,
  TrendingUp,
  Store,
  ChevronDown,
  Check,
} from "lucide-react";

export default function Navbar({
  activeTab,
  setActiveTab,
  queueCount = 0,
  branches = [],
  selectedBranch = 1,
  onSelectBranch,
}) {
  const [timeStr, setTimeStr] = useState("");
  const [branchOpen, setBranchOpen] = useState(false);
  const branchDropdownRef = useRef(null);

  const branchList =
    branches && branches.length > 0
      ? branches
      : [
          { id: 1, name: "สาขา 1: หน้า ม.บูรพา (Main Campus)" },
          { id: 2, name: "สาขา 2: ห้างแหลมทอง (Mall Branch)" },
          { id: 3, name: "สาขา 3: ชายหาดวอนนภา (Beachfront)" },
        ];

  const currentBranch =
    branchList.find((b) => b.id === Number(selectedBranch)) || branchList[0];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        branchDropdownRef.current &&
        !branchDropdownRef.current.contains(e.target)
      ) {
        setBranchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("th-TH", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-brand">
        <div className="brand-logo">
          <Coffee size={24} className="brand-icon" />
        </div>
        <div className="brand-text">
          <h1 className="brand-title">Coffee Shop POS</h1>
        </div>
      </div>

      <div className="navbar-tabs">
        <button
          className={`nav-tab-btn ${activeTab === "cashier" ? "active" : ""}`}
          onClick={() => setActiveTab("cashier")}
        >
          <Layers size={18} />
          <span>หน้าจอแคชเชียร์ (POS)</span>
        </button>

        <button
          className={`nav-tab-btn ${activeTab === "barista" ? "active" : ""}`}
          onClick={() => setActiveTab("barista")}
        >
          <Monitor size={18} />
          <span>หน้าจอบาริสต้า (Queue)</span>
          {queueCount > 0 && (
            <span className="queue-badge animate-pulse">{queueCount}</span>
          )}
        </button>

        <button
          className={`nav-tab-btn ${activeTab === "owner" ? "active" : ""}`}
          onClick={() => setActiveTab("owner")}
        >
          <TrendingUp size={18} />
          <span>แดชบอร์ดเจ้าของร้าน (Owner)</span>
        </button>
      </div>

      <div className="navbar-info">
        {/* Custom Branch Switcher Dropdown */}
        <div
          className="custom-dropdown-container branch-dropdown-container"
          ref={branchDropdownRef}
          title="สลับสาขาที่กำลังใช้งาน"
        >
          <button
            type="button"
            className={`branch-dropdown-trigger ${branchOpen ? "open" : ""}`}
            onClick={() => setBranchOpen(!branchOpen)}
            aria-expanded={branchOpen}
          >
            <Store size={16} className="branch-icon" />
            <span className="branch-selected-label">
              {currentBranch?.name}
            </span>
            <ChevronDown
              size={14}
              className={`dropdown-chevron ${branchOpen ? "rotate" : ""}`}
            />
          </button>

          {branchOpen && (
            <div className="custom-dropdown-menu branch-dropdown-menu animate-fadeIn">
              <div className="dropdown-menu-header">เลือกสาขาประจำจุดขาย</div>
              {branchList.map((b) => (
                <button
                  type="button"
                  key={b.id}
                  className={`dropdown-menu-item ${
                    Number(selectedBranch) === b.id ? "active" : ""
                  }`}
                  onClick={() => {
                    if (onSelectBranch) onSelectBranch(b.id);
                    setBranchOpen(false);
                  }}
                >
                  <span className="dropdown-item-name">{b.name}</span>
                  {Number(selectedBranch) === b.id && (
                    <Check size={15} className="dropdown-item-check" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="time-display">
          <Clock size={16} className="time-icon" />
          <span>{timeStr}</span>
        </div>
      </div>
    </header>
  );
}
