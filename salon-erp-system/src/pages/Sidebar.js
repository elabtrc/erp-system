import React, { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./sidebar.css";
import { 
  ChevronDown, 
  LogOut, 
  ShoppingCart, 
  Package, 
  Users, 
  MessageSquare, 
  CreditCard, 
  Settings,
  Home,
  FileText,
  PieChart,
  Archive
} from "lucide-react";
import { useAuth } from '../context/AuthContext';

const DropdownMenu = ({ title, icon, links, isOpen, toggle, refObj, activePath }) => {
  const { hasPermission } = useAuth();
  const filteredLinks = links.filter(link => 
    !link.requiredPermission || hasPermission(link.requiredPermission)
  );

  if (filteredLinks.length === 0) return null;

  const isActiveParent = filteredLinks.some(link => 
    link.path && activePath.includes(link.path)
  );

  return (
    <div ref={refObj} className={`dropdown-container ${isActiveParent ? 'active' : ''}`}>
      <button 
        onClick={toggle} 
        className={`nav-item ${isOpen || isActiveParent ? "active" : ""}`}
      >
        <span className="nav-icon">{icon}</span>
        <span className="nav-title">{title}</span>
        <ChevronDown size={18} className={`dropdown-arrow ${isOpen ? "rotate" : ""}`} />
      </button>
      <div className={`dropdown-wrapper ${isOpen ? "open" : ""}`}>
        <ul className="dropdown-menu">
        {filteredLinks.map((link, idx) => (
  <li key={idx}>
    <button
      onClick={() => link.action()} // no toggle here
      className={`dropdown-item ${activePath === link.path ? "active" : ""}`}
    >
      {link.label}
    </button>
  </li>
))}

        </ul>
      </div>
    </div>
  );
};

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, hasPermission } = useAuth();

  const salesRef = useRef(null);
  const inventoryRef = useRef(null);
  const hrRef = useRef(null);
  const crmRef = useRef(null);
  const financeRef = useRef(null);
  const reportsRef = useRef(null);
  const archiveRef = useRef(null);
  const settingsRef = useRef(null);

  const refs = useMemo(() => ({
    sales: salesRef,
    inventory: inventoryRef,
    hr: hrRef,
    crm: crmRef,
    finance: financeRef,
    reports: reportsRef,
    archive: archiveRef,
    settings: settingsRef,
  }), []);

  const [dropdowns, setDropdowns] = useState({
    sales: false,
    inventory: false,
    hr: false,
    crm: false,
    finance: false,
    reports: false,
    archive: false,
    settings: false,
  });

  const toggleDropdown = (menu) => {
    setDropdowns(prev => ({
      ...Object.fromEntries(Object.keys(prev).map(key => [key, false])),
      [menu]: !prev[menu]
    }));
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      Object.keys(refs).forEach((key) => {
        if (refs[key].current && !refs[key].current.contains(event.target)) {
          setDropdowns(prev => ({ ...prev, [key]: false }));
        }
      });
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refs]);

  useEffect(() => {
    const path = location.pathname;
    const newDropdowns = {};
  
    Object.keys(refs).forEach(key => {
      newDropdowns[key] = false;
    });
  
    if (path.includes('/sales/')) newDropdowns.sales = true;
    if (path.includes('/inv/')) newDropdowns.inventory = true;
    if (path.includes('/hr/')) newDropdowns.hr = true;
    if (path.includes('/crm/')) newDropdowns.crm = true;
    if (path.includes('/finance/')) newDropdowns.finance = true;
    if (path.includes('/reports/')) newDropdowns.reports = true;
    if (path.includes('/archive/')) newDropdowns.archive = true;
    if (path.includes('/settings/')) newDropdowns.settings = true;
  
    setDropdowns(prev => ({ ...prev, ...newDropdowns }));
  }, [location.pathname, refs]);
  

  if (!user) return null;

  const firstLetter = user?.firstName?.charAt(0) || user?.username?.charAt(0) || "U";
  const lastLetter = user?.lastName?.charAt(0) || "";

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo-container">
          <img 
            src="/LoginLogo.jpg" 
            alt="F.A. 101 Salon and Spa" 
            className="sidebar-logo"
            onClick={() => navigate('/dashboard')}
          />
          <h2 className="business-name">F.A. 101 Salon and Spa</h2>
        </div>
        <div className="user-profile">
          <div className="user-avatar">
            {firstLetter}{lastLetter}
          </div>
          <div className="user-info">
            <p className="user-name">
              {user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || "Unknown User"}
            </p>
            <p className="user-role">
              {user?.role || "No Role"} {user?.branchName ? `• ${user.branchName}` : ""}
            </p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-menu">
        <li>
  <button onClick={() => navigate('/dashboard')} className={`nav-item ${location.pathname === '/dashboard' ? 'active' : ''}`}>
    <Home size={20} className="nav-icon" />
    <span className="nav-title">Dashboard</span>
  </button>
