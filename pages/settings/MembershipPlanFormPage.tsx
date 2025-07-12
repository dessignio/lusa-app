
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { MembershipPlanDefinition } from '../../types'; 
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, IdCardIcon } from '../../components/icons';
import { getMembershipPlanById, createMembershipPlan, updateMembershipPlan } from '../../services/apiService';
import { showToast } from '../../utils';

const initialPlanState: Omit<MembershipPlanDefinition, 'id'> = {
    name: '', 
    classesPerWeek: 1,
    monthlyPrice: 0,
    description: '',
    stripePriceId: '', 
    durationMonths: undefined, // Ensure durationMonths is part of the initial state
};

const MembershipPlanFormPage: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(planId);

  const [plan, setPlan] = useState<Omit<MembershipPlanDefinition, 'id'>>(initialPlanState);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof MembershipPlanDefinition, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlanData = async (id: string) => {
      setIsLoading(true);
      setSubmitError(null);
      try {
        const existingPlan = await getMembershipPlanById(id);
        if (!existingPlan) throw new Error("Membership plan not found");
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id: _id, ...dataToSet } = existingPlan;
        setPlan({...initialPlanState, ...dataToSet}); // Ensure all fields are present
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch plan data.';
        setSubmitError(errorMsg);
        showToast(errorMsg, 'error');
        if (isEditMode) navigate('/settings/membership-plans');
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditMode && planId) {
      fetchPlanData(planId);
    } else {
      setPlan(initialPlanState);
    }
  }, [planId, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setPlan(prev => ({ 
        ...prev, 
        [name]: name === 'classesPerWeek' || name === 'monthlyPrice' || name === 'durationMonths' ? parseFloat(value) || 0 : value 
    }));
    if (formErrors[name as keyof MembershipPlanDefinition]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof MembershipPlanDefinition, string>> = {};
    if (!plan.name.trim()) errors.name = "Plan name is required.";
    if (plan.classesPerWeek === undefined || plan.classesPerWeek < 0) errors.classesPerWeek = "Classes per week must be a non-negative number.";
    if (plan.monthlyPrice === undefined || plan.monthlyPrice < 0) errors.monthlyPrice = "Monthly price must be a non-negative number.";
    if (plan.durationMonths !== undefined && plan.durationMonths < 0) errors.durationMonths = "Duration must be a non-negative number.";
    
    // Stripe Price ID validation for edit mode, if user provides one
    if (isEditMode && plan.stripePriceId && !plan.stripePriceId.startsWith('price_') && !plan.stripePriceId.startsWith('plan_')) {
        errors.stripePriceId = "Invalid Stripe ID format. It should start with 'price_' or 'plan_'.";
    }
    // For new plans, stripePriceId is auto-generated, so no client-side validation needed for its format.
    
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

    const planDataToSubmit: Partial<Omit<MembershipPlanDefinition, 'id'>> = {
        name: plan.name.trim(), 
        classesPerWeek: Number(plan.classesPerWeek),
        monthlyPrice: Number(plan.monthlyPrice),
        durationMonths: plan.durationMonths ? Number(plan.durationMonths) : undefined,
        description: plan.description?.trim() || undefined,
    };
    
    // Only include stripePriceId in the payload if in edit mode.
    // For create mode, the backend will generate it.
    if (isEditMode) {
        planDataToSubmit.stripePriceId = plan.stripePriceId?.trim() || undefined;
    }


    try {
      if (isEditMode && planId) {
        await updateMembershipPlan(planId, planDataToSubmit as Partial<Omit<MembershipPlanDefinition, 'id'>>);
        showToast(`Membership plan "${plan.name.trim()}" updated successfully.`, 'success');
      } else {
        // For create, ensure the type matches Omit<MembershipPlanDefinition, 'id' | 'stripePriceId'>
        // The backend will handle stripePriceId generation.
        const createPayload: Omit<MembershipPlanDefinition, 'id' | 'stripePriceId'> = {
            name: planDataToSubmit.name!,
            classesPerWeek: planDataToSubmit.classesPerWeek!,
            monthlyPrice: planDataToSubmit.monthlyPrice!,
            description: planDataToSubmit.description,
            durationMonths: planDataToSubmit.durationMonths,
        };
        await createMembershipPlan(createPayload);
        showToast(`Membership plan "${plan.name.trim()}" created successfully.`, 'success');
      }
      navigate('/settings/membership-plans');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading && isEditMode) {
    return <div className="text-center p-10">Loading plan data...</div>;
  }

  return (
    <div className="space-y-6">
      <NavLink to="/settings/membership-plans" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Membership Plan List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <IdCardIcon className="w-8 h-8 mr-3 text-brand-primary" />
        {isEditMode ? `Edit Membership Plan: ${plan.name || ''}` : 'Add New Membership Plan'}
      </h1>
      
      {submitError && !isLoading && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <Card 
          title="Plan Details" 
          icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5" /> : <UserPlusIcon className="text-brand-primary w-5 h-5" />}
          collapsible={false}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input 
                label="Plan Name" 
                id="name" 
                name="name"
                type="text"
                value={plan.name} 
                onChange={handleChange} 
                error={formErrors.name} 
                required 
                disabled={isSubmitting}
                maxLength={100}
                placeholder="Enter a unique plan name"
            />
            <Input 
                label="Classes per Week" 
                id="classesPerWeek" 
                name="classesPerWeek" 
                type="number"
                value={String(plan.classesPerWeek)} 
                onChange={handleChange} 
                error={formErrors.classesPerWeek} 
                required 
                min="0"
                disabled={isSubmitting}
            />
            <Input 
                label="Monthly Price ($)" 
                id="monthlyPrice" 
                name="monthlyPrice" 
                type="number"
                value={String(plan.monthlyPrice)} 
                onChange={handleChange} 
                error={formErrors.monthlyPrice} 
                required 
                min="0"
                step="0.01"
                disabled={isSubmitting}
            />
             <Input 
                label="Duration (Months, optional)" 
                id="durationMonths" 
                name="durationMonths" 
                type="number"
                value={plan.durationMonths !== undefined ? String(plan.durationMonths) : ''} 
                onChange={handleChange} 
                error={formErrors.durationMonths} 
                min="0"
                disabled={isSubmitting}
                placeholder="Leave blank for ongoing monthly"
            />
            <Input 
                label="Description (Optional)" 
                id="description" 
                name="description"
                type="textarea"
                rows={3}
                value={plan.description || ''} 
                onChange={handleChange} 
                error={formErrors.description} 
                disabled={isSubmitting}
                containerClassName="md:col-span-2"
                placeholder="Briefly describe the plan benefits or terms."
            />
            
            {isEditMode ? (
                 <Input 
                    label="Stripe Price ID" 
                    id="stripePriceId" 
                    name="stripePriceId"
                    type="text"
                    value={plan.stripePriceId || ''} 
                    onChange={handleChange} 
                    error={formErrors.stripePriceId} 
                    disabled={isSubmitting}
                    containerClassName="md:col-span-2"
                    placeholder="e.g., price_1LqXXXXXXYqXXXXXX or plan_XXXXXXXXXXXXXX"
                    helperText="Manually update if you need to link to a different Stripe Price."
                />
            ) : (
                <div className="md:col-span-2">
                    <label htmlFor="stripePriceId-display" className="block text-sm font-medium text-brand-text-secondary mb-1">Stripe Price ID</label>
                    <input
                        id="stripePriceId-display"
                        type="text"
                        value="Auto-generated on save"
                        readOnly
                        className="block w-full px-3 py-2 border border-brand-neutral-300 bg-brand-neutral-100 rounded-md shadow-sm text-sm text-brand-text-muted placeholder-brand-neutral-400 focus:outline-none"
                    />
                    <p className="mt-1 text-xs text-brand-text-muted">This ID will be automatically created in Stripe and saved with the plan.</p>
                </div>
            )}
          </div>
        </Card>
          
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/settings/membership-plans')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading} disabled={isSubmitting || isLoading}>
            {isEditMode ? 'Save Changes' : 'Create Plan'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MembershipPlanFormPage;
