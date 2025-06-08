import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Styles.css';

const MyAppointmentsPage = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const user = JSON.parse(localStorage.getItem('salonUser') || '{}');

  useEffect(() => {
    const token = localStorage.getItem('salonToken');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchAppointments = async () => {
        try {
          const response = await axios.get(`/api/customers/${user.customer_id}/appointments`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          console.log('Fetched:', response.data); // 👈 Add this
          setAppointments(response.data);
        } catch (err) {
          console.error('Fetch error:', err.response?.data || err.message); // 👈 More specific
          setError('Failed to fetch appointments');
        } finally {
          setLoading(false);
        }
      };    
      

    if (user.customer_id) {
      fetchAppointments();
    } else {
      setError('Missing customer ID');
      setLoading(false);
    }
  }, [navigate, user.customer_id]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>My Appointments</h2>
        {loading && <p>Loading...</p>}
        {error && <div className="auth-error">{error}</div>}

        {!loading && appointments.length === 0 && <p>No appointments found.</p>}

        <ul className="appointment-list">
          {appointments.map((appt) => (
            <li key={appt.appointment_id} className="appointment-item">
              <p><strong>Date:</strong> 
                {appt.date 
                    ? new Date(appt.date).toLocaleString() 
                    : 'No Date'}
                </p>
              <p><strong>Service:</strong> {appt.service_name}</p>
              <p><strong>Staff:</strong> {appt.staff_name || 'Not Assigned'}</p>
              <p><strong>Status:</strong> {appt.status}</p>
            </li>
          ))}
        </ul>

        <div className="profile-actions">
          <button className="auth-button" onClick={() => navigate('/')}>Back to Profile</button>
        </div>
      </div>
    </div>
  );
};

export default MyAppointmentsPage;
