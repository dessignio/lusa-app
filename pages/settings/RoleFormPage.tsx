
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom'; // Updated for v6: useNavigate
import { Role, PermissionKey, PermissionDefinition } from '../../types';
import { AVAILABLE_PERMISSIONS } from '../../constants';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, UsersIcon as RolesIcon } from '../../components/icons';
import { getRoleById, createRole, updateRole } from '../../services/apiService';
import { showToast } from '../../utils';

const initialRoleState: Partial<Role> = {
    name: '',
    description: '',
    permissions: [],
};

const RoleFormPage: React.FC = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const navigate = useNavigate(); 
  const isEditMode = Boolean(roleId);

  const [role, setRole] = useState<Partial<Role>>(initialRoleState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Role, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRoleData = async (id: string) => {
      setIsLoading(true);
      setSubmitError(null);
      try {
        const existingRole = await getRoleById(id);
        if (!existingRole) throw new Error("Role not found");
        setRole(existingRole);
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch role data.';
        setSubmitError(errorMsg);
        showToast(errorMsg, 'error');
        console.error(err);
        if (isEditMode) navigate('/settings/roles'); 
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditMode && roleId) {
      fetchRoleData(roleId);
    } else {
      setRole(initialRoleState);
    }
  }, [roleId, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setRole(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof Role]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handlePermissionChange = (permissionKey: PermissionKey) => {
    setRole(prev => {
      const currentPermissions = prev.permissions || [];
      const newPermissions = currentPermissions.includes(permissionKey)
        ? currentPermissions.filter(p => p !== permissionKey)
        : [...currentPermissions, permissionKey];
      return { ...prev, permissions: newPermissions };
    });
     if (formErrors.permissions) {
      setFormErrors(prev => ({ ...prev, permissions: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Role, string>> = {};
    if (!role.name?.trim()) errors.name = "Role name is required.";
    // Description is optional as per backend DTO, so no validation here unless explicitly required
    // if (!role.description?.trim()) errors.description = "Description is required.";
    if (!role.permissions || role.permissions.length === 0) {
      errors.permissions = "At least one permission must be selected.";
    }
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

    const roleDataToSubmit: Partial<Role> = {
        name: role.name,
        description: role.description || '', 
        permissions: role.permissions || [],
    };

    try {
      if (isEditMode && roleId) {
        await updateRole(roleId, roleDataToSubmit);
        showToast(`Role "${role.name}" updated successfully.`, 'success');
      } else {
        await createRole(roleDataToSubmit); 
        showToast(`Role "${role.name}" created successfully.`, 'success');
      }
      navigate('/settings/roles'); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const groupedPermissions = AVAILABLE_PERMISSIONS.reduce((acc, permission) => {
    (acc[permission.category] = acc[permission.category] || []).push(permission);
    return acc;
  }, {} as Record<string, PermissionDefinition[]>);


  if (isLoading && isEditMode) {
    return <div className="text-center p-10">Loading role data...</div>;
  }

  return (
    <div className="space-y-6">
      <NavLink to="/settings/roles" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Role List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <RolesIcon className="w-8 h-8 mr-3 text-brand-primary" />
        {isEditMode ? `Edit Role: ${role.name || ''}` : 'Add New Role'}
      </h1>
      
      {submitError && !isLoading && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <Card 
          title="Role Information" 
          icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5" /> : <UserPlusIcon className="text-brand-primary w-5 h-5" />}
          collapsible={false}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Input label="Role Name" id="name" name="name" value={role.name || ''} onChange={handleChange} error={formErrors.name} required disabled={isSubmitting}/>
            <Input label="Description (Optional)" id="description" name="description" value={role.description || ''} onChange={handleChange} error={formErrors.description} disabled={isSubmitting} containerClassName="md:col-span-full"/>
          </div>
        </Card>

        <Card title="Permissions" collapsible={false} className="mb-6">
          {Object.entries(groupedPermissions).map(([category, permissions]) => (
            <div key={category} className="mb-4">
              <h4 className="text-md font-semibold text-brand-text-secondary mb-2 border-b pb-1 border-brand-neutral-200">{category}</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                {permissions.map(permission => (
                  <label key={permission.key} className={`flex items-start space-x-2 p-1.5 rounded ${isSubmitting ? 'cursor-not-allowed text-brand-text-muted' : 'cursor-pointer hover:bg-brand-neutral-50 text-brand-text-secondary'}`}>
                    <input
                      type="checkbox"
                      value={permission.key}
                      checked={(role.permissions || []).includes(permission.key)}
                      onChange={() => handlePermissionChange(permission.key)}
                      className="form-checkbox h-4 w-4 text-brand-primary rounded border-brand-neutral-400 focus:ring-brand-primary-light mt-0.5 shrink-0"
                      disabled={isSubmitting}
                      aria-describedby={`permission-desc-${permission.key}`}
                    />
                    <div>
                        <span className="text-sm">{permission.name}</span>
                        <p id={`permission-desc-${permission.key}`} className="text-xs text-brand-text-muted">{permission.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          ))}
          {formErrors.permissions && <p className="mt-2 text-xs text-brand-error">{formErrors.permissions}</p>}
        </Card>
          
        <div className="flex justify-end space-x-3 mt-4">
          <Button type="button" variant="outline" onClick={() => navigate('/settings/roles')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Role'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default RoleFormPage;
