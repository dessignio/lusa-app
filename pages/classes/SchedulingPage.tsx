

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from 'react-router-dom'; // This import is fine for v5
import Card from '../../components/Card';
import Select from '../../components/forms/Select';
import Button from '../../components/forms/Button';
import { CalendarIcon, FilterIcon, CalendarStarIcon } from '../../components/icons';
import { ClassOffering, Instructor, ScheduleItem, ScheduledClassSlot, Program, ProgramName, DancerLevelName, SchoolEvent } from '../../types';
import { getClassOfferings, getInstructors, getPrograms, getSchoolEvents } from '../../services/apiService';
import { DAYS_OF_WEEK } from '../../constants';
import { formatTime, formatTimeRange, showToast } from '../../utils';

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

interface TodaysClassDisplayItem {
  id: string;
  name: string;
  time: string;
  instructor: string;
  room: string;
  startTimeValue: string; // For sorting
  colorClass: string;
  classOfferingId: string;
}

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
            // Updated program names and colors based on user feedback
            case 'Ballet Fit & Flow': return 'bg-pink-100 border-pink-500 text-pink-800 hover:bg-pink-200';
            case 'Emerging Artists': return 'bg-purple-100 border-purple-500 text-purple-800 hover:bg-purple-200';
            case 'Little Luminaires': return 'bg-yellow-100 border-yellow-500 text-yellow-800 hover:bg-yellow-200';
            case 'Shining Steps': return 'bg-cyan-100 border-cyan-500 text-cyan-800 hover:bg-cyan-200';
            case 'Stage Talents': return 'bg-red-100 border-red-500 text-red-800 hover:bg-red-200';
            case 'Young Pros': return 'bg-indigo-100 border-indigo-500 text-indigo-800 hover:bg-indigo-200';
            
            // Fallback for any other program name, using a hash to get a color
            default:
                let hash = 0;
                for (let i = 0; i < primaryProgram.length; i++) {
                    hash = primaryProgram.charCodeAt(i) + ((hash << 5) - hash);
                }
                const pColors = [
                    'bg-sky-100 border-sky-500 text-sky-800 hover:bg-sky-200',
                    'bg-lime-100 border-lime-500 text-lime-800 hover:bg-lime-200',
                    'bg-teal-100 border-teal-500 text-teal-800 hover:bg-teal-200',
                    'bg-fuchsia-100 border-fuchsia-500 text-fuchsia-800 hover:bg-fuchsia-200',
                    'bg-rose-100 border-rose-500 text-rose-800 hover:bg-rose-200',
                    'bg-amber-100 border-amber-500 text-amber-800 hover:bg-amber-200'
                ];
                return pColors[Math.abs(hash) % pColors.length];
        }
    } else if (offering.category) {
        // Fallback to category if no program is targeted
         switch (offering.category) {
            case 'Ballet': return 'bg-pink-100 border-pink-400 text-pink-800 hover:bg-pink-200';
            case 'Jazz': return 'bg-yellow-100 border-yellow-400 text-yellow-800 hover:bg-yellow-200';
            case 'Hip Hop': return 'bg-orange-100 border-orange-400 text-orange-800 hover:bg-orange-200';
            case 'Contemporary': return 'bg-sky-100 border-sky-400 text-sky-800 hover:bg-sky-200';
            case 'Tap': return 'bg-gray-200 border-gray-400 text-gray-800 hover:bg-gray-300';
            default: return 'bg-slate-100 border-slate-400 text-slate-800 hover:bg-slate-200';
        }
    }
    
    // Default color if no program or category
    return 'bg-slate-100 border-slate-400 text-slate-700 hover:bg-slate-200';
};



