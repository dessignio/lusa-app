
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import { ChevronLeftIcon, CalendarIcon, ChartBarIcon, DownloadIcon } from '../../components/icons';
import { ClassOffering, AttendanceRecord, Student } from '../../types';
import { getClassOfferings, getAttendanceRecords, getStudents } from '../../services/apiService';
import { showToast, exportToCSV, getLocalDateString } from '../../utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ClassAttendanceSummary {
    id: string; // date
    date: string;
    present: number;
    late: number;
    absent: number;
    excused: number;
    total: number;
    attendanceRate: number;
}

const AttendanceByClassReportPage: React.FC = () => {
    const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetchingReport, setIsFetchingReport] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
    const [endDate, setEndDate] = useState(getLocalDateString(today));
    const [selectedClassId, setSelectedClassId] = useState('');

    const [reportData, setReportData] = useState<ClassAttendanceSummary[]>([]);

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const offeringsData = await getClassOfferings();
            setClassOfferings(offeringsData);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load class offerings.';
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
        if (!selectedClassId) {
            showToast("Please select a class.", "error");
            return;
        }
        if (new Date(startDate) > new Date(endDate)) {
            showToast("Start date cannot be after end date.", "error");
            return;
        }

        setIsFetchingReport(true);
        const dateRange: string[] = [];
        let currentDate = new Date(startDate);
        const finalDate = new Date(endDate);
        while(currentDate <= finalDate) {
            dateRange.push(currentDate.toISOString().split('T')[0]);
            currentDate.setDate(currentDate.getDate() + 1);
        }

        try {
            const promises = dateRange.map(date => getAttendanceRecords(selectedClassId, date));
            const nestedRecords = await Promise.all(promises);
            const allRecords = nestedRecords.flat();
            
            const attendanceByDate: Record<string, Omit<ClassAttendanceSummary, 'id' | 'date' | 'attendanceRate'>> = {};

            allRecords.forEach(record => {
                const recordDate = record.classDateTime.split(' ')[0];
                if (!attendanceByDate[recordDate]) {
                    attendanceByDate[recordDate] = { present: 0, late: 0, absent: 0, excused: 0, total: 0 };
                }
                attendanceByDate[recordDate][record.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']++;
                attendanceByDate[recordDate].total++;
            });

            const summaryData = Object.entries(attendanceByDate).map(([date, counts]) => {
                const presentAndLate = counts.present + counts.late;
                const attendanceRate = counts.total > 0 ? (presentAndLate / counts.total) * 100 : 0;
                return {
                    id: date,
                    date,
                    ...counts,
                    attendanceRate,
                };
            });
            
            setReportData(summaryData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));

        } catch (err) {
            showToast("Failed to generate report.", "error");
        } finally {
            setIsFetchingReport(false);
        }
    };

    const handleExportCSV = () => {
        if (reportData.length === 0) {
            showToast("No data to export.", "info");
            return;
        }
        const dataToExport = reportData.map(r => ({
            Date: r.date,
            Present: r.present,
            Late: r.late,
            Absent: r.absent,
            Excused: r.excused,
            'Total Students': r.total,
            'Attendance Rate (%)': r.attendanceRate.toFixed(1),
        }));
        exportToCSV(dataToExport, `attendance-for-${classOfferings.find(c => c.id === selectedClassId)?.name || 'class'}`);
    };

    const classOfferingOptions = useMemo(() => {
        return [{ value: '', label: 'Select a class...' }, ...classOfferings.map(c => ({ value: c.id, label: c.name }))]
    }, [classOfferings]);

    const reportColumns: ColumnDefinition<ClassAttendanceSummary>[] = [
        { header: 'Date', accessor: 'date', render: (r) => new Date(r.date).toLocaleDateString() },
        { header: 'Present', accessor: 'present', cellClassName: 'text-center' },
        { header: 'Late', accessor: 'late', cellClassName: 'text-center' },
        { header: 'Absent', accessor: 'absent', cellClassName: 'text-center' },
        { header: 'Total', accessor: 'total', cellClassName: 'text-center font-bold' },
        { header: 'Attendance Rate', accessor: 'attendanceRate', render: (r) => `${r.attendanceRate.toFixed(1)}%`, cellClassName: 'text-center font-medium' },
    ];
    
    return (
        <div className="space-y-6">
            <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
                <ChevronLeftIcon className="w-5 h-5 mr-1" />
                Back to Reports Hub
            </NavLink>
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
                <CalendarIcon className="w-8 h-8 mr-3 text-brand-primary" />
                Attendance by Class Report
            </h1>
            
            <Card title="Filters" collapsible={false}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-2">
                    <Select id="class-filter" label="Select Class" options={classOfferingOptions} value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} containerClassName="md:col-span-2 mb-0" disabled={isLoading} />
                    <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClassName="mb-0" />
                    <Input id="end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClassName="mb-0" />
                </div>
                <div className="p-2 mt-2"><Button onClick={handleApplyFilters} isLoading={isFetchingReport} disabled={isLoading || isFetchingReport || !selectedClassId}>Generate Report</Button></div>
            </Card>

            {isFetchingReport && <p className="text-center text-brand-text-secondary py-5">Generating report data...</p>}
            
            {!isFetchingReport && reportData.length > 0 && (
                <>
                <Card title="Attendance Trend" icon={<ChartBarIcon className="text-brand-primary w-5 h-5"/>}>
                    <div style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={reportData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="date" tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', {month: 'short', day: 'numeric'})} />
                                <YAxis domain={[0, 100]} tickFormatter={(rate) => `${rate}%`} />
                                <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                                <Legend />
                                <Line type="monotone" dataKey="attendanceRate" name="Attendance Rate" stroke="#7249AB" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
                 <Card title="Detailed Attendance Summary" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                    <Table<ClassAttendanceSummary> columns={reportColumns} data={reportData} />
                </Card>
                </>
            )}

            {!isFetchingReport && !isLoading && selectedClassId && reportData.length === 0 && (
                 <Card title="Results"><p className="text-center text-brand-text-secondary py-5">No attendance records found for the selected class and date range.</p></Card>
            )}
        </div>
    );
};

export default AttendanceByClassReportPage;
