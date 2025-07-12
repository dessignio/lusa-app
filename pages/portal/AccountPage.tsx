
import React, { useState, useEffect } from 'react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { showToast } from '../../utils';
import { updateStudent, updatePaymentMethod, updateStripeSubscription, cancelStripeSubscription, getMembershipPlans } from '../../services/apiService';
import Card from '../../components/Card';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import { StudentFormData, MembershipPlanDefinition } from '../../types';
import { UserCircleIcon, IdCardIcon, DollarSignIcon } from '../../components/icons';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { calculateAge } from '../../utils';

const stripePromise = loadStripe("pk_test_51R4Y62RoIWWgoaNu8aBXQRu24UEFe4oNZzSFTv0nOpj1A3vNZbT2bHTAaWiCnj7Hk7YwYfKQQbtH6j2AjuMGfTkb00ch0mkTMb"); 

type ActiveTab = 'profile' | 'membership' | 'payment';

// --- Profile Settings Tab ---
const ProfileSettings: React.FC = () => {
    const { selectedStudent, loadProfile } = useClientAuth();
    const [formData, setFormData] = useState<Partial<StudentFormData>>({ ...selectedStudent });
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    useEffect(() => {
        setFormData({ ...selectedStudent });
    }, [selectedStudent]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name.includes('.')) {
            const [parent, child] = name.split('.');
            setFormData(prev => ({ ...prev, [parent]: { ...prev[parent], [child]: value }}));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if(!selectedStudent) return;
        setIsSubmitting(true);
        try {
            const profileData: Partial<StudentFormData> = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                phone: formData.phone,
                address: formData.address,
                emergencyContact: formData.emergencyContact,
            };

            await updateStudent(selectedStudent.id, profileData);

            if (formData.password && formData.password === formData.confirmPassword) {
                await updateStudent(selectedStudent.id, { password: formData.password });
            }
            showToast("Profile updated successfully!", "success");
            loadProfile(); // Refresh auth context data
        } catch(err) {
            showToast(`Update failed: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="First Name" id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} required />
                <Input label="Last Name" id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} required />
                <Input label="Email" id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required />
                <Input label="Phone" id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} />
            </div>
            <Input label="Street Address" id="address.street" name="address.street" value={formData.address?.street || ''} onChange={handleChange} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="City" id="address.city" name="address.city" value={formData.address?.city || ''} onChange={handleChange} />
                <Input label="State" id="address.state" name="address.state" value={formData.address?.state || ''} onChange={handleChange} />
            </div>
            <h4 className="font-semibold pt-4 border-t border-brand-neutral-200">Emergency Contact</h4>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Contact Name" id="emergencyContact.name" name="emergencyContact.name" value={formData.emergencyContact?.name || ''} onChange={handleChange} />
                <Input label="Contact Phone" id="emergencyContact.phone" name="emergencyContact.phone" type="tel" value={formData.emergencyContact?.phone || ''} onChange={handleChange} />
            </div>
            <h4 className="font-semibold pt-4 border-t border-brand-neutral-200">Change Password</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="New Password" id="password" name="password" type="password" value={formData.password || ''} onChange={handleChange} placeholder="Leave blank to keep current" />
                <Input label="Confirm New Password" id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword || ''} onChange={handleChange} />
            </div>
            <div className="text-right">
                <Button type="submit" isLoading={isSubmitting}>Save Profile</Button>
            </div>
        </form>
    );
}

// --- Membership Settings Tab ---
const MembershipSettings: React.FC = () => {
    const { selectedStudent, loadProfile } = useClientAuth();
    const [plans, setPlans] = useState<MembershipPlanDefinition[]>([]);
    const [selectedNewPlanId, setSelectedNewPlanId] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);
    const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

    useEffect(() => {
        getMembershipPlans().then(setPlans).catch(err => showToast(`Failed to load plans: ${err.message}`, 'error'));
    }, []);

    const currentPlan = plans.find(p => p.id === selectedStudent?.membershipPlanId);

    const handlePlanChange = async () => {
        if (!selectedNewPlanId || !selectedStudent?.stripeSubscriptionId) return;
        setIsUpdating(true);
        const selectedPlanDetails = plans.find(p=>p.id === selectedNewPlanId);
        if(!selectedPlanDetails?.stripePriceId) {
            showToast("Selected plan does not have a valid Stripe Price ID.", 'error');
            setIsUpdating(false);
            return;
        }

        try {
            await updateStripeSubscription(selectedStudent.stripeSubscriptionId, selectedPlanDetails.stripePriceId);
            showToast("Membership plan updated successfully!", "success");
            loadProfile(); // Refresh context
        } catch(err) {
             showToast(`Failed to update plan: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleCancel = async () => {
        if (!selectedStudent?.stripeSubscriptionId) return;
        setIsUpdating(true);
        try {
            await cancelStripeSubscription(selectedStudent.id, selectedStudent.stripeSubscriptionId);
            showToast("Subscription cancellation requested. It will end after the current billing period.", 'success');
            loadProfile();
        } catch(err) {
             showToast(`Failed to cancel subscription: ${err instanceof Error ? err.message : 'Unknown error'}`, "error");
        } finally {
            setIsUpdating(false);
            setIsCancelModalOpen(false);
        }
    };
    
    if (!selectedStudent) return <p>Loading...</p>;
    
    return (
        <div className="space-y-6">
            <div>
                <h4 className="font-semibold text-brand-text-primary">Current Plan</h4>
                {currentPlan ? (
                    <div className="mt-2 p-4 bg-brand-neutral-50 rounded-md">
                        <p className="text-xl font-bold text-brand-primary">{currentPlan.name}</p>
                        <p className="text-sm">{currentPlan.description}</p>
                        <p className="text-sm mt-1"><strong className="font-medium">Renews on:</strong> {selectedStudent.membershipRenewalDate ? new Date(selectedStudent.membershipRenewalDate).toLocaleDateString() : 'N/A'}</p>
                    </div>
                ) : <p className="text-sm text-brand-text-muted mt-2">No active membership plan.</p>}
            </div>
             {selectedStudent.stripeSubscriptionId && (
                <>
                    <div className="border-t pt-6">
                        <h4 className="font-semibold text-brand-text-primary">Change Plan</h4>
                        <div className="flex items-end gap-4 mt-2">
                           <Select
                                id="new-plan"
                                label="Select New Plan"
                                options={plans.filter(p => p.id !== currentPlan?.id).map(p => ({ value: p.id, label: `${p.name} ($${p.monthlyPrice}/mo)`}))}
                                value={selectedNewPlanId}
                                onChange={(e) => setSelectedNewPlanId(e.target.value)}
                                containerClassName="flex-grow mb-0"
                                disabled={isUpdating}
                           />
                           <Button onClick={handlePlanChange} isLoading={isUpdating} disabled={!selectedNewPlanId || isUpdating}>Update Plan</Button>
                        </div>
                    </div>
                    <div className="border-t pt-6">
                        <h4 className="font-semibold text-brand-text-primary">Cancel Subscription</h4>
                        <p className="text-sm text-brand-text-secondary mt-1">Your plan will remain active until the end of the current billing period.</p>
                        <Button variant="danger" onClick={() => setIsCancelModalOpen(true)} isLoading={isUpdating} className="mt-2">Request Cancellation</Button>
                    </div>
                    <ConfirmationModal 
                        isOpen={isCancelModalOpen}
                        onClose={() => setIsCancelModalOpen(false)}
                        onConfirm={handleCancel}
                        title="Confirm Subscription Cancellation"
                        message="Are you sure you want to cancel your plan? This action cannot be undone."
                        confirmationText="CANCEL"
                        confirmButtonText="Yes, Cancel"
                    />
                </>
             )}
        </div>
    );
};

// --- Payment Settings Tab ---
const PaymentSettings: React.FC = () => {
    const stripe = useStripe();
    const elements = useElements();
    const { selectedStudent, loadProfile } = useClientAuth();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!stripe || !elements || !selectedStudent) return;
        const cardElement = elements.getElement(CardElement);
        if(!cardElement) return;

        setIsProcessing(true);
        setError(null);

        try {
            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
            });
            if(pmError) throw new Error(pmError.message || 'Could not create payment method.');

            await updatePaymentMethod(selectedStudent.id, paymentMethod.id);
            showToast("Payment method updated successfully!", "success");
            cardElement.clear();
            loadProfile();
        } catch(err) {
            const msg = err instanceof Error ? err.message : "Failed to update payment method.";
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-brand-text-secondary">Update the credit or debit card used for your membership subscription.</p>
            <div className="p-4 border rounded-md bg-white">
                <CardElement id="card-element" className="StripeElement" />
            </div>
            {error && <p className="text-xs text-brand-error">{error}</p>}
            <div className="text-right">
                <Button type="submit" isLoading={isProcessing} disabled={!stripe || isProcessing}>Save Card</Button>
            </div>
        </form>
    );
};