const SchedulingPage: React.FC = () => {
  const [classOfferings, setClassOfferings] = useState<ClassOffering[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [schoolEvents, setSchoolEvents] = useState<SchoolEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedInstructor, setSelectedInstructor] = useState<string>('');
  const [selectedRoom, setSelectedRoom] = useState<string>('');
  const [selectedProgram, setSelectedProgram] = useState<ProgramName | ''>('');
  const [selectedLevel, setSelectedLevel] = useState<DancerLevelName | ''>('');
  
  const [currentDate, setCurrentDate] = useState(new Date());

  const timeSlots = useMemo(() => generateTimeSlots(CALENDAR_START_HOUR, CALENDAR_END_HOUR, TIME_INTERVAL_MINUTES), []);

  const fetchScheduleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [offeringsData, instructorsData, programsData, eventsData] = await Promise.all([
        getClassOfferings(),
        getInstructors(),
        getPrograms(),
        getSchoolEvents(),
      ]);
      setClassOfferings(offeringsData);
      setInstructors(instructorsData);
      setPrograms(programsData);
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

  const uniqueRooms = useMemo(() => {
    const rooms = new Set<string>();
    classOfferings.forEach(offering => {
      offering.scheduledClassSlots.forEach(slot => {
        if (slot.room) rooms.add(slot.room);
      });
    });
    return [{ value: '', label: 'All Rooms' }, ...Array.from(rooms).sort().map(r => ({ value: r, label: r }))];
  }, [classOfferings]);

  const instructorOptions = useMemo(() => {
    return [
      { value: '', label: 'All Instructors' },
      ...instructors.map(i => ({ value: `${i.firstName} ${i.lastName}`, label: `${i.firstName} ${i.lastName}` }))
    ];
  }, [instructors]);

  const programOptions = useMemo(() => {
    return [{ value: '', label: 'All Programs' }, ...programs.map(p => ({ value: p.name, label: p.name }))]
  }, [programs]);

  const levelOptions = useMemo(() => {
    if (!selectedProgram) {
      return [{ value: '', label: 'All Levels (Select Program)' }];
    }
    const programDetails = programs.find(p => p.name === selectedProgram);
    if (programDetails && programDetails.hasLevels && programDetails.levels && programDetails.levels.length > 0) {
      return [
        { value: '', label: 'All Levels' },
        ...programDetails.levels.map(l => ({ value: l, label: l }))
      ];
    }
    return [{ value: '', label: 'No Levels for this Program' }];
  }, [selectedProgram, programs]);

  const offeringMatchesProgramAndLevel = useCallback((offering: ClassOffering): boolean => {
    let programMatch = true;
    if (selectedProgram) {
        programMatch = (offering.targetPrograms || []).includes(selectedProgram) || (offering.targetPrograms || []).length === 0;
    }
    if (!programMatch) return false; // If program doesn't match, no need to check level

    let levelMatch = true;
    if (selectedProgram && selectedLevel) { // Level filter is active only if a program is selected and a level is selected
        levelMatch = (offering.targetDancerLevels || []).includes(selectedLevel) || (offering.targetDancerLevels || []).length === 0;
    }
    return levelMatch;
  }, [selectedProgram, selectedLevel]);


  // Data for "Today's Classes"
  const todaysClasses = useMemo(() => {
    const todayDayOfWeek = currentDate.getDay();
    const classes: TodaysClassDisplayItem[] = [];
    classOfferings.forEach(offering => {
      if (!offeringMatchesProgramAndLevel(offering)) return;

      offering.scheduledClassSlots.forEach(slot => {
        if (slot.dayOfWeek === todayDayOfWeek && slot.startTime && slot.endTime) {
          classes.push({
            id: `${offering.id}-${slot.id || slot.dayOfWeek}-${slot.startTime}`,
            name: offering.name,
            time: formatTimeRange(slot.startTime, slot.endTime),
            instructor: offering.instructorName,
            room: slot.room || 'N/A',
            startTimeValue: slot.startTime,
            colorClass: getVisualCueClass(offering),
            classOfferingId: offering.id,
          });
        }
      });
    });
    return classes.sort((a, b) => a.startTimeValue.localeCompare(b.startTimeValue));
  }, [classOfferings, currentDate, offeringMatchesProgramAndLevel]);

  // Data for "Monthly Calendar View"
  const monthlyCalendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const daysInMonth = lastDayOfMonth.getDate();
    const startDayOfWeek = firstDayOfMonth.getDay(); 

    const daysArray: MonthlyCalendarDay[] = [];
    
    for (let i = 0; i < startDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, 0 - (startDayOfWeek - 1 - i));
      daysArray.push({ date: prevMonthDay, dayOfMonth: prevMonthDay.getDate(), isCurrentMonth: false, isToday: false, classes: [], events: [] });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday = date.toDateString() === new Date().toDateString();
      const dayOfWeekForDate = date.getDay();
      
      const yearStr = date.getFullYear();
      const monthStr = String(date.getMonth() + 1).padStart(2, '0');
      const dayStr = String(date.getDate()).padStart(2, '0');
      const dateStringForComparison = `${yearStr}-${monthStr}-${dayStr}`;

      const eventsOnThisDay = schoolEvents.filter(event => event.date === dateStringForComparison)
        .map(event => ({
            id: event.id,
            name: event.name,
            isHoliday: event.isHoliday
        }));

      const classesOnThisDay: MonthlyCalendarDay['classes'] = [];
      classOfferings.forEach(offering => {
        if (!offeringMatchesProgramAndLevel(offering)) return;

        offering.scheduledClassSlots.forEach(slot => {
          if (slot.dayOfWeek === dayOfWeekForDate && slot.startTime && slot.endTime) {
            classesOnThisDay.push({
              id: `${offering.id}-${slot.id || slot.dayOfWeek}-${slot.startTime}-${day}`,
              name: offering.name,
              time: formatTime(slot.startTime),
              colorClass: getVisualCueClass(offering),
              classOfferingId: offering.id,
            });
          }
        });
      });
      classesOnThisDay.sort((a,b) => a.time.localeCompare(b.time));

      daysArray.push({ date, dayOfMonth: day, isCurrentMonth: true, isToday, classes: classesOnThisDay, events: eventsOnThisDay });
    }
    
    const totalCells = daysArray.length % 7 === 0 ? daysArray.length : daysArray.length + (7 - (daysArray.length % 7));
    let nextMonthDayCounter = 1;
    while(daysArray.length < totalCells) {
        const nextMonthDay = new Date(year, month + 1, nextMonthDayCounter++);
        daysArray.push({ date: nextMonthDay, dayOfMonth: nextMonthDay.getDate(), isCurrentMonth: false, isToday: false, classes: [], events: [] });
    }
    return daysArray;
  }, [classOfferings, currentDate, offeringMatchesProgramAndLevel, schoolEvents]);


  const processedSchedule = useMemo(() => {
    const scheduleData: Record<number, Record<string, ScheduleItem[]>> = {};
    DAYS_OF_WEEK.forEach(day => {
      scheduleData[day.value] = {};
      timeSlots.forEach(slotTime => { scheduleData[day.value][slotTime] = []; });
    });

    classOfferings.forEach(offering => {
      offering.scheduledClassSlots.forEach((slot: ScheduledClassSlot, index: number) => { 
        if (!slot.startTime || !slot.endTime || slot.dayOfWeek === undefined) return;
        timeSlots.forEach(ts => {
          if (isClassActiveInSlot(slot.startTime, slot.endTime, ts, TIME_INTERVAL_MINUTES)) {
            const scheduleItem: ScheduleItem = {
              id: `${offering.id}_${slot.id || index}`, 
              name: offering.name,
              time: formatTimeRange(slot.startTime, slot.endTime),
              professor: offering.instructorName,
              room: slot.room,
              type: offering.category,
              classOfferingId: offering.id,
              slotId: String(slot.id || index), 
              colorClass: getVisualCueClass(offering),
            };
            scheduleData[slot.dayOfWeek][ts].push(scheduleItem);
          }
        });
      });
    });
    return scheduleData;
  }, [classOfferings, timeSlots]);
  
  const filteredSchedule = useMemo(() => {
    let tempSchedule = processedSchedule;
    const newSchedule: Record<number, Record<string, ScheduleItem[]>> = {};

    for (const dayKey in tempSchedule) {
      newSchedule[dayKey] = {};
      for (const timeKey in tempSchedule[dayKey]) {
        newSchedule[dayKey][timeKey] = tempSchedule[dayKey][timeKey].filter(item => {
          const offering = classOfferings.find(o => o.id === item.classOfferingId);
          if (!offering) return false;

          const instructorMatch = selectedInstructor ? item.professor === selectedInstructor : true;
          const roomMatch = selectedRoom ? item.room === selectedRoom : true;
          const programLevelMatch = offeringMatchesProgramAndLevel(offering);
          
          return instructorMatch && roomMatch && programLevelMatch;
        });
      }
    }
    return newSchedule;
  }, [processedSchedule, selectedInstructor, selectedRoom, classOfferings, offeringMatchesProgramAndLevel]);


  const handleClearFilters = () => {
    setSelectedInstructor('');
    setSelectedRoom('');
    setSelectedProgram('');
    setSelectedLevel('');
  };
  
  const handleMonthChange = (offset: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(prevDate.getMonth() + offset);
      return newDate;
    });
  };

  const handleProgramFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedProgram(e.target.value as ProgramName | '');
    setSelectedLevel(''); // Reset level when program changes
  };


  if (error && !isLoading) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl text-brand-error">Error: {error}</h2>
        <Button onClick={fetchScheduleData} variant="primary" className="mt-4">Try Again</Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary mb-4 sm:mb-0 flex items-center">
          <CalendarIcon className="w-8 h-8 mr-3 text-brand-primary" />
          Studio Schedule
        </h1>
      </div>

      <Card 
        title="Schedule Filters" 
        icon={<FilterIcon className="text-brand-primary w-5 h-5" />} 
        collapsible={false} // Keep filters always visible
        actions={<Button variant="outline" size="sm" onClick={handleClearFilters}>Clear All Filters</Button>}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-1">
          <Select
            id="filter-program" label="Filter by Program"
            options={programOptions} value={selectedProgram}
            onChange={handleProgramFilterChange} containerClassName="mb-0"
            disabled={isLoading || programs.length === 0}
          />
          <Select
            id="filter-level" label="Filter by Level"
            options={levelOptions} value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value as DancerLevelName | '')} containerClassName="mb-0"
            disabled={isLoading || !selectedProgram || (levelOptions.length <=1 && levelOptions[0].label !== 'All Levels')}
          />
          <Select
            id="filter-instructor" label="Filter by Instructor"
            options={instructorOptions} value={selectedInstructor}
            onChange={(e) => setSelectedInstructor(e.target.value)} containerClassName="mb-0"
            disabled={isLoading || instructors.length === 0}
          />
          <Select
            id="filter-room" label="Filter by Room"
            options={uniqueRooms} value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)} containerClassName="mb-0"
            disabled={isLoading || uniqueRooms.length <= 1}
          />
        </div>
      </Card>
      
      {isLoading && (
         <div className="text-center py-10 text-brand-text-secondary">Loading schedule data...</div>
      )}

      {!isLoading && !error && (
        <>
          <Card title="Today's Classes & Events" icon={<CalendarStarIcon className="text-brand-primary w-5 h-5" />} collapsible defaultCollapsed={false}>
            {todaysClasses.length > 0 ? (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {todaysClasses.map(item => (
                  <NavLink to={`/classes/offerings/edit/${item.classOfferingId}`} key={item.id} 
                           className={`block p-3 hover:opacity-80 rounded-md shadow-sm border ${item.colorClass}`}>
                    <h4 className="font-semibold">{item.name}</h4> {/* Text color from item.colorClass will apply */}
                    <p className="text-sm">{item.time}</p>
                    <p className="text-xs">Instructor: {item.instructor}</p>
                    <p className="text-xs">Room: {item.room}</p>
                  </NavLink>
                ))}
              </div>
            ) : (
              <p className="text-brand-text-secondary text-center py-4">No classes scheduled for today with current filters.</p>
            )}
          </Card>

          <Card title="Monthly Schedule Overview" icon={<CalendarIcon className="text-brand-primary w-5 h-5" />} collapsible defaultCollapsed={false}>
            <div className="flex justify-between items-center mb-4">
              <Button onClick={() => handleMonthChange(-1)} size="sm" variant="outline">&larr; Previous</Button>
              <h3 className="text-lg font-semibold text-brand-text-primary">
                {currentDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
              <Button onClick={() => handleMonthChange(1)} size="sm" variant="outline">Next &rarr;</Button>
            </div>
            <div className="grid grid-cols-7 gap-px border border-brand-neutral-200 bg-brand-neutral-200">
              {DAYS_OF_WEEK.map(day => (
                <div key={day.value} className="bg-brand-neutral-100 p-2 text-center text-xs font-medium text-brand-text-secondary">{day.label.substring(0,3)}</div>
              ))}
              {monthlyCalendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`p-1.5 min-h-[100px] ${day.isCurrentMonth ? 'bg-white' : 'bg-brand-neutral-50/70'} ${day.isToday ? 'ring-2 ring-brand-primary ring-inset' : ''}`}
                >
                  <div className={`text-xs font-medium text-right pr-1 ${day.isToday ? 'text-brand-primary font-bold' : day.isCurrentMonth ? 'text-brand-text-primary' : 'text-brand-neutral-400'}`}>
                    {day.dayOfMonth}
                  </div>
                  <div className="space-y-1 mt-0.5 max-h-[100px] overflow-y-auto">
                    {day.events.map(event => (
                      <div
                          key={event.id}
                          title={event.name}
                          className={`block text-[0.65rem] leading-tight p-1 rounded-sm truncate ${
                              event.isHoliday 
                                  ? 'bg-brand-pink-light text-brand-pink font-semibold' 
                                  : 'bg-brand-info-light text-brand-info'
                          }`}
                      >
                          <CalendarStarIcon className="w-3 h-3 inline-block mr-1" />
                          {event.name}
                      </div>
                    ))}
                    {day.classes.map(cls => (
                      <NavLink 
                        to={`/classes/offerings/edit/${cls.classOfferingId}`} 
                        key={cls.id}
                        className={`block text-[0.65rem] leading-tight p-1 rounded-sm truncate ${cls.colorClass}`}
                        title={`${cls.name} at ${cls.time}`}
                      >
                        <span className="font-medium">{cls.name}</span> ({cls.time})
                      </NavLink>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

           {/* Weekly Schedule Grid - UNCOMMENTED */}
            <Card title="Weekly Class Schedule" icon={<CalendarIcon className="text-brand-primary w-5 h-5" />} collapsible defaultCollapsed={false}>
                <div className="overflow-x-auto">
                <table className="min-w-full border-collapse border border-brand-neutral-200">
                    <thead>
                    <tr className="bg-brand-neutral-50">
                        <th className="p-2 border border-brand-neutral-200 text-xs text-left text-brand-text-muted w-24 sticky left-0 bg-brand-neutral-50 z-10">Time</th>
                        {DAYS_OF_WEEK.map(day => (
                        <th key={day.value} className="p-2 border border-brand-neutral-200 text-xs text-center text-brand-text-muted">
                            {day.label}
                        </th>
                        ))}
                    </tr>
                    </thead>
                    <tbody>
                    {timeSlots.map(slotTime => (
                        <tr key={slotTime}>
                        <td className="p-1.5 border border-brand-neutral-200 text-xs text-center text-brand-text-secondary align-top h-20 w-24 bg-brand-neutral-50/80 sticky left-0 z-10">
                            {formatTime(slotTime)}
                        </td>
                        {DAYS_OF_WEEK.map(day => (
                            <td key={`${day.value}-${slotTime}`} className="p-0.5 border border-brand-neutral-200 align-top h-20 relative">
                            {(filteredSchedule[day.value]?.[slotTime] || []).map(item => (
                                <NavLink 
                                    to={`/classes/offerings/edit/${item.classOfferingId}`} 
                                    key={item.id}
                                    className={`block p-1.5 mb-0.5 rounded text-[0.7rem] leading-tight shadow-sm transition-all duration-150 ease-in-out ${item.colorClass}`}
                                    title={`${item.name}\n${item.time}\nRoom: ${item.room}\nInstructor: ${item.professor}`}
                                >
                                <div className="font-semibold truncate">{item.name}</div>
                                <div className="truncate">{item.time}</div>
                                <div className="truncate text-xs">Room: {item.room}</div>
                                <div className="truncate text-xs">Instructor: {item.professor}</div>
                                </NavLink>
                            ))}
                            {(filteredSchedule[day.value]?.[slotTime] || []).length === 0 && <div className="h-full w-full"></div>}
                            </td>
                        ))}
                        </tr>
                    ))}
                    </tbody>
                </table>
                </div>
            </Card>
        </>
      )}
    </div>
  );
};
export default SchedulingPage;