
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { ClassOffering, Program, StudentGeneralLevel } from '../../types';
import { STUDENT_GENERAL_LEVEL_OPTIONS } from '../../constants';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon, ClassesIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getClassOfferings, deleteClassOffering, getPrograms } from '../../services/apiService';
import { showToast } from '../../utils';
import { formatTimeRange } from '../../utils';

const ClassOfferingListPage: React.FC = () => {
  const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<StudentGeneralLevel | ''>('');
  const [programFilter, setProgramFilter] = useState<string>(''); 

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [offeringToDelete, setOfferingToDelete] = useState<ClassOffering | null>(null);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchPageData = useCallback(async () => {
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
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleDeleteRequest = (offering: ClassOffering) => {
    setOfferingToDelete(offering);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteOffering = async () => {
    if (!offeringToDelete) return;
    try {
      await deleteClassOffering(offeringToDelete.id);
      fetchPageData(); 
      showToast(`Class offering "${offeringToDelete.name}" deleted successfully.`, 'success');
    } catch (err) {
      const errorMsg = `Failed to delete class offering: ${err instanceof Error ? err.message : 'Unknown error'}`;
      showToast(errorMsg, 'error');
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setOfferingToDelete(null);
    }
  };

  const uniqueCategories = useMemo(() => {
    const categories = new Set(classOfferings.map(o => o.category));
    return [{ value: '', label: 'All Categories' }, ...Array.from(categories).sort().map(c => ({ value: c, label: c }))];
  }, [classOfferings]);

  const programOptionsForFilter = useMemo(() => {
    return [{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: p.name, label: p.name }))]
  }, [programs]);

  const filteredClassOfferings = useMemo(() => {
    return classOfferings.filter(offering => {
      const nameMatches = offering.name.toLowerCase().includes(searchTerm.toLowerCase());
      const categoryMatches = categoryFilter ? offering.category === categoryFilter : true;
      const levelMatches = levelFilter ? offering.level === levelFilter : true;
      const programMatches = programFilter ? (offering.targetPrograms || []).includes(programFilter) : true;
      return nameMatches && categoryMatches && levelMatches && programMatches;
    });
  }, [classOfferings, searchTerm, categoryFilter, levelFilter, programFilter]);

  const columns: ColumnDefinition<ClassOffering>[] = [
    { header: 'Name', accessor: 'name', headerClassName: 'w-1/4' },
    { header: 'Category', accessor: 'category', headerClassName: 'w-1/6' },
    { header: 'Level', accessor: 'level', headerClassName: 'w-1/12' },
    { header: 'Instructor', accessor: 'instructorName', headerClassName: 'w-1/6' },
    { header: 'Duration', accessor: 'duration', headerClassName: 'w-1/12' },
    { header: 'Price', accessor: 'price', headerClassName: 'w-1/12' },
    { 
      header: 'Target Programs', 
      accessor: 'targetPrograms', 
      render: (offering) => (offering.targetPrograms && offering.targetPrograms.length > 0 ? offering.targetPrograms.join(', ') : 'Any'),
      headerClassName: 'w-1/6',
    },
  ];

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setLevelFilter('');
    setProgramFilter('');
  };
  
  if (error && classOfferings.length === 0 && !isLoading) {
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
          <ClassesIcon className="w-8 h-8 mr-3 text-brand-primary" />
          Manage Class Offerings
        </h1>
        <NavLink to="/classes/offerings/new">
          <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
            Add New Offering
          </Button>
        </NavLink>
      </div>

      <Card 
        title="Filters & Search" 
        icon={<FilterIcon className="text-brand-primary w-5 h-5" />} 
        collapsible 
        defaultCollapsed={false}
        actions={<Button variant="outline" size="sm" onClick={handleClearFilters}>Clear Filters</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
          <Input
            id="search-offerings"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0" label="Search Name"
          />
          <Select
            id="filter-category" label="Filter by Category"
            options={uniqueCategories} value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            containerClassName="mb-0"
            disabled={isLoading || uniqueCategories.length <= 1}
          />
          <Select
            id="filter-level" label="Filter by Level"
            options={[{ value: '', label: 'All Levels' }, ...STUDENT_GENERAL_LEVEL_OPTIONS]}
            value={levelFilter}
            onChange={(e) => setLevelFilter(e.target.value as StudentGeneralLevel | '')}
            containerClassName="mb-0"
          />
          <Select
            id="filter-program" label="Filter by Program"
            options={programOptionsForFilter} value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            containerClassName="mb-0"
            disabled={isLoading || programs.length === 0}
          />
        </div>
      </Card>
      
      <Table<ClassOffering>
        columns={columns}
        data={filteredClassOfferings}
        isLoading={isLoading}
        emptyStateMessage={isLoading ? "Loading class offerings..." : "No class offerings found. Add a new offering to get started."}
        renderRowActions={(offering) => (
          <div className="space-x-2 flex justify-end">
            <NavLink to={`/classes/offerings/edit/${offering.id}`}>
              <Button variant="outline" size="sm" aria-label={`Edit ${offering.name}`}>
                <PencilIcon className="w-4 h-4" />
              </Button>
            </NavLink>
            <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(offering)} aria-label={`Delete ${offering.name}`}>
              <TrashIcon className="w-4 h-4" />
            </Button>
          </div>
        )}
      />
      {offeringToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => {
            setIsConfirmDeleteModalOpen(false);
            setOfferingToDelete(null);
          }}
          onConfirm={executeDeleteOffering}
          title="Confirm Class Offering Deletion"
          message={<>Are you sure you want to delete class offering <strong>{offeringToDelete.name}</strong>? This action cannot be undone.</>}
          confirmationText="CONFIRMAR"
          confirmButtonText="Delete Offering"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default ClassOfferingListPage;
