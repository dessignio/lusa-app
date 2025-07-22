import React, { Suspense } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

// Admin Components
import Layout from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ExclamationTriangleIcon } from './components/icons';

// Client Portal Components
import PortalLayout from './pages/portal/PortalLayout';
import { ClientAuthProvider, useClientAuth } from './contexts/ClientAuthContext';

// Global Contexts
import { NotificationProvider } from './contexts/NotificationContext';

// --- Lazy Load Page Components ---

// Admin Pages
const DashboardPage = React.lazy(() => import('./pages/DashboardPage'));
const UserManagementPage = React.lazy(() => import('./pages/UserManagementPage'));
const ClassManagementPage = React.lazy(() => import('./pages/ClassManagementPage'));
const EnrollmentPage = React.lazy(() => import('./pages/EnrollmentPage'));
const BillingPage = React.lazy(() => import('./pages/BillingPage'));
const CommunicationsPage = React.lazy(() => import('./pages/CommunicationsPage'));
const ReportsPage = React.lazy(() => import('./pages/ReportsPage'));
const SettingsPage = React.lazy(() => import('./pages/SettingsPage'));
const LoginPage = React.lazy(() => import('./pages/LoginPage'));

// User Pages
const StudentListPage = React.lazy(() => import('./pages/users/StudentListPage'));
const StudentFormPage = React.lazy(() => import('./pages/users/StudentFormPage'));
const InstructorListPage = React.lazy(() => import('./pages/users/InstructorListPage'));
const InstructorFormPage = React.lazy(() => import('./pages/users/InstructorFormPage'));
const ProspectListPage = React.lazy(() => import('./pages/users/ProspectListPage'));
const ProspectFormPage = React.lazy(() => import('./pages/users/ProspectFormPage'));
const ParentListPage = React.lazy(() => import('./pages/users/ParentListPage'));
const ParentFormPage = React.lazy(() => import('./pages/users/ParentFormPage'));

// Class Pages
const ProgramListPage = React.lazy(() => import('./pages/classes/ProgramListPage'));
const ProgramFormPage = React.lazy(() => import('./pages/classes/ProgramFormPage'));
const ClassOfferingListPage = React.lazy(() => import('./pages/classes/ClassOfferingListPage'));
const ClassOfferingFormPage = React.lazy(() => import('./pages/classes/ClassOfferingFormPage'));
const SchedulingPage = React.lazy(() => import('./pages/classes/SchedulingPage'));
const ClassRosterPage = React.lazy(() => import('./pages/enrollments/ClassRosterPage'));

// Settings Pages
const RoleListPage = React.lazy(() => import('./pages/settings/RoleListPage'));
const RoleFormPage = React.lazy(() => import('./pages/settings/RoleFormPage'));
const AdminUserListPage = React.lazy(() => import('./pages/settings/AdminUserListPage'));
const AdminUserFormPage = React.lazy(() => import('./pages/settings/AdminUserFormPage'));
const MembershipPlanListPage = React.lazy(() => import('./pages/settings/MembershipPlanListPage'));
const MembershipPlanFormPage = React.lazy(() => import('./pages/settings/MembershipPlanFormPage'));
const GeneralSettingsPage = React.lazy(() => import('./pages/settings/GeneralSettingsPage'));
const CalendarSettingsPage = React.lazy(() => import('./pages/settings/CalendarSettingsPage'));
const PaymentSettingsPage = React.lazy(() => import('./pages/settings/PaymentSettingsPage'));

