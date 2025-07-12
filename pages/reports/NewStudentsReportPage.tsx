
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import { ChevronLeftIcon, UsersIcon, ChartBarIcon, DownloadIcon } from '../../components/icons';
import { Student } from '../../types';
import { getStudents } from '../../services/apiService';
import { showToast, exportToCSV, getLocalDateString } from '../../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyNewStudentsData {
  month: string;
  count: number;
}

const NewStudentsReportPage: React.FC = () => {
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(getLocalDateString(today));
  
  const [appliedFilters, setAppliedFilters] = useState<{startDate: string, endDate: string}>({ startDate: getLocalDateString(thirtyDaysAgo), endDate: getLocalDateString(today) });

  const fetchAllStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const studentsData = await getStudents();
      const studentsWithValidDates = studentsData
        .filter(s => s.createdAt && !isNaN(new Date(s.createdAt).getTime()));

      setAllStudents(studentsWithValidDates);

    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load student data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllStudents();
  }, [fetchAllStudents]);

  const handleApplyFilters = () => {
    if (new Date(startDate) > new Date(endDate)) {
        showToast("Start date cannot be after end date.", "error");
        return;
    }
    setAppliedFilters({ startDate, endDate });
  };
  
  const handleExportCSV = () => {
    if (filteredStudents.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    const dataToExport = filteredStudents.map(s => ({
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        program: s.program || 'N/A',
        registeredOn: s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A',
    }));
    exportToCSV(dataToExport, 'new-students-report');
  };

  const handleExportPDF = () => {
    showToast("Export to PDF functionality coming soon!", "info");
  };

  const filteredStudents = useMemo(() => {
    return allStudents.filter(student => {
      if (!student.createdAt) return false;
      const studentCreatedAt = new Date(student.createdAt);
      const filterStart = new Date(appliedFilters.startDate);
      const filterEnd = new Date(appliedFilters.endDate);
      filterEnd.setHours(23, 59, 59, 999); 

      return studentCreatedAt >= filterStart && studentCreatedAt <= filterEnd;
    });
  }, [allStudents, appliedFilters]);

  const monthlyNewStudentsData = useMemo<MonthlyNewStudentsData[]>(() => {
    const counts: { [key: string]: number } = {};
    filteredStudents.forEach(student => {
      if (!student.createdAt) return;
      const monthYear = new Date(student.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      counts[monthYear] = (counts[monthYear] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(counts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedMonths.map(month => ({
      month,
      count: counts[month],
    }));
  }, [filteredStudents]);

  const studentColumns: ColumnDefinition<Student>[] = [
    { header: 'Name', accessor: 'firstName', render: (s) => `${s.firstName} ${s.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Program', accessor: 'program', render: (s) => s.program || 'N/A' },
    { header: 'Registered On', accessor: 'createdAt', render: (s) => s.createdAt ? new Date(s.createdAt).toLocaleDateString() : 'N/A'},
  ];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <UsersIcon className="w-8 h-8 mr-3 text-brand-primary" />
        New Students Report
      </h1>

      <Card title="Filters" collapsible={false}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-2">
          <Input
            id="start-date"
            label="Start Date (Registration)"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            containerClassName="mb-0"
          />
          <Input
            id="end-date"
            label="End Date (Registration)"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            containerClassName="mb-0"
          />
          <Button onClick={handleApplyFilters} className="w-full md:w-auto">Apply Filters</Button>
        </div>
      </Card>

      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}

      {!isLoading && !error && (
        <>
          <Card title="New Students per Month" icon={<ChartBarIcon className="text-brand-primary w-5 h-5"/>}>
            {monthlyNewStudentsData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyNewStudentsData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCDCDC" />
                    <XAxis dataKey="month" stroke="#7E7580"/>
                    <YAxis allowDecimals={false} stroke="#7E7580"/>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'white', border: '1px solid #E6E2E7', borderRadius: '0.375rem' }} 
                      labelStyle={{ color: '#211721' }}
                    />
                    <Legend wrapperStyle={{ color: '#544D55' }}/>
                    <Bar dataKey="count" fill="#7249AB" name="New Students" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-brand-text-secondary text-center py-5">No new student data for the selected period.</p>
            )}
          </Card>

          <Card title="New Student Details" icon={<UsersIcon className="text-brand-primary w-5 h-5"/>}
             actions={
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>
                <Button variant="outline" size="sm" onClick={handleExportPDF} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export PDF</Button>
              </div>
            }
          >
            <Table<Student>
              columns={studentColumns}
              data={filteredStudents}
              isLoading={isLoading}
              emptyStateMessage="No students match the current filters."
            />
          </Card>
        </>
      )}
    </div>
  );
};

export default NewStudentsReportPage;