</li>

{/* Sales */}
{(hasPermission('use_pos') || hasPermission('view_sales_reports') || hasPermission('view_transactions')) && (
  <li>
    <DropdownMenu
      title="Sales"
      icon={<ShoppingCart size={20} />}
      isOpen={dropdowns.sales}
      toggle={() => toggleDropdown("sales")}
      refObj={refs.sales}
      activePath={location.pathname}
      links={[
        { label: "Point of Sale", action: () => navigate("/sales/POS"), path: "/sales/POS", requiredPermission: 'use_pos' },
        { label: "Transactions", action: () => navigate("/sales/Transactions"), path: "/sales/Transactions", requiredPermission: 'view_transactions' },
     //   { label: "Sales Reports", action: () => navigate("/sales/Reports"), path: "/sales/Reports", requiredPermission: 'view_sales_reports' },
      ]}
    />
  </li>
)}

{/* Inventory */}
{(hasPermission('manage_products') || hasPermission('manage_categories') || hasPermission('manage_inventory')) && (
  <li>
    <DropdownMenu
      title="Inventory"
      icon={<Package size={20} />}
      isOpen={dropdowns.inventory}
      toggle={() => toggleDropdown("inventory")}
      refObj={refs.inventory}
      activePath={location.pathname}
      links={[
        { label: "Products", action: () => navigate("/inv/products"), path: "/inv/products", requiredPermission: 'manage_products' },
        { label: "Categories", action: () => navigate("/inv/categories"), path: "/inv/categories", requiredPermission: 'manage_categories' },
        { label: "Stocks", action: () => navigate("/inv/stocks"), path: "/inv/stocks", requiredPermission: 'manage_inventory' },
        { label: "Restock Requests", action: () => navigate("/inv/restock-requests"), path: "/inv/restock-requests", requiredPermission: 'manage_restock_requests' },
      ]}
    />
  </li>
)}

{/* HR */}
{(hasPermission('manage_employees') || hasPermission('manage_payroll') || hasPermission('manage_attendance')) && (
  <li>
    <DropdownMenu
      title="Human Resources"
      icon={<Users size={20} />}
      isOpen={dropdowns.hr}
      toggle={() => toggleDropdown("hr")}
      refObj={refs.hr}
      activePath={location.pathname}
      links={[
        { label: "Employees", action: () => navigate("/hr/EmployeeManagement"), path: "/hr/EmployeeManagement", requiredPermission: 'manage_employees' },
        { label: "Payroll", action: () => navigate("/hr/Payroll"), path: "/hr/Payroll", requiredPermission: 'manage_payroll' },
        { label: "Attendance", action: () => navigate("/hr/Attendance_Logs"), path: "/hr/Attendance_Logs", requiredPermission: 'manage_attendance' },
        { 
          label: "Schedules", 
          action: () => navigate("/hr/Attendance_scheduling"),
          path: "/hr/Attendance_scheduling",
          requiredPermission: 'attendance_logs'
        },
      ]}
    />
  </li>
)}

{/* CRM */}
{(hasPermission('manage_appointments') || hasPermission('manage_customers') || hasPermission('view_feedbacks')) && (
  <li>
    <DropdownMenu
      title="Customers"
      icon={<MessageSquare size={20} />}
      isOpen={dropdowns.crm}
      toggle={() => toggleDropdown("crm")}
      refObj={refs.crm}
      activePath={location.pathname}
      links={[
        { label: "Appointments", action: () => navigate("/crm/Appointment"), path: "/crm/Appointment", requiredPermission: 'manage_appointments' },
        // { label: "Customers", action: () => navigate("/crm/Customers"), path: "/crm/Customers", requiredPermission: 'manage_customers' },
        { label: "Feedbacks", action: () => navigate("/crm/Feedbacks"), path: "/crm/Feedbacks", requiredPermission: 'view_feedbacks' },
      ]}
    />
  </li>
)}

