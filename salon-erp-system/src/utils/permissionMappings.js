// src/utils/permissionMappings.js
export const permissionMappings = {
  // Sales Module
  'pos_operations': 'use_pos',
  'sales_reports': 'view_sales_reports',
  'transaction_history': 'view_transactions',

  // Inventory Module
  'product_management': 'manage_products',
  'category_management': 'manage_categories',
  'inventory_management': 'manage_inventory',
  'restock_management': 'manage_restock_requests',


  // HR Module
  'employee_management': 'manage_employees',
  'payroll_management': 'manage_payroll',
  'attendance_management': 'manage_attendance',
  'attendance_logs': 'view_attendance',
  'attendance_scheduling': 'manage_schedule',

  // CRM Module
  'appointment_management': 'manage_appointments',
  'customer_management': 'manage_customers',
  'feedback_management': 'view_feedbacks',

  // Finance Module
  'coa_management': 'manage_coa',
  'gl_management': 'manage_gl',
  'trial_balance': 'view_trial_balance',
  'balance_sheet': 'view_balance_sheet',
  'income_statement': 'view_income_statement',
  'cash_flow': 'view_cash_flow',

  // Settings Module
  'user_management': 'manage_users',
  'role_management': 'manage_roles',
  'branch_management': 'manage_branches',

  // Archive Module
  'archive_access': 'view_archive',
  'archive_management': 'manage_archive',
  'archive_restore': 'restore_items',
  'archive_purge': 'purge_archive',

  // Dashboard
  'dashboard': 'view_dashboard'
};