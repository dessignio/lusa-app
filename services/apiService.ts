

import { API_ENDPOINTS, API_BASE_URL } from '../constants';
import {
  Student, Instructor, Role, MembershipPlanDefinition, StudentStatus, Program, RevenueDataPoint, AlertItem, TodoItem, AgedAccountSummary,
  AdminUser, AdminUserFormData, AdminUserStatus, ClassOffering, ClassOfferingFormData,
  Enrollment, Absence, CreateAbsencePayload, AttendanceRecord, AbsenceStatus, GeneralSettings, CalendarSettings, SchoolEvent,
  Announcement, AnnouncementFormData,
  Payment, PaymentFormData, Invoice, MockStripeSubscription, StudentFormData, FinancialMetrics, AdminUserCredentials, LoginResponse,
  Prospect, ProspectFormData, ApproveProspectDto, Parent, ParentFormData, ClientLoginResponse, ClientProfileResponse,
  StripeProductSettings
} from '../types';
import { showToast } from '../utils';

// Generic request helper
async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const adminToken = localStorage.getItem('authToken');
  const clientToken = localStorage.getItem('clientAuthToken');
  const token = clientToken || adminToken; // Prioritize client token if present

  const defaultHeaders: HeadersInit = {
    'Accept': 'application/json',
  };
  
  if (token) {
    defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  if (options?.body && !(options.body instanceof FormData)) {
    defaultHeaders['Content-Type'] = 'application/json';
  }

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options?.headers,
    },
  };

  try {
    const response = await fetch(url, config);

    if (!response.ok) {
      let errorJson;
      let errorMessage = `HTTP error ${response.status}`;
      try {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          errorJson = await response.json();
          if (errorJson && errorJson.message) {
            // NestJS validation pipe returns message as an array, handle this
            errorMessage = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
          }
        } else {
          const errorText = await response.text();
          errorMessage = errorText.substring(0, 100) || response.statusText;
        }
      } catch (e) {
        console.error(`Error parsing error response body from ${url}:`, e);
      }
      throw new Error(errorMessage);
    }

    if (response.status === 204) { // No Content
      return undefined as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json() as T;
    } else {
      const responseText = await response.text();
      console.warn(`Expected JSON response but received ${contentType || 'unknown'} from ${url}. Response text: ${responseText.substring(0, 100)}...`);
      // For some cases like PDF download, we might not get JSON. We shouldn't throw error here if response is OK.
      // We will assume that if it's not JSON, the caller handles the blob or text response directly.
      // This generic function is now more flexible. We return the text as a fallback for non-JSON ok responses.
      return responseText as T;
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Don't log expected "not found" errors that are handled by calling functions
    if (!errorMessage.includes('No active Stripe subscription found')) {
      console.error(`API Request Error for ${url}: ${errorMessage}`);
    }
    throw new Error(errorMessage || 'Unknown API request error');
  }
}

// --- Client Portal API Functions ---
export const clientLogin = (credentials: AdminUserCredentials): Promise<ClientLoginResponse> => {
  return request<ClientLoginResponse>(API_ENDPOINTS.CLIENT_LOGIN, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const getClientProfile = (): Promise<ClientProfileResponse> => {
  return request<ClientProfileResponse>(API_ENDPOINTS.CLIENT_PROFILE_ME);
};


// Auth Service Functions
export const loginUser = (credentials: AdminUserCredentials): Promise<LoginResponse> => {
  return request<LoginResponse>(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};


// Student API Service Functions
export const getStudents = (): Promise<Student[]> => {
  return request<Student[]>(API_ENDPOINTS.STUDENTS);
};

export const getStudentById = (studentId: string): Promise<Student> => {
  return request<Student>(`${API_ENDPOINTS.STUDENTS}/${studentId}`);
};

export const createStudent = (studentData: StudentFormData): Promise<Student> => {
  // Password is included in StudentFormData, backend will hash it.
  // Backend handles derived fields like membershipType, membershipPlanName, renewalDate.
  return request<Student>(API_ENDPOINTS.STUDENTS, {
    method: 'POST',
    body: JSON.stringify(studentData),
  });
};

export const updateStudent = (studentId: string, studentData: Partial<StudentFormData>): Promise<Student> => {
  // Backend handles derived fields based on planId/startDate if present in payload.
  return request<Student>(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(studentData),
  });
};

export const deleteStudent = (studentId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
    method: 'DELETE',
  });
};

