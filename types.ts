

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  link?: string;
  read: boolean;
  timestamp: string;
}


export interface ScheduledClassSlot {
    id: string; // Keep for React keys, backend might generate/ignore on create
    dayOfWeek: number; // 0 for Sunday, 1 for Monday, ..., 6 for Saturday
    startTime: string; // "HH:mm:ss" or "HH:mm"
    endTime: string;   // "HH:mm:ss" or "HH:mm"
    room: string;
    classOfferingId?: string; // Optional on create, present on fetch
}

export interface ScheduleItem {
    id: string; // Unique ID for the UI element (e.g., classOfferingId + "_" + slotId)
    name: string;
    time: string; // Formatted time range e.g., "5:00 PM - 6:30 PM"
    professor: string;
    room?: string; // Optional, as slot.room might be null or if we default
    type: string; // Derived from ClassOffering.category
    classOfferingId: string; // To link back to the main class offering
    slotId: string; // To identify the specific slot
    colorClass: string; // For UI styling based on program/category
}

export type StudentGeneralLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Professional';
export type ProgramName = string; 
export type DancerLevelName = string; 

export type MembershipPlanCategory = 'Basic' | 'Basic Plus' | 'Pro' | 'Ultra' | 'Complete';


export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
    profilePictureUrl: string;
    username?: string; 
    email: string;
    phone: string;
    emergencyContact: {
        name: string;
        phone: string;
        relationship: string;
    };
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    program: ProgramName | null; 
    dancerLevel: DancerLevelName | null; 
    enrolledClasses: string[]; 
    membershipPlanId: string | null; 
    membershipPlanName?: string; 
    membershipStartDate: string | null; 
    membershipRenewalDate: string | null; 
    status: 'Active' | 'Inactive' | 'Suspended';
    notes?: string;
    personalGoals?: string;
    stripeCustomerId?: string; 
    stripeSubscriptionId?: string; 
    stripeSubscriptionStatus?: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | null;
    parentId?: string | null; 
    parentName?: string; 
    createdAt?: string;
    updatedAt?: string;
}

export type Gender = Student['gender']; // Export Gender type

export interface StudentFormData extends Partial<Omit<Student, 'membershipPlanName' | 'membershipPlanId' | 'membershipStartDate' | 'membershipRenewalDate' | 'stripeCustomerId' | 'stripeSubscriptionId' | 'stripeSubscriptionStatus' | 'parentName'>> { 
    password?: string;
    confirmPassword?: string;
}


export interface ClassOffering {
    id: string;
    category: string; 
    name: string;
    level: StudentGeneralLevel; 
    iconUrl?: string | null; 
    descriptionShort: string;
    descriptionLong: string;
    duration: string; 
    price: string;
    videoEmbedUrl?: string | null; 
    instructorName: string; 
    instructorBio?: string | null;
    prerequisites?: string[];
    targetPrograms?: ProgramName[]; 
    targetDancerLevels?: DancerLevelName[]; 
    scheduledClassSlots: ScheduledClassSlot[]; 
    createdAt?: string;
    updatedAt?: string;
    capacity: number; 
    enrolledCount: number; 
}

export interface ClassOfferingFormData extends Omit<ClassOffering, 'id' | 'createdAt' | 'updatedAt' | 'scheduledClassSlots' | 'enrolledCount'> {
  scheduledClassSlots: Array<Partial<ScheduledClassSlot> & { tempId?: string }>; 
  capacity: number; 
}


