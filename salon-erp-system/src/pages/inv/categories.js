import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../../styles/products.css";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSync, FaFileExport } from "react-icons/fa";
import { Bell } from "lucide-react";
import { categoryApi } from '../../utils/api';
import { useAuth } from '../../context/AuthContext';


const Categories = () => {
  const { user } = useAuth();
  const [state, setState] = useState({
    categories: [],
    parentCategories: [],
    newCategory: { 
      category_name: "", 
      description: "", 
      parent_category_id: null 
    },
    editingCategory: null,
    isModalOpen: false,
    isLoading: true,
    error: null
  });

  const [searchTerm, setSearchTerm] = useState('');

  const { categories, parentCategories, newCategory, editingCategory, isModalOpen, isLoading, error } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const [categoriesRes] = await Promise.all([
          categoryApi.getAll()
        ]);

        setState(prev => ({
          ...prev,
          categories: categoriesRes.data || [],
          parentCategories: categoriesRes.data?.filter(c => !c.parent_category_id) || [],
          isLoading: false
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.response?.data?.error || 'Failed to load data. Please try again.'
        }));
      }
    };
    
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      newCategory: {
        ...prev.newCategory,
        [name]: name === 'parent_category_id' ? (value ? parseInt(value) : null) : value
      }
    }));
  };

  const filteredCategories = categories.filter(category =>
    searchTerm === '' ||
    category.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.description && category.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const exportToCSV = () => {
    const headers = ["Name", "Description", "Parent Category"];
    const csvContent = [
      headers.join(","),
      ...filteredCategories.map(c => {
        const parent = categories.find(p => p.category_id === c.parent_category_id);
        return [
          `"${c.category_name}"`,
          `"${c.description || ''}"`,
          `"${parent?.category_name || ''}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'categories.csv';
    link.click();
  };
  const handleAddOrUpdateCategory = async () => {
    // Clear previous errors
    setState(prev => ({ ...prev, error: null, errorField: null }));
  
    // Validate required fields
    if (!newCategory.category_name.trim()) {
      setState(prev => ({ 
        ...prev, 
        error: 'Category name is required',
        errorField: 'category_name'
      }));
      return;
    }
  
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      
      const categoryData = {
        category_name: newCategory.category_name.trim(),
        description: newCategory.description?.trim() || null,
        parent_category_id: newCategory.parent_category_id || null
      };
  
      let response;
      if (editingCategory) {
        response = await categoryApi.update(editingCategory.category_id, categoryData);
      } else {
        response = await categoryApi.create(categoryData);
      }
  
      if (!response.success) {
        throw new Error(response.error || 'Failed to save category');
      }
  
      // Refresh the list and close modal
      await refreshData();
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        isLoading: false
      }));
    } catch (error) {
      console.error('Category save error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to save category',
        errorField: error.field || null
      }));
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoryApi.delete(id);
      setState(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.category_id !== id),
        error: null
      }));
    } catch (error) {
      console.error('Delete error:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to delete category. It may have products or subcategories.'
      }));
    }
  };

  const handleEditCategory = (category) => {
    setState(prev => ({
      ...prev,
      editingCategory: category,
      newCategory: { 
        category_name: category.category_name,
        description: category.description || "",
        parent_category_id: category.parent_category_id || null
      },
      isModalOpen: true,
      error: null
    }));
  };

  const resetForm = () => {
    setState(prev => ({
      ...prev,
      newCategory: { 
        category_name: "", 
        description: "", 
        parent_category_id: null 
      },
      editingCategory: null,
      error: null
    }));
  };

  const refreshData = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await categoryApi.getAll();
      setState(prev => ({
        ...prev,
        categories: response.data || [],
        parentCategories: response.data?.filter(c => !c.parent_category_id) || [],
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Refresh error:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to refresh data. Please check your connection.',
        isLoading: false
      }));
    }
  };

  if (isLoading) {
    return (
      <div className="users-container">
        <Sidebar />
        <div className="users-content loading">
          <div className="spinner"></div>
          <p>Loading categories...</p>
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
            <h2>Categories</h2>
            <div>
              <button className="refresh-btn" onClick={refreshData}>
                <FaSync /> Refresh
              </button>
              <button className="export-btn" onClick={exportToCSV}>
                <FaFileExport /> Export
              </button>
              {user.role === 'Admin' && (<button 
                className="add-user-btn" 
                onClick={() => {
                  resetForm();
                  setState(prev => ({ ...prev, isModalOpen: true }));
                }}
              >
                <FaPlus /> Add Category
              </button> )}
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

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
                  <th>Category Name</th>
                  <th>Description</th>
                  <th>Parent Category</th>
                  {user.role === 'Admin' && <th>Actions</th>}
                  </tr>
              </thead>
              <tbody>
  {filteredCategories.length > 0 ? (
    filteredCategories.map((category) => {
      const parent = categories.find(c => c.category_id === category.parent_category_id);
      return (
        <tr key={category.category_id}>
          <td>{category.category_name}</td>
          <td>{category.description || '-'}</td>
          <td>{parent?.category_name || '-'}</td>
          {user.role === 'Admin' && (
            <td>
              <div className="action-buttons">
                <button className="edit-btn" onClick={() => handleEditCategory(category)}><FaEdit /></button>
                <button className="delete-btn" onClick={() => handleDeleteCategory(category.category_id)}><FaTrash /></button>
              </div>
            </td>
          )}
        </tr>
      );
    })
  ) : (
    <tr>
      <td colSpan={user.role === 'Admin' ? 4 : 3} className="no-data">
        {categories.length === 0 ? 'No categories available' : 'No categories match your search'}
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
                <h2>{editingCategory ? "Edit Category" : "Add New Category"}</h2>
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
                  <label>Category Name *</label>
                  <input
                    type="text"
                    name="category_name"
                    placeholder="e.g., Hair Care"
                    value={newCategory.category_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    placeholder="Category description (optional)"
                    value={newCategory.description}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label>Parent Category</label>
                  <select
                    name="parent_category_id"
                    value={newCategory.parent_category_id || ''}
                    onChange={handleInputChange}
                  >
                    <option value="">No Parent Category</option>
                    {parentCategories
                      .filter(c => !editingCategory || c.category_id !== editingCategory.category_id)
                      .map(category => (
                        <option key={category.category_id} value={category.category_id}>
                          {category.category_name}
                        </option>
                      ))
                    }
                  </select>
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
                    onClick={handleAddOrUpdateCategory}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : editingCategory ? (
                      <>
                        <FaEdit /> Update Category
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Category
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

export default Categories;