import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { Announcement } from '../../types';
import { PlusCircleIcon, EnvelopeIcon, GridIcon, ChevronUpIcon, ChevronDownIcon } from '../icons';
import { getAnnouncements } from '../../services/apiService';
import { showToast } from '../../utils';

const EmptyState: React.FC<{onAddClick?: () => void}> = ({onAddClick}) => (
  <div className="text-center py-12">
    <img src="https://picsum.photos/seed/announceempty/120/120" alt="No announcements" className="mx-auto mb-4 rounded-full opacity-75" />
    <p className="text-brand-text-primary font-semibold text-lg">No Announcements Added</p>
    {onAddClick && (
        <button 
            onClick={onAddClick}
            className="mt-4 bg-brand-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-brand-primary-dark flex items-center space-x-1 mx-auto"
        >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Add</span>
        </button>
    )}
  </div>
);


export const AnnouncementsWidget: React.FC = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getAnnouncements();
        setAnnouncements(data);
      } catch (err) {
        const msg = "Failed to fetch announcements.";
        setError(msg);
        showToast(msg, 'error');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnnouncements();
  }, []);

  const handleAddAnnouncement = () => {
      // Placeholder for navigating to add announcement page or opening a modal
      showToast("Navigate to 'Add Announcement' page/modal.", "info");
  };

  return (
    <div className="bg-white rounded-lg shadow-md">
    <div className="flex items-center justify-between p-4 border-b border-brand-neutral-200">
      <div className="flex items-center space-x-2">
        <GridIcon className="text-brand-primary w-5 h-5" />
        <h3 className="text-lg font-semibold text-brand-text-primary">Internal Announcements</h3>
      </div>
      <div className="flex items-center space-x-2">
          <button 
            onClick={handleAddAnnouncement}
            className="bg-brand-primary text-white px-3 py-1.5 rounded-md text-xs font-medium hover:bg-brand-primary-dark flex items-center space-x-1"
          >
            <PlusCircleIcon className="w-4 h-4" />
            <span>Add</span>
          </button>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-brand-text-muted hover:text-brand-primary p-1 rounded-full"
            aria-label={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronDownIcon className="w-5 h-5" /> : <ChevronUpIcon className="w-5 h-5" />}
          </button>
        </div>
    </div>
    {!isCollapsed && (
        <div className="p-4 min-h-[200px] flex flex-col justify-center">
        {isLoading && <div className="text-center py-4">Loading announcements...</div>}
        {error && <div className="text-center py-4 text-brand-error">{error}</div>}
        {!isLoading && !error && (
            announcements.length === 0 ? (
                <EmptyState onAddClick={handleAddAnnouncement}/>
            ) : (
                <ul className="space-y-3">
                {announcements.map(ann => (
                    <li key={ann.id} className="p-3 bg-brand-accent-light rounded-md shadow-sm">
                    <h5 className="font-semibold text-brand-primary-dark">{ann.title}</h5>
                    <p className="text-sm text-brand-text-secondary mt-1">{ann.content}</p>
                    <p className="text-xs text-brand-text-muted mt-2">
                        Posted on: {new Date(ann.date).toLocaleDateString()} - Category: {ann.category}
                    </p>
                    </li>
                ))}
                </ul>
            )
        )}
        </div>
    )}
    </div>
  );
};