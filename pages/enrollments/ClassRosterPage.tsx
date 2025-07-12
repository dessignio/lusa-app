

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, NavLink } from 'react-router-dom';
import Card from '../../components/Card';
import Table, { ColumnDefinition } from '../../components/Table';
import Button from '../../components/forms/Button';
import { ChevronLeftIcon, UsersIcon, UserPlusIcon, TrashIcon, CalendarIcon as AbsenceIcon, ListOlIcon, CheckCircleIcon, PlusCircleIcon as RecordAbsenceIcon } from '../../components/icons';
import { ClassOffering, Student, Enrollment, Absence, AbsenceStatus, ScheduledClassSlot, AttendanceRecord, CreateAbsencePayload } from '../../types';
import { getClassOfferingById, getEnrollmentsByClass, enrollStudentInClass, unenrollStudentFromClass, getStudents, getAbsences, createAbsence, getAttendanceRecords, markAttendance } from '../../services/apiService';
import { showToast, formatTimeRange, getLocalDateString } from '../../utils';
import Select from '../../components/forms/Select';
import Input from '../../components/forms/Input';
import { DAYS_OF_WEEK, ABSENCE_REASON_OPTIONS, ATTENDANCE_STATUS_OPTIONS } from '../../constants';

// StudentEnrollmentModal (remains largely the same, but uses actual Student type)
const StudentEnrollmentModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onEnroll: (studentId: string) => void;
  classOfferingName: string;
  allStudents: Student[];
  enrolledStudentIds: string[];
}> = ({ isOpen, onClose, onEnroll, classOfferingName, allStudents, enrolledStudentIds }) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
        setSelectedStudentId('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const availableStudentsToEnroll = allStudents.filter(s => !enrolledStudentIds.includes(s.id));

  const handleSubmit = () => {
    if (!selectedStudentId) {
      showToast("Please select a student to enroll.", "error");
      return;
    }
    onEnroll(selectedStudentId);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Enroll Student in {classOfferingName}</h3>
        {availableStudentsToEnroll.length > 0 ? (
          <>
            <Select
              id="student-to-enroll"
              label="Select Student"
              options={availableStudentsToEnroll.map(s => ({ value: s.id, label: `${s.firstName} ${s.lastName} (${s.email})` }))}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              placeholderOption="Choose a student..."
              containerClassName="mb-4"
            />
            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button variant="primary" onClick={handleSubmit}>Enroll Student</Button>
            </div>
          </>
        ) : (
          <>
            <p className="text-brand-text-secondary text-center my-4">All available students are already enrolled or no students found.</p>
            <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={onClose}>Close</Button>
              </div>
          </>
        )}
      </div>
    </div>
  );
};

interface RecordAbsenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAbsenceRecorded: () => void;
  classOffering: ClassOffering | null;
  enrolledStudents: Enrollment[];
}