{/* Finance */}
{(hasPermission('manage_gl') || hasPermission('view_trial_balance') || hasPermission('view_balance_sheet')) && (
  <li>
    <DropdownMenu
      title="Finance"
      icon={<CreditCard size={20} />}
      isOpen={dropdowns.finance}
      toggle={() => toggleDropdown("finance")}
      refObj={refs.finance}
      activePath={location.pathname}
      links={[
        { 
          label: "Net Income", 
          action: () => navigate("/finance/NetIncome"),
          path: "/finance/NetIncome",
          requiredPermission: 'view_balance_sheet'
        },
        { 
          label: "Revenue Summary", 
          action: () => navigate("/finance/RevenueSummary"),
          path: "/finance/RevenueSummary",
          requiredPermission: 'manage_gl'
        },
        { 
          label: "Generate Expense Summary", 
          action: () => navigate("/finance/Expenses"),
          path: "/finance/Expenses",
          requiredPermission: 'view_trial_balance'
        },
        { 
          label: "Expenses Summary Table", 
          action: () => navigate("/finance/ExpenseSummaryTable"),
          path: "/finance/ExpenseSummaryTable",
          requiredPermission: 'view_trial_balance'
        },
        { 
          label: "Recurring Expenses", 
          action: () => navigate("/finance/RecurringExpenses"),
          path: "/finance/RecurringExpenses",
          requiredPermission: 'view_trial_balance'
        }
      ]}
    />
  </li>
)}

{/* Reports */}
{/* {(hasPermission('view_sales_reports') || hasPermission('view_financial_reports') || hasPermission('view_customer_reports')) && (
  <li>
    <DropdownMenu
      title="Reports"
      icon={<PieChart size={20} />}
      isOpen={dropdowns.reports}
      toggle={() => toggleDropdown("reports")}
      refObj={refs.reports}
      activePath={location.pathname}
      links={[
        { label: "Sales Analytics", action: () => navigate("/reports/sales"), path: "/reports/sales", requiredPermission: 'view_sales_reports' },
        { label: "Financial Overview", action: () => navigate("/reports/financial"), path: "/reports/financial", requiredPermission: 'view_financial_reports' },
        { label: "Customer Insights", action: () => navigate("/reports/customers"), path: "/reports/customers", requiredPermission: 'view_customer_reports' },
      ]}
    />
  </li>
)} */}

{/* Archive */}
{/* {(hasPermission('view_archive') || hasPermission('manage_archive')) && (
  <li>
    <DropdownMenu
      title="Archive"
      icon={<Archive size={20} />}
      isOpen={dropdowns.archive}
      toggle={() => toggleDropdown("archive")}
      refObj={refs.archive}
      activePath={location.pathname}
      links={[
        { label: "Archived Sales", action: () => navigate("/archive/sales"), path: "/archive/sales", requiredPermission: 'view_archive' },
        { label: "Archived Customers", action: () => navigate("/archive/customers"), path: "/archive/customers", requiredPermission: 'view_archive' },
        { label: "Archived Employees", action: () => navigate("/archive/employees"), path: "/archive/employees", requiredPermission: 'view_archive' },
      ]}
    />
  </li>
)} */}

{/* Settings */}
{user.role === 'Admin' && (
  <li>
    <DropdownMenu
      title="Settings"
      icon={<Settings size={20} />}
      isOpen={dropdowns.settings}
      toggle={() => toggleDropdown("settings")}
      refObj={refs.settings}
      activePath={location.pathname}
      links={[
        { label: "Users", action: () => navigate("/settings/users"), path: "/settings/users" },
        { label: "Roles", action: () => navigate("/settings/roles"), path: "/settings/roles" },
        { label: "Branches", action: () => navigate("/settings/branches"), path: "/settings/branches" },
      ]}
    />
  </li>
)}

        </ul>
      </nav>
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={handleLogout}>
          <LogOut size={20} className="logout-icon" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
