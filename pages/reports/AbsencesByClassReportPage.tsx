

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import { ChevronLeftIcon, CalendarIcon, ChartBarIcon, DownloadIcon, UsersIcon } from '../../components/icons';
import { Absence, ClassOffering } from '../../types';
import { getAbsences, getClassOfferings } from '../../services/apiService';
import { showToast, exportToCSV, getLocalDateString } from '../../utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface MonthlyAbsenceData {
  month: string;
  count: number;
}

const AbsencesByClassReportPage: React.FC = () => {
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const [startDate, setStartDate] = useState(getLocalDateString(thirtyDaysAgo));
  const [endDate, setEndDate] = useState(getLocalDateString(today));
  const [selectedClassId, setSelectedClassId] = useState('');
  
  const [appliedFilters, setAppliedFilters] = useState<{startDate: string, endDate: string, classId: string}>({ startDate: getLocalDateString(thirtyDaysAgo), endDate: getLocalDateString(today), classId: '' });

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

  const fetchAbsencesForClass = useCallback(async () => {
    if (!appliedFilters.classId) {
        setAbsences([]);
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
        const absencesData = await getAbsences({ classId: appliedFilters.classId });
        setAbsences(absencesData);
    } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load absence data.';
        setError(msg);
        showToast(msg, 'error');
    } finally {
        setIsLoading(false);
    }
  }, [appliedFilters.classId]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    fetchAbsencesForClass();
  }, [fetchAbsencesForClass]);


  const handleApplyFilters = () => {
    if (!selectedClassId) {
        showToast("Please select a class.", "error");
        return;
    }
    if (new Date(startDate) > new Date(endDate)) {
        showToast("Start date cannot be after end date.", "error");
        return;
    }
    setAppliedFilters({ startDate, endDate, classId: selectedClassId });
  };
  
  const handleExportCSV = () => {
    if (filteredAbsences.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    const dataToExport = filteredAbsences.map(a => ({
        Student: a.studentName,
        Date: new Date(a.classDateTime).toLocaleString(),
        Reason: a.reason,
        Status: a.status,
        Notes: a.notes,
        Notified: new Date(a.notificationDate).toLocaleDateString(),
    }));
    exportToCSV(dataToExport, `absences-for-${classOfferings.find(c=>c.id === appliedFilters.classId)?.name || 'class'}`);
  };

  const filteredAbsences = useMemo(() => {
    return absences.filter(absence => {
      const absenceDate = new Date(absence.classDateTime);
      const filterStart = new Date(appliedFilters.startDate);
      const filterEnd = new Date(appliedFilters.endDate);
      filterEnd.setHours(23, 59, 59, 999);
      return absenceDate >= filterStart && absenceDate <= filterEnd;
    });
  }, [absences, appliedFilters.startDate, appliedFilters.endDate]);

  const monthlyAbsenceData = useMemo<MonthlyAbsenceData[]>(() => {
    const counts: { [key: string]: number } = {};
    filteredAbsences.forEach(absence => {
      const monthYear = new Date(absence.classDateTime).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
      counts[monthYear] = (counts[monthYear] || 0) + 1;
    });
    
    const sortedMonths = Object.keys(counts).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    
    return sortedMonths.map(month => ({
      month,
      count: counts[month],
    }));
  }, [filteredAbsences]);

  const classOfferingOptions = useMemo(() => {
    return [{ value: '', label: 'Select a class...' }, ...classOfferings.map(c => ({ value: c.id, label: c.name }))]
  }, [classOfferings]);

  const absenceColumns: ColumnDefinition<Absence>[] = [
    { header: 'Student', accessor: 'studentName' },
    { header: 'Date', accessor: 'classDateTime', render: (a) => new Date(a.classDateTime).toLocaleString() },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', accessor: 'status' },
    { header: 'Notified', accessor: 'notificationDate', render: (a) => new Date(a.notificationDate).toLocaleDateString() },
  ];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <CalendarIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Absences by Class Report
      </h1>

      <Card title="Filters" collapsible={false}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end p-2">
          <Select id="class-filter" label="Select Class" options={classOfferingOptions} value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)} containerClassName="md:col-span-2 mb-0" disabled={isLoading} />
          <Input id="start-date" label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} containerClassName="mb-0" />
          <Input id="end-date" label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} containerClassName="mb-0" />
        </div>
        <div className="p-2 mt-2"><Button onClick={handleApplyFilters} disabled={!selectedClassId}>Generate Report</Button></div>
      </Card>

      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}

      {!isLoading && !error && appliedFilters.classId && (
        <>
          <Card title="Absences per Month" icon={<ChartBarIcon className="text-brand-primary w-5 h-5"/>}>
            {monthlyAbsenceData.length > 0 ? (
              <div style={{ height: '300px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyAbsenceData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#DCDCDC" />
                    <XAxis dataKey="month" stroke="#7E7580"/>
                    <YAxis allowDecimals={false} stroke="#7E7580"/>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #E6E2E7' }} />
                    <Legend />
                    <Bar dataKey="count" fill="#EF4444" name="Absences" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-brand-text-secondary text-center py-5">No absence data for the selected class and period.</p>
            )}
          </Card>

          <Card title="Absence Details" icon={<UsersIcon className="text-brand-primary w-5 h-5"/>}
             actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
            <Table<Absence> columns={absenceColumns} data={filteredAbsences} emptyStateMessage="No absences match the current filters." />
          </Card>
        </>
      )}

      {!appliedFilters.classId && !isLoading && (
         <Card title="Results"><p className="text-center text-brand-text-secondary py-5">Please select a class and click "Generate Report" to view data.</p></Card>
      )}
    </div>
  );
};

export default AbsencesByClassReportPage;
