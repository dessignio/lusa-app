import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Button from '../../components/forms/Button';
import { CalendarIcon, CalendarStarIcon } from '../../components/icons';
import { ClassOffering, ScheduleItem, SchoolEvent } from '../../types';
import { getClassOfferings, getSchoolEvents } from '../../services/apiService';
import { DAYS_OF_WEEK } from '../../constants';
import { formatTime, formatTimeRange, showToast } from '../../utils';
import { useClientAuth } from '../../contexts/ClientAuthContext';

const TIME_INTERVAL_MINUTES = 30;
const CALENDAR_START_HOUR = 8; // 8 AM
const CALENDAR_END_HOUR = 21; // 9 PM

const generateTimeSlots = (startHour: number, endHour: number, intervalMinutes: number): string[] => {
  const slots: string[] = [];
  for (let hour = startHour; hour < endHour; hour++) {
    for (let minute = 0; minute < 60; minute += intervalMinutes) {
      const h = hour.toString().padStart(2, '0');
      const m = minute.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
};

const isClassActiveInSlot = (classStart: string, classEnd: string, slotStart: string, slotInterval: number): boolean => {
    const timeToMinutes = (time: string) => {
        const [h, m] = time.split(':').map(Number);
        return h * 60 + m;
    };

    const classStartTime = timeToMinutes(classStart);
    const classEndTime = timeToMinutes(classEnd);
    const slotStartTime = timeToMinutes(slotStart);
    const slotEndTime = slotStartTime + slotInterval;
    
    return classStartTime < slotEndTime && classEndTime > slotStartTime;
};

interface MonthlyCalendarDay {
  date: Date;
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  classes: { id: string; name: string; time: string; colorClass: string; classOfferingId: string; }[];
  events: { id: string; name: string; isHoliday: boolean; }[];
}

const getVisualCueClass = (offering: ClassOffering): string => {
    const primaryProgram = (offering.targetPrograms && offering.targetPrograms.length > 0) ? offering.targetPrograms[0] : null;

    if (primaryProgram) {
        switch (primaryProgram) {
            case 'Ballet Fit & Flow': return 'bg-pink-100 border-pink-500 text-pink-800 hover:bg-pink-200';
            case 'Emerging Artists': return 'bg-purple-100 border-purple-500 text-purple-800 hover:bg-purple-200';
            case 'Little Luminaires': return 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200';
            case 'Shining Steps': return 'bg-cyan-100 border-cyan-500 text-cyan-800 hover:bg-cyan-200';
            case 'Stage Talents': return 'bg-red-100 border-red-500 text-red-800 hover:bg-red-200';
            case 'Young Pros': return 'bg-indigo-100 border-indigo-500 text-indigo-800 hover:bg-indigo-200';
            default:
                let hash = 0;
                for (let i = 0; i < primaryProgram.length; i++) { hash = primaryProgram.charCodeAt(i) + ((hash << 5) - hash); }
                const pColors = ['bg-sky-100 border-sky-500 text-sky-800 hover:bg-sky-200', 'bg-lime-100 border-lime-500 text-lime-800 hover:bg-lime-200'];
                return pColors[Math.abs(hash) % pColors.length];
        }
    }
    return 'bg-slate-100 border-slate-400 text-slate-700 hover:bg-slate-200';
};

const PortalSchedulePage: React.FC = () => {
  const { selectedStudent } = useClientAuth();
  const [allClassOfferings, setAllClassOfferings] = useState<ClassOffering[]>([]);
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());

  const timeSlots = useMemo(() => generateTimeSlots(CALENDAR_START_HOUR, CALENDAR_END_HOUR, TIME_INTERVAL_MINUTES), []);

  const fetchScheduleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [offeringsData, eventsData] = await Promise.all([getClassOfferings(), getSchoolEvents()]);
      setAllClassOfferings(offeringsData);
      setSchoolEvents(eventsData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch schedule data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const enrolledOfferings = useMemo(() => {
    if (!selectedStudent) return [];
    return allClassOfferings.filter(o => selectedStudent.enrolledClasses.includes(o.id));
  }, [allClassOfferings, selectedStudent]);

  const monthlyCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysArray: MonthlyCalendarDay[] = [];
    
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
        const prevMonthDay = new Date(year, month, 0 - (firstDayOfMonth.getDay() - 1 - i));
        daysArray.push({ date: prevMonthDay, dayOfMonth: prevMonthDay.getDate(), isCurrentMonth: false, isToday: false, classes: [], events: [] });
    }

    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
        const date = new Date(year, month, day);
        const dateStringForComparison = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        
        const eventsOnThisDay = schoolEvents.filter(event => event.date === dateStringForComparison).map(event => ({ id: event.id, name: event.name, isHoliday: event.isHoliday }));
        const classesOnThisDay: MonthlyCalendarDay['classes'] = [];
        
        enrolledOfferings.forEach(offering => {
            offering.scheduledClassSlots.forEach(slot => {
                if (slot.dayOfWeek === date.getDay() && slot.startTime) {
                    classesOnThisDay.push({
                        id: `${offering.id}-${slot.id || slot.dayOfWeek}-${day}`, name: offering.name,
                        time: formatTime(slot.startTime), colorClass: getVisualCueClass(offering), classOfferingId: offering.id,
                    });
                }
            });
        });
        classesOnThisDay.sort((a,b) => a.time.localeCompare(b.time));
        daysArray.push({ date, dayOfMonth: day, isCurrentMonth: true, isToday: date.toDateString() === new Date().toDateString(), classes: classesOnThisDay, events: eventsOnThisDay });
    }
    
    const totalCells = daysArray.length % 7 === 0 ? daysArray.length : daysArray.length + (7 - (daysArray.length % 7));
    let nextMonthDayCounter = 1;
    while(daysArray.length < totalCells) {
        const nextMonthDay = new Date(year, month + 1, nextMonthDayCounter++);
        daysArray.push({ date: nextMonthDay, dayOfMonth: nextMonthDay.getDate(), isCurrentMonth: false, isToday: false, classes: [], events: [] });
    }
    return daysArray;
  }, [enrolledOfferings, currentDate, schoolEvents]);
  
  const weeklySchedule = useMemo(() => {
    const scheduleData: Record<number, Record<string, ScheduleItem[]>> = {};
    DAYS_OF_WEEK.forEach(day => {
      scheduleData[day.value] = {};
      timeSlots.forEach(slotTime => { scheduleData[day.value][slotTime] = []; });
    });

    enrolledOfferings.forEach(offering => {
      offering.scheduledClassSlots.forEach((slot, index) => { 
        if (!slot.startTime || !slot.endTime || slot.dayOfWeek === undefined) return;
        timeSlots.forEach(ts => {
          if (isClassActiveInSlot(slot.startTime, slot.endTime, ts, TIME_INTERVAL_MINUTES)) {
            scheduleData[slot.dayOfWeek][ts].push({
              id: `${offering.id}_${slot.id || index}`, name: offering.name,
              time: formatTimeRange(slot.startTime, slot.endTime), professor: offering.instructorName,
              room: slot.room, type: offering.category, classOfferingId: offering.id,
              slotId: String(slot.id || index), colorClass: getVisualCueClass(offering),
            });
          }
        });
      });
    });
    return scheduleData;
  }, [enrolledOfferings, timeSlots]);

  const handleMonthChange = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + offset);
      return newDate;
    });
  };

  if (isLoading) return <div className="text-center py-10">Loading schedule...</div>;
  if (error) return <div className="text-center py-10 text-brand-error">Error: {error}</div>;
  if (!selectedStudent) return <div className="text-center py-10">Please select a student profile.</div>;
  
  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">My Schedule</h1>
      <Card title="Monthly Schedule" icon={<CalendarIcon className="w-5 h-5 text-brand-primary"/>}>
        <div className="flex justify-between items-center mb-4">
          <Button onClick={() => handleMonthChange(-1)} size="sm" variant="outline">&larr; Previous</Button>
          <h3 className="text-lg font-semibold">{currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}</h3>
          <Button onClick={() => handleMonthChange(1)} size="sm" variant="outline">Next &rarr;</Button>
        </div>
        <div className="grid grid-cols-7 gap-px border border-brand-neutral-200 bg-brand-neutral-200">
          {DAYS_OF_WEEK.map(day => <div key={day.value} className="bg-brand-neutral-100 p-2 text-center text-xs font-medium text-brand-text-secondary">{day.label.substring(0,3)}</div>)}
          {monthlyCalendarDays.map((day, index) => (
            <div key={index} className={`p-1.5 min-h-[100px] ${day.isCurrentMonth ? 'bg-white' : 'bg-brand-neutral-50/70'} ${day.isToday ? 'ring-2 ring-brand-primary ring-inset' : ''}`}>
              <div className={`text-xs text-right pr-1 ${day.isToday ? 'font-bold text-brand-primary' : day.isCurrentMonth ? 'text-brand-text-primary' : 'text-brand-neutral-400'}`}>{day.dayOfMonth}</div>
              <div className="space-y-1 mt-0.5 max-h-[100px] overflow-y-auto">
                {day.events.map(event => <div key={event.id} title={event.name} className={`block text-[0.65rem] leading-tight p-1 rounded-sm truncate ${event.isHoliday ? 'bg-brand-pink-light text-brand-pink' : 'bg-brand-info-light text-brand-info'}`}><CalendarStarIcon className="w-3 h-3 inline-block mr-1"/>{event.name}</div>)}
                {day.classes.map(cls => <div key={cls.id} className={`block text-[0.65rem] leading-tight p-1 rounded-sm truncate ${cls.colorClass}`} title={`${cls.name} at ${cls.time}`}><span className="font-semibold">{cls.name}</span> ({cls.time})</div>)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card title="Weekly Schedule" icon={<CalendarIcon className="w-5 h-5 text-brand-primary"/>}>
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse border border-brand-neutral-200">
            <thead>
              <tr className="bg-brand-neutral-50">
                <th className="p-2 border border-brand-neutral-200 text-xs text-left w-24 sticky left-0 bg-brand-neutral-50 z-10">Time</th>
                {DAYS_OF_WEEK.map(day => <th key={day.value} className="p-2 border border-brand-neutral-200 text-xs text-center">{day.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map(slotTime => (
                <tr key={slotTime}>
                  <td className="p-1.5 border border-brand-neutral-200 text-xs text-center h-20 w-24 bg-brand-neutral-50/80 sticky left-0 z-10">{formatTime(slotTime)}</td>
                  {DAYS_OF_WEEK.map(day => (
                    <td key={`${day.value}-${slotTime}`} className="p-0.5 border border-brand-neutral-200 align-top h-20 relative">
                      {(weeklySchedule[day.value]?.[slotTime] || []).map(item => (
                        <div key={item.id} className={`block p-1.5 mb-0.5 rounded text-[0.7rem] leading-tight shadow-sm ${item.colorClass}`} title={`${item.name}\n${item.time}\nRoom: ${item.room}\nInstructor: ${item.professor}`}>
                          <div className="font-semibold truncate">{item.name}</div>
                          <div className="truncate text-xs">{item.room}</div>
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
export default PortalSchedulePage;
