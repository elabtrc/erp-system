import React, { useState, useEffect } from "react";
import Sidebar from "../Sidebar";
import '../settings/users.css';
import { FaPlus, FaEdit, FaTimes, FaHistory, FaSync } from "react-icons/fa";
// import { Bell } from "lucide-react";
import { customerApi } from '../../utils/api';
import axios from "axios";
import { useAuth } from '../../context/AuthContext';

const CustomerInfo = () => {
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]); // Changed from null to empty array
  const [newCustomer, setNewCustomer] = useState({ 
    first_name: "", 
    last_name: "", 
    email: "", 
    phone: "",
    address: "",
    customer_type: "Regular",
    loyalty_points: 0,
    assigned_staff_id: null,
    branch_id: null
  });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [branches, setBranches] = useState([]);
  
  // Determine user role and branch access
  const userRole = user?.role || '';
  const userBranchId = user?.branchId ? parseInt(user.branchId) : null;
  const isAdmin = userRole.toLowerCase() === 'admin'; // Made case insensitive
  const [currentBranch, setCurrentBranch] = useState(isAdmin ? null : userBranchId);

  // Fetch branches and set initial branch selection
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get('/api/branches');
        setBranches(res.data);
        
        // For non-admin users, set their branch automatically
        if (!isAdmin && userBranchId) {
          setCurrentBranch(userBranchId);
          setNewCustomer(prev => ({ 
            ...prev, 
            branch_id: userBranchId 
          }));
        }
      } catch (err) {
        console.error('Failed to fetch branches:', err);
        setError('Failed to load branches');
      }
    };
    
    fetchBranches();
  }, [isAdmin, userBranchId]);

// Fetch customers based on branch selection
useEffect(() => {
 // In your fetchCustomers function:
 const fetchCustomers = async () => {
  try {
    setIsLoading(true);
    setError(null);
    
    let params = {};
    if (!isAdmin && userBranchId) {
      params.branchId = userBranchId;
    } else if (isAdmin && currentBranch) {
      params.branchId = currentBranch;
    }
    
    console.log('Fetching customers with params:', params);
    
    const res = await axios.get('/api/customers/combined', { 
      params,
      timeout: 10000
    });
    
    console.log('API response:', res.data);
    
    if (!res.data || !Array.isArray(res.data)) {
      throw new Error('Invalid response format from server');
    }

    const customersData = res.data.map(customer => ({
      customer_id: customer.customer_id,
      first_name: customer.first_name || '',
      last_name: customer.last_name || '',
      email: customer.email || '',
      phone: customer.phone || 'N/A',
      address: customer.address || '',
      branch_id: customer.branch_id || null
    }));
    
    setCustomers(customersData);
    
  } catch (err) {
    console.error('Full error details:', err);
    
    let errorMessage = 'Failed to load customers';
    
    if (err.response) {
      // Server responded with error status
      console.error('Server error response:', err.response.data);
      errorMessage = err.response.data?.error || errorMessage;
      
      if (err.response.data?.details) {
        console.error('Server error details:', err.response.data.details);
      }
    } else if (err.request) {
      // Request was made but no response
      errorMessage = 'Server is not responding';
    } else {
      // Other errors
      errorMessage = err.message || errorMessage;
    }
    
    setError(errorMessage);
    setCustomers([]);
    
  } finally {
    setIsLoading(false);
  }
};

  fetchCustomers();
}, [currentBranch, isAdmin, userBranchId]);

const handleBranchChange = (branchId) => {
  const newBranchId = branchId ? parseInt(branchId) : null;
  setCurrentBranch(newBranchId);
  
  // Update the new customer form if we're adding a new customer
  if (isModalOpen && isAdmin) {
    setNewCustomer(prev => ({
      ...prev,
      branch_id: newBranchId
    }));
  }
};

const filteredCustomers = React.useMemo(() => {
  return customers.filter(customer => {
    // For non-admin users, only show customers from their branch
    if (!isAdmin) {
      return customer.branch_id === userBranchId;
    }
    // For admin users, show all customers or filter by selected branch
    return !currentBranch || customer.branch_id === currentBranch;
  });
}, [customers, isAdmin, userBranchId, currentBranch]);

  const fetchCustomerHistory = async (customerId) => {
    try {
      const [appointmentsRes, salesRes] = await Promise.all([
        customerApi.getAppointments(customerId),
        customerApi.getSales(customerId)
      ]);
      
      const history = [
        ...appointmentsRes.data.map(a => ({
          type: 'appointment',
          date: a.appointment_date,
          activity: `Appointment - ${a.service_name}`,
          amount: a.price,
          status: a.status
        })),
        ...salesRes.data.map(s => ({
          type: 'sale',
          date: s.sale_date,
          activity: `Purchase - ${s.items.map(i => i.product_name).join(', ')}`,
          amount: s.total_amount,
          status: 'Completed'
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date));
          
      setCustomerHistory(history);
    } catch (error) {
      setError('Failed to load history');
    }
  };

  const handleAddOrUpdateCustomer = async () => {
    if (!newCustomer.first_name.trim() || !newCustomer.last_name.trim()) {
      setError('First and last name are required');
      return;
    }

    // For non-admin users, ensure the customer is assigned to their branch
    const customerData = {
      ...newCustomer,
      branch_id: !isAdmin ? userBranchId : newCustomer.branch_id
    };

    try {
      if (editingCustomer) {
        await customerApi.update(editingCustomer.customer_id, customerData);
        setCustomers(customers.map(c => 
          c.customer_id === editingCustomer.customer_id ? 
          { ...c, ...customerData } : c
        ));
      } else {
        const response = await customerApi.create(customerData);
        setCustomers([...customers, response.data]);
      }
      resetForm();
      setIsModalOpen(false);
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save customer');
    }
  };

  const handleArchiveCustomer = async (id) => {
    if (window.confirm('Are you sure you want to archive this customer?')) {
      try {
        await customerApi.archive(id);
        setCustomers(customers.filter(c => c.customer_id !== id));
      } catch (error) {
        setError('Failed to archive customer');
      }
    }
  };

  const handleEditCustomer = (customer) => {
    setEditingCustomer(customer);
    setNewCustomer({ 
      first_name: customer.first_name,
      last_name: customer.last_name,
      email: customer.email || "",
      phone: customer.phone || "",
      address: customer.address || "",
      customer_type: customer.customer_type || "Regular",
      loyalty_points: customer.loyalty_points || 0,
      assigned_staff_id: customer.assigned_staff_id || null
    });
    setIsModalOpen(true);
  };

  const handleViewHistory = async (customer) => {
    setSelectedCustomer(customer);
    await fetchCustomerHistory(customer.customer_id);
    setIsHistoryModalOpen(true);
  };

  const resetForm = () => {
    setNewCustomer({ 
      first_name: "", 
      last_name: "", 
      email: "", 
      phone: "",
      address: "",
      customer_type: "Regular",
      loyalty_points: 0,
      assigned_staff_id: null
    });
    setEditingCustomer(null);
    setError(null);
  };

  const refreshData = async () => {
    setIsLoading(true);
    try {
      let params = {};
      
      // Only apply branch filter for non-admin users
      if (!isAdmin && userBranchId) {
        params.branchId = userBranchId;
      }
      
      const [customersRes, staffRes] = await Promise.all([
        axios.get('/api/customers/combined', { params }),
        customerApi.getStaffMembers()
      ]);
      setCustomers(customersRes.data);
      setStaffMembers(staffRes.data);
    } catch (error) {
      setError('Failed to refresh data');
    } finally {
      setIsLoading(false);
    }
  };
  // Render branch selector or display for non-admins
  const renderBranchSelector = () => {
    if (!isAdmin) {
      const userBranch = branches.find(b => b.branch_id === userBranchId);
      return (
        <div className="branch-selector">
          <label>Branch: </label>
          <input
            type="text"
            value={userBranch?.branch_name || (userBranchId ? `Branch ID: ${userBranchId}` : 'No branch assigned')}
            readOnly
          />
        </div>
      );
    }
    
    return (
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
    );
  };

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Customer Information Management</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
        <div className="header-container">
  <h2>Customers</h2>
  <div className="branch-controls">
    {renderBranchSelector()}
    <button className="refresh-btn" onClick={refreshData}>
      <FaSync /> Refresh
    </button>
    {isAdmin && (
      <button 
        className="add-user-btn" 
        onClick={() => {
          setNewCustomer(prev => ({
            ...prev,
            branch_id: currentBranch || null
          }));
          setIsModalOpen(true);
        }}
      >
        <FaPlus /> Add New Customer
      </button>
    )}
  </div>
</div>

          {error && (
            <div className="error-message">
              <div>{error}</div>
              <button onClick={() => setError(null)}>Dismiss</button>
              <button onClick={refreshData}>Retry</button>
            </div>
          )}

<div className="user-list-container">
  <table>
    <thead>
      <tr>
        <th>Name</th>
        {isAdmin && <th>Branch</th>}
        <th>Phone</th>
        <th>Email</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {customers === null ? (
        <tr>
          <td colSpan={isAdmin ? 5 : 4} className="no-data">
            Loading customers...
          </td>
        </tr>
      ) : filteredCustomers.length > 0 ? (
        filteredCustomers.map((customer) => {
          const branch = branches.find(b => b.branch_id === customer.branch_id);
          return (
            <tr key={customer.customer_id}>
              <td>{customer.first_name} {customer.last_name}</td>
              {isAdmin && <td>{branch?.branch_name || '-'}</td>}
              <td>{customer.phone || 'N/A'}</td>
              <td>{customer.email || 'N/A'}</td>
              <td>
                <button className="edit-btn" onClick={() => handleEditCustomer(customer)}>
                  <FaEdit />
                </button>
                <button className="archive-btn" onClick={() => handleArchiveCustomer(customer.customer_id)}>
                  <FaHistory /> Archive
                </button>
                <button className="history-btn" onClick={() => handleViewHistory(customer)}>
                  <FaHistory /> History
                </button>
              </td>
            </tr>
          );
        })
      ) : (
        <tr>
          <td colSpan={isAdmin ? 5 : 4} className="no-data">
            {customers.length === 0 ? 'No customers available' : 'No customers match current filters'}
          </td>
        </tr>
      )}
    </tbody>
  </table>
</div>
</div>

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{editingCustomer ? "Edit Customer" : "Add Customer"}</h2>
                <button className="close-btn" onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      placeholder="Enter First Name"
                      value={newCustomer.first_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      placeholder="Enter Last Name"
                      value={newCustomer.last_name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      placeholder="Enter Phone Number"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input
                      type="email"
                      placeholder="Enter Email"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Address</label>
                  <input
                    type="text"
                    placeholder="Enter Address"
                    value={newCustomer.address}
                    onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  />
                </div>

                {isAdmin && (
  <div className="form-group">
    <label>Branch *</label>
    <select
      value={newCustomer.branch_id || ''}
      onChange={(e) => setNewCustomer({ 
        ...newCustomer, 
        branch_id: e.target.value ? parseInt(e.target.value) : null 
      })}
      required
    >
      <option value="">Select Branch</option>
      {branches.map(branch => (
        <option key={branch.branch_id} value={branch.branch_id}>
          {branch.branch_name}
        </option>
      ))}
    </select>
  </div>
)}

                <div className="form-row">
                  <div className="form-group">
                    <label>Customer Type</label>
                    <select
                      value={newCustomer.customer_type}
                      onChange={(e) => setNewCustomer({ ...newCustomer, customer_type: e.target.value })}
                    >
                      <option value="Regular">Regular</option>
                      <option value="VIP">VIP</option>
                      <option value="Corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Loyalty Points</label>
                    <input
                      type="number"
                      min="0"
                      value={newCustomer.loyalty_points}
                      onChange={(e) => setNewCustomer({ ...newCustomer, loyalty_points: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Assigned Staff</label>
                  <select
                    value={newCustomer.assigned_staff_id || ''}
                    onChange={(e) => setNewCustomer({ 
                      ...newCustomer, 
                      assigned_staff_id: e.target.value ? parseInt(e.target.value) : null 
                    })}
                  >
                    <option value="">None</option>
                    {staffMembers.map(staff => (
                      <option key={staff.employee_id} value={staff.employee_id}>
                        {staff.first_name} {staff.last_name}
                      </option>
                    ))}
                  </select>
                </div>

                <button onClick={handleAddOrUpdateCustomer}>
                  {editingCustomer ? <FaEdit /> : <FaPlus />} {editingCustomer ? "Update" : "Add"} Customer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* History Modal */}
        {isHistoryModalOpen && selectedCustomer && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>{selectedCustomer.first_name} {selectedCustomer.last_name}'s History</h2>
                <button className="close-btn" onClick={() => setIsHistoryModalOpen(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <div className="customer-summary">
                  <p><strong>Email:</strong> {selectedCustomer.email || 'N/A'}</p>
                  <p><strong>Phone:</strong> {selectedCustomer.phone || 'N/A'}</p>
                  <p><strong>Loyalty Points:</strong> {selectedCustomer.loyalty_points}</p>
                  <p><strong>Last Visit:</strong> {selectedCustomer.last_visit_date || 'Never'}</p>
                </div>

                {customerHistory.length > 0 ? (
                  <table className="history-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Activity</th>
                        <th>Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {customerHistory.map((entry, index) => (
                        <tr key={`${entry.date}-${index}`}>
                          <td>{new Date(entry.date).toLocaleDateString()}</td>
                          <td>{entry.activity}</td>
                          <td>{entry.amount ? `₱${Number(entry.amount).toFixed(2)}` : '-'}</td>
                          <td>
                            <span className={`status-badge ${entry.status.toLowerCase()}`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No history available for this customer.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerInfo;