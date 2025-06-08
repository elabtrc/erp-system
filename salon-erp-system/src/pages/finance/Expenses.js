import Sidebar from "../../pages/Sidebar";
import "../hr/EmployeeManagement.css";
import axios from "axios";
import { Search, CalendarDays, Plus, Save } from "lucide-react";
import React, { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';

const ExpenseSummary = () => {
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [payrollExpense, setPayrollExpense] = useState(null);
  const [rentExpense, setRentExpense] = useState(null);
  const [internetExpense, setInternetExpense] = useState(null); 
  const [selectedMonth, setSelectedMonth] = useState("");
  const [manualExpenses, setManualExpenses] = useState({
    supplies: "",
    water: "",
    electricity: "",
  });

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await axios.get("http://localhost:5000/api/branches");
        setBranches(res.data);
      } catch (err) {
        console.error("Error fetching branches:", err);
      }
    };
  
    fetchBranches();
  }, []);

  const generateExpenseSummary = async () => {

    console.log("Selected Branch:", selectedBranch);
    console.log("Selected Month:", selectedMonth);

    if (!selectedBranch || !selectedMonth) {
      toast.error("Please select branch, year, and month.");
      return;
    }

    const [year, month] = selectedMonth.split("-");

    const expenseData = {
      branch_id: selectedBranch,
      year,
      month,
      rent: rentExpense,              
      internet: internetExpense,
      payroll_expense: payrollExpense,
      supplies: manualExpenses.supplies,
      water: manualExpenses.water,
      electricity: manualExpenses.electricity
    };
  
    try {
      const response = await axios.post("http://localhost:5000/api/expense-summary", expenseData);
      toast.success("Expense summary generated successfully!");
      console.log(response.data);
    } catch (error) {
      console.error("Error generating expense summary:", error.response || error.message);
      toast.error("Failed to generate expense summary");
    }
  };
  
  
const fetchRecurringExpenses = async () => {
  try {
    const res = await axios.get("http://localhost:5000/api/recurring-expenses", {
      params: { branch_id: selectedBranch }
    });

    setRentExpense(res.data.rent);
    setInternetExpense(res.data.internet);
  } catch (err) {
    console.error("Recurring expenses error:", err.message);
  }
};

  useEffect(() => {
    if (selectedBranch && selectedMonth) {
      fetchPayrollExpense();
      fetchRecurringExpenses();
    }
  }, [selectedBranch, selectedMonth]);

  
  const fetchPayrollExpense = async () => {
    if (!selectedBranch || !selectedMonth) {
      alert("Please select both branch and month");
      return;
    }
  
    const [year, month] = selectedMonth.split("-");
    
    try {
      const res = await axios.get("http://localhost:5000/api/payroll/expense-summary", {
        params: {
          branch_id: selectedBranch,
          year,
          month
        }
      });
  
      setPayrollExpense(res.data.total_expense);
    } catch (err) {
      console.error("Error fetching payroll expense:", err);
      alert("Failed to fetch payroll expense");
    }
  };  

  const handleChange = (e) => {
    setManualExpenses({
      ...manualExpenses,
      [e.target.name]: e.target.value,
    });
  };

  const handleMonthChange = (e) => {
    setSelectedMonth(e.target.value);
  };
  


  return (
    <div className="hr-container">
      <Sidebar />
      <div className="hr-content">
        {/* Header Section */}
        <div className="hr-header">
          <h1>Generate Expense Summary</h1>
          <div className="hr-icons">
            <div className="user-avatar"></div>
          </div>
        </div>
  
        {/* Expense Table */}
        <div className="recent-jobs">
          <div className="recent-jobs-header">
            <h2>Monthly Expenses</h2>
          </div>
  
          {/* Month + Branch Picker */}
          <div className="month-picker">
            <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
              <option value="">Select Branch</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
            <CalendarDays className="calendar-icon" />
            <input type="month" value={selectedMonth} onChange={handleMonthChange} />
          </div>
  
          {/* Expense Table */}
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount (₱)</th>
              </tr>
            </thead>
            <tbody>
              {/* Auto-fetched expenses */}
              {payrollExpense !== null && rentExpense !== null && internetExpense !== null ? (
                <>
                  <tr>
                    <td>Payroll</td>
                    <td><input type="number" value={payrollExpense} disabled /></td>
                  </tr>
                  <tr>
                    <td>Rent</td>
                    <td><input type="number" value={rentExpense} disabled /></td>
                  </tr>
                  <tr>
                    <td>Internet</td>
                    <td><input type="number" value={internetExpense} disabled /></td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan="2">Please select a branch and month to view auto expenses.</td>
                </tr>
              )}
  
              {/* Manual input fields */}
              <tr>
                <td>Supplies</td>
                <td>
                  <input
                    type="number"
                    name="supplies"
                    value={manualExpenses.supplies}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Water</td>
                <td>
                  <input
                    type="number"
                    name="water"
                    value={manualExpenses.water}
                    onChange={handleChange}
                  />
                </td>
              </tr>
              <tr>
                <td>Electricity</td>
                <td>
                  <input
                    type="number"
                    name="electricity"
                    value={manualExpenses.electricity}
                    onChange={handleChange}
                  />
                </td>
              </tr>
            </tbody>
          </table>
  
          <div className="expense-buttons">
            <button className="save-expense-btn" onClick={generateExpenseSummary}>
              <Save size={18} /> Generate Expenses
            </button>
          </div>
        </div>
      </div>
    </div>
  );  
};

export default ExpenseSummary;