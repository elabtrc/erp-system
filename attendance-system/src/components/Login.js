import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom";
import "./Styles.css";

const Login = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const { firstName: navFirstName } = location.state || {};
  const firstName = navFirstName || localStorage.getItem("firstName");

  useEffect(() => {
    document.title = "Login | F.A. 101 Salon and Spa";
  }, []);

  const handleChange = (index, value) => {
    if (value.length > 1) return;
    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`).focus();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    const fullPin = pin.join("");
    if (!employeeId || employeeId.length === 0) {
      setError("Employee ID is required.");
      return;
    }

    if (fullPin.length !== 4 || pin.includes("")) {
      setError("PIN must be 4 digits.");
      return;
    }

    try {
      const loginResponse = await axios.post("http://localhost:5000/login", {
        employeeId,
        pin: fullPin,
      });

      if (loginResponse.data.success) {
        const { firstName } = loginResponse.data;

        localStorage.setItem("employeeId", employeeId);
        localStorage.setItem("firstName", firstName);

        navigate("/Verification", { state: { firstName, employeeId, pin: fullPin } });
      } else {
        setError("Login failed. Invalid Employee ID or PIN.");
      }
    } catch (err) {
      setError("Error logging in: " + (err.response?.data?.error || "Server error"));
    }
  };

  return (
    <div className="app-container">
      <div className="header-row">
          <img src="/salonlogo.png" alt="Salon Logo" className="salon-logo" />
          <h1 className="attendance-h1">F.A. 101 Salon and Spa</h1>
        </div>
      <div className="pin-box">
        <div className="pin-container">
          <div className="user-icon-container">
            <svg
              className="user-icon"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M12 2a5 5 0 100 10 5 5 0 000-10zm-7 17a7 7 0 0114 0v1H5v-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <form onSubmit={handleLogin}>
            <h1 className="login-now">Login Now</h1>
            <div className="label-input-container">
              <label htmlFor="employeeId">Employee ID:</label>
            </div>
            <input
              type="text"
              id="employeeId"
              value={employeeId}
              onChange={(e) => {
                setEmployeeId(e.target.value);
                setError("");
              }}
              className="employee-number-input"
              required
            />
            <div className="label-input-container">
              <label>PIN:</label>
            </div>
            <div className="pin-input-group">
              {pin.map((digit, index) => (
                <input
                  key={index}
                  id={`pin-${index}`}
                  type="password"
                  value={digit}
                  maxLength="1"
                  onChange={(e) => {
                    handleChange(index, e.target.value);
                    setError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace") {
                      if (pin[index]) {
                        const newPin = [...pin];
                        newPin[index] = "";
                        setPin(newPin);
                      } else if (index > 0) {
                        const newPin = [...pin];
                        newPin[index - 1] = "";
                        setPin(newPin);
                        document.getElementById(`pin-${index - 1}`).focus();
                      }
                    }
                  }}
                  className="pin-box-input"
                  required
                />
              ))}
            </div>
            <button type="submit" className="pin-button">LOGIN</button>
          </form>

          {error && <p className="error-message">{error}</p>}

          <button
            type="button"
            className="register-link"
            onClick={() => navigate("/register")}
          >
            Register Account
          </button>
        </div>
      </div>
    </div>
  );
};


export default Login;
