import Sidebar from "../../pages/Sidebar";
import "../hr/EmployeeManagement.css";
import { FileText, Edit } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from 'react-hot-toast';
import jsPDF from "jspdf";


const ExpenseSummaryTable = () => {
  const [expenses, setExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");


  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/expense_summary");
      if (!response.ok) throw new Error("Failed to fetch expenses");
      const data = await response.json();
      setExpenses(data);

      const branchResponse = await fetch("http://localhost:5000/api/branches");
      if (!branchResponse.ok) throw new Error("Failed to fetch branches");
      const branchData = await branchResponse.json();
      setBranches(branchData);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.branch_id === branchId);
    return branch ? branch.branch_name : "Unknown Branch";
  };

  const filteredExpenses = expenses.filter((expense) =>
    selectedBranch ? Number(expense.branch_id) === Number(selectedBranch) : true
  );

  const generatePDF = (expense) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Expense Summary for ${expense.month} / ${expense.year}`, 14, 20);

    doc.setFontSize(12);
    doc.text(`Branch: ${getBranchName(expense.branch_id)}`, 14, 30);
    doc.text(`Payroll: ₱${expense.payroll_expense}`, 14, 40);
    doc.text(`Rent: ₱${expense.rent}`, 14, 50);
    doc.text(`Internet: ₱${expense.internet}`, 14, 60);
    doc.text(`Supplies: ₱${expense.supplies}`, 14, 70);
    doc.text(`Water: ₱${expense.water}`, 14, 80);
    doc.text(`Electricity: ₱${expense.electricity}`, 14, 90);
    doc.setFontSize(13);
    doc.text(`Total: ₱${expense.total_expense}`, 14, 105);

    doc.save(`expense_summary_${expense.month}_${expense.year}.pdf`);
  };

  return (
    <div className="hr-container">
      <Sidebar />
      <div className="hr-content">
        <div className="hr-header">
          <h1>Expense Summary</h1>

          <div className="hr-icons">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="recent-jobs">
          <div className="recent-jobs-header">
            <h2>Expense List</h2>
            <div className="branch-dropdown">
              <select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)}>
                <option value="">All Branches</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>
                    {branch.branch_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Branch</th>
                <th>Year</th>
                <th>Month</th>
                <th>Rent</th>
                <th>Internet</th>
                <th>Payroll</th>
                <th>Supplies</th>
                <th>Water</th>
                <th>Electricity</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="13" style={{ textAlign: 'center' }}>No expenses found</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.id}</td>
                    <td>{getBranchName(expense.branch_id)}</td>
                    <td>{expense.year}</td>
                    <td>{expense.month}</td>
                    <td>₱{expense.rent}</td>
                    <td>₱{expense.internet}</td>
                    <td>₱{expense.payroll_expense}</td>
                    <td>₱{expense.supplies}</td>
                    <td>₱{expense.water}</td>
                    <td>₱{expense.electricity}</td>
                    <td><strong>₱{expense.total_expense}</strong></td>
                    <td className="actions">
                      <button className="generate-pdf-btn" onClick={() => generatePDF(expense)}>
                        <FileText size={18} /> Generate PDF
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
  );
};

export default ExpenseSummaryTable;
