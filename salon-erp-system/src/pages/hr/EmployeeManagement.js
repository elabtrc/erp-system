import Sidebar from "../../pages/Sidebar";
import "./EmployeeManagement.css";
import AddEmployeeForm from "./AddEmployee"; 
import EditEmployeeForm from "./EditEmployee";
import { Search, Eye, Edit, Plus, Archive } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from 'react-hot-toast'; 

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddEmployeeModal, setShowAddEmployeeModal] = useState(false);
  const [showEditEmployeeModal, setShowEditEmployeeModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  
  const fetchEmployees = async () => {
    try {
      const response = await fetch("http://localhost:5000/employees");
      if (!response.ok) throw new Error("Failed to fetch employees");
  
      const data = await response.json();
      const activeEmployees = data.filter(emp => !emp.is_archived); 
      setEmployees(activeEmployees);
  
      const branchResponse = await fetch("http://localhost:5000/api/branches");
      if (!branchResponse.ok) throw new Error("Failed to fetch branches");
      const branchData = await branchResponse.json();
      setBranches(branchData);
  
    } catch (err) {
      console.error("Error fetching employees:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };  

  useEffect(() => {
    fetchEmployees();
  }, []);  
  
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    
    console.log("Searching for:", e.target.value);
  };

  const handleBranchChange = (e) => {
    setSelectedBranch(e.target.value);
    console.log('Selected Branch:', e.target.value); // Check if it updates
  };

  const handleShowModal = () => {
    setShowAddEmployeeModal(true);
  };

  const handleCloseModal = () => {
    setShowAddEmployeeModal(false);
  };

  const handleEmployeeAdded = (newEmployee) => {
    setEmployees((prevEmployees) => [...prevEmployees, newEmployee]);
    fetchEmployees();  // <--- ADD THIS
  };
  
  const handleEdit = (id) => {
    const employeeToEdit = employees.find(emp => emp.employee_id === id);
    setSelectedEmployee(employeeToEdit);
    setShowEditEmployeeModal(true);
    fetchEmployees();
  };
  
  const handleArchive = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/employees/${id}/archive`, {
        method: "PUT",
      });
  
      if (!response.ok) {
        throw new Error("Failed to archive employee");
      }
  
      toast.success("Employee archived successfully!");
      fetchEmployees(); // refresh list after archive
    } catch (error) {
      console.error("Error archiving employee:", error);
      toast.error("Failed to archive employee. Please try again.");
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearchQuery =
      employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase());
    
      const matchesBranch = selectedBranch ? Number(employee.branch_id) === Number(selectedBranch) : true;

    return matchesSearchQuery && matchesBranch;
  });

  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.branch_id === branchId);
    return branch ? branch.branch_name : "Unknown Branch"; // Default if no branch found
  };

  if (loading) return <p>Loading employees...</p>;
  if (error) return <p>Error: {error}</p>;

  // const filteredEmployees = employees.filter((employee) => {
  //   return (
  //     employee.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     employee.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  //     employee.position.toLowerCase().includes(searchQuery.toLowerCase())
  //   );
  // });

  // const getBranchName = (branchId) => {
  //   const branch = branches.find((b) => b.branch_id === branchId);
  //   return branch ? branch.branch_name : "Unknown Branch"; // Default if no branch found
  // };

  // if (loading) return <p>Loading employees...</p>;
  // if (error) return <p>Error: {error}</p>;

  return (
    <div className="hr-container">
      <Sidebar />
      <div className="hr-content">
        {/* Header Section */}
        <div className="hr-header">
          <h1>Employee Management</h1>

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
            <div className="user-avatar"></div>
          </div>
        </div>

        {/* Employees Section */}
        <div className="recent-jobs">
          <div className="recent-jobs-header">
            <h2>Employees</h2>
            <button className="add-employee-btn"
            onClick={handleShowModal}
            >
              <Plus size={18} /> Add Employee
            </button>
          </div>
          <AddEmployeeForm
            showModal={showAddEmployeeModal}
            handleClose={handleCloseModal}
            onEmployeeAdded={handleEmployeeAdded}
          />
          {showEditEmployeeModal && (
            <EditEmployeeForm
            showModal={showEditEmployeeModal}
            handleClose={() => setShowEditEmployeeModal(false)}
            employeeData={selectedEmployee}
            onEmployeeUpdated={(updatedEmployee) => {
              setEmployees((prevEmployees) =>
                prevEmployees.map((emp) =>
                  emp.employee_id === updatedEmployee.employee_id ? updatedEmployee : emp
                )
              );
              fetchEmployees(); 
            }}
          />          
          )}
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>Birth Date</th>
                <th>Position</th>
                <th>Hire Date</th>
                <th>Salary</th>
                <th>Branch</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan="9" style={{ textAlign: 'center' }}>No employees found</td>
                </tr>
              ) : (
                filteredEmployees.map((employee) => (
                <tr key={employee.employee_id}>
                  <td>{employee.employee_id}</td>
                  <td>{employee.first_name}</td>
                  <td>{employee.last_name}</td>
                  <td>{new Date(employee.birth_date).toLocaleDateString()}</td>
                  <td>{employee.position}</td>
                  <td>{new Date(employee.hire_date).toLocaleDateString()}</td>
                  <td>{employee.salary}</td>
                  <td>{getBranchName(employee.branch_id)}</td>
                  <td className="actions">
                    <button className="edit-btn" onClick={() => handleEdit(employee.employee_id)}>
                      <Edit size={18} />
                    </button>
                    <button className="archive-btn" onClick={() => handleArchive(employee.employee_id)}>
                      <Archive size={18} />
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

export default EmployeeManagement;