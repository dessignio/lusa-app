

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Button from '../../components/forms/Button';
import Select from '../../components/forms/Select';
import Input from '../../components/forms/Input';
import { CalendarIcon, PlusCircleIcon, CheckCircleIcon } from '../../components/icons';
import { Absence, ClassOffering, ScheduledClassSlot, CreateAbsencePayload, AttendanceRecord } from '../../types';
import { getAbsences, createAbsence, getClassOfferings, markAttendance, getAttendanceRecordsByStudent } from '../../services/apiService';
import { showToast, formatTimeRange, getLocalDateString } from '../../utils';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { DAYS_OF_WEEK, ABSENCE_REASON_OPTIONS } from '../../constants';

const RecordAbsenceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAbsenceRecorded: () => void;
  enrolledClasses: ClassOffering[];
}> = ({ isOpen, onClose, onAbsenceRecorded, enrolledClasses }) => {
  const { selectedStudent } = useClientAuth();
  const [classId, setClassId] = useState('');
  const [absenceDate, setAbsenceDate] = useState(getLocalDateString());
  const [selectedSlotId, setSelectedSlotId] = useState(''); 
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClassId(''); setAbsenceDate(getLocalDateString());
      setSelectedSlotId(''); setReason(''); setOtherReason(''); setNotes('');
    }
  }, [isOpen]);

  const availableSlotsForDate = useMemo(() => {
    if (!absenceDate || !classId) return [];
    const offering = enrolledClasses.find(c => c.id === classId);
    if (!offering) return [];
    const dayOfWeekOfAbsence = new Date(absenceDate).getUTCDay();
    return offering.scheduledClassSlots.filter(s => s.dayOfWeek === dayOfWeekOfAbsence);
  }, [absenceDate, classId, enrolledClasses]);

  const handleSubmit = async () => {
    if (!selectedStudent || !classId || !absenceDate || !selectedSlotId || !reason) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    if (reason === "Otro (especificar)" && !otherReason.trim()) {
      showToast('Please specify the reason if "Other" is selected.', 'error');
      return;
    }

    const selectedClass = enrolledClasses.find(c => c.id === classId);
    const selectedSlot = selectedClass?.scheduledClassSlots.find(s => s.id === selectedSlotId);
    if (!selectedClass || !selectedSlot) {
      showToast('Selected class or slot is invalid.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const localDateTime = new Date(`${absenceDate}T${selectedSlot.startTime}`);

    try {
      const absencePayload: CreateAbsencePayload = {
        studentId: selectedStudent.id,
        studentName: `${selectedStudent.firstName} ${selectedStudent.lastName}`,
        classId: selectedClass.id,
        className: selectedClass.name,
        classDateTime: localDateTime.toISOString(),
        reason: reason === "Otro (especificar)" ? otherReason.trim() : reason,
        notes: notes.trim() || undefined,
      };
      const newAbsence = await createAbsence(absencePayload);
      
      await markAttendance({
          studentId: selectedStudent.id,
          classOfferingId: selectedClass.id,
          classDateTime: localDateTime.toISOString(),
          status: 'Absent',
          notes: `Absence reported by client. Reason: ${absencePayload.reason}`,
          absenceId: newAbsence.id,
      });

      showToast('Absence reported successfully!', 'success');
      onAbsenceRecorded();
      onClose();
    } catch (err) {
      showToast(`Failed to report absence: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Report an Absence</h3>
        <div className="space-y-4">
          <Select id="absence-class" label="Class"
            options={enrolledClasses.map(c => ({ value: c.id, label: c.name }))}
            value={classId} onChange={e => { setClassId(e.target.value); setSelectedSlotId(''); }}
            placeholderOption="Select a class..." required
          />
          <Input id="absence-date" label="Date of Absence" type="date" value={absenceDate}
            onChange={e => { setAbsenceDate(e.target.value); setSelectedSlotId(''); }} required
          />
          <Select id="absence-class-slot" label="Class Time"
            options={availableSlotsForDate.map(slot => ({ value: slot.id, label: `${DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}, ${formatTimeRange(slot.startTime, slot.endTime)}` }))}
            value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)}
            placeholderOption={!classId ? "Select a class first" : availableSlotsForDate.length > 0 ? "Select a time..." : "No classes on this day"}
            disabled={!classId || availableSlotsForDate.length === 0} required
          />
          <Select id="absence-reason" label="Reason"
            options={ABSENCE_REASON_OPTIONS.map(r => ({ value: r, label: r }))}
            value={reason} onChange={e => setReason(e.target.value)}
            placeholderOption="Select a reason..." required
          />
          {reason === "Otro (especificar)" && <Input id="absence-other-reason" label="Specify Reason" value={otherReason} onChange={e => setOtherReason(e.target.value)} required />}
          <Input id="absence-notes" label="Notes (Optional)" type="textarea" rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>Submit Absence</Button>
        </div>
      </div>
    </div>
  );
};


const ReportAttendanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAttendanceReported: () => void;
  enrolledClasses: ClassOffering[];
}> = ({ isOpen, onClose, onAttendanceReported, enrolledClasses }) => {
  const { selectedStudent } = useClientAuth();
  const [classId, setClassId] = useState('');
  const [attendanceDate, setAttendanceDate] = useState(getLocalDateString());
  const [selectedSlotId, setSelectedSlotId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setClassId('');
      setAttendanceDate(getLocalDateString());
      setSelectedSlotId('');
    }
  }, [isOpen]);

  const availableSlotsForDate = useMemo(() => {
    if (!attendanceDate || !classId) return [];
    const offering = enrolledClasses.find(c => c.id === classId);
    if (!offering) return [];
    const dayOfWeekOfAttendance = new Date(attendanceDate).getUTCDay();
    return offering.scheduledClassSlots.filter(s => s.dayOfWeek === dayOfWeekOfAttendance);
  }, [attendanceDate, classId, enrolledClasses]);

  const handleSubmit = async () => {
    if (!selectedStudent || !classId || !attendanceDate || !selectedSlotId) {
      showToast('Please fill all fields.', 'error');
      return;
    }

    const selectedClass = enrolledClasses.find(c => c.id === classId);
    const selectedSlot = selectedClass?.scheduledClassSlots.find(s => s.id === selectedSlotId);
    if (!selectedClass || !selectedSlot) {
      showToast('Selected class or slot is invalid.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const localDateTime = new Date(`${attendanceDate}T${selectedSlot.startTime}`);

    try {
      await markAttendance({
        studentId: selectedStudent.id,
        classOfferingId: selectedClass.id,
        classDateTime: localDateTime.toISOString(),
        status: 'Present',
        notes: 'Attendance reported manually by client.',
      });
      showToast('Attendance reported successfully!', 'success');
      onAttendanceReported();
      onClose();
    } catch (err) {
      showToast(`Failed to report attendance: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Report My Attendance</h3>
        <div className="space-y-4">
          <Select id="attendance-class" label="Class"
            options={enrolledClasses.map(c => ({ value: c.id, label: c.name }))}
            value={classId} onChange={e => { setClassId(e.target.value); setSelectedSlotId(''); }}
            placeholderOption="Select a class..." required
          />
          <Input id="attendance-date" label="Date of Attendance" type="date" value={attendanceDate}
            onChange={e => { setAttendanceDate(e.target.value); setSelectedSlotId(''); }} required
          />
          <Select id="attendance-class-slot" label="Class Time"
            options={availableSlotsForDate.map(slot => ({ value: slot.id, label: `${DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}, ${formatTimeRange(slot.startTime, slot.endTime)}` }))}
            value={selectedSlotId} onChange={e => setSelectedSlotId(e.target.value)}
            placeholderOption={!classId ? "Select a class first" : availableSlotsForDate.length > 0 ? "Select a time..." : "No classes on this day"}
            disabled={!classId || availableSlotsForDate.length === 0} required
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>Report Present</Button>
        </div>
      </div>
    </div>
  );
};


const PortalAttendancePage: React.FC = () => {
    const { selectedStudent } = useClientAuth();
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [enrolledClasses, setEnrolledClasses] = useState<ClassOffering[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAbsenceModalOpen, setIsAbsenceModalOpen] = useState(false);
    const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);

    const fetchData = useCallback(async () => {
        if (!selectedStudent) {
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const [attendanceData, offeringsData] = await Promise.all([
                getAttendanceRecordsByStudent(selectedStudent),
                getClassOfferings()
            ]);
            
            const enrichedRecords = attendanceData.map(record => ({
                ...record,
                className: offeringsData.find(c => c.id === record.classOfferingId)?.name || 'Unknown Class'
            })).sort((a,b) => new Date(b.classDateTime).getTime() - new Date(a.classDateTime).getTime());
            
            setAttendanceRecords(enrichedRecords);
            setEnrolledClasses(offeringsData.filter(o => selectedStudent.enrolledClasses.includes(o.id)));
        } catch (error) {
            showToast("Failed to load attendance data.", "error");
        } finally {
            setIsLoading(false);
        }
    }, [selectedStudent]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const attendanceColumns: ColumnDefinition<(AttendanceRecord & {className?: string})>[] = [
        { header: 'Class', accessor: 'className' },
        { header: 'Date', accessor: 'classDateTime', render: (a) => new Date(a.classDateTime).toLocaleString() },
        { header: 'Status', accessor: 'status', render: (a) => {
            let color = 'bg-brand-neutral-100 text-brand-neutral-700';
            if (a.status === 'Present') color = 'bg-brand-success-light text-brand-success-dark';
            else if (a.status === 'Late') color = 'bg-brand-warning-light text-brand-warning-dark';
            else if (a.status === 'Absent') color = 'bg-brand-error-light text-brand-error-dark';
            else if (a.status === 'Excused') color = 'bg-brand-info-light text-brand-info';
            return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${color}`}>{a.status}</span>;
          }
        },
        { header: 'Notes', accessor: 'notes', render: (r) => r.notes || '-' },
    ];
    
    if (!selectedStudent) {
        return <div className="text-center py-10">Please select a student profile to manage attendance.</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
                <CheckCircleIcon className="w-8 h-8 mr-3 text-brand-primary"/>
                My Attendance
            </h1>
            <p className="text-brand-text-secondary">View your attendance history or report an absence.</p>

            <Card
                title="Attendance History"
                icon={<CalendarIcon className="w-5 h-5 text-brand-primary"/>}
                actions={<div className='flex space-x-2'>
                  <Button variant="primary" onClick={() => setIsAttendanceModalOpen(true)} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>Report Attendance</Button>
                  <Button variant="outline" onClick={() => setIsAbsenceModalOpen(true)} leftIcon={<PlusCircleIcon className="w-4 h-4"/>}>Report Absence</Button>
                </div>}
            >
                <Table<(AttendanceRecord & {className?: string})>
                    columns={attendanceColumns}
                    data={attendanceRecords}
                    isLoading={isLoading}
                    emptyStateMessage="You have no recorded attendance history."
                />
            </Card>

            <RecordAbsenceModal 
                isOpen={isAbsenceModalOpen}
                onClose={() => setIsAbsenceModalOpen(false)}
                onAbsenceRecorded={fetchData}
                enrolledClasses={enrolledClasses}
            />
            <ReportAttendanceModal
                isOpen={isAttendanceModalOpen}
                onClose={() => setIsAttendanceModalOpen(false)}
                onAttendanceReported={fetchData}
                enrolledClasses={enrolledClasses}
            />
        </div>
    );
};

export default PortalAttendancePage;
