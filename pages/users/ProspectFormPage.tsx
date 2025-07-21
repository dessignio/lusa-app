import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProspectFormData } from '../../types';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, DollarSignIcon } from '../../components/icons';
import { getProspectById, createProspect, updateProspect, getConnectAccountId, createAuditionPaymentIntent } from '../../services/apiService';
import { showToast } from '../../utils';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const initialStripePromise = loadStripe("pk_test_51R4Y62RoIWWgoaNu8aBXQRu24UEFe4oNZzSFTv0nOpj1A3vNZbT2bHTAaWiCnj7Hk7YwYfKQQbtH6j2AjuMGfTkb00ch0mkTMb");

const initialProspectFormData: ProspectFormData = {
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    phone: '',
};

const ProspectPaymentForm: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-confirmation`,
            },
        });

        if (error) {
            setErrorMessage(error.message || 'An unexpected error occurred.');
        } 

        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {errorMessage && <div className="p-3 my-4 bg-brand-error-light text-brand-error-dark rounded-md text-sm">{errorMessage}</div>}
            <Button type="submit" variant="primary" isLoading={isProcessing} disabled={!stripe || isProcessing} className="mt-6 w-full">
                Pay Now
            </Button>
        </form>
    );
};

const ProspectFormPage: React.FC = () => {
    const { prospectId } = useParams<{ prospectId: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(prospectId);

    const [step, setStep] = useState('details'); // 'details' or 'payment'
    const [formData, setFormData] = useState<ProspectFormData>(initialProspectFormData);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProspectFormData, string>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [stripeOptions, setStripeOptions] = useState<any>(null);
    const [stripeInstance, setStripeInstance] = useState<Stripe | null>(null); // Holds the resolved Stripe object

    useEffect(() => {
        if (isEditMode && prospectId) {
            setIsLoading(true);
            getProspectById(prospectId)
                .then(data => {
                    setFormData({
                        firstName: data.firstName,
                        lastName: data.lastName,
                        email: data.email,
                        dateOfBirth: data.dateOfBirth.split('T')[0],
                        phone: data.phone || '',
                    });
                })
                .catch(err => {
                    showToast(`Failed to load prospect: ${err.message}`, 'error');
                    navigate('/users/prospects');
                })
                .finally(() => setIsLoading(false));
        } else {
            setIsLoading(false);
        }
    }, [prospectId, isEditMode, navigate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name as keyof ProspectFormData]) {
            setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    const validateForm = (): boolean => {
        const errors: Partial<Record<keyof ProspectFormData, string>> = {};
        if (!formData.firstName.trim()) errors.firstName = "First name is required.";
        if (!formData.lastName.trim()) errors.lastName = "Last name is required.";
        if (!formData.email.trim()) errors.email = "Email is required.";
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errors.email = "Email is invalid.";
        if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleProceedToPayment = async () => {
        if (!validateForm()) {
            showToast("Please correct the form errors.", "error");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const { stripeAccountId } = await getConnectAccountId();
            // Await the loadStripe call to get the resolved Stripe object
            const resolvedStripe = await loadStripe("pk_test_51R4Y62RoIWWgoaNu8aBXQRu24UEFe4oNZzSFTv0nOpj1A3vNZbT2bHTAaWiCnj7Hk7YwYfKQQbtH6j2AjuMGfTkb00ch0mkTMb", { stripeAccount: stripeAccountId });
            setStripeInstance(resolvedStripe);

            const { clientSecret } = await createAuditionPaymentIntent({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
            });

            setStripeOptions({ clientSecret, appearance: { theme: 'stripe' } });
            sessionStorage.setItem('prospectFormData', JSON.stringify(formData));
            setStep('payment');
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred.');
            showToast(`Failed to proceed to payment: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return <div className="text-center p-10 text-brand-text-secondary">Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <NavLink to="/users/prospects" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Prospect List
            </NavLink>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">
                {isEditMode ? `Edit Prospect: ${formData.firstName} ${formData.lastName}` : 'Add New Prospect'}
            </h1>
          
            {submitError && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm">{submitError}</div>}
            
            {step === 'details' && (
                <form onSubmit={(e) => { e.preventDefault(); handleProceedToPayment(); }}>
                    <Card 
                      title="Prospect Information" 
                      icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5" /> : <UserPlusIcon className="text-brand-primary w-5 h-5" />}
                      collapsible={false}
                      className="mb-6"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
                        <Input label="First Name" id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} error={formErrors.firstName} required disabled={isSubmitting}/>
                        <Input label="Last Name" id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} error={formErrors.lastName} required disabled={isSubmitting}/>
                        <Input label="Email" id="email" name="email" type="email" value={formData.email} onChange={handleChange} error={formErrors.email} required disabled={isSubmitting}/>
                        <Input label="Date of Birth" id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} error={formErrors.dateOfBirth} required disabled={isSubmitting}/>
                        <Input label="Phone (Optional)" id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} error={formErrors.phone} containerClassName="md:col-span-2" disabled={isSubmitting}/>
                      </div>
                    </Card>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="outline" onClick={() => navigate('/users/prospects')} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                            {isEditMode ? 'Save Changes' : 'Proceed to Payment'}
                        </Button>
                    </div>
                </form>
            )}

            {step === 'payment' && stripeOptions && stripeInstance && (
                <Card title="Audition Fee Payment" icon={<DollarSignIcon className="w-5 h-5 text-brand-primary" />} collapsible={false} className="mb-6">
                    <p className="text-sm text-brand-text-secondary mb-4">Please enter card details to pay the one-time audition fee of $100.00 USD.</p>
                    <Elements stripe={stripeInstance} options={stripeOptions}>
                        <ProspectPaymentForm />
                    </Elements>
                </Card>
            )}
        </div>
    );
};

export default ProspectFormPage;