export const bulkUpdateStudentDetails = async (
  studentIds: string[],
  updates: Partial<Pick<Student, 'membershipPlanId' | 'status' | 'program' | 'dancerLevel' | 'membershipStartDate'>>
): Promise<{ updatedCount: number }> => {
    return request<{ updatedCount: number }>(API_ENDPOINTS.STUDENTS_BULK_UPDATE, {
        method: 'POST', // Assuming POST for bulk operations
        body: JSON.stringify({ ids: studentIds, updates }),
    });
};

// Parent API Service Functions
export const getParents = (): Promise<Parent[]> => {
  return request<Parent[]>(API_ENDPOINTS.PARENTS);
};

export const getParentById = (parentId: string): Promise<Parent> => {
  return request<Parent>(`${API_ENDPOINTS.PARENTS}/${parentId}`);
};

export const createParent = (parentData: ParentFormData): Promise<Parent> => {
  return request<Parent>(API_ENDPOINTS.PARENTS, {
    method: 'POST',
    body: JSON.stringify(parentData),
  });
};

export const updateParent = (parentId: string, parentData: Partial<ParentFormData>): Promise<Parent> => {
  return request<Parent>(`${API_ENDPOINTS.PARENTS}/${parentId}`, {
    method: 'PATCH',
    body: JSON.stringify(parentData),
  });
};

export const deleteParent = (parentId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.PARENTS}/${parentId}`, {
    method: 'DELETE',
  });
};


// Instructor API Service Functions
export const getInstructors = (): Promise<Instructor[]> => {
  return request<Instructor[]>(API_ENDPOINTS.INSTRUCTORS);
};

export const getInstructorById = (instructorId: string): Promise<Instructor> => {
  return request<Instructor>(`${API_ENDPOINTS.INSTRUCTORS}/${instructorId}`);
};

export const createInstructor = (instructorData: Partial<Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Instructor> => {
  return request<Instructor>(API_ENDPOINTS.INSTRUCTORS, {
    method: 'POST',
    body: JSON.stringify(instructorData),
  });
};

export const updateInstructor = (instructorId: string, instructorData: Partial<Omit<Instructor, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Instructor> => {
  return request<Instructor>(`${API_ENDPOINTS.INSTRUCTORS}/${instructorId}`, {
    method: 'PATCH',
    body: JSON.stringify(instructorData),
  });
};

export const deleteInstructor = (instructorId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.INSTRUCTORS}/${instructorId}`, {
    method: 'DELETE',
  });
};

// Role API Service Functions
export const getRoles = (): Promise<Role[]> => {
  return request<Role[]>(API_ENDPOINTS.ROLES);
};

export const getRoleById = (roleId: string): Promise<Role> => {
  return request<Role>(`${API_ENDPOINTS.ROLES}/${roleId}`);
};

export const createRole = (roleData: Partial<Omit<Role, 'id'>>): Promise<Role> => {
  return request<Role>(API_ENDPOINTS.ROLES, {
    method: 'POST',
    body: JSON.stringify(roleData),
  });
};

export const updateRole = (roleId: string, roleData: Partial<Omit<Role, 'id'>>): Promise<Role> => {
  return request<Role>(`${API_ENDPOINTS.ROLES}/${roleId}`, {
    method: 'PATCH',
    body: JSON.stringify(roleData),
  });
};

export const deleteRole = (roleId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.ROLES}/${roleId}`, {
    method: 'DELETE',
  });
};

// Admin User API Service Functions
export const getAdminUsers = (): Promise<AdminUser[]> => {
  return request<AdminUser[]>(API_ENDPOINTS.ADMIN_USERS);
};

export const getAdminUserById = (adminUserId: string): Promise<AdminUser> => {
  return request<AdminUser>(`${API_ENDPOINTS.ADMIN_USERS}/${adminUserId}`);
};

export const createAdminUser = (adminUserData: AdminUserFormData): Promise<AdminUser> => {
  return request<AdminUser>(API_ENDPOINTS.ADMIN_USERS, {
    method: 'POST',
    body: JSON.stringify(adminUserData),
  });
};

export const updateAdminUser = (adminUserId: string, adminUserData: Partial<AdminUserFormData>): Promise<AdminUser> => {
  return request<AdminUser>(`${API_ENDPOINTS.ADMIN_USERS}/${adminUserId}`, {
    method: 'PATCH',
    body: JSON.stringify(adminUserData),
  });
};

export const deleteAdminUser = (adminUserId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.ADMIN_USERS}/${adminUserId}`, {
    method: 'DELETE',
  });
};

