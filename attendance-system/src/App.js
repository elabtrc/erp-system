import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import FaceVerification from "./components/Verification";
import Register from "./components/Register";
import HomePage from "./components/Home";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/Register" element={<Register />} />
        <Route path="/Verification" element={<FaceVerification />} />
        <Route path="/Home" element={<HomePage />} />
      </Routes>
    </Router>
  );
};

export default App;
