const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
  });


const appointmentController = {
  // Get all appointments
// In appointmentController.js - Update getAllAppointments
getAllAppointments: async (req, res) => {
  try {
    const result = await pool.query(`
    SELECT 
  a.appointment_id,
  a.customer_first_name,
  a.customer_last_name,
  a.customer_phone,
  a.customer_email,
  a.appointment_date,
  a.duration,
  a.notes,
  a.status,
  a.downpayment,               -- ✅ ADD THIS
  s.service_name,
  s.price,                     -- ✅ ADD THIS
  e.first_name as employee_first_name,
  e.last_name as employee_last_name,
  b.branch_name
FROM appointments a
JOIN services s ON a.service_id = s.service_id
JOIN employees e ON a.employee_id = e.employee_id
JOIN branches b ON a.branch_id = b.branch_id
WHERE a.status != 'Archived'
ORDER BY a.appointment_date DESC

    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
},

  // Create a new appointment
  createAppointment: async (req, res) => {
    const {
      customerId,
      firstName,
      lastName,
      phone,
      email,
      employee,
      services,
      appointmentDate,
      branchId,
      notes,
      downpayment,
      duration
    } = req.body;
    
  
    if (!firstName || !lastName || !phone || !employee || !services?.length || !appointmentDate || !branchId || !duration) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
  
    try {
      // Only allow one service for now — pick the first
      const service_id = services[0];
  
      // Verify service exists
      const serviceResult = await pool.query('SELECT duration FROM services WHERE service_id = $1', [service_id]);
      if (serviceResult.rows.length === 0) {
        return res.status(404).json({ error: 'Selected service not found' });
      }
  
      // Check for conflict
      const existing = await pool.query(
        `SELECT 1 FROM appointments 
         WHERE employee_id = $1 
         AND appointment_date = $2
         AND status != 'Cancelled'`,
        [employee, appointmentDate]
      );
  
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Time slot already booked' });
      }
  
      const result = await pool.query(
        `INSERT INTO appointments (
          customer_id, customer_first_name, customer_last_name, customer_phone, customer_email,
          employee_id, service_id, appointment_date, duration, branch_id, notes, downpayment, status
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *`,
        [
          customerId,
          firstName,
          lastName,
          phone,
          email || null,
          employee,
          service_id,
          appointmentDate,
          duration,
          branchId,
          notes || null,
          downpayment || 0,
          'Scheduled'
        ]
      );
  
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Error creating appointment:', error);
      res.status(500).json({ error: 'Failed to create appointment' });
    }
  },

// In appointmentController.js
updateAppointment: async (req, res) => {
  const { id } = req.params;
  const {
    customer_first_name, customer_last_name, customer_phone, customer_email,
    employee_id, service_id, appointment_date, duration, branch_id, notes, status
  } = req.body;

  try {
    // Validate required fields
    if (!customer_first_name || !customer_last_name || !customer_phone || 
        !employee_id || !service_id || !appointment_date || !duration || !branch_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date format
    const appointmentDate = new Date(appointment_date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Please use ISO format.' });
    }

    // Update the appointment
    const result = await pool.query(
      `UPDATE appointments SET
        customer_first_name = $1,
        customer_last_name = $2,
        customer_phone = $3,
        customer_email = $4,
        employee_id = $5,
        service_id = $6,
        appointment_date = $7,
        duration = $8,
        branch_id = $9,
        notes = $10,
        status = $11
      WHERE appointment_id = $12
      RETURNING *`,
      [
        customer_first_name,
        customer_last_name,
        customer_phone,
        customer_email || null,
        employee_id,
        service_id,
        appointment_date, // Already validated
        duration,
        branch_id,
        notes || null,
        status || 'Booked',
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment:', error);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
},



// Get appointments by branch
getAppointmentsByBranch: async (req, res) => {
  const { branchId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        a.appointment_id,
        a.customer_first_name,
        a.customer_last_name,
        a.customer_phone,
        a.customer_email,
        a.appointment_date,
        a.duration,
        a.notes,
        a.status,
        a.downpayment,
        s.service_name,
        s.price,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name,
        b.branch_name
      FROM appointments a
      JOIN services s ON a.service_id = s.service_id
      JOIN employees e ON a.employee_id = e.employee_id
      JOIN branches b ON a.branch_id = b.branch_id
      WHERE a.branch_id = $1 AND a.status != 'Archived'
      ORDER BY a.appointment_date DESC
    `, [branchId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments by branch:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
},

// controllers/appointmentController.js

updateAppointmentStatus: async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Booked', 'Confirmed', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const result = await pool.query(
      `UPDATE appointments SET status = $1 WHERE appointment_id = $2 RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Failed to update appointment status' });
  }
}
,

  // Delete an appointment
// In appointmentController.js - Update deleteAppointment
deleteAppointment: async (req, res) => {
  const { id } = req.params;

  try {
    // Archive instead of delete
    const result = await pool.query(
      `UPDATE appointments SET status = 'Archived'
       WHERE appointment_id = $1
       RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    res.json({ message: 'Appointment archived successfully' });
  } catch (error) {
    console.error('Error archiving appointment:', error);
    res.status(500).json({ error: 'Failed to archive appointment' });
  }
},

getAvailability: async (req, res) => {
  let { employee_id, date, service_id } = req.query;

  // If service_id is an array (from service_id[]=x), get the first value
  if (Array.isArray(service_id)) {
    service_id = service_id[0];
  }

  try {
    const serviceResult = await pool.query(
      'SELECT duration FROM services WHERE service_id = $1',
      [service_id]
    );

    if (serviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const duration = serviceResult.rows[0].duration || 30;
    const workStart = '09:00';
    const workEnd = '18:00';
    const interval = 30;

    const appointments = await pool.query(
      `SELECT appointment_date, duration 
       FROM appointments 
       WHERE employee_id = $1 
       AND DATE(appointment_date) = $2
       AND status != 'Cancelled'`,
      [employee_id, date]
    );

    const slots = [];
    const startTime = new Date(`${date}T${workStart}`);
    const endTime = new Date(`${date}T${workEnd}`);
    let currentTime = new Date(startTime);

    while (currentTime <= endTime) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60000);
      const isAvailable = !appointments.rows.some(app => {
        const appStart = new Date(app.appointment_date);
        const appEnd = new Date(appStart.getTime() + app.duration * 60000);
        return currentTime < appEnd && slotEnd > appStart;
      });

      if (isAvailable && slotEnd <= endTime) {
        slots.push({
          start: currentTime.toISOString(),
          end: slotEnd.toISOString(),
          display: currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }

      currentTime = new Date(currentTime.getTime() + interval * 60000);
    }

    res.json(slots);
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: 'Failed to check availability' });
  }
},

getAppointmentsByCustomer: async (req, res) => {
  const { customerId } = req.params;

  try {
    const result = await pool.query(`
      SELECT 
        a.*, 
        s.name AS service_name, 
        e.first_name || ' ' || e.last_name AS employee_name
      FROM appointments a
      LEFT JOIN services s ON a.service_id = s.service_id
      LEFT JOIN employees e ON a.employee_id = e.employee_id
      WHERE a.customer_id = $1
      ORDER BY a.appointment_date DESC
    `, [customerId]);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments for customer:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
}


};

module.exports = appointmentController;
