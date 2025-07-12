

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { v4 as uuidv4 } from 'uuid';
import { CalendarSettings, SchoolTerm, StudioRoom, SchoolEvent } from '../../types';
import { TIMEZONE_OPTIONS, WEEK_START_DAY_OPTIONS } from '../../constants';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import ConfirmationModal from '../../components/modals/ConfirmationModal';
import { CalendarIcon as PageIcon, ChevronLeftIcon, PlusCircleIcon, PencilIcon, TrashIcon, PaletteIcon, CheckCircleIcon } from '../../components/icons';
import { getCalendarSettings, updateCalendarSettings, getSchoolEvents, createSchoolEvent, updateSchoolEvent, deleteSchoolEvent } from '../../services/apiService';
import { showToast } from '../../utils';
import { useAuth } from '../../contexts/AuthContext';

const initialSettings: Omit<CalendarSettings, 'holidays'> = {
  id: 'main_calendar_settings',
  defaultClassDuration: 60,
  studioTimezone: 'America/New_York',
  weekStartDay: 0, // Sunday
  terms: [],
  rooms: [],
};

type ModalType = 'term' | 'room' | 'holiday' | null;
interface ModalState {
  isOpen: boolean;
  type: ModalType;
  data?: SchoolTerm | StudioRoom | SchoolEvent | null; // Data for editing
}

const CalendarSettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Omit<CalendarSettings, 'holidays'>>(initialSettings);
  const [holidays, setHolidays] = useState<SchoolEvent[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingHolidays, setIsLoadingHolidays] = useState(true);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isItemSubmitting, setIsItemSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string | string[]>>({});
  
  const [modalState, setModalState] = useState<ModalState>({ isOpen: false, type: null, data: null });
  const [currentItemFormData, setCurrentItemFormData] = useState<Partial<SchoolTerm & StudioRoom & SchoolEvent>>({});
  const [itemToDelete, setItemToDelete] = useState<{ type: ModalType, item: any } | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const { hasPermission } = useAuth();
  const canManage = hasPermission('manage_calendar_settings');


  const fetchAllSettings = useCallback(async () => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const fetchedSettings = await getCalendarSettings();
      setSettings({ ...initialSettings, ...fetchedSettings });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch calendar settings.';
      setSubmitError(errorMsg);
      showToast(errorMsg, 'error');
      setSettings(initialSettings);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHolidays = useCallback(async () => {
    setIsLoadingHolidays(true);
    try {
      const holidayData = await getSchoolEvents();
      setHolidays(holidayData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()));
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to fetch events & holidays', 'error');
    } finally {
      setIsLoadingHolidays(false);
    }
  }, []);

  useEffect(() => {
    fetchAllSettings();
    fetchHolidays();
  }, [fetchAllSettings, fetchHolidays]);

  const handleGeneralSettingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: name === 'defaultClassDuration' || name === 'weekStartDay' ? parseInt(value) : value }));
    if (formErrors[name]) setFormErrors(prev => ({...prev, [name]: undefined }));
  };

  const openModal = (type: ModalType, data: SchoolTerm | StudioRoom | SchoolEvent | null = null) => {
    const initialFormData = data ? { ...data } : (type === 'holiday' ? { isHoliday: true } : {});
    setCurrentItemFormData(initialFormData);
    setModalState({ isOpen: true, type, data });
    setFormErrors({}); 
  };

  const closeModal = () => {
    if (isItemSubmitting) return;
    setModalState({ isOpen: false, type: null, data: null });
    setCurrentItemFormData({});
  };

  const handleItemFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setCurrentItemFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : (type === 'number' ? parseInt(value) : value) }));
     if (formErrors[name]) setFormErrors(prev => ({...prev, [name]: undefined }));
  };
  
  const validateItemForm = (): boolean => {
    const errors: Record<string, string> = {};
    const { type } = modalState;
    const data = currentItemFormData;

    if (!data.name?.trim()) errors.name = "Name is required.";

    if (type === 'term') {
        if (!data.startDate) errors.startDate = "Start date is required.";
        if (!data.endDate) errors.endDate = "End date is required.";
        if (data.startDate && data.endDate && data.startDate > data.endDate) {
            errors.endDate = "End date must be after start date.";
        }
    } else if (type === 'holiday') {
        if (!data.date) errors.date = "Date is required.";
    } else if (type === 'room') {
        if (data.capacity !== undefined && (isNaN(Number(data.capacity)) || Number(data.capacity) < 0)) {
            errors.capacity = "Capacity must be a non-negative number.";
        }
        if (data.color && !/^#([0-9A-Fa-f]{3}){1,2}$/.test(data.color)) {
            errors.color = "Invalid hex color format (e.g., #RRGGBB or #RGB).";
        }
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveItem = async () => {
    if (!validateItemForm()) {
        showToast("Please correct the errors in the item form.", "error");
        return;
    }
    const { type, data: originalData } = modalState;
    const updatedItem = { ...currentItemFormData };

    if (type === 'term' || type === 'room') {
        setSettings(prevSettings => {
            let newCollection;
            const collectionKey = type === 'term' ? 'terms' : 'rooms';

            if (originalData && (originalData as any).id) { // Editing existing item
                const idToUpdate = (originalData as any).id;
                newCollection = (prevSettings[collectionKey] as any[]).map(item => 
                    item.id === idToUpdate ? { ...item, ...updatedItem } : item
                );
            } else { // Adding new item
                const newItem = { ...updatedItem, id: `temp-${uuidv4()}` };
                newCollection = [...(prevSettings[collectionKey] as any[]), newItem];
            }
            return { ...prevSettings, [collectionKey]: newCollection };
        });
        closeModal();
        return;
    }

    if (type === 'holiday') {
        setIsItemSubmitting(true);
        try {
            const { id, createdAt, updatedAt, ...payload} = updatedItem as SchoolEvent;
            
            const apiPayload: Omit<SchoolEvent, 'id' | 'createdAt' | 'updatedAt'> = {
                name: payload.name!,
                date: payload.date!,
                isHoliday: payload.isHoliday || false,
                description: payload.description || undefined,
            };

            if (originalData && (originalData as any).id) {
                await updateSchoolEvent((originalData as any).id, apiPayload);
                showToast("Event/Holiday updated successfully.", "success");
            } else {
                await createSchoolEvent(apiPayload);
                showToast("Event/Holiday created successfully.", "success");
            }
            await fetchHolidays();
            closeModal();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to save event/holiday.', 'error');
        } finally {
            setIsItemSubmitting(false);
        }
    }
  };

  const requestDeleteItem = (type: ModalType, item: any) => {
    setItemToDelete({type, item});
    setIsConfirmDeleteModalOpen(true);
  };
  
  const executeDeleteItem = async () => {
    if(!itemToDelete) return;
    const {type, item} = itemToDelete;
    
    if (type === 'term' || type === 'room') {
        const collectionKey = type === 'term' ? 'terms' : 'rooms';
        setSettings(prevSettings => {
            const newCollection = (prevSettings[collectionKey] as any[]).filter(i => i.id !== item.id);
            return { ...prevSettings, [collectionKey]: newCollection };
        });
    } else if (type === 'holiday') {
        setIsItemSubmitting(true); // Can reuse this for delete operation loading state
        try {
            await deleteSchoolEvent(item.id);
            showToast(`Event "${item.name}" deleted successfully.`, "success");
            await fetchHolidays();
        } catch (err) {
            showToast(err instanceof Error ? err.message : 'Failed to delete event.', 'error');
        } finally {
            setIsItemSubmitting(false);
        }
    }
    
    setIsConfirmDeleteModalOpen(false);
    setItemToDelete(null);
  };

  const handleSaveAllSettings = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    if (settings.defaultClassDuration < 0) {
        showToast("Default class duration cannot be negative.", "error");
        setFormErrors(prev => ({...prev, defaultClassDuration: "Default class duration cannot be negative."}));
        setIsSubmitting(false);
        return;
    }
     setFormErrors(prev => ({...prev, defaultClassDuration: undefined}));

    const { id, updatedAt, ...payloadForApi } = settings;

    try {
      await updateCalendarSettings(payloadForApi);
      showToast('Calendar settings saved successfully!', 'success');
      await fetchAllSettings(); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save calendar settings.';
      setSubmitError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const termColumns: ColumnDefinition<SchoolTerm>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Start Date', accessor: 'startDate', render: (term) => new Date(term.startDate).toLocaleDateString() },
    { header: 'End Date', accessor: 'endDate', render: (term) => new Date(term.endDate).toLocaleDateString()  },
  ];
  const roomColumns: ColumnDefinition<StudioRoom>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Capacity', accessor: 'capacity', render: (room) => room.capacity || 'N/A', cellClassName: 'text-center' },
    { header: 'Description', accessor: 'description', render: (room) => room.description || '-' },
    { header: 'Color', accessor: 'color', render: (room) => room.color ? 
        <div className="flex items-center space-x-2"><span style={{backgroundColor: room.color}} className="inline-block w-4 h-4 rounded-full border border-gray-400"></span> <span>{room.color}</span></div> 
        : 'N/A',
    },
  ];
  const holidayColumns: ColumnDefinition<SchoolEvent>[] = [
    { header: 'Name', accessor: 'name' },
    { header: 'Date', accessor: 'date', render: (event) => new Date(event.date).toLocaleDateString() },
    { header: 'Description', accessor: 'description', render: (event) => event.description || '-' },
    { header: 'Type', accessor: 'isHoliday', render: (event) => (
        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${event.isHoliday ? 'bg-brand-pink-light text-brand-pink' : 'bg-brand-info-light text-brand-info'}`}>
            {event.isHoliday ? 'Holiday (Studio Closed)' : 'Event'}
        </span>
    )},
  ];

  if (isLoading) {
    return <div className="text-center p-10 text-brand-text-secondary">Loading calendar settings...</div>;
  }

  const renderItemModal = () => {
    if (!modalState.isOpen || !modalState.type) return null;
    const isEdit = !!modalState.data;
    const titleAction = isEdit ? 'Edit' : 'Add New';
    const itemTypeDisplay = modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1);

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay-animate">
        <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg modal-content-animate">
          <h3 className="text-xl font-semibold text-brand-text-primary mb-4">{`${titleAction} ${itemTypeDisplay}`}</h3>
          <div className="space-y-3">
            <Input label="Name" id="name" name="name" value={currentItemFormData.name || ''} onChange={handleItemFormChange} error={formErrors.name as string} required />
            {modalState.type === 'term' && (
              <>
                <Input label="Start Date" id="startDate" name="startDate" type="date" value={currentItemFormData.startDate || ''} onChange={handleItemFormChange} error={formErrors.startDate as string} required />
                <Input label="End Date" id="endDate" name="endDate" type="date" value={currentItemFormData.endDate || ''} onChange={handleItemFormChange} error={formErrors.endDate as string} required />
              </>
            )}
            {modalState.type === 'room' && (
              <>
                <Input label="Capacity (Optional)" id="capacity" name="capacity" type="number" value={String(currentItemFormData.capacity || '')} onChange={handleItemFormChange} error={formErrors.capacity as string} min="0" />
                <Input label="Description (Optional)" id="description" name="description" value={currentItemFormData.description || ''} onChange={handleItemFormChange} />
                <Input label="Color Code (Hex, e.g., #FF0000) (Optional)" id="color" name="color" type="color" value={currentItemFormData.color || '#FFFFFF'} onChange={handleItemFormChange} error={formErrors.color as string} 
                    className="p-0 h-10 w-full cursor-pointer" 
                />
              </>
            )}
            {modalState.type === 'holiday' && (
              <>
                <Input label="Date" id="date" name="date" type="date" value={currentItemFormData.date || ''} onChange={handleItemFormChange} error={formErrors.date as string} required />
                <Input label="Description (Optional)" id="description" name="description" value={currentItemFormData.description || ''} onChange={handleItemFormChange} />
                <label className="flex items-center space-x-2 text-sm text-brand-text-secondary cursor-pointer mt-2">
                    <input
                        type="checkbox"
                        name="isHoliday"
                        checked={(currentItemFormData as SchoolEvent).isHoliday || false}
                        onChange={handleItemFormChange}
                        className="form-checkbox h-4 w-4 text-brand-primary rounded"
                    />
                    <span>This is a Holiday (Studio Closed)</span>
                </label>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-3 mt-6">
            <Button variant="outline" onClick={closeModal} disabled={isItemSubmitting}>Cancel</Button>
            <Button variant="primary" onClick={handleSaveItem} isLoading={isItemSubmitting} disabled={isItemSubmitting}>{isEdit ? 'Save Changes' : `Add ${itemTypeDisplay}`}</Button>
          </div>
        </div>
      </div>
    );
  };

  const isFormDisabled = isSubmitting || !canManage;

  return (
    <div className="space-y-6">
      <NavLink to="/settings" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2 font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Settings Overview
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <PageIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Calendar & Scheduling Settings
      </h1>
      
      {submitError && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={(e) => e.preventDefault()} className="space-y-6">
        <Card title="School Terms" collapsible={false} actions={canManage && <Button variant="primary" size="sm" onClick={() => openModal('term')} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>Add Term</Button>}>
            {settings.terms.length > 0 ? (
                <Table<SchoolTerm>
                    columns={termColumns}
                    data={settings.terms}
                    renderRowActions={(term) => (
                        canManage && <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openModal('term', term)}><PencilIcon className="w-4 h-4"/></Button>
                            <Button variant="danger" size="sm" onClick={() => requestDeleteItem('term', term)}><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    )}
                />
            ) : <p className="text-brand-text-muted text-center py-3">No school terms defined yet.</p>}
        </Card>

        <Card title="Studio Rooms" collapsible={false} actions={canManage && <Button variant="primary" size="sm" onClick={() => openModal('room')} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>Add Room</Button>}>
            {settings.rooms.length > 0 ? (
                 <Table<StudioRoom>
                    columns={roomColumns}
                    data={settings.rooms}
                    renderRowActions={(room) => (
                        canManage && <div className="space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openModal('room', room)}><PencilIcon className="w-4 h-4"/></Button>
                            <Button variant="danger" size="sm" onClick={() => requestDeleteItem('room', room)}><TrashIcon className="w-4 h-4"/></Button>
                        </div>
                    )}
                />
            ) : <p className="text-brand-text-muted text-center py-3">No studio rooms defined yet.</p>}
        </Card>

        <Card title="Events & Holidays" collapsible={false} actions={canManage && <Button variant="primary" size="sm" onClick={() => openModal('holiday')} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>Add Event</Button>}>
           {isLoadingHolidays ? <p className="text-center py-3 text-brand-text-muted">Loading events...</p> : holidays.length > 0 ? (
             <Table<SchoolEvent>
                columns={holidayColumns}
                data={holidays}
                renderRowActions={(event) => (
                    canManage && <div className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openModal('holiday', event)}><PencilIcon className="w-4 h-4"/></Button>
                        <Button variant="danger" size="sm" onClick={() => requestDeleteItem('holiday', event)}><TrashIcon className="w-4 h-4"/></Button>
                    </div>
                )}
            />
           ) : <p className="text-brand-text-muted text-center py-3">No events or holidays defined yet.</p>}
        </Card>

        <Card title="General Scheduling Defaults" collapsible={false}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-4">
            <Input 
                label="Default Class Duration (minutes)" 
                id="defaultClassDuration" 
                name="defaultClassDuration" 
                type="number" 
                value={String(settings.defaultClassDuration)} 
                onChange={handleGeneralSettingChange} 
                min="0" 
                error={formErrors.defaultClassDuration as string}
                disabled={isFormDisabled}
            />
            <Select 
                label="Studio Timezone" 
                id="studioTimezone" 
                name="studioTimezone" 
                options={TIMEZONE_OPTIONS} 
                value={settings.studioTimezone} 
                onChange={handleGeneralSettingChange}
                error={formErrors.studioTimezone as string}
                disabled={isFormDisabled} 
            />
            <Select 
                label="Week Start Day" 
                id="weekStartDay" 
                name="weekStartDay" 
                options={WEEK_START_DAY_OPTIONS} 
                value={String(settings.weekStartDay)} 
                onChange={handleGeneralSettingChange} 
                error={formErrors.weekStartDay as string}
                disabled={isFormDisabled}
            />
          </div>
        </Card>
          
        {canManage && <div className="flex justify-end space-x-3 mt-6 py-4 border-t border-brand-neutral-200 sticky bottom-0 bg-brand-body-bg/80 backdrop-blur-sm z-10">
          <Button type="button" variant="outline" onClick={() => navigate('/settings')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSaveAllSettings} variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            Save General & Term/Room Settings
          </Button>
        </div>}
      </form>
      {renderItemModal()}
      {itemToDelete && (
        <ConfirmationModal
            isOpen={isConfirmDeleteModalOpen}
            onClose={() => { setIsConfirmDeleteModalOpen(false); setItemToDelete(null); }}
            onConfirm={executeDeleteItem}
            title={`Confirm Deletion`}
            message={<>Are you sure you want to delete the {itemToDelete.type} "<strong>{itemToDelete.item.name}</strong>"? This action cannot be undone.</>}
            confirmationText="DELETE"
            confirmButtonText="Delete"
            confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default CalendarSettingsPage;