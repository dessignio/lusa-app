import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../components/Card';
import { CalendarIcon, FilterIcon, UsersIcon, ClassesIcon } from '../components/icons';
import { ClassOffering, Program, Instructor } from '../types';
import { getClassOfferings, getPrograms, getInstructors } from '../services/apiService';
import { showToast } from '../utils';
import Button from '../components/forms/Button';
import Select from '../components/forms/Select';
import Input from '../components/forms/Input';

const EnrollmentPage: React.FC = () => {
  const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<string>('');
  const [instructorFilter, setInstructorFilter] = useState<string>('');

  const fetchEnrollmentData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [offeringsData, programsData, instructorsData] = await Promise.all([
        getClassOfferings(),
        getPrograms(),
        getInstructors(),
      ]);
      setClassOfferings(offeringsData);
      setPrograms(programsData);
      setInstructors(instructorsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load enrollment data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEnrollmentData();
  }, [fetchEnrollmentData]);

  const programOptions = useMemo(() => ([
    { value: '', label: 'All Programs' },
    ...programs.map(p => ({ value: p.id, label: p.name }))
  ]), [programs]);

  const instructorOptions = useMemo(() => ([
    { value: '', label: 'All Instructors' },
    ...instructors.map(i => ({ value: i.id, label: `${i.firstName} ${i.lastName}` }))
  ]), [instructors]);


  const filteredOfferings = useMemo(() => {
    return classOfferings.filter(offering => {
      const nameMatches = offering.name.toLowerCase().includes(searchTerm.toLowerCase());
      const programMatches = programFilter ? (offering.targetPrograms || []).some(tp => programs.find(p=>p.name === tp)?.id === programFilter) : true;
      // Instructor filter needs to compare against instructorName string for now as ID isn't directly on offering
      const instructorDetails = instructors.find(i => i.id === instructorFilter);
      const instructorNameFilter = instructorDetails ? `${instructorDetails.firstName} ${instructorDetails.lastName}` : '';
      const instructorMatches = instructorFilter ? offering.instructorName === instructorNameFilter : true;
      
      return nameMatches && programMatches && instructorMatches;
    });
  }, [classOfferings, searchTerm, programFilter, instructorFilter, programs, instructors]);

  const getCapacityStyleInfo = (enrolled: number, capacity: number): { baseColor: string, bgColorClass: string, borderColorClass: string } => {
    let baseColor = 'brand-neutral-200'; // Default / Avoid division by zero
    if (capacity > 0) {
        const percentage = (enrolled / capacity) * 100;
        if (percentage >= 100) baseColor = 'brand-error'; // Full or over capacity
        else if (percentage >= 80) baseColor = 'brand-warning'; // Nearing capacity
        else baseColor = 'brand-success'; // Available
    }
    return {
        baseColor,
        bgColorClass: `bg-${baseColor}`,
        borderColorClass: `border-${baseColor}`,
    };
  };
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setProgramFilter('');
    setInstructorFilter('');
  };


  if (isLoading) {
    return <div className="p-6 text-center text-brand-text-secondary">Loading class offerings...</div>;
  }

  if (error) {
    return <div className="p-6 text-center text-brand-error">Error loading data: {error} <Button onClick={fetchEnrollmentData} className="mt-2">Retry</Button></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CalendarIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-3xl font-bold text-brand-text-primary">Enrollment Management</h1>
      </div>
      
      <Card title="Filter Available Classes" icon={<FilterIcon className="text-brand-primary w-5 h-5"/>} collapsible defaultCollapsed={false}
        actions={<Button variant="outline" size="sm" onClick={handleClearFilters} disabled={isLoading}>Clear Filters</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-2">
          <Input 
            id="search-offering-name"
            label="Search by Class Name"
            placeholder="Enter class name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
            containerClassName="mb-0"
          />
          <Select 
            id="filter-program"
            label="Filter by Program"
            options={programOptions}
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            disabled={isLoading || programs.length === 0}
            containerClassName="mb-0"
          />
          <Select 
            id="filter-instructor"
            label="Filter by Instructor"
            options={instructorOptions}
            value={instructorFilter}
            onChange={(e) => setInstructorFilter(e.target.value)}
            disabled={isLoading || instructors.length === 0}
            containerClassName="mb-0"
          />
        </div>
      </Card>

      {filteredOfferings.length === 0 && !isLoading && (
        <Card title="Results" icon={<UsersIcon className="text-brand-primary w-5 h-5" />}>
           <p className="text-brand-text-secondary text-center py-5">No class offerings match your current filters.</p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredOfferings.map(offering => {
          const capacityStyles = getCapacityStyleInfo(offering.enrolledCount, offering.capacity);
          return (
            <div key={offering.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden flex flex-col">
              <div className={`p-5 border-b-4 ${capacityStyles.borderColorClass}`}>
                <div className="flex items-center space-x-3 mb-3">
                  <ClassesIcon className="w-7 h-7 text-brand-primary opacity-80" />
                  <h3 className="text-xl font-semibold text-brand-text-primary truncate" title={offering.name}>{offering.name}</h3>
                </div>
                <div className="space-y-1.5 text-sm text-brand-text-secondary">
                  <p><strong className="font-medium">Instructor:</strong> {offering.instructorName}</p>
                  <p><strong className="font-medium">Category:</strong> {offering.category}</p>
                  <p><strong className="font-medium">Level:</strong> {offering.level}</p>
                </div>
              </div>
              <div className="p-5 mt-auto"> {/* mt-auto pushes this section to the bottom */}
                <div className="mb-3">
                  <div className="flex justify-between items-center text-xs font-medium text-brand-text-muted mb-1">
                    <span>Enrollment: {offering.enrolledCount} / {offering.capacity}</span>
                    <span>{offering.capacity > 0 ? `${Math.round((offering.enrolledCount / offering.capacity) * 100)}% Full` : 'N/A'}</span>
                  </div>
                  <div className="w-full bg-brand-neutral-200 rounded-full h-3.5"> {/* Increased height */}
                    <div
                      className={`h-3.5 rounded-full ${capacityStyles.bgColorClass} transition-all duration-500 ease-out`}
                      style={{ width: offering.capacity > 0 ? `${(offering.enrolledCount / offering.capacity) * 100}%` : '0%' }}
                    ></div>
                  </div>
                </div>
                <NavLink to={`/enrollments/class/${offering.id}`}>
                  <Button variant="primary" size="sm" className="w-full mt-3">
                    View Roster & Manage
                  </Button>
                </NavLink>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EnrollmentPage;
