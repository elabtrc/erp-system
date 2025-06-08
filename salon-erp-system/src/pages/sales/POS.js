import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar';
import { FaSearch, FaPlus, FaMinus, FaTrash } from 'react-icons/fa';
// import { Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api, { branchApi, customerApi, posApi } from '../../utils/api';
import './POS.css';

const POS = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
 // const [cartItems, setCartItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [amountTendered, setAmountTendered] = useState(0);
  const [gcashRef, setGcashRef] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryCounts, setCategoryCounts] = useState({});
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [discount, setDiscount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    address: ''
  });
  const [loading, setLoading] = useState({
    products: false,
    processing: false
  });
  const [error, setError] = useState(null);
  const isAdmin = user?.role?.toLowerCase() === 'admin';
  const userBranchId = user?.branchId;
  

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        setError(null);
  
        const [branchesRes, customersRes] = await Promise.all([
          branchApi.getAll(),
          customerApi.getAll()
        ]);
  
        const branches = branchesRes.data || [];
        const customers = customersRes.data || [];
  
        setBranches(branches);
        setCustomers(customers);
  
        if (isAdmin) {
          // Admin: allow switching and default to first
          setSelectedBranch(branches[0] || null);
        } else if (userBranchId) {
          // Non-admin: force assigned branch
          const branch = branches.find(b => b.branch_id === parseInt(userBranchId));
          setSelectedBranch(branch || null);
        }
  
      } catch (error) {
        console.error('Error loading initial data:', error);
        setError('Failed to load initial data');
      } finally {
        setLoading(false);
      }
    };
  
    fetchInitialData();
  }, [isAdmin, userBranchId]);
  


  
  

  
  const fetchProductsAndServices = useCallback(async () => {
    if (!selectedBranch) return;
    try {
      const token = localStorage.getItem('token');
  
      const [productsRes, servicesRes] = await Promise.all([
        fetch(`/api/stocks/branch/${selectedBranch.branch_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`/api/services`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
      ]);
  
      const productsJson = await productsRes.json();
      const productsData = Array.isArray(productsJson) ? productsJson : [];
      const servicesData = await servicesRes.json();
  
      const products = productsData.map(product => ({
        ...product,
        product_id: product.product_id,
        product_name: product.product_name,
        price: Number(product.price),
        quantity: Number(product.quantity),
        category_name: product.category_name,
        type: 'product'
      }));
  
      const services = servicesData.map(service => ({
        product_id: `service-${service.service_id}`,
        product_name: service.service_name,
        price: Number(service.price),
        quantity: 9999,
        category_name: 'Services',
        type: 'service'
      }));
  
      const combinedItems = [...products, ...services];
      const categoryCounts = {};
  
      combinedItems.forEach(item => {
        if (item.category_name) {
          categoryCounts[item.category_name] = (categoryCounts[item.category_name] || 0) + 1;
        }
      });
  
      setProducts(combinedItems);
      setCategories(['All', ...Object.keys(categoryCounts)]);
      setCategoryCounts(categoryCounts);
    } catch (error) {
      console.error('Failed to fetch products/services:', error);
    }
  }, [selectedBranch]); // <- include any external variables used inside
  
  useEffect(() => {
    fetchProductsAndServices();
  }, [fetchProductsAndServices]);
  
  
  useEffect(() => {
    if (customerSearch.trim() === '') {
      setFilteredCustomers([]);
    } else {
      const results = customers.filter(c =>
        (`${c.first_name} ${c.last_name}`).toLowerCase().includes(customerSearch.toLowerCase())
      );
      setFilteredCustomers(results);
    }
  }, [customerSearch, customers]);
  
  

  // Calculate totals
  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const total = subtotal - discount;
  
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      discount: parseFloat(discount.toFixed(2))
    };
  };
  
  const { subtotal, total } = calculateTotals();
  

  // Product functions
  const addToCart = (product) => {
    // Skip branch check for services
    if (product.type !== 'service') {
      const cartBranchId = cart.length > 0 ? cart[0].branch_id : selectedBranch?.branch_id;
  
      if (product.branch_id !== cartBranchId) {
        alert(`🚫 You can only add products from "${selectedBranch?.branch_name}".`);
        return;
      }
    }
  
    const existingItem = cart.find((item) => item.product_id === product.product_id);
  
    if (existingItem) {
      const updatedCart = cart.map((item) =>
        item.product_id === product.product_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
      setCart(updatedCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };
  
  
  useEffect(() => {
    setCart([]); // Clear the cart whenever branch changes
  }, [selectedBranch]);
  
  

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const inventoryItem = products.find(p => 
      p.product_id === productId && 
      p.branch_id === selectedBranch?.branch_id
    );
    
    if (quantity > (inventoryItem?.quantity || 0)) {
      alert(`Only ${inventoryItem.quantity} available in stock`);
      return;
    }

    setCart(prev => 
      prev.map(item => 
        item.product_id === productId ? { ...item, quantity } : item
      )
    );
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.product_id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
  };

  // Transaction processing
  const processSale = async () => {
    if (cart.length === 0) {
      alert('Please add items to the cart');
      return;
    }
  
    if (paymentMethod === 'cash') {
      if (!amountTendered || isNaN(amountTendered)) {
        alert('Please enter the amount tendered.');
        return;
      }
  
      if (amountTendered < total) {
        alert('🚫 Amount tendered is less than the total. Please enter a valid amount.');
        return;
      }
    }
  
    if (paymentMethod === 'gcash') {
      if (!gcashRef.trim()) {
        alert('Please enter the GCash reference number.');
        return;
      }
    }
  
    setLoading(prev => ({ ...prev, processing: true }));
    setError(null);
  
    try {
      const response = await posApi.createTransaction({
        branch_id: selectedBranch.branch_id,
        cashier_id: user.user_id,
        customer_id: selectedCustomer?.customer_id,
        total_amount: total,
        amount_tendered: paymentMethod === 'cash' ? amountTendered : total,
        change_amount: paymentMethod === 'cash' ? amountTendered - total : 0,
        payment_method: paymentMethod,
        gcash_reference: paymentMethod === 'gcash' ? gcashRef : null,
        items: cart.map(item => ({
          product_id: item.product_id,
          quantity: item.quantity,
          price: item.price
        }))
      });
  
      alert(`✅ Sale completed! Receipt #${response.data.receipt_number}`);
      clearCart();
      await fetchProductsAndServices();
    } catch (error) {
      console.error('Transaction error:', error);
      setError(error.response?.data?.error || 'Failed to process transaction');
    } finally {
      setLoading(prev => ({ ...prev, processing: false }));
    }
  };
  
  

  // Customer functions
  const addCustomer = async () => {
    if (!newCustomer.first_name || !newCustomer.last_name) {
      alert('Customer name is required');
      return;
    }

    try {
      const response = await customerApi.create({
        first_name: newCustomer.first_name,
        last_name: newCustomer.last_name,
        phone: newCustomer.phone || null,
        email: newCustomer.email || null,
        address: newCustomer.address || null,
        customer_type: 'Regular'
      });
      
      const updatedCustomers = [...customers, response.data];
      setCustomers(updatedCustomers);
      setSelectedCustomer(response.data);
      setNewCustomer({ first_name: '', last_name: '', phone: '', email: '', address: '' });
      setShowCustomerModal(false);
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  // Filter products
  const filteredProducts = products.filter(product => 
    product.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // const categories = ['All', ...new Set(
  //   products
  //     .filter(p => p.type === 'product')
  //     .map(p => p?.category_name)
  //     .filter(Boolean)
  // )];
  

  const displayProducts = selectedCategory === 'All' 
    ? filteredProducts 
    : filteredProducts.filter(p => p?.category_name === selectedCategory);

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Salon & Spa POS System</h1>
          <div className="icon-1">
            {/* <Bell className="icon" size={20} /> */}
            <div className="user-avatar"></div>
          </div>
        </div>
  
        <div className="pos-container">
          <div className="pos-header">
            <h2>New Sale</h2>
            
            <div className="branch-selector">
  <label>Branch:</label>
  <select
  value={selectedBranch?.branch_id || ''}
  onChange={(e) => {
    const branchId = parseInt(e.target.value);
    const branch = branches.find(b => b.branch_id === branchId);
    setSelectedBranch(branch || null);
  }}
  disabled={!isAdmin} // 🔒 Lock for non-admins
>
  <option value="">Select Branch</option>
  {branches.map(branch => (
    <option key={branch.branch_id} value={branch.branch_id}>
      {branch.branch_name}
    </option>
  ))}
</select>
{!isAdmin && userBranchId && (
  <p className="form-note">Your branch is automatically selected</p>
)}


</div>

            
            <div className="search-bar">
              <FaSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Search services/products..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="category-filter">
          {categories.map(category => (
  <button
    key={category}
    className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
    onClick={() => setSelectedCategory(category)}
  >
    {category}
    {category !== 'All' && (
      <span className="count"> ({categoryCounts[category] || 0})</span>
    )}
  </button>
))}

</div>


          {error && <div className="error-message">{error}</div>}


          <div className="pos-main">
            <div className="pos-products">
              <div className="product-grid-container">
                <div className="product-grid">
                  {loading.products ? (
                    <div className="loading">Loading products...</div>
                  ) : displayProducts.length > 0 ? (
                    displayProducts.map(product => (
                      product && (
                        <div 
                          key={product.product_id} 
                          className={`product-card ${product.quantity <= 0 ? 'out-of-stock' : ''}`}
                          onClick={() => product.quantity > 0 && addToCart(product)}
                        >
                          <div className="product-name" title={product.product_name}>{product.product_name}</div>
                          <div className="product-price">
  ₱{typeof product.price === 'number' ? product.price.toFixed(2) : '0.00'}
</div>
                          {product.category_name && (
                            <div className="product-category">{product.category_name}</div>
                          )}
{product.type === 'product' && (
  <div className={`product-stock ${product.quantity <= 3 ? 'low-stock' : ''}`}>
    Stock: {product.quantity ?? 0}
  </div>
)}

                        </div>
                      )
                    ))
                  ) : (
                    <div className="no-products">No services/products found</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pos-cart">
              <div className="cart-header">
                <h2>Order Summary</h2>
                <button 
                  className="clear-cart" 
                  onClick={clearCart}
                  disabled={cart.length === 0}
                >
                  <FaTrash /> Clear
                </button>
              </div>

              <div className="customer-section">
                <label>Customer:</label>
                <div style={{ position: 'relative' }}>
  <input
    type="text"
    value={customerSearch}
    onChange={(e) => setCustomerSearch(e.target.value)}
    placeholder="Search customer by name..."
  />
  {filteredCustomers.length > 0 && (
    <ul className="customer-suggestions">
      {filteredCustomers.map(c => (
        <li
          key={c.customer_id}
          onClick={() => {
            setSelectedCustomer(c);
            setCustomerSearch(`${c.first_name} ${c.last_name}`);
            setFilteredCustomers([]);
          }}
        >
          {c.first_name} {c.last_name}
        </li>
      ))}
    </ul>
  )}
  </div>


                <button 
                  className="add-customer"
                  onClick={() => setShowCustomerModal(true)}
                >
                  <FaPlus /> New
                </button>
              </div>

              <div className="cart-items-container">
                {cart.length === 0 ? (
                  <div className="empty-cart">Your cart is empty</div>
                ) : (
                  <table className="cart-items">
                    <thead>
                      <tr>
                        <th>Service/Product</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map(item => (
                        <tr key={item.product_id}>
                          <td>
                          <div className="item-name">{item.product_name}</div>
                          </td>
                          <td>
                            <div className="quantity-control">
                              <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                              >
                                <FaMinus size={12} />
                              </button>
                              <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(item.product_id, parseInt(e.target.value))}
                                min="1"
                              />
                              <button 
                                className="quantity-btn"
                                onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                              >
                                <FaPlus size={12} />
                              </button>
                            </div>
                          </td>
                          <td>₱{typeof item.price === 'number' ? item.price.toFixed(2) : '0.00'}</td>
<td>₱{typeof item.price === 'number' ? (item.price * item.quantity).toFixed(2) : '0.00'}</td>

                          <td>
                            <button 
                              className="remove-item"
                              onClick={() => removeFromCart(item.product_id)}
                            >
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
              <div className="cart-totals">
  <div className="total-row">
    <span>Subtotal:</span>
    <span>₱{subtotal.toFixed(2)}</span>
  </div>

  <div className="total-row additional-discount">
    <span>
      Discount: 
      <input
        type="number"
        value={discount}
        onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
        min="0"
        step="0.01"
      />
    </span>
    <span>₱{discount.toFixed(2)}</span>
  </div>

  <div className="total-row grand-total">
    <span>Total:</span>
    <span>₱{total.toFixed(2)}</span>
  </div>
</div>

              <div className="payment-section">
              <label>Payment Method:</label>
<select
  value={paymentMethod}
  onChange={(e) => setPaymentMethod(e.target.value)}
>
  <option value="cash">Cash</option>
  <option value="gcash">GCash (E-wallet)</option>
</select>

{paymentMethod === 'cash' && (
  <div className="cash-input">
    <label>Amount Tendered:</label>
    <input
      type="number"
      value={amountTendered}
      min={total}
      onChange={(e) => setAmountTendered(parseFloat(e.target.value))}
      placeholder="Enter cash amount"
    />
    {amountTendered >= total && (
      <div>Change: ₱{(amountTendered - total).toFixed(2)}</div>
    )}
  </div>
)}

{paymentMethod === 'gcash' && (
  <div className="gcash-input">
    <label>GCash Reference Number:</label>
    <input
      type="text"
      value={gcashRef}
      onChange={(e) => setGcashRef(e.target.value)}
      placeholder="Enter GCash reference number"
    />
  </div>
)}



                <button 
                  className="process-sale"
                  onClick={processSale}
                  disabled={loading.processing || cart.length === 0}
                >
                  {loading.processing ? 'Processing...' : 'Complete Transaction'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {showCustomerModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add New Customer</h2>
                <button 
                  className="close-btn"
                  onClick={() => setShowCustomerModal(false)}
                >
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    value={newCustomer.first_name}
                    onChange={(e) => setNewCustomer({...newCustomer, first_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    value={newCustomer.last_name}
                    onChange={(e) => setNewCustomer({...newCustomer, last_name: e.target.value})}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input
                    type="text"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({...newCustomer, phone: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({...newCustomer, email: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Address</label>
                  <textarea
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({...newCustomer, address: e.target.value})}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => setShowCustomerModal(false)}
                >
                  Cancel
                </button>
                <button 
                  className="save-btn"
                  onClick={addCustomer}
                >
                  Save Customer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default POS;