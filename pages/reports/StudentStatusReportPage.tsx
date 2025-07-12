
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon, UsersIcon, DownloadIcon } from '../../components/icons';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student, Program, StudentStatus } from '../../types';
import { getStudents, getPrograms } from '../../services/apiService';
import { showToast, exportToCSV } from '../../utils';
import Table, { ColumnDefinition } from '../../components/Table';
import Select from '../../components/forms/Select';
import { STUDENT_STATUS_OPTIONS } from '../../constants';

interface StatusDistributionData {
  name: StudentStatus | 'Unknown';
  value: number;
}

const COLORS: {[key in StudentStatus | 'Unknown']: string} = {
  'Activo': '#10B981', // success
  'Inactivo': '#EF4444', // error
  'Suspendido': '#F59E0B', // warning
  'Unknown': '#9CA3AF', // gray
};

const StudentStatusReportPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [programFilter, setProgramFilter] = useState<string>('');
  
  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsData, programsData] = await Promise.all([
        getStudents(),
        getPrograms(),
      ]);
      setStudents(studentsData);
      setPrograms(programsData);
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

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
        return programFilter ? student.program === programFilter : true;
    });
  }, [students, programFilter]);

  const distributionData: StatusDistributionData[] = useMemo(() => {
    const statusCounts: { [key in StudentStatus]?: number } = {};

    filteredStudents.forEach(student => {
      statusCounts[student.status] = (statusCounts[student.status] || 0) + 1;
    });

    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status as StudentStatus,
      value: count,
    }));
  }, [filteredStudents]);

  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      showToast("No data to export for the current filter.", "info");
      return;
    }
    const dataToExport = filteredStudents.map(s => ({
      'First Name': s.firstName,
      'Last Name': s.lastName,
      'Email': s.email,
      'Status': s.status,
      'Program': s.program || 'N/A',
      'Membership Plan': s.membershipPlanName || 'N/A',
    }));
    exportToCSV(dataToExport, 'student-status-report');
  };

  const programOptions = useMemo(() => ([
    { value: '', label: 'All Programs' },
    ...programs.map(p => ({ value: p.name, label: p.name }))
  ]), [programs]);

  const studentColumns: ColumnDefinition<Student>[] = [
    { header: 'Name', accessor: 'firstName', render: (s) => `${s.firstName} ${s.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Program', accessor: 'program', render: (s) => s.program || 'N/A' },
    { header: 'Status', accessor: 'status', render: (s) => <span style={{color: COLORS[s.status]}}>{s.status}</span>, cellClassName: 'font-medium' },
  ];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <UsersIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Student Status Report
      </h1>

      <Card title="Filters" collapsible={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-2">
            <Select
                id="program-filter"
                label="Filter by Program"
                options={programOptions}
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                disabled={isLoading}
                containerClassName="mb-0"
            />
        </div>
      </Card>
      
      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}
      
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Status Distribution">
            {distributionData.length > 0 ? (
                <div style={{ height: 350 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie data={distributionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label>
                        {distributionData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
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
            <Card title="Student List" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                 <Table
                    columns={studentColumns}
                    data={filteredStudents}
                    isLoading={isLoading}
                    emptyStateMessage="No students match the current filters."
                />
            </Card>
        </div>
      )}
    </div>
  );
};

export default StudentStatusReportPage;