export const bulkUpdateAdminUsersStatus = (adminUserIds: string[], status: AdminUserStatus): Promise<{ updatedCount: number }> => {
  // Assuming backend endpoint like /admin-users/bulk-update-status
  return request<{ updatedCount: number }>(`${API_ENDPOINTS.ADMIN_USERS}/bulk-update-status`, {
    method: 'POST',
    body: JSON.stringify({ ids: adminUserIds, status }),
  });
};

export const bulkUpdateAdminUsersRole = (adminUserIds: string[], roleId: string): Promise<{ updatedCount: number }> => {
  // Assuming backend endpoint like /admin-users/bulk-update-role
  return request<{ updatedCount: number }>(`${API_ENDPOINTS.ADMIN_USERS}/bulk-update-role`, {
    method: 'POST',
    body: JSON.stringify({ ids: adminUserIds, roleId }),
  });
};


// --- Class Offering API Service Functions ---
export const getClassOfferings = (): Promise<ClassOffering[]> => {
    return request<ClassOffering[]>(API_ENDPOINTS.CLASS_OFFERINGS);
};

export const getClassOfferingById = (offeringId: string): Promise<ClassOffering> => {
  return request<ClassOffering>(`${API_ENDPOINTS.CLASS_OFFERINGS}/${offeringId}`);
};

export const createClassOffering = (offeringData: ClassOfferingFormData): Promise<ClassOffering> => {
  return request<ClassOffering>(API_ENDPOINTS.CLASS_OFFERINGS, {
    method: 'POST',
    body: JSON.stringify(offeringData),
  });
};

export const updateClassOffering = (offeringId: string, offeringData: Partial<ClassOfferingFormData>): Promise<ClassOffering> => {
  return request<ClassOffering>(`${API_ENDPOINTS.CLASS_OFFERINGS}/${offeringId}`, {
    method: 'PATCH',
    body: JSON.stringify(offeringData),
  });
};

export const deleteClassOffering = (offeringId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.CLASS_OFFERINGS}/${offeringId}`, {
    method: 'DELETE',
  });
};

// --- Program API Service Functions ---
export const getPrograms = async (): Promise<Program[]> => {
  return request<Program[]>(API_ENDPOINTS.PROGRAMS);
};

export const getProgramById = async (programId: string): Promise<Program> => {
  return request<Program>(`${API_ENDPOINTS.PROGRAMS}/${programId}`);
};

export const createProgram = async (programData: Partial<Omit<Program, 'id'>>): Promise<Program> => {
  return request<Program>(API_ENDPOINTS.PROGRAMS, {
    method: 'POST',
    body: JSON.stringify(programData),
  });
};

export const updateProgram = async (programId: string, programData: Partial<Omit<Program, 'id' | 'name'>>): Promise<Program> => {
  return request<Program>(`${API_ENDPOINTS.PROGRAMS}/${programId}`, {
    method: 'PATCH',
    body: JSON.stringify(programData),
  });
};

export const deleteProgram = async (programId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.PROGRAMS}/${programId}`, {
    method: 'DELETE',
  });
};

// --- Membership Plan API Service Functions ---
// Note: Stripe Price ID is now handled by backend on create.
export const getMembershipPlans = (): Promise<MembershipPlanDefinition[]> => {
  return request<MembershipPlanDefinition[]>(API_ENDPOINTS.MEMBERSHIP_PLANS);
};

export const getMembershipPlanById = (planId: string): Promise<MembershipPlanDefinition> => {
  return request<MembershipPlanDefinition>(`${API_ENDPOINTS.MEMBERSHIP_PLANS}/${planId}`);
};

// When creating, frontend sends basic plan details. Backend creates Stripe Product/Price and saves stripePriceId.
export const createMembershipPlan = (planData: Omit<MembershipPlanDefinition, 'id' | 'stripePriceId'>): Promise<MembershipPlanDefinition> => {
  return request<MembershipPlanDefinition>(API_ENDPOINTS.MEMBERSHIP_PLANS, {
    method: 'POST',
    body: JSON.stringify(planData),
  });
};

