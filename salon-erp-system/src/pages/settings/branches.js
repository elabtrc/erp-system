import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import "../settings/users.css";
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSync, FaFileExport } from "react-icons/fa";
// import { Bell } from "lucide-react";
import { branchApi } from '../../utils/api';

const BranchManagement = () => {
  const [state, setState] = useState({
    branches: [],
    newBranch: { 
      branch_name: "", 
      location: "", 
      contact_number: "",
      is_active: true
    },
    editingBranch: null,
    isModalOpen: false,
    isLoading: true,
    error: null
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBranches, setSelectedBranches] = useState([]);

  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';
  const isAdmin = userRole === 'Admin';

  const { branches, newBranch, editingBranch, isModalOpen, isLoading, error } = state;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        const branchesRes = await branchApi.getAll().then(res => res.data || res);

        setState(prev => ({
          ...prev,
          branches: Array.isArray(branchesRes) ? branchesRes : [],
          isLoading: false
        }));
      } catch (error) {
        console.error(error);
        setState(prev => ({ ...prev, isLoading: false, error: 'Failed to load branches' }));
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      newBranch: {
        ...prev.newBranch,
        [name]: value
      }
    }));
  };

  const handleStatusChange = (e) => {
    setState(prev => ({
      ...prev,
      newBranch: {
        ...prev.newBranch,
        is_active: e.target.value === 'true'
      }
    }));
  };

  const filteredBranches = branches.filter(branch => {
    const matchesSearch = searchTerm === '' ||
      branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (branch.contact_number && branch.contact_number.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const handleBulkStatus = async (isActive) => {
    try {
      await Promise.all(
        selectedBranches.map(id => 
          branchApi.update(id, { is_active: isActive })
        )
      );
      refreshData();
      setSelectedBranches([]);
    } catch (error) {
      setState(prev => ({ ...prev, error: 'Failed to update some branches' }));
    }
  };

  const exportToCSV = () => {
    const headers = ["Branch Name", "Location", "Contact Number", "Status"];
    
    const csvContent = [
      headers.join(","),
      ...filteredBranches.map(b => [
        `"${b.branch_name}"`,
        `"${b.location}"`,
        `"${b.contact_number || '-'}"`,
        b.is_active ? 'Active' : 'Inactive'
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'branches.csv';
    link.click();
  };

  const handleAddOrUpdateBranch = async () => {
    setState(prev => ({ ...prev, error: null }));
  
    // Validate required fields
    if (!newBranch.branch_name?.trim()) {
      setState(prev => ({ ...prev, error: 'Branch name is required' }));
      return;
    }
  
    if (!newBranch.location?.trim()) {
      setState(prev => ({ ...prev, error: 'Location is required' }));
      return;
    }
  
    try {
      setState(prev => ({ ...prev, isLoading: true }));
  
      const branchData = {
        branch_name: newBranch.branch_name.trim(),
        location: newBranch.location.trim(),
        contact_number: newBranch.contact_number?.trim() || null,
        is_active: newBranch.is_active !== false
      };
  
      if (editingBranch) {
        await branchApi.update(editingBranch.branch_id, branchData);
      } else {
        await branchApi.create(branchData);
      }
  
      await refreshData();
      setState(prev => ({
        ...prev,
        isModalOpen: false,
        isLoading: false,
        error: null
      }));
    } catch (error) {
      console.error('Branch save error:', error);
      
      let errorMessage = 'Failed to save branch';
      if (typeof error.message === 'string') {
        errorMessage = error.message;
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
  
  const handleDeleteBranch = async (id) => {
    if (!window.confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      await branchApi.delete(id);
      setState(prev => ({
        ...prev,
        branches: prev.branches.filter(b => b.branch_id !== id),
        error: null
      }));
    } catch (error) {
      console.error('Delete error:', error);
      setState(prev => ({
        ...prev,
        error: error.response?.data?.error || 'Failed to delete branch. It may be referenced by other records.'
      }));
    }
  };

  const handleEditBranch = (branch) => {
    setState(prev => ({
      ...prev,
      editingBranch: branch,
      newBranch: { 
        branch_name: branch.branch_name,
        location: branch.location,
        contact_number: branch.contact_number || "",
        is_active: branch.is_active !== false
      },
      isModalOpen: true,
      error: null
    }));
  };

  const resetForm = () => {
    setState(prev => ({
      ...prev,
      newBranch: { 
        branch_name: "", 
        location: "", 
        contact_number: "",
        is_active: true
      },
      editingBranch: null,
      error: null
    }));
  };

  const refreshData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const branchesRes = await branchApi.getAll().then(res => res.data || res);
      setState(prev => ({
        ...prev,
        branches: Array.isArray(branchesRes) ? branchesRes : [],
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, error: 'Failed to refresh data', isLoading: false }));
    }
  };

  if (isLoading && !branches.length) {
    return (
      <div className="users-container">
        <Sidebar />
        <div className="users-content loading">
          <div className="spinner"></div>
          <p>Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Branch Management</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Branches</h2>
            <div className="branch-controls">
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
                    <FaPlus /> Add Branch
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="search-bar">
            <input
              type="text"
              placeholder="Search branches..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {isAdmin && selectedBranches.length > 0 && (
            <div className="bulk-actions">
              <button onClick={() => handleBulkStatus(true)}>Activate Selected</button>
              <button onClick={() => handleBulkStatus(false)}>Deactivate Selected</button>
              <span>{selectedBranches.length} selected</span>
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
                          setSelectedBranches(e.target.checked ? filteredBranches.map(b => b.branch_id) : []);
                        }} 
                      />
                    </th>
                  )}
                  <th>Branch Name</th>
                  <th>Location</th>
                  <th>Contact Number</th>
                  <th>Status</th>
                  {isAdmin && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredBranches.length > 0 ? (
                  filteredBranches.map((branch) => (
                    <tr key={branch.branch_id}>
                      {isAdmin && (
                        <td>
                          <input 
                            type="checkbox"
                            checked={selectedBranches.includes(branch.branch_id)}
                            onChange={() => {
                              setSelectedBranches(prev => 
                                prev.includes(branch.branch_id)
                                  ? prev.filter(id => id !== branch.branch_id)
                                  : [...prev, branch.branch_id]
                              );
                            }}
                          />
                        </td>
                      )}
                      <td>{branch.branch_name}</td>
                      <td>{branch.location}</td>
                      <td>{branch.contact_number || '-'}</td>
                      <td>
                        <span className={`status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      {isAdmin && (
                        <td>
                          <div className="action-buttons">
                            <button 
                              className="edit-btn" 
                              onClick={() => handleEditBranch(branch)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteBranch(branch.branch_id)}
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="no-data">
                      {branches.length === 0 ? 'No branches available' : 'No branches match your search'}
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
                <h2>{editingBranch ? "Edit Branch" : "Add New Branch"}</h2>
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
                  <label>Branch Name *</label>
                  <input
                    type="text"
                    name="branch_name"
                    placeholder="e.g., Main Branch"
                    value={newBranch.branch_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Location *</label>
                  <input
                    type="text"
                    name="location"
                    placeholder="Full address"
                    value={newBranch.location}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    name="contact_number"
                    placeholder="Phone number"
                    value={newBranch.contact_number}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Status</label>
                    <select
                      value={newBranch.is_active ? 'true' : 'false'}
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
                    onClick={handleAddOrUpdateBranch}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Processing...'
                    ) : editingBranch ? (
                      <>
                        <FaEdit /> Update Branch
                      </>
                    ) : (
                      <>
                        <FaPlus /> Add Branch
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

export default BranchManagement;