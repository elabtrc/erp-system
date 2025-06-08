import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import "./Styles.css";

const BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:5000';

const HomePage = () => {
  const [employeeId, setEmployeeId] = useState(null);
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { firstName: navFirstName } = location.state || {};
  const [firstName, setFirstName] = useState(navFirstName || localStorage.getItem("firstName") || "");

  useEffect(() => {
    document.title = "Attendance | F.A. 101 Salon and Spa";
  }, []);

  // On mount: fetch employeeId and clock status
  useEffect(() => {
    const storedEmployeeId = localStorage.getItem('employeeId');
    if (!storedEmployeeId) {
      // If no employee ID found, redirect immediately to the login page
      navigate('/login');
      return; // Prevent further rendering of the component
    } else {
      setEmployeeId(storedEmployeeId);
      axios.post(`${BASE_URL}/api/getClockStatus`, { employeeId: storedEmployeeId })
        .then((response) => {
          console.log("Clock status response:", response.data);
          setIsClockedIn(response.data.isClockedIn);
        })
        .catch((err) => {
          console.error('Error fetching clock-in status:', err);
          setMessage('Failed to fetch clock status.');
        });
    }
  
    const storedFirstName = localStorage.getItem('firstName');
    if (storedFirstName) {
      setFirstName(storedFirstName);
    }
  }, [navigate]);  

  useEffect(() => {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else if (countdown === 0 && message.toLowerCase().includes('successfully')) {
        navigate('/');
      }
    }, [countdown, message, navigate]);

    const handleClockAction = (action) => {
      if (!employeeId) {
        setMessage('Employee ID is required.');
        return;
      }
    
      setMessage(`Processing ${action === 'timeIn' ? 'Time In' : 'Time Out'}...`);
      setIsSubmitting(true);
    
      const endpoint = action === 'timeIn' ? 'timein' : 'timeout';
    
      axios.post(`${BASE_URL}/api/${endpoint}`, { employeeId })
        .then((response) => {
          console.log(`${endpoint} response:`, response.data);
          setMessage(response.data.message || "Action complete.");
          if (response.data.success) {
            setIsClockedIn(action === 'timeIn');
            setCountdown(5);
          }
        })
        .catch((err) => {
          console.error('Axios error:', err);
          const errorMsg = err.response?.data?.message || err.message || "Unknown error occurred";
          setMessage(errorMsg);
    
          // Sync clock status based on known messages
          if (errorMsg.toLowerCase().includes("already clocked in")) {
            setIsClockedIn(true);
          } else if (errorMsg.toLowerCase().includes("already clocked out")) {
            setIsClockedIn(false);
          }
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    };
    
      
  
  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-container">
      <div className="overlay"></div>
      <div className="attendance-container">
        <h1>Welcome, {firstName}</h1>
        <h3>{isClockedIn ? "You're currently clocked in" : "You're currently clocked out"}</h3>

        <div className="status-indicator">
          <div className={`status-dot ${isClockedIn ? 'clocked-in' : 'clocked-out'}`}></div>
          <span>{isClockedIn ? 'Active' : 'Inactive'}</span>
        </div>

        {/* Time in button */}
        <button
          className="action-button"
          onClick={() => !isClockedIn && handleClockAction('timeIn')}
          disabled={isClockedIn || isSubmitting}
        >
        <span>Time In</span>
        </button>

        {/* Time out button */}
        <button
          className="action-button"
          onClick={() => isClockedIn && handleClockAction('timeOut')}
          disabled={!isClockedIn || isSubmitting}
        >
        <span>Time Out</span>
        </button>

        {message && (
          <div className={`message ${isSubmitting ? 'info' : 'success'}`}>
            {message}
          </div>
        )}

        {countdown > 0 && (
          <div className="redirect-info">
            Redirecting in <strong>{countdown}</strong> seconds...
            <div className="progress-bar" style={{ width: `${countdown * 20}%` }}></div>
          </div>
        )}

      <div className="current-time live-clock">
      {currentTime}
      </div>

      </div>

      <div className="logout-top-right">
      <button onClick={() => {
        localStorage.clear();
        navigate("/login");
      }}>
        Logout
      </button>
    </div>

      </div>
  );
};

export default HomePage;