export const updateMembershipPlan = (planId: string, planData: Partial<Omit<MembershipPlanDefinition, 'id'>>): Promise<MembershipPlanDefinition> => {
  return request<MembershipPlanDefinition>(`${API_ENDPOINTS.MEMBERSHIP_PLANS}/${planId}`, {
    method: 'PATCH',
    body: JSON.stringify(planData),
  });
};

export const deleteMembershipPlan = (planId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.MEMBERSHIP_PLANS}/${planId}`, {
    method: 'DELETE',
  });
};

// Dashboard Data
export const getDashboardRevenueData = (): Promise<RevenueDataPoint[]> => {
  return request<RevenueDataPoint[]>(API_ENDPOINTS.DASHBOARD_REVENUE);
};

export const getDashboardKeyMetrics = async (): Promise<{
  enrollments: { total: number; percentage: number; drops: number };
  actives: { families: number; students: number; classes: number; staff: number };
  registrations: { portalLast7Days: number; online: number; toBeProcessed: number };
}> => {
  return request<any>(API_ENDPOINTS.DASHBOARD_METRICS);
};

export const getDashboardAlerts = (): Promise<AlertItem[]> => {
  return request<AlertItem[]>(API_ENDPOINTS.DASHBOARD_ALERTS);
};

export const getDashboardTodos = (): Promise<TodoItem[]> => {
  return request<TodoItem[]>(API_ENDPOINTS.DASHBOARD_TODOS);
};

export const getDashboardAgedAccounts = (): Promise<AgedAccountSummary> => {
  return request<AgedAccountSummary>(API_ENDPOINTS.DASHBOARD_AGED_ACCOUNTS);
};

// --- Enrollment API Service Functions ---
export const getEnrollmentsByClass = (classOfferingId: string): Promise<Enrollment[]> => {
  return request<Enrollment[]>(`${API_ENDPOINTS.ENROLLMENTS}?classOfferingId=${classOfferingId}`);
};

export const enrollStudentInClass = async (studentId: string, classOfferingId: string): Promise<Enrollment> => {
  return request<Enrollment>(API_ENDPOINTS.ENROLLMENTS, {
    method: 'POST',
    body: JSON.stringify({ studentId, classOfferingId, status: 'Enrolled' }), // Backend handles enrollmentDate default
  });
};

export const unenrollStudentFromClass = async (studentId: string, classOfferingId: string): Promise<void> => {
  // Using specific endpoint structure from constants.ts and backend
  return request<void>(`${API_ENDPOINTS.ENROLLMENTS}/student/${studentId}/class/${classOfferingId}`, {
    method: 'DELETE',
  });
};

// --- Absence API Service Functions ---
export const getAbsences = (filters?: { studentId?: string; classId?: string; date?: string }): Promise<Absence[]> => {
  const queryParams = new URLSearchParams();
  if (filters?.studentId) queryParams.append('studentId', filters.studentId);
  if (filters?.classId) queryParams.append('classId', filters.classId);
  if (filters?.date) queryParams.append('date', filters.date);
  return request<Absence[]>(`${API_ENDPOINTS.ABSENCES}?${queryParams.toString()}`);
};

export const createAbsence = (payload: CreateAbsencePayload): Promise<Absence> => {
  return request<Absence>(API_ENDPOINTS.ABSENCES, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const updateAbsence = (absenceId: string, payload: Partial<CreateAbsencePayload & {status: AbsenceStatus}>): Promise<Absence> => {
  return request<Absence>(`${API_ENDPOINTS.ABSENCES}/${absenceId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

export const deleteAbsence = (absenceId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.ABSENCES}/${absenceId}`, {
    method: 'DELETE',
  });
};

// --- Attendance API Service Functions ---
export const getAttendanceRecords = (classOfferingId: string, date: string): Promise<AttendanceRecord[]> => {
  return request<AttendanceRecord[]>(`${API_ENDPOINTS.ATTENDANCE}?classOfferingId=${classOfferingId}&date=${date}`);
};

// Helper function to get all attendance records for a student within a date range.
// NOTE: This is INEFFICIENT as it makes multiple API calls. A dedicated backend endpoint would be better.
export const getAttendanceRecordsByStudent = async (student: Student, daysToLookBack = 30): Promise<AttendanceRecord[]> => {
  if (!student || !student.enrolledClasses || student.enrolledClasses.length === 0) {
    return [];
  }
  
  const allRecords: AttendanceRecord[] = [];
  const today = new Date();
  
  const promises: Promise<AttendanceRecord[]>[] = [];

  for (let i = 0; i < daysToLookBack; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateString = date.toISOString().split('T')[0];
    
    student.enrolledClasses.forEach(classId => {
      promises.push(getAttendanceRecords(classId, dateString));
    });
  }

  try {
    const results = await Promise.all(promises);
    const flattenedResults = results.flat();
    // Filter again to be sure we only have records for the requested student
    return flattenedResults.filter(record => record.studentId === student.id);
  } catch(error) {
    console.error("Error fetching attendance records for student:", error);
    showToast("Could not fetch full attendance history.", "error");
    return [];
  }
};


// For single attendance mark (upsert logic on backend)
export const markAttendance = (payload: Omit<AttendanceRecord, 'id' | 'studentName'>): Promise<AttendanceRecord> => {
  return request<AttendanceRecord>(API_ENDPOINTS.ATTENDANCE, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const markBulkAttendance = (payloads: Omit<AttendanceRecord, 'id' | 'studentName'>[]): Promise<AttendanceRecord[]> => {
  return request<AttendanceRecord[]>(`${API_ENDPOINTS.ATTENDANCE}/bulk`, {
    method: 'POST',
    body: JSON.stringify({ records: payloads }),
  });
};

// --- School Event API Service Functions ---
export const getSchoolEvents = (): Promise<SchoolEvent[]> => {
  return request<SchoolEvent[]>(API_ENDPOINTS.SCHOOL_EVENTS);
};

export const createSchoolEvent = (eventData: Omit<SchoolEvent, 'id'>): Promise<SchoolEvent> => {
  return request<SchoolEvent>(API_ENDPOINTS.SCHOOL_EVENTS, {
    method: 'POST',
    body: JSON.stringify(eventData),
  });
};

export const updateSchoolEvent = (eventId: string, eventData: Partial<Omit<SchoolEvent, 'id'>>): Promise<SchoolEvent> => {
  return request<SchoolEvent>(`${API_ENDPOINTS.SCHOOL_EVENTS}/${eventId}`, {
    method: 'PATCH',
    body: JSON.stringify(eventData),
  });
};

export const deleteSchoolEvent = (eventId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.SCHOOL_EVENTS}/${eventId}`, {
    method: 'DELETE',
  });
};

