import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar';
import { FaSearch, FaPrint, FaFileExcel, FaEye, FaSync } from 'react-icons/fa';
// import { Bell } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { transactionApi, branchApi } from '../../utils/api';
import './transactions.css';

const TransactionHistory = () => {
  const navigate = useNavigate();
  const [state, setState] = useState({
    transactions: [],
    branches: [],
    isLoading: true,
    error: null,
    currentBranch: null,
    selectedTransaction: null,
    showDetailsModal: false
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPayment, setSelectedPayment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const { transactions, branches, isLoading, error, currentBranch, selectedTransaction, showDetailsModal } = state;

  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user?.role || '';
  const userBranchId = user?.branchId || null;
  const isAdmin = userRole === 'Admin';

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        if (!isAdmin && userBranchId) {
          setState(prev => ({ ...prev, currentBranch: parseInt(userBranchId) }));
        }

        const [transactionsRes, branchesRes] = await Promise.all([
          transactionApi.getAll().then(res => res.data || res),
          branchApi.getAll().then(res => res.data || res)
        ]);

        setState(prev => ({
          ...prev,
          transactions: Array.isArray(transactionsRes) ? transactionsRes : [],
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

  const refreshData = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const [transactionsRes, branchesRes] = await Promise.all([
        transactionApi.getAll().then(res => res.data || res),
        branchApi.getAll().then(res => res.data || res)
      ]);
      setState(prev => ({
        ...prev,
        transactions: Array.isArray(transactionsRes) ? transactionsRes : [],
        branches: Array.isArray(branchesRes) ? branchesRes : [],
        isLoading: false
      }));
    } catch (error) {
      console.error(error);
      setState(prev => ({ ...prev, error: 'Failed to refresh data', isLoading: false }));
    }
  };

  // Payment methods
  const paymentMethods = [
    { id: 'all', name: 'Payment Methods' },
    { id: 'cash', name: 'Cash' },
    { id: 'gcash', name: 'GCash' }
  ];

  // Filter transactions
  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = transaction.customer_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = (!startDate || new Date(transaction.transaction_date) >= new Date(startDate)) && 
                       (!endDate || new Date(transaction.transaction_date) <= new Date(endDate));
    const matchesBranch = isAdmin 
      ? (!currentBranch || transaction.branch_id === currentBranch) 
      : transaction.branch_id === userBranchId;
    const matchesPayment = selectedPayment === 'all' || 
                          transaction.payment_method?.toLowerCase() === selectedPayment.toLowerCase();
    
    return matchesSearch && matchesDate && matchesBranch && matchesPayment;
  });

  // Pagination
  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  // Calculate totals
  const totals = filteredTransactions.reduce((acc, transaction) => {
    const totalAmount = Number(transaction.total_amount) || 0;
    const taxAmount = Number(transaction.tax_amount) || 0;
    const discountAmount = Number(transaction.discount_amount) || 0;
    
    return {
      count: acc.count + 1,
      sales: acc.sales + totalAmount,
      tax: acc.tax + taxAmount,
      discount: acc.discount + discountAmount
    };
  }, { count: 0, sales: 0, tax: 0, discount: 0 });

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Format currency to Philippine Peso
  const formatCurrency = (amount) => {
    return `₱${(Number(amount) || 0).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
  };

  // Export to Excel
  const exportToExcel = () => {
    const headers = ["Date", "Customer", "Branch", "Total", "Payment"];
    const csvContent = [
      headers.join(","),
      ...filteredTransactions.map(t => {
        const branch = branches.find(b => b.branch_id === t.branch_id);
        return [
          `"${formatDate(t.transaction_date)}"`,
          `"${t.customer_name || 'Walk-in'}"`,
          `"${branch?.branch_name || '-'}"`,
          (Number(t.total_amount) || 0),
          `"${t.payment_method || 'N/A'}"`
        ].join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'transactions.csv';
    link.click();
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // View transaction details
  const viewTransactionDetails = (transaction) => {
    setState(prev => ({
      ...prev,
      selectedTransaction: transaction,
      showDetailsModal: true
    }));
  };

  const closeDetailsModal = () => {
    setState(prev => ({
      ...prev,
      showDetailsModal: false,
      selectedTransaction: null
    }));
  };

  if (isLoading) {
    return (
      <div className="users-container">
        <Sidebar />
        <div className="users-content loading">
          <div className="spinner"></div>
          <p>Loading transactions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-content-container">
      <div className="users-container">
        <Sidebar />
        <div className="users-content">
          <div className="users-header">
            <h1>Transaction History</h1>
            <div className="icon-1">
              {/* <Bell className="icon" /> */}
              <div className="user-avatar"></div>
            </div>
          </div>

          <div className="user-management-wrapper">
            <div className="header-container">
              <h2>All Sales Transactions</h2>
              <div className="finance-filters">
                {isAdmin && (
                  <div className="branch-selector">
                    <label>Branch: </label>
                    <select 
                      value={currentBranch || ''} 
                      onChange={(e) => handleBranchChange(e.target.value)}
                      className="filter-select"
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
                
                <div className="search-bar">
                  <FaSearch className="search-icon" />
                  <input 
                    type="text" 
                    placeholder="Search customers..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="date-range-picker">
                  <label>From:</label>
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate || undefined}
                  />
                  <label>To:</label>
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate || undefined}
                  />
                </div>
                
                <select
                  value={selectedPayment}
                  onChange={(e) => setSelectedPayment(e.target.value)}
                  className="filter-select"
                >
                  {paymentMethods.map(method => (
                    <option key={method.id} value={method.id}>
                      {method.name}
                    </option>
                  ))}
                </select>
                
                <div className="export-buttons">
                  <button className="refresh-btn" onClick={refreshData}>
                    <FaSync /> Refresh
                  </button>
                  <button className="export-btn" onClick={exportToExcel}>
                    <FaFileExcel /> Excel
                  </button>
                  <button className="print-btn" onClick={handlePrint}>
                    <FaPrint /> Print
                  </button>
                </div>
              </div>
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
              <div className="summary-cards">
                <div className="summary-card">
                  <h3>Total Transactions</h3>
                  <p>{totals.count}</p>
                </div>
                <div className="summary-card">
                  <h3>Total Sales</h3>
                  <p>{formatCurrency(totals.sales)}</p>
                </div>
                {/* <div className="summary-card">
                  <h3>Total Tax</h3>
                  <p>{formatCurrency(totals.tax)}</p>
                </div> */}
                <div className="summary-card">
                  <h3>Total Discounts</h3>
                  <p>{formatCurrency(totals.discount)}</p>
                </div>
              </div>

              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Customer</th>
                    <th>Branch</th>
                    <th>Total</th>
                    <th>Payment</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentTransactions.length > 0 ? (
                    currentTransactions.map((transaction) => {
                      const branch = branches.find(b => b.branch_id === transaction.branch_id);
                      return (
                        <tr key={transaction.transaction_id}>
                          <td>{formatDate(transaction.transaction_date)}</td>
                          <td>{transaction.customer_name || 'Walk-in'}</td>
                          <td>{branch?.branch_name || '-'}</td>
                          <td>{formatCurrency(transaction.total_amount)}</td>
                          <td>{transaction.payment_method || 'N/A'}</td>
                          <td>
                            <button 
                              className="view-btn"
                              onClick={() => viewTransactionDetails(transaction)}
                            >
                              <FaEye /> View
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="no-results">
                        {transactions.length === 0 ? 'No transactions available' : 'No transactions match your filters'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>

              {/* Pagination */}
              {filteredTransactions.length > transactionsPerPage && (
                <div className="pagination">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>
                  <span>Page {currentPage} of {totalPages}</span>
                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {showDetailsModal && selectedTransaction && (
        <div className="modal-overlay">
          <div className="transaction-details-modal">
            <div className="modal-header">
              <h2>Transaction Details</h2>
              <button className="close-btn" onClick={closeDetailsModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="transaction-info">
                <div>
                  <span>Date:</span>
                  <span>{formatDate(selectedTransaction.transaction_date)}</span>
                </div>
                <div>
                  <span>Customer:</span>
                  <span>{selectedTransaction.customer_name || 'Walk-in'}</span>
                </div>
                <div>
                  <span>Payment Method:</span>
                  <span>{selectedTransaction.payment_method || 'N/A'}</span>
                </div>
              </div>

              <table className="details-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedTransaction.items && selectedTransaction.items.length > 0 ? (
                    selectedTransaction.items.map((item, idx) => (
                      <tr key={idx}>
                        <td>{item.product_name || 'Service'}</td>
                        <td>{formatCurrency(item.price)}</td>
                        <td>{item.quantity || 1}</td>
                        <td>{formatCurrency((item.price || 0) * (item.quantity || 1))}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4">No item details available</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <div className="transaction-totals">
                <div>
                  <span>Subtotal:</span>
                  <span>{formatCurrency(selectedTransaction.subtotal_amount)}</span>
                </div>
                <div>
                  <span>Tax:</span>
                  <span>{formatCurrency(selectedTransaction.tax_amount)}</span>
                </div>
                <div>
                  <span>Discount:</span>
                  <span>-{formatCurrency(selectedTransaction.discount_amount)}</span>
                </div>
                <div className="grand-total">
                  <span>Total:</span>
                  <span>{formatCurrency(selectedTransaction.total_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;