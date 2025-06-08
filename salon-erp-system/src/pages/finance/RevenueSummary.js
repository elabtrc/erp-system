import Sidebar from "../../pages/Sidebar";
import "../hr/EmployeeManagement.css";
import { FileText, Search } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from 'react-hot-toast';
import jsPDF from "jspdf";

const RevenueSummaryTable = () => {
  const [transactions, setTransactions] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [error, setError] = useState("");
  const [revenueSummaries, setRevenueSummaries] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch transactions and branches data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const txRes = await fetch("http://localhost:5000/api/revenue/pos_transactions");
        const txData = await txRes.json();
        setTransactions(txData);
  
        const branchRes = await fetch("http://localhost:5000/api/branches");
        const branchData = await branchRes.json();
        console.log("Fetched Branches:", branchData); // Log the branches data
        setBranches(branchData);
  
        const summaryRes = await fetch("http://localhost:5000/api/revenue-summary");
        const summaryData = await summaryRes.json();
        setRevenueSummaries(summaryData);
      } catch (err) {
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };
  
    fetchData();
  }, []);
  

  // Get branch name from ID
  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.branch_id === branchId);
    return branch ? branch.branch_name : "Unknown";
  };

  const generateRevenue = async () => {
    if (!selectedBranch || !selectedMonth) {
      setError("Please select both branch and month.");
      toast.error("Please select both branch and month.");
      return;
    }
  
    try {
      const response = await fetch("http://localhost:5000/api/generate-revenue", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          branch_id: selectedBranch,
          month: selectedMonth, // month is in 'YYYY-MM' format
        }),
      });
  
      const data = await response.json();
  
      if (response.status === 409) {
        toast(data.error || "Revenue already generated."); // ✅ FIXED
        return;
      }
      
      if (response.status === 400) {
        toast(data.error || "Invalid request.");
        setError(data.error || "Invalid request.");
        return;
      }
  
      if (response.ok) {
        const total = parseFloat(data.total_sales);
  
        if (total === 0 || isNaN(total)) {
            setError("No revenue found for the selected branch and month.");
            toast("No revenue found for the selected branch and month."); // neutral toast
          
          
        } else {
          setTotalRevenue(total);
          setError(""); // Clear any previous error
          toast.success("Revenue summary generated successfully!");
        }
      } else {
        setError(data.error || "Failed to generate revenue summary.");
        toast.error(data.error || "Failed to generate revenue summary.");
      }
    } catch (err) {
      console.error("Error generating revenue:", err);
      setError("Failed to generate revenue summary.");
      toast.error("Failed to generate revenue summary.");
    }
  };

  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    
    console.log("Searching for:", e.target.value);
  };

  // Generate PDF for selected revenue summary
  const generatePDF = (summary) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Revenue Summary`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Branch: ${getBranchName(summary.branch_id)}`, 14, 30);
    doc.text(`Month: ${summary.month}`, 14, 40);
    doc.text(`Total Revenue: ₱${Number(summary.total_sales).toFixed(2)}`, 14, 50);
    doc.save(`revenue_summary_${summary.month}.pdf`);
  };

  return (
    <div className="hr-container">
      <Sidebar />
      <div className="hr-content">
        <div className="hr-header">
          <h1>Revenue Summary</h1>
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
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Generate and View Revenue Summary</h2>
          </div>

          <div className="generate-revenue-container">
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

            <button onClick={generateRevenue} className="generate-revenue-btn">
              Generate Revenue
            </button>

            {error && <p className="error">{error}</p>}
          </div>

          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Branch</th>
                <th>Month</th>
                <th>Total Revenue</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {revenueSummaries.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No records found
                  </td>
                </tr>
              ) : (
                revenueSummaries.map((summary, idx) => (
                  <tr key={summary.id || idx}>
                    <td>{idx + 1}</td>
                    <td>{getBranchName(summary.branch_id)}</td>
                    <td>{summary.month}</td>
                    <td>₱{Number(summary.total_sales).toFixed(2)}</td>
                    <td>
                      <button className="generate-pdf-btn" onClick={() => generatePDF(summary)}>
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

export default RevenueSummaryTable;