import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import { FaPlus, FaEdit, FaTrash, FaCheck, FaTimes, FaSync, FaChevronLeft, FaChevronRight, FaChevronDown } from 'react-icons/fa';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './Appointment.css';
import Sidebar from '../../pages/Sidebar';
import { appointmentApi, serviceApi, employeeApi, branchApi } from '../../utils/api';
import { useAuth } from "../../context/AuthContext";
import { Archive } from 'lucide-react';
import { toast } from 'react-toastify';

const localizer = momentLocalizer(moment);

const AppointmentScheduler = () => {
  // State management
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [formData, setFormData] = useState({
    customer_first_name: '',
    customer_last_name: '',
    customer_phone: '',
    customer_email: '',
    service_id: '',
    employee_id: '',
    appointment_date: '',
    notes: '',
    branch_id: '',
    status: 'Booked'
  });

  const [services, setServices] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [branches, setBranches] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [currentView, setCurrentView] = useState(Views.WEEK);
  const appointmentsPerPage = 10;
  const [selectedBranch, setSelectedBranch] = useState('');

  const userRole = user?.role || '';
  const userBranchId = user?.branchId ? parseInt(user.branchId) : null;
  const isAdmin = userRole.toLowerCase() === 'admin';
  const isBranchManager = userRole.toLowerCase() === 'branch manager';
  const isAccountant = userRole.toLowerCase() === 'accountant';
  

  // Process appointment times with null checks
  const processAppointmentTime = useCallback((appointment) => {
    if (!appointment) return null;
  
    let start;
    try {
      start = new Date(appointment.appointment_date);
      if (isNaN(start.getTime())) return null;
    } catch (e) {
      console.error('Invalid date format:', appointment.appointment_date);
      return null;
    }
  
    const localStart = new Date(start.getTime() - (start.getTimezoneOffset() * 60000));
    
    // Enforce business hours (9am-7pm)
    const hours = localStart.getHours();
    if (hours < 9) {
      localStart.setHours(9, 0, 0, 0);
    } else if (hours >= 19) {
      localStart.setHours(18, 30, 0, 0);
    }
    
    const end = new Date(localStart.getTime() + (appointment.duration || 30) * 60000);
    const totalPrice = Number(appointment.price) || 0;
    const downpayment = Number(appointment.downpayment) || 0;
    const remaining = totalPrice - downpayment;

    return {
      ...appointment,
      id: appointment.appointment_id || '',
      start: localStart,
      end,
      formattedDate: moment(localStart).format('MMM D, YYYY'),
      formattedTime: `${moment(localStart).format('h:mm A')} - ${moment(end).format('h:mm A')}`,
      fullDateTime: moment(localStart).format('LLLL'),
      durationMinutes: Math.round((end - localStart) / 60000),
      employee_name: `${appointment.employee_first_name || ''} ${appointment.employee_last_name || ''}`.trim(),
      title: `${appointment.customer_first_name || ''} ${appointment.customer_last_name || ''} - ${appointment.service_name || ''}`.trim(),
      service_id: appointment.service_id || '',
      employee_id: appointment.employee_id || '',
      branch_id: appointment.branch_id || '',
      branch_name: appointment.branch_name || '',
      service_name: appointment.service_name || '',
      notes: appointment.notes || '',
      status: appointment.status || 'Booked',
      price: totalPrice,
      downpayment: downpayment,
      remaining: remaining,
    };
  }, []);

  // Fetch all appointment data with error handling
  const fetchAppointments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      let appointmentsRes;
      if (isAdmin) {
        appointmentsRes = await appointmentApi.getAll();
      } else if (userBranchId) {
        appointmentsRes = await appointmentApi.getByBranch(userBranchId);
      } else {
        appointmentsRes = { data: [] };
      }

      const [servicesRes, branchesRes] = await Promise.all([
        serviceApi.getAll(),
        branchApi.getAll()
      ]);

      const employeesRes = await employeeApi.getAll();
      
      const processedAppointments = (appointmentsRes.data || [])
        .map(processAppointmentTime)
        .filter(app => app !== null);

      setEvents(processedAppointments);
      setAppointments(processedAppointments);
      setServices(servicesRes.data || []);
      setEmployees(employeesRes.data || []);
      setBranches(branchesRes.data || []);

      if (!isAdmin && userBranchId) {
        setSelectedBranch(userBranchId.toString());
        setFormData(prev => ({ ...prev, branch_id: userBranchId.toString() }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setError(error.response?.data?.error || error.message || 'Failed to load appointments');
    } finally {
      setIsLoading(false);
    }
  }, [processAppointmentTime, isAdmin, userBranchId]);

  // Filter employees with null checks
  const filterEmployees = useCallback(async (branchId, serviceId) => {
    if (!branchId || !serviceId) {
      setFilteredEmployees([]);
      return;
    }

    setIsLoadingEmployees(true);
    try {
      const numericBranchId = Number(branchId);
      const numericServiceId = Number(serviceId);
      
      const branchEmployees = (employees || []).filter(emp => 
        emp && emp.branch_id && Number(emp.branch_id) === numericBranchId
      );
      
      const service = (services || []).find(s => 
        s && s.service_id && Number(s.service_id) === numericServiceId
      );
      
      if (!service) {
        setFilteredEmployees([]);
        return;
      }
      
      setFilteredEmployees(branchEmployees);
      
      if (formData.employee_id && !branchEmployees.some(e => 
        e && e.employee_id && Number(e.employee_id) === Number(formData.employee_id)
      )) {
        setFormData(prev => ({ ...prev, employee_id: '' }));
      }
    } catch (err) {
      console.error('Error filtering employees:', err);
      setFilteredEmployees([]);
    } finally {
      setIsLoadingEmployees(false);
    }
  }, [employees, services, formData.employee_id]);

  const handleServiceOrBranchChange = useCallback(async (name, value) => {
    const newFormData = {
      ...formData,
      [name]: value,
      ...(name === 'branch_id' ? { employee_id: '' } : {})
    };
    
    if (name === 'service_id' && value) {
      const selectedService = services.find(s => s.service_id === value);
      if (selectedService) {
        newFormData.duration = selectedService.duration;
        
        if (newFormData.appointment_date) {
          const start = new Date(newFormData.appointment_date);
          const end = new Date(start.getTime() + selectedService.duration * 60000);
          
          const endHours = end.getHours();
          if (endHours >= 19) {
            const latestStart = new Date(start);
            latestStart.setHours(18, 30 - selectedService.duration, 0, 0);
            newFormData.appointment_date = latestStart.toISOString().slice(0, 16);
          }
        }
      }
    }
    
    setFormData(newFormData);
    await filterEmployees(newFormData.branch_id, newFormData.service_id);
  }, [formData, services, filterEmployees]);

  // Check appointment availability
  const checkAvailability = useCallback((start, end, employeeId, excludeId = null) => {
    try {
      const startTime = new Date(start);
      const endTime = new Date(end);
      
      const overlapping = events.some(event => {
        if (excludeId && event.id === excludeId) return false;
        if (event.employee_id !== employeeId) return false;
        
        const eventStart = new Date(event.start);
        const eventEnd = new Date(event.end);
        
        return (
          (startTime < eventEnd && endTime > eventStart) ||
          (startTime.getTime() === eventStart.getTime())
        );
      });
      
      return !overlapping;
    } catch (err) {
      console.error('Availability check error:', err);
      return false;
    }
  }, [events]);

 const token = localStorage.getItem('token'); // ⬅️ Move this outside useEffect so it's available to all functions

// Initial data fetch
useEffect(() => {
  if (!token) {
    setError('Please login first');
  } else {
    fetchAppointments();
  }
}, [fetchAppointments]);

const handleGenerateReceipt = async () => {
  if (!selectedEvent) {
    toast.error('❌ No appointment selected');
    return;
  }

  try {
    setIsLoading(true);
    
    const response = await fetch(`/api/appointments/${selectedEvent.id}/receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        payment_method: 'cash',
        amount_tendered: selectedEvent.price || 0
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || 'Failed to generate receipt');
    }

    // Handle PDF response
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${selectedEvent.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
    
    toast.success('🧾 Receipt downloaded successfully!');
  } catch (error) {
    console.error('Receipt generation error:', error);
    toast.error(`❌ ${error.message}`);
  } finally {
    setIsLoading(false);
  }
};

  // Handle calendar slot selection with past date prevention
  const handleSelectSlot = useCallback((slotInfo) => {
    const now = new Date();
    let selectedDate = new Date(slotInfo.start);
    
    // Prevent selecting past dates
    if (selectedDate < now) {
      setError('Cannot book appointments in the past');
      return;
    }
    
    // Round to nearest 30 minutes
    const minutes = selectedDate.getMinutes();
    const roundedMinutes = Math.round(minutes / 30) * 30;
    selectedDate.setMinutes(roundedMinutes, 0, 0);
    
    // Enforce business hours (9am-7pm)
    const hours = selectedDate.getHours();
    if (hours < 9) {
      selectedDate.setHours(9, 0, 0, 0);
    } else if (hours >= 19) {
      selectedDate.setHours(18, 30, 0, 0);
    }
  
    const formattedDate = moment(selectedDate).format('YYYY-MM-DDTHH:mm');
  
    setFormData(prev => ({
      ...prev,
      appointment_date: formattedDate,
      duration: 30,
      branch_id: isAdmin ? (branches[0]?.branch_id || '') : userBranchId?.toString() || ''
    }));
    
    setShowModal(true);
    setError(null);
  }, [branches, isAdmin, userBranchId]);

  const handleSelectEvent = useCallback((event) => {
    if (!event) return;
    setSelectedEvent({
      ...event,
      customer_first_name: event.customer_first_name || '',
      customer_last_name: event.customer_last_name || '',
      customer_phone: event.customer_phone || '',
      customer_email: event.customer_email || '',
      service_id: event.service_id || '',
      employee_id: event.employee_id || '',
      branch_id: event.branch_id || '',
      notes: event.notes || '',
      status: event.status || 'Booked'
    });
  }, []);

  const handleInputChange = useCallback(async (e) => {
    const { name, value } = e.target;
    
    if (name === 'branch_id' || name === 'service_id') {
      await handleServiceOrBranchChange(name, value);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, [handleServiceOrBranchChange]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      if (!formData.service_id || !formData.employee_id || !formData.appointment_date) {
        setError('Please fill all required fields');
        return;
      }
  
      const appointmentDate = new Date(formData.appointment_date);
      if (isNaN(appointmentDate.getTime())) {
        setError('Invalid date/time format');
        return;
      }
  
      const selectedService = services.find(s => s.service_id.toString() === formData.service_id);
      if (!selectedService) {
        setError('Please select a valid service');
        return;
      }
      const duration = selectedService.duration;
  
      const hours = appointmentDate.getHours();
      const minutes = appointmentDate.getMinutes();
      if (hours < 9 || (hours >= 19 && minutes > 0)) {
        setError('Appointments must be between 9am and 7pm');
        return;
      }
  
      const endTime = new Date(appointmentDate.getTime() + duration * 60000);
      
      if (endTime.getHours() >= 19) {
        setError('This appointment would extend past business hours');
        return;
      }
  
      const isAvailable = checkAvailability(
        appointmentDate,
        endTime,
        formData.employee_id,
        selectedEvent?.id
      );
      
      if (!isAvailable) {
        setError('This time slot is already booked for the selected employee');
        return;
      }
  
      const appointmentData = {
        ...formData,
        appointment_date: appointmentDate.toISOString(),
        duration: duration
      };
  
      if (selectedEvent) {
        await appointmentApi.update(selectedEvent.id, appointmentData);
      } else {
        await appointmentApi.create(appointmentData);
      }
  
      setShowModal(false);
      await fetchAppointments();
    } catch (error) {
      console.error('Error saving appointment:', error);
      setError(error.response?.data?.error || 'Failed to save appointment');
    }
  }, [formData, selectedEvent, fetchAppointments, checkAvailability, services]);

  const handleStatusChange = useCallback(async (newStatus) => {
    if (!selectedEvent) return;
  
    try {
      setIsLoading(true);
  
      await appointmentApi.updateStatus(selectedEvent.id, newStatus);
  
      await fetchAppointments();
  
      setSelectedEvent(null);
      setError(null);
    } catch (error) {
      console.error('Status update failed:', error.response?.data || error.message);
      setError(error.response?.data?.error || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  }, [selectedEvent, fetchAppointments]);

  const handleDelete = useCallback(async () => {
    if (!selectedEvent) return;
    
    if (window.confirm('Are you sure you want to arcvhive this appointment?')) {
      try {
        await appointmentApi.delete(selectedEvent.id);
        await fetchAppointments();
        setSelectedEvent(null);
      } catch (error) {
        console.error('Error deleting appointment:', error);
        setError('Failed to delete appointment');
      }
    }
  }, [selectedEvent, fetchAppointments]);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    await fetchAppointments();
  }, [fetchAppointments]);

  // Custom toolbar component with working navigation
  const CustomToolbar = ({ localizer: _, ...props }) => {
    const { label, onNavigate, onView } = props;
    
    const navigate = (action) => {
      if (typeof onNavigate === 'function') {
        onNavigate(action);
      }
    };

    const view = (viewName) => {
      if (typeof onView === 'function') {
        onView(viewName);
      }
    };

    return (
      <div className="rbc-toolbar">
        <div className="rbc-btn-group">
          <button 
            type="button" 
            className="rbc-btn rbc-btn-primary"
            onClick={() => navigate('TODAY')}
          >
            Today
          </button>
          <button 
            type="button" 
            className="rbc-btn rbc-btn-primary"
            onClick={() => navigate('PREV')}
          >
            <FaChevronLeft />
          </button>
          <span className="rbc-toolbar-label">{label}</span>
          <button 
            type="button" 
            className="rbc-btn rbc-btn-primary"
            onClick={() => navigate('NEXT')}
          >
            <FaChevronRight />
          </button>
        </div>
        
        <div className="rbc-btn-group view-toggle-group">
          <button
            type="button"
            className={`rbc-btn ${currentView === Views.MONTH ? 'rbc-active' : ''}`}
            onClick={() => view(Views.MONTH)}
          >
            Month
          </button>
          <button
            type="button"
            className={`rbc-btn ${currentView === Views.WEEK ? 'rbc-active' : ''}`}
            onClick={() => view(Views.WEEK)}
          >
            Week
          </button>
          <button
            type="button"
            className={`rbc-btn ${currentView === Views.DAY ? 'rbc-active' : ''}`}
            onClick={() => view(Views.DAY)}
          >
            Day
          </button>
        </div>
      </div>
    );
  };

  const indexOfLastAppointment = currentPage * appointmentsPerPage;
  const indexOfFirstAppointment = indexOfLastAppointment - appointmentsPerPage;
  const filteredAppointments = selectedBranch
  ? appointments.filter(app => app.branch_id?.toString() === selectedBranch)
  : appointments;

  const currentAppointments = filteredAppointments.slice(indexOfFirstAppointment, indexOfLastAppointment);
  const totalPages = Math.ceil(filteredAppointments.length / appointmentsPerPage);

  const renderBranchSelector = () => {
    if (!isAdmin) {
      const userBranch = branches.find(b => b.branch_id === userBranchId);
      return (
        <div className="modern-branch-filter">
          <div className="filter-container">
            <label htmlFor="branchFilter">Branch:</label>
            <div className="select-wrapper">
              <input
                type="text"
                value={userBranch?.branch_name || (userBranchId ? `Branch ID: ${userBranchId}` : 'None')}
                readOnly
                className="modern-select"
              />
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="modern-branch-filter">
        <div className="filter-container">
          <label htmlFor="branchFilter">Filter by Branch:</label>
          <div className="select-wrapper">
            <select
              id="branchFilter"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="modern-select"
            >
              <option value="">All Branches</option>
              {branches.map((branch) => (
                <option key={branch.branch_id} value={branch.branch_id}>
                  {branch.branch_name}
                </option>
              ))}
            </select>
            <div className="select-arrow">
              <FaChevronDown />
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="appointment-container">
        <Sidebar />
        <div className="appointment-content loading">
          <div className="spinner"></div>
          <p>Loading appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="appointment-container">
      <Sidebar />
      <div className="appointment-content">
        <div className="appointment-header">
          <h1>Appointment Management</h1>
          <div className="header-actions">
            <button 
              className="modern-button primary"
              onClick={() => {
                setSelectedEvent(null);
                setFormData({
                  customer_first_name: '',
                  customer_last_name: '',
                  customer_phone: '',
                  customer_email: '',
                  service_id: '',
                  employee_id: '',
                  appointment_date: '',
                  duration: 30,
                  notes: '',
                  branch_id: isAdmin ? (branches[0]?.branch_id || '') : userBranchId?.toString() || '',
                  status: 'Booked'
                });
                setShowModal(true);
              }}
            >
              <FaPlus /> New Appointment
            </button>
            <button 
              className="modern-button secondary"
              onClick={refreshData}
            >
              <FaSync /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="modern-error-message">
            <div className="error-content">
              <span>{error}</span>
              <div className="error-actions">
                <button 
                  className="modern-button small"
                  onClick={() => setError(null)}
                >
                  Dismiss
                </button>
                <button 
                  className="modern-button small primary"
                  onClick={refreshData}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

        {renderBranchSelector()}

        <div className="calendar-wrapper">
          <Calendar
            localizer={localizer}
            events={filteredAppointments}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '70vh' }}
            selectable
            onSelectSlot={handleSelectSlot}
            onSelectEvent={handleSelectEvent}
            view={currentView}
            onView={setCurrentView}
            views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
            defaultView={Views.WEEK}
            min={new Date(0, 0, 0, 9, 0, 0)}
            max={new Date(0, 0, 0, 19, 0, 0)}
            step={30}
            timeslots={2}
            components={{ toolbar: CustomToolbar }}
            dayPropGetter={(date) => ({
              className: date.getHours() < 9 || date.getHours() >= 19 ? 'rbc-off-range' : ''
            })}
            eventPropGetter={(event) => {
              const isBooked = !checkAvailability(
                new Date(event.start),
                new Date(event.end),
                event.employee_id,
                event.id
              );
              
              return {
                style: {
                  backgroundColor: isBooked ? '#F44336' : 
                    event.status === 'Completed' ? '#4CAF50' :
                    event.status === 'Cancelled' ? '#9E9E9E' : '#2196F3',
                  borderRadius: '4px',
                  color: 'white',
                  padding: '2px 5px',
                  fontSize: '0.8rem',
                  opacity: isBooked ? 0.7 : 1
                }
              };
            }}
          />
        </div>

        <div className="appointments-list-container">
          <h2>Appointments List</h2>
          <div className="appointments-list-header">
            <div className="list-summary">
              Showing {indexOfFirstAppointment + 1}-{Math.min(indexOfLastAppointment, filteredAppointments.length)} of {filteredAppointments.length} appointments
            </div>
            <div className="view-controls">
              <button 
                className={`view-toggle ${currentView === Views.MONTH ? 'active' : ''}`}
                onClick={() => setCurrentView(Views.MONTH)}
              >
                Month
              </button>
              <button 
                className={`view-toggle ${currentView === Views.WEEK ? 'active' : ''}`}
                onClick={() => setCurrentView(Views.WEEK)}
              >
                Week
              </button>
              <button 
                className={`view-toggle ${currentView === Views.DAY ? 'active' : ''}`}
                onClick={() => setCurrentView(Views.DAY)}
              >
                Day
              </button>
            </div>
          </div>

          <div className="appointments-cards">
            {currentAppointments.length > 0 ? (
              currentAppointments.map(app => (
                <div 
                  key={app.id} 
                  className={`appointment-card status-${app.status.toLowerCase()}`}
                  onClick={() => setSelectedEvent(app)}
                >
                  <div className="card-header">
                    <h3>{app.customer_first_name} {app.customer_last_name}</h3>
                    <span className={`status-badge ${app.status.toLowerCase()}`}>
                      {app.status}
                    </span>
                  </div>
                  <div className="card-body">
                    <div className="appointment-detail">
                      <span className="detail-label">Service:</span>
                      <span>{app.service_name}</span>
                    </div>
                    <div className="appointment-detail">
                      <span className="detail-label">With:</span>
                      <span>{app.employee_name}</span>
                    </div>
                    <div className="appointment-detail">
                      <span className="detail-label">Branch:</span>
                      <span>{app.branch_name}</span>
                    </div>
                    <div className="appointment-detail">
                      <span className="detail-label">Date:</span>
                      <span>{app.formattedDate}</span>
                    </div>
                    <div className="appointment-detail">
                      <span className="detail-label">Time:</span>
                      <span>{app.formattedTime}</span>
                    </div>
                  </div>
                  <div className="card-footer">
                    <button 
                      className="view-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent(app);
                      }}
                    >
                      <FaEdit /> Details
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-appointments">
                No appointments found
              </div>
            )}
          </div>

          {filteredAppointments.length > appointmentsPerPage && (
            <div className="pagination-controls">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                onClick={() => setCurrentPage(prev => 
                  filteredAppointments.length > indexOfLastAppointment ? prev + 1 : prev
                )}
                disabled={filteredAppointments.length <= indexOfLastAppointment}
              >
                Next
              </button>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <button 
                className="close-button" 
                onClick={() => setShowModal(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2>{selectedEvent ? 'Edit Appointment' : 'Create Appointment'}</h2>
              
              <form onSubmit={handleSubmit}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customer_first_name">First Name *</label>
                    <input
                      id="customer_first_name"
                      type="text"
                      name="customer_first_name"
                      value={formData.customer_first_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="customer_last_name">Last Name *</label>
                    <input
                      id="customer_last_name"
                      type="text"
                      name="customer_last_name"
                      value={formData.customer_last_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="customer_phone">Phone *</label>
                    <input
                      id="customer_phone"
                      type="tel"
                      name="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="customer_email">Email</label>
                    <input
                      id="customer_email"
                      type="email"
                      name="customer_email"
                      value={formData.customer_email}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="branch_id">Branch *</label>
                    <select
                      id="branch_id"
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleInputChange}
                      required
                      disabled={!isAdmin}
                    >
                      {isAdmin ? (
                        <>
                          <option value="">Select Branch</option>
                          {branches.map(branch => (
                            <option key={branch.branch_id} value={branch.branch_id}>
                              {branch.branch_name}
                            </option>
                          ))}
                        </>
                      ) : (
                        <option value={user?.branchId}>
                          {branches.find(b => b.branch_id === user?.branchId)?.branch_name || 'Your Branch'}
                        </option>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="service_id">Service *</label>
                    <select
                      id="service_id"
                      name="service_id"
                      value={formData.service_id}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select Service</option>
                      {services.map(service => (
                        <option key={service.service_id} value={service.service_id}>
                          {service.service_name} ({service.duration} mins)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="employee_id">Employee *</label>
                    <select
                      id="employee_id"
                      name="employee_id"
                      value={formData.employee_id}
                      onChange={handleInputChange}
                      required
                      disabled={!formData.branch_id || isLoadingEmployees}
                    >
                      {isLoadingEmployees ? (
                        <option value="">Loading employees...</option>
                      ) : (
                        <>
                          <option value="">
                            {filteredEmployees.length ? 'Select Employee' : 
                             formData.branch_id ? 'No employees in this branch' : 'Select branch first'}
                          </option>
                          {filteredEmployees.map(employee => (
                            <option key={employee.employee_id} value={employee.employee_id}>
                              {employee.first_name} {employee.last_name}
                            </option>
                          ))}
                        </>
                      )}
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                    >
                      <option value="Booked">Booked</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="appointment_date">Date & Time *</label>
                    <input
                      id="appointment_date"
                      type="datetime-local"
                      name="appointment_date"
                      value={formData.appointment_date}
                      onChange={handleInputChange}
                      required
                      step="1800"
                      min={moment().format('YYYY-MM-DDTHH:mm')}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="notes">Notes</label>
                  <textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                  />
                </div>

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="modern-button cancel"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="modern-button primary"
                  >
                    {selectedEvent ? 'Update Appointment' : 'Create Appointment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedEvent && !showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h2>Appointment Details</h2>
              
              <div className="appointment-details">
                <div className="detail-row">
                  <span className="detail-label">Customer:</span>
                  <span className="detail-value">{selectedEvent.customer_first_name} {selectedEvent.customer_last_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Phone:</span>
                  <span className="detail-value">{selectedEvent.customer_phone}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{selectedEvent.customer_email || 'N/A'}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Service:</span>
                  <span className="detail-value">{selectedEvent.service_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Employee:</span>
                  <span className="detail-value">{selectedEvent.employee_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Branch:</span>
                  <span className="detail-value">{selectedEvent.branch_name}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Date:</span>
                  <span className="detail-value">{selectedEvent.fullDateTime}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Time:</span>
                  <span className="detail-value">{selectedEvent.formattedTime}</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Duration:</span>
                  <span className="detail-value">{selectedEvent.durationMinutes} minutes</span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Status:</span>
                  <span className={`status-badge ${selectedEvent.status.toLowerCase()}`}>
                    {selectedEvent.status}
                  </span>
                </div>
                <div className="detail-row">
  <span className="detail-label">Total Price:</span>
  <span className="detail-value">        ₱{(Number(selectedEvent.price) || 0).toFixed(2)}
  </span>
</div>
<div className="detail-row">
  <span className="detail-label">Downpayment:</span>
  <span className="detail-value">        ₱{(Number(selectedEvent.downpayment) || 0).toFixed(2)}
  </span>
</div>
<div className="detail-row">
  <span className="detail-label">Remaining Balance:</span>
  <span className="detail-value">        ₱{((Number(selectedEvent.price) || 0) - (Number(selectedEvent.downpayment) || 0)).toFixed(2)}
  </span>
</div>
                {selectedEvent.notes && (
                  <div className="detail-row notes-row">
                    <span className="detail-label">Notes:</span>
                    <span className="detail-value">{selectedEvent.notes}</span>
                  </div>
                )}
              </div>

              <div className="action-buttons">
                {selectedEvent.status !== 'Completed' && (
                  <button 
                    className="modern-button success"
                    onClick={() => handleStatusChange('Completed')}
                    aria-label="Mark as completed"
                  >
                    <FaCheck /> Mark Complete
                  </button>
                )}
                
               



                <button 
                  className="archive-btn"
                  onClick={handleDelete}
                  aria-label="Archive appointment"
                >
                  <Archive /> Archive
                </button>

                <button 
                  className="modern-button secondary"
                  onClick={() => setSelectedEvent(null)}
                  aria-label="Close details"
                >
                  Close
                </button>
                <button 
  onClick={handleGenerateReceipt}
  disabled={!selectedEvent || isLoading}
  className="modern-button primary"
>
  {isLoading ? 'Generating...' : 'Generate Receipt'}
</button>            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentScheduler;