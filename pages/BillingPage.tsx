
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Card from '../components/Card';
import { DollarSignIcon, UserCircleIcon, FilterIcon, IdCardIcon } from '../components/icons';
import { Student, MembershipPlanDefinition, Payment, Invoice, MockStripeSubscription } from '../types';
import { 
  getStudents, getMembershipPlans, getPaymentsByStudentId, 
  getInvoicesByStudentId, downloadInvoicePdf, createStripeSubscription, 
  getStudentStripeSubscription, cancelStripeSubscription, updateStripeSubscription,
  updatePaymentMethod
} from '../services/apiService';
import { showToast } from '../utils';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import Table, { ColumnDefinition } from '../components/Table';
import ConfirmationModal from '../components/modals/ConfirmationModal';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe("pk_test_51R4Y62RoIWWgoaNu8aBXQRu24UEFe4oNZzSFTv0nOpj1A3vNZbT2bHTAaWiCnj7Hk7YwYfKQQbtH6j2AjuMGfTkb00ch0mkTMb"); 

// New Modal for Updating Payment Method
const UpdatePaymentMethodModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  onSuccess: () => void;
}> = ({ isOpen, onClose, student, onSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        
        setIsProcessing(true);
        setError(null);
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError("Card element not found.");
            setIsProcessing(false);
            return;
        }

        try {
            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: {
                    name: `${student.firstName} ${student.lastName}`,
                    email: student.email,
                },
            });

            if (pmError) {
                throw new Error(pmError.message || 'Could not create payment method.');
            }

            await updatePaymentMethod(student.id, paymentMethod.id);
            showToast('Payment method updated successfully!', 'success');
            onSuccess();
            onClose();

        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update payment method.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Update Payment Method for {student.firstName}</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <p className="text-sm text-brand-text-secondary">Please enter the new card details below. This will be used for future subscription payments.</p>
                    <CardElement id="card-element" className="StripeElement" />
                    {error && <p className="text-xs text-brand-error mt-1">{error}</p>}
                    <div className="flex justify-end space-x-3 mt-4">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                        <Button type="submit" isLoading={isProcessing} disabled={!stripe || isProcessing}>Save Card</Button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// New Modal for Changing Plan
const UpdatePlanModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    student: Student;
    currentSubscription: MockStripeSubscription;
    membershipPlans: MembershipPlanDefinition[];
    onSuccess: () => void;
}> = ({ isOpen, onClose, student, currentSubscription, membershipPlans, onSuccess }) => {
    const currentPriceId = currentSubscription.items.data[0]?.price.id;
    const availablePlans = membershipPlans.filter(p => p.stripePriceId && p.stripePriceId !== currentPriceId);
    
    const [newPlanId, setNewPlanId] = useState<string>('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedPlanForUpdate = useMemo(() => {
        return membershipPlans.find(p => p.id === newPlanId);
    }, [newPlanId, membershipPlans]);

    const handleSubmit = async () => {
        if (!selectedPlanForUpdate || !selectedPlanForUpdate.stripePriceId) {
            setError("Please select a valid new plan.");
            return;
        }
        setIsProcessing(true);
        setError(null);
        try {
            await updateStripeSubscription(currentSubscription.id, selectedPlanForUpdate.stripePriceId);
            showToast("Membership plan updated successfully! Billing has been adjusted.", 'success');
            onSuccess();
            onClose();
        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to update plan.";
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
                <h3 className="text-xl font-semibold text-brand-text-primary mb-2">Change Membership Plan</h3>
                <p className="text-sm text-brand-text-secondary mb-4">For {student.firstName} {student.lastName}</p>
                <div className="space-y-4">
                     <p className="text-sm text-brand-text-secondary">Current Plan: <strong>{membershipPlans.find(p=>p.stripePriceId === currentPriceId)?.name || 'Unknown'}</strong></p>
                    <Select
                        id="new-plan-select"
                        label="Select New Plan"
                        options={availablePlans.map(p => ({ value: p.id, label: `${p.name} ($${p.monthlyPrice}/month)` }))}
                        value={newPlanId}
                        onChange={(e) => setNewPlanId(e.target.value)}
                        placeholderOption="Choose a new plan..."
                    />
                    {error && <p className="text-xs text-brand-error mt-1">{error}</p>}
                    <p className="text-xs text-brand-text-muted">Note: Your billing will be prorated immediately upon changing the plan.</p>
                </div>
                <div className="flex justify-end space-x-3 mt-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                    <Button onClick={handleSubmit} isLoading={isProcessing} disabled={isProcessing || !newPlanId}>Update Plan</Button>
                </div>
            </div>
        </div>
    );
};


