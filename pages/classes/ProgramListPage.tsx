
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { Program } from '../../types';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getPrograms, deleteProgram } from '../../services/apiService';
import { showToast } from '../../utils';

const ProgramListPage: React.FC = () => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [programToDelete, setProgramToDelete] = useState<Program | null>(null);

  const fetchProgramsList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPrograms();
      setPrograms(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch programs.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgramsList();
  }, [fetchProgramsList]);

  const handleDeleteRequest = (program: Program) => {
    setProgramToDelete(program);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteProgram = async () => {
    if(!programToDelete) return;
    try {
      await deleteProgram(programToDelete.id);
      fetchProgramsList(); 
      showToast(`Program "${programToDelete.name}" deleted successfully.`, 'success');
    } catch (err) {
      const errorMsg = `Failed to delete program "${programToDelete.name}": ${err instanceof Error ? err.message : 'Unknown error'}`;
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setProgramToDelete(null);
    }
  };

  const filteredPrograms = useMemo(() => {
    return programs.filter(program =>
      program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      program.ageRange.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (program.levels && program.levels.join(', ').toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [programs, searchTerm]);

  const columns: ColumnDefinition<Program>[] = [
    {
      header: 'Program Name',
      accessor: 'name',
      headerClassName: 'w-1/3',
    },
    {
      header: 'Age Range',
      accessor: 'ageRange',
      headerClassName: 'w-1/3',
    },
    {
      header: 'Levels',
      accessor: 'levels',
      render: (program) => program.levels && program.levels.length > 0 ? program.levels.join(', ') : 'N/A',
      headerClassName: 'w-1/3',
    },
  ];

  if (error && programs.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-brand-error">Error: {error}</h2>
        <Button onClick={fetchProgramsList} variant="primary" className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0 flex items-center">
          <i className="fas fa-sitemap fa-fw mr-3 text-brand-primary"></i>
          Manage Programs
        </h1>
        <NavLink to="/classes/programs/new">
          <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
            Add New Program
          </Button>
        </NavLink>
      </div>

       <Card title="Search Programs" icon={<FilterIcon className="text-brand-primary w-5 h-5" />} collapsible defaultCollapsed={false}>
        <div className="p-1">
          <Input
            id="search-programs"
            type="text"
            placeholder="Search by name, age range, or levels..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0"
          />
        </div>
      </Card>
      
      <Table<Program>
        columns={columns}
        data={filteredPrograms}
        isLoading={isLoading}
        emptyStateMessage={isLoading ? "Loading programs..." : "No programs found. Add a new program to get started."}
        renderRowActions={(program) => (
          <div className="space-x-2 flex justify-end">
            <NavLink to={`/classes/programs/edit/${program.id}`}>
              <Button variant="outline" size="sm" aria-label={`Edit Program ${program.name}`}>
                <PencilIcon className="w-4 h-4" />
              </Button>
            </NavLink>
            <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(program)} aria-label={`Delete Program ${program.name}`}>
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      />
      {programToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => {
            setIsConfirmDeleteModalOpen(false);
            setProgramToDelete(null);
          }}
          onConfirm={executeDeleteProgram}
          title="Confirm Program Deletion"
          message={<>Are you sure you want to delete program <strong>{programToDelete.name}</strong>? This action cannot be undone and might affect related class offerings.</>}
          confirmationText="DELETE"
          confirmButtonText="Delete Program"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default ProgramListPage;
