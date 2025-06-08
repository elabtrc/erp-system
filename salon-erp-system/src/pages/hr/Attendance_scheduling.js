import React, { useEffect, useState } from "react";
import Sidebar from "../Sidebar";
import "../settings/users.css";
import "./scheduling.css";
import { Bell } from "lucide-react";
import { FaEdit, FaTimes, FaSave } from "react-icons/fa";

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const EmployeeSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [branchId, setBranchId] = useState("");
  const [branches, setBranches] = useState([]);

  useEffect(() => {
    fetchBranches();
    fetchSchedules();
  }, []);

  const fetchBranches = async () => {
    try {
      const response = await fetch("/api/branches");
      const data = await response.json();
      setBranches(data);
    } catch (error) {
      console.error("Error fetching branches:", error);
    }
  };

  const fetchSchedules = async (branch_id = "") => {
    try {
      const url = branch_id ? `/api/employee-schedule?branch_id=${branch_id}` : `/api/employee-schedule`;
      const response = await fetch(url);
      const data = await response.json();

      if (Array.isArray(data)) {
        setSchedules(data);
      } else {
        console.error("Unexpected response format:", data);
        setSchedules([]);
      }
    } catch (error) {
      console.error("Error fetching schedules:", error);
      setSchedules([]);
    }
  };

  const handleEdit = (schedule) => {
    setEditingSchedule({ ...schedule });
    setIsModalOpen(true);
  };

  const handleUpdate = async () => {
    try {
      const response = await fetch(`/api/employee-schedule/${editingSchedule.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingSchedule),
      });

      if (response.ok) {
        fetchSchedules(branchId);
        setIsModalOpen(false);
        setEditingSchedule(null);
      }
    } catch (err) {
      console.error("Update error:", err);
    }
  };

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Weekly Employee Schedule</h1>
          <div className="icon-1">
            <Bell className="icon" />
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="user-management-wrapper">
          <div className="header-container">
            <h2>Employee Weekly Availability</h2>

            <label>Filter by Branch:</label>
            <select
              value={branchId}
              onChange={(e) => {
                const selectedId = e.target.value;
                setBranchId(selectedId);
                fetchSchedules(selectedId);
              }}
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
          </div>

          <div className="user-list-container">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Employee Name</th>
                  <th>Branch</th>
                  <th>Day</th>
                  <th>Start Time</th>
                  <th>End Time</th>
                  <th>Availability</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map((schedule, index) => (
                  <tr key={schedule.id}>
                    <td>{index + 1}</td>
                    <td>{schedule.first_name} {schedule.last_name}</td>
                    <td>{schedule.branch_name}</td>
                    <td>{dayNames[schedule.day_of_week]}</td>
                    <td>{schedule.start_time}</td>
                    <td>{schedule.end_time}</td>
                    <td>
                      <span className={`status-badge ${schedule.is_available ? "confirmed" : "cancelled"}`}>
                        {schedule.is_available ? "Available" : "Unavailable"}
                      </span>
                    </td>
                    <td>
                      <button className="edit-btn" onClick={() => handleEdit(schedule)}>
                        <FaEdit />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isModalOpen && editingSchedule && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Edit Schedule</h2>
                <button className="close-btn" onClick={() => setIsModalOpen(false)}>
                  <FaTimes />
                </button>
              </div>
              <div className="modal-body">
                <label>Day of Week</label>
                <select
                  value={editingSchedule.day_of_week}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, day_of_week: parseInt(e.target.value) })
                  }
                >
                  {dayNames.map((day, index) => (
                    <option key={index} value={index}>{day}</option>
                  ))}
                </select>

                <label>Start Time</label>
                <input
                  type="time"
                  value={editingSchedule.start_time}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, start_time: e.target.value })
                  }
                />

                <label>End Time</label>
                <input
                  type="time"
                  value={editingSchedule.end_time}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, end_time: e.target.value })
                  }
                />

                <label>Availability</label>
                <select
                  value={editingSchedule.is_available}
                  onChange={(e) =>
                    setEditingSchedule({ ...editingSchedule, is_available: e.target.value === "true" })
                  }
                >
                  <option value="true">Available</option>
                  <option value="false">Unavailable</option>
                </select>

                <button onClick={handleUpdate}>
                  <FaSave /> Update
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeSchedule;