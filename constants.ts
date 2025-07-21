import { Program, MembershipPlanDefinition, Student, StudentStatus, Instructor, PermissionDefinition, Role, PermissionKey, MembershipPlanCategory, AdminUserStatus, StudentGeneralLevel, AbsenceStatus, AttendanceRecord, PaymentMethod, InvoiceStatus } from './types';

export const API_BASE_URL = "https://api.adalusa.art"; // Removed trailing slash

export const API_ENDPOINTS = {
  // Admin Endpoints
  AUTH_LOGIN: `${API_BASE_URL}/auth/login`,
  STUDENTS: `${API_BASE_URL}/students`,
  PARENTS: `${API_BASE_URL}/parents`,
  STUDENTS_BULK_UPDATE: `${API_BASE_URL}/students/bulk-update`,
  INSTRUCTORS: `${API_BASE_URL}/instructors`,
  PROSPECTS: `${API_BASE_URL}/prospects`,
  APPROVE_PROSPECT: `${API_BASE_URL}/prospects/:prospectId/approve`,
  CLASS_OFFERINGS: `${API_BASE_URL}/class-offerings`,
  ABSENCES: `${API_BASE_URL}/absences`,
  SCHOOL_EVENTS: `${API_BASE_URL}/school-events`,
  ROLES: `${API_BASE_URL}/roles`, 
  ADMIN_USERS: `${API_BASE_URL}/admin-users`,
  PROGRAMS: `${API_BASE_URL}/programs`, 
  MEMBERSHIP_PLANS: `${API_BASE_URL}/membership-plans`,
  DASHBOARD_METRICS: `${API_BASE_URL}/dashboard/metrics`, 
  DASHBOARD_ALERTS: `${API_BASE_URL}/dashboard/alerts`,   
  DASHBOARD_TODOS: `${API_BASE_URL}/dashboard/todos`,     
  DASHBOARD_AGED_ACCOUNTS: `${API_BASE_URL}/dashboard/aged-accounts`, 
  DASHBOARD_REVENUE: `${API_BASE_URL}/dashboard/revenue`,
  ENROLLMENTS: `${API_BASE_URL}/enrollments`, 
  ATTENDANCE: `${API_BASE_URL}/attendance`, 
  GENERAL_SETTINGS: `${API_BASE_URL}/settings/general`,
  CALENDAR_SETTINGS: `${API_BASE_URL}/settings/calendar`,
  ANNOUNCEMENTS: `${API_BASE_URL}/announcements`,
  PAYMENTS: `${API_BASE_URL}/stripe/payments`, 
  INVOICES: `${API_BASE_URL}/stripe/invoices`, 
  EMAIL_INVOICE: `${API_BASE_URL}/stripe/invoices/:invoiceId/email`, 
  STUDENT_MEMBERSHIP: `${API_BASE_URL}/students`, 
  STRIPE_SUBSCRIPTIONS: `${API_BASE_URL}/stripe/subscriptions`, 
  STRIPE_SUBSCRIPTION_CANCEL: `${API_BASE_URL}/stripe/subscriptions/:subscriptionId/cancel`,
  STUDENT_STRIPE_SUBSCRIPTION: `${API_BASE_URL}/stripe/students/:studentId/stripe-subscription`,
  STRIPE_STUDENT_BASE: `${API_BASE_URL}/stripe/students`,
  STRIPE_METRICS: `${API_BASE_URL}/stripe/metrics`, 
  STRIPE_CREATE_AUDITION_PAYMENT: `${API_BASE_URL}/stripe/create-audition-payment`,
  STRIPE_CONNECT_ACCOUNT_STATUS: `${API_BASE_URL}/studios/:studioId/stripe-status`,
  STRIPE_CONNECT_ACCOUNT_LINK: `${API_BASE_URL}/stripe/connect/account-link`,
  STRIPE_CONNECT_ACCOUNT: `${API_BASE_URL}/stripe/connect/account`,

  // Client Portal Endpoints
  CLIENT_LOGIN: `${API_BASE_URL}/portal/auth/login`,
  CLIENT_PROFILE_ME: `${API_BASE_URL}/portal/me`,
  
  // Public Endpoints
  PUBLIC_REGISTER_STUDIO: `${API_BASE_URL}/public/register-studio`,

  // Settings Endpoints
  SETTINGS_STRIPE: `${API_BASE_URL}/settings/stripe`,
};


export const STUDENT_STATUS_OPTIONS: { value: StudentStatus, label: string }[] = [
    { value: "Active", label: "Active" },
    { value: "Inactive", label: "Inactive" },
    { value: "Suspended", label: "Suspended" },
];

export const GENDER_OPTIONS: { value: Student['gender'], label: string }[] = [
    { value: "Female", label: "Female" },                                                                                                                                │
    { value: "Male", label: "Male" },                                                                                                                                    │
    { value: "Other", label: "Other" },                                                                                                                                  │
    { value: "Prefer not to say", label: "Prefer not to say" },
];


export const STUDENT_GENERAL_LEVEL_OPTIONS: { value: StudentGeneralLevel, label: string }[] = [
    { value: "Beginner", label: "Beginner" },
    { value: "Intermediate", label: "Intermediate" },
    { value: "Advanced", label: "Advanced" },
    { value: "Professional", label: "Professional" },
];

export const ADMIN_USER_STATUS_OPTIONS: { value: AdminUserStatus, label: string }[] = [
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "suspended", label: "Suspended" },
];


export const APP_NAME = "Dance Studio Admin";

export const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];


export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  // Dashboard
  { key: 'view_dashboard', name: 'View Dashboard', description: 'Can view the main dashboard page.', category: 'Dashboard' },
  { key: 'view_dashboard_financials', name: 'View Dashboard Financials', description: 'Can view financial KPIs and widgets on the dashboard.', category: 'Dashboard' },
  // User Management
  { key: 'view_students', name: 'View Students', description: 'Can view student lists and profiles.', category: 'User Management' },
  { key: 'manage_students', name: 'Manage Students', description: 'Can create, edit, and delete student profiles.', category: 'User Management' },
  { key: 'view_instructors', name: 'View Instructors', description: 'Can view instructor lists and profiles.', category: 'User Management' },
  { key: 'manage_instructors', name: 'Manage Instructors', description: 'Can create, edit, and delete instructor profiles.', category: 'User Management' },
  // Class & Program Management
  { key: 'manage_programs', name: 'Manage Programs', description: 'Can define and edit dance programs and their levels.', category: 'Class & Program Management' },
  { key: 'manage_class_offerings', name: 'Manage Class Offerings', description: 'Can create, edit, and delete class offerings.', category: 'Class & Program Management' },
  { key: 'manage_schedules', name: 'Manage Schedules', description: 'Can manage class schedules, rooms, and times.', category: 'Class & Program Management' },
  // Enrollment & Attendance
  { key: 'view_enrollments', name: 'View Enrollments', description: 'Can view student enrollments and class rosters.', category: 'Enrollment & Attendance' },
  { key: 'manage_enrollments', name: 'Manage Enrollments', description: 'Can enroll and unenroll students from classes.', category: 'Enrollment & Attendance' },
  { key: 'mark_attendance', name: 'Mark Attendance', description: 'Can mark attendance for classes.', category: 'Enrollment & Attendance' },
  { key: 'view_absences', name: 'View Absences', description: 'Can view student absence records.', category: 'Enrollment & Attendance' },
  { key: 'manage_absences', name: 'Manage Absences', description: 'Can record and manage student absences.', category: 'Enrollment & Attendance' },
  { key: 'manage_waitlists', name: 'Manage Waitlists', description: 'Can manage class waitlists.', category: 'Enrollment & Attendance' },
  // Billing & Payments
  { key: 'process_payments', name: 'Process Manual Payments', description: 'Can record manual payments (cash, bank transfer).', category: 'Billing & Payments' },
  { key: 'manage_invoices', name: 'Manage Invoices', description: 'Can view and send invoices.', category: 'Billing & Payments' },
  { key: 'manage_subscriptions', name: 'Manage Subscriptions', description: 'Can create and cancel student Stripe subscriptions.', category: 'Billing & Payments' },
  // Communications
  { key: 'send_announcements', name: 'Send Announcements', description: 'Can compose and send announcements to various audiences.', category: 'Communications' },
  { key: 'manage_communication_templates', name: 'Manage Comm. Templates', description: 'Can create and edit templates for emails and other communications.', category: 'Communications' },
  // Reports
  { key: 'view_all_reports', name: 'View All Reports', description: 'Grants access to all available reports.', category: 'Reports' },
  { key: 'view_student_reports', name: 'View Student Reports', description: 'Can view reports related to student data (demographics, status).', category: 'Reports' },
  { key: 'view_attendance_reports', name: 'View Attendance Reports', description: 'Can view reports related to attendance and absences.', category: 'Reports' },
  { key: 'view_enrollment_reports', name: 'View Enrollment Reports', description: 'Can view reports related to class and program enrollments.', category: 'Reports' },
  { key: 'view_financial_reports', name: 'View Financial Reports', description: 'Can view reports related to payments and financial metrics.', category: 'Reports' },
  { key: 'view_membership_reports', name: 'View Membership Reports', description: 'Can view reports related to membership plan distribution.', category: 'Reports' },
  // Settings
  { key: 'manage_general_settings', name: 'Manage General Settings', description: 'Manage academy name, contact info, logo, etc.', category: 'Settings' },
  { key: 'manage_calendar_settings', name: 'Manage Calendar Settings', description: 'Configure terms, holidays, and rooms.', category: 'Settings'},
  { key: 'manage_membership_plans', name: 'Manage Membership Plans', description: 'Create and edit membership plans and pricing.', category: 'Settings' },
  { key: 'manage_roles_permissions', name: 'Manage Roles & Permissions', description: 'Manage user roles and their permissions.', category: 'Settings' },
  { key: 'manage_admin_users', name: 'Manage Admin Users', description: 'Create and manage admin user accounts.', category: 'Settings' },
];

