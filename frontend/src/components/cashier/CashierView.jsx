import React, { useState, useEffect } from 'react';
import CategoryTabs from './CategoryTabs';
import ProductGrid from './ProductGrid';
import CustomizationModal from './CustomizationModal';
import CartSidebar from './CartSidebar';
import ReceiptModal from './ReceiptModal';
import { fetchProducts, createOrder } from '../../services/api';
import { AlertCircle, RefreshCw, Store } from 'lucide-react';

export default function CashierView({
  selectedBranch = 1,
  branches = [],
  onOrderPlaced,
  onSwitchToBarista,
}) {
  const currentBranch = branches.find((b) => b.id === Number(selectedBranch));
  const [categories, setCategories] = useState([]);
  const [options, setOptions] = useState({ size: [], sweetness: [], topping: [] });
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Cart State
  const [cartItems, setCartItems] = useState([]);
  // Customization Modal State
  const [activeModalProduct, setActiveModalProduct] = useState(null);
  // Receipt Modal State
  const [orderResult, setOrderResult] = useState(null);
  const [receiptCartSnapshot, setReceiptCartSnapshot] = useState([]);
  // Checkout submission loading
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load products on mount
  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    setIsLoading(true);
    setFetchError('');
    try {
      const data = await fetchProducts();
      setCategories(data.categories || []);
      setOptions(data.options || { size: [], sweetness: [], topping: [] });
    } catch (err) {
      console.error('Failed to load products:', err);
      setFetchError(err.message || 'ไม่สามารถโหลดรายการเมนูได้ กรุณาตรวจสอบการเชื่อมต่อ');
    } finally {
      setIsLoading(false);
    }
  };

  // Add customized product to cart
  const handleAddToCart = (item) => {
    setCartItems((prev) => {
      // Check if identical item already in cart (same product and customizations)
      const existingIdx = prev.findIndex((existing) => {
        if (item.isBakery || existing.isBakery) {
          return (
            existing.productId === item.productId &&
            existing.bakeryOptionId === item.bakeryOptionId
          );
        }
        return (
          existing.productId === item.productId &&
          existing.temperatureId === item.temperatureId &&
          existing.sizeId === item.sizeId &&
          existing.sweetnessId === item.sweetnessId &&
          JSON.stringify((existing.toppingIds || []).sort()) ===
            JSON.stringify((item.toppingIds || []).sort())
        );
      });

      if (existingIdx !== -1) {
        // Increment quantity and subtotal
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + item.quantity;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          subtotal: updated[existingIdx].unitPrice * newQty,
        };
        return updated;
      }

      return [...prev, item];
    });
  };

  // Update quantity in cart
  const handleUpdateQuantity = (index, newQty) => {
    if (newQty < 1) return;
    setCartItems((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        quantity: newQty,
        subtotal: updated[index].unitPrice * newQty,
      };
      return updated;
    });
  };

  // Remove single item
  const handleRemoveItem = (index) => {
    setCartItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Clear entire cart
  const handleClearCart = () => {
    setCartItems([]);
  };

  // Handle Checkout (Confirm Order - FR-03, FR-04, FR-05, FR-06)
  const handleCheckout = async ({ paymentMethod, items }) => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const result = await createOrder({
        paymentMethod,
        items,
        branchId: selectedBranch,
      });

      // Snapshot cart before clearing (for receipt print)
      setReceiptCartSnapshot([...cartItems]);
      // Show receipt modal
      setOrderResult(result);
      // Clear cart
      setCartItems([]);
      // Notify parent to refresh badge
      if (onOrderPlaced) onOrderPlaced();
    } catch (err) {
      console.error('Checkout error:', err);
      setSubmitError(err.message || 'เกิดข้อผิดพลาดในการบันทึกออเดอร์');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cashier-layout">
      {/* Left Menu Section */}
      <main className="menu-container">
        {/* Branch Info Banner */}
        <div className="cashier-branch-banner">
          <Store size={16} className="branch-banner-icon" />
          <span>
            กำลังให้บริการที่: <strong>{currentBranch ? currentBranch.name : `สาขา #${selectedBranch}`}</strong>
            {currentBranch?.address ? ` (${currentBranch.address})` : ''}
          </span>
        </div>

        {/* Category Filter Pills */}
        <CategoryTabs
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={setSelectedCategoryId}
        />

        {submitError && (
          <div className="cashier-error-banner animate-fadeIn">
            <AlertCircle size={18} />
            <span>{submitError}</span>
          </div>
        )}

        {/* Product Grid */}
        {isLoading ? (
          <div className="menu-loading-box">
            <RefreshCw size={32} className="spin-slow" />
            <p>กำลังโหลดรายการเมนู...</p>
          </div>
        ) : fetchError ? (
          <div className="menu-error-box">
            <AlertCircle size={36} />
            <p>{fetchError}</p>
            <button className="retry-btn" onClick={loadProducts}>
              ลองใหม่อีกครั้ง
            </button>
          </div>
        ) : (
          <ProductGrid
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelectProduct={(product) => setActiveModalProduct(product)}
          />
        )}
      </main>

      {/* Right Cart Sidebar */}
      <CartSidebar
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
        isSubmitting={isSubmitting}
      />

      {/* Customization Modal */}
      {activeModalProduct && (
        <CustomizationModal
          product={activeModalProduct}
          options={options}
          onClose={() => setActiveModalProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {/* Receipt & Queue Confirmation Modal */}
      {orderResult && (
        <ReceiptModal
          orderResult={orderResult}
          cartItems={receiptCartSnapshot}
          branchName={currentBranch ? currentBranch.name : `สาขา #${selectedBranch}`}
          onClose={() => setOrderResult(null)}
          onSwitchToBarista={onSwitchToBarista}
        />
      )}
    </div>
  );
}
