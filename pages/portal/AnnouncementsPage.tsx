import React, { useState, useEffect, useCallback } from 'react';
import Card from '../../components/Card';
import { EnvelopeIcon, ExclamationTriangleIcon } from '../../components/icons';
import { Announcement } from '../../types';
import { getAnnouncements } from '../../services/apiService';
import { showToast } from '../../utils';

const PortalAnnouncementsPage: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <EnvelopeIcon className="w-8 h-8 mr-3 text-brand-primary" />
        Studio Announcements
      </h1>
      
      {isLoading && <p className="text-center p-8">Loading announcements...</p>}
      {error && <p className="text-center p-8 text-brand-error">Error: {error}</p>}

      {!isLoading && !error && (
        announcements.length > 0 ? (
            <div className="space-y-4">
                {announcements.map(ann => (
                    <Card 
                        key={ann.id} 
                        title={ann.title} 
                        icon={ann.isImportant ? <ExclamationTriangleIcon className="text-brand-warning"/> : <EnvelopeIcon/>}
                        collapsible={false}
                    >
                        <p className="text-brand-text-secondary">{ann.content}</p>
                        <div className="text-xs text-brand-text-muted mt-3 pt-2 border-t border-brand-neutral-100 flex justify-between">
                            <span>Category: <strong>{ann.category}</strong></span>
                            <span>Posted: {new Date(ann.date).toLocaleDateString()}</span>
                        </div>
                    </Card>
                ))}
            </div>
        ) : (
            <div className="text-center py-10 text-brand-text-muted">
                 <EnvelopeIcon className="w-12 h-12 mx-auto mb-2"/>
                 <p>There are no announcements at this time.</p>
            </div>
        )
      )}
    </div>
  );
};

export default PortalAnnouncementsPage;
