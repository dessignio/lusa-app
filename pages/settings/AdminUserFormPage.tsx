
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom'; // Updated for v6: useNavigate
import { AdminUserFormData, Role, AdminUserStatus } from '../../types';
import { ADMIN_USER_STATUS_OPTIONS } from '../../constants';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, UserShieldIcon } from '../../components/icons';
import { getAdminUserById, createAdminUser, updateAdminUser, getRoles } from '../../services/apiService';
import { showToast } from '../../utils';

const initialAdminUserState: AdminUserFormData = {
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    roleId: '',
    status: 'active',
};

const AdminUserFormPage: React.FC = () => {
  const { adminUserId } = useParams<{ adminUserId: string }>();
  const navigate = useNavigate(); 
  const isEditMode = Boolean(adminUserId);

  const [adminUser, setAdminUser] = useState<AdminUserFormData>(initialAdminUserState);
  const [roles, setRoles] = useState<Role[]>([]);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AdminUserFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      setIsLoading(true);
      setSubmitError(null);
      try {
        const rolesData = await getRoles();
        setRoles(rolesData);

        if (isEditMode && adminUserId) {
          const existingUser = await getAdminUserById(adminUserId);
          setAdminUser({
            ...existingUser,
            password: '', 
            confirmPassword: '',
          });
        } else {
          setAdminUser(initialAdminUserState);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch form data.';
        setSubmitError(errorMsg);
        showToast(errorMsg, 'error');
        if (isEditMode) navigate('/settings/admin-users'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormData();
  }, [adminUserId, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setAdminUser(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof AdminUserFormData]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AdminUserFormData, string>> = {};
    if (!adminUser.username.trim()) errors.username = "Username is required.";
    if (!adminUser.email.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(adminUser.email)) errors.email = "Email is invalid.";
    if (!adminUser.firstName.trim()) errors.firstName = "First name is required.";
    if (!adminUser.lastName.trim()) errors.lastName = "Last name is required.";
    if (!isEditMode && !adminUser.password) errors.password = "Password is required for new users.";
    if (adminUser.password && adminUser.password !== adminUser.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    if (adminUser.password && (adminUser.password.length < 6)) errors.password = "Password must be at least 6 characters.";
    if (!adminUser.roleId) errors.roleId = "Role is required.";
    if (!adminUser.status) errors.status = "Status is required.";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please correct the errors in the form.", "error");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const { confirmPassword, ...payload } = adminUser;
    
    const apiPayload: any = { ...payload };
    if (!payload.password) {
      delete apiPayload.password;
    }
    
    try {
      if (isEditMode && adminUserId) {
        await updateAdminUser(adminUserId, apiPayload);
        showToast(`Admin user "${adminUser.username}" updated successfully.`, 'success');
      } else {
        if (!apiPayload.password) { 
            showToast("Password is required for new users.", "error");
            setIsSubmitting(false);
            return;
        }
        await createAdminUser(apiPayload);
        showToast(`Admin user "${adminUser.username}" created successfully.`, 'success');
      }
      navigate('/settings/admin-users'); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const roleOptions = roles.map(r => ({ value: r.id, label: r.name }));

  if (isLoading) {
    return <div className="text-center p-10">Loading admin user data...</div>;
  }

  return (
    <div className="space-y-6">
      <NavLink to="/settings/admin-users" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Admin User List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <UserShieldIcon className="w-8 h-8 mr-3 text-brand-primary" />
        {isEditMode ? `Edit Admin User: ${adminUser.username}` : 'Add New Admin User'}
      </h1>
      
      {submitError && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Account Information" icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5"/> : <UserPlusIcon className="text-brand-primary w-5 h-5"/>} collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Input label="Username" id="username" name="username" value={adminUser.username} onChange={handleChange} error={formErrors.username} required disabled={isSubmitting}/>
            <Input label="Email" id="email" name="email" type="email" value={adminUser.email} onChange={handleChange} error={formErrors.email} required disabled={isSubmitting}/>
            <Input label="First Name" id="firstName" name="firstName" value={adminUser.firstName} onChange={handleChange} error={formErrors.firstName} required disabled={isSubmitting}/>
            <Input label="Last Name" id="lastName" name="lastName" value={adminUser.lastName} onChange={handleChange} error={formErrors.lastName} required disabled={isSubmitting}/>
          </div>
        </Card>

        <Card title="Login Credentials" collapsible={false}>
            <p className="text-xs text-brand-text-muted mb-3">{isEditMode ? "Leave password fields blank to keep current password." : "Password is required for new users."}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Input label="Password" id="password" name="password" type="password" value={adminUser.password || ''} onChange={handleChange} error={formErrors.password} disabled={isSubmitting} placeholder={isEditMode ? "Enter new password" : ""}/>
            <Input label="Confirm Password" id="confirmPassword" name="confirmPassword" type="password" value={adminUser.confirmPassword || ''} onChange={handleChange} error={formErrors.confirmPassword} disabled={isSubmitting} placeholder={isEditMode ? "Confirm new password" : ""}/>
          </div>
        </Card>

        <Card title="Role & Status" collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Select label="Role" id="roleId" name="roleId" options={[{ value: '', label: 'Select a role' }, ...roleOptions]} value={adminUser.roleId} onChange={handleChange} error={formErrors.roleId} required disabled={isSubmitting}/>
            <Select label="Status" id="status" name="status" options={ADMIN_USER_STATUS_OPTIONS} value={adminUser.status} onChange={handleChange} error={formErrors.status} required disabled={isSubmitting}/>
          </div>
        </Card>
          
        <div className="flex justify-end space-x-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/settings/admin-users')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Admin User'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AdminUserFormPage;
