

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import { ChevronLeftIcon, CalendarIcon as AbsenceIcon, DownloadIcon } from '../../components/icons';
import { Absence, Student } from '../../types';
import { getAbsences, getStudents } from '../../services/apiService';
import { showToast, exportToCSV, getLocalDateString } from '../../utils';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ReasonData {
  name: string;
  value: number;
}
const REASON_COLORS = ['#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#6366F1', '#EC4899', '#8B5CF6'];


const AbsencesByStudentReportPage: React.FC = () => {
    const [allAbsences, setAllAbsences] = useState<Absence[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(getLocalDateString(today));
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [studentsData, absencesData] = await Promise.all([
                getStudents(),
                getAbsences(), // Fetch all absences initially
            ]);
            setStudents(studentsData);
            setAllAbsences(absencesData);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load report data.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const filteredAbsences = useMemo(() => {
        return allAbsences.filter(absence => {
            const studentMatch = selectedStudentId ? absence.studentId === selectedStudentId : false;
            if (!studentMatch) return false;

            const absenceDate = new Date(absence.classDateTime);
            const filterStart = new Date(startDate);
            const filterEnd = new Date(endDate);
            filterEnd.setHours(23, 59, 59, 999);
            const dateMatch = absenceDate >= filterStart && absenceDate <= filterEnd;

            return dateMatch;
        });
    }, [allAbsences, selectedStudentId, startDate, endDate]);

    const reasonDistribution = useMemo<ReasonData[]>(() => {
        const counts: Record<string, number> = {};
        filteredAbsences.forEach(absence => {
            counts[absence.reason] = (counts[absence.reason] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredAbsences]);
    
    const handleExportCSV = () => {
        if (filteredAbsences.length === 0) {
            showToast("No data to export.", "info");
            return;
        }
        const dataToExport = filteredAbsences.map(a => ({
            'Class Name': a.className,
            Date: new Date(a.classDateTime).toLocaleString(),
            Reason: a.reason,
            Status: a.status,
            Notes: a.notes || '',
            'Notified On': new Date(a.notificationDate).toLocaleDateString(),
        }));
        exportToCSV(dataToExport, `absences-for-${students.find(s => s.id === selectedStudentId)?.firstName || 'student'}`);
    };

    const studentOptions = useMemo(() => ([
        { value: '', label: 'Select a student...' },
        ...students.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))
    ]), [students]);

    const reportColumns: ColumnDefinition<Absence>[] = [
        { header: 'Class', accessor: 'className' },
        { header: 'Date & Time', accessor: 'classDateTime', render: r => new Date(r.classDateTime).toLocaleString() },
        { header: 'Reason', accessor: 'reason' },
        { header: 'Status', accessor: 'status' },
        { header: 'Notified', accessor: 'notificationDate', render: r => new Date(r.notificationDate).toLocaleDateString() },
    ];

    return (
        <div className="space-y-6">
            <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Reports Hub
            </NavLink>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
                <AbsenceIcon className="w-8 h-8 mr-3 text-brand-primary" />
                Absences by Student Report
            </h1>

            <Card title="Filters" collapsible={false}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-2">
                    <Select id="student-filter" label="Select Student" options={studentOptions} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} containerClassName="mb-0" disabled={isLoading} />
                    <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClassName="mb-0" />
                    <Input id="end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClassName="mb-0" />
                </div>
            </Card>

            {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
            {error && <p className="text-center text-brand-error py-5">{error}</p>}
            
            {!isLoading && !error && selectedStudentId && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card title="Absence Reasons">
                        {reasonDistribution.length > 0 ? (
                            <div style={{ height: 300 }}>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={reasonDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                            {reasonDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={REASON_COLORS[index % REASON_COLORS.length]} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        ) : <p className="text-brand-text-secondary p-4 text-center">No absences recorded for this student in the selected period.</p>}
                    </Card>
                    <Card title="Detailed Absence Records" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                        <Table<Absence> columns={reportColumns} data={filteredAbsences} emptyStateMessage="No records found." />
                    </Card>
                </div>
            )}
             {!isLoading && !error && !selectedStudentId && (
                 <Card title="Results"><p className="text-center text-brand-text-secondary py-5">Please select a student to view their absence report.</p></Card>
            )}
        </div>
    );
};

export default AbsencesByStudentReportPage;
