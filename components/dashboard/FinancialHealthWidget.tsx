
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { AgedAccountSummary, MembershipPlanDefinition, RevenueDataPoint, Student, Invoice, Payment } from '../../types';
import { getStudents, getMembershipPlans, getPaymentsByStudentId, getInvoicesByStudentId } from '../../services/apiService';
import { showToast } from '../../utils';
import { DollarSignIcon, ChartBarIcon, IdCardIcon } from '../icons';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';


const AgedAccountsContent: React.FC = () => {
    const [data, setData] = useState<AgedAccountSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAgedAccounts = async () => {
            setIsLoading(true);
            try {
                const students = await getStudents();
                const invoicePromises = students.map(s => getInvoicesByStudentId(s.id));
                const allInvoicesNested = await Promise.all(invoicePromises);
                const allInvoices = allInvoicesNested.flat();

                const today = new Date();
                today.setHours(0, 0, 0, 0);

                let totalOutstanding = 0;
                const brackets = {
                    'Current': 0,
                    '1-30 Days Past Due': 0,
                    '31-60 Days Past Due': 0,
                    '61-90 Days Past Due': 0,
                    '90+ Days Past Due': 0,
                };

                allInvoices.forEach(invoice => {
                    if (invoice.status === 'Paid' || invoice.status === 'Void' || invoice.amountDue <= 0) {
                        return;
                    }

                    const dueDate = new Date(invoice.dueDate);
                    
                    if (isNaN(dueDate.getTime())) return;

                    // Only add to total if the due date is valid
                    totalOutstanding += invoice.amountDue;
                    
                    // Use UTC to avoid timezone pitfalls with date-only strings
                    const utcDueDate = new Date(Date.UTC(dueDate.getUTCFullYear(), dueDate.getUTCMonth(), dueDate.getUTCDate()));
                    const utcToday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
                    
                    const diffTime = utcToday.getTime() - utcDueDate.getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays <= 0) {
                        brackets['Current'] += invoice.amountDue;
                    } else if (diffDays <= 30) {
                        brackets['1-30 Days Past Due'] += invoice.amountDue;
                    } else if (diffDays <= 60) {
                        brackets['31-60 Days Past Due'] += invoice.amountDue;
                    } else if (diffDays <= 90) {
                        brackets['61-90 Days Past Due'] += invoice.amountDue;
                    } else {
                        brackets['90+ Days Past Due'] += invoice.amountDue;
                    }
                });
                
                const summaryData: AgedAccountSummary = {
                    totalOutstanding: totalOutstanding,
                    balanceIncludingCredits: totalOutstanding, // Placeholder, as credits are not tracked in this context
                    ageBrackets: Object.entries(brackets).map(([label, amount]) => ({
                        label,
                        amount,
                        percentage: totalOutstanding > 0 ? (amount / totalOutstanding) * 100 : 0,
                    })),
                    lastRefreshed: new Date().toISOString(),
                };
                
                setData(summaryData);

            } catch (e) {
                // showToast("Failed to load aged accounts.", "error");
                setData(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAgedAccounts();
    }, []);

    if (isLoading) return <p className="text-center p-4">Loading aged accounts...</p>;
    if (!data) return <p className="text-center p-4 text-brand-text-muted">Aged accounts data is currently unavailable.</p>;
    
    return (
        <div className="space-y-3">
             <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-brand-error-light/50 p-2 rounded">
                    <p className="text-xs text-brand-error-dark">Total Vencido</p>
                    <p className="font-bold text-lg text-brand-error-dark">${data.totalOutstanding.toFixed(2)}</p>
                </div>
                 <div className="bg-brand-neutral-200 p-2 rounded">
                    <p className="text-xs text-brand-text-secondary">Balance Total</p>
                    <p className="font-bold text-lg text-brand-text-primary">${data.balanceIncludingCredits.toFixed(2)}</p>
                </div>
            </div>
            {data.ageBrackets.map(bracket => (
                <div key={bracket.label}>
                    <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-brand-text-secondary">{bracket.label}</span>
                        <span className="text-brand-text-primary font-semibold">${bracket.amount.toFixed(2)}</span>
                    </div>
                    <div className="w-full bg-brand-neutral-200 rounded-full h-2">
                        <div className={`h-2 rounded-full ${bracket.label === 'Current' ? 'bg-brand-success' : 'bg-brand-error'}`} style={{ width: `${bracket.percentage}%` }}></div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const RevenueContent: React.FC = () => {
    const [data, setData] = useState<RevenueDataPoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchRevenueData = async () => {
            setIsLoading(true);
            try {
                const students = await getStudents();
                const paymentPromises = students.map(s => getPaymentsByStudentId(s.id));
                const allPaymentsNested = await Promise.all(paymentPromises);
                const allPayments = allPaymentsNested.flat();

                const monthlyTotals: { [key: string]: number } = {};
                
                allPayments.forEach(payment => {
                    const paymentDate = new Date(payment.paymentDate);
                    // Check for valid date
                    if (isNaN(paymentDate.getTime())) return;
                    
                    // Use UTC month/year to avoid timezone issues
                    const monthYear = new Date(Date.UTC(paymentDate.getUTCFullYear(), paymentDate.getUTCMonth())).toLocaleDateString('en-US', { year: 'numeric', month: 'short', timeZone: 'UTC' });
                    monthlyTotals[monthYear] = (monthlyTotals[monthYear] || 0) + payment.amountPaid;
                });

                const revenueData = Object.entries(monthlyTotals)
                    .map(([month, revenue]) => ({ month, revenue }))
                    .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
                
                setData(revenueData);

            } catch(e) {
                // showToast("Failed to load revenue data.", "error");
                setData([]);
            } finally {
                setIsLoading(false);
            }
        }
        fetchRevenueData();
    }, []);

    if (isLoading) return <p className="text-center p-4">Loading revenue...</p>;
    if (data.length === 0) return <p className="text-center p-4 text-brand-text-muted">Revenue data is currently unavailable.</p>;

    return (
        <div style={{ height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #ddd', borderRadius: '4px' }} formatter={(value: number) => `$${value.toFixed(2)}`}/>
                    <Legend wrapperStyle={{fontSize: "12px"}}/>
                    <Bar dataKey="revenue" fill="#7249AB" name="Revenue" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};


const MembershipSnapshotContent: React.FC = () => {
    const [distribution, setDistribution] = useState<{name: string, value: number}[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        Promise.all([getStudents(), getMembershipPlans()])
            .then(([studentsData, plansData]) => {
                const counts: Record<string, number> = {};
                studentsData.forEach(s => {
                    const planId = s.membershipPlanId;
                    if (planId) {
                        counts[planId] = (counts[planId] || 0) + 1;
                    }
                });
                const distData = Object.entries(counts).map(([planId, count]) => {
                    const plan = plansData.find(p => p.id === planId);
                    return { name: plan?.name || 'Unknown Plan', value: count };
                });
                setDistribution(distData);
            })
            .catch(() => showToast("Failed to load membership data.", "error"))
            .finally(() => setIsLoading(false));
    }, []);
    
    if (isLoading) return <p className="text-center p-4">Loading membership data...</p>;
    if (distribution.length === 0) return <p className="text-center p-4">No students with memberships.</p>;
    
    const COLORS = ['#7249AB', '#9397BD', '#9E78D9', '#6A6D98', '#BFC2E2'];

    return (
         <div style={{ height: 250 }}>
            <ResponsiveContainer>
                <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                       {distribution.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                    <Legend layout="vertical" align="right" verticalAlign="middle" wrapperStyle={{fontSize: "12px"}}/>
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


export const FinancialHealthWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState('revenue');
  
  const TabButton: React.FC<{tabId: string; title: string; icon: React.ReactNode}> = ({ tabId, title, icon }) => (
     <button
        onClick={() => setActiveTab(tabId)}
        className={`flex items-center space-x-2 px-3 py-2 text-sm font-medium rounded-t-md focus:outline-none transition-colors ${
          activeTab === tabId
            ? 'bg-white text-brand-primary border-b-2 border-brand-primary'
            : 'text-brand-text-muted hover:text-brand-primary hover:bg-brand-neutral-50'
        }`}
      >
        {icon}
        <span>{title}</span>
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
        case 'revenue': return <RevenueContent />;
        case 'agedAccounts': return <AgedAccountsContent />;
        case 'memberships': return <MembershipSnapshotContent />;
        default: return null;
    }
  };

  return (
     <div className="bg-white rounded-lg shadow-md">
      <div className="flex items-center border-b border-brand-neutral-200 px-4">
        <TabButton tabId="revenue" title="Ingresos" icon={<ChartBarIcon className="w-4 h-4" />} />
        <TabButton tabId="agedAccounts" title="Cuentas Vencidas" icon={<DollarSignIcon className="w-4 h-4" />} />
        <TabButton tabId="memberships" title="Membresías" icon={<IdCardIcon className="w-4 h-4" />} />
      </div>
      <div className="p-4 min-h-[200px]">
        {renderContent()}
      </div>
    </div>
  );
};