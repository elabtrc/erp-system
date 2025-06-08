import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import Webcam from "react-webcam";
import "./Styles.css";

const FaceVerification = () => {
  const webcamRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
   const [showSuccess, setShowSuccess] = useState(false);
  const { employeeId, pin, firstName: navFirstName } = location.state || {};
  const firstName = navFirstName || localStorage.getItem("firstName");
  const successSound = new Audio("/sounds/success.mp3");
  const failureSound = new Audio("/sounds/failure.mp3");

  useEffect(() => {
    document.title = "Face Verification | F.A. 101 Salon and Spa";
  }, []);

  const captureAndVerify = async () => {
    if (!webcamRef.current) return;
    const imageData = webcamRef.current.getScreenshot();

    if (!imageData) {
      setError("Failed to capture image.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const response = await axios.post("http://localhost:5000/verify-face", {
        employeeId,
        pin,
        imageData,
      });
    
      if (response.data.success) {
        successSound.play(); // ✅ play success sound
        localStorage.setItem("firstName", firstName);
        setSuccess(true);
    
        setTimeout(() => {
          navigate("/home", { state: { firstName, employeeId } });
        }, 1500);
      } else {
        failureSound.play(); // ❌ play failure sound
        setError(response.data.error || "Face verification failed");
      }
    } catch (err) {
      console.error("Verification error:", err);
      failureSound.play(); // ❌ play failure sound on exception too
      setError("Verification error, please try again");
    } finally {
      setVerifying(false);
    }};


  useEffect(() => {
    if (!employeeId || !pin) {
      navigate("/login");
      return;
    }

    const interval = setInterval(() => {
      if (!verifying && !success) {
        captureAndVerify();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [employeeId, pin, verifying, success, navigate]);

 return (
     <div className="app-container">
       <div className="overlay"></div>
       <div className="verification-box">
         <div className="header-row">
           <img src="/salonlogo.png" alt="Salon Logo" className="salon-logo" />
           <h1 className="attendance-h1">F.A. 101 Salon and Spa</h1>
         </div>
         <h2 className="verification-header">Face Verification</h2>
         <div className="verification-container">
           <div className="webcam-container">
             <Webcam
               ref={webcamRef}
               screenshotFormat="image/jpeg"
               width="100%"
               videoConstraints={{ facingMode: "user" }}
             />
           </div>
 
           {verifying && (
             <div className="spinner-container">
               <div className="spinner"></div>
               <p className="verifying-text">Verifying...</p>
             </div>
           )}
 
           {showSuccess && (
             <div className="success-container">
               <div className="checkmark">✔</div>
               <p className="success-text">Face Verification Successful</p>
             </div>
           )}
 
           {error && <p className="error-message">{error}</p>}
         </div>
       </div>
     </div>
   );
 };

export default FaceVerification;
