import React from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer } from "recharts";
import Sidebar from "./Sidebar";
import "./Dashboard.css";
import { Search } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  // Sample data (replace with API calls)
  const dashboardData = {
    appointments: [
      { time: "10:00 AM", client: "Sarah Johnson", service: "Haircut", stylist: "Emma" },
      { time: "11:30 AM", client: "Michael Brown", service: "Coloring", stylist: "James" }
    ],
    financials: {
      revenue: "$12,450",
      outstandingInvoices: 3,
      cashFlow: "$8,200"
    },
    inventoryAlerts: [
      { name: "Shampoo", status: "low" },
      { name: "Hair Color", status: "critical" }
    ],
    feedback: [
      { rating: 5, comment: "Excellent service!", client: "Sarah J." }
    ]
  };

  // --- Helper Functions ---
  const getWelcomeMessage = () => {
    if (!user) return "Welcome!";
    const name = user.firstName || user.username;
    const hour = new Date().getHours();
    return `${hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, ${name}!`;
  };

  const renderKPICard = (title, value, trend = "stable", change = "", comparison = "") => (
    <div className={`kpi-card ${trend}`}>
      <h3>{title}</h3>
      <p>{value}</p>
      {change && (
        <span className="kpi-trend">
          {trend === 'up' && '↑'}
          {trend === 'down' && '↓'}
          {change} {comparison}
        </span>
      )}
    </div>
  );

  // --- Role-Specific Components ---
  const AdminWidgets = () => (
    <>
      <section className="admin-overview">
        <h2>Administrator Overview</h2>
        <div className="admin-stats">
          {renderKPICard("Total Users", "24")}
          {renderKPICard("Active Branches", "5")}
          {renderKPICard("System Health", "100%", "up", "2%", "from last week")}
        </div>
      </section>

      <div className="content-card">
        <h2>User Activity Log</h2>
        <div className="placeholder-content">Recent admin activities...</div>
      </div>
    </>
  );

  const AccountantWidgets = () => (
    <>
      <section className="metrics-section">
        <h2>Financial Dashboard</h2>
        <div className="kpi-grid">
          {renderKPICard("Monthly Revenue", dashboardData.financials.revenue, "up", "15%", "vs last month")}
          {renderKPICard("Outstanding Invoices", dashboardData.financials.outstandingInvoices, "down", "", "needs follow-up")}
          {renderKPICard("Cash Flow", dashboardData.financials.cashFlow, "stable")}
        </div>
      </section>

      <div className="content-card">
        <h2>Revenue Trends</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={[
            { month: "Jan", revenue: 4000 },
            { month: "Feb", revenue: 6200 },
            { month: "Mar", revenue: 7800 }
          ]}>
            <XAxis dataKey="month" />
            <YAxis />
            <Line type="monotone" dataKey="revenue" stroke="#8884d8" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  const BranchManagerWidgets = () => (
    <>
      <section className="metrics-section">
        <h2>Branch Performance</h2>
        <div className="kpi-grid">
          {renderKPICard("Daily Appointments", "18", "up", "10%", "vs yesterday")}
          {renderKPICard("Staff Productivity", "92%", "stable")}
          {renderKPICard("Inventory Alerts", dashboardData.inventoryAlerts.length, "down")}
        </div>
      </section>

      <div className="content-card">
        <h2>Staff Performance</h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={[
            { name: "Emma", services: 45 },
            { name: "James", services: 38 }
          ]}>
            <XAxis dataKey="name" />
            <Bar dataKey="services" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </>
  );

  const ReceptionistWidgets = () => (
    <>
      <section className="metrics-section">
        <h2>Today's Schedule</h2>
        <div className="appointment-list">
          {dashboardData.appointments.map((appt, i) => (
            <div key={i} className="appointment-item">
              <span className="appt-time">{appt.time}</span>
              <span className="appt-client">{appt.client}</span>
              <span className="appt-service">{appt.service}</span>
            </div>
          ))}
        </div>
      </section>

      <div className="content-card">
        <h2>Quick Actions</h2>
        <div className="quick-actions">
          <button className="action-button">New Appointment</button>
          <button className="action-button">Check In Client</button>
        </div>
      </div>
    </>
  );

  // --- Shared Widgets (All Roles) ---
  const SharedWidgets = () => (
    <div className="content-card">
      <h2>Recent Feedback</h2>
      <div className="feedback-list">
        {dashboardData.feedback.map((fb, i) => (
          <div key={i} className="feedback-item">
            <div className="stars">
              {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
            </div>
            <p>"{fb.comment}"</p>
            <small>- {fb.client}</small>
          </div>
        ))}
      </div>
    </div>
  );

  // --- Main Render ---
  return (
    <div className="dashboard-container">
      <Sidebar />
      
      <div className="dashboard-content">
        {/* Header */}
        <header className="dashboard-header">
          <h1>{getWelcomeMessage()}</h1>
          <div className="header-controls">
            <div className="search-bar">
              <Search className="search-icon" />
              <input type="text" placeholder="Search..." />
            </div>
            <div className="header-icons">
              {/* <Bell className="icon" /> */}
              <div className="user-avatar"></div>
            </div>
          </div>
        </header>

        {/* Role-Specific Content */}
        {user?.role === 'Admin' && <AdminWidgets />}
        {user?.role === 'Accountant' && <AccountantWidgets />}
        {user?.role === 'Branch Manager' && <BranchManagerWidgets />}
        {user?.role === 'Receptionist' && <ReceptionistWidgets />}

        {/* Shared Content */}
        <div className="content-grid">
          <SharedWidgets />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;