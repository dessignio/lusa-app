
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { Student, Program, ProgramName, StudentStatus, DancerLevelName, MembershipPlanDefinition } from '../../types'; 
import { STUDENT_STATUS_OPTIONS, GENDER_OPTIONS } from '../../constants'; 
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon, UsersIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getStudents, deleteStudent, bulkUpdateStudentDetails, getPrograms, getMembershipPlans } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const StudentListPage: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [membershipPlans, setMembershipPlans] = useState<MembershipPlanDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [programFilter, setProgramFilter] = useState<ProgramName | ''>(''); 
  const [statusFilter, setStatusFilter] = useState<StudentStatus | ''>(''); 
  const [genderFilter, setGenderFilter] = useState<Student['gender'] | ''>('');
  const [membershipPlanFilter, setMembershipPlanFilter] = useState<string>(''); 

  const [selectedStudentIds, setSelectedStudentIds] = useState<Set<string>>(new Set());
  
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<StudentStatus | ''>('');
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);

  const [selectedBulkMembershipPlanId, setSelectedBulkMembershipPlanId] = useState<string>(''); 
  const [isBulkUpdatingMembership, setIsBulkUpdatingMembership] = useState(false);

  const [selectedBulkProgram, setSelectedBulkProgram] = useState<ProgramName | ''>('');
  const [selectedBulkDancerLevel, setSelectedBulkDancerLevel] = useState<DancerLevelName | ''>('');
  const [bulkProgramLevels, setBulkProgramLevels] = useState<{ value: DancerLevelName; label: DancerLevelName }[]>([]);
  const [isBulkUpdatingProgram, setIsBulkUpdatingProgram] = useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);
  
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_students');

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [studentsData, programsData, plansData] = await Promise.all([
        getStudents(),
        getPrograms(),
        getMembershipPlans()
      ]);
      setStudents(studentsData);
      setPrograms(programsData);
      setMembershipPlans(plansData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch page data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);
  
  useEffect(() => {
    const handleDataChange = (event: Event) => {
        const customEvent = event as CustomEvent;
        if (customEvent.detail.entity === 'students') {
            console.log('StudentListPage: Refreshing students data.');
            fetchPageData();
        }
    };
    window.addEventListener('datachange', handleDataChange);
    return () => window.removeEventListener('datachange', handleDataChange);
  }, [fetchPageData]);


  const handleDeleteRequest = (student: Student) => {
    setStudentToDelete(student);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      await deleteStudent(studentToDelete.id);
      fetchPageData(); 
      setSelectedStudentIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(studentToDelete.id);
        return newSet;
      });
      showToast(`Student "${studentToDelete.firstName} ${studentToDelete.lastName}" deleted successfully.`, 'success');
    } catch (err) {
      showToast(`Failed to delete student: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setStudentToDelete(null);
    }
  };
  
  const programOptionsForFilter = useMemo(() => {
    return [{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: p.name, label: p.name }))]
  }, [programs]);

  const statusOptionsForFilter = [{ value: '', label: 'All Statuses' }, ...STUDENT_STATUS_OPTIONS];
  const genderOptionsForFilter = [{ value: '', label: 'All Genders' }, ...GENDER_OPTIONS.map(g => ({ value: g.value, label: g.label }))];
  
  const membershipPlanFilterOptions = useMemo(() => {
    if (isLoading || membershipPlans.length === 0) return [{ value: '', label: 'All Memberships (Loading...)' }];
    const uniquePlanNames = Array.from(new Set(membershipPlans.map(p => p.name)))
                                .sort()
                                .map(name => ({ value: name, label: name })); 
    return [{ value: '', label: 'All Memberships' }, ...uniquePlanNames];
  }, [membershipPlans, isLoading]);

  const bulkMembershipSelectOptions = useMemo(() => {
     if (isLoading || membershipPlans.length === 0) return [{ value: '', label: 'Select membership (Loading...)' }];
     return [{ value: '', label: 'Select membership...' }, ...membershipPlans.map(p => ({ value: p.id, label: p.name }))];
  }, [membershipPlans, isLoading]);

  
  const statusSelectOptions = [{ value: '', label: 'Select status...' }, ...STUDENT_STATUS_OPTIONS];
    
  const programSelectOptionsForBulk = useMemo(() => {
    return [{ value: '', label: 'Select program...' }, ...programs.map(p => ({ value: p.name, label: p.name }))]
  }, [programs]);


  const handleClearFilters = () => {
    setSearchTerm('');
    setProgramFilter('');
    setStatusFilter('');
    setGenderFilter('');
    setMembershipPlanFilter('');
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const nameMatches = `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const programMatches = programFilter ? student.program === programFilter : true;
      const statusMatches = statusFilter ? student.status === statusFilter : true;
      const genderMatches = genderFilter ? student.gender === genderFilter : true;
      
      let membershipMatches = true;
      if (membershipPlanFilter) { 
          const plan = membershipPlans.find(p => p.id === student.membershipPlanId);
          membershipMatches = plan ? plan.name === membershipPlanFilter : false;
      }
      
      return nameMatches && programMatches && statusMatches && genderMatches && membershipMatches;
    });
  }, [students, searchTerm, programFilter, statusFilter, genderFilter, membershipPlanFilter, membershipPlans]);

  const handleRowSelectionChange = (studentId: string, isSelected: boolean) => {
    setSelectedStudentIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) {
        newSelected.add(studentId);
      } else {
        newSelected.delete(studentId);
      }
      return newSelected;
    });
  };

  const handleSelectAllStudents = (isSelected: boolean, currentStudentIdsOnPage: string[]) => {
    setSelectedStudentIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) {
        currentStudentIdsOnPage.forEach(id => newSelected.add(id));
      } else {
        currentStudentIdsOnPage.forEach(id => newSelected.delete(id));
      }
      return newSelected;
    });
  };
  
  const handleDeselectAll = () => {
    setSelectedStudentIds(new Set());
    setSelectedBulkStatus('');
    setSelectedBulkMembershipPlanId('');
    setSelectedBulkProgram('');
    setSelectedBulkDancerLevel('');
    setBulkProgramLevels([]);
  };

  const handleBulkProgramChange = (programName: ProgramName | '') => {
    setSelectedBulkProgram(programName);
    setSelectedBulkDancerLevel(''); 
    if (programName) {
      const selectedProgramData = programs.find(p => p.name === programName);
      if (selectedProgramData?.hasLevels && selectedProgramData.levels) {
        setBulkProgramLevels(selectedProgramData.levels.map(l => ({ value: l, label: l })));
      } else {
        setBulkProgramLevels([]);
      }
    } else {
      setBulkProgramLevels([]);
    }
  };

  const handleBulkUpdate = async (action: 'status' | 'membership' | 'program') => {
    if (selectedStudentIds.size === 0) {
      showToast('Please select at least one student.', 'info');
      return;
    }

    let updatePayload: Partial<Pick<Student, 'membershipPlanId' | 'status' | 'program' | 'dancerLevel'>> = {};
    let confirmMessage = '';
    let valueToUpdate: string | null = null;

    if (action === 'status') {
      if (!selectedBulkStatus) { showToast('Please select a status to apply.', 'info'); return; }
      updatePayload.status = selectedBulkStatus;
      valueToUpdate = selectedBulkStatus;
      confirmMessage = `Are you sure you want to update the status to "${selectedBulkStatus}" for ${selectedStudentIds.size} student(s)?`;
      setIsBulkUpdatingStatus(true);
    } else if (action === 'membership') {
      if (!selectedBulkMembershipPlanId) { showToast('Please select a membership plan to apply.', 'info'); return; }
      updatePayload.membershipPlanId = selectedBulkMembershipPlanId;
      const planName = membershipPlans.find(p => p.id === selectedBulkMembershipPlanId)?.name || 'the selected plan';
      valueToUpdate = planName;
      confirmMessage = `Are you sure you want to update the membership plan to "${planName}" for ${selectedStudentIds.size} student(s)? This will NOT affect Stripe subscriptions.`;
      setIsBulkUpdatingMembership(true);
    } else if (action === 'program') {
      if (!selectedBulkProgram) { showToast('Please select a program to apply.', 'info'); return; }
      const programDetails = programs.find(p => p.name === selectedBulkProgram);
      updatePayload.program = selectedBulkProgram;
      valueToUpdate = selectedBulkProgram;

      if (programDetails?.hasLevels && (programDetails.levels || []).length > 0) {
        if (!selectedBulkDancerLevel) {
           showToast('Please select a dancer level for the chosen program.', 'info');
           if (action === 'program') setIsBulkUpdatingProgram(false); // Reset loading state
           return;
        }
         updatePayload.dancerLevel = selectedBulkDancerLevel || null; 
         valueToUpdate = selectedBulkDancerLevel ? `${selectedBulkProgram} - ${selectedBulkDancerLevel}` : selectedBulkProgram;
      } else {
        updatePayload.dancerLevel = null; 
      }
      confirmMessage = `Are you sure you want to update the program to "${valueToUpdate}" for ${selectedStudentIds.size} student(s)?`;
      setIsBulkUpdatingProgram(true);
    }

    // Using a simple confirm for bulk actions for now, can be upgraded to ConfirmationModal if needed
    if (!window.confirm(confirmMessage)) {
      if (action === 'status') setIsBulkUpdatingStatus(false);
      else if (action === 'membership') setIsBulkUpdatingMembership(false);
      else if (action === 'program') setIsBulkUpdatingProgram(false);
      return;
    }

    try {
      await bulkUpdateStudentDetails(Array.from(selectedStudentIds), updatePayload);
      showToast(`Successfully updated ${action} for ${selectedStudentIds.size} student(s).`, 'success');
      fetchPageData(); 
      handleDeselectAll(); 
    } catch (err) {
      showToast(`Failed to update ${action}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      if (action === 'status') setIsBulkUpdatingStatus(false);
      else if (action === 'membership') setIsBulkUpdatingMembership(false);
      else if (action === 'program') setIsBulkUpdatingProgram(false);
    }
  };


  const columns: ColumnDefinition<Student>[] = [
    {
      header: 'Name',
      accessor: 'firstName', 
      render: (student) => `${student.firstName} ${student.lastName}`,
      headerClassName: 'w-1/6',
    },
    { header: 'Email', accessor: 'email', headerClassName: 'w-1/6' },
    { 
      header: 'Membership', 
      accessor: 'membershipPlanId', 
      render: (student) => {
        const plan = membershipPlans.find(p => p.id === student.membershipPlanId);
        return plan ? plan.name : 'N/A';
      },
      headerClassName: 'w-1/6',
    },
    { 
      header: 'Stripe Status', 
      accessor: 'stripeSubscriptionStatus', 
      render: (s) => {
        const status = s.stripeSubscriptionStatus;
        if (!status) return <span className="text-brand-text-muted text-xs">Not Linked</span>;
        const color = status === 'active' ? 'bg-brand-success-light text-brand-success-dark' : 
                      (status === 'canceled' ? 'bg-brand-error-light text-brand-error-dark' : 'bg-brand-warning-light text-brand-warning-dark');
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>;
      },
      headerClassName: 'w-1/12 text-center',
      cellClassName: 'text-center',
    },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (student) => {
        let bgColor = 'bg-brand-neutral-100 text-brand-neutral-700';
        if (student.status === 'Activo') bgColor = 'bg-brand-success-light text-brand-success-dark';
        else if (student.status === 'Inactivo') bgColor = 'bg-brand-error-light text-brand-error-dark';
        else if (student.status === 'Suspendido') bgColor = 'bg-brand-warning-light text-brand-warning-dark';
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${bgColor}`}>{student.status || 'N/A'}</span>;
      },
      headerClassName: 'w-1/12 text-center',
      cellClassName: 'text-center',
    },
  ];

  if (error && students.length === 0 && !isLoading) { 
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
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0">Manage Students</h1>
        {canManage && (
            <NavLink to="/users/students/new">
            <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                Add New Student
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
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 p-1">
            <Input
                id="search-student"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                containerClassName="mb-0"
                label="Search Students"
            />
             <Select
                id="filter-program"
                label="Filter by Program"
                options={isLoading ? [{value: '', label: 'Loading programs...'}] : programOptionsForFilter}
                value={programFilter || ''} 
                onChange={(e) => setProgramFilter(e.target.value as ProgramName | '')}
                containerClassName="mb-0"
                disabled={isLoading || programs.length === 0}
            />
            <Select
                id="filter-status"
                label="Filter by Status"
                options={statusOptionsForFilter} 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StudentStatus | '')} 
                containerClassName="mb-0"
            />
            <Select
                id="filter-gender"
                label="Filter by Gender"
                options={genderOptionsForFilter}
                value={genderFilter}
                onChange={(e) => setGenderFilter(e.target.value as Student['gender'] | '')}
                containerClassName="mb-0"
            />
            <Select
                id="filter-membership"
                label="Filter by Membership"
                options={membershipPlanFilterOptions}
                value={membershipPlanFilter} 
                onChange={(e) => setMembershipPlanFilter(e.target.value)}
                containerClassName="mb-0"
                disabled={isLoading || membershipPlans.length === 0}
            />
        </div>
      </Card>

      {selectedStudentIds.size > 0 && canManage && (
        <Card title="Bulk Actions" icon={<UsersIcon className="text-brand-primary w-5 h-5" />} collapsible={false} className="border-brand-primary border">
          <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <p className="text-sm text-brand-text-secondary whitespace-nowrap">
                {selectedStudentIds.size} student(s) selected
                </p>
                <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={isBulkUpdatingStatus || isBulkUpdatingMembership || isBulkUpdatingProgram}>
                    Deselect All
                </Button>
            </div>

            <div className="p-3 border rounded-md bg-brand-neutral-50/50">
              <h4 className="text-md font-medium text-brand-text-primary mb-2">Update Status</h4>
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <Select
                  id="bulk-update-status"
                  label="New Status"
                  options={statusSelectOptions}
                  value={selectedBulkStatus}
                  onChange={(e) => setSelectedBulkStatus(e.target.value as StudentStatus | '')}
                  containerClassName="mb-0 flex-grow"
                  disabled={isBulkUpdatingStatus}
                />
                <Button variant="primary" size="md" onClick={() => handleBulkUpdate('status')} isLoading={isBulkUpdatingStatus} disabled={isBulkUpdatingStatus || !selectedBulkStatus} className="w-full sm:w-auto">
                  Apply Status
                </Button>
              </div>
            </div>

            <div className="p-3 border rounded-md bg-brand-neutral-50/50">
              <h4 className="text-md font-medium text-brand-text-primary mb-2">Update Internal Membership Record</h4>
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <Select
                  id="bulk-update-membership"
                  label="New Membership Plan"
                  options={bulkMembershipSelectOptions} 
                  value={selectedBulkMembershipPlanId} 
                  onChange={(e) => setSelectedBulkMembershipPlanId(e.target.value)}
                  containerClassName="mb-0 flex-grow"
                  disabled={isBulkUpdatingMembership || isLoading || membershipPlans.length === 0}
                />
                <Button variant="primary" size="md" onClick={() => handleBulkUpdate('membership')} isLoading={isBulkUpdatingMembership} disabled={isBulkUpdatingMembership || !selectedBulkMembershipPlanId} className="w-full sm:w-auto">
                  Apply Membership
                </Button>
              </div>
              <p className="text-xs text-brand-text-muted mt-1">Note: This only updates the internal record and does not affect Stripe subscriptions.</p>
            </div>

            <div className="p-3 border rounded-md bg-brand-neutral-50/50">
              <h4 className="text-md font-medium text-brand-text-primary mb-2">Update Program & Level</h4>
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <Select
                  id="bulk-update-program"
                  label="New Program"
                  options={isLoading ? [{value: '', label: 'Loading...'}] : programSelectOptionsForBulk}
                  value={selectedBulkProgram}
                  onChange={(e) => handleBulkProgramChange(e.target.value as ProgramName | '')}
                  containerClassName="mb-0 flex-grow"
                  disabled={isBulkUpdatingProgram || isLoading || programs.length === 0}
                />
                {selectedBulkProgram && programs.find(p=>p.name === selectedBulkProgram)?.hasLevels && (programs.find(p=>p.name === selectedBulkProgram)?.levels || []).length > 0 && (
                  <Select
                    id="bulk-update-dancerLevel"
                    label="New Level"
                    options={[{ value: '', label: 'Select level...' }, ...bulkProgramLevels]}
                    value={selectedBulkDancerLevel}
                    onChange={(e) => setSelectedBulkDancerLevel(e.target.value as DancerLevelName | '')}
                    containerClassName="mb-0 flex-grow"
                    disabled={isBulkUpdatingProgram}
                  />
                )}
                <Button 
                  variant="primary" 
                  size="md" 
                  onClick={() => handleBulkUpdate('program')} 
                  isLoading={isBulkUpdatingProgram} 
                  disabled={isBulkUpdatingProgram || !selectedBulkProgram || (programs.find(p=>p.name === selectedBulkProgram)?.hasLevels && (programs.find(p=>p.name === selectedBulkProgram)?.levels || []).length > 0 && !selectedBulkDancerLevel)} 
                  className="w-full sm:w-auto"
                >
                  Apply Program
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <Table<Student>
        columns={columns}
        data={filteredStudents}
        isLoading={isLoading} 
        emptyStateMessage={isLoading ? "Loading students..." : "No students found matching your criteria."}
        selectableRows={canManage}
        selectedRowIds={selectedStudentIds}
        onRowSelectionChange={handleRowSelectionChange}
        onSelectAllRows={handleSelectAllStudents}
        renderRowActions={(student) => (
            canManage && (
                <>
                    <NavLink to={`/users/students/edit/${student.id}`}>
                    <Button variant="outline" size="sm" aria-label="Edit">
                        <PencilIcon className="w-4 h-4" />
                    </Button>
                    </NavLink>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(student)} aria-label="Delete">
                    <TrashIcon className="w-4 h-4" />
                    </Button>
                </>
            )
        )}
      />
      {studentToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => {
            setIsConfirmDeleteModalOpen(false);
            setStudentToDelete(null);
          }}
          onConfirm={executeDeleteStudent}
          title="Confirm Student Deletion"
          message={<>Are you sure you want to delete student <strong>{studentToDelete.firstName} {studentToDelete.lastName}</strong>? This action cannot be undone.</>}
          confirmationText="CONFIRMAR"
          confirmButtonText="Delete Student"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default StudentListPage;