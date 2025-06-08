import React, { useState, useEffect } from "react";
import axios from "axios";
import Sidebar from "../Sidebar";
import { Search } from "lucide-react";
import { toast } from 'react-hot-toast';
import generatePayslipPDF from "./generatePaySlip";
import "../settings/users.css";
import "../hr/Payroll.css";

const Payroll = () => {
  const [selectedMonth, setSelectedMonth] = useState('');
  const [cutoffPart, setCutoffPart] = useState('first');
  const [payrollData, setPayrollData] = useState([]);
  const [showPayslipModal, setShowPayslipModal] = useState(false);
  const [selectedPayslip, setSelectedPayslip] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState('');

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get("/api/branches"); // Adjust the endpoint as needed
        setBranches(response.data);
      } catch (error) {
        console.error("Error fetching branches", error);
      }
    };
  
    fetchBranches();
  }, []);

  const generatePayroll = async () => {
    if (!selectedMonth) return toast.error('Please select a month.');
    
    const [year, month] = selectedMonth.split('-');
    const getLastDayOfMonth = (y, m) => new Date(y, m, 0).getDate();
    
    let cutoff_start, cutoff_end;
    if (cutoffPart === 'first') {
      cutoff_start = `${year}-${month}-01`;
      cutoff_end = `${year}-${month}-15`;
    } else {
      const lastDay = getLastDayOfMonth(parseInt(year), parseInt(month));
      cutoff_start = `${year}-${month}-16`;
      cutoff_end = `${year}-${month}-${lastDay}`;
    }
    
    const payroll_date = new Date().toISOString().split('T')[0];
    
    try {
      const response = await axios.post('/payroll/generate', {
        cutoff_start,
        cutoff_end,
        payroll_date,
        branch_id: selectedBranch,
      });
      
      const generatedPayroll = response.data.payroll;
      
      // Check if the payroll data is not empty
      if (generatedPayroll && generatedPayroll.length > 0) {
        setPayrollData(generatedPayroll);
        toast.success('Payroll successfully generated!');
        console.log('Payroll data generated:', generatedPayroll);
      } else {
        toast.error('No payroll generated. Please check the inputs or try again.');
      }
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Payroll for this cutoff already exists!');
      } else {
        toast.error('Payroll generation failed.');
      }
    }
  };
 
  const viewPayroll = async () => {
    if (!selectedMonth) return toast.error('Please select a month.');
  
    const [year, month] = selectedMonth.split('-');
    const getLastDayOfMonth = (y, m) => new Date(y, m, 0).getDate();
  
    let cutoff_start, cutoff_end;
    if (cutoffPart === 'first') {
      cutoff_start = `${year}-${month}-01`;
      cutoff_end = `${year}-${month}-15`;
    } else {
      const lastDay = getLastDayOfMonth(parseInt(year), parseInt(month));
      cutoff_start = `${year}-${month}-16`;
      cutoff_end = `${year}-${month}-${lastDay}`;
    }
  
    try {
      const response = await axios.get('/payroll/view', {
        params: {
          cutoff_start,
          cutoff_end,
          branch_id: selectedBranch,
        },
      });
    
      const data = response.data.payroll;
    
      if (data.length === 0) {
        toast.error('No payroll records found for this cutoff.');
      }
    
      setPayrollData(data);
      console.log('Payroll data retrieved:', data);
    } catch (err) {
      console.error('Failed to fetch payroll', err);
      toast.error('Failed to fetch payroll data.');
    }    
  }; 
  
  const markAsPaid = async (payroll) => {
    try {
      const employeeId = payroll.employee_id;
  
      if (!employeeId) {
        return toast.error('Employee ID is required.');
      }

      await axios.post("/api/payroll/mark-paid", { employee_id: employeeId });
  
      setPayrollData(prevPayrolls =>
        prevPayrolls.map(p =>
          p.employee_id === employeeId ? { ...p, status: 'Paid' } : p
        )
      );
  
      toast.success("Marked as paid successfully!");
    } catch (error) {
      console.error("Error marking as paid", error);
      toast.error("Failed to mark as paid.");
    }
  };

  const handleViewPayslip = async (row) => {
    try {
      const response = await fetch(`/api/payroll/mark-paid`, {
        method: 'POST',
        body: JSON.stringify({ employee_id: row.employee_id }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
  
      const data = await response.json();
  
      // Display payslip data and employee name
      setSelectedPayslip({
        ...row,
        employee_name: data.employee_name, // Get the employee name from backend
      });
  
      setShowPayslipModal(true);
    } catch (error) {
      console.error('Error fetching payslip:', error);
    }
  };
  
  const closePayslipModal = () => {
    setShowPayslipModal(false);
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    
    console.log("Searching for:", e.target.value);
  };
 

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Payroll Management</h1>

          {/* Search Bar */}
          <div className="search-bar">
            <Search className="search-icon" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery} 
              onChange={handleInputChange}
            />
          </div>

          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>
        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Payroll Records</h2>
          </div>
          <div className="generate-payroll-container">
          <label>Branch:</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
            className="border p-1 m-2"
          >
            <option value="">Select Branch</option>
            {branches.map((branch) => (
              <option key={branch.branch_id} value={branch.branch_id}>
                {branch.branch_name}
              </option>
            ))}
          </select>
            <label>Month:</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-1 m-2"
            />
            <label>Cutoff:</label>
            <select
              value={cutoffPart}
              onChange={(e) => setCutoffPart(e.target.value)}
              className="border p-1 m-2"
            >
              <option value="fir4st">1st–15th</option>
              <option value="second">16th–end</option>
            </select>
            <button onClick={viewPayroll}>View Payroll</button>
            <button onClick={generatePayroll}>Generate Payroll</button>
          </div>
          <div className="user-list-container">
            <table className="center-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Gross Pay</th>
                  <th>Deductions</th>
                  <th>Net Pay</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
              {Array.isArray(payrollData) && payrollData.length === 0 ? (
                <tr className="no-payroll-data">
                  <td colSpan="6">No payroll data available for the selected period.</td>
                </tr>
              ) : (
                payrollData?.map((row) => (
                  <tr key={row.payroll_id}>
                    <td>{row.full_name}</td>
                    <td>₱{row.gross_pay}</td>
                    <td>₱{row.deductions}</td>
                    <td>₱{row.net_pay}</td>
                    <td>{row.status ? 'Paid' : 'Pending'}</td>
                    <td>
                      <button 
                        className="view-payslip-btn" 
                        onClick={() => handleViewPayslip(row)}>
                        View Payslip
                        </button>
                      <button
                        className="mark-as-paid-btn"
                        onClick={() => markAsPaid(row)}
                        disabled={row.status === 'Paid'}>
                        Mark as Paid
                      </button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
  
      {/* Payslip Modal */}
      {showPayslipModal && (
        <div className="payslip-modal">
          <div className="payslip-modal-content">
            <span className="close-btn" onClick={closePayslipModal}>&times;</span>
            <h3>Payslip for {selectedPayslip?.employee_name}</h3>
            <table>
              <tbody>
                <tr>
                  <td><strong>Gross Pay:</strong></td>
                  <td>₱{selectedPayslip?.gross_pay}</td>
                </tr>
                <tr>
                  <td><strong>Deductions:</strong></td>
                  <td>₱{selectedPayslip?.deductions}</td>
                </tr>
                <tr>
                  <td><strong>Net Pay:</strong></td>
                  <td>₱{selectedPayslip?.net_pay}</td>
                </tr>
                <tr>
                  <td><strong>Status:</strong></td>
                  <td>{selectedPayslip?.status ? 'Paid' : 'Pending'}</td>
                </tr>
              </tbody>
            </table>
            <div className="payslip-button-group">
            <button className="download-btn" onClick={() => generatePayslipPDF(selectedPayslip)}>
              Download Payslip
            </button>
            <button className="payslip-close-btn" onClick={closePayslipModal}>
              Close
            </button>
          </div>
          </div>
        </div>
      )}
    </div>
  );
};  
export default Payroll;