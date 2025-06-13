const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/authMiddleware');
const transactionsController = require('../controllers/transactionsController');
const validateDatabaseSchema = require('../middleware/dbValidationMiddleware');

// Public routes
router.get('/branch/:branchId', authenticateToken, appointmentController.getAppointmentsByBranch);
router.get('/availability', appointmentController.getAvailability);
router.post('/', appointmentController.createAppointment);

// Authenticated routes
router.get('/customers/:customerId/appointments', authenticateToken, appointmentController.getAppointmentsByCustomer);
router.get('/', authenticateToken, appointmentController.getAllAppointments);
router.put('/:id', authenticateToken, appointmentController.updateAppointment);
router.patch('/:id/status', authenticateToken, appointmentController.updateAppointmentStatus);
router.delete('/:id', authenticateToken, appointmentController.deleteAppointment);

// Receipt generation route (only define this once)
router.post('/:id/receipt', 
  authenticateToken,
  validateDatabaseSchema,
  transactionsController.generateReceipt
);

module.exports = router;