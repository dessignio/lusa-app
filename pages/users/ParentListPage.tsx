import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { Parent } from '../../types'; 
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon, UserFriendsIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getParents, deleteParent } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const ParentListPage: React.FC = () => {
  const [parents, setParents] = useState<Parent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [parentToDelete, setParentToDelete] = useState<Parent | null>(null);
  
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_students');

  const fetchParents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getParents();
      setParents(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch parents data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchParents();
  }, [fetchParents]);

  const handleDeleteRequest = (parent: Parent) => {
    setParentToDelete(parent);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!parentToDelete) return;
    try {
      await deleteParent(parentToDelete.id);
      showToast(`Parent "${parentToDelete.firstName} ${parentToDelete.lastName}" deleted successfully.`, 'success');
      fetchParents();
    } catch (err) {
      showToast(`Failed to delete parent: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setParentToDelete(null);
    }
  };

  const filteredParents = useMemo(() => {
    return parents.filter(parent =>
      `${parent.firstName} ${parent.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [parents, searchTerm]);

  const columns: ColumnDefinition<Parent>[] = [
    { header: 'Name', accessor: 'firstName', render: (p) => `${p.firstName} ${p.lastName}` },
    { header: 'Email', accessor: 'email' },
    { header: 'Phone', accessor: 'phone' },
  ];

  if (error && parents.length === 0 && !isLoading) { 
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-brand-error">Error: {error}</h2>
        <Button onClick={fetchParents} variant="primary" className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0">Manage Parents</h1>
        {canManage && (
            <NavLink to="/users/parents/new">
            <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                Add New Parent
            </Button>
            </NavLink>
        )}
      </div>

      <Card 
        title="Search Parents" 
        icon={<FilterIcon className="text-brand-primary w-5 h-5" />} 
        collapsible
      >
        <div className="p-1">
          <Input
            id="search-parent"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0"
          />
        </div>
      </Card>

      <Table<Parent>
        columns={columns}
        data={filteredParents}
        isLoading={isLoading} 
        emptyStateMessage="No parents found. Add a parent to get started."
        renderRowActions={(parent) => (
            canManage && (
                <div className="space-x-2">
                    <NavLink to={`/users/parents/edit/${parent.id}`}>
                    <Button variant="outline" size="sm" aria-label="Edit">
                        <PencilIcon className="w-4 h-4" />
                    </Button>
                    </NavLink>
                    <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(parent)} aria-label="Delete">
                    <TrashIcon className="w-4 h-4" />
                    </Button>
                </div>
            )
        )}
      />

      {parentToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={executeDelete}
          title="Confirm Parent Deletion"
          message={<>Are you sure you want to delete <strong>{parentToDelete.firstName} {parentToDelete.lastName}</strong>? This will not delete linked students but will remove the association. This action cannot be undone.</>}
          confirmationText="DELETE"
          confirmButtonText="Delete Parent"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default ParentListPage;