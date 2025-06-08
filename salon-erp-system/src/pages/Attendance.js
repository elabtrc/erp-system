import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import "./settings/users.css";
// import { Bell } from "lucide-react";

const AttendancePage = () => {
  const userName = "John Doe"; // You can make this dynamic later
  const [currentTime, setCurrentTime] = useState(new Date());
  const [status, setStatus] = useState("Not Yet Timed In");
  const [timeIn, setTimeIn] = useState(null);
  const [timeOut, setTimeOut] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTimeIn = () => {
    const now = new Date();
    setTimeIn(now);
    setStatus(`Timed In at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  const handleTimeOut = () => {
    const now = new Date();
    setTimeOut(now);
    setStatus(`Timed Out at ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);
  };

  return (
    <div className="users-container">
      <Sidebar />
      <div className="users-content">
        <div className="users-header">
          <h1>Employee Attendance</h1>
          <div className="icon-1">
            {/* <Bell className="icon" /> */}
            <div className="user-avatar"></div>
          </div>
        </div>

        <div className="attendance-wrapper">
          <h2>Welcome, {userName}</h2>
          <p className="current-time">🕒 Current Time: {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

          <div className="attendance-actions">
            <button 
              className="modal-button primary" 
              onClick={handleTimeIn} 
              disabled={!!timeIn && !timeOut}
            >
              ✅ TIME IN
            </button>
            <button 
              className="modal-button danger" 
              onClick={handleTimeOut} 
              disabled={!timeIn || !!timeOut}
            >
              🛑 TIME OUT
            </button>
          </div>

          <hr />

          <div className="attendance-status">
            <h3>Today's Status: {status}</h3>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendancePage;