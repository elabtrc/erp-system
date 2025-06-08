import React, { useState, useEffect } from "react";
  import Sidebar from "../Sidebar";
  import "../settings/users.css";
  import "../hr/Payroll.css"
  import { Search } from "lucide-react";
  import axios from "axios";

  const convertToLocalDate = (utcDate) => {
    if (!utcDate) return '-';
    const date = new Date(utcDate); // Create a Date object from UTC date
    return date.toLocaleDateString(); // This will automatically adjust to the local time zone (date format)
  };

  const convertToLocalTime = (utcTime) => {
    if (!utcTime) return '-';
    const date = new Date(utcTime); 
    return date.toLocaleTimeString(); 
  };

  const AttendanceLogs = () => {
    const [logs, setLogs] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("All");


    const fetchLogs = async () => {
      try {
        const url =
          selectedBranch === "All"
            ? "http://localhost:5000/api/attendance"
            : `http://localhost:5000/api/attendance?branch_id=${selectedBranch}`;
    
        const response = await axios.get(url);
        setLogs(response.data);
      } catch (error) {
        console.error("Error fetching attendance logs:", error);
      }
    };

    useEffect(() => {
      const fetchBranches = async () => {
        try {
          const response = await axios.get("http://localhost:5000/api/branches");
          setBranches(response.data);
        } catch (error) {
          console.error("Error fetching branches:", error);
        }
      };
    
      fetchBranches();
    }, []);  

    useEffect(() => {
      fetchLogs();
    }, [selectedBranch]);

    // Handle search input change
    const handleSearchChange = (e) => {
      setSearchTerm(e.target.value);
    };

    const filteredLogs = logs.filter((log) => {
      const nameMatches = log.employee_name?.toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatches;
    });

    return (
      <div className="users-container">
        <Sidebar />
        <div className="users-content">
          {/* Header */}
          <div className="users-header">
            <h1>Attendance Logs</h1>
            <div className="icon-1">

              {/* Search Bar */}
              <div className="search-container">
                <div className="search-bar">
                  <Search className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </div>
              </div>

              {/* <Bell className="icon" /> */}
              <div className="user-avatar"></div>
            </div>
          </div>

          {/* Content */}
          <div className="user-management-wrapper">
            <div className="header-container">
              <h2>Employee Attendance Records</h2>

              <div className="generate-payroll-container">
                <div className="branch-filter">
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="border p-1 m-2"
                >
                  <option value="All">All Branches</option>
                  {branches.map((branch) => (
                    <option key={branch.branch_id} value={branch.branch_id}>
                      {branch.branch_name}
                    </option>
                  ))}
                </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="user-list-container">
              <table>
              <thead>
              <tr>
                <th>Employee</th>
                <th>Branch</th>
                <th>Date</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
                {filteredLogs.length > 0 ? (
                  filteredLogs.map((log, index) => (
                    <tr key={index}>
                      <td>{log.employee_name}</td>
                      <td>{log.branch_name}</td>
                      <td>{convertToLocalDate(log.date)}</td>
                      <td>{convertToLocalTime(log.time_in)}</td>
                      <td>{log.time_out ? convertToLocalTime(log.time_out) : "-"}</td>
                      <td>{log.time_out ? "Completed" : "Timed In Only"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center" }}>
                      No records found.
                    </td>
                  </tr>
                )}
              </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>
    );
  };

  export default AttendanceLogs;