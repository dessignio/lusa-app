import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; 
import Table, { ColumnDefinition } from '../../components/Table';
import { AdminUser, AdminUserStatus, Role } from '../../types'; 
import { ADMIN_USER_STATUS_OPTIONS } from '../../constants'; 
import Button from '../../components/forms/Button';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import { UserPlusIcon, PencilIcon, TrashIcon, FilterIcon, UserShieldIcon, UsersIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { getAdminUsers, deleteAdminUser, getRoles, bulkUpdateAdminUsersStatus, bulkUpdateAdminUsersRole } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const AdminUserListPage: React.FC = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>(''); 
  const [statusFilter, setStatusFilter] = useState<AdminUserStatus | ''>(''); 

  const [selectedAdminUserIds, setSelectedAdminUserIds] = useState<Set<string>>(new Set());
  const [selectedBulkStatus, setSelectedBulkStatus] = useState<AdminUserStatus | ''>('');
  const [isBulkUpdatingStatus, setIsBulkUpdatingStatus] = useState(false);
  const [selectedBulkRole, setSelectedBulkRole] = useState<string>('');
  const [isBulkUpdatingRole, setIsBulkUpdatingRole] = useState(false);

  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);
  const [adminUserToDelete, setAdminUserToDelete] = useState<AdminUser | null>(null);

  const { hasPermission, currentUser, loading: authLoading } = useAuth();
  const canManage = hasPermission('manage_admin_users');

  const fetchPageData = useCallback(async () => {
    console.log("fetchPageData: Starting fetch.");
    console.log("fetchPageData: authLoading=", authLoading, "currentUser.studioId=", currentUser?.studioId);

    if (authLoading) {
      console.log("fetchPageData: authLoading is true, returning.");
      return; // Don't fetch until auth is loaded
    }

    if (!currentUser?.studioId) {
      const msg = "No se pudo determinar el estudio del usuario.";
      console.error("fetchPageData: Error -", msg);
      setError(msg);
      showToast(msg, 'error');
      setIsLoading(false);
      return;
    }
    console.log("fetchPageData: Setting isLoading to true.");
    setIsLoading(true);
    setError(null);
    try {
      console.log("fetchPageData: Calling getAdminUsers with studioId:", currentUser.studioId);
      const [adminUsersData, rolesData] = await Promise.all([
        getAdminUsers(currentUser.studioId),
        getRoles(currentUser.studioId)
      ]);
      console.log("fetchPageData: Received adminUsersData:", adminUsersData);
      console.log("fetchPageData: Received rolesData:", rolesData);
      setAdminUsers(adminUsersData.map(user => ({
        ...user,
        roleName: rolesData.find(r => r.id === user.roleId)?.name || 'Unknown Role'
      })));
      setRoles(rolesData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch admin users or roles.';
      console.error("fetchPageData: Error during API call:", err);
      setError(msg);
      showToast(msg, 'error');
    } finally {
      console.log("fetchPageData: Setting isLoading to false.");
      setIsLoading(false);
    }
    // ✅ ÚNICO CAMBIO REALIZADO AQUÍ:
    // Se ajustaron las dependencias a los valores primitivos y estables que realmente se usan,
    // para evitar el bucle de recarga infinito.
  }, [authLoading, currentUser?.studioId]);

  useEffect(() => {
    if (!authLoading && currentUser?.studioId) {
      fetchPageData();
    }
  }, [authLoading, currentUser?.studioId]);

  const handleDeleteRequest = (adminUser: AdminUser) => {
    setAdminUserToDelete(adminUser);
    setIsConfirmDeleteModalOpen(true);
  };

  const executeDeleteAdminUser = async () => {
    if (!adminUserToDelete || !currentUser?.studioId) {
      showToast('No se pudo eliminar el usuario administrador.', 'error');
      setIsConfirmDeleteModalOpen(false);
      setAdminUserToDelete(null);
      return;
    }
    try {
      await deleteAdminUser(currentUser.studioId, adminUserToDelete.id);
      fetchPageData(); 
      setSelectedAdminUserIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(adminUserToDelete.id);
        return newSet;
      });
      showToast(`Admin user "${adminUserToDelete.username}" deleted successfully.`, 'success');
    } catch (err) {
      showToast(`Failed to delete admin user: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      console.error(err);
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setAdminUserToDelete(null);
    }
  };
  
  const roleOptionsForFilter = [{ value: '', label: 'All Roles' }, ...roles.map(r => ({ value: r.id, label: r.name }))];
  const statusOptionsForFilter = [{ value: '', label: 'All Statuses' }, ...ADMIN_USER_STATUS_OPTIONS];
  
  const handleClearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  const filteredAdminUsers = useMemo(() => {
    return adminUsers.filter(user => {
      const nameMatches = `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.username.toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatches = roleFilter ? user.roleId === roleFilter : true;
      const statusMatches = statusFilter ? user.status === statusFilter : true;
      return nameMatches && roleMatches && statusMatches;
    });
  }, [adminUsers, searchTerm, roleFilter, statusFilter]);

  const handleRowSelectionChange = (userId: string, isSelected: boolean) => {
    setSelectedAdminUserIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) newSelected.add(userId);
      else newSelected.delete(userId);
      return newSelected;
    });
  };

  const handleSelectAllAdminUsers = (isSelected: boolean, currentUserIdsOnPage: string[]) => {
    setSelectedAdminUserIds(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (isSelected) currentUserIdsOnPage.forEach(id => newSelected.add(id));
      else currentUserIdsOnPage.forEach(id => newSelected.delete(id));
      return newSelected;
    });
  };
  
  const handleDeselectAll = () => {
    setSelectedAdminUserIds(new Set());
    setSelectedBulkStatus('');
    setSelectedBulkRole('');
  };

  const handleBulkUpdate = async (action: 'status' | 'role') => {
    if (!currentUser?.studioId) {
      showToast('No se pudo determinar el estudio para la actualización masiva.', 'error');
      return;
    }
    if (selectedAdminUserIds.size === 0) {
      showToast('Please select at least one admin user.', 'info');
      return;
    }
    const idsToUpdate = Array.from(selectedAdminUserIds);
    let confirmed = false;
    let confirmMessage = '';
    let validStatusForApiCall: AdminUserStatus | undefined = undefined;

    if (action === 'status') {
      if (selectedBulkStatus === '') {
        showToast('Please select a status to apply.', 'info');
        return;
      }
      validStatusForApiCall = selectedBulkStatus;
      confirmMessage = `Are you sure you want to update status to "${validStatusForApiCall}" for ${idsToUpdate.length} admin user(s)?`;
    } else if (action === 'role') {
      if (!selectedBulkRole) { 
        showToast('Please select a role to apply.', 'info'); 
        return; 
      }
      const roleName = roles.find(r => r.id === selectedBulkRole)?.name || 'the selected role';
      confirmMessage = `Are you sure you want to update role to "${roleName}" for ${idsToUpdate.length} admin user(s)?`;
    }
    
    confirmed = window.confirm(confirmMessage);

    if (confirmed) {
        if (action === 'status') setIsBulkUpdatingStatus(true);
        else if (action === 'role') setIsBulkUpdatingRole(true);
      try {
        if (action === 'status') {
            if (!validStatusForApiCall) {
                showToast('Internal error: Status not validated for API call.', 'error');
                setIsBulkUpdatingStatus(false);
                return;
            }
            await bulkUpdateAdminUsersStatus(currentUser.studioId, idsToUpdate, validStatusForApiCall);
        } else if (action === 'role') {
            if (selectedBulkRole === '') { 
                showToast('Internal error: Role not validated for API call.', 'error');
                setIsBulkUpdatingRole(false);
                return;
            }
            await bulkUpdateAdminUsersRole(currentUser.studioId, idsToUpdate, selectedBulkRole);
        }
        showToast(`Successfully updated ${action} for ${idsToUpdate.length} admin user(s).`, 'success');
        fetchPageData(); 
        handleDeselectAll(); 
      } catch (err) {
        showToast(`Failed to update ${action}: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      } finally {
        if (action === 'status') setIsBulkUpdatingStatus(false);
        else if (action === 'role') setIsBulkUpdatingRole(false);
      }
    }
  };


  const columns: ColumnDefinition<AdminUser>[] = [
    { header: 'Username', accessor: 'username', headerClassName: 'w-1/6' },
    { header: 'Full Name', accessor: 'firstName', render: (user) => `${user.firstName} ${user.lastName}`, headerClassName: 'w-1/4' },
    { header: 'Email', accessor: 'email', headerClassName: 'w-1/4' },
    { header: 'Role', accessor: 'roleName', render: (user) => user.roleName || user.roleId, headerClassName: 'w-1/6' },
    { 
      header: 'Status', 
      accessor: 'status', 
      render: (user) => {
        let bgColor = 'bg-brand-neutral-100 text-brand-neutral-700';
        if (user.status === 'active') bgColor = 'bg-brand-success-light text-brand-success-dark';
        else if (user.status === 'inactive') bgColor = 'bg-brand-error-light text-brand-error-dark';
        else if (user.status === 'suspended') bgColor = 'bg-brand-warning-light text-brand-warning-dark';
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${bgColor}`}>{user.status}</span>;
      },
      headerClassName: 'w-1/12 text-center',
      cellClassName: 'text-center',
    },
  ];

  if (error && adminUsers.length === 0 && !isLoading) {
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
          <UserShieldIcon className="w-8 h-8 mr-3 text-brand-primary" />
          Admin User Accounts
        </h1>
        {canManage && (
            <NavLink to="/settings/admin-users/new">
                <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                    Add New Admin User
                </Button>
            </NavLink>
        )}
      </div>

      <Card 
        title="Filters & Search" 
        icon={<FilterIcon className="text-brand-primary w-5 h-5" />} 
        collapsible 
        defaultCollapsed={false}
        actions={ <Button variant="outline" size="sm" onClick={handleClearFilters}> Clear Filters </Button> }
      >
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-1">
            <Input
                id="search-admin-user"
                placeholder="Search by username, name, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                containerClassName="mb-0" label="Search"
            />
             <Select
                id="filter-role" label="Filter by Role"
                options={roleOptionsForFilter} value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)} containerClassName="mb-0"
            />
            <Select
                id="filter-status" label="Filter by Status"
                options={statusOptionsForFilter} value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as AdminUserStatus | '')} containerClassName="mb-0"
            />
        </div>
      </Card>

      {selectedAdminUserIds.size > 0 && canManage && (
        <Card title="Bulk Actions" icon={<UsersIcon className="text-brand-primary w-5 h-5" />} collapsible={false} className="border-brand-primary border">
          <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <p className="text-sm text-brand-text-secondary">{selectedAdminUserIds.size} admin user(s) selected</p>
                <Button variant="outline" size="sm" onClick={handleDeselectAll} disabled={isBulkUpdatingStatus || isBulkUpdatingRole}>Deselect All</Button>
            </div>
            <div className="p-3 border rounded-md bg-brand-neutral-50/50">
              <h4 className="text-md font-medium text-brand-text-primary mb-2">Change Status</h4>
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <Select id="bulk-update-status" label="New Status" options={[{value: '', label: 'Select status...'}, ...ADMIN_USER_STATUS_OPTIONS]} value={selectedBulkStatus}
                  onChange={(e) => setSelectedBulkStatus(e.target.value as AdminUserStatus | '')} containerClassName="mb-0 flex-grow" disabled={isBulkUpdatingStatus}/>
                <Button variant="primary" size="md" onClick={() => handleBulkUpdate('status')} isLoading={isBulkUpdatingStatus} disabled={isBulkUpdatingStatus || !selectedBulkStatus} className="w-full sm:w-auto">Apply Status</Button>
              </div>
            </div>
            <div className="p-3 border rounded-md bg-brand-neutral-50/50">
              <h4 className="text-md font-medium text-brand-text-primary mb-2">Change Role</h4>
              <div className="flex flex-col sm:flex-row items-end gap-2">
                <Select id="bulk-update-role" label="New Role" options={[{value: '', label: 'Select role...'}, ...roles.map(r => ({value: r.id, label: r.name}))]} value={selectedBulkRole}
                  onChange={(e) => setSelectedBulkRole(e.target.value)} containerClassName="mb-0 flex-grow" disabled={isBulkUpdatingRole}/>
                <Button variant="primary" size="md" onClick={() => handleBulkUpdate('role')} isLoading={isBulkUpdatingRole} disabled={isBulkUpdatingRole || !selectedBulkRole} className="w-full sm:w-auto">Apply Role</Button>
              </div>
            </div>
          </div>
        </Card>
      )}
      
      <Table<AdminUser>
        columns={columns}
        data={filteredAdminUsers}
        isLoading={isLoading} 
        emptyStateMessage={isLoading ? "Loading admin users..." : "No admin users found."}
        selectableRows={canManage}
        selectedRowIds={selectedAdminUserIds}
        onRowSelectionChange={handleRowSelectionChange}
        onSelectAllRows={handleSelectAllAdminUsers}
        renderRowActions={(user) => (
          canManage && (
            <div className="space-x-2 flex justify-end">
                <NavLink to={`/settings/admin-users/edit/${user.id}`}>
                <Button variant="outline" size="sm" aria-label={`Edit admin user ${user.username}`}><PencilIcon className="w-4 h-4" /></Button>
                </NavLink>
                <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(user)} aria-label={`Delete admin user ${user.username}`}><TrashIcon className="w-4 h-4" /></Button>
            </div>
          )
        )}
      />
       {adminUserToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => {
            setIsConfirmDeleteModalOpen(false);
            setAdminUserToDelete(null);
          }}
          onConfirm={executeDeleteAdminUser}
          title="Confirm Admin User Deletion"
          message={<>Are you sure you want to delete admin user <strong>{adminUserToDelete.username}</strong>? This action cannot be undone.</>}
          confirmationText="CONFIRMAR"
          confirmButtonText="Delete Admin User"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default AdminUserListPage;