// --- Settings API Service Functions ---
export const getGeneralSettings = (): Promise<GeneralSettings> => {
  return request<GeneralSettings>(API_ENDPOINTS.GENERAL_SETTINGS);
};

export const updateGeneralSettings = (settingsData: Omit<GeneralSettings, 'id' | 'updatedAt'>): Promise<GeneralSettings> => {
  return request<GeneralSettings>(API_ENDPOINTS.GENERAL_SETTINGS, { // Assuming PUT for full update
    method: 'PUT',
    body: JSON.stringify(settingsData),
  });
};

export const getCalendarSettings = (): Promise<CalendarSettings> => {
  return request<CalendarSettings>(API_ENDPOINTS.CALENDAR_SETTINGS);
};

export const updateCalendarSettings = (settingsData: Omit<CalendarSettings, 'id' | 'updatedAt'>): Promise<CalendarSettings> => {
  return request<CalendarSettings>(API_ENDPOINTS.CALENDAR_SETTINGS, { // Assuming PUT
    method: 'PUT',
    body: JSON.stringify(settingsData),
  });
};

// --- Announcement API Service Functions ---
export const getAnnouncements = (): Promise<Announcement[]> => {
  return request<Announcement[]>(API_ENDPOINTS.ANNOUNCEMENTS);
};