// New Create Subscription Form
const CreateSubscriptionForm: React.FC<{
  student: Student;
  plansWithStripeId: MembershipPlanDefinition[];
  onSubscriptionSuccess: (subscription: MockStripeSubscription) => void;
}> = ({ student, plansWithStripeId, onSubscriptionSuccess }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedPlan = useMemo(() => plansWithStripeId.find(p => p.id === selectedPlanId), [selectedPlanId, plansWithStripeId]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError(null);
        if (!stripe || !elements || !selectedPlan || !selectedPlan.stripePriceId) {
            setError("Please select a plan and ensure payment details are correct.");
            return;
        }
        
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) {
            setError("Card element not found.");
            return;
        }

        setIsProcessing(true);
        try {
            const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
                type: 'card',
                card: cardElement,
                billing_details: { name: `${student.firstName} ${student.lastName}`, email: student.email },
            });

            if (pmError) throw new Error(pmError.message || "Could not create payment method.");

            const subscription = await createStripeSubscription(student.id, selectedPlan.stripePriceId, paymentMethod.id, student.stripeCustomerId);

            if (subscription.clientSecret) {
                const { error: confirmError } = await stripe.confirmCardPayment(subscription.clientSecret);
                if (confirmError) throw new Error(confirmError.message || "Payment confirmation failed.");
            }
            
            showToast("Subscription created successfully! The status will update shortly.", "success");
            
            // The `onSubscriptionSuccess` call triggers a data refresh. We delay it slightly
            // to give the Stripe webhook and backend time to process the final "active" status,
            // preventing a flicker of an "incomplete" state in the UI.
            setTimeout(() => {
                onSubscriptionSuccess(subscription);
            }, 3000); // 3-second delay for webhook processing

        } catch (err) {
            const msg = err instanceof Error ? err.message : "Failed to process subscription.";
            setError(msg);
            showToast(msg, "error");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
             <Select
                id="stripe-subscription-plan"
                label="Select Plan to Subscribe"
                options={plansWithStripeId.map(p => ({ value: p.id, label: `${p.name} ($${p.monthlyPrice}/month)`}))}
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                placeholderOption="Choose a plan..."
                disabled={isProcessing}
            />
            {selectedPlan && (
                 <div className="mt-4 p-4 border border-brand-neutral-200 rounded-md bg-brand-neutral-50">
                     <label className="block text-sm font-medium text-brand-text-secondary mb-1">Credit or debit card</label>
                     <CardElement id="card-element" className="StripeElement" />
                 </div>
            )}
            {error && <p className="text-xs text-brand-error mt-1">{error}</p>}
            <Button type="submit" variant="primary" isLoading={isProcessing} disabled={!stripe || !elements || isProcessing || !selectedPlan} className="w-full">
                Subscribe to {selectedPlan?.name || 'Plan'}
            </Button>
        </form>
    );
};


