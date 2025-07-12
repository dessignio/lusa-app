

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import { ChevronLeftIcon, CalendarIcon, DownloadIcon } from '../../components/icons';
import { Student, AttendanceRecord, ClassOffering } from '../../types';
import { getStudents, getClassOfferings, getAttendanceRecords } from '../../services/apiService';
import { showToast, exportToCSV, getLocalDateString } from '../../utils';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface StatusData {
  name: AttendanceRecord['status'];
  value: number;
}
const STATUS_COLORS: Record<AttendanceRecord['status'], string> = {
    'Present': '#10B981',
    'Late': '#F59E0B',
    'Absent': '#EF4444',
    'Excused': '#3B82F6',
};

const AttendanceByStudentReportPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingReport, setIsFetchingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(getLocalDateString(today));
    const [selectedStudentId, setSelectedStudentId] = useState('');

    const [reportData, setReportData] = useState<AttendanceRecord[]>([]);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const [studentsData, offeringsData] = await Promise.all([
                getStudents(),
                getClassOfferings(),
            ]);
            setStudents(studentsData);
            setClassOfferings(offeringsData);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load initial data.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const handleApplyFilters = async () => {
        if (!selectedStudentId) {
            showToast("Please select a student.", "error");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            showToast("Start date cannot be after end date.", "error");
            return;
        }

        setIsFetchingReport(true);
        try {
            const student = students.find(s => s.id === selectedStudentId);
            if (!student || !student.enrolledClasses) {
                setReportData([]);
                return;
            }

            const dateRange: string[] = [];
            let currentDate = new Date(startDate);
            const finalDate = new Date(endDate);
            while (currentDate <= finalDate) {
                dateRange.push(currentDate.toISOString().split('T')[0]);
                currentDate.setDate(currentDate.getDate() + 1);
            }
            
            const promises = student.enrolledClasses.flatMap(classId => 
                dateRange.map(date => getAttendanceRecords(classId, date))
            );

            const allRecordsNested = await Promise.all(promises);
            const allRecords = allRecordsNested.flat().filter(r => r.studentId === selectedStudentId);

            const recordsWithClassNames = allRecords.map(r => ({
                ...r,
                className: classOfferings.find(co => co.id === r.classOfferingId)?.name || 'Unknown Class',
            }));
            
            setReportData(recordsWithClassNames.sort((a,b) => new Date(b.classDateTime).getTime() - new Date(a.classDateTime).getTime()));

        } catch (err) {
            showToast("Failed to generate report.", "error");
        } finally {
            setIsFetchingReport(false);
        }
    };
    
    const statusDistribution = useMemo<StatusData[]>(() => {
        const counts: Record<string, number> = {};
        reportData.forEach(record => {
            counts[record.status] = (counts[record.status] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name: name as AttendanceRecord['status'], value }));
    }, [reportData]);

    const handleExportCSV = () => {
        if (reportData.length === 0) {
            showToast("No data to export.", "info");
            return;
        }
        const dataToExport = reportData.map(r => ({
            Date: new Date(r.classDateTime).toLocaleString(),
            Class: (r as any).className || r.classOfferingId,
            Status: r.status,
            Notes: r.notes || '',
        }));
        exportToCSV(dataToExport, `attendance-for-${students.find(s=>s.id === selectedStudentId)?.firstName || 'student'}`);
    };

    const studentOptions = useMemo(() => ([
        { value: '', label: 'Select a student...' },
        ...students.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName}` }))
    ]), [students]);

    const reportColumns: ColumnDefinition<AttendanceRecord & { className?: string }>[] = [
        { header: 'Date & Time', accessor: 'classDateTime', render: (r) => new Date(r.classDateTime).toLocaleString() },
        { header: 'Class', accessor: 'className' },
        { header: 'Status', accessor: 'status', render: r => <span style={{ color: STATUS_COLORS[r.status]}} className="font-semibold">{r.status}</span> },
        { header: 'Notes', accessor: 'notes', render: (r) => r.notes || '-' },
    ];

    return (
        <div className="space-y-6">
            <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Reports Hub
            </NavLink>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
                <CalendarIcon className="w-8 h-8 mr-3 text-brand-primary" />
                Attendance by Student Report
            </h1>

            <Card title="Filters" collapsible={false}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end p-2">
                    <Select id="student-filter" label="Select Student" options={studentOptions} value={selectedStudentId} onChange={e => setSelectedStudentId(e.target.value)} containerClassName="mb-0" disabled={isLoading} />
                    <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClassName="mb-0" />
                    <Input id="end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClassName="mb-0" />
                </div>
                <div className="p-2 mt-2"><Button onClick={handleApplyFilters} isLoading={isFetchingReport} disabled={isLoading || isFetchingReport || !selectedStudentId}>Generate Report</Button></div>
            </Card>

            {isFetchingReport && <p className="text-center text-brand-text-secondary py-5">Generating report data... This may take a moment.</p>}

            {!isFetchingReport && reportData.length > 0 && (
                <>
                <Card title="Attendance Summary">
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={statusDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {statusDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name]} />)}
                                </Pie>
                                <Tooltip/>
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                <Card title="Detailed Attendance History" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                    <Table<AttendanceRecord & { className?: string }> columns={reportColumns} data={reportData} />
                </Card>
                </>
            )}

            {!isFetchingReport && !isLoading && selectedStudentId && reportData.length === 0 && (
                 <Card title="Results"><p className="text-center text-brand-text-secondary py-5">No attendance records found for the selected student and date range.</p></Card>
            )}
        </div>
    );
};

export default AttendanceByStudentReportPage;