const RecordAbsenceModal: React.FC<RecordAbsenceModalProps> = ({
  isOpen,
  onClose,
  onAbsenceRecorded,
  classOffering,
  enrolledStudents,
}) => {
  const [studentId, setStudentId] = useState('');
  const [absenceDate, setAbsenceDate] = useState(getLocalDateString());
  const [selectedSlotId, setSelectedSlotId] = useState(''); 
  const [reason, setReason] = useState('');
  const [otherReason, setOtherReason] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudentId('');
      setAbsenceDate(getLocalDateString());
      setSelectedSlotId('');
      setReason('');
      setOtherReason('');
      setNotes('');
    }
  }, [isOpen]);

  const availableSlotsForDate = useMemo(() => {
    if (!absenceDate || !classOffering?.scheduledClassSlots) return [];
    // Parse as local date to get correct day of week for user's timezone.
    const localDate = new Date(absenceDate + 'T00:00:00');
    const dayOfWeekOfAbsence = localDate.getDay();
    return classOffering.scheduledClassSlots.filter(
      slot => slot.dayOfWeek === dayOfWeekOfAbsence && slot.startTime && slot.endTime
    );
  }, [absenceDate, classOffering?.scheduledClassSlots]);

  const handleSubmit = async () => {
    if (!studentId || !absenceDate || !selectedSlotId || !reason) {
      showToast('Please fill all required fields.', 'error');
      return;
    }
    if (reason === "Otro (especificar)" && !otherReason.trim()) {
      showToast('Please specify the reason if "Other" is selected.', 'error');
      return;
    }
    if (!classOffering) {
        showToast('Class offering data is not available.', 'error');
        return;
    }

    const selectedStudent = enrolledStudents.find(e => e.studentId === studentId);
    const actualSlot = classOffering.scheduledClassSlots.find(s => s.id === selectedSlotId);

    if (!selectedStudent || !actualSlot) {
        showToast('Selected student or class slot is invalid.', 'error');
        return;
    }
    
    const localDateTime = new Date(`${absenceDate}T${actualSlot.startTime}`);

    setIsSubmitting(true);
    const payload: CreateAbsencePayload = {
      studentId,
      studentName: selectedStudent.studentName || 'Unknown Student', 
      classId: classOffering.id,
      className: classOffering.name,
      classDateTime: localDateTime.toISOString(), 
      reason: reason === "Otro (especificar)" ? otherReason.trim() : reason,
      notes: notes.trim() || undefined,
    };

    try {
      await createAbsence(payload);
      showToast('Absence recorded successfully!', 'success');
      onAbsenceRecorded();
      onClose();
    } catch (err) {
      showToast(`Failed to record absence: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !classOffering) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">Record Absence for {classOffering.name}</h3>
        <div className="space-y-4">
          <Select
            id="absence-student"
            label="Student"
            options={enrolledStudents.map(e => ({ value: e.studentId, label: e.studentName || e.studentId }))}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholderOption="Select a student..."
            required
          />
          <Input
            id="absence-date"
            label="Date of Absence"
            type="date"
            value={absenceDate}
            onChange={(e) => {
              setAbsenceDate(e.target.value);
              setSelectedSlotId(''); 
            }}
            required
          />
          <Select
            id="absence-class-slot"
            label="Class Slot"
            options={availableSlotsForDate.map(slot => ({
              value: slot.id, 
              label: `${DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}, ${formatTimeRange(slot.startTime, slot.endTime)} (${slot.room})`,
            }))}
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            placeholderOption={availableSlotsForDate.length > 0 ? "Select a class slot..." : "No slots for selected date"}
            disabled={availableSlotsForDate.length === 0 || !absenceDate}
            required
          />
          <Select
            id="absence-reason"
            label="Reason"
            options={ABSENCE_REASON_OPTIONS.map(r => ({ value: r, label: r }))}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholderOption="Select a reason..."
            required
          />
          {reason === "Otro (especificar)" && (
            <Input
              id="absence-other-reason"
              label="Specify Reason"
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              required
            />
          )}
          <Input
            id="absence-notes"
            label="Notes (Optional)"
            type="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>Submit Absence</Button>
        </div>
      </div>
    </div>
  );
};


// NEW MODAL FOR RECORDING ATTENDANCE
const RecordAttendanceModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAttendanceRecorded: () => void;
  classOffering: ClassOffering;
  enrolledStudents: Enrollment[];
  classDateTime: string; // "YYYY-MM-DDTHH:mm:ss.sssZ" (ISO String)
  initialRecord?: AttendanceRecord & { studentName?: string };
}> = ({ isOpen, onClose, onAttendanceRecorded, classOffering, enrolledStudents, classDateTime, initialRecord }) => {
  
  const [studentId, setStudentId] = useState('');
  const [status, setStatus] = useState<AttendanceRecord['status']>('Present');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStudentId(initialRecord?.studentId || '');
      setStatus(initialRecord?.status || 'Present');
      setNotes(initialRecord?.notes || '');
    }
  }, [isOpen, initialRecord]);

  const handleSubmit = async () => {
    if (!studentId || !status) {
      showToast("Please select a student and a status.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      await markAttendance({
        studentId,
        classOfferingId: classOffering.id,
        classDateTime: classDateTime,
        status: status,
        notes: notes.trim() || undefined,
      });
      showToast('Attendance recorded successfully!', 'success');
      onAttendanceRecorded();
      onClose();
    } catch (err) {
      showToast(`Failed to record attendance: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg">
        <h3 className="text-xl font-semibold text-brand-text-primary mb-4">{initialRecord ? 'Edit' : 'Record'} Attendance</h3>
        <p className="text-sm text-brand-text-secondary mb-4">
          For <strong>{classOffering.name}</strong> on <strong>{new Date(classDateTime).toLocaleString()}</strong>
        </p>
        <div className="space-y-4">
          <Select
            id="attendance-student"
            label="Student"
            options={enrolledStudents.map(e => ({ value: e.studentId, label: e.studentName || e.studentId }))}
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
            placeholderOption="Select a student..."
            required
            disabled={isSubmitting || !!initialRecord}
          />
          <Select
            id="attendance-status"
            label="Status"
            options={ATTENDANCE_STATUS_OPTIONS}
            value={status}
            onChange={(e) => setStatus(e.target.value as AttendanceRecord['status'])}
            required
            disabled={isSubmitting}
          />
          <Input
            id="attendance-notes"
            label="Notes (Optional)"
            type="textarea"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            disabled={isSubmitting}
          />
        </div>
        <div className="flex justify-end space-x-3 mt-6">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} isLoading={isSubmitting} disabled={isSubmitting}>Submit</Button>
        </div>
      </div>
    </div>
  );
};


