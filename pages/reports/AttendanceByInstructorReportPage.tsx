
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Button from '../../components/forms/Button';
import { ChevronLeftIcon, UsersIcon, DownloadIcon, UserTieIcon } from '../../components/icons';
import { Instructor, ClassOffering, AttendanceRecord, Student } from '../../types';
import { getInstructors, getClassOfferings, getAttendanceRecords, getStudents } from '../../services/apiService';
import { showToast, exportToCSV } from '../../utils';

interface InstructorAttendanceData {
  id: string; // classOfferingId-date
  className: string;
  date: string;
  present: number;
  absent: number;
  late: number;
  excused: number;
  total: number;
  attendanceRate: string;
}

const AttendanceByInstructorReportPage: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingReport, setIsFetchingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [selectedInstructorId, setSelectedInstructorId] = useState('');

  const [reportData, setReportData] = useState<InstructorAttendanceData[]>([]);

  const fetchInitialData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [instructorsData, offeringsData, studentsData] = await Promise.all([
        getInstructors(),
        getClassOfferings(),
        getStudents(),
      ]);
      setInstructors(instructorsData);
      setClassOfferings(offeringsData);
      setStudents(studentsData);
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
    if (!selectedInstructorId) {
      showToast("Please select an instructor.", "error");
      return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        showToast("Start date cannot be after end date.", "error");
        return;
    }

    setIsFetchingReport(true);
    try {
        const selectedInstructor = instructors.find(i => i.id === selectedInstructorId);
        if (!selectedInstructor) return;

        const instructorName = `${selectedInstructor.firstName} ${selectedInstructor.lastName}`;
        const instructorClasses = classOfferings.filter(co => co.instructorName === instructorName);

        if (instructorClasses.length === 0) {
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

        const promises = instructorClasses.flatMap(cls => 
            dateRange.map(date => getAttendanceRecords(cls.id, date))
        );

        const allRecordsNested = await Promise.all(promises);
        const allRecords = allRecordsNested.flat();

        const dataByClassAndDate: Record<string, { present: number; absent: number; late: number; excused: number; total: number; className: string }> = {};

        allRecords.forEach(record => {
            const date = record.classDateTime.split(' ')[0];
            const key = `${record.classOfferingId}-${date}`;

            if (!dataByClassAndDate[key]) {
                const offering = classOfferings.find(co => co.id === record.classOfferingId);
                dataByClassAndDate[key] = {
                    present: 0,
                    absent: 0,
                    late: 0,
                    excused: 0,
                    total: 0,
                    className: offering?.name || 'Unknown Class'
                };
            }
            dataByClassAndDate[key][record.status.toLowerCase() as 'present' | 'absent' | 'late' | 'excused']++;
            dataByClassAndDate[key].total++;
        });

        const finalReportData = Object.entries(dataByClassAndDate).map(([key, value]) => {
            const [classId, date] = key.split('-');
            const presentAndLate = value.present + value.late;
            const rate = value.total > 0 ? (presentAndLate / value.total * 100).toFixed(1) + '%' : 'N/A';

            return {
                id: key,
                className: value.className,
                date: date,
                present: value.present,
                absent: value.absent,
                late: value.late,
                excused: value.excused,
                total: value.total,
                attendanceRate: rate,
            };
        });

        setReportData(finalReportData.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

    } catch (err) {
        showToast("Failed to generate report.", "error");
        console.error(err);
    } finally {
        setIsFetchingReport(false);
    }
  };

  const handleExportCSV = () => {
    if (reportData.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    exportToCSV(reportData, 'attendance-by-instructor-report');
  };
  
  const instructorOptions = useMemo(() => ([
    { value: '', label: 'Select an instructor...' },
    ...instructors.map(i => ({ value: i.id, label: `${i.firstName} ${i.lastName}` }))
  ]), [instructors]);

  const reportColumns: ColumnDefinition<InstructorAttendanceData>[] = [
    { header: 'Date', accessor: 'date', render: (r) => new Date(r.date).toLocaleDateString() },
    { header: 'Class', accessor: 'className' },
    { header: 'Present', accessor: 'present', cellClassName: 'text-center' },
    { header: 'Late', accessor: 'late', cellClassName: 'text-center' },
    { header: 'Absent', accessor: 'absent', cellClassName: 'text-center' },
    { header: 'Excused', accessor: 'excused', cellClassName: 'text-center' },
    { header: 'Attendance Rate', accessor: 'attendanceRate', cellClassName: 'text-center font-medium' },
  ];

  const overallStats = useMemo(() => {
    if (reportData.length === 0) return { avgRate: 0, totalPresent: 0, totalSessions: 0 };
    let totalPresent = 0;
    let totalStudents = 0;
    reportData.forEach(r => {
        totalPresent += (r.present + r.late);
        totalStudents += r.total;
    });
    const avgRate = totalStudents > 0 ? (totalPresent / totalStudents) * 100 : 0;
    return {
        avgRate: avgRate.toFixed(1),
        totalPresent,
        totalSessions: reportData.length,
    }
  }, [reportData]);

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <UserTieIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Attendance by Instructor
      </h1>

      <Card title="Filters" collapsible={false}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-2">
          <Select id="instructor-filter" label="Instructor" options={instructorOptions} value={selectedInstructorId} onChange={(e) => setSelectedInstructorId(e.target.value)} containerClassName="mb-0 md:col-span-2" disabled={isLoading} />
          <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClassName="mb-0" />
          <Input id="end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClassName="mb-0" />
        </div>
        <div className="p-2 mt-2">
            <Button onClick={handleApplyFilters} isLoading={isFetchingReport} disabled={isLoading || isFetchingReport || !selectedInstructorId}>Generate Report</Button>
        </div>
      </Card>
      
      {isFetchingReport && <p className="text-center text-brand-text-secondary py-5">Generating report data...</p>}
      
      {!isFetchingReport && reportData.length > 0 && (
         <>
            <Card title="Summary">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-brand-primary-light/20 rounded-lg">
                        <p className="text-3xl font-bold text-brand-primary">{overallStats.avgRate}%</p>
                        <p className="text-sm text-brand-text-secondary">Average Attendance</p>
                    </div>
                     <div className="p-4 bg-brand-success-light/30 rounded-lg">
                        <p className="text-3xl font-bold text-brand-success-dark">{overallStats.totalPresent}</p>
                        <p className="text-sm text-brand-text-secondary">Total Students Marked Present/Late</p>
                    </div>
                    <div className="p-4 bg-brand-info-light/30 rounded-lg">
                        <p className="text-3xl font-bold text-brand-info">{overallStats.totalSessions}</p>
                        <p className="text-sm text-brand-text-secondary">Total Class Sessions</p>
                    </div>
                </div>
            </Card>
            <Card title="Detailed Attendance Records" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
                <Table<InstructorAttendanceData> columns={reportColumns} data={reportData} />
            </Card>
        </>
      )}

       {!isFetchingReport && reportData.length === 0 && selectedInstructorId && (
        <Card title="Results">
            <p className="text-center text-brand-text-secondary py-5">No attendance records found for the selected instructor and date range.</p>
        </Card>
       )}
    </div>
  );
};

export default AttendanceByInstructorReportPage;
