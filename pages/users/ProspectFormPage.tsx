import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { ProspectFormData } from '../../types';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, DollarSignIcon } from '../../components/icons';
import { getProspectById, createProspect, updateProspect, createAuditionPaymentIntent } from '../../services/apiService';
import { showToast } from '../../utils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Tu clave pública de Stripe (esto no cambia)
const stripePromise = loadStripe("pk_test_51R4Y62RoIWWgoaNu8aBXQRu24UEFe4oNZzSFTv0nOpj1A3vNZbT2bHTAaWiCnj7Hk7YwYfKQQbtH6j2AjuMGfTkb00ch0mkTMb");

const initialProspectFormData: ProspectFormData = {
    firstName: '',
    lastName: '',
    email: '',
    dateOfBirth: '',
    phone: '',
};

const ProspectFormContent: React.FC = () => {
    const { prospectId } = useParams<{ prospectId: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(prospectId);

    const stripe = useStripe();
    const elements = useElements();
    const { user } = useAuth();

    const [formData, setFormData] = useState<ProspectFormData>(initialProspectFormData);
    const [formErrors, setFormErrors] = useState<Partial<Record<keyof ProspectFormData, string>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

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

    // ==================================================================
    // 👇 AQUÍ COMIENZA LA FUNCIÓN `handleSubmit` ACTUALIZADA
    // ==================================================================
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);
        if (!validateForm()) {
            showToast("Please correct the form errors.", "error");
            return;
        }

        if (isEditMode && prospectId) {
            setIsSubmitting(true);
            try {
                await updateProspect(prospectId, formData);
                showToast("Prospect updated successfully!", 'success');
                navigate('/users/prospects');
            } catch (err) {
                 setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred.');
                 showToast(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        setIsSubmitting(true);

        if (!stripe || !elements) {
            setSubmitError("Stripe is not ready. Please wait a moment and try again.");
            setIsSubmitting(false);
            return;
        }

        try {
            // Paso 1: Validar el formulario de pago antes de cualquier acción asíncrona.
            const submitResult = await elements.submit();
            if (submitResult.error) {
                throw new Error(submitResult.error.message);
            }

            // Paso 2: Crear el Payment Intent en el backend DESPUÉS de la validación del formulario.
            const { clientSecret } = await createAuditionPaymentIntent({
                name: `${formData.firstName} ${formData.lastName}`,
                email: formData.email,
            });

            // Paso 3: Confirmar el pago con el clientSecret obtenido.
            const paymentResult = await stripe.confirmPayment({
                elements,
                clientSecret,
                confirmParams: {
                    return_url: `${window.location.origin}/payment-confirmation`,
                },
                redirect: 'if_required',
            });

            if (paymentResult.error) {
                if (paymentResult.error.type === "card_error" || paymentResult.error.type === "validation_error") {
                    throw new Error(paymentResult.error.message || "Payment failed. Please check your card details.");
                } else {
                    throw new Error("An unexpected error occurred during payment.");
                }
            }

            if (paymentResult.paymentIntent && paymentResult.paymentIntent.status === 'succeeded') {
                const auditionPaymentId = paymentResult.paymentIntent.id;
                await createProspect(formData, auditionPaymentId);
                showToast("Prospect registered and audition fee paid successfully!", "success");
                navigate('/users/prospects');
            } else {
                 throw new Error("Payment was not successful. Please try again.");
            }
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred.');
            showToast(`Operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
        } finally {
            setIsSubmitting(false);
        }
    };
    // ==================================================================
    // 👆 AQUÍ TERMINA LA FUNCIÓN `handleSubmit` ACTUALIZADA
    // ==================================================================

    if (isLoading) {
        return <div className="text-center p-10 text-brand-text-secondary">Loading...</div>;
    }

    // El JSX del formulario no necesita cambios
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
            
            <form onSubmit={handleSubmit}>
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

                {!isEditMode && (
                    <Card title="Audition Fee Payment" icon={<DollarSignIcon className="w-5 h-5 text-brand-primary" />} collapsible={false} className="mb-6">
                        <p className="text-sm text-brand-text-secondary mb-4">Please enter card details to pay the one-time audition fee of $100.00 USD.</p>
                         <PaymentElement id="payment-element" />
                    </Card>
                )}
                
                <div className="flex justify-end space-x-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/users/prospects')} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting || (!isEditMode && (!stripe || !elements))}>
                        {isEditMode ? 'Save Changes' : 'Submit & Pay Audition Fee'}
                    </Button>
                </div>
            </form>
        </div>
    );
};


const ProspectFormPage: React.FC = () => {
  const options = {
    mode: 'payment' as const,
    amount: 10000, // Audition fee: $100.00 USD
    currency: 'usd',
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <ProspectFormContent />
    </Elements>
  );
};


export default ProspectFormPage;