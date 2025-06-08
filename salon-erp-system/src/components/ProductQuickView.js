import React from 'react';
import InventoryStatus from './InventoryStatus';

const ProductQuickView = ({ product, branchId, onAddToCart }) => {
  if (!product) return null;

  return (
    <div className="product-quick-view">
      <h3>{product.product_name}</h3>
      <p>{product.description}</p>
      
      <div className="product-details">
        <div>Price: ${product.price.toFixed(2)}</div>
        <InventoryStatus product={product} branchId={branchId} />
      </div>
      
      <button 
        onClick={() => onAddToCart(product)}
        disabled={!product.inventory?.some(i => i.branch_id === branchId && i.quantity > 0)}
      >
        Add to Cart
      </button>
    </div>
  );
};

export default ProductQuickView;