type ActiveTab = 'roster' | 'attendance' | 'absences';

type EnrichedAttendanceRecord = AttendanceRecord & { studentName?: string };

const ClassRosterPage: React.FC = () => {
  const { classOfferingId } = useParams<{ classOfferingId: string }>();
  const [classOffering, setClassOffering] = useState<ClassOffering | null>(null);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [isRecordAbsenceModalOpen, setIsRecordAbsenceModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('roster');

  // Attendance specific state
  const [attendanceDate, setAttendanceDate] = useState<string>(getLocalDateString());
  const [selectedAttendanceSlotId, setSelectedAttendanceSlotId] = useState<string>('');
  const [attendanceRecords, setAttendanceRecords] = useState<EnrichedAttendanceRecord[]>([]);
  const [isLoadingAttendance, setIsLoadingAttendance] = useState<boolean>(false);
  
  // State for the new attendance modal
  const [isRecordAttendanceModalOpen, setIsRecordAttendanceModalOpen] = useState(false);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState<EnrichedAttendanceRecord | undefined>(undefined);

  const fetchClassData = useCallback(async () => {
    if (!classOfferingId) {
      setError("Class Offering ID is missing.");
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [offeringData, enrollmentsData, allStudentsData, absencesData] = await Promise.all([
        getClassOfferingById(classOfferingId),
        getEnrollmentsByClass(classOfferingId),
        getStudents(),
        getAbsences({ classId: classOfferingId })
      ]);
      setClassOffering(offeringData);
      setEnrollments(enrollmentsData);
      setAllStudents(allStudentsData);
      setAbsences(absencesData);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load class data.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [classOfferingId]);

  useEffect(() => {
    fetchClassData();
  }, [fetchClassData]);
  
  const fetchAttendanceForSlot = useCallback(async () => {
    if (!classOfferingId || !attendanceDate) {
      setAttendanceRecords([]);
      return;
    }
    
    setIsLoadingAttendance(true);
    try {
      const records = await getAttendanceRecords(classOfferingId, attendanceDate); 
      const enrichedRecords = records.map(record => ({
        ...record,
        studentName: enrollments.find(e => e.studentId === record.studentId)?.studentName || 'Unknown Student'
      }));
      setAttendanceRecords(enrichedRecords);
    } catch (err) {
      showToast(`Failed to fetch attendance: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      setAttendanceRecords([]); 
    } finally {
      setIsLoadingAttendance(false);
    }
  }, [classOfferingId, attendanceDate, enrollments]);
  
  useEffect(() => {
    if (activeTab === 'attendance' && attendanceDate) { 
        fetchAttendanceForSlot();
    }
  }, [attendanceDate, activeTab, fetchAttendanceForSlot]);

  const handleEnrollStudent = async (studentId: string) => {
    if (!classOfferingId || !studentId || !classOffering) return;
    if (classOffering.enrolledCount >= classOffering.capacity) {
        showToast("Cannot enroll student, class is full.", "info");
        setIsEnrollModalOpen(false);
        return;
    }
    try {
      await enrollStudentInClass(studentId, classOfferingId);
      showToast('Student enrolled successfully!', 'success');
      fetchClassData(); 
      setIsEnrollModalOpen(false);
    } catch (err) {
      showToast(`Enrollment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    }
  };

  const handleUnenrollStudent = async (enrollment: Enrollment) => {
    if (!classOfferingId || !enrollment.studentId) return;
    const confirmed = window.confirm(`Are you sure you want to unenroll ${enrollment.studentName || enrollment.studentId}?`);
    if (confirmed) {
      try {
        await unenrollStudentFromClass(enrollment.studentId, classOfferingId);
        showToast('Student unenrolled successfully!', 'success');
        fetchClassData(); 
      } catch (err) {
        showToast(`Unenrollment failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
      }
    }
  };

  const openAttendanceModal = (record?: EnrichedAttendanceRecord) => {
    setSelectedAttendanceRecord(record);
    setIsRecordAttendanceModalOpen(true);
  }

  const enrollmentColumns: ColumnDefinition<Enrollment>[] = [
    { header: 'Student Name', accessor: 'studentName', render: (e) => e.studentName || e.studentId },
    { header: 'Enrollment Date', accessor: 'enrollmentDate', render: (e) => new Date(e.enrollmentDate).toLocaleDateString() },
    { header: 'Status', accessor: 'status' },
  ];
  
  const attendanceColumns: ColumnDefinition<EnrichedAttendanceRecord>[] = [
    { header: 'Student Name', accessor: 'studentName' },
    { header: 'Status', accessor: 'status' },
    { header: 'Notes', accessor: 'notes', render: (r) => r.notes || '-' },
  ];

  const absenceColumns: ColumnDefinition<Absence>[] = [
    { header: 'Student Name', accessor: 'studentName' },
    { header: 'Class Date & Time', accessor: 'classDateTime', render: (a) => new Date(a.classDateTime).toLocaleString() },
    { header: 'Reason', accessor: 'reason' },
    { header: 'Status', accessor: 'status', render: (a) => {
        let bgColor = 'bg-brand-neutral-100 text-brand-neutral-700';
        if (a.status === 'Justificada') bgColor = 'bg-brand-success-light text-brand-success-dark';
        else if (a.status === 'No Justificada') bgColor = 'bg-brand-error-light text-brand-error-dark';
        else if (a.status === 'Notificada') bgColor = 'bg-brand-info-light text-brand-info';
        return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${bgColor}`}>{a.status}</span>;
      }
    },
    { header: 'Notified On', accessor: 'notificationDate', render: (a) => new Date(a.notificationDate).toLocaleDateString() },
    { header: 'Notes', accessor: 'notes', render: (a) => a.notes || '-' }
  ];
  
  const enrolledStudentIds = useMemo(() => enrollments.map(e => e.studentId), [enrollments]);
  const enrolledStudentsList = useMemo(() => enrollments.filter(e => e.status === 'Enrolled'), [enrollments]);

  const attendanceSlotsForDate = useMemo(() => {
    if (!attendanceDate || !classOffering?.scheduledClassSlots) return [];
    // The input type="date" value 'YYYY-MM-DD' is timezone-agnostic.
    // To correctly get the local day of the week, we should parse it in a way
    // that avoids automatic timezone conversion to UTC midnight.
    // Appending 'T00:00:00' makes it local time.
    const localDate = new Date(attendanceDate + 'T00:00:00');
    const dayOfWeekOfAttendance = localDate.getDay(); // Use getDay() for local date
    return classOffering.scheduledClassSlots
      .filter(slot => slot.dayOfWeek === dayOfWeekOfAttendance && slot.startTime && slot.endTime)
      .map(slot => ({
        value: slot.id,
        label: `${DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label}, ${formatTimeRange(slot.startTime, slot.endTime)} (${slot.room})`,
        startTime: slot.startTime
      }));
  }, [attendanceDate, classOffering?.scheduledClassSlots]);

  const selectedClassDateTime = useMemo(() => {
    if (!selectedAttendanceSlotId || !attendanceDate) return '';
    const slot = attendanceSlotsForDate.find(s => s.value === selectedAttendanceSlotId);
    if (!slot?.startTime) return '';
    
    // The startTime from DB is HH:mm:ss, so we don't need to append seconds.
    const localDateTime = new Date(`${attendanceDate}T${slot.startTime}`);
    return localDateTime.toISOString();
  }, [selectedAttendanceSlotId, attendanceDate, attendanceSlotsForDate]);


  if (isLoading && !error && !classOffering) { 
    return <div className="p-6 text-center text-brand-text-secondary">Loading class data...</div>;
  }

  if (error) {
    return (
      <div className="p-6 text-center text-brand-error">
        Error: {error}
        <Button onClick={() => fetchClassData()} className="mt-4" variant="primary">Retry</Button>
      </div>
    );
  }

  if (!classOffering) {
    return <div className="p-6 text-center text-brand-text-secondary">Class offering not found.</div>;
  }
  
  const tabButtonClasses = (tabName: ActiveTab) => 
    `px-4 py-2 text-sm font-medium rounded-t-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-1 ` +
    (activeTab === tabName 
      ? 'bg-brand-primary text-white shadow-md' 
      : 'bg-brand-neutral-100 text-brand-text-secondary hover:bg-brand-neutral-200 hover:text-brand-primary');

  return (
    <div className="space-y-6">
      <NavLink to="/enrollments" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2 font-medium">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Enrollment Overview
      </NavLink>

      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
            <h2 className="text-2xl font-bold text-brand-primary mb-2 md:mb-0">{classOffering.name}</h2>
            <div className="flex items-center space-x-2 text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classOffering.enrolledCount >= classOffering.capacity ? 'bg-brand-error-light text-brand-error-dark' : 'bg-brand-success-light text-brand-success-dark'}`}>
                    {classOffering.enrolledCount} / {classOffering.capacity} Enrolled
                </span>
                <span className="text-brand-text-muted">|</span>
                <span className="text-brand-text-secondary">{classOffering.level} Level</span>
            </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3 text-sm text-brand-text-secondary">
          <p><strong className="font-medium text-brand-text-primary">Instructor:</strong> {classOffering.instructorName}</p>
          <p><strong className="font-medium text-brand-text-primary">Category:</strong> {classOffering.category}</p>
          <p><strong className="font-medium text-brand-text-primary">Duration:</strong> {classOffering.duration}</p>
          <p><strong className="font-medium text-brand-text-primary">Price:</strong> {classOffering.price}</p>
          {classOffering.scheduledClassSlots && classOffering.scheduledClassSlots.length > 0 && (
            <div className="sm:col-span-2 lg:col-span-3">
              <strong className="font-medium text-brand-text-primary">Schedule:</strong>
              <ul className="list-disc list-inside ml-1 mt-1 space-y-0.5">
                {classOffering.scheduledClassSlots.map((slot, index) => (
                  <li key={slot.id || `${slot.dayOfWeek}-${slot.startTime}-${index}`}>
                    {DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || 'N/A'}: {formatTimeRange(slot.startTime, slot.endTime)} in {slot.room || 'N/A'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      
      <div className="border-b border-brand-neutral-300">
        <nav className="flex space-x-1 -mb-px">
           <button onClick={() => setActiveTab('roster')} className={`${tabButtonClasses('roster')} flex items-center space-x-1.5`}>
            <UsersIcon className="w-4 h-4" />
            <span>Roster</span>
          </button>
          <button onClick={() => setActiveTab('attendance')} className={`${tabButtonClasses('attendance')} flex items-center space-x-1.5`}>
            <CheckCircleIcon className="w-4 h-4" />
            <span>Attendance</span>
          </button>
          <button onClick={() => setActiveTab('absences')} className={`${tabButtonClasses('absences')} flex items-center space-x-1.5`}>
            <AbsenceIcon className="w-4 h-4" />
            <span>Absences</span>
          </button>
        </nav>
      </div>

      {activeTab === 'roster' && (
        <Card 
          title="Class Roster" 
          icon={<UsersIcon className="text-brand-primary w-5 h-5"/>} 
          collapsible={false}
          actions={
            <Button variant="primary" onClick={() => setIsEnrollModalOpen(true)} leftIcon={<UserPlusIcon className="w-4 h-4"/>} disabled={isLoading || classOffering.enrolledCount >= classOffering.capacity}>
              Enroll Student
            </Button>
          }
        >
          {classOffering.enrolledCount >= classOffering.capacity && (
              <p className="text-sm text-brand-info bg-brand-info-light p-2 rounded-md mb-3 text-center">
                  This class is currently full.
              </p>
          )}
          <Table<Enrollment>
            columns={enrollmentColumns}
            data={enrollments.filter(e => e.status === 'Enrolled')}
            isLoading={isLoading}
            emptyStateMessage="No students are currently enrolled in this class."
            renderRowActions={(enrollment) => (
              <Button variant="danger" size="sm" onClick={() => handleUnenrollStudent(enrollment)} aria-label={`Unenroll ${enrollment.studentName}`}>
                <TrashIcon className="w-4 h-4 mr-1"/> Unenroll
              </Button>
            )}
          />
        </Card>
      )}
      
      {activeTab === 'attendance' && (
         <Card 
            title="Attendance Records" 
            icon={<CheckCircleIcon className="text-brand-primary w-5 h-5"/>} 
            collapsible={false}
            actions={
                <Button variant="primary" onClick={() => openAttendanceModal()} leftIcon={<UserPlusIcon className="w-4 h-4"/>} disabled={!selectedAttendanceSlotId}>
                    Record Attendance
                </Button>
            }
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-1 items-end">
              <Input
                id="attendance-date"
                label="Select Date"
                type="date"
                value={attendanceDate}
                onChange={(e) => {
                  setAttendanceDate(e.target.value);
                  setSelectedAttendanceSlotId(''); 
                  setAttendanceRecords([]);
                }}
                containerClassName="mb-0"
              />
              <Select
                id="attendance-slot"
                label="Select Slot"
                options={attendanceSlotsForDate}
                value={selectedAttendanceSlotId}
                onChange={(e) => setSelectedAttendanceSlotId(e.target.value)}
                placeholderOption={attendanceSlotsForDate.length > 0 ? "Choose a slot..." : "No slots for this date"}
                disabled={attendanceSlotsForDate.length === 0 || !attendanceDate}
                containerClassName="mb-0"
              />
            </div>

            {isLoadingAttendance && <p className="text-center text-brand-text-secondary py-4">Loading attendance data...</p>}
            
            {!isLoadingAttendance && selectedAttendanceSlotId && (
              <Table<EnrichedAttendanceRecord>
                columns={attendanceColumns}
                data={attendanceRecords}
                isLoading={isLoadingAttendance}
                emptyStateMessage="No attendance records for this slot yet. Click 'Record Attendance' to start."
                renderRowActions={(record) => (
                  <Button variant="outline" size="sm" onClick={() => openAttendanceModal(record)}>
                    Edit
                  </Button>
                )}
              />
            )}
            
            {!isLoadingAttendance && !selectedAttendanceSlotId && (
                <p className="text-center text-brand-text-secondary py-4">Please select a date and a class slot to view attendance records.</p>
            )}
         </Card>
      )}


      {activeTab === 'absences' && (
        <Card 
            title="Absence Records for this Class" 
            icon={<AbsenceIcon className="text-brand-primary w-5 h-5"/>} 
            collapsible={false}
            actions={
                <Button variant="primary" onClick={() => setIsRecordAbsenceModalOpen(true)} leftIcon={<RecordAbsenceIcon className="w-4 h-4"/>} disabled={isLoading}>
                    Record Absence
                </Button>
            }
        >
            <Table<Absence>
                columns={absenceColumns}
                data={absences}
                isLoading={isLoading}
                emptyStateMessage="No absences recorded for this class."
            />
        </Card>
      )}
      
      <StudentEnrollmentModal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        onEnroll={handleEnrollStudent}
        classOfferingName={classOffering.name}
        allStudents={allStudents}
        enrolledStudentIds={enrolledStudentIds}
      />
      <RecordAbsenceModal
        isOpen={isRecordAbsenceModalOpen}
        onClose={() => setIsRecordAbsenceModalOpen(false)}
        onAbsenceRecorded={fetchClassData} 
        classOffering={classOffering}
        enrolledStudents={enrollments.filter(e => e.status === 'Enrolled')} 
      />
      {isRecordAttendanceModalOpen && selectedClassDateTime && (
        <RecordAttendanceModal
            isOpen={isRecordAttendanceModalOpen}
            onClose={() => setIsRecordAttendanceModalOpen(false)}
            onAttendanceRecorded={fetchAttendanceForSlot}
            classOffering={classOffering}
            enrolledStudents={enrolledStudentsList}
            classDateTime={selectedClassDateTime}
            initialRecord={selectedAttendanceRecord}
        />
      )}
    </div>
  );
};

export default ClassRosterPage;