export const ABSENCE_REASON_OPTIONS: string[] = [
    "Sickness",
    "Injury",
    "Medical Appointment",
    "Family Trip",
    "School Event",
    "Personal Commitment",
    "Other (specify)",
];

export const ATTENDANCE_STATUS_OPTIONS: { value: AttendanceRecord['status'], label: string }[] = [
    { value: 'Present', label: 'Present' },
    { value: 'Absent', label: 'Absent' },
    { value: 'Late', label: 'Late' },
    { value: 'Excused', label: 'Excused' },
];

export const TIMEZONE_OPTIONS = [
    { value: "Etc/GMT+12", label: "(GMT-12:00) International Date Line West" },
    { value: "Pacific/Midway", label: "(GMT-11:00) Midway Island, Samoa" },
    { value: "Pacific/Honolulu", label: "(GMT-10:00) Hawaii" },
    { value: "America/Anchorage", label: "(GMT-09:00) Alaska" },
    { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time (US & Canada)" },
    { value: "America/Denver", label: "(GMT-07:00) Mountain Time (US & Canada)" },
    { value: "America/Chicago", label: "(GMT-06:00) Central Time (US & Canada)" },
    { value: "America/New_York", label: "(GMT-05:00) Eastern Time (US & Canada)" },
    { value: "America/Caracas", label: "(GMT-04:30) Caracas" },
    { value: "America/Halifax", label: "(GMT-04:00) Atlantic Time (Canada)" },
    { value: "America/Manaus", label: "(GMT-04:00) Manaus, La Paz" },
    { value: "America/St_Johns", label: "(GMT-03:30) Newfoundland" },
    { value: "America/Sao_Paulo", label: "(GMT-03:00) Brasilia, Buenos Aires" },
    { value: "Atlantic/South_Georgia", label: "(GMT-02:00) Mid-Atlantic" },
    { value: "Atlantic/Azores", label: "(GMT-01:00) Azores, Cape Verde Is." },
    { value: "Etc/UTC", label: "(GMT+00:00) Universal Time Coordinated, Greenwich Mean Time" },
    { value: "Europe/London", label: "(GMT+01:00) London, Dublin, Lisbon" },
    { value: "Europe/Paris", label: "(GMT+02:00) Amsterdam, Berlin, Paris, Rome" },
    { value: "Europe/Moscow", label: "(GMT+03:00) Moscow, St. Petersburg, Volgograd" },
    { value: "Asia/Dubai", label: "(GMT+04:00) Abu Dhabi, Muscat, Tbilisi" },
    { value: "Asia/Kabul", label: "(GMT+04:30) Kabul" },
    { value: "Asia/Karachi", label: "(GMT+05:00) Islamabad, Karachi, Tashkent" },
    { value: "Asia/Kolkata", label: "(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi" },
    { value: "Asia/Kathmandu", label: "(GMT+05:45) Kathmandu" },
    { value: "Asia/Dhaka", label: "(GMT+06:00) Almaty, Dhaka, Colombo" },
    { value: "Asia/Yangon", label: "(GMT+06:30) Yangon (Rangoon)" },
    { value: "Asia/Bangkok", label: "(GMT+07:00) Bangkok, Hanoi, Jakarta" },
    { value: "Asia/Shanghai", label: "(GMT+08:00) Beijing, Perth, Singapore, Hong Kong" },
    { value: "Asia/Tokyo", label: "(GMT+09:00) Tokyo, Seoul, Osaka, Sapporo, Yakutsk" },
    { value: "Australia/Adelaide", label: "(GMT+09:30) Adelaide, Darwin" },
    { value: "Australia/Sydney", label: "(GMT+10:00) Eastern Australia, Guam, Vladivostok" },
    { value: "Pacific/Auckland", label: "(GMT+12:00) Auckland, Wellington, Fiji, Marshall Is." },
    { value: "Pacific/Tongatapu", label: "(GMT+13:00) Nuku'alofa" }
  ];
  
  export const WEEK_START_DAY_OPTIONS = [
    { value: 0, label: "Sunday" },
    { value: 1, label: "Monday" },
  ];

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod, label: string }[] = [
    { value: "Stripe Subscription", label: "Stripe Subscription" },
    // "Credit Card" is now only for one-time, so it will be handled by CardElement if needed for other scenarios.
    // For memberships, Stripe Subscription is the primary card method.
    { value: "Cash", label: "Cash" },
    { value: "Bank Transfer", label: "Bank Transfer" },
    { value: "Other", label: "Other" },
];

export const INVOICE_STATUS_OPTIONS: { value: InvoiceStatus, label: string }[] = [
    { value: 'Draft', label: 'Draft' },
    { value: 'Sent', label: 'Sent' },
    { value: 'Paid', label: 'Paid' },
    { value: 'Overdue', label: 'Overdue' },
    { value: 'Void', label: 'Void' },
];

// Mock Stripe Price IDs. Replace with your actual Stripe Price IDs.
export const MOCK_STRIPE_PRICE_IDS: { [key: string]: string } = {
  // "Plan Name From Your System": "price_xxxxxxxxxxxxxx",
  "Basic Monthly": "price_mock_basic_monthly",
  "Pro Monthly": "price_mock_pro_monthly",
  "Ultra Monthly": "price_mock_ultra_monthly",
  "Complete Monthly": "price_mock_complete_monthly",
  // Add mappings for all your MembershipPlanDefinition names to Stripe Price IDs
  // If a plan's ID is used, ensure the mapping reflects that.
};