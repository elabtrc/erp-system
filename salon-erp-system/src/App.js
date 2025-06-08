import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import PrivateRoute from "./components/PrivateRoute";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/LoginPage";
import UserSettings from "./pages/settings/users";
import BranchManagement from "./pages/settings/branches";
import RoleManagement from "./pages/settings/roles";
import Products from "./pages/inv/products";
import Categories from "./pages/inv/categories";
import Stocks from "./pages/inv/stocks";
import EmployeeManagement from "./pages/hr/EmployeeManagement";
import Payroll from "./pages/hr/Payroll";
import AttendancePage from "./pages/Attendance";
import AttendanceLogs from "./pages/hr/Attendance_Logs";
import Appointment from "./pages/crm/Appointment";
import CustomerInfo from "./pages/crm/Customers";
import Feedbacks from "./pages/crm/Feedbacks";
import SalesReport from "./pages/sales/SalesReport";
import POS from "./pages/sales/POS";
import TransactionHistory from "./pages/sales/Transactions";
import AttendanceScheduling from "./pages/hr/Attendance_scheduling";
import Unauthorized from "./pages/Unauthorized";
import Archive from "./pages/archive/Archive";
import RestockRequests from "./pages/inv/RestockRequests";
import AddEmployeeForm from "./pages/hr/AddEmployee";
import EditEmployeeForm from "./pages/hr/EditEmployee";
import RevenueSummaryTable from "./pages/finance/RevenueSummary";
import ExpensesSummary from "./pages/finance/Expenses";
import RecurringExpenses from "./pages/finance/RecurringExpenses";
import NetIncome from "./pages/finance/NetIncome";
import ExpenseSummaryTable from "./pages/finance/ExpenseSummaryTable";
import EmployeeSchedule from "./pages/hr/Attendance_scheduling";

