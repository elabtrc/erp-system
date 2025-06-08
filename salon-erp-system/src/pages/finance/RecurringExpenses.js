import Sidebar from "../../pages/Sidebar";
import "../hr/EmployeeManagement.css"; // You can use the same styles
import { Search, Edit, Plus, Archive } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from 'react-hot-toast';


const RecurringExpenses = () => {
  const [recurringExpenses, setRecurringExpenses] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingExpense, setEditingExpense] = useState(null);

  const fetchExpenses = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/recurring_expenses/view");
      if (!response.ok) throw new Error("Failed to fetch recurring expenses");
      const data = await response.json();
      setRecurringExpenses(data);

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

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
  };

  const handleEdit = (expense) => {
    setEditingExpense(expense);
  };

  const handleSaveChanges = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/recurring_expenses/${editingExpense.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingExpense), // Make sure this data is valid
      });
  
      if (!response.ok) throw new Error("Failed to update expense");
      toast.success("Expense updated successfully!");
      setEditingExpense(null);
      fetchExpenses(); // refresh after edit
    } catch (error) {
      console.error("Error updating expense:", error);
      toast.error("Failed to update expense. Please try again.");
    }
  };  

  const filteredExpenses = recurringExpenses.filter((expense) => {
    const matchesSearchQuery =
      (expense.branch_name?.toLowerCase().includes(searchQuery.toLowerCase()) || '') ||
      expense.rent.toString().includes(searchQuery) ||
      expense.internet.toString().includes(searchQuery);
  
    const matchesBranch = selectedBranch ? expense.branch_id === Number(selectedBranch) : true;
  
    return matchesSearchQuery && matchesBranch;
  });
  

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.branch_id === branchId);
    return branch ? branch.branch_name : "Unknown Branch";
  };

  if (loading) return <p>Loading recurring expenses...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="hr-container">
      <Sidebar />
      <div className="hr-content">
        {/* Header Section */}
        <div className="hr-header">
          <h1>Recurring Expenses</h1>

          {/* Search Bar */}
          <div className="search-bar">
            <Search className="search-icon" />
            <input
              type="text"
              placeholder="Search by branch or expenses..."
              value={searchQuery}
              onChange={handleInputChange}
            />
          </div>

          {/* Branch Dropdown */}
          <div className="branch-dropdown">
            <select value={selectedBranch} onChange={handleBranchChange}>
              <option value="">All Branches</option>
              {branches.map(branch => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="hr-icons">
            {/* <Bell className="icon" /> */}
          </div>
        </div>

        {/* Recurring Expenses Section */}
        <div className="recent-jobs">
          <div className="recent-jobs-header">
              <h2>Recurring Expenses</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Branch Name</th>
                <th>Rent</th>
                <th>Internet</th>
                <th>Last Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>No recurring expenses found</td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id}>
                    <td>{expense.branch_name}</td>
                    <td>
                      {editingExpense?.id === expense.id ? (
                        <input
                          type="number"
                          value={editingExpense.rent}
                          onChange={(e) => setEditingExpense({ ...editingExpense, rent: e.target.value })}
                        />
                      ) : (
                        expense.rent
                      )}
                    </td>
                    <td>
                      {editingExpense?.id === expense.id ? (
                        <input
                          type="number"
                          value={editingExpense.internet}
                          onChange={(e) => setEditingExpense({ ...editingExpense, internet: e.target.value })}
                        />
                      ) : (
                        expense.internet
                      )}
                    </td>
                    <td>{new Date(expense.updated_at).toLocaleDateString()}</td>
                    <td className="actions">
                      {editingExpense?.id === expense.id ? (
                        <button onClick={handleSaveChanges}>Save</button>
                      ) : (
                        <button onClick={() => handleEdit(expense)}>Edit</button>
                      )}
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

export default RecurringExpenses;