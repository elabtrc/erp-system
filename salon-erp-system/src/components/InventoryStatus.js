import React from 'react';

const InventoryStatus = ({ product, branchId }) => {
  if (!product || !branchId) return null;

  const inventoryItem = product.inventory?.find(i => i.branch_id === branchId);
  const quantity = inventoryItem?.quantity || 0;

  const getStatusClass = () => {
    if (quantity === 0) return 'out-of-stock';
    if (quantity <= product.reorder_level) return 'low-stock';
    return '';
  };

  return (
    <div className={`inventory-status ${getStatusClass()}`}>
      <span>Stock: {quantity}</span>
      {quantity <= product.reorder_level && (
        <span className="status-indicator">
          {quantity === 0 ? 'Out of Stock' : 'Low Stock'}
        </span>
      )}
    </div>
  );
};

export default InventoryStatus;