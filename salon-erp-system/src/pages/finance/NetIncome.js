import React, { useState, useEffect } from "react"; 
import axios from "axios";
import Sidebar from "../Sidebar";
// import { Bell, Search } from "lucide-react";
import { toast } from 'react-hot-toast';
import jsPDF from "jspdf";
import "../settings/users.css";
import "../hr/Payroll.css";

const NetIncome = () => {
  const [selectedBranch, setSelectedBranch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  const [netIncome, setNetIncome] = useState(0);
  const [branches, setBranches] = useState([]);
  const [viewData, setViewData] = useState(null); 

  // Fetch branches when the component mounts
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await axios.get('/api/branches'); // Adjust this to your actual endpoint for fetching branches
        setBranches(response.data); // Assuming response.data is an array of branches
      } catch (error) {
        console.error("Error fetching branches:", error);
        toast.error("Failed to fetch branches.");
      }
    };

    fetchBranches();
    }, []); 

  const handleViewNetIncome = async () => {
    if (!selectedBranch || !selectedMonth || !selectedYear) {
      toast.error("Please select branch, month, and year.");
      return;
    }
  
    try {
      const response = await axios.get(`/api/net-income/${selectedBranch}/${selectedMonth}/${selectedYear}`);
      setTotalRevenue(response.data.total_sales); // Set total revenue from the response
      setTotalExpense(response.data.total_expense); // Set total expense from the response
      setNetIncome(response.data.net_income); // Set net income from the response
      
      // Find the branch name from the branches state
    const branch = branches.find(b => b.branch_id === parseInt(selectedBranch));
    setSelectedBranch(branch ? branch.branch_name : 'Unknown Branch');

  } catch (error) {
    console.error("Error fetching net income data", error);
    toast.error("Failed to fetch net income data.");
  }
};


  // Function to fetch data and generate net income
  const handleGenerateNetIncome = async () => {
    if (!selectedBranch || !selectedMonth || !selectedYear) {
      toast.error("Please select branch, month, and year.");
      return;
    }

    try {
      // Fetch revenue and expense data
      const revenueResponse = await axios.get(`/api/net/revenue-summary?branch=${selectedBranch}&month=${selectedMonth}&year=${selectedYear}`);
      const expenseResponse = await axios.get(`/api/net/expense-summary?branch=${selectedBranch}&month=${selectedMonth}&year=${selectedYear}`);

      setTotalRevenue(revenueResponse.data.total_revenue);
      setTotalExpense(expenseResponse.data.total_expense);

      const calculatedNetIncome = revenueResponse.data.total_revenue - expenseResponse.data.total_expense;
      setNetIncome(calculatedNetIncome);

      // Insert net income to database
      await axios.post('/api/generate-net-income', {
        branch_id: selectedBranch,
        month: selectedMonth,
        year: selectedYear,
        net_income: calculatedNetIncome,
      });

      toast.success("Net Income generated and inserted successfully!");

    } catch (error) {
      console.error("Error fetching data or inserting net income", error);
      toast.error("Failed to generate and insert net income.");
    }
  };

  // Function to generate PDF of net income
const generatePDF = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(20);
    doc.text("Net Income Summary", 20, 20);
  
    doc.setFontSize(12);
  
    // Format month properly
    const monthName = new Date(0, selectedMonth - 1).toLocaleString('en-US', { month: 'long' });
  
    // Handle null values for totalRevenue and totalExpense
    const revenueText = totalRevenue ? `₱${totalRevenue}` : "₱0.00";
    const expenseText = totalExpense ? `₱${totalExpense}` : "₱0.00";
    const netIncomeText = netIncome ? `₱${netIncome}` : "₱0.00";
  
    doc.text(`Branch ID: ${selectedBranch}`, 20, 40);
    doc.text(`Month: ${monthName}`, 20, 50);
    doc.text(`Year: ${selectedYear}`, 20, 60);
    doc.text(`Revenue: ${revenueText}`, 20, 70);
    doc.text(`Expenses: ${expenseText}`, 20, 80);
    doc.text(`Net Income: ${netIncomeText}`, 20, 90);
  
    // Save and trigger the PDF download
    doc.save(`Net_Income_${selectedBranch}_${selectedMonth}_${selectedYear}.pdf`);
  };
  

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Net Income Overview</h1>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Financial Summary</h2>
          </div>

          <div className="generate-payroll-container">
            <label>Branch:</label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="border p-1 m-2"
            >
              <option value="">Select Branch</option>
              {/* Map over available branches */}
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>

            <label>Month:</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border p-1 m-2"
            >
              <option value="">Select Month</option>
              {Array.from({ length: 12 }, (_, i) => {
                const month = (i + 1).toString().padStart(2, '0');
                return (
                  <option key={month} value={month}>
                    {new Date(0, i).toLocaleString('en-US', { month: 'long' })}
                  </option>
                );
              })}
            </select>

            <label>Year:</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border p-1 m-2"
            >
              <option value="">Select Year</option>
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() - i;
                return (
                  <option key={year} value={year}>
                    {year}
                  </option>
                );
              })}
            </select>
            {/* Generate Net Income Button */}
            <div className="generate-button">
              <button onClick={handleGenerateNetIncome} className="btn btn-primary">
                Generate Net Income
              </button>
            </div>
            {/* Generate PDF Button */}
            <div className="generate-button">
              <button onClick={generatePDF} className="btn btn-secondary">
                Generate PDF
              </button>
            </div>
            <button onClick={handleViewNetIncome} className="btn btn-secondary">
                View Net Income
              </button>
          </div>

          {/* Detailed Breakdown */}
          <div className="detailed-breakdown">
            <h3>
            Breakdown for {selectedBranch} - {new Date(selectedYear, selectedMonth - 1).toLocaleString('en-US', { month: 'long' })} {selectedYear}
            </h3>
            <table className="summary-table">
              <thead>
                <tr>
                  <th>Category</th>
                  <th>Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Revenue</td>
                  <td>₱{totalRevenue}</td>
                </tr>
                <tr>
                  <td>Expenses</td>
                  <td>₱{totalExpense}</td>
                </tr>
                <tr>
                  <td><strong>Net Income</strong></td>
                  <td><strong>₱{netIncome}</strong></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetIncome;