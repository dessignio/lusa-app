
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon, IdCardIcon, DownloadIcon } from '../../components/icons';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student, MembershipPlanDefinition } from '../../types';
import { getStudents, getMembershipPlans } from '../../services/apiService';
import { showToast, exportToCSV } from '../../utils';
import Table, { ColumnDefinition } from '../../components/Table';

interface PlanDistributionData {
  name: string;
  value: number; // Number of students
}

const COLORS = ['#7249AB', '#9397BD', '#9E78D9', '#6A6D98', '#BFC2E2', '#51279B'];

const MembershipPlanDistributionPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [plans, setPlans] = useState<MembershipPlanDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsData, plansData] = await Promise.all([
        getStudents(),
        getMembershipPlans(),
      ]);
      setStudents(studentsData);
      setPlans(plansData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load report data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const distributionData: PlanDistributionData[] = useMemo(() => {
    const planCounts: { [planId: string]: number } = {};
    let noPlanCount = 0;

    students.forEach(student => {
      if (student.membershipPlanId) {
        planCounts[student.membershipPlanId] = (planCounts[student.membershipPlanId] || 0) + 1;
      } else {
        noPlanCount++;
      }
    });

    const data = Object.entries(planCounts).map(([planId, count]) => {
      const planDetails = plans.find(p => p.id === planId);
      return {
        name: planDetails?.name || `Unknown Plan (${planId})`,
        value: count,
      };
    });

    if (noPlanCount > 0) {
      data.push({ name: 'No Membership Plan', value: noPlanCount });
    }

    return data;
  }, [students, plans]);

  const handleExportCSV = () => {
    if (distributionData.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    const dataToExport = distributionData.map(item => ({
      'Plan Name': item.name,
      'Number of Students': item.value,
    }));
    exportToCSV(dataToExport, 'membership-plan-distribution');
  };

  const tableColumns: ColumnDefinition<PlanDistributionData>[] = [
      { header: 'Plan Name', accessor: 'name' },
      { header: 'Number of Students', accessor: 'value', cellClassName: 'text-center', headerClassName: 'text-center' },
  ];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <IdCardIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Membership Plan Distribution
      </h1>
      
      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}
      
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Plan Distribution Chart">
            {distributionData.length > 0 ? (
                <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={distributionData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} students`} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <p className="text-brand-text-secondary text-center py-5">No student data available to show distribution.</p>
            )}
            </Card>
            <Card title="Subscribers by Plan" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                 <Table<PlanDistributionData & {id: string}>
                    columns={tableColumns}
                    data={distributionData.map(d => ({...d, id: d.name}))} // Add a temporary ID for the Table component
                    isLoading={isLoading}
                    emptyStateMessage="No data available."
                />
            </Card>
        </div>
      )}
    </div>
  );
};

export default MembershipPlanDistributionPage;
