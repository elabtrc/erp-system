import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../../styles/products.css";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSync, FaFileExport } from "react-icons/fa";
import { Bell } from "lucide-react";
import { productApi, branchApi } from '../../utils/api';

const Products = () => {
  const [state, setState] = useState({
    products: [],
    categories: [],
    branches: [],
    newProduct: { 
      product_name: "", 
      description: "", 
      category_id: null,
      branch_id: null,
      reorder_level: 10,
      is_active: true
    },
    editingProduct: null,
    isModalOpen: false,
    isLoading: true,
    error: null,
    currentBranch: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProducts, setSelectedProducts] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';
  const userBranchId = user?.branchId || null;
  const isAdmin = userRole === 'Admin';
  
  const { products, categories, branches, newProduct, editingProduct, isModalOpen, isLoading, error, currentBranch } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // For non-admin users, set the current branch to their assigned branch
        if (!isAdmin && userBranchId) {
          setState(prev => ({ ...prev, currentBranch: parseInt(userBranchId) }));
        }

        const [productsRes, categoriesRes, branchesRes] = await Promise.all([
          productApi.getAll().then(res => res.data || res),
          productApi.getCategories().then(res => res.data || res),
          branchApi.getAll().then(res => res.data || res)
        ]);

        setState(prev => ({
          ...prev,
          products: Array.isArray(productsRes) ? productsRes : [],
          categories: Array.isArray(categoriesRes) ? categoriesRes : [],
          branches: Array.isArray(branchesRes) ? branchesRes : [],
          isLoading: false
        }));
      } catch (error) {
        console.error(error);
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load data' }));
      }
    };
    fetchData();
  }, [isAdmin, userBranchId]);

  const handleBranchChange = (branchId) => {
    setState(prev => ({
      ...prev,
      currentBranch: branchId ? parseInt(branchId) : null
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      newProduct: {
        ...prev.newProduct,
        [name]: name === 'category_id' || name === 'branch_id' || name === 'reorder_level'
          ? value ? parseInt(value) : null 
          : value
      }
    }));
  };

  const handleStatusChange = (e) => {
    setState(prev => ({
      ...prev,
      newProduct: {
        ...prev.newProduct,
        is_active: e.target.value === 'true'
      }
    }));
  };

  const filteredProducts = products.filter(product => {
    const category = categories.find(c => c.category_id === product.category_id);
    const matchesBranch = isAdmin 
      ? (!currentBranch || product.branch_id === currentBranch) 
      : product.branch_id === userBranchId;
    const matchesSearch = searchTerm === '' ||
      product.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (category && category.category_name.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesBranch && matchesSearch;
  });

  const handleBulkStatus = async (isActive) => {
    try {
      await Promise.all(
        selectedProducts.map(id => 
          productApi.update(id, { is_active: isActive })
        )
      );
      refreshData();
      setSelectedProducts([]);
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to update some products' }));
    }
  };

  const exportToCSV = () => {
    const headers = ["Name", "Branch", "Category", "Status"];
    if (isAdmin) headers.splice(3, 0, "Reorder Level");

    const csvContent = [
      headers.join(","),
      ...filteredProducts.map(p => {
        const category = categories.find(c => c.category_id === p.category_id);
        const branch = branches.find(b => b.branch_id === p.branch_id);
        const row = [
          `"${p.product_name}"`,
          `"${branch?.branch_name || '-'}"`,
          `"${category?.category_name || '-'}"`
        ];
        if (isAdmin) row.push(p.reorder_level || 10);
        row.push(p.is_active ? 'Active' : 'Inactive');
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'products.csv';
    link.click();
  };

  const handleAddOrUpdateProduct = async () => {
    setState(prev => ({ ...prev, error: null }));
  
    // Validate required fields
    if (!newProduct.product_name?.trim()) {
      setState(prev => ({ ...prev, error: 'Product name is required' }));
      return;
    }
  
    if (!newProduct.branch_id) {
      setState(prev => ({ ...prev, error: 'Please select a branch' }));
      return;
    }
  
    try {
      setState(prev => ({ ...prev, isLoading: true }));
  
      const productData = {
        product_name: newProduct.product_name.trim(),
        description: newProduct.description?.trim() || null,
        category_id: newProduct.category_id || null,
        branch_id: newProduct.branch_id,
        reorder_level: parseInt(newProduct.reorder_level) || 10,
        is_active: newProduct.is_active !== false
      };
  
      console.log('Sending product data:', productData);
  
      if (editingProduct) {
        await productApi.update(editingProduct.product_id, productData);
      } else {
        await productApi.create(productData);
      }
  
      await refreshData();
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Product save error:', {
        message: error.message,
        response: error.response?.data,
        stack: error.stack
      });
  
      // Safely handle the error message
      let errorMessage = 'Failed to save product';
      if (typeof error.message === 'string') {
        if (error.message.includes('Invalid branch ID') || 
            error.message.includes('Invalid category ID')) {
          errorMessage = error.message;
        }
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
  
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage
      }));
    }
  };
  
  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    
    try {
      await productApi.delete(id);
      setState(prev => ({
        ...prev,
        products: prev.products.filter(p => p.product_id !== id),
        error: null
      }));
    } catch (error) {
      console.error('Delete error:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to delete product. It may be in use.'
      }));
    }
  };

  const handleEditProduct = (product) => {
    setState(prev => ({
      ...prev,
      editingProduct: product,
      newProduct: { 
        product_name: product.product_name,
        description: product.description || "",
        category_id: product.category_id || null,
        branch_id: product.branch_id || null,
        reorder_level: product.reorder_level || 10,
        is_active: product.is_active !== false
      },
      isModalOpen: true,
      error: null
    }));
  };

  const resetForm = () => {
    setState(prev => ({
      ...prev,
      newProduct: { 
        product_name: "", 
        description: "", 
        category_id: null,
        branch_id: isAdmin ? null : userBranchId,
        reorder_level: 10,
        is_active: true
      },
      editingProduct: null,
      error: null
    }));
  };

  const refreshData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const [productsRes, categoriesRes, branchesRes] = await Promise.all([
        productApi.getAll().then(res => res.data || res),
        productApi.getCategories().then(res => res.data || res),
        branchApi.getAll().then(res => res.data || res)
      ]);
      setState(prev => ({
        ...prev,
        products: Array.isArray(productsRes) ? productsRes : [],
        categories: Array.isArray(categoriesRes) ? categoriesRes : [],
        branches: Array.isArray(branchesRes) ? branchesRes : [],
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, error: 'Failed to refresh data', isLoading: false }));
    }
  };

  if (isLoading) {
    return (
      <div className="users-container">
        <Sidebar />
        <div className="users-content loading">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Inventory Management</h1>
          <div className="icon-1">
            <Bell className="icon" />
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Products</h2>
            <div className="branch-controls">
              {isAdmin && (
                <div className="branch-selector">
                  <label>Branch: </label>
                  <select 
                    value={currentBranch || ''} 
                    onChange={(e) => handleBranchChange(e.target.value)}
                  >
                    <option value="">All Branches</option>
                    {branches.map(branch => (
                      <option key={branch.branch_id} value={branch.branch_id}>
                        {branch.branch_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <button className="refresh-btn" onClick={refreshData}>
                  <FaSync /> Refresh
                </button>
                <button className="export-btn" onClick={exportToCSV}>
                  <FaFileExport /> Export
                </button>
                {isAdmin && (
                  <button 
                    className="add-user-btn" 
                    onClick={() => {
                      resetForm();
                      setState(prev => ({ ...prev, isModalOpen: true }));
                    }}
                  >
                    <FaPlus /> Add Product
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdmin && selectedProducts.length > 0 && (
            <div className="bulk-actions">
              <button onClick={() => handleBulkStatus(true)}>Activate Selected</button>
              <button onClick={() => handleBulkStatus(false)}>Deactivate Selected</button>
              <span>{selectedProducts.length} selected</span>
            </div>
          )}

          {error && (
            <div className="error-message">
              <p><strong>Error:</strong> {error}</p>
              <div className="error-actions">
                <button onClick={() => setState(prev => ({ ...prev, error: null }))}>
                  Dismiss
                </button>
                <button onClick={refreshData}>Retry</button>
              </div>
            </div>
          )}

          <div className="user-list-container">
            <table>
              <thead>
                <tr>
                  {isAdmin && (
                    <th>
                      <input 
                        type="checkbox" 
                        onChange={(e) => {
                          setSelectedProducts(e.target.checked ? filteredProducts.map(p => p.product_id) : []);
                        }} 
                      />
                    </th>
                  )}
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Category</th>
                  {isAdmin && <th>Reorder Level</th>}
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => {
                    const branch = branches.find(b => b.branch_id === product.branch_id);
                    const category = categories.find(c => c.category_id === product.category_id);
                    
                    return (
                      <tr key={product.product_id}>
                        {isAdmin && (
                          <td>
                            <input 
                              type="checkbox"
                              checked={selectedProducts.includes(product.product_id)}
                              onChange={() => {
                                setSelectedProducts(prev => 
                                  prev.includes(product.product_id)
                                    ? prev.filter(id => id !== product.product_id)
                                    : [...prev, product.product_id]
                                );
                              }}
                            />
                          </td>
                        )}
                        <td>{product.product_name}</td>
                        <td>{branch?.branch_name || '-'}</td>
                        <td>{category?.category_name || '-'}</td>
                        {isAdmin && <td>{product.reorder_level || 10}</td>}
                        <td>
                          <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                            {product.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        {isAdmin && (
                          <td>
                            <div className="action-buttons">
                              <button 
                                className="edit-btn" 
                                onClick={() => handleEditProduct(product)}
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => handleDeleteProduct(product.product_id)}
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 7 : 5} className="no-data">
                      {products.length === 0 ? 'No products available' : 'No products match your filters'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingProduct ? "Edit Product" : "Add New Product"}</h2>
                <button 
                  className="close-btn" 
                  onClick={() => {
                    setState(prev => ({ ...prev, isModalOpen: false }));
                    resetForm();
                  }}
                >
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                {error && <div className="modal-error">{error}</div>}
                
                <div className="form-group">
                  <label>Product Name *</label>
                  <input
                    type="text"
                    name="product_name"
                    placeholder="e.g., Professional Shampoo"
                    value={newProduct.product_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Product description (optional)"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Branch *</label>
                    <select
                      name="branch_id"
                      value={newProduct.branch_id || ''}
                      onChange={handleInputChange}
                      required
                      disabled={!isAdmin && !!userBranchId}
                    >
                      <option value="">Select Branch</option>
                      {branches.map(branch => (
                        <option key={`branch-${branch.branch_id}`} value={branch.branch_id}>
                          {branch.branch_name}
                        </option>
                      ))}
                    </select>
                    {!isAdmin && userBranchId && (
                      <p className="form-note">Your branch is automatically selected</p>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      name="category_id"
                      value={newProduct.category_id || ''}
                      onChange={handleInputChange}
                    >
                      <option value="">Select Category</option>
                      {categories.map(category => (
                        <option key={`category-${category.category_id}`} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {isAdmin && (
                  <div className="form-row">
                    <div className="form-group">
                      <label>Reorder Level</label>
                      <input
                        type="number"
                        name="reorder_level"
                        min="0"
                        value={newProduct.reorder_level}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                )}

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newProduct.is_active ? 'true' : 'false'}
                      onChange={handleStatusChange}
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="modal-footer">
                  <button
                    className="cancel-btn"
                    onClick={() => {
                      setState(prev => ({ ...prev, isModalOpen: false }));
                      resetForm();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="submit-btn"
                    onClick={handleAddOrUpdateProduct}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : editingProduct ? (
                      <>
                        <FaEdit /> Update Product
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Product
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;