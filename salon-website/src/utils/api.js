import axios from 'axios';
import { format } from 'date-fns';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000/api',
  timeout: 10000,
});


const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';


// Error handling utility function to avoid duplication
const handleError = (error, context) => {
  console.error(`Error in ${context}:`, error);
  throw new Error(error.message || `Failed to ${context}`);
};

// Add response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response) {
      // Server responded with a status code outside 2xx
      return Promise.reject(handleError(error.response.data, 'fetching data'));
    } else if (error.request) {
      // Request was made but no response received
      return Promise.reject('Network error. Please check your connection.');
    } else {
      // Something happened in setting up the request
      return Promise.reject('Request setup error');
    }
  }
);

// Service functions
export const fetchServices = async () => {
  try {
    const response = await api.get('/services');
    if (!response.data || response.data.length === 0) {
      throw new Error('No services available');
    }
    return response.data;
  } catch (error) {
    handleError(error, 'fetching services');
  }
};

export const fetchEmployeesByService = async (serviceId, branchId, date) => {
  try {
    const jsDay = new Date(date).getDay(); // 0=Sunday to 6=Saturday
    const adjustedDay = ((jsDay + 6) % 7) + 1; // 1=Monday to 7=Sunday

    const response = await api.get('/employees/service', {
      params: {
        service_id: serviceId,
        branch_id: branchId,
        day_of_week: adjustedDay, // pass precomputed day
      }
    });

    if (!response.data || response.data.length === 0) {
      throw new Error('No available staff for this service');
    }

    return response.data;
  } catch (error) {
    handleError(error, 'fetching employees');
  }
};


export const getAvailableSlots = async (employeeId, date, serviceId) => {
  try {
    const response = await api.get('/appointments/availability', {
      params: {
        employee_id: employeeId,
        date: format(date, 'yyyy-MM-dd'),
        service_id: serviceId
      }
    });
    if (!response.data || response.data.length === 0) {
      throw new Error('No available time slots');
    }
    return response.data;
  } catch (error) {
    handleError(error, 'fetching time slots');
  }
};

export const createAppointment = async (data) => {
  try {
    const response = await api.post('/appointments', {
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      email: data.email,
      employee: Number(data.employee),           
      services: data.selectedServices,
      appointmentDate: new Date(data.timeSlot),
      branchId: data.branch?.id,
      notes: data.notes,
      downpayment: data.downpaymentAmount,
      duration: data.totalDuration
    });
    
    return response.data;
  } catch (error) {
    handleError(error, 'creating appointment');
  }
};

export const fetchAppointments = async () => {
  try {
    const response = await api.get('/appointments');
    return response.data;
  } catch (error) {
    handleError(error, 'fetching appointments');
    return [];
  }
};



export const customerLogin = async (email, password) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/customers/login`, {
      email,
      password
    });
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Login failed';
  }
};

export const customerRegister = async (customerData) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/customers/register`, customerData);
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Registration failed';
  }
};

export const updateCustomerProfile = async (customerId, profileData, token) => {
  try {
    const response = await axios.put(
      `${API_BASE_URL}/customers/${customerId}`,
      profileData,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    return response.data;
  } catch (error) {
    throw error.response?.data?.message || 'Profile update failed';
  }
};


export default api;