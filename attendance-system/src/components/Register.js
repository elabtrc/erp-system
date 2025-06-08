import React, { useState, useRef, useEffect} from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Styles.css";

const Register = () => {
  const [employeeId, setEmployeeId] = useState("");
  const [pin, setPin] = useState(["", "", "", ""]);
  const [step, setStep] = useState(1);
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [employeeIdError, setEmployeeIdError] = useState("");

  const webcamRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Register | F.A. 101 Salon and Spa";
  }, []);

  const captureImage = () => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImage(imageSrc);
    setStep(2);
  };

  const handlePinChange = (index, value) => {
    if (value.length > 1) return;

    const newPin = [...pin];
    newPin[index] = value;
    setPin(newPin);

    if (value && index < 3) {
      document.getElementById(`pin-${index + 1}`).focus();
    } else if (!value && index > 0) {
      document.getElementById(`pin-${index - 1}`).focus();
    }
  };

  const handleStep1Submit = async (e) => {
    e.preventDefault();
    setError("");

    if (employeeId.trim() === "") {
      setEmployeeIdError("Employee ID cannot be empty");
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/check-credentials", {
        userId: employeeId.trim(),
      });

      setStep(1.5);
    } catch (err) {
      setError(err.response?.data?.error || "An error occurred.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const blob = await fetch(image).then((res) => res.blob());

      const formData = new FormData();
      formData.append("userId", employeeId);
      formData.append("pin", pin.join(""));
      formData.append("faceImage", blob, `${employeeId}.jpg`);

      const response = await axios.post("http://localhost:5000/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Registration successful!");
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

 return (
     <div className="app-container">
       <div className="header-row">
           <img src="/salonlogo.png" alt="Salon Logo" className="salon-logo" />
           <h1 className="attendance-h1">F.A. 101 Salon and Spa</h1>
         </div>
       <div className="register-box">
         {step === 1 ? (
           <div className="register-container">
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
             <h2 className="pin-header">Register Now</h2>
             <form onSubmit={handleStep1Submit}>
             <div className="label-input-container">
               <label htmlFor="employeeId">Employee ID:</label>
             </div>
                 <input
                   className="employee-number-input"
                   type="text"
                   value={employeeId}
                   onChange={(e) => {
                     setEmployeeId(e.target.value);
                     if (e.target.value.trim() === "") {
                       setEmployeeIdError("Employee ID cannot be empty");
                     } else {
                       setEmployeeIdError("");
                     }
                   }}
                   onBlur={() => {
                     if (employeeId.trim() === "") {
                       setEmployeeIdError("Employee ID is required");
                     }
                   }}
                   required
                 />
                 {employeeIdError && <p className="registererror-message">{employeeIdError}</p>}
 
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
                     onChange={(e) => handlePinChange(index, e.target.value)}
                     className="pin-box-input"
                     required
                   />
                 ))}
               </div>
 
               {error && <p className="registererror-message">{error}</p>}
               <button type="submit" className="registerpin-button">REGISTER</button>
             </form>
             <button
               type="button"
               className="register-link"
               onClick={() => navigate("/login")}
             >
               I already have an account
             </button>
           </div>
         ) : step === 1.5 ? (
           <div className="verification-wrapper">
             <h3 className="verification-header">Capture Face Image</h3>
             <div className="verification-container">
               <div className="webcam-container">
                 <Webcam
                   audio={false}
                   ref={webcamRef}
                   screenshotFormat="image/jpeg"
                   videoConstraints={{ facingMode: "user" }}
                   onUserMediaError={() => setError("Webcam access denied or not available.")}
                 />
               </div>
               <button onClick={captureImage} className="capture-button" disabled={loading}>
                 Capture
               </button>
               <button onClick={() => setStep(1)} className="capture-button" disabled={loading}>
                 Back
               </button>
             </div>
           </div>
         ) : (
           <div className="verification-wrapper">
             <h3 className="review-header">Review Information</h3>
             <div className="verification-container">
               <p><strong>Employee ID:</strong> {employeeId}</p>
               <div className="webcam-container-2">
                 <img src={image} alt="Captured face" />
               </div>
               <form onSubmit={handleSubmit}>
                 <button type="submit" disabled={loading} className="review-button">
                   {loading ? "Registering..." : "Complete Registration"}
                 </button>
                 <button type="button" onClick={() => setStep(1.5)} className="review-button">Retake Photo</button>
               </form>
               {error && <p className="registererror-message">{error}</p>}
             </div>
           </div>
         )}
       </div>
     </div>
   );
 };
 

export default Register;
