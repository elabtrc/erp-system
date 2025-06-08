import React, { useState } from 'react';
import Sidebar from '../Sidebar';
import { FaSearch, FaPrint, FaFileExcel, FaFilePdf } from 'react-icons/fa';
import { Bell, ChevronDown, ChevronUp } from 'lucide-react';
import '../settings/users.css';
import './reports.css';

const SalesReport = () => {
  // Sample sales data
  const [salesData, setSalesData] = useState([
    { 
      id: 1, 
      date: '2023-06-15', 
      invoice: 'INV-001', 
      customer: 'John Doe', 
      branch: 'Main Branch', 
      items: 3, 
      subtotal: 125.50, 
      tax: 10.04, 
      discount: 5.00, 
      total: 130.54,
      payment: 'Credit Card',
      details: [
        { product: 'Haircut', price: 35.00, quantity: 1 },
        { product: 'Hair Color', price: 60.00, quantity: 1 },
        { product: 'Shampoo', price: 15.00, quantity: 2 }
      ]
    },
    { 
      id: 2, 
      date: '2023-06-14', 
      invoice: 'INV-002', 
      customer: 'Jane Smith', 
      branch: 'North Branch', 
      items: 2, 
      subtotal: 85.00, 
      tax: 6.80, 
      discount: 0.00, 
      total: 91.80,
      payment: 'Cash',
      details: [
        { product: 'Manicure', price: 25.00, quantity: 1 },
        { product: 'Pedicure', price: 60.00, quantity: 1 }
      ]
    }
  ]);

  // State for filters
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState(getPastDate(7));
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [expandedRows, setExpandedRows] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('all');

  // Sample branches
  const branches = [
    { id: 'all', name: 'All Branches' },
    { id: '1', name: 'Main Branch' },
    { id: '2', name: 'North Branch' }
  ];

  // Payment methods
  const paymentMethods = [
    { id: 'all', name: 'All Methods' },
    { id: 'cash', name: 'Cash' },
    { id: 'credit', name: 'Credit Card' },
    { id: 'debit', name: 'Debit Card' }
  ];

  // Helper functions for dates
  function getTodayDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
  }

  function getPastDate(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString().split('T')[0];
  }

  // Toggle row expansion
  const toggleRow = (id) => {
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  // Filter sales data
  const filteredSales = salesData.filter(sale => {
    const matchesSearch = sale.invoice.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         sale.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = sale.date >= startDate && sale.date <= endDate;
    const matchesBranch = selectedBranch === 'all' || sale.branch === branches.find(b => b.id === selectedBranch)?.name;
    const matchesPayment = paymentMethod === 'all' || sale.payment.toLowerCase().includes(paymentMethod.toLowerCase());
    
    return matchesSearch && matchesDate && matchesBranch && matchesPayment;
  });

  // Calculate totals
  const totals = filteredSales.reduce((acc, sale) => ({
    sales: acc.sales + sale.total,
    items: acc.items + sale.items,
    tax: acc.tax + sale.tax,
    discount: acc.discount + sale.discount
  }), { sales: 0, items: 0, tax: 0, discount: 0 });

  // Export functions
  const exportToExcel = () => alert('Export to Excel functionality');
  const exportToPDF = () => alert('Export to PDF functionality');
  const handlePrint = () => window.print();

  return (
    <div className="reports-content-container">
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Sales Reports</h1>
          <div className="icon-1">
            <Bell className="icon" />
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Sales Report: {startDate} to {endDate}</h2>
            <div className="finance-filters">
              <div className="search-bar">
                <FaSearch className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search invoices or customers..." 
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
                  max={endDate}
                />
                <label>To:</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  min={startDate}
                />
              </div>
              
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="filter-select"
              >
                {branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="filter-select"
              >
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
              
              <div className="export-buttons">
                <button className="export-btn" onClick={exportToExcel}>
                  <FaFileExcel /> Excel
                </button>
                <button className="export-btn" onClick={exportToPDF}>
                  <FaFilePdf /> PDF
                </button>
                <button className="print-btn" onClick={handlePrint}>
                  <FaPrint /> Print
                </button>
              </div>
            </div>
          </div>

          <div className="user-list-container">
            <div className="summary-cards">
              <div className="summary-card">
                <h3>Total Sales</h3>
                <p>${totals.sales.toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h3>Transactions</h3>
                <p>{filteredSales.length}</p>
              </div>
              <div className="summary-card">
                <h3>Items Sold</h3>
                <p>{totals.items}</p>
              </div>
              <div className="summary-card">
                <h3>Tax Collected</h3>
                <p>${totals.tax.toFixed(2)}</p>
              </div>
              <div className="summary-card">
                <h3>Discounts Given</h3>
                <p>${totals.discount.toFixed(2)}</p>
              </div>
            </div>

            <table className="sales-report-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Date</th>
                  <th>Invoice #</th>
                  <th>Customer</th>
                  <th>Branch</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Tax</th>
                  <th>Discount</th>
                  <th>Total</th>
                  <th>Payment</th>
                </tr>
              </thead>
              <tbody>
                {filteredSales.length > 0 ? (
                  filteredSales.map((sale) => (
                    <React.Fragment key={sale.id}>
                      <tr>
                        <td>
                          <button onClick={() => toggleRow(sale.id)}>
                            {expandedRows.includes(sale.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                        <td>{sale.date}</td>
                        <td>{sale.invoice}</td>
                        <td>{sale.customer}</td>
                        <td>{sale.branch}</td>
                        <td>{sale.items}</td>
                        <td>${sale.subtotal.toFixed(2)}</td>
                        <td>${sale.tax.toFixed(2)}</td>
                        <td>${sale.discount.toFixed(2)}</td>
                        <td>${sale.total.toFixed(2)}</td>
                        <td>{sale.payment}</td>
                      </tr>
                      {expandedRows.includes(sale.id) && (
                        <tr className="detail-row">
                          <td colSpan="11">
                            <div className="sale-details">
                              <table>
                                <thead>
                                  <tr>
                                    <th>Product/Service</th>
                                    <th>Price</th>
                                    <th>Qty</th>
                                    <th>Total</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.details.map((item, idx) => (
                                    <tr key={idx}>
                                      <td>{item.product}</td>
                                      <td>${item.price.toFixed(2)}</td>
                                      <td>{item.quantity}</td>
                                      <td>${(item.price * item.quantity).toFixed(2)}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan="11" className="no-results">
                      No sales found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default SalesReport;