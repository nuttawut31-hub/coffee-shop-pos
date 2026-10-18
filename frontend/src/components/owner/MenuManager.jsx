import React, { useState, useEffect, useRef } from "react";
import {
  Plus,
  Edit3,
  Trash2,
  Search,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  X,
  Coffee,
  Sparkles,
  CupSoda,
  Croissant,
  RefreshCw,
  Tag,
  UploadCloud,
  Upload,
  ChevronDown,
  Check,
} from "lucide-react";
import {
  fetchProducts,
  fetchCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
} from "../../services/api";

const PRESET_IMAGES = [
  {
    name: "กาแฟลาเต้",
    url: "https://images.unsplash.com/photo-1534778101976-62847782c213?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "อเมริกาโน",
    url: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "ชาเขียวมัทฉะ",
    url: "https://images.unsplash.com/photo-1536256263959-770b48d82b0a?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "ชาไทยเย็น",
    url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "สมูทตี้",
    url: "https://images.unsplash.com/photo-1553530666-ba11a7da3888?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "ครัวซองต์",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=500&auto=format&fit=crop&q=60",
  },
  {
    name: "บราวนี่",
    url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=500&auto=format&fit=crop&q=60",
  },
];

export default function MenuManager({ onMenuUpdated }) {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCatId, setSelectedCatId] = useState("all");

  // Notification banners
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  // Modal states
  const [modalMode, setModalMode] = useState(null); // 'add' | 'edit' | null
  const [targetProduct, setTargetProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    categoryId: 1,
    basePrice: "",
    imageUrl: "",
  });
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryDropdownRef = useRef(null);

  // File Upload states
  const [imageInputMode, setImageInputMode] = useState("upload"); // 'upload' | 'url'
  const [previewImage, setPreviewImage] = useState("");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [pendingImageBase64, setPendingImageBase64] = useState(null);
  const fileInputRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(e.target)
      ) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Delete modal state
  const [deletingProduct, setDeletingProduct] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetchProducts(),
        fetchCategories().catch(() => []),
      ]);

      // Flatten products list from categories
      const flatList = [];
      (prodRes.categories || []).forEach((cat) => {
        (cat.products || []).forEach((p) => {
          flatList.push({
            ...p,
            category_id: cat.id,
            category_name: cat.name,
          });
        });
      });
      setProducts(flatList);

      if (Array.isArray(catRes) && catRes.length > 0) {
        setCategories(catRes);
      } else if (prodRes.categories) {
        setCategories(
          prodRes.categories.map((c) => ({ id: c.id, name: c.name })),
        );
      }
    } catch (err) {
      console.error("Failed to load products/categories:", err);
      setFeedback({ type: "error", message: "ไม่สามารถโหลดข้อมูลสินค้าได้" });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setModalMode("add");
    setTargetProduct(null);
    setFormData({
      name: "",
      categoryId: categories.length > 0 ? categories[0].id : 1,
      basePrice: "",
      imageUrl: "",
    });
    setImageInputMode("upload");
    setPreviewImage("");
    setSelectedFileName("");
    setPendingImageBase64(null);
    setFormError("");
  };

  const openEditModal = (prod) => {
    setModalMode("edit");
    setTargetProduct(prod);
    setFormData({
      name: prod.name,
      categoryId: prod.category_id,
      basePrice: prod.base_price,
      imageUrl: prod.image_url || "",
    });
    setImageInputMode("upload");
    setPreviewImage(prod.image_url || "");
    setSelectedFileName(prod.image_url ? "รูปภาพปัจจุบันของเมนู" : "");
    setPendingImageBase64(null);
    setFormError("");
  };

  const closeModal = () => {
    setModalMode(null);
    setTargetProduct(null);
    setPreviewImage("");
    setSelectedFileName("");
    setPendingImageBase64(null);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setFormError("กรุณาเลือกไฟล์รูปภาพเท่านั้น (JPG, PNG, WEBP, GIF)");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setFormError("ขนาดไฟล์รูปภาพต้องไม่เกิน 15MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64Data = e.target.result;
      setPreviewImage(base64Data);
      setSelectedFileName(file.name);
      setPendingImageBase64(base64Data);
      setFormData((prev) => ({ ...prev, imageUrl: base64Data }));
      setFormError("");
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPreviewImage("");
    setSelectedFileName("");
    setPendingImageBase64(null);
    setFormData((prev) => ({ ...prev, imageUrl: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.name.trim()) {
      setFormError("กรุณาระบุชื่อเมนู");
      return;
    }

    const price = parseInt(formData.basePrice, 10);
    if (isNaN(price) || price < 0) {
      setFormError("กรุณาระบุราคาเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalImageUrl = previewImage || formData.imageUrl;

      // ถ้ามีการเลือกไฟล์รูปภาพใหม่ ให้อัปโหลดผ่าน /api/upload
      if (pendingImageBase64) {
        try {
          const uploadRes = await uploadImage(pendingImageBase64);
          if (uploadRes && uploadRes.url) {
            finalImageUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn(
            "Upload to /api/upload failed, using base64 data URL directly:",
            uploadErr,
          );
          finalImageUrl = pendingImageBase64;
        }
      }

      if (modalMode === "add") {
        await createProduct({
          name: formData.name.trim(),
          categoryId: Number(formData.categoryId),
          basePrice: price,
          imageUrl: finalImageUrl ? finalImageUrl.trim() : null,
        });
        setFeedback({
          type: "success",
          message: `เพิ่มเมนู "${formData.name.trim()}" สำเร็จแล้ว!`,
        });
      } else if (modalMode === "edit" && targetProduct) {
        await updateProduct(targetProduct.id, {
          name: formData.name.trim(),
          categoryId: Number(formData.categoryId),
          basePrice: price,
          imageUrl: finalImageUrl ? finalImageUrl.trim() : null,
        });
        setFeedback({
          type: "success",
          message: `แก้ไขเมนู "${formData.name.trim()}" สำเร็จแล้ว!`,
        });
      }

      closeModal();
      await loadData();
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error("Save product error:", err);
      setFormError(err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(deletingProduct.id);
      setFeedback({
        type: "success",
        message: `ลบเมนู "${deletingProduct.name}" สำเร็จแล้ว`,
      });
      setDeletingProduct(null);
      await loadData();
      if (onMenuUpdated) onMenuUpdated();
    } catch (err) {
      console.error("Delete product error:", err);
      setFeedback({
        type: "error",
        message: err.message || "ไม่สามารถลบเมนูได้",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Filter products by category and search
  const filteredProducts = products.filter((prod) => {
    const matchCategory =
      selectedCatId === "all"
        ? true
        : String(prod.category_id) === String(selectedCatId);
    const matchSearch =
      searchTerm.trim() === ""
        ? true
        : prod.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (prod.category_name &&
            prod.category_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase()));
    return matchCategory && matchSearch;
  });

  return (
    <div className="menu-manager-container animate-fadeIn">
      {/* Top Action Bar */}
      <div className="menu-mgr-header">
        <div>
          <h2 className="menu-mgr-title">
            จัดการเมนูและราคาขาย (Manage Menu & Pricing)
          </h2>
          <p className="menu-mgr-subtitle">
            เพิ่ม แก้ไขราคา ปรับปรุงรูปภาพ หรือลบเมนูในระบบ
          </p>
        </div>

        <div className="menu-mgr-actions">
          <button
            className="owner-refresh-btn"
            onClick={() => loadData(true)}
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw size={16} className={refreshing ? "rotating" : ""} />
            <span>รีเฟรช</span>
          </button>

          <button className="btn-add-product" onClick={openAddModal}>
            <Plus size={18} />
            <span>เพิ่มเมนูใหม่</span>
          </button>
        </div>
      </div>

      {/* Feedback banner */}
      {feedback && (
        <div
          className={`mgr-feedback-banner ${feedback.type} animate-fadeIn`}
          onClick={() => setFeedback(null)}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{feedback.message}</span>
          <button className="mgr-feedback-close">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Search and Category Filter Toolbar */}
      <div className="menu-mgr-toolbar">
        <div className="menu-mgr-search-box">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="ค้นหาชื่อเมนู หรือหมวดหมู่..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              className="clear-search-btn"
              onClick={() => setSearchTerm("")}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="menu-mgr-category-pills">
          <button
            className={`cat-pill ${selectedCatId === "all" ? "active" : ""}`}
            onClick={() => setSelectedCatId("all")}
          >
            ทั้งหมด ({products.length})
          </button>
          {categories.map((c) => {
            const count = products.filter((p) => p.category_id === c.id).length;
            return (
              <button
                key={c.id}
                className={`cat-pill ${selectedCatId === String(c.id) ? "active" : ""}`}
                onClick={() => setSelectedCatId(String(c.id))}
              >
                {c.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Product List Table / Grid */}
      {loading ? (
        <div className="owner-loading-container">
          <div className="owner-spinner"></div>
          <p>กำลังโหลดรายการเมนู...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="empty-products-state">
          <Coffee size={48} className="empty-icon" />
          <h3>ไม่พบเมนูสินค้าที่ค้นหา</h3>
          <p>ลองเปลี่ยนคำค้นหา หรือกดปุ่ม "เพิ่มเมนูใหม่" เพื่อสร้างรายการ</p>
          <button className="btn-add-product" onClick={openAddModal}>
            <Plus size={16} /> เพิ่มเมนูใหม่
          </button>
        </div>
      ) : (
        <div className="menu-grid-container">
          {filteredProducts.map((prod) => (
            <div key={prod.id} className="menu-item-card animate-fadeIn">
              <div className="item-card-image-wrap">
                {prod.image_url ? (
                  <img
                    src={prod.image_url}
                    alt={prod.name}
                    className="item-card-image"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.nextSibling.style.display = "flex";
                    }}
                  />
                ) : null}
                <div
                  className="item-card-image-fallback"
                  style={{ display: prod.image_url ? "none" : "flex" }}
                >
                  <Coffee size={32} />
                </div>
                <span className="item-card-cat-badge">
                  {prod.category_name}
                </span>
              </div>

              <div className="item-card-content">
                <div className="item-card-header">
                  <h3 className="item-card-title">{prod.name}</h3>
                  <div className="item-card-price">
                    ฿{Number(prod.base_price).toFixed(2)}
                  </div>
                </div>

                <div className="item-card-footer">
                  <span className="item-status-tag active">
                    เปิดขาย (Active)
                  </span>
                  <div className="item-card-btn-group">
                    <button
                      className="btn-item-edit"
                      onClick={() => openEditModal(prod)}
                      title="แก้ไขข้อมูลและราคา"
                    >
                      <Edit3 size={15} />
                      <span>แก้ไข</span>
                    </button>
                    <button
                      className="btn-item-delete"
                      onClick={() => setDeletingProduct(prod)}
                      title="ลบเมนูนี้"
                    >
                      <Trash2 size={15} />
                      <span>ลบ</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {modalMode && (
        <div className="modal-backdrop">
          <div className="modal-dialog menu-form-modal animate-popIn">
            <div className="modal-header">
              <div className="modal-title-group">
                <div className="modal-title-inline">
                  {modalMode === "add" ? (
                    <Plus size={22} className="modal-title-icon" />
                  ) : (
                    <Edit3 size={20} className="modal-title-icon" />
                  )}
                  <h2 className="modal-title">
                    {modalMode === "add"
                      ? "เพิ่มเมนูสินค้าใหม่"
                      : "แก้ไขเมนูและราคา"}
                  </h2>
                </div>
                <p className="modal-subtitle">
                  {modalMode === "add"
                    ? "กรอกข้อมูลเมนู หมวดหมู่ ราคา และใส่รูปภาพประกอบ"
                    : `แก้ไขข้อมูลสำหรับ ID #${targetProduct?.id}`}
                </p>
              </div>
              <button
                className="modal-close-btn"
                onClick={closeModal}
                aria-label="ปิด"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="menu-form-content">
              <div className="menu-form-body custom-scroll">
                {formError && (
                  <div className="form-error-alert animate-fadeIn">
                    <AlertCircle size={16} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-layout-cols">
                  {/* Left Column: Form Inputs */}
                  <div className="form-inputs-col">
                    {/* Product Name */}
                    <div className="form-group">
                      <label className="form-label">
                        ชื่อเมนูสินค้า <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="เช่น คาราเมลมัคคิอาโต (Caramel Macchiato)"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        required
                      />
                    </div>

                    {/* Category and Base Price Row */}
                    <div className="form-row-2col">
                      <div className="form-group">
                        <label className="form-label">
                          หมวดหมู่ <span className="text-red-500">*</span>
                        </label>
                        <div
                          className="custom-dropdown-container form-dropdown-container"
                          ref={categoryDropdownRef}
                        >
                          <button
                            type="button"
                            className={`form-select-trigger ${
                              categoryDropdownOpen ? "open" : ""
                            }`}
                            onClick={() =>
                              setCategoryDropdownOpen(!categoryDropdownOpen)
                            }
                            aria-expanded={categoryDropdownOpen}
                          >
                            <span className="select-trigger-label">
                              {(
                                categories.find(
                                  (c) => c.id === Number(formData.categoryId),
                                ) || categories[0]
                              )?.name || "เลือกหมวดหมู่"}
                            </span>
                            <ChevronDown
                              size={16}
                              className={`dropdown-chevron ${
                                categoryDropdownOpen ? "rotate" : ""
                              }`}
                            />
                          </button>

                          {categoryDropdownOpen && (
                            <div className="custom-dropdown-menu form-dropdown-menu animate-fadeIn">
                              {categories.map((c) => (
                                <button
                                  type="button"
                                  key={c.id}
                                  className={`dropdown-menu-item ${
                                    Number(formData.categoryId) === c.id
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      categoryId: c.id,
                                    });
                                    setCategoryDropdownOpen(false);
                                  }}
                                >
                                  <span className="dropdown-item-name">
                                    {c.name}
                                  </span>
                                  {Number(formData.categoryId) === c.id && (
                                    <Check
                                      size={15}
                                      className="dropdown-item-check"
                                    />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">
                          ราคาฐาน (฿) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          className="form-input"
                          placeholder="เช่น 60"
                          value={formData.basePrice}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              basePrice: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>

                    {/* Image Upload / URL Selection Section */}
                    <div className="form-group">
                      <label className="form-label">
                        รูปภาพเมนูสินค้า (Product Image)
                      </label>

                      {/* Hidden file input */}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileSelect(e.target.files[0]);
                          }
                        }}
                        style={{ display: "none" }}
                      />

                      {/* Mode Toggle Tabs */}
                      <div className="image-mode-tabs">
                        <button
                          type="button"
                          className={`img-tab-btn ${imageInputMode === "upload" ? "active" : ""}`}
                          onClick={() => setImageInputMode("upload")}
                        >
                          <UploadCloud size={15} />
                          <span>อัปโหลดไฟล์จากเครื่อง (แนะนำ)</span>
                        </button>
                        <button
                          type="button"
                          className={`img-tab-btn ${imageInputMode === "url" ? "active" : ""}`}
                          onClick={() => setImageInputMode("url")}
                        >
                          <ImageIcon size={15} />
                          <span>ใส่ลิงก์ URL หรือเลือกรูปตัวอย่าง</span>
                        </button>
                      </div>

                      {/* 1. File Upload Dropzone Mode */}
                      {imageInputMode === "upload" && (
                        <div className="upload-mode-content">
                          {previewImage ? (
                            <div className="uploaded-file-card">
                              <div className="file-meta">
                                <CheckCircle2
                                  size={20}
                                  className="file-check-icon"
                                />
                                <div className="file-meta-text">
                                  <span className="file-name-text">
                                    {selectedFileName || "รูปภาพพร้อมใช้งาน"}
                                  </span>
                                  <span className="file-sub-text">
                                    รูปภาพโหลดเรียบร้อยแล้ว
                                  </span>
                                </div>
                              </div>
                              <div className="file-actions">
                                <button
                                  type="button"
                                  className="btn-reupload"
                                  onClick={() => fileInputRef.current?.click()}
                                >
                                  <Upload size={14} />
                                  <span>เปลี่ยนรูป</span>
                                </button>
                                <button
                                  type="button"
                                  className="btn-remove-img"
                                  onClick={handleRemoveImage}
                                >
                                  <Trash2 size={14} />
                                  <span>ลบรูป</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div
                              className="image-dropzone-box"
                              onClick={() => fileInputRef.current?.click()}
                              onDragOver={(e) => e.preventDefault()}
                              onDrop={(e) => {
                                e.preventDefault();
                                if (
                                  e.dataTransfer.files &&
                                  e.dataTransfer.files[0]
                                ) {
                                  handleFileSelect(e.dataTransfer.files[0]);
                                }
                              }}
                            >
                              <div className="dropzone-icon-circle">
                                <UploadCloud size={28} />
                              </div>
                              <span className="dropzone-title">
                                คลิกเพื่อเลือกไฟล์รูปภาพ หรือลากไฟล์มาวางที่นี่
                              </span>
                              <span className="dropzone-hint">
                                รองรับไฟล์ JPG, PNG, WEBP, GIF (ขนาดสูงสุด 15MB)
                              </span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 2. Direct URL / Preset Mode */}
                      {imageInputMode === "url" && (
                        <div className="url-mode-content">
                          <div className="image-url-input-wrap">
                            <ImageIcon size={18} className="input-icon" />
                            <input
                              type="url"
                              className="form-input with-icon"
                              placeholder="https://... ใส่ลิงก์ตรงรูปภาพ (.jpg, .png)"
                              value={formData.imageUrl}
                              onChange={(e) => {
                                setFormData({
                                  ...formData,
                                  imageUrl: e.target.value,
                                });
                                setPreviewImage(e.target.value);
                              }}
                            />
                          </div>

                          {/* Quick Preset Image Buttons */}
                          <div className="preset-images-section">
                            <span className="preset-label">
                              หรือคลิกเลือกรูปภาพตัวอย่าง:
                            </span>
                            <div className="preset-chips">
                              {PRESET_IMAGES.map((preset, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  className="preset-chip"
                                  onClick={() => {
                                    setFormData({
                                      ...formData,
                                      imageUrl: preset.url,
                                    });
                                    setPreviewImage(preset.url);
                                    setSelectedFileName(preset.name);
                                  }}
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Live Image Preview */}
                  <div className="form-preview-col">
                    <span className="form-label">ตัวอย่างการแสดงผลรูปภาพ</span>
                    <div className="live-preview-box">
                      {previewImage ? (
                        <>
                          <img
                            src={previewImage}
                            alt="Preview"
                            className="preview-img"
                            onError={() => {
                              // If direct URL is invalid, clear preview
                              setPreviewImage("");
                            }}
                          />
                          <div className="preview-status-badge">
                            <CheckCircle2 size={13} />
                            <span>พร้อมแสดงผล</span>
                          </div>
                        </>
                      ) : (
                        <div className="preview-placeholder">
                          <ImageIcon size={40} className="preview-icon" />
                          <span>ยังไม่มีรูปภาพ</span>
                          <small>เลือกไฟล์หรือใส่ URL เพื่อดูตัวอย่าง</small>
                        </div>
                      )}
                    </div>
                    <div className="preview-card-info">
                      <strong>{formData.name || "ชื่อเมนูตัวอย่าง"}</strong>
                      <span className="preview-price">
                        ฿{Number(formData.basePrice || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions Footer: เส้นแบ่งขอบเต็มความกว้างเหมือนหน้าเพิ่ม order */}
              <div className="modal-footer menu-form-footer">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={closeModal}
                  disabled={isSubmitting}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="btn-save-product"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw size={16} className="rotating" />
                      <span>กำลังบันทึก...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>
                        {modalMode === "add"
                          ? "บันทึกเมนูใหม่"
                          : "บันทึกการแก้ไข"}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="modal-backdrop">
          <div className="modal-dialog modal-delete-confirm animate-popIn">
            <div className="delete-modal-icon-wrap">
              <Trash2 size={36} className="delete-icon" />
            </div>

            <h2 className="delete-modal-title">ยืนยันการลบเมนู</h2>
            <p className="delete-modal-desc">
              คุณแน่ใจหรือไม่ว่าต้องการลบเมนู{" "}
              <strong>"{deletingProduct.name}"</strong>?
              <br />
              <span className="text-amber-500">
                (เมนูนี้จะถูกซ่อนและไม่แสดงให้แคชเชียร์เลือกสั่งซื้ออีกต่อไป)
              </span>
            </p>

            <div className="delete-modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
              >
                ยกเลิก
              </button>
              <button
                className="btn-confirm-delete"
                onClick={confirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "กำลังลบ..." : "ยืนยันการลบ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