// Report Pages
const NewStudentsReportPage = React.lazy(() => import('./pages/reports/NewStudentsReportPage'));
const StudentDemographicsReportPage = React.lazy(() => import('./pages/reports/StudentDemographicsReportPage'));
const AttendanceByClassReportPage = React.lazy(() => import('./pages/reports/AttendanceByClassReportPage'));
const AttendanceByStudentReportPage = React.lazy(() => import('./pages/reports/AttendanceByStudentReportPage'));
const AbsencesByClassReportPage = React.lazy(() => import('./pages/reports/AbsencesByClassReportPage'));
const AbsencesByStudentReportPage = React.lazy(() => import('./pages/reports/AbsencesByStudentReportPage'));
const EnrollmentByProgramReportPage = React.lazy(() => import('./pages/reports/EnrollmentByProgramReportPage'));
const EnrollmentByClassReportPage = React.lazy(() => import('./pages/reports/EnrollmentByClassReportPage'));
const FinancialPaymentsReportPage = React.lazy(() => import('./pages/reports/FinancialPaymentsReportPage'));
const FinancialDashboardPage = React.lazy(() => import('./pages/reports/FinancialDashboardPage'));
const MembershipPlanDistributionPage = React.lazy(() => import('./pages/reports/MembershipPlanDistributionPage'));
const StudentStatusReportPage = React.lazy(() => import('./pages/reports/StudentStatusReportPage'));
const AttendanceByInstructorReportPage = React.lazy(() => import('./pages/reports/AttendanceByInstructorReportPage'));

// Client Portal Pages
const ClientLoginPage = React.lazy(() => import('./pages/portal/ClientLoginPage'));
const PortalDashboardPage = React.lazy(() => import('./pages/portal/DashboardPage'));
const PortalSchedulePage = React.lazy(() => import('./pages/portal/SchedulePage'));
const PortalAccountPage = React.lazy(() => import('./pages/portal/AccountPage'));
const PortalAnnouncementsPage = React.lazy(() => import('./pages/portal/AnnouncementsPage'));
const PortalAttendancePage = React.lazy(() => import('./pages/portal/AttendancePage'));
const StudentSelectorPage = React.lazy(() => import('./pages/portal/StudentSelectorPage'));

// Scanner Page
const AttendanceScannerPage = React.lazy(() => import('./pages/AttendanceScannerPage'));


// --- Suspense Fallback Component ---
const SuspenseFallback: React.FC = () => (
    <div className="flex justify-center items-center h-full w-full p-10">
        <div className="text-center">
            <svg className="animate-spin h-8 w-8 text-brand-primary mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-2 text-brand-text-secondary">Loading Page...</p>
        </div>
    </div>
);


// --- Admin Access Control ---
const AdminAccessDeniedPage: React.FC = () => {
    const { logout } = useAuth();
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-brand-body-bg text-center px-4">
            <div className="max-w-md">
                 <ExclamationTriangleIcon className="w-16 h-16 text-brand-warning mx-auto mb-4" />
                <h1 className="text-3xl font-bold text-brand-text-primary">Access Denied</h1>
                <p className="mt-2 text-brand-text-secondary">You do not have the necessary permissions to view this application.</p>
                <p className="mt-1 text-sm text-brand-text-muted">If you believe this is an error, please contact your system administrator.</p>
                <div className="mt-6 flex justify-center space-x-4">
                    <button onClick={logout} className="px-4 py-2 text-sm font-medium text-white bg-brand-primary rounded-md hover:bg-brand-primary-dark">Logout and Try Again</button>
                </div>
            </div>
        </div>
    );
};

const AdminPrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const auth = useAuth();
  const location = useLocation();

  if (auth.loading) return <SuspenseFallback />;
  if (!auth.isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (!auth.hasPermission('view_dashboard')) return <Navigate to="/access-denied" replace />;

  return <>{children}</>;
};