// --- Main Account Page Component ---
const PortalAccountPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
    const { selectedStudent, user } = useClientAuth();

    const studentAge = selectedStudent ? calculateAge(selectedStudent.dateOfBirth) : null;
    const isMinor = studentAge !== null && studentAge < 18;
    
    useEffect(() => {
        // If viewing a minor student and the current user is NOT the parent,
        // reset the active tab to 'profile' if it's on a restricted tab.
        if (isMinor && user?.userType !== 'parent' && (activeTab === 'membership' || activeTab === 'payment')) {
            setActiveTab('profile');
        }
    }, [isMinor, activeTab, selectedStudent, user?.userType]);


    const allTabs: { id: ActiveTab; label: string; icon: React.ReactNode; show: boolean }[] = [
        { id: 'profile', label: 'Profile', icon: <UserCircleIcon className="w-5 h-5"/>, show: true },
        { id: 'membership', label: 'Membership', icon: <IdCardIcon className="w-5 h-5"/>, show: user?.userType === 'parent' || !isMinor },
        { id: 'payment', label: 'Payment Method', icon: <DollarSignIcon className="w-5 h-5"/>, show: user?.userType === 'parent' || !isMinor },
    ];
    const availableTabs = allTabs.filter(tab => tab.show);

    const renderTabContent = () => {
        const canViewSensitiveTabs = user?.userType === 'parent' || !isMinor;
        switch (activeTab) {
            case 'profile': return <ProfileSettings />;
            case 'membership': return canViewSensitiveTabs ? <MembershipSettings /> : null;
            case 'payment': return canViewSensitiveTabs ? <Elements stripe={stripePromise}><PaymentSettings /></Elements> : null;
            default: return null;
        }
    };
    
    const TabButton: React.FC<{tabId: ActiveTab, title: string, icon: React.ReactNode}> = ({tabId, title, icon}) => (
        <button
            onClick={() => setActiveTab(tabId)}
            className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-md focus:outline-none transition-colors w-full text-left ${
                activeTab === tabId ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-neutral-100'
            }`}
        >{icon}<span>{title}</span></button>
    );

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">My Account</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="md:col-span-1">
                    <div className="space-y-2 p-2 bg-brand-neutral-50 rounded-lg">
                       {availableTabs.map(tab => (
                           <TabButton key={tab.id} tabId={tab.id} title={tab.label} icon={tab.icon}/>
                       ))}
                    </div>
                </div>
                <div className="md:col-span-3">
                    <Card collapsible={false} title={activeTab.charAt(0).toUpperCase() + activeTab.slice(1) + " Settings"}>
                        {renderTabContent()}
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default PortalAccountPage;