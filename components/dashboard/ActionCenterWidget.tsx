import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../Card';
import { CalendarIcon } from '../icons';
import { getClassOfferings } from '../../services/apiService';
import { showToast, formatTimeRange } from '../../utils';

export const ActionCenterWidget: React.FC = () => {
  const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const offeringsData = await getClassOfferings();
        
        const todayDayOfWeek = new Date().getDay();
        const classesForToday = offeringsData
            .flatMap(offering => 
                offering.scheduledClassSlots
                    .filter(slot => slot.dayOfWeek === todayDayOfWeek && slot.startTime)
                    .map(slot => ({
                        id: `${offering.id}-${slot.id || slot.dayOfWeek}`,
                        name: offering.name,
                        time: formatTimeRange(slot.startTime, slot.endTime),
                        startTimeValue: slot.startTime, // For sorting
                        instructor: offering.instructorName,
                        occupancy: `${offering.enrolledCount}/${offering.capacity}`,
                        classOfferingId: offering.id
                    }))
            )
            .sort((a,b) => a.startTimeValue.localeCompare(b.startTimeValue));
        
        setTodaysClasses(classesForToday);

      } catch (err) {
        showToast("Failed to load action center data.", "error");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);
  
  const renderContent = () => {
    if (isLoading) {
        return <div className="text-center p-8 text-brand-text-secondary">Loading...</div>;
    }

    return todaysClasses.length > 0 ? (
        <ul className="space-y-2 max-h-[20rem] overflow-y-auto">
            {todaysClasses.map(cls => (
                <li key={cls.id}>
                    <NavLink to={`/enrollments/class/${cls.classOfferingId}`} className="block p-3 bg-brand-neutral-50 rounded-md hover:bg-brand-primary-light/20 transition-colors group">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-semibold text-brand-text-primary group-hover:text-brand-primary-dark">{cls.name}</p>
                                <p className="text-xs text-brand-text-secondary">{cls.time} - {cls.instructor}</p>
                            </div>
                            <span className="text-xs font-medium bg-brand-accent-light text-brand-accent-dark px-2 py-1 rounded-full">{cls.occupancy}</span>
                        </div>
                    </NavLink>
                </li>
            ))}
        </ul>
     ) : <p className="text-center p-8 text-brand-text-muted">No classes scheduled for today.</p>;
  };

  return (
    <Card title="Today's Schedule" icon={<CalendarIcon className="w-5 h-5 text-brand-primary" />} collapsible={true} defaultCollapsed={false}>
        {renderContent()}
    </Card>
  );
};