export interface SchoolEvent {
  id: string; 
  date: string; 
  name: string;
  description?: string;
  isHoliday: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface SuggestionSubCategory {
    value: string;
    displayName: string;
}

export interface SuggestionCategoryConfig {
    value: string;
    displayName: string;
    assistantName: string;
    subcategories: SuggestionSubCategory[];
    textFieldLabel: string;
    textFieldPlaceholder: string;
    promptBuilder: (userLevel: string, mainCategoryName: string, subcategoryName: string, userInputText: string) => string;
}

export type PortalView = 'student' | 'adminLogin' | 'adminDashboard';

export interface ClassFilters {
    levels: StudentGeneralLevel[]; 
    instructors: string[];
    searchTerm: string;
    sortBy: string; 
}

export type AbsenceStatus = 'Notified' | 'Justified' | 'Unjustified';

export interface Absence {
  id: string;
  studentId: string;
  studentName: string; 
  classId: string; 
  className: string; 
  classDateTime: string; 
  reason: string;
  notes?: string;
  notificationDate: string; 
  status: AbsenceStatus;
}

export interface CreateAbsencePayload {
  studentId: string;
  studentName: string;
  className: string;
  classId: string; 
  classDateTime: string; 
  reason: string;
  notes?: string;
}


export interface InstructorAvailabilitySlot {
  id: string; 
  dayOfWeek: number; 
  startTime: string; 
  endTime: string;   
}

export interface Instructor { 
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  profilePictureUrl?: string;
  bio?: string;
  specializations: ProgramName[]; 
  availability: InstructorAvailabilitySlot[];
}

export type PermissionKey =
  // Dashboard
  | 'view_dashboard' | 'view_dashboard_financials'
  // User Management
  | 'view_students' | 'manage_students' | 'view_instructors' | 'manage_instructors'
  // Class & Program Management
  | 'manage_programs' | 'manage_class_offerings' | 'manage_schedules'
  // Enrollment & Attendance
  | 'view_enrollments' | 'manage_enrollments' | 'manage_waitlists' | 'view_absences' | 'manage_absences' | 'mark_attendance'
  // Billing & Payments
  | 'process_payments' | 'manage_invoices' | 'manage_subscriptions'
  // Communications
  | 'send_announcements' | 'manage_communication_templates'
  // Reports
  | 'view_all_reports' | 'view_student_reports' | 'view_attendance_reports' | 'view_enrollment_reports' | 'view_financial_reports' | 'view_membership_reports'
  // Settings
  | 'manage_general_settings' | 'manage_calendar_settings' | 'manage_membership_plans' | 'manage_roles_permissions' | 'manage_admin_users';


export interface PermissionDefinition {
  key: PermissionKey;
  name: string;
  description: string;
  category: string; 
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionKey[];
}

export type AdminUserStatus = 'active' | 'inactive' | 'suspended';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId: string; 
  roleName?: string; 
  status: AdminUserStatus;
  createdAt?: string; 
  updatedAt?: string; 
  studioId: string; // Add this line
  stripeAccountId?: string; 
}

export interface AdminUserFormData extends Omit<AdminUser, 'id' | 'createdAt' | 'updatedAt' | 'roleName'> {
    password?: string; 
    confirmPassword?: string; 
}

export interface AdminUserCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  user: AdminUser & { stripeAccountId?: string };
  permissions: PermissionKey[];
}

export interface Program { 
  id: string;
  name: string; 
  ageRange: string;
  hasLevels?: boolean; 
  levels?: string[]; 
}

export type StudentStatus = 'Active' | 'Inactive' | 'Suspended';

export interface Address { 
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface EmergencyContact { 
  name: string;
  phone: string;
  relationship: string;
}

export interface DanceClass { 
  id: string;
  name: string;
  programId: string; 
  level?: string; 
  instructorId: string; 
  schedule: string; 
  capacity: number;
  enrolledCount: number;
  room: string;
}

export interface MembershipPlanDefinition { 
  id: string; 
  name: string; 
  classesPerWeek: number;
  monthlyPrice: number;
  durationMonths?: number; 
  description?: string; 
  stripePriceId?: string;
}


export interface AgedAccountSummary { 
  totalOutstanding: number;
  balanceIncludingCredits: number;
  ageBrackets: {
    label: string; 
    amount: number;
    percentage: number; 
  }[];
  lastRefreshed: string;
}

export interface AlertItem { 
  id: string;
  text: string;
  type: 'critical' | 'info' | 'warning';
  link?: string;
  icon?: React.ReactNode;
}

export interface TodoItem { 
  id: string;
  text: string;
  assignee: 'me' | 'others';
  completed: boolean;
}

export interface RevenueDataPoint { 
  month: string;
  revenue: number;
  priorYearRevenue?: number;
}

export type EnrollmentStatus = 'Enrolled' | 'Waitlisted' | 'Dropped';

export interface Enrollment {
  id: string; 
  studentId: string;
  studentName?: string; 
  classOfferingId: string;
  classOfferingName?: string; 
  enrollmentDate: string; 
  status: EnrollmentStatus;
  waitlistPosition?: number | null; 
}

export interface AttendanceRecord {
  id: string; 
  studentId: string;
  studentName?: string; 
  classOfferingId: string;
  classDateTime: string; 
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
  absenceId?: string; 
}

export interface BusinessHour {
  dayOfWeek: number; 
  isOpen: boolean;
  openTime: string; 
  closeTime: string; 
}

export interface GeneralSettings {
  id: string; 
  academyName: string;
  contactPhone: string;
  contactEmail: string;
  address: Address; 
  logoUrl: string; 
  businessHours: BusinessHour[];
  updatedAt?: string;
}

export interface SchoolTerm {
  id: string; 
  name: string; 
  startDate: string; 
  endDate: string; 
}

export interface StudioRoom {
  id: string; 
  name: string; 
  capacity?: number;
  description?: string;
  color?: string; 
}

export interface CalendarSettings {
  id: string; 
  defaultClassDuration: number; 
  studioTimezone: string; 
  weekStartDay: 0 | 1; 
  terms: SchoolTerm[];
  rooms: StudioRoom[];
  updatedAt?: string;
}

export type AnnouncementCategory = 'Events' | 'Schedules' | 'General' | 'Urgent';

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isImportant: boolean;
  date: string; // ISO string
}

