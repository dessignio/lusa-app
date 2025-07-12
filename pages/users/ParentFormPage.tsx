import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ParentFormData, Address } from '../../types';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, UserShieldIcon, UserFriendsIcon } from '../../components/icons';
import { getParentById, createParent, updateParent } from '../../services/apiService';
import { showToast } from '../../utils';

const initialParentFormData: ParentFormData = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    address: { street: '', city: '', state: '', zipCode: '' },
};

const ParentFormPage: React.FC = () => {
  const { parentId } = useParams<{ parentId: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(parentId);

  const [formData, setFormData] = useState<ParentFormData>(initialParentFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ParentFormData | string, string>>>({});
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchParentData = async () => {
      if (!parentId) {
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      try {
        const existingParent = await getParentById(parentId);
        setFormData({
            ...initialParentFormData,
            ...existingParent,
            password: '',
            confirmPassword: '',
            address: { ...initialParentFormData.address, ...(existingParent.address || {}) },
        });
      } catch (err) {
        showToast(`Failed to load parent data: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        navigate('/users/parents');
      } finally {
        setIsLoading(false);
      }
    };
    fetchParentData();
  }, [parentId, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const [field, subField] = name.split('.');

    if (subField && field === 'address') {
        setFormData(prev => ({ ...prev, address: { ...(prev.address as Address), [subField]: value }}));
    } else {
        setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (formErrors[name as keyof ParentFormData | string]) { 
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ParentFormData | string, string>> = {};
    if (!formData.firstName?.trim()) errors.firstName = "First name is required.";
    if (!formData.lastName?.trim()) errors.lastName = "Last name is required.";
    if (!formData.email?.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid.";
    
    if (!formData.username?.trim()) errors.username = "Username is required.";
    else if (formData.username.trim().length < 3) errors.username = "Username must be at least 3 characters.";
    else if (/\s/.test(formData.username)) errors.username = "Username cannot contain spaces.";

    if (!isEditMode && !formData.password) errors.password = "Password is required for new parents.";
    if (formData.password && formData.password.length < 6) errors.password = "Password must be at least 6 characters long.";
    if (formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    
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

    const payload: Partial<ParentFormData> = { ...formData };
    if (!payload.password) delete payload.password;
    delete payload.confirmPassword;

    try {
      if (isEditMode && parentId) {
        await updateParent(parentId, payload);
        showToast(`Parent ${formData.firstName} ${formData.lastName} updated successfully.`, 'success');
      } else {
        await createParent(payload as ParentFormData);
        showToast(`Parent ${formData.firstName} ${formData.lastName} created successfully.`, 'success');
      }
      navigate('/users/parents'); 
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred during submission.');
      showToast(`Operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10 text-brand-text-secondary">Loading parent data...</div>;
  }

  return (
    <div className="space-y-6">
      <NavLink to="/users/parents" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Parent List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">
        {isEditMode ? `Edit Parent: ${formData.firstName || ''} ${formData.lastName || ''}` : 'Add New Parent'}
      </h1>
      
      {submitError && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <Card title="Parent Details" icon={isEditMode ? <PencilIcon /> : <UserPlusIcon />} collapsible={false} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
            <Input label="First Name" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} error={formErrors.firstName} required disabled={isSubmitting}/>
            <Input label="Last Name" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} error={formErrors.lastName} required disabled={isSubmitting}/>
            <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} error={formErrors.email} required disabled={isSubmitting}/>
            <Input label="Phone" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} error={formErrors.phone} disabled={isSubmitting}/>
          </div>
        </Card>

        <Card title="Login Credentials" icon={<UserShieldIcon />} collapsible={false} className="mb-6">
            <p className="text-xs text-brand-text-muted mb-3">
                {isEditMode ? "Leave password fields blank to keep the current password." : "Username and password are required for new parents to log in."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                <Input label="Username" id="username" name="username" value={formData.username} onChange={handleChange} error={formErrors.username} required disabled={isSubmitting}/>
                <Input label={isEditMode ? "New Password (Optional)" : "Password"} id="password" name="password" type="password" value={formData.password || ''} onChange={handleChange} error={formErrors.password} required={!isEditMode} disabled={isSubmitting}/>
                <Input label={isEditMode ? "Confirm New Password" : "Confirm Password"} id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword || ''} onChange={handleChange} error={formErrors.confirmPassword} required={!isEditMode && !!formData.password} disabled={isSubmitting}/>
            </div>
        </Card>

        <Card title="Address" collapsible={false} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                <Input label="Street" id="address.street" name="address.street" value={formData.address?.street || ''} onChange={handleChange} disabled={isSubmitting}/>
                <Input label="City" id="address.city" name="address.city" value={formData.address?.city || ''} onChange={handleChange} disabled={isSubmitting}/>
                <Input label="State" id="address.state" name="address.state" value={formData.address?.state || ''} onChange={handleChange} disabled={isSubmitting}/>
                <Input label="Zip Code" id="address.zipCode" name="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleChange} disabled={isSubmitting}/>
            </div>
        </Card>
          
        <div className="flex justify-end space-x-3 mt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/users/parents')} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                {isEditMode ? 'Save Changes' : 'Create Parent'}
            </Button>
        </div>
        </form>
    </div>
  );
};

export default ParentFormPage;