

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Table, { ColumnDefinition } from '../../components/Table';
import { MembershipPlanDefinition } from '../../types'; 
import Button from '../../components/forms/Button';
import { UserPlusIcon, PencilIcon, TrashIcon, IdCardIcon } from '../../components/icons';
import Card from '../../components/Card';
import ConfirmationModal from '../../components/modals/ConfirmationModal'; // New import
import { getMembershipPlans, deleteMembershipPlan } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const MembershipPlanListPage: React.FC = () => {
  const [plans, setPlans] = useState<MembershipPlanDefinition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<MembershipPlanDefinition | null>(null);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_membership_plans');

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getMembershipPlans();
      setPlans(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch membership plans.';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  const handleDeleteRequest = (plan: MembershipPlanDefinition) => {
    setPlanToDelete(plan);
    setIsConfirmModalOpen(true);
  };

  const executeDelete = async () => {
    if (!planToDelete) return;

    try {
      await deleteMembershipPlan(planToDelete.id);
      showToast(`Membership plan "${planToDelete.name}" deleted successfully.`, 'success');
      fetchPlans(); 
    } catch (err) {
      const errorMsg = `Failed to delete plan "${planToDelete.name}": ${err instanceof Error ? err.message : 'Unknown error'}`;
      showToast(errorMsg, 'error');
    } finally {
      setIsConfirmModalOpen(false);
      setPlanToDelete(null);
    }
  };

  const columns: ColumnDefinition<MembershipPlanDefinition>[] = [
    {
      header: 'Plan Name',
      accessor: 'name',
      headerClassName: 'w-1/3',
    },
    {
      header: 'Classes per Week',
      accessor: 'classesPerWeek',
      render: (plan) => plan.classesPerWeek,
      headerClassName: 'w-1/3 text-center',
      cellClassName: 'text-center',
    },
    {
      header: 'Monthly Price',
      accessor: 'monthlyPrice',
      render: (plan) => `$${Number(plan.monthlyPrice).toFixed(2)}`, 
      headerClassName: 'w-1/3 text-right',
      cellClassName: 'text-right',
    },
  ];

  if (error && plans.length === 0 && !isLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-brand-error">Error: {error}</h2>
        <Button onClick={fetchPlans} variant="primary" className="mt-4">Try Again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0 flex items-center">
          <IdCardIcon className="w-8 h-8 mr-3 text-brand-primary" />
          Manage Membership Plans
        </h1>
        {canManage && (
            <NavLink to="/settings/membership-plans/new">
            <Button variant="primary" leftIcon={<UserPlusIcon className="w-4 h-4" />}>
                Add New Plan
            </Button>
            </NavLink>
        )}
      </div>
      
      <Card title="Available Membership Plans" icon={<IdCardIcon className="text-brand-primary w-5 h-5"/>} collapsible={false}>
        <Table<MembershipPlanDefinition>
          columns={columns}
          data={plans}
          isLoading={isLoading}
          emptyStateMessage={isLoading ? "Loading plans..." : "No membership plans configured. Add a new plan to get started."}
          renderRowActions={(plan) => (
            canManage && (
                <div className="space-x-2 flex justify-end">
                <NavLink to={`/settings/membership-plans/edit/${plan.id}`}>
                    <Button variant="outline" size="sm" aria-label={`Edit ${plan.name}`}>
                    <PencilIcon className="w-4 h-4" />
                    </Button>
                </NavLink>
                <Button variant="danger" size="sm" onClick={() => handleDeleteRequest(plan)} aria-label={`Delete ${plan.name}`}>
                    <TrashIcon className="w-4 h-4" />
                </Button>
                </div>
            )
          )}
        />
      </Card>

      {planToDelete && (
        <ConfirmationModal
          isOpen={isConfirmModalOpen}
          onClose={() => {
            setIsConfirmModalOpen(false);
            setPlanToDelete(null);
          }}
          onConfirm={executeDelete}
          title="Confirm Deletion"
          message={
            <>
              Are you sure you want to delete the membership plan: <strong>{planToDelete.name}</strong>?
              This action cannot be undone and might affect existing student memberships.
            </>
          }
          confirmationText="CONFIRMAR"
          confirmButtonText="Delete Plan"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default MembershipPlanListPage;