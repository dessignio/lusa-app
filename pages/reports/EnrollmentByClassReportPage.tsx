
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon, ListOlIcon, DownloadIcon } from '../../components/icons';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ClassOffering, Program } from '../../types';
import { getClassOfferings, getPrograms } from '../../services/apiService';
import { showToast, exportToCSV } from '../../utils';
import Table, { ColumnDefinition } from '../../components/Table';
import Select from '../../components/forms/Select';

const EnrollmentByClassReportPage: React.FC = () => {
  const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [programFilter, setProgramFilter] = useState<string>('');

  const fetchReportData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [offeringsData, programsData] = await Promise.all([
        getClassOfferings(),
        getPrograms(),
      ]);
      setClassOfferings(offeringsData);
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

  const filteredOfferings = useMemo(() => {
    return classOfferings
      .filter(offering => {
        if (!programFilter) return true;
        return (offering.targetPrograms || []).includes(programFilter);
      })
      .map(offering => ({
        ...offering,
        occupancy: offering.capacity > 0 ? (offering.enrolledCount / offering.capacity) * 100 : 0,
      }));
  }, [classOfferings, programFilter]);

  const handleExportCSV = () => {
    if (filteredOfferings.length === 0) {
      showToast("No data to export.", "info");
      return;
    }
    const dataToExport = filteredOfferings.map(o => ({
      'Class Name': o.name,
      'Instructor': o.instructorName,
      'Enrolled': o.enrolledCount,
      'Capacity': o.capacity,
      'Occupancy (%)': o.occupancy.toFixed(1),
    }));
    exportToCSV(dataToExport, 'enrollment-by-class');
  };

  const programOptions = useMemo(() => ([
    { value: '', label: 'All Programs' },
    ...programs.map(p => ({ value: p.name, label: p.name }))
  ]), [programs]);

  const tableColumns: ColumnDefinition<ClassOffering & { occupancy: number }>[] = [
    { header: 'Class Name', accessor: 'name' },
    { header: 'Instructor', accessor: 'instructorName' },
    { header: 'Enrolled', accessor: 'enrolledCount', cellClassName: 'text-center' },
    { header: 'Capacity', accessor: 'capacity', cellClassName: 'text-center' },
    { header: 'Occupancy', accessor: 'occupancy', cellClassName: 'text-center font-medium', render: (o) => `${o.occupancy.toFixed(1)}%` },
  ];

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <ListOlIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Enrollment by Class Report
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
        <>
        <Card title="Class Occupancy">
            {filteredOfferings.length > 0 ? (
                 <div style={{ height: 400 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={filteredOfferings} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" domain={[0, 100]} tickFormatter={(tick) => `${tick}%`} />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                            <Legend />
                            <Bar dataKey="occupancy" name="Occupancy" fill="#7249AB" background={{ fill: '#eee' }}/>
                        </BarChart>
                    </ResponsiveContainer>
                 </div>
            ) : (
                <p className="text-brand-text-secondary text-center py-5">No class data available for the selected filters.</p>
            )}
        </Card>

        <Card title="Detailed Class Enrollment" actions={<Button variant="outline" size="sm" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export CSV</Button>}>
            <Table<ClassOffering & { occupancy: number }>
                columns={tableColumns}
                data={filteredOfferings}
                isLoading={isLoading}
                emptyStateMessage="No class offerings match the current filters."
            />
        </Card>
        </>
      )}
    </div>
  );
};

export default EnrollmentByClassReportPage;
