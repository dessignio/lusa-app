import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Table, { ColumnDefinition } from '../../components/Table';
import { Prospect, Program } from '../../types';
import Button from '../../components/forms/Button';
import { UserPlusIcon, PencilIcon, TrashIcon, UserCheckIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import ProspectEvaluationModal from '../../components/modals/ProspectEvaluationModal';
import { getProspects, deleteProspect, getPrograms, approveProspect } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const ProspectListPage: React.FC = () => {
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [prospectToProcess, setProspectToProcess] = useState<Prospect | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_students');

  const fetchPageData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prospectsData, programsData] = await Promise.all([getProspects(), getPrograms()]);
      setProspects(prospectsData);
      setPrograms(programsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch page data.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPageData();
  }, [fetchPageData]);

  const handleDeleteRequest = (prospect: Prospect) => {
    setProspectToProcess(prospect);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteProspect = async () => {
    if (!prospectToProcess) return;
    setIsProcessing(true);
    try {
      await deleteProspect(prospectToProcess.id);
      showToast(`Prospect "${prospectToProcess.firstName}" deleted successfully.`, 'success');
      fetchPageData();
    } catch (err) {
      showToast(`Failed to delete prospect: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setProspectToProcess(null);
      setIsProcessing(false);
    }
  };

  const handleEvaluationRequest = (prospect: Prospect) => {
    setProspectToProcess(prospect);
    setIsEvaluationModalOpen(true);
  };
  
  const handleApprove = async (data: { program: string; dancerLevel: string | null }) => {
    if (!prospectToProcess) return;
    setIsProcessing(true);
    try {
        await approveProspect(prospectToProcess.id, data);
        showToast(`Prospect "${prospectToProcess.firstName}" has been approved and converted to a student!`, 'success');
        fetchPageData();
    } catch(err) {
        showToast(`Failed to approve prospect: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
        setIsEvaluationModalOpen(false);
        setProspectToProcess(null);
        setIsProcessing(false);
    }
  };
  
  const handleReject = () => {
      // Re-use delete logic
      setIsEvaluationModalOpen(false);
      setIsConfirmDeleteModalOpen(true);
  };

  const columns: ColumnDefinition<Prospect>[] = [
    { header: 'Name', accessor: 'firstName', render: (p) => `${p.firstName} ${p.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone', render: p => p.phone || 'N/A' },
    { header: 'Date of Birth', accessor: 'dateOfBirth', render: p => new Date(p.dateOfBirth).toLocaleDateString() },
    { header: 'Registered On', accessor: 'createdAt', render: p => p.createdAt ? new Date(p.createdAt).toLocaleDateString() : 'N/A' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0 flex items-center">
          <UserCheckIcon className="w-8 h-8 mr-3 text-brand-success-dark" />
          Manage Prospects
        </h1>
        {canManage && (
          <NavLink to="/users/prospects/new">
            <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
              Add New Prospect
            </Button>
          </NavLink>
        )}
      </div>

      <Card title="Pending Evaluation" collapsible={false}>
        <Table<Prospect>
          columns={columns}
          data={prospects}
          isLoading={isLoading}
          emptyStateMessage={isLoading ? "Loading prospects..." : "No prospects are currently awaiting evaluation."}
          renderRowActions={(prospect) => (
            canManage && (
              <div className="space-x-2 flex justify-end">
                <Button variant="success" size="sm" onClick={() => handleEvaluationRequest(prospect)} leftIcon={<UserCheckIcon className="w-4 h-4"/>}>
                  Evaluate
                </Button>
                <NavLink to={`/users/prospects/edit/${prospect.id}`}>
                  <Button variant="outline" size="sm" aria-label="Edit"><PencilIcon className="w-4 h-4" /></Button>
                </NavLink>
                <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(prospect)} aria-label="Delete"><TrashIcon className="w-4 h-4" /></Button>
              </div>
            )
          )}
        />
      </Card>

      {prospectToProcess && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={executeDeleteProspect}
          title="Confirm Prospect Deletion"
          message={<>Are you sure you want to delete prospect <strong>{prospectToProcess.firstName} {prospectToProcess.lastName}</strong>? This action cannot be undone.</>}
          confirmationText="DELETE"
          confirmButtonText="Delete Prospect"
          confirmButtonVariant="danger"
        />
      )}

      {prospectToProcess && (
        <ProspectEvaluationModal 
            isOpen={isEvaluationModalOpen}
            onClose={() => setIsEvaluationModalOpen(false)}
            prospectName={`${prospectToProcess.firstName} ${prospectToProcess.lastName}`}
            programs={programs}
            onApprove={handleApprove}
            onReject={handleReject}
            isProcessing={isProcessing}
        />
      )}
    </div>
  );
};

export default ProspectListPage;
