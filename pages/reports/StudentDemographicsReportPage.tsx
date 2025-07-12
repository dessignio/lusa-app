

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronLeftIcon, UsersIcon, DownloadIcon } from '../../components/icons';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Student } from '../../types';
import { getStudents } from '../../services/apiService';
import { showToast, exportToCSV, calculateAge } from '../../utils';

interface DemographicData {
  name: string;
  value: number;
}

const GENDER_COLORS = {
  'Femenino': '#EC4899', // Pink
  'Masculino': '#3B82F6', // Blue
  'Otro': '#F59E0B', // Amber
  'Prefiero no decirlo': '#6B7280', // Gray
};
const AGE_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F'];

const getAgeGroup = (age: number): string => {
    if (age <= 5) return '0-5';
    if (age <= 10) return '6-10';
    if (age <= 15) return '11-15';
    if (age <= 20) return '16-20';
    if (age <= 30) return '21-30';
    return '31+';
};

const StudentDemographicsReportPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStudents = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const studentsData = await getStudents();
            setStudents(studentsData);
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Failed to load student data.';
            setError(msg);
            showToast(msg, 'error');
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const genderDistribution: DemographicData[] = useMemo(() => {
        const counts: Record<string, number> = {};
        students.forEach(s => {
            const gender = s.gender || 'Prefiero no decirlo';
            counts[gender] = (counts[gender] || 0) + 1;
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [students]);

    const ageDistribution: DemographicData[] = useMemo(() => {
        const counts: Record<string, number> = {};
        students.forEach(s => {
            if (s.dateOfBirth) {
                const age = calculateAge(s.dateOfBirth);
                if (age !== null) {
                    const group = getAgeGroup(age);
                    counts[group] = (counts[group] || 0) + 1;
                }
            }
        });
        return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a,b) => a.name.localeCompare(b.name));
    }, [students]);

    const handleExportCSV = (dataType: 'gender' | 'age') => {
        const data = dataType === 'gender' ? genderDistribution : ageDistribution;
        if (data.length === 0) {
          showToast("No data to export.", "info");
          return;
        }
        const dataToExport = data.map(item => ({
          'Category': item.name,
          'Number of Students': item.value,
        }));
        exportToCSV(dataToExport, `student-${dataType}-demographics`);
    };

  return (
    <div className="space-y-6">
      <NavLink to="/reports" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Reports Hub
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <UsersIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Student Demographics Report
      </h1>
      
      {isLoading && <p className="text-center text-brand-text-secondary py-5">Loading report data...</p>}
      {error && <p className="text-center text-brand-error py-5">{error}</p>}

      {!isLoading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card title="Gender Distribution" actions={<Button variant="outline" size="sm" onClick={() => handleExportCSV('gender')} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export</Button>}>
                {genderDistribution.length > 0 ? (
                    <div style={{height: 300}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={genderDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {genderDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={GENDER_COLORS[entry.name as keyof typeof GENDER_COLORS] || '#ccc'} />)}
                                </Pie>
                                <Tooltip/>
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p className="text-brand-text-secondary p-4 text-center">No gender data to display.</p>}
            </Card>

            <Card title="Age Distribution" actions={<Button variant="outline" size="sm" onClick={() => handleExportCSV('age')} leftIcon={<DownloadIcon className="w-4 h-4"/>}>Export</Button>}>
                {ageDistribution.length > 0 ? (
                    <div style={{height: 300}}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie data={ageDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label>
                                    {ageDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={AGE_COLORS[index % AGE_COLORS.length]} />)}
                                </Pie>
                                <Tooltip/>
                                <Legend/>
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : <p className="text-brand-text-secondary p-4 text-center">No age data to display.</p>}
            </Card>
        </div>
      )}
    </div>
  );
};

export default StudentDemographicsReportPage;
