
import React, { useState, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import { FinancialMetrics } from '../../types';
import { getFinancialMetrics } from '../../services/apiService';
import { showToast } from '../../utils';
import { ChartBarIcon, ChevronLeftIcon, UsersIcon, DollarSignIcon, InfoCircleIcon, IdCardIcon } from '../../components/icons';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#7249AB', '#9397BD', '#9E78D9', '#6A6D98', '#BFC2E2', '#51279B'];

const MetricCard: React.FC<{ title: string; value: string; helpText: string; isLoading: boolean; children?: React.ReactNode, icon: React.ReactNode }> = ({ title, value, helpText, isLoading, children, icon }) => {
    return (
        <Card title={title} icon={icon} collapsible={false} className="flex flex-col">
            <div className="flex-grow">
                {isLoading ? (
                    <div className="h-24 flex items-center justify-center">
                        <p className="text-brand-text-muted animate-pulse">Calculating...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-4xl font-bold text-brand-text-primary">{value}</p>
                            <div className="relative group">
                                <InfoCircleIcon className="w-5 h-5 text-brand-text-muted cursor-pointer" />
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 text-xs text-white bg-brand-neutral-800 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {helpText}
                                </div>
                            </div>
                        </div>
                        {children}
                    </>
                )}
            </div>
        </Card>
    );
};

const FinancialDashboardPage: React.FC = () => {
    const [metrics, setMetrics] = useState<FinancialMetrics | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const metricsData = await getFinancialMetrics();
            setMetrics(metricsData);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load financial metrics.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (error) {
        return <div className="p-6 text-center text-brand-error">Error loading dashboard: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Reports Hub
            </NavLink>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
                <ChartBarIcon className="w-8 h-8 mr-3 text-brand-primary" />
                Financial BI Dashboard
            </h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <MetricCard 
                    title="Monthly Recurring Revenue (MRR)" 
                    value={metrics ? `$${metrics.mrr.toFixed(2)}` : '$0.00'} 
                    isLoading={isLoading} 
                    icon={<DollarSignIcon className="w-6 h-6 text-brand-primary" />} 
                    helpText="The total predictable revenue from active subscriptions, normalized to a monthly amount." 
                />
                <MetricCard 
                    title="Active Stripe Subscribers" 
                    value={metrics ? metrics.activeSubscribers.toString() : '0'} 
                    isLoading={isLoading} 
                    icon={<UsersIcon className="w-6 h-6 text-brand-primary" />} 
                    helpText="The total number of customers with an 'active' or 'trialing' subscription in Stripe. This number may differ from the total 'Alumnos Activos' if some students pay via other methods." 
                />
                <MetricCard 
                    title="Avg. Revenue / User (ARPU)" 
                    value={metrics ? `$${metrics.arpu.toFixed(2)}` : '$0.00'} 
                    isLoading={isLoading} 
                    icon={<DollarSignIcon className="w-6 h-6 text-brand-primary" />} 
                    helpText="Average monthly revenue per active subscriber (MRR / Active Subscribers)." 
                />
                
                <Card title="Membership Plan Mix" icon={<IdCardIcon className="w-6 h-6 text-brand-primary" />} className="lg:col-span-2">
                    {isLoading ? <div className="h-64 flex items-center justify-center"><p className="text-brand-text-muted animate-pulse">Calculating...</p></div> : 
                        metrics && metrics.planMix.length > 0 ? (
                        <div style={{ height: 300 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={metrics.planMix} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                        {metrics.planMix.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => `${value} subscribers`} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <p className="text-center p-8 text-brand-text-muted">No active subscriptions to display.</p>
                    )}
                </Card>
                
                <MetricCard 
                    title="Payment Failure Rate" 
                    value={metrics ? `${metrics.paymentFailureRate.toFixed(1)}%` : '0.0%'} 
                    isLoading={isLoading} 
                    icon={<InfoCircleIcon className="w-6 h-6 text-brand-primary" />} 
                    helpText="Percentage of renewal invoices from the last 30 days that became overdue. A proxy for payment failures."
                />
                
                <MetricCard 
                    title="Subscriber Churn Rate" 
                    value={metrics ? `${metrics.churnRate.toFixed(1)}%` : '0.0%'} 
                    isLoading={isLoading} 
                    icon={<UsersIcon className="w-6 h-6 text-brand-primary" />} 
                    helpText="Percentage of subscribers who canceled in the last 30 days. Formula: (Canceled in Period) / (Active at End of Period + Canceled in Period) * 100."
                />
                
                <MetricCard 
                    title="Lifetime Value (LTV)" 
                    value={metrics && metrics.ltv > 0 ? `$${metrics.ltv.toFixed(2)}` : 'N/A'} 
                    isLoading={isLoading} 
                    icon={<DollarSignIcon className="w-6 h-6 text-brand-primary" />} 
                    helpText="An estimate of the total revenue a customer will generate. Formula: ARPU / Monthly Churn Rate."
                />
            </div>
        </div>
    );
};

export default FinancialDashboardPage;