export default function App() {
  return (
    <><Toaster position="top-right" reverseOrder={false} />
    <AuthProvider>
      <Routes>
      <Route path="/" element={<LoginPage />} />
<Route path="/unauthorized" element={<Unauthorized />} />

<Route
  path="/dashboard"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Accountant', 'Receptionist', 'Super Admin']} />}>
  <Route index element={<Dashboard />} />
</Route>

{/* Inventory Management */}
<Route
  path="/inv/products"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Accountant', 'Super Admin']} requiredPermission="manage_products" />}>
  <Route index element={<Products />} />
</Route>

<Route
  path="/inv/categories"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Accountant', 'Super Admin']} requiredPermission="manage_categories" />}>
  <Route index element={<Categories />} />
</Route>

<Route
  path="/inv/stocks"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Accountant', 'Super Admin']} requiredPermission="manage_inventory" />}>
  <Route index element={<Stocks />} />
</Route>

<Route
  path="/inv/restock-requests"
  element={<PrivateRoute allowedRoles={['Admin', 'Super Admin']} requiredPermission="manage_restock_requests" />}>
  <Route index element={<RestockRequests />} />
</Route>

{/* Settings */}
<Route
  path="/settings/users"
  element={<PrivateRoute allowedRoles={['Admin', 'Super Admin']} requiredPermission="manage_users" />}>
  <Route index element={<UserSettings />} />
</Route>

<Route
  path="/settings/roles"
  element={<PrivateRoute allowedRoles={['Admin', 'Super Admin']} requiredPermission="manage_roles" />}>
  <Route index element={<RoleManagement />} />
</Route>

<Route
  path="/settings/branches"
  element={<PrivateRoute allowedRoles={['Admin', 'Super Admin']} requiredPermission="manage_branches" />}>
  <Route index element={<BranchManagement />} />
</Route>

{/* HR Management */}
<Route
  path="/hr/EmployeeManagement"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Super Admin']} requiredPermission="manage_employees" />}>
  <Route index element={<EmployeeManagement />} />
</Route>

<Route
  path="/hr/AddEmployee"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Super Admin']} requiredPermission="manage_employees" />}>
  <Route index element={<AddEmployeeForm />} />
</Route>

<Route
  path="/hr/EditEmployee"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Super Admin']} requiredPermission="manage_employees" />}>
  <Route index element={<EditEmployeeForm />} />
</Route>

<Route
  path="/hr/Payroll"
  element={<PrivateRoute allowedRoles={['Admin', 'Accountant', 'Super Admin']} requiredPermission="manage_payroll" />}>
  <Route index element={<Payroll />} />
</Route>

<Route 
          path="/hr/Attendance_scheduling" 
          element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager']} requiredPermission="manage_attendance" />}
        >
          <Route index element={<EmployeeSchedule />} />
        </Route>

<Route
  path="/AttendancePage"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Super Admin']} requiredPermission="manage_attendance" />}>
  <Route index element={<AttendancePage />} />
</Route>

<Route
  path="/hr/Attendance_Logs"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Super Admin']} requiredPermission="view_attendance" />}>
  <Route index element={<AttendanceLogs />} />
</Route>

{/* CRM */}
<Route
  path="/crm/appointment"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Receptionist', 'Super Admin']} requiredPermission="manage_appointments" />}>
  <Route index element={<Appointment />} />
</Route>

<Route
  path="/crm/Customers"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Receptionist', 'Super Admin']} requiredPermission="manage_customers" />}>
  <Route index element={<CustomerInfo />} />
</Route>

<Route
  path="/crm/Feedbacks"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Receptionist', 'Super Admin']} requiredPermission="view_feedbacks" />}>
  <Route index element={<Feedbacks />} />
</Route>

{/* Finance */}
<Route
  path="/finance/RevenueSummary"
  element={<PrivateRoute allowedRoles={['Admin', 'Accountant', 'Super Admin']} requiredPermission="coa_management" />}>
  <Route index element={<RevenueSummaryTable />} />
</Route>

<Route
  path="/finance/Expenses"
  element={<PrivateRoute allowedRoles={['Admin', 'Accountant', 'Super Admin']} requiredPermission="gl_management" />}>
  <Route index element={<ExpensesSummary />} />
</Route>

<Route
  path="/finance/RecurringExpenses"
  element={<PrivateRoute allowedRoles={['Admin', 'Accountant', 'Super Admin']} requiredPermission="gl_management" />}>
  <Route index element={<RecurringExpenses />} />
</Route>

<Route
  path="/finance/ExpenseSummaryTable"
  element={<PrivateRoute allowedRoles={['Admin', 'Accountant', 'Super Admin']} requiredPermission="gl_management" />}>
  <Route index element={<ExpenseSummaryTable />} />
</Route>

<Route
  path="/finance/NetIncome"
  element={<PrivateRoute allowedRoles={['Admin', 'Accountant', 'Super Admin']} requiredPermission="trial_balance" />}>
  <Route index element={<NetIncome />} />
</Route>

{/* Sales */}
<Route
  path="/sales/POS"
  element={<PrivateRoute allowedRoles={['Admin', 'Receptionist', 'Super Admin']} requiredPermission="use_pos" />}>
  <Route index element={<POS />} />
</Route>

<Route
  path="/sales/Reports"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Accountant', 'Super Admin']} requiredPermission="view_sales_reports" />}>
  <Route index element={<SalesReport />} />
</Route>

<Route
  path="/sales/Transactions"
  element={<PrivateRoute allowedRoles={['Admin', 'Branch Manager', 'Accountant', 'Super Admin']} requiredPermission="view_transactions" />}>
  <Route index element={<TransactionHistory />} />
</Route>

{/* Archive */}
<Route
  path="/archive/Archive"
  element={<PrivateRoute allowedRoles={['Admin', 'Super Admin']} requiredPermission="view_archive" />}>
  <Route index element={<Archive />} />
</Route>

{/* Catch-all */}
<Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </AuthProvider>
    </>
  );
}