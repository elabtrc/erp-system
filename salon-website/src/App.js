import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/index";
import BookingPage from "./components/Booking"; // your actual booking component
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import LoginPage from "./components/LoginPage";
import ProfilePage from "./components/ProfilePage";
import MyAppointmentsPage from "./components/MyAppointmentsPage";

const stripePromise = loadStripe('pk_test_51RJZk7BUX1YRSZL7n8RFu9LCOmdyfuS7RyYX7VFc9JHQjUxVWAZMeBbwzWA3v8XNDVnXjrnHmnUSoitKwDSWt8DJ00NTUl4FT1'); 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/booking"element={<Elements stripe={stripePromise}>
            <BookingPage /> {/* ✅ this is your actual booking page */}
            </Elements>
          }
        />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/my-appointments" element={<MyAppointmentsPage />} />

      </Routes>
    </Router>
  );
}

export default App;
