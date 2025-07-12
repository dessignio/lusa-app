

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { Instructor, Program, ProgramName } from '../../types'; 
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon, UserTieIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getInstructors, deleteInstructor, getPrograms } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const InstructorListPage: React.FC = () => {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState<ProgramName | ''>(''); 

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [instructorToDelete, setInstructorToDelete] = useState<Instructor | null>(null);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_instructors');

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [instructorsData, programsData] = await Promise.all([
        getInstructors(),
        getPrograms()
      ]);
      setInstructors(instructorsData);
      setPrograms(programsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch instructors or programs.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleDeleteRequest = (instructor: Instructor) => {
    setInstructorToDelete(instructor);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteInstructor = async () => {
    if (!instructorToDelete) return;
    try {
      await deleteInstructor(instructorToDelete.id);
      setInstructors(prevInstructors => prevInstructors.filter(i => i.id !== instructorToDelete.id));
      showToast(`Instructor "${instructorToDelete.firstName} ${instructorToDelete.lastName}" deleted successfully.`, 'success');
    } catch (err) {
      const errorMsg = `Failed to delete instructor: ${err instanceof Error ? err.message : 'Unknown error'}`;
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setInstructorToDelete(null);
    }
  };
  
  const programOptionsForFilter = useMemo(() => {
    return [{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: p.name, label: p.name }))]
  }, [programs]);
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setProgramFilter('');
  };

  const filteredInstructors = useMemo(() => {
    return instructors.filter(instructor => {
      const nameMatches = `${instructor.firstName} ${instructor.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || instructor.email.toLowerCase().includes(searchTerm.toLowerCase());
      const specializationMatches = programFilter 
        ? instructor.specializations?.includes(programFilter)
        : true;
      return nameMatches && specializationMatches;
    });
  }, [instructors, searchTerm, programFilter]);

  const columns: ColumnDefinition<Instructor>[] = [
    {
      header: 'Name',
      accessor: 'firstName', 
      render: (instructor) => `${instructor.firstName} ${instructor.lastName}`,
      headerClassName: 'w-1/4',
    },
    { header: 'Email', accessor: 'email', headerClassName: 'w-1/4' },
    { header: 'Phone', accessor: 'phone', render: (instructor) => instructor.phone || 'N/A', headerClassName: 'w-1/6' },
    { 
      header: 'Specializations', 
      accessor: 'specializations', 
      render: (instructor) => instructor.specializations?.join(', ') || 'N/A',
      headerClassName: 'w-1/4',
    },
  ];

  if (error && instructors.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-brand-error">Error: {error}</h2>
        <Button onClick={fetchPageData} variant="primary" className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0 flex items-center">
          <UserTieIcon className="w-8 h-8 mr-3 text-brand-primary" />
          Manage Instructors
        </h1>
        {canManage && (
            <NavLink to="/users/instructors/new">
                <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                    Add New Instructor
                </Button>
            </NavLink>
        )}
      </div>

      <Card 
        title="Filters & Search" 
        icon={<FilterIcon className="text-brand-primary w-5 h-5" />} 
        collapsible 
        defaultCollapsed={false}
        actions={
          <Button variant="outline" size="sm" onClick={handleClearFilters} className="ml-auto">
            Clear Filters
          </Button>
        }
      >
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
            <Input
                id="search-instructor"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                containerClassName="mb-0"
                label="Search Instructors"
            />
             <Select
                id="filter-specialization"
                label="Filter by Specialization"
                options={isLoading ? [{value: '', label: 'Loading programs...'}] : programOptionsForFilter}
                value={programFilter || ''} 
                onChange={(e) => setProgramFilter(e.target.value as ProgramName | '')}
                containerClassName="mb-0"
                disabled={isLoading || programs.length === 0}
            />
        </div>
      </Card>
      
      <Table<Instructor>
        columns={columns}
        data={filteredInstructors}
        isLoading={isLoading} 
        emptyStateMessage={isLoading ? "Loading instructors..." : "No instructors found matching your criteria."}
        renderRowActions={(instructor) => (
          canManage && (
            <div className="space-x-2 flex justify-end">
              <NavLink to={`/users/instructors/edit/${instructor.id}`}>
                <Button variant="outline" size="sm" aria-label="Edit">
                  <PencilIcon className="w-4 h-4" />
                </Button>
              </NavLink>
              <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(instructor)} aria-label="Delete">
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          )
        )}
      />
      {instructorToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => {
            setIsConfirmDeleteModalOpen(false);
            setInstructorToDelete(null);
          }}
          onConfirm={executeDeleteInstructor}
          title="Confirm Instructor Deletion"
          message={<>Are you sure you want to delete instructor <strong>{instructorToDelete.firstName} {instructorToDelete.lastName}</strong>? This action cannot be undone.</>}
          confirmationText="CONFIRMAR"
          confirmButtonText="Delete Instructor"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default InstructorListPage;