export interface AnnouncementFormData {
  title: string;
  content: string;
  category: AnnouncementCategory;
  isImportant: boolean;
}


// Billing & Payments Module Types
export type PaymentMethod = 'Cash' | 'Credit Card' | 'Bank Transfer' | 'Stripe Subscription' | 'Other';

export interface Payment {
  id: string;
  studentId: string;
  studentName?: string; 
  membershipPlanId: string; 
  membershipPlanName?: string; 
  amountPaid: number;
  paymentDate: string; // ISO Date string YYYY-MM-DD
  paymentMethod: PaymentMethod;
  transactionId?: string; 
  notes?: string;
  invoiceId?: string; 
  processedByUserId?: string; 
  createdAt?: string;
  updatedAt?: string;
}

export interface PaymentFormData extends Omit<Payment, 'id' | 'studentName' | 'membershipPlanName' | 'invoiceId' | 'processedByUserId' | 'createdAt' | 'updatedAt' | 'studentId' | 'membershipPlanId'> {
  // studentId and membershipPlanId will be part of the context/path, not direct form fields for this specific form.
}

// Invoice Types
export type InvoiceStatus = 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Void';

export interface InvoiceItem {
  id: string; 
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number; 
}

export interface Invoice {
  id: string;
  studentId: string;
  studentName?: string;
  membershipPlanId?: string;
  membershipPlanName?: string;
  paymentId?: string; 
  invoiceNumber: string; 
  issueDate: string; 
  dueDate: string; 
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number; 
  totalAmount: number;
  amountPaid: number;
  amountDue: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Stripe Specific Types (Simplified for Frontend Mocking)
export interface MockStripeSubscription {
  id: string; // Stripe Subscription ID (e.g., sub_xxxx)
  status: 'active' | 'past_due' | 'unpaid' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing';
  stripeCustomerId: string;
  items: {
    data: {
      price: {
        id: string; // Stripe Price ID (e.g., price_xxxx)
        // You might add product ID here if needed: product: string; (Stripe Product ID)
      };
      quantity?: number;
    }[];
  };
  current_period_end: number; // Unix timestamp
  clientSecret?: string | null;
  cancel_at_period_end?: boolean;
}

// Financial BI Dashboard Types
export interface PlanMixItem {
  name: string;
  value: number; // For recharts
}

export interface FinancialMetrics {
  mrr: number;
  activeSubscribers: number;
  arpu: number;
  churnRate: number;
  ltv: number;
  planMix: PlanMixItem[];
  paymentFailureRate: number;
}


// Prospect Management Types
export type ProspectStatus = 'PENDING_EVALUATION' | 'CONVERTED' | 'REJECTED';

export interface Prospect {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth: string;
  status: ProspectStatus;
  auditionPaymentId: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProspectFormData extends Omit<Prospect, 'id' | 'status' | 'auditionPaymentId' | 'createdAt' | 'updatedAt'> {
  // Add any other specific form fields if needed
}

export interface ApproveProspectDto {
    program: ProgramName | null;
    dancerLevel: DancerLevelName | null;
}

export interface Parent {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: Address;
    username: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface ParentFormData extends Omit<Parent, 'id' | 'createdAt' | 'updatedAt'> {
    password?: string;
    confirmPassword?: string;
}


// ===== Client Portal Specific Types =====

// This represents the user logging into the client portal. It can be a Parent or an adult Student.
export interface ClientUser {
    id: string;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    userType: 'parent' | 'student'; // To distinguish the logged-in user's role
}

// This is the full profile returned by the /portal/me endpoint
export interface ClientProfileResponse {
    user: ClientUser;
    // For parents, this list contains their children's profiles.
    // For adult students, this list contains their own profile.
    students: Student[];
}

export interface ClientLoginResponse {
  access_token: string;
  profile: ClientProfileResponse;
}

export interface StripeProductSettings {
  enrollmentProductId: string;
  enrollmentPriceId: string;
  auditionProductId: string;
  auditionPriceId: string;
}

export interface Studio {
  id: string;
  name: string;
  stripeAccountId: string | null;
  // Add other fields if they are relevant for frontend consumption
}