const AdminRoutes: React.FC = () => {
    const auth = useAuth();
    return (
        <Layout>
            <Suspense fallback={<SuspenseFallback />}>
                <Routes>
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/users" element={auth.hasPermission(['view_students', 'view_instructors']) ? <UserManagementPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/students" element={auth.hasPermission('view_students') ? <StudentListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/students/new" element={auth.hasPermission('manage_students') ? <StudentFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/students/edit/:studentId" element={auth.hasPermission('manage_students') ? <StudentFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/parents" element={auth.hasPermission('manage_students') ? <ParentListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/parents/new" element={auth.hasPermission('manage_students') ? <ParentFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/parents/edit/:parentId" element={auth.hasPermission('manage_students') ? <ParentFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/instructors" element={auth.hasPermission('view_instructors') ? <InstructorListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/instructors/new" element={auth.hasPermission('manage_instructors') ? <InstructorFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/instructors/edit/:instructorId" element={auth.hasPermission('manage_instructors') ? <InstructorFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/prospects" element={auth.hasPermission('manage_students') ? <ProspectListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/prospects/new" element={auth.hasPermission('manage_students') ? <ProspectFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/users/prospects/edit/:prospectId" element={auth.hasPermission('manage_students') ? <ProspectFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes" element={auth.hasPermission(['manage_programs', 'manage_class_offerings', 'manage_schedules']) ? <ClassManagementPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/programs" element={auth.hasPermission('manage_programs') ? <ProgramListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/programs/new" element={auth.hasPermission('manage_programs') ? <ProgramFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/programs/edit/:programId" element={auth.hasPermission('manage_programs') ? <ProgramFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/offerings" element={auth.hasPermission('manage_class_offerings') ? <ClassOfferingListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/offerings/new" element={auth.hasPermission('manage_class_offerings') ? <ClassOfferingFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/offerings/edit/:offeringId" element={auth.hasPermission('manage_class_offerings') ? <ClassOfferingFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/classes/schedules" element={auth.hasPermission('manage_schedules') ? <SchedulingPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/enrollments" element={auth.hasPermission(['view_enrollments', 'manage_enrollments']) ? <EnrollmentPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/enrollments/class/:classOfferingId" element={auth.hasPermission(['view_enrollments', 'manage_enrollments']) ? <ClassRosterPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/billing" element={auth.hasPermission(['process_payments', 'manage_invoices', 'manage_subscriptions']) ? <BillingPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/communications" element={auth.hasPermission(['send_announcements']) ? <CommunicationsPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports" element={auth.hasPermission(['view_all_reports', 'view_student_reports', 'view_attendance_reports', 'view_enrollment_reports', 'view_financial_reports', 'view_membership_reports']) ? <ReportsPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/new-students" element={auth.hasPermission(['view_all_reports', 'view_student_reports']) ? <NewStudentsReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/student-demographics" element={auth.hasPermission(['view_all_reports', 'view_student_reports']) ? <StudentDemographicsReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/student-status" element={auth.hasPermission(['view_all_reports', 'view_student_reports']) ? <StudentStatusReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/attendance-by-class" element={auth.hasPermission(['view_all_reports', 'view_attendance_reports']) ? <AttendanceByClassReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/attendance-by-student" element={auth.hasPermission(['view_all_reports', 'view_attendance_reports']) ? <AttendanceByStudentReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/attendance-by-instructor" element={auth.hasPermission(['view_all_reports', 'view_attendance_reports']) ? <AttendanceByInstructorReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/absences-by-class" element={auth.hasPermission(['view_all_reports', 'view_attendance_reports']) ? <AbsencesByClassReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/absences-by-student" element={auth.hasPermission(['view_all_reports', 'view_attendance_reports']) ? <AbsencesByStudentReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/enrollment-by-program" element={auth.hasPermission(['view_all_reports', 'view_enrollment_reports']) ? <EnrollmentByProgramReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/enrollment-by-class" element={auth.hasPermission(['view_all_reports', 'view_enrollment_reports']) ? <EnrollmentByClassReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/financial-payments" element={auth.hasPermission(['view_all_reports', 'view_financial_reports']) ? <FinancialPaymentsReportPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/financial-dashboard" element={auth.hasPermission(['view_all_reports', 'view_financial_reports']) ? <FinancialDashboardPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/reports/membership-distribution" element={auth.hasPermission(['view_all_reports', 'view_membership_reports']) ? <MembershipPlanDistributionPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings" element={auth.hasPermission(['manage_general_settings', 'manage_calendar_settings', 'manage_membership_plans', 'manage_roles_permissions', 'manage_admin_users']) ? <SettingsPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/general" element={auth.hasPermission('manage_general_settings') ? <GeneralSettingsPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/calendar" element={auth.hasPermission('manage_calendar_settings') ? <CalendarSettingsPage /> : <Navigate to="/access-denied" />} /> 
                    <Route path="/settings/roles" element={auth.hasPermission('manage_roles_permissions') ? <RoleListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/roles/new" element={auth.hasPermission('manage_roles_permissions') ? <RoleFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/roles/edit/:roleId" element={auth.hasPermission('manage_roles_permissions') ? <RoleFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/admin-users" element={auth.hasPermission('manage_admin_users') ? <AdminUserListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/admin-users/new" element={auth.hasPermission('manage_admin_users') ? <AdminUserFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/admin-users/edit/:adminUserId" element={auth.hasPermission('manage_admin_users') ? <AdminUserFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/membership-plans" element={auth.hasPermission('manage_membership_plans') ? <MembershipPlanListPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/membership-plans/new" element={auth.hasPermission('manage_membership_plans') ? <MembershipPlanFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/membership-plans/edit/:planId" element={auth.hasPermission('manage_membership_plans') ? <MembershipPlanFormPage /> : <Navigate to="/access-denied" />} />
                    <Route path="/settings/payments" element={auth.hasPermission('manage_general_settings') ? <PaymentSettingsPage /> : <Navigate to="/access-denied" />} />
                </Routes>
            </Suspense>
        </Layout>
    );
};


// --- Client Portal Access Control ---
const ClientPortalRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clientAuth = useClientAuth();
  const location = useLocation();

  if (clientAuth.loading) return <SuspenseFallback />;
  if (!clientAuth.isAuthenticated) return <Navigate to="/portal/login" state={{ from: location }} replace />;

  return <>{children}</>;
};

const ClientPortalRoutes: React.FC = () => (
    <PortalLayout>
        <Suspense fallback={<SuspenseFallback />}>
            <Routes>
                <Route path="/" element={<PortalDashboardPage />} />
                <Route path="/select-student" element={<StudentSelectorPage />} />
                <Route path="/dashboard" element={<PortalDashboardPage />} />
                <Route path="/schedule" element={<PortalSchedulePage />} />
                <Route path="/attendance" element={<PortalAttendancePage />} />
                <Route path="/account" element={<PortalAccountPage />} />
                <Route path="/announcements" element={<PortalAnnouncementsPage />} />
            </Routes>
        </Suspense>
    </PortalLayout>
);


// --- Main App Component ---
const App: React.FC = () => {
  return (
    <HashRouter>
      <NotificationProvider>
        <AuthProvider>
          <ClientAuthProvider>
              <Suspense fallback={<SuspenseFallback />}>
                  <Routes>
                      {/* Public Routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/access-denied" element={<AdminAccessDeniedPage />} />
                      <Route path="/portal/login" element={<ClientLoginPage />} />
                      <Route path="/attendance-scanner" element={<AttendanceScannerPage />} />

                      {/* Client Portal Routes */}
                      <Route
                          path="/portal/*"
                          element={<ClientPortalRoute><ClientPortalRoutes /></ClientPortalRoute>}
                      />

                      {/* Admin Routes */}
                      <Route
                          path="/*"
                          element={<AdminPrivateRoute><AdminRoutes /></AdminPrivateRoute>}
                      />
                  </Routes>
              </Suspense>
          </ClientAuthProvider>
        </AuthProvider>
      </NotificationProvider>
    </HashRouter>
  );
};

export default App;