export const createAnnouncement = (data: AnnouncementFormData): Promise<Announcement> => {
  return request<Announcement>(API_ENDPOINTS.ANNOUNCEMENTS, {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

export const updateAnnouncement = (id: string, data: Partial<AnnouncementFormData>): Promise<Announcement> => {
  return request<Announcement>(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

export const deleteAnnouncement = (id: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.ANNOUNCEMENTS}/${id}`, {
    method: 'DELETE',
  });
};


// --- Billing & Payments API Service Functions ---
// This function updates the *internal* student membership record, not Stripe.
export const updateStudentMembership = async (studentId: string, membershipPlanId: string | null, membershipStartDate: string | null): Promise<Student> => {
  const payload: { membershipPlanId: string | null; membershipStartDate?: string | null } = { membershipPlanId };
  if (membershipStartDate !== undefined) { // Ensure membershipStartDate is only included if it has a value
    payload.membershipStartDate = membershipStartDate;
  }
  // Corrected to use the general student update endpoint
  return request<Student>(`${API_ENDPOINTS.STUDENTS}/${studentId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
};

// Records a manual payment, backend might create an invoice.
export const recordPayment = async (studentId: string, membershipPlanId: string, paymentData: PaymentFormData): Promise<Payment> => {
  const payload = {
    studentId,
    membershipPlanId, // Backend will use this to find plan details for invoice item if needed
    ...paymentData,
  };
  return request<Payment>(API_ENDPOINTS.PAYMENTS, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

export const getPaymentsByStudentId = (studentId: string): Promise<Payment[]> => {
  return request<Payment[]>(`${API_ENDPOINTS.PAYMENTS}?studentId=${studentId}`);
};

export const getInvoicesByStudentId = (studentId: string): Promise<Invoice[]> => {
  return request<Invoice[]>(`${API_ENDPOINTS.INVOICES}?studentId=${studentId}`);
};

export const emailInvoice = (invoiceId: string): Promise<void> => {
  return request<void>(API_ENDPOINTS.EMAIL_INVOICE.replace(':invoiceId', invoiceId), {
    method: 'POST',
  });
};

export const downloadInvoicePdf = async (invoiceId: string): Promise<void> => {
  const url = `${API_ENDPOINTS.INVOICES}/${invoiceId}/pdf`;
  try {
    const token = localStorage.getItem('authToken');
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      // For both client-side and server-side errors, try to parse a meaningful message.
      let errorDetail = `Failed to download invoice (Error: ${response.status} ${response.statusText})`;
      try {
        const errorJson = await response.json();
        if (errorJson && errorJson.message) {
          // Use the specific message from the server if available
          errorDetail = Array.isArray(errorJson.message) ? errorJson.message.join(', ') : errorJson.message;
        }
      } catch (e) {
        // Ignore if parsing fails, the generic errorDetail is a good fallback.
      }
      throw new Error(errorDetail);
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/pdf")) {
      throw new Error(`Expected a PDF file but received an unexpected file type.`);
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `invoice-${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unknown error occurred during PDF download.';
    // Log the actual error for debugging, but show the (potentially more friendly) message in the toast.
    console.error(`Download PDF error for invoice ${invoiceId} from URL ${url}:`, error);
    showToast(message, 'error');
  }
};


// --- Stripe Subscription API ---
// All Stripe operations are now proxied through the backend.
export const createStripeSubscription = async (
  studentId: string, 
  priceId: string, // This is the Stripe Price ID
  paymentMethodId: string,
  existingStripeCustomerId?: string | null
): Promise<MockStripeSubscription> => { // Frontend still uses MockStripeSubscription for typing the response
  return request<MockStripeSubscription>(API_ENDPOINTS.STRIPE_SUBSCRIPTIONS, {
    method: 'POST',
    body: JSON.stringify({ studentId, priceId, paymentMethodId, existingStripeCustomerId }),
  });
};

export const updateStripeSubscription = async (
    subscriptionId: string,
    newPriceId: string
): Promise<MockStripeSubscription> => {
    return request<MockStripeSubscription>(`${API_ENDPOINTS.STRIPE_SUBSCRIPTIONS}/${subscriptionId}/change-plan`, {
        method: 'PATCH',
        body: JSON.stringify({ newPriceId }),
    });
};

export const updatePaymentMethod = async (
    studentId: string,
    paymentMethodId: string
): Promise<void> => {
    return request<void>(`${API_ENDPOINTS.STRIPE_STUDENT_BASE}/${studentId}/update-payment-method`, {
        method: 'POST',
        body: JSON.stringify({ paymentMethodId }),
    });
};

export const cancelStripeSubscription = async (studentId: string, subscriptionId: string): Promise<MockStripeSubscription | null> => {
  return request<MockStripeSubscription | null>(API_ENDPOINTS.STRIPE_SUBSCRIPTION_CANCEL.replace(':subscriptionId', subscriptionId), {
    method: 'DELETE', // Changed to DELETE, or use POST with studentId in body if preferred by backend
    body: JSON.stringify({ studentId }) // Send studentId for verification on backend
  });
};

export const getStudentStripeSubscription = async (studentId: string): Promise<MockStripeSubscription | null> => {
  try {
    return await request<MockStripeSubscription | null>(API_ENDPOINTS.STUDENT_STRIPE_SUBSCRIPTION.replace(':studentId', studentId));
  } catch (error) {
    // Check if the error message indicates "No active Stripe subscription found" (or similar for 404)
    // This message comes from the backend when it throws a NotFoundException
    if (error instanceof Error && error.message.includes('No active Stripe subscription found')) {
      return null; // Gracefully return null for this specific "not found" case
    }
    throw error; // Re-throw other errors
  }
};

export const getFinancialMetrics = (): Promise<FinancialMetrics> => {
  return request<FinancialMetrics>(API_ENDPOINTS.STRIPE_METRICS);
};

export const createAuditionPaymentIntent = (prospectData: Pick<ProspectFormData, 'firstName' | 'lastName' | 'email'>): Promise<{ clientSecret: string }> => {
  const payload = {
    name: `${prospectData.firstName} ${prospectData.lastName}`,
    email: prospectData.email,
  };
  return request<{ clientSecret: string }>(API_ENDPOINTS.STRIPE_CREATE_AUDITION_PAYMENT, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
};

// --- Stripe Connect API Functions ---

export const getStripeAccountStatus = (studioId: string): Promise<{
  status: 'unverified' | 'incomplete' | 'active';
  details_submitted: boolean;
  payouts_enabled: boolean;
  url?: string;
}> => {
  const url = API_ENDPOINTS.STRIPE_CONNECT_ACCOUNT_STATUS.replace(':studioId', studioId);
  return request<{
    status: 'unverified' | 'incomplete' | 'active';
    details_submitted: boolean;
    payouts_enabled: boolean;
    url?: string;
  }>(url);
};

export const createStripeAccountLink = (): Promise<{ url: string }> => {
  return request<{ url: string }>(API_ENDPOINTS.STRIPE_CONNECT_ACCOUNT_LINK, {
    method: 'POST',
  });
};


// Prospect API Functions
export const getProspects = (): Promise<Prospect[]> => {
  return request<Prospect[]>(API_ENDPOINTS.PROSPECTS);
};

export const getProspectById = (prospectId: string): Promise<Prospect> => {
  return request<Prospect>(`${API_ENDPOINTS.PROSPECTS}/${prospectId}`);
};

export const createProspect = (prospectData: ProspectFormData, auditionPaymentId: string): Promise<Prospect> => {
  return request<Prospect>(API_ENDPOINTS.PROSPECTS, {
    method: 'POST',
    body: JSON.stringify({ ...prospectData, auditionPaymentId }),
  });
};

export const updateProspect = (prospectId: string, prospectData: Partial<ProspectFormData>): Promise<Prospect> => {
  return request<Prospect>(`${API_ENDPOINTS.PROSPECTS}/${prospectId}`, {
    method: 'PATCH',
    body: JSON.stringify(prospectData),
  });
};

export const deleteProspect = (prospectId: string): Promise<void> => {
  return request<void>(`${API_ENDPOINTS.PROSPECTS}/${prospectId}`, {
    method: 'DELETE',
  });
};

export const approveProspect = (prospectId: string, approvalData: ApproveProspectDto): Promise<Student> => {
  const url = API_ENDPOINTS.APPROVE_PROSPECT.replace(':prospectId', prospectId);
  return request<Student>(url, {
    method: 'POST',
    body: JSON.stringify(approvalData),
  });
};

// --- Stripe Settings API ---

export const getStripeSettings = async (): Promise<StripeProductSettings & { publicKey: string }> => {
  return request<StripeProductSettings & { publicKey: string }>(API_ENDPOINTS.SETTINGS_STRIPE);
};

export const updateStripeSettings = async (settings: Partial<StripeProductSettings & { publicKey: string }>): Promise<void> => {
  return request<void>(API_ENDPOINTS.SETTINGS_STRIPE, {
    method: 'POST',
    body: JSON.stringify(settings),
  });
};

