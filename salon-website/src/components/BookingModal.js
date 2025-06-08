import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import api from '../utils/api'; // ✅ default export
import {
  fetchServices,
  fetchEmployeesByService,
  getAvailableSlots,
  createAppointment
} from '../utils/api'; // ✅ named exports

import './BookingModal.css';
import StripePaymentForm from './StripePaymentForm';


const BookingModal = ({ branch, date, onClose, onSubmit }) => {

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('salonUser'));
    if (storedUser) {
      setFormData(prev => ({
        ...prev,
        customerId: storedUser.customer_id || null,
        firstName: storedUser.first_name || '',
        lastName: storedUser.last_name || '',
        phone: storedUser.phone || '',
        email: storedUser.email || ''
      }));
    }
  }, []);
  
  const [formData, setFormData] = useState({
    customerId: null,
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    employee: '',
    selectedServices: [],
    timeSlot: '',
    notes: ''
  });
  
  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState({
    services: false,
    employees: false,
    slots: false,
    submitting: false
  });
  const [error, setError] = useState(null);
  const [pendingAppointment, setPendingAppointment] = useState(null);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Calculate total price and duration
  const { totalPrice, totalDuration } = useMemo(() => {
    return formData.selectedServices.reduce((acc, serviceId) => {
      const service = services.find(s => s.service_id === serviceId);
      if (service) {
        acc.totalPrice += Number(service.price || 0);
        acc.totalDuration += Number(service.duration || 0);
      }
      return acc;
    }, { totalPrice: 0, totalDuration: 0 });
  }, [formData.selectedServices, services]);
  

  const downpaymentAmount = totalPrice * 0.5;

  // Load services available for the selected day
  useEffect(() => {
    const loadServices = async () => {
      setLoading(prev => ({ ...prev, services: true }));
      setError(null);
      try {
        const data = await fetchServices(date, branch.id);
        setServices(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(prev => ({ ...prev, services: false }));
      }
    };
    loadServices();
  }, [date, branch.id]);

  // Load employees when services are selected
  useEffect(() => {
    if (formData.selectedServices.length > 0 && branch?.id) {
      const loadEmployees = async () => {
        setLoading(prev => ({ ...prev, employees: true }));
        setError(null);
        try {
          // Get employees available for all selected services
          const employeesData = await Promise.all(
            formData.selectedServices.map(serviceId => 
              fetchEmployeesByService(serviceId, branch.id, date)
            )
          );
          
          // Find intersection of employees available for all services
          const commonEmployees = employeesData.reduce((acc, current) => {
            return acc.filter(employee => 
              current.some(e => e.employee_id === employee.employee_id)
            );
          }, employeesData[0] || []);
          
          setEmployees(commonEmployees);
          setFormData(prev => ({ ...prev, employee: '', timeSlot: '' }));
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(prev => ({ ...prev, employees: false }));
        }
      };
      loadEmployees();
    } else {
      setEmployees([]);
    }
  }, [formData.selectedServices, branch?.id, date]);

  // Load time slots when employee changes
  useEffect(() => {
    if (formData.employee && formData.selectedServices.length > 0) {
      const loadTimeSlots = async () => {
        setLoading(prev => ({ ...prev, slots: true }));
        setError(null);
        try {
          const data = await getAvailableSlots(
            formData.employee,
            date,
            formData.selectedServices,
            totalDuration
          );
          setTimeSlots(data);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(prev => ({ ...prev, slots: false }));
        }
      };
      loadTimeSlots();
    } else {
      setTimeSlots([]);
    }
  }, [formData.employee, formData.selectedServices, date, totalDuration]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleServiceToggle = (serviceId) => {
    setFormData(prev => {
      const newSelected = prev.selectedServices.includes(serviceId)
        ? prev.selectedServices.filter(id => id !== serviceId)
        : [...prev.selectedServices, serviceId];
      return { ...prev, selectedServices: newSelected };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const appointmentDate = new Date(formData.timeSlot);
  
    console.log("📦 Payload being submitted:", {
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      email: formData.email,
      employee: Number(formData.employee),
      services: formData.selectedServices,
      appointmentDate,
      branchId: Number(branch?.id),
      notes: formData.notes,
      downpayment: downpaymentAmount,
      duration: totalDuration
    });
  
    setLoading(prev => ({ ...prev, submitting: true }));
    setError(null);
  
    try {
      if (
        !formData.firstName || !formData.lastName || !formData.phone ||
        formData.selectedServices.length === 0 || !formData.employee || !formData.timeSlot ||
        !branch?.id
      ) {
        throw new Error('Please fill in all required fields');
      }
    
      if (!acceptedTerms) {
        throw new Error('You must accept the terms and conditions');
      }
    
      const appointment = await api.post('/appointments', {
        customerId: formData.customerId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        email: formData.email,
        employee: Number(formData.employee),
        services: formData.selectedServices,
        appointmentDate,
        branchId: Number(branch?.id),
        notes: formData.notes,
        downpayment: downpaymentAmount,
        duration: totalDuration
      });
    
      toast.success('Appointment created! Proceeding to payment.');
    
      setPendingAppointment({
        id: appointment.appointment_id,
        amount: downpaymentAmount
      });
    } catch (err) {
      toast.error(err.message || 'Failed to create appointment');
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }    
  };
  

  return (
    <div className="modal-overlay">
      <div className="booking-modal">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Book Appointment at {branch?.name || '...'}</h2>

        <div className="modal-branch-info">
          <p>Date: {format(date, 'MMMM do, yyyy')}</p>
          <p>Location: {branch?.location || 'Loading location...'}</p>
        </div>

        {error && <div className="error-message">{error}</div>}

        {!pendingAppointment ? (
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>First Name*</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Last Name*</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone*</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  disabled
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                />
              </div>
            </div>

            <div className="form-group">
              <label>Services*</label>
              {loading.services ? (
                <div className="loading-placeholder">Loading services...</div>
              ) : (
                <div className="service-selection">
                  {services.map(service => (
                    <div key={service.service_id} className="service-option">
                      <input
                        type="checkbox"
                        id={`service-${service.service_id}`}
                        checked={formData.selectedServices.includes(service.service_id)}
                        onChange={() => handleServiceToggle(service.service_id)}
                        disabled={loading.services || loading.submitting}
                      />
                      <label htmlFor={`service-${service.service_id}`}>
                        {service.service_name} ({service.duration} mins) - ₱{Number(service.price).toFixed(2)}
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {formData.selectedServices.length > 0 && (
              <>
                <div className="price-summary">
                  <p>Total Duration: {totalDuration} minutes</p>
                  <p>Total Price: ₱{Number(totalPrice).toFixed(2)}</p>
                  <p>Required Downpayment (50%): ₱{Number(downpaymentAmount).toFixed(2)}</p>
                </div>

                <div className="form-group">
                  <label>Service Provider*</label>
                  {loading.employees ? (
                    <div className="loading-placeholder">Loading providers...</div>
                  ) : (
                    <select
                      name="employee"
                      value={formData.employee}
                      onChange={handleChange}
                      required
                      disabled={loading.employees || loading.submitting}
                    >
                      <option value="">Select Provider</option>
                      {employees.map(employee => (
                        <option key={employee.employee_id} value={employee.employee_id}>
                          {employee.first_name} {employee.last_name}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                {formData.employee && (
                  <div className="form-group">
                    <label>Time Slot*</label>
                    {loading.slots ? (
                      <div className="loading-placeholder">Checking availability...</div>
                    ) : (
                      <select
                        name="timeSlot"
                        value={formData.timeSlot}
                        onChange={handleChange}
                        required
                        disabled={loading.slots || loading.submitting}
                      >
                        <option value="">Select Time</option>
                        {timeSlots.map(slot => (
                          <option key={slot.start} value={slot.start}>
                            {slot.display}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="form-group">
              <label>Additional Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                disabled={loading.submitting}
              />
            </div>

            <div className="terms-conditions">
              <input
                type="checkbox"
                id="accept-terms"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
                required
              />
              <label htmlFor="accept-terms">
                I agree to the Terms & Conditions (50% non-refundable downpayment is required to secure booking).
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="cancel-btn"
                onClick={onClose}
                disabled={loading.submitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="submit-btn"
                disabled={loading.submitting || !acceptedTerms}
              >
                {loading.submitting ? 'Booking...' : 'Proceed to Payment'}
              </button>
            </div>
          </form>
        ) : (
          <div className="payment-section">
            <h3>Payment Details</h3>
            <p>Total Amount Due: ₱{Number(totalPrice).toFixed(2)}</p>
            <p>Downpayment Required (50%): ₱{Number(downpaymentAmount).toFixed(2)}</p>
            
            <StripePaymentForm
              amount={pendingAppointment.amount}
              appointmentId={pendingAppointment.id}
              onSuccess={() => {
                onSubmit({
                  ...formData,
                  totalPrice,
                  downpayment: downpaymentAmount,
                  services: formData.selectedServices.map(id => 
                    services.find(s => s.service_id === id)
                  )
                });
                onClose();
                setPendingAppointment(null);
              }}
              onCancel={() => setPendingAppointment(null)}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;