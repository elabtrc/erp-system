import { useState, useEffect } from 'react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Styles.css';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('salonUser') || '{}'));
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    email: user.email || '',
    phone: user.phone || '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('salonToken');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleLogout = () => {
    localStorage.removeItem('salonToken');
    localStorage.removeItem('salonUser');
    navigate('/login');
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.put(`/api/customers/${user.customer_id}`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('salonToken')}`
        }
      });
      
      localStorage.setItem('salonUser', JSON.stringify(response.data));
      setUser(response.data);
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>My Profile</h2>
        
        {error && <div className="auth-error">{error}</div>}

        {editMode ? (
          <form onSubmit={handleUpdate}>
            <div className="form-group">
              <label htmlFor="first_name">First Name</label>
              <input
                type="text"
                id="first_name"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last Name</label>
              <input
                type="text"
                id="last_name"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>

            <div className="profile-actions">
              <button type="submit" className="auth-button">
                Save Changes
              </button>
              <button 
                type="button" 
                className="logout-button"
                onClick={() => setEditMode(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <div className="profile-info">
              <p><strong>Name:</strong> {user.first_name} {user.last_name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Phone:</strong> {user.phone || 'Not provided'}</p>
              <p><strong>Member Since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
            </div>

            <div className="profile-actions">
              <button 
                className="auth-button" 
                onClick={() => navigate('/booking')}
              >
                Book an Appointment
              </button>
              <button 
  className="auth-button" 
  onClick={() => navigate('/my-appointments')}
>
  View My Appointments
</button>

              <button 
                className="auth-button secondary"
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
              <button 
                className="logout-button" 
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;