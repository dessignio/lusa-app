
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon, ListOlIcon, DownloadIcon } from '../../components/icons';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student, Program } from '../../types';
import { getStudents, getPrograms } from '../../services/apiService';
import { showToast, exportToCSV } from '../../utils';
import Table, { ColumnDefinition } from '../../components/Table';

interface ProgramEnrollmentData {
  name: string;
  value: number; // Number of students
}

const COLORS = ['#7249AB', '#9397BD', '#9E78D9', '#6A6D98', '#BFC2E2', '#51279B', '#D9C9D3'];

const EnrollmentByProgramReportPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const enrollmentData: ProgramEnrollmentData[] = useMemo(() => {
    const programCounts: { [programName: string]: number } = {};
    let unassignedCount = 0;

    students.forEach(student => {
      if (student.program) {
        programCounts[student.program] = (programCounts[student.program] || 0) + 1;
      } else {
        unassignedCount++;
      }
    });
    
    const data = programs.map(program => ({
        name: program.name,
        value: programCounts[program.name] || 0,
    }));

    if (unassignedCount > 0) {
      data.push({ name: 'Unassigned', value: unassignedCount });
    }

    return data.filter(d => d.value > 0); // Only show programs with students
  }, [students, programs]);

  const handleExportCSV = () => {
    if (enrollmentData.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    const dataToExport = enrollmentData.map(item => ({
      'Program Name': item.name,
      'Number of Students': item.value,
    }));
    exportToCSV(dataToExport, 'enrollment-by-program');
  };

  const tableColumns: ColumnDefinition<ProgramEnrollmentData>[] = [
      { header: 'Program Name', accessor: 'name' },
      { header: 'Number of Enrolled Students', accessor: 'value', cellClassName: 'text-center', headerClassName: 'text-center' },
  ];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <ListOlIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Enrollment by Program Report
      </h1>
      
      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}
      
      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Enrollment Distribution">
            {enrollmentData.length > 0 ? (
                <div style={{ height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                    <Pie
                        data={enrollmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                    >
                        {enrollmentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip formatter={(value) => `${value} students`} />
                    <Legend />
                    </PieChart>
                </ResponsiveContainer>
                </div>
            ) : (
                <p className="text-brand-text-secondary text-center py-5">No student enrollment data available.</p>
            )}
            </Card>
            <Card title="Enrollment Counts" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                 <Table<ProgramEnrollmentData & {id: string}>
                    columns={tableColumns}
                    data={enrollmentData.map(d => ({...d, id: d.name}))}
                    isLoading={isLoading}
                    emptyStateMessage="No data available."
                />
            </Card>
        </div>
      )}
    </div>
  );
};

export default EnrollmentByProgramReportPage;
