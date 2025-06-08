// server.js or routes/dashboard.js
const express = require('express');
const router = express.Router();
const { authenticateUser, authorizeRoles } = require('../middleware/authMiddleware');
const Appointment = require('../controllers/appointmentController');
const User = require('../models/User');
const Branch = require('../models/Branch');
const Feedback = require('../models/Feedback');
const Inventory = require('../models/Inventory');

// Dashboard data endpoint
router.get('/dashboard', authenticateUser, async (req, res) => {
  try {
    const { role, userId } = req.query;
    
    let dashboardData = {
      recentFeedback: await Feedback.find().sort({ date: -1 }).limit(3).lean(),
      inventoryAlerts: await Inventory.find({ quantity: { $lt: 5 } }).lean()
    };

    // Role-specific data
    switch(role) {
      case 'Admin':
        dashboardData = {
          ...dashboardData,
          adminStats: {
            totalUsers: await User.countDocuments(),
            activeBranches: await Branch.countDocuments({ status: 'active' }),
            systemHealth: "100%"
          },
          recentActivity: await ActivityLog.find().sort({ timestamp: -1 }).limit(5).lean()
        };
        break;

      case 'Accountant':
        dashboardData = {
          ...dashboardData,
          financials: await getFinancialData(),
          revenueTrends: await getRevenueTrends(),
          serviceRevenue: await getServiceRevenue()
        };
        break;

      case 'Branch Manager':
        dashboardData = {
          ...dashboardData,
          branchStats: await getBranchStats(userId),
          staffPerformance: await getStaffPerformance(userId)
        };
        break;

      case 'Receptionist':
        dashboardData = {
          ...dashboardData,
          todaysAppointments: await Appointment.find({ 
            date: { 
              $gte: new Date().setHours(0,0,0,0),
              $lt: new Date().setHours(23,59,59,999)
            }
          }).lean(),
          clientStats: {
            newClients: await User.countDocuments({ 
              createdAt: { $gte: new Date(new Date().setDate(new Date().getDate()-30)) }
            }),
            returningClients: await User.countDocuments({ 
              lastVisit: { $gte: new Date(new Date().setDate(new Date().getDate()-30)) }
            })
          }
        };
        break;
    }

    res.json(dashboardData);
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// Helper functions
async function getFinancialData() {
  // Implement your financial data aggregation
  return {
    revenue: 12450,
    outstandingInvoices: 3,
    cashFlow: 8200,
    expenses: 4250
  };
}

async function getRevenueTrends() {
  // Implement revenue trends calculation
  return [
    { month: "Jan", revenue: 4000 },
    { month: "Feb", revenue: 6200 },
    { month: "Mar", revenue: 7800 }
  ];
}

async function getServiceRevenue() {
  // Implement service revenue calculation
  return [
    { name: "Haircut", value: 35 },
    { name: "Coloring", value: 25 },
    { name: "Manicure", value: 20 }
  ];
}

async function getBranchStats(managerId) {
  // Implement branch stats calculation
  return {
    dailyAppointments: await Appointment.countDocuments({ 
      date: { 
        $gte: new Date().setHours(0,0,0,0),
        $lt: new Date().setHours(23,59,59,999)
      },
      branchManager: managerId
    }),
    staffProductivity: 92,
    customerSatisfaction: 4.5
  };
}

async function getStaffPerformance(branchId) {
  // Implement staff performance calculation
  return [
    { name: "Emma", services: 45, revenue: 4200 },
    { name: "James", services: 38, revenue: 3800 }
  ];
}

module.exports = router;