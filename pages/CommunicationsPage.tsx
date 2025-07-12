import React, { useState, useEffect, useCallback } from 'react';
import Card from '../components/Card';
import Table, { ColumnDefinition } from '../components/Table';
import Button from '../components/forms/Button';
import Input from '../components/forms/Input';
import Select from '../components/forms/Select';
import { EnvelopeIcon, PencilIcon, TrashIcon, PlusCircleIcon, ExclamationTriangleIcon } from '../components/icons';
import { Announcement, AnnouncementFormData, AnnouncementCategory } from '../types';
import { getAnnouncements, createAnnouncement, updateAnnouncement, deleteAnnouncement } from '../services/apiService';
import { showToast } from '../utils';
import ConfirmationModal from '../components/modals/ConfirmationModal';

const initialFormData: AnnouncementFormData = {
  title: '',
  content: '',
  category: 'General',
  isImportant: false,
};

const categoryOptions: { value: AnnouncementCategory; label: string }[] = [
  { value: 'General', label: 'General' },
  { value: 'Eventos', label: 'Eventos' },
  { value: 'Horarios', label: 'Horarios' },
  { value: 'Urgente', label: 'Urgente' },
];

const CommunicationsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Partial<Announcement> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const [isConfirmDeleteModalOpen, setIsConfirmDeleteModalOpen] = useState(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAnnouncements();
      setAnnouncements(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load announcements.";
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);
  
  const openModal = (announcement: Partial<Announcement> | null = null) => {
    setCurrentAnnouncement(announcement ? { ...announcement } : { ...initialFormData });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setCurrentAnnouncement(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const isCheckbox = type === 'checkbox';
    const checked = (e.target as HTMLInputElement).checked;

    setCurrentAnnouncement(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [name]: isCheckbox ? checked : value,
        };
    });
  };

  const handleSave = async () => {
    if (!currentAnnouncement || !currentAnnouncement.title?.trim() || !currentAnnouncement.content?.trim()) {
        showToast('Title and content are required.', 'error');
        return;
    }

    setIsSubmitting(true);
    const formData: AnnouncementFormData = {
        title: currentAnnouncement.title,
        content: currentAnnouncement.content,
        category: currentAnnouncement.category || 'General',
        isImportant: currentAnnouncement.isImportant || false,
    };
    
    try {
        if (currentAnnouncement.id) {
            await updateAnnouncement(currentAnnouncement.id, formData);
            showToast('Announcement updated successfully!', 'success');
        } else {
            await createAnnouncement(formData);
            showToast('Announcement created successfully!', 'success');
        }
        fetchAnnouncements();
        closeModal();
    } catch (err) {
        showToast(`Failed to save announcement: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const requestDelete = (announcement: Announcement) => {
    setAnnouncementToDelete(announcement);
    setIsConfirmDeleteModalOpen(true);
  };
  
  const executeDelete = async () => {
    if (!announcementToDelete) return;
    try {
      await deleteAnnouncement(announcementToDelete.id);
      showToast('Announcement deleted successfully.', 'success');
      fetchAnnouncements();
    } catch (err) {
      showToast(`Failed to delete announcement: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsConfirmDeleteModalOpen(false);
      setAnnouncementToDelete(null);
    }
  };

  const columns: ColumnDefinition<Announcement>[] = [
    { 
      header: '', 
      accessor: 'isImportant', 
      render: (item) => item.isImportant ? <ExclamationTriangleIcon className="w-5 h-5 text-brand-warning" title="Important"/> : null,
      cellClassName: 'text-center w-8'
    },
    { header: 'Date', accessor: 'date', render: (item) => new Date(item.date).toLocaleDateString() },
    { header: 'Title', accessor: 'title', cellClassName: 'font-medium' },
    { header: 'Category', accessor: 'category', render: (item) => (
        <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-brand-accent-light text-brand-accent-dark">
            {item.category}
        </span>
    )},
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-text-primary flex items-center">
        <EnvelopeIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Communications Center
      </h1>
      <p className="text-brand-text-secondary max-w-2xl">
        Manage and view all internal announcements for students, parents, and staff.
      </p>

      <Card
        title="All Announcements"
        icon={<EnvelopeIcon className="text-brand-primary w-5 h-5" />}
        collapsible={false}
        actions={
          <Button variant="primary" onClick={() => openModal()} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>
            Create Announcement
          </Button>
        }
      >
        {error ? (
          <div className="text-center py-10 text-brand-error">
            <p>Error: {error}</p>
            <Button onClick={fetchAnnouncements} className="mt-4" variant="primary">Try Again</Button>
          </div>
        ) : (
          <Table<Announcement>
            columns={columns}
            data={announcements}
            isLoading={isLoading}
            emptyStateMessage="No announcements found. Create one to get started."
            renderRowActions={(item) => (
              <div className="space-x-2">
                <Button variant="outline" size="sm" onClick={() => openModal(item)} leftIcon={<PencilIcon className="w-3 h-3"/>}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => requestDelete(item)} leftIcon={<TrashIcon className="w-3 h-3"/>}>Delete</Button>
              </div>
            )}
          />
        )}
      </Card>

      {isModalOpen && currentAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay-animate">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl modal-content-animate">
            <h3 className="text-xl font-semibold text-brand-text-primary mb-4">
              {currentAnnouncement.id ? 'Edit Announcement' : 'Create New Announcement'}
            </h3>
            <div className="space-y-4">
              <Input
                label="Title / Subject"
                id="title"
                name="title"
                value={currentAnnouncement.title || ''}
                onChange={handleFormChange}
                required
                disabled={isSubmitting}
              />
              <Input
                label="Content"
                id="content"
                name="content"
                type="textarea"
                rows={10}
                value={currentAnnouncement.content || ''}
                onChange={handleFormChange}
                required
                disabled={isSubmitting}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <Select
                  label="Category"
                  id="category"
                  name="category"
                  options={categoryOptions}
                  value={currentAnnouncement.category || 'General'}
                  onChange={handleFormChange}
                  disabled={isSubmitting}
                  containerClassName="mb-0"
                />
                <label className="flex items-center space-x-2 pt-5">
                  <input
                    type="checkbox"
                    name="isImportant"
                    checked={currentAnnouncement.isImportant || false}
                    onChange={handleFormChange}
                    className="form-checkbox h-5 w-5 text-brand-primary rounded border-brand-neutral-400 focus:ring-brand-primary-light"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm font-medium text-brand-text-secondary">Mark as Important</span>
                </label>
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={closeModal} disabled={isSubmitting}>Cancel</Button>
              <Button variant="primary" onClick={handleSave} isLoading={isSubmitting} disabled={isSubmitting}>
                {currentAnnouncement.id ? 'Save Changes' : 'Create Announcement'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {announcementToDelete && (
        <ConfirmationModal
          isOpen={isConfirmDeleteModalOpen}
          onClose={() => setIsConfirmDeleteModalOpen(false)}
          onConfirm={executeDelete}
          title="Confirm Delete Announcement"
          message={<>Are you sure you want to delete the announcement "<strong>{announcementToDelete.title}</strong>"? This action cannot be undone.</>}
          confirmationText="DELETE"
          confirmButtonText="Delete"
          confirmButtonVariant="danger"
        />
      )}
    </div>
  );
};

export default CommunicationsPage;