

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { GeneralSettings, BusinessHour, Address } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { SettingsIcon, ChevronLeftIcon, TimesIcon } from '../../components/icons';
import { getGeneralSettings, updateGeneralSettings } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const initialSettings: GeneralSettings = {
  id: 'current_settings', // Assuming a single settings document
  academyName: '',
  contactPhone: '',
  contactEmail: '',
  address: { street: '', city: '', state: '', zipCode: '' },
  logoUrl: '',
  businessHours: DAYS_OF_WEEK.map(day => ({
    dayOfWeek: day.value,
    isOpen: false,
    openTime: '09:00',
    closeTime: '17:00',
  })),
};

const GeneralSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<GeneralSettings>(initialSettings);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GeneralSettings | string, string | string[]>>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_general_settings');

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const settings = await getGeneralSettings();
      // Ensure businessHours has an entry for every day of the week
      const completeBusinessHours = DAYS_OF_WEEK.map(dayConstant => {
        const existingDaySetting = settings.businessHours?.find(bh => bh.dayOfWeek === dayConstant.value);
        return existingDaySetting || {
          dayOfWeek: dayConstant.value,
          isOpen: false,
          openTime: '09:00',
          closeTime: '17:00',
        };
      });
      setFormData({ ...initialSettings, ...settings, businessHours: completeBusinessHours });
      if (settings.logoUrl) {
        setLogoPreview(settings.logoUrl);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch general settings.';
      setSubmitError(errorMsg);
      showToast(errorMsg, 'error');
      // If settings fail to load, stick with initial empty settings
      setFormData(initialSettings); 
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name as keyof GeneralSettings]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value }
    }));
    if (formErrors[`address.${name}`]) {
      setFormErrors(prev => ({ ...prev, [`address.${name}`]: undefined }));
    }
  };

  const handleBusinessHourChange = (dayIndex: number, field: keyof BusinessHour, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      businessHours: prev.businessHours.map((bh, index) => 
        index === dayIndex ? { ...bh, [field]: value } : bh
      )
    }));
  };
  
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      if (formErrors.logoUrl) setFormErrors(prev => ({...prev, logoUrl: undefined}));
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    // If you want to signal to backend to remove logo, you might set formData.logoUrl to "" or handle differently
    setFormData(prev => ({ ...prev, logoUrl: '' })); 
  }

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof GeneralSettings | string, string | string[]>> = {};
    if (!formData.academyName.trim()) errors.academyName = "Academy name is required.";
    if (!formData.contactEmail.trim()) errors.contactEmail = "Contact email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.contactEmail)) errors.contactEmail = "Email is invalid.";

    if (!formData.address.street?.trim()) errors["address.street"] = "Street is required.";
    if (!formData.address.city?.trim()) errors["address.city"] = "City is required.";
    
    const businessHourErrors: string[] = [];
    formData.businessHours.forEach((bh, index) => {
        if (bh.isOpen) {
            if (!bh.openTime) businessHourErrors[index] = `Opening time is required for ${DAYS_OF_WEEK[bh.dayOfWeek].label}.`;
            if (!bh.closeTime) businessHourErrors[index] = businessHourErrors[index] ? `${businessHourErrors[index]} Closing time is required.` : `Closing time is required for ${DAYS_OF_WEEK[bh.dayOfWeek].label}.`;
            if (bh.openTime && bh.closeTime && bh.openTime >= bh.closeTime) {
                 businessHourErrors[index] = businessHourErrors[index] ? `${businessHourErrors[index]} Closing time must be after opening time.` : `Closing time must be after opening time for ${DAYS_OF_WEEK[bh.dayOfWeek].label}.`;
            }
        }
    });
    const validBhErrors = businessHourErrors.filter(e => e);
    if(validBhErrors.length > 0) errors.businessHours = validBhErrors;

    if (logoFile && logoFile.size > 2 * 1024 * 1024) { // 2MB limit
        errors.logoUrl = "Logo file size should not exceed 2MB.";
    }
    if (logoFile && !['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'].includes(logoFile.type)){
        errors.logoUrl = "Invalid logo file type. Allowed: JPG, PNG, GIF, SVG.";
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

    // Create payload for API, omitting server-generated fields
    const { id, updatedAt, studioId, ...payloadForApi } = formData;
    
    if (logoFile && logoPreview && logoPreview.startsWith('data:image')) {
      payloadForApi.logoUrl = logoPreview; // Send base64 string for simplicity
    } else if (!logoPreview && !logoFile) { // If logo was removed
      payloadForApi.logoUrl = '';
    }
    // If logoPreview is an existing URL and no new file, payloadForApi.logoUrl is already correct from formData.

    try {
      await updateGeneralSettings(payloadForApi);
      showToast("General settings updated successfully!", 'success');
      // Optionally re-fetch settings or assume local state is source of truth post-save
      // fetchSettings(); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="text-center p-10 text-brand-text-secondary">Loading general settings...</div>;
  }

  const isFormDisabled = isSubmitting || !canManage;

  return (
    <div className="space-y-6">
      <NavLink to="/settings" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2 font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Settings Overview
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <SettingsIcon className="w-8 h-8 mr-3 text-brand-primary" />
        General Academy Settings
      </h1>
      
      {submitError && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card title="Academy Information" collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Input label="Academy Name" id="academyName" name="academyName" value={formData.academyName} onChange={handleChange} error={formErrors.academyName as string} required disabled={isFormDisabled}/>
            <Input label="Contact Phone" id="contactPhone" name="contactPhone" type="tel" value={formData.contactPhone} onChange={handleChange} error={formErrors.contactPhone as string} disabled={isFormDisabled}/>
            <Input label="Contact Email" id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} error={formErrors.contactEmail as string} required disabled={isFormDisabled}/>
          </div>
        </Card>

        <Card title="Academy Address" collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
            <Input label="Street" id="address.street" name="street" value={formData.address.street} onChange={handleAddressChange} error={formErrors["address.street"] as string} required disabled={isFormDisabled}/>
            <Input label="City" id="address.city" name="city" value={formData.address.city} onChange={handleAddressChange} error={formErrors["address.city"] as string} required disabled={isFormDisabled}/>
            <Input label="State / Province" id="address.state" name="state" value={formData.address.state} onChange={handleAddressChange} error={formErrors["address.state"] as string} disabled={isFormDisabled}/>
            <Input label="Zip / Postal Code" id="address.zipCode" name="zipCode" value={formData.address.zipCode} onChange={handleAddressChange} error={formErrors["address.zipCode"] as string} disabled={isFormDisabled}/>
          </div>
        </Card>

        <Card title="Academy Logo" collapsible={false}>
            <div className="flex flex-col items-start space-y-4">
                {logoPreview && (
                <div className="relative group">
                    <img src={logoPreview} alt="Current logo" className="h-24 w-auto max-w-xs object-contain border border-brand-neutral-200 rounded-md p-1"/>
                    {canManage && <button 
                        type="button" 
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 bg-brand-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
                        aria-label="Remove logo"
                        disabled={isFormDisabled}
                    >
                        <TimesIcon className="w-3.5 h-3.5"/>
                    </button>}
                </div>
                )}
                {!logoPreview && <p className="text-sm text-brand-text-muted">No logo uploaded.</p>}
                
                <Input 
                    type="file" 
                    id="logoFile" 
                    name="logoFile" 
                    label={logoPreview ? "Upload New Logo (Optional)" : "Upload Logo"} 
                    onChange={handleLogoChange} 
                    accept="image/png, image/jpeg, image/gif, image/svg+xml" 
                    error={formErrors.logoUrl as string}
                    disabled={isFormDisabled}
                    containerClassName="w-full max-w-md"
                />
                 <p className="text-xs text-brand-text-muted">Recommended: PNG or SVG with transparent background. Max size: 2MB.</p>
            </div>
        </Card>

        <Card title="Business Hours" collapsible={false}>
            <div className="space-y-4">
            {formData.businessHours.map((bh, index) => (
                <div key={bh.dayOfWeek} className="p-3 border rounded-md bg-brand-neutral-50/50 border-brand-neutral-200">
                <div className="flex items-center justify-between mb-2">
                    <label className="font-medium text-brand-text-primary">{DAYS_OF_WEEK.find(d => d.value === bh.dayOfWeek)?.label}</label>
                    <div className="flex items-center">
                    <span className="text-sm text-brand-text-secondary mr-2">{bh.isOpen ? 'Open' : 'Closed'}</span>
                    <label htmlFor={`isOpen-${bh.dayOfWeek}`} className="relative inline-flex items-center cursor-pointer">
                        <input
                        type="checkbox"
                        id={`isOpen-${bh.dayOfWeek}`}
                        className="sr-only peer"
                        checked={bh.isOpen}
                        onChange={(e) => handleBusinessHourChange(index, 'isOpen', e.target.checked)}
                        disabled={isFormDisabled}
                        />
                        <div className="w-11 h-6 bg-brand-neutral-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-primary-light rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-brand-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                    </label>
                    </div>
                </div>
                {bh.isOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                    <Input label="Opening Time" id={`openTime-${bh.dayOfWeek}`} type="time" value={bh.openTime} onChange={(e) => handleBusinessHourChange(index, 'openTime', e.target.value)} containerClassName="mb-0" disabled={isFormDisabled || !bh.isOpen}/>
                    <Input label="Closing Time" id={`closeTime-${bh.dayOfWeek}`} type="time" value={bh.closeTime} onChange={(e) => handleBusinessHourChange(index, 'closeTime', e.target.value)} containerClassName="mb-0" disabled={isFormDisabled || !bh.isOpen}/>
                    </div>
                )}
                </div>
            ))}
            {Array.isArray(formErrors.businessHours) && formErrors.businessHours.length > 0 && (
                <div className="mt-2 text-xs text-brand-error space-y-0.5">
                    {(formErrors.businessHours as string[]).map((err, i) => <p key={i}>{err}</p>)}
                </div>
            )}
            </div>
        </Card>
          
        {canManage && (
            <div className="flex justify-end space-x-3 mt-6 py-4 border-t border-brand-neutral-200 sticky bottom-0 bg-brand-body-bg/80 backdrop-blur-sm z-10">
            <Button type="button" variant="outline" onClick={() => navigate('/settings')} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                Save Changes
            </Button>
            </div>
        )}
      </form>
    </div>
  );
};

export default GeneralSettingsPage;