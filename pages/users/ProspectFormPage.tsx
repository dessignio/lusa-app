import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { ProspectFormData } from '../../types';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, DollarSignIcon } from '../../components/icons';
import { getProspectById, createProspect, updateProspect, getConnectAccountId, createAuditionPaymentIntent } from '../../services/apiService';
import { showToast } from '../../utils';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// This child component is already correct and doesn't need changes.
// It renders the PaymentElement and handles the final confirmation.
const ProspectPaymentForm: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                return_url: `${window.location.origin}/payment-confirmation`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message || 'An unexpected error occurred.');
            setIsProcessing(false);
            return;
        }

        if (paymentIntent) {
            const prospectData = JSON.parse(sessionStorage.getItem('prospectFormData') || '{}');
            if (prospectData.email && paymentIntent.status === 'succeeded') {
                try {
                    await createProspect(prospectData, paymentIntent.id);
                    sessionStorage.removeItem('prospectFormData');
                    showToast("Prospect registered successfully!", "success");
                    navigate('/users/prospects');
                } catch (apiError) {
                     setErrorMessage((apiError as Error).message || 'Failed to save prospect.');
                }
            }
        }
        setIsProcessing(false);
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="w-full mb-4 min-h-[510px] h-auto">
                <PaymentElement />
            </div>
            {errorMessage && <div className="p-3 my-4 bg-red-100 text-red-700 rounded-md text-sm">{errorMessage}</div>}
            <Button type="submit" variant="primary" isLoading={isProcessing} disabled={!stripe || isProcessing} className="mt-6 w-full">
                Pay Audition Fee
            </Button>
        </form>
    );
};

// Main component with adjusted logic.
const ProspectFormPage: React.FC = () => {
    const { prospectId } = useParams<{ prospectId: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(prospectId);

    const [step, setStep] = useState('details');
    const [formData, setFormData] = useState<ProspectFormData>({
        firstName: '', lastName: '', email: '', dateOfBirth: '', phone: '',
    });
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProspectFormData, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // ✅ State is simplified to hold the Stripe promise and options together.
    const [paymentContext, setPaymentContext] = useState<{
        stripePromise: Promise<Stripe | null>;
        options: { clientSecret: string; appearance: any; };
    } | null>(null);

    useEffect(() => {
        if (isEditMode && prospectId) {
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
                });
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

    // ✅ This function now correctly sets up the context for the payment step.
    const handleProceedToPayment = async () => {
        if (!validateForm()) {
            showToast("Please correct the form errors.", "error");
            return;
        }

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            // 1. Fetch the dynamic account ID for the connected user.
            const { stripeAccountId } = await getConnectAccountId();
            
            // 2. Create the Stripe Promise scoped to that account.
            const stripePromise = loadStripe("pk_test_51R4Y62RoIWWgoaNu8aBXQRu24UEFe4oNZzSFTv0nOpj1A3vNZbT2bHTAaWiCnj7Hk7YwYfKQQbtH6j2AjuMGfTkb00ch0mkTMb", { 
                stripeAccount: stripeAccountId 
            });

            // 3. Create the Payment Intent to get the "ticket" (clientSecret).
            const { clientSecret } = await createAuditionPaymentIntent({
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
            });
            
            // 4. Set the promise and options in state together.
            setPaymentContext({
                stripePromise,
                options: { clientSecret, appearance: { theme: 'stripe' } }
            });

            sessionStorage.setItem('prospectFormData', JSON.stringify(formData));
            setStep('payment');

        } catch (err) {
            setSubmitError((err as Error).message);
            showToast(`Failed to proceed to payment: ${(err as Error).message}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <NavLink to="/users/prospects" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Prospect List
            </NavLink>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">
                {isEditMode ? 'Edit Prospect' : 'Add New Prospect'}
            </h1>
          
            {submitError && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm">{submitError}</div>}
            
            {step === 'details' && (
                <form onSubmit={(e) => { e.preventDefault(); handleProceedToPayment(); }}>
                    <Card title="Prospect Information" icon={<UserPlusIcon />}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-0">
                            {/* Input fields remain the same */}
                            <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} error={formErrors.firstName} required disabled={isSubmitting}/>
                            <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} error={formErrors.lastName} required disabled={isSubmitting}/>
                            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleChange} error={formErrors.email} required disabled={isSubmitting}/>
                            <Input label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} error={formErrors.dateOfBirth} required disabled={isSubmitting}/>
                        </div>
                    </Card>
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
                            Proceed to Payment
                        </Button>
                    </div>
                </form>
            )}

            {step === 'payment' && paymentContext && (
                <Card title="Audition Fee Payment" icon={<DollarSignIcon />} noContentPadding={true}>
                    <div className="p-4 overflow-visible">
                        <p className="text-sm text-brand-text-secondary mb-4">Please enter card details to pay the one-time audition fee of $100.00 USD.</p>
                        {/* ✅ The Elements provider now correctly receives the scoped promise and clientSecret. */}
                        <Elements stripe={paymentContext.stripePromise} options={paymentContext.options}>
                            <ProspectPaymentForm navigate={navigate} />
                        </Elements>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ProspectFormPage;