// Main Membership Card
const MembershipManagementCard: React.FC<{
  student: Student;
  membershipPlans: MembershipPlanDefinition[];
  onSubscriptionChange: () => void;
}> = ({ student, membershipPlans, onSubscriptionChange }) => {
  const [stripeSubscription, setStripeSubscription] = useState<MockStripeSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isUpdatePlanModalOpen, setIsUpdatePlanModalOpen] = useState(false);
  const [isUpdateCardModalOpen, setIsUpdateCardModalOpen] = useState(false);

  const fetchSubscription = useCallback(async () => {
    if (!student?.id) {
        setStripeSubscription(null);
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    try {
      const sub = await getStudentStripeSubscription(student.id);
      setStripeSubscription(sub);
    } catch (error) {
      if (!(error instanceof Error && error.message.includes('No active Stripe subscription found'))) { 
         showToast("Failed to fetch Stripe subscription status.", "error");
      }
      setStripeSubscription(null);
    } finally {
      setIsLoading(false);
    }
  }, [student?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const executeCancelSubscription = async () => {
    if (!student.stripeSubscriptionId) return;
    setIsProcessing(true);
    try {
      await cancelStripeSubscription(student.id, student.stripeSubscriptionId);
      showToast("Stripe subscription canceled successfully. It will remain active until the end of the current billing period.", "success");
      onSubscriptionChange(); 
    } catch (error) {
      showToast(`Failed to cancel Stripe subscription: ${error instanceof Error ? error.message : 'Unknown error'}`, "error");
    } finally {
      setIsProcessing(false);
      setIsCancelModalOpen(false);
    }
  };
  
  const getStatusInfo = (): { text: string; colorClass: string; } => {
    if (!stripeSubscription) return { text: 'No Subscription', colorClass: 'bg-brand-neutral-200 text-brand-neutral-800' };
    switch (stripeSubscription.status) {
        case 'active': return { text: 'Active', colorClass: 'bg-brand-success-light text-brand-success-dark' };
        case 'trialing': return { text: 'Trialing', colorClass: 'bg-brand-info-light text-brand-info' };
        case 'past_due':
        case 'unpaid': return { text: 'Past Due', colorClass: 'bg-brand-error-light text-brand-error-dark' };
        case 'canceled': return { text: 'Canceled', colorClass: 'bg-brand-warning-light text-brand-warning-dark' };
        case 'incomplete':
        case 'incomplete_expired': return { text: 'Incomplete', colorClass: 'bg-brand-warning-light text-brand-warning-dark' };
        default: return { text: stripeSubscription.status, colorClass: 'bg-brand-neutral-200 text-brand-neutral-800' };
    }
  }

  const plansWithStripeId = useMemo(() => membershipPlans.filter(p => p.stripePriceId), [membershipPlans]);
  const activeSubscribedPlan = stripeSubscription
    ? membershipPlans.find(p => p.stripePriceId === stripeSubscription.items.data[0]?.price.id)
    : null;
    
  return (
    <Card title="Student Membership" icon={<IdCardIcon className="text-brand-primary w-5 h-5" />} collapsible={false}>
      {isLoading ? (
        <p className="text-center text-brand-text-secondary py-4">Loading subscription status...</p>
      ) : stripeSubscription ? (
        <div className="space-y-4">
            <div className="p-3 bg-brand-neutral-50 rounded-md text-sm text-brand-text-primary space-y-1">
                 <p><strong className="font-semibold text-brand-text-primary">Plan:</strong> {activeSubscribedPlan?.name || 'Unknown Plan'}</p>
                 <p><strong className="font-semibold text-brand-text-primary">Status:</strong> <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusInfo().colorClass}`}>{getStatusInfo().text}</span></p>
                 <p>
                    <strong className="font-semibold text-brand-text-primary">{stripeSubscription.cancel_at_period_end ? 'Expires on:' : 'Renews on:'}</strong> 
                    {' '}{new Date(stripeSubscription.current_period_end * 1000).toLocaleDateString()}
                 </p>
            </div>
            
            {!stripeSubscription.cancel_at_period_end && (
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Button variant="outline" onClick={() => setIsUpdatePlanModalOpen(true)} disabled={isProcessing}>Change Plan</Button>
                    <Button variant="outline" onClick={() => setIsUpdateCardModalOpen(true)} disabled={isProcessing}>Update Payment Method</Button>
                    <Button variant="danger" onClick={() => setIsCancelModalOpen(true)} isLoading={isProcessing} disabled={isProcessing}>Cancel Subscription</Button>
                 </div>
            )}
            {stripeSubscription.cancel_at_period_end && (
                <p className="text-center text-sm p-3 bg-brand-warning-light text-brand-warning-dark rounded-md">This subscription is set to cancel at the end of the billing period.</p>
            )}
        </div>
      ) : (
        <div>
          <p className="text-brand-text-secondary mb-4">No active Stripe subscription found. Select a plan to begin.</p>
          <Elements stripe={stripePromise}>
            <CreateSubscriptionForm student={student} plansWithStripeId={plansWithStripeId} onSubscriptionSuccess={onSubscriptionChange}/>
          </Elements>
        </div>
      )}
      
      {stripeSubscription && (
        <>
            <UpdatePlanModal isOpen={isUpdatePlanModalOpen} onClose={() => setIsUpdatePlanModalOpen(false)} student={student} currentSubscription={stripeSubscription} membershipPlans={membershipPlans} onSuccess={onSubscriptionChange}/>
             <Elements stripe={stripePromise}>
                <UpdatePaymentMethodModal isOpen={isUpdateCardModalOpen} onClose={() => setIsUpdateCardModalOpen(false)} student={student} onSuccess={onSubscriptionChange} />
            </Elements>
            <ConfirmationModal
                isOpen={isCancelModalOpen}
                onClose={() => setIsCancelModalOpen(false)}
                onConfirm={executeCancelSubscription}
                title="Confirm Subscription Cancellation"
                message={<>Are you sure you want to cancel the <strong>{activeSubscribedPlan?.name || 'current'}</strong> subscription? This action will take effect at the end of the current billing period.</>}
                confirmationText="CANCEL"
                confirmButtonText="Yes, Cancel Subscription"
                confirmButtonVariant="danger"
            />
        </>
      )}
    </Card>
  );
};


const BillingPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanDefinition[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const [isLoadingStudents, setIsLoadingStudents] = useState(true);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isLoadingStudentDetails, setIsLoadingStudentDetails] = useState(false); 
  
  const [error, setError] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInitialData = useCallback(async () => {
    setIsLoadingStudents(true); 
    setIsLoadingPlans(true);
    setError(null);
    try {
      const [studentsData, plansData] = await Promise.all([
        getStudents(),
        getMembershipPlans()
      ]);
      setStudents(studentsData);
      setMembershipPlans(plansData);
    } catch (err) {
      const msg = "Failed to fetch initial data.";
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoadingStudents(false);
      setIsLoadingPlans(false);
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]); 


  const fetchStudentSpecificData = useCallback(async (studentId: string) => {
    if (!studentId) {
      setPayments([]);
      setInvoices([]);
      return;
    }
    setIsLoadingStudentDetails(true);
    const getArray = (response: any) => Array.isArray(response) ? response : (response && Array.isArray(response.data) ? response.data : []);
    
    try {
        const [paymentsRes, invoicesRes] = await Promise.all([
            getPaymentsByStudentId(studentId),
            getInvoicesByStudentId(studentId)
        ]);
        setPayments(getArray(paymentsRes));
        setInvoices(getArray(invoicesRes));
    } catch (err) {
        showToast("Failed to load payment or invoice history.", "error");
        setPayments([]);
        setInvoices([]);
    } finally {
        setIsLoadingStudentDetails(false);
    }
  }, []);

  const handleStudentSelect = useCallback((student: Student) => {
    setSelectedStudent(student); 
    fetchStudentSpecificData(student.id);
  }, [fetchStudentSpecificData]);
  
  const handleDataUpdateAndRefetchAll = useCallback(async () => {
    const currentStudentId = selectedStudent?.id;
    setIsLoadingStudentDetails(true);
    setIsLoadingStudents(true);
    try {
        const studentsData = await getStudents();
        setStudents(studentsData);

        if (currentStudentId) {
            const freshStudentDetails = studentsData.find(s => s.id === currentStudentId);
            setSelectedStudent(freshStudentDetails || null);
            if (freshStudentDetails) {
                 fetchStudentSpecificData(freshStudentDetails.id);
            }
        }
    } catch (error) {
        showToast(`Failed to refresh data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
        setIsLoadingStudentDetails(false);
        setIsLoadingStudents(false);
    }
  }, [selectedStudent?.id, fetchStudentSpecificData]);

  useEffect(() => {
    const handleDataChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        const { entity } = customEvent.detail;
        const relevantEntities = ['students', 'subscriptions', 'payments', 'invoices'];
        if (relevantEntities.includes(entity)) {
            console.log(`BillingPage: Refreshing data due to update on entity '${entity}'`);
            handleDataUpdateAndRefetchAll();
        }
    };

    window.addEventListener('datachange', handleDataChange);
    return () => window.removeEventListener('datachange', handleDataChange);
  }, [handleDataUpdateAndRefetchAll]);


  const filteredStudents = useMemo(() => {
    return students.filter(student =>
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [students, searchTerm]);

  const studentListColumns: ColumnDefinition<Student>[] = [
    { header: 'Name', accessor: 'firstName', render: (s) => `${s.firstName} ${s.lastName}` },
    { header: 'Email', accessor: 'email' },
    { 
      header: 'Stripe Status', 
      accessor: 'stripeSubscriptionStatus', 
      render: (s) => {
        const status = s.stripeSubscriptionStatus;
        if (!status) return <span className="text-brand-text-muted text-xs">Not Linked</span>;
        const color = status === 'active' ? 'bg-brand-success-light text-brand-success-dark' : 
                      (status === 'canceled' ? 'bg-brand-warning-light text-brand-warning-dark' : 'bg-brand-error-light text-brand-error-dark');
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
      }
    },
  ];

  const paymentColumns: ColumnDefinition<Payment>[] = [
    { header: 'Date', accessor: 'paymentDate', render: (p) => new Date(p.paymentDate).toLocaleDateString() },
    { header: 'Amount', accessor: 'amountPaid', render: (p) => `$${p.amountPaid.toFixed(2)}` },
    { header: 'Plan', accessor: 'membershipPlanName', render: (p) => p.membershipPlanName || 'N/A' },
    { header: 'Method', accessor: 'paymentMethod' },
  ];

  const invoiceColumns: ColumnDefinition<Invoice>[] = [
    { header: 'Invoice #', accessor: 'invoiceNumber' },
    { header: 'Issue Date', accessor: 'issueDate', render: (inv) => new Date(inv.issueDate).toLocaleDateString() },
    { header: 'Total', accessor: 'totalAmount', render: (inv) => `$${inv.totalAmount.toFixed(2)}` },
    { header: 'Status', accessor: 'status', render: (inv) => {
        const lowerStatus = String(inv.status).toLowerCase();
        const statusColor = lowerStatus === 'paid' ? 'text-brand-success' : 'text-brand-error';
        return <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColor.replace('text-', 'bg-')}-light ${statusColor}`}>{inv.status}</span>;
    }},
    { header: 'Actions', accessor: 'id', render: (inv) => (
        <Button variant="outline" size="sm" onClick={() => inv.id && downloadInvoicePdf(inv.id)} title="Download PDF">PDF</Button>
    )},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-text-primary">Billing & Payments</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card title="Select Student" icon={<FilterIcon className="text-brand-primary w-5 h-5"/>} collapsible={false}>
            <Input id="search-student" placeholder="Search by name or email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} containerClassName="mb-4" />
            {(isLoadingStudents || isLoadingPlans) ? <p className="text-center text-brand-text-secondary py-3">Loading data...</p> : (
              <div className="max-h-[60vh] overflow-y-auto">
                 <Table<Student> columns={studentListColumns} data={filteredStudents} onRowClick={handleStudentSelect} emptyStateMessage="No students found." />
              </div>
            )}
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedStudent ? (
            <>
              <MembershipManagementCard student={selectedStudent} membershipPlans={membershipPlans} onSubscriptionChange={handleDataUpdateAndRefetchAll} />
              <Card title="Payment History" icon={<DollarSignIcon className="text-brand-primary w-5 h-5" />} collapsible={true}>
                <Table<Payment> columns={paymentColumns} data={payments} isLoading={isLoadingStudentDetails} emptyStateMessage="No payments recorded."/>
              </Card>
              <Card title="Invoices" icon={<DollarSignIcon className="text-brand-primary w-5 h-5" />} collapsible={true}>
                <Table<Invoice> columns={invoiceColumns} data={invoices} isLoading={isLoadingStudentDetails} emptyStateMessage="No invoices found." />
              </Card>
            </>
          ) : (
            <Card title="Student Billing Details" icon={<UserCircleIcon className="text-brand-primary w-5 h-5" />}>
              <p className="text-brand-text-secondary text-center py-10">Select a student from the list to manage their membership and billing.</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingPage;
