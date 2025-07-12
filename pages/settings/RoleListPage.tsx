

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { Role } from '../../types';
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon, UsersIcon as RolesIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getRoles, deleteRole } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const RoleListPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  
  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_roles_permissions');

  const fetchRolesList = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getRoles();
      setRoles(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRolesList();
  }, [fetchRolesList]);

  const handleDeleteRequest = (role: Role) => {
    setRoleToDelete(role);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteRole = async () => {
    if (!roleToDelete) return;
    try {
      await deleteRole(roleToDelete.id);
      setRoles(prevRoles => prevRoles.filter(r => r.id !== roleToDelete.id));
      showToast(`Role "${roleToDelete.name}" deleted successfully.`, 'success');
    } catch (err) {
      const errorMsg = `Failed to delete role "${roleToDelete.name}": ${err instanceof Error ? err.message : 'Unknown error'}`;
      showToast(errorMsg, 'error');
      console.error(err);
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setRoleToDelete(null);
    }
  };

  const filteredRoles = useMemo(() => {
    return roles.filter(role =>
      role.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (role.description && role.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [roles, searchTerm]);

  const columns: ColumnDefinition<Role>[] = [
    {
      header: 'Role Name',
      accessor: 'name',
      headerClassName: 'w-1/3',
    },
    {
      header: 'Description',
      accessor: 'description',
      render: (role) => role.description || '-',
      headerClassName: 'w-1/2',
    },
    {
      header: 'Permissions Count',
      accessor: 'permissions',
      render: (role) => role.permissions.length,
      headerClassName: 'w-1/6 text-center',
      cellClassName: 'text-center',
    },
  ];

  if (error && roles.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-brand-error">Error: {error}</h2>
        <Button onClick={fetchRolesList} variant="primary" className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0 flex items-center">
          <RolesIcon className="w-8 h-8 mr-3 text-brand-primary" />
          Manage Roles & Permissions
        </h1>
        {canManage && (
            <NavLink to="/settings/roles/new">
            <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                Add New Role
            </Button>
            </NavLink>
        )}
      </div>

      <Card title="Search Roles" icon={<FilterIcon className="text-brand-primary w-5 h-5" />} collapsible defaultCollapsed={false}>
        <div className="p-1">
          <Input
            id="search-roles"
            type="text"
            placeholder="Search by role name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            containerClassName="mb-0"
          />
        </div>
      </Card>
      
      <Table<Role>
        columns={columns}
        data={filteredRoles}
        isLoading={isLoading}
        emptyStateMessage={isLoading ? "Loading roles..." : "No roles found. Add a new role to get started."}
        renderRowActions={(role) => (
          canManage && (
            <div className="space-x-2 flex justify-end">
              <NavLink to={`/settings/roles/edit/${role.id}`}>
                <Button variant="outline" size="sm" aria-label={`Edit Role ${role.name}`}>
                  <PencilIcon className="w-4 h-4" />
                </Button>
              </NavLink>
              <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(role)} aria-label={`Delete Role ${role.name}`}>
                <TrashIcon className="w-4 h-4" />
              </Button>
            </div>
          )
        )}
      />
      {roleToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => {
            setIsConfirmDeleteModalOpen(false);
            setRoleToDelete(null);
          }}
          onConfirm={executeDeleteRole}
          title="Confirm Role Deletion"
          message={<>Are you sure you want to delete role <strong>{roleToDelete.name}</strong>? This action cannot be undone.</>}
          confirmationText="CONFIRMAR"
          confirmButtonText="Delete Role"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default RoleListPage;