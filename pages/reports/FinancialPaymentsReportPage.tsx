
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import { ChevronLeftIcon, DollarSignIcon, ChartBarIcon, DownloadIcon } from '../../components/icons';
import { Payment, PaymentMethod, Student } from '../../types';
import { getStudents, getPaymentsByStudentId } from '../../services/apiService';
import { showToast, exportToCSV, getLocalDateString } from '../../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PAYMENT_METHOD_OPTIONS } from '../../constants';

interface MonthlyPaymentData {
  month: string;
  amount: number;
}

const FinancialPaymentsReportPage: React.FC = () => {
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(getLocalDateString(today));
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<PaymentMethod | ''>('');

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const studentsData = await getStudents();
      setStudents(studentsData);
      
      // In a real app, you'd want a single endpoint to get all payments within a date range.
      // Here, we have to fetch for each student, which is highly inefficient but works for this demo.
      const paymentPromises = studentsData.map(student => getPaymentsByStudentId(student.id));
      const paymentsNested = await Promise.all(paymentPromises);
      const flattenedPayments = paymentsNested.flat();
      setAllPayments(flattenedPayments);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load payments data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const handleExportCSV = () => {
    if (filteredPayments.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    const dataToExport = filteredPayments.map(p => ({
        Date: p.paymentDate,
        'Student Name': p.studentName,
        Amount: p.amountPaid,
        'Payment Method': p.paymentMethod,
        'Membership Plan': p.membershipPlanName || 'N/A',
        'Transaction ID': p.transactionId || 'N/A'
    }));
    exportToCSV(dataToExport, 'financial-payments-report');
  };

  const filteredPayments = useMemo(() => {
    return allPayments
      .map(p => ({
        ...p,
        studentName: students.find(s => s.id === p.studentId)?.firstName + ' ' + students.find(s => s.id === p.studentId)?.lastName || 'Unknown Student',
      }))
      .filter(payment => {
        const paymentDate = new Date(payment.paymentDate);
        const filterStart = new Date(startDate);
        const filterEnd = new Date(endDate);
        filterEnd.setHours(23, 59, 59, 999);

        const dateMatches = paymentDate >= filterStart && paymentDate <= filterEnd;
        const methodMatches = paymentMethodFilter ? payment.paymentMethod === paymentMethodFilter : true;
        
        return dateMatches && methodMatches;
      });
  }, [allPayments, startDate, endDate, paymentMethodFilter, students]);

  const monthlyPaymentData = useMemo<MonthlyPaymentData[]>(() => {
    const totals: { [key: string]: number } = {};
    filteredPayments.forEach(payment => {
      const monthYear = new Date(payment.paymentDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      totals[monthYear] = (totals[monthYear] || 0) + payment.amountPaid;
    });
    
    const sortedMonths = Object.keys(totals).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedMonths.map(month => ({
      month,
      amount: totals[month],
    }));
  }, [filteredPayments]);

  const totalRevenue = useMemo(() => {
    return filteredPayments.reduce((acc, p) => acc + p.amountPaid, 0);
  }, [filteredPayments]);

  const paymentColumns: ColumnDefinition<Payment>[] = [
    { header: 'Date', accessor: 'paymentDate' },
    { header: 'Student', accessor: 'studentName' },
    { header: 'Amount', accessor: 'amountPaid', render: (p) => `$${p.amountPaid.toFixed(2)}`, cellClassName: 'text-right' },
    { header: 'Method', accessor: 'paymentMethod' },
    { header: 'Plan', accessor: 'membershipPlanName', render: (p) => p.membershipPlanName || 'N/A' },
    { header: 'Transaction ID', accessor: 'transactionId', render: (p) => p.transactionId || 'N/A' },
  ];

  const paymentMethodOptions = [{ value: '', label: 'All Methods' }, ...PAYMENT_METHOD_OPTIONS];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <DollarSignIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Payments Received Report
      </h1>

      <Card title="Filters" collapsible={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-2">
          <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClassName="mb-0" />
          <Input id="end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClassName="mb-0" />
          <Select id="payment-method-filter" label="Payment Method" options={paymentMethodOptions} value={paymentMethodFilter} onChange={(e) => setPaymentMethodFilter(e.target.value as PaymentMethod | '')} containerClassName="mb-0" />
        </div>
      </Card>
      
      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data... This may take a moment.</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}
      
      {!isLoading && !error && (
        <>
        <Card title="Revenue Overview">
            <div className="flex justify-center items-center p-4">
                <div className="text-center">
                    <p className="text-sm text-brand-text-secondary">Total Revenue in Period</p>
                    <p className="text-4xl font-bold text-brand-success-dark">${totalRevenue.toFixed(2)}</p>
                </div>
            </div>
            <div style={{ height: '300px' }} className="mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPaymentData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DCDCDC" />
                <XAxis dataKey="month" stroke="#7E7580" />
                <YAxis stroke="#7E7580" tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="amount" fill="#10B981" name="Monthly Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Payment Details" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
          <Table<Payment> columns={paymentColumns} data={filteredPayments} emptyStateMessage="No payments match the current filters."/>
        </Card>
        </>
      )}
    </div>
  );
};

export default FinancialPaymentsReportPage;
