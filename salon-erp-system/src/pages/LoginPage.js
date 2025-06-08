import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const LoginPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { login } = useAuth();

  const images = [
    "/login-page1.png",
    "/login-page2.png",
    "/login-page3.png",
    "/login-page4.png",
    "/login-page5.png",
    "/login-page6.png",
  ];

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const result = await login(username, password);
      if (!result.success) {
        setError(result.error || "Login failed. Please try again.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-left">
          <div className="login-header">
            <img src="/LoginLogo.jpg" alt="Logo" className="login-logo" />
            <h2>Login</h2>
          </div>
          {error && <div className="login-error">{error}</div>}
          <form onSubmit={handleLogin}>
            <label>Username</label>
            <input
              type="text"
              className="login-input"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <label>Password</label>
            <input
              type="password"
              className="login-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="login-button">LOGIN</button>
          </form>
        </div>

        <div className="login-right">
          <h1>Welcome!</h1>
          <p>F.A. 101 Salon and Spa Management System</p>

          <div className="login-slider">
            <button className="slide-btn left" onClick={handlePrev} disabled={currentIndex === 0}>
              ◀
            </button>
            <div className="login-photos">
              <div className="image-track" style={{ transform: `translateX(-${currentIndex * 100}%)` }}>
                {images.map((src, index) => (
                  <img key={index} src={src} alt="Slide" className="login-image" />
                ))}
              </div>
            </div>
            <button className="slide-btn right" onClick={handleNext} disabled={currentIndex === images.length - 1}>
              ▶
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
