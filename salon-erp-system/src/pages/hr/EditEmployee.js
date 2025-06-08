import React, { useState, useEffect } from "react";
import { toast } from 'react-hot-toast';
import "./EmployeeManagement.css";

const EditEmployeeForm = ({ showModal, handleClose, onEmployeeUpdated, employeeData }) => {
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    first_name: "",
    last_name: "",
    role_id: "",
    hire_date: "",
    salary: "",
    branch_id: "",
    birth_date: "",
  });

  const [branches, setBranches] = useState([]);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (employeeData) {
      setFormData(employeeData); // Fill form with existing employee data
    }
  }, [employeeData]);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/branches");
        const data = await response.json();
        setBranches(data);
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };

    fetchBranches();
  }, []);

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetch("http://localhost:5000/roles");
        const data = await response.json();
        setRoles(data);
      } catch (error) {
        console.error("Error fetching roles:", error);
      }
    };
  
    fetchRoles();
  }, []);

  useEffect(() => {
    if (employeeData) {
      setFormData({
        ...employeeData,
        birth_date: employeeData.birth_date ? new Date(employeeData.birth_date).toISOString().split("T")[0] : "",
        hire_date: employeeData.hire_date ? new Date(employeeData.hire_date).toISOString().split("T")[0] : "",
      });
    }
  }, [employeeData]);
  

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === "birth_date" || name === "hire_date" ? new Date(value).toISOString().split("T")[0] : value,
    }));
  };
  
  const handleSave = async (updatedEmployeeData) => {
    try {
      const response = await fetch(`http://localhost:5000/employees/${updatedEmployeeData.employee_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedEmployeeData),
      });
  
      if (!response.ok) {
        throw new Error("Failed to update employee");
      }
  
      const updatedEmployee = await response.json(); // Expecting { message, updatedEmployee }
    toast.success("Employee updated successfully!");

    if (onEmployeeUpdated) {
      onEmployeeUpdated(updatedEmployeeData);
    }
    
    handleClose();
    } catch (error) {
      console.error(error);
    }
  };  

  if (!showModal) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Edit Employee</h2>

        {errorMessage && <div className="error-message">{errorMessage}</div>}

        <form onSubmit={(e) => {
            e.preventDefault(); // Important: para hindi mag refresh yung page
            handleSave(formData); // Save the edited employee
            }}>
          <div className="form-group">
            <label htmlFor="employee_id">Employee ID</label>
            <input
              type="text"
              id="employee_id"
              name="employee_id"
              value={formData.employee_id}
              onChange={handleChange}
              readOnly // Cannot edit employee_id
            />
          </div>

          <div className="form-group">
            <label htmlFor="first_name">First Name</label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="last_name">Last Name</label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="role_id">Position</label>
            <select
              id="role_id"
              name="role_id"
              value={formData.role_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Position</option>
              {roles.map((role) => (
                <option key={role.role_id} value={role.role_id}>
                  {role.role_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="hire_date">Hire Date</label>
            <input
              type="date"
              id="hire_date"
              name="hire_date"
              value={formData.hire_date}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="salary">Salary</label>
            <input
              type="number"
              id="salary"
              name="salary"
              value={formData.salary}   
              onChange={handleChange}
              required
            />
          </div>

          {/* Branch Selection */}
          <div className="form-group">
            <label htmlFor="branch_id">Branch</label>
            <select
              id="branch_id"
              name="branch_id"
              value={formData.branch_id}
              onChange={handleChange}
              required
            >
              <option value="">Select Branch</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="birth_date">Birth Date</label>
            <input
              type="date"
              id="birth_date"
              name="birth_date"
              value={formData.birth_date}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="add-employee-btn-1">
            Save Changes
          </button>
          <button type="button" className="cancel-btn" onClick={handleClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditEmployeeForm;