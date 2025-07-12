
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom'; // Updated for v6: useNavigate
import { v4 as uuidv4 } from 'uuid';
import { ClassOfferingFormData, Program, ProgramName, DancerLevelName, StudentGeneralLevel, ScheduledClassSlot, Instructor, StudioRoom } from '../../types';
import { STUDENT_GENERAL_LEVEL_OPTIONS, DAYS_OF_WEEK } from '../../constants';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, PlusCircleIcon, TrashIcon, CalendarIcon, TimesIcon, UserTieIcon } from '../../components/icons';
import { getClassOfferingById, createClassOffering, updateClassOffering, getPrograms, getInstructors, getCalendarSettings } from '../../services/apiService';
import { showToast } from '../../utils';

const initialOfferingState: ClassOfferingFormData = {
    name: '',
    category: '',
    level: 'Principiante',
    iconUrl: '',
    descriptionShort: '',
    descriptionLong: '',
    duration: '',
    price: '',
    capacity: 0, // Initialize capacity
    videoEmbedUrl: '',
    instructorName: '', // This will store the selected instructor's full name
    instructorBio: '',
    prerequisites: [],
    targetPrograms: [],
    targetDancerLevels: [],
    scheduledClassSlots: [],
};

const ClassOfferingFormPage: React.FC = () => {
  const { offeringId } = useParams<{ offeringId: string }>();
  const navigate = useNavigate(); 
  const isEditMode = Boolean(offeringId);

  const [formData, setFormData] = useState<ClassOfferingFormData>(initialOfferingState);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [availableInstructors, setAvailableInstructors] = useState<Instructor[]>([]);
  const [studioRooms, setStudioRooms] = useState<StudioRoom[]>([]);
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof ClassOfferingFormData | string, string | string[]>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [currentPrerequisite, setCurrentPrerequisite] = useState('');
  const [newSlot, setNewSlot] = useState<Partial<ScheduledClassSlot>>({ dayOfWeek: 1, startTime: '', endTime: '', room: ''});


  const fetchAndSetFormData = useCallback(async () => {
    setIsLoading(true);
    setSubmitError(null);
    try {
      const [programsData, instructorsData, calendarSettingsData] = await Promise.all([
        getPrograms(),
        getInstructors(),
        getCalendarSettings()
      ]);
      setAllPrograms(programsData);
      setAvailableInstructors(instructorsData);
      setStudioRooms(calendarSettingsData.rooms || []);

      if (isEditMode && offeringId) {
        const existingOffering = await getClassOfferingById(offeringId);
        setFormData({
          ...initialOfferingState,
          ...existingOffering,
          prerequisites: existingOffering.prerequisites || [],
          targetPrograms: existingOffering.targetPrograms || [],
          targetDancerLevels: existingOffering.targetDancerLevels || [],
          scheduledClassSlots: (existingOffering.scheduledClassSlots || []).map(dbSlot => ({
            ...dbSlot 
          })),
          instructorName: existingOffering.instructorName || '', 
          capacity: existingOffering.capacity || 0, // Ensure capacity is loaded
        });
      } else {
        setFormData(initialOfferingState);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch data.';
      setSubmitError(errorMsg);
      showToast(errorMsg, 'error');
      if (isEditMode) navigate('/classes/offerings'); 
    } finally {
      setIsLoading(false);
    }
  }, [offeringId, isEditMode, navigate]);

  useEffect(() => {
    fetchAndSetFormData();
  }, [fetchAndSetFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'instructorId_select') { 
        const selectedInstructor = availableInstructors.find(inst => inst.id === value);
        setFormData(prev => ({ 
            ...prev, 
            instructorName: selectedInstructor ? `${selectedInstructor.firstName} ${selectedInstructor.lastName}` : '' 
        }));
        if (formErrors.instructorName) {
            setFormErrors(prev => ({ ...prev, instructorName: undefined }));
        }
    } else {
        setFormData(prev => ({ 
            ...prev, 
            [name]: type === 'number' ? (parseInt(value, 10) || 0) : value 
        }));
        if (formErrors[name as keyof ClassOfferingFormData]) {
          setFormErrors(prev => ({ ...prev, [name]: undefined }));
        }
    }
  };

  const handleMultiSelectChange = (name: 'targetPrograms' | 'targetDancerLevels', selectedValue: string) => {
    setFormData(prev => {
      const currentValues = prev[name] || [];
      const newValues = currentValues.includes(selectedValue)
        ? currentValues.filter(v => v !== selectedValue)
        : [...currentValues, selectedValue];
      
      let updatedState = { ...prev, [name]: newValues };

      if (name === 'targetPrograms') {
        updatedState = { ...updatedState, targetDancerLevels: [] };
      }
      return updatedState;
    });
     if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  const handleAddPrerequisite = () => {
    if (!currentPrerequisite.trim()) return;
    setFormData(prev => ({
      ...prev,
      prerequisites: [...(prev.prerequisites || []), currentPrerequisite.trim()],
    }));
    setCurrentPrerequisite('');
  };

  const handleRemovePrerequisite = (prereqToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: (prev.prerequisites || []).filter(p => p !== prereqToRemove),
    }));
  };

  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewSlot(prev => ({ ...prev, [name]: name === 'dayOfWeek' ? parseInt(value) : value }));
  };

  const handleAddSlot = () => {
    if (!newSlot.startTime || !newSlot.endTime || !newSlot.room?.trim()) {
      showToast("Please fill all fields for the schedule slot.", "error");
      return;
    }
    if (newSlot.startTime >= newSlot.endTime) {
        showToast("End time must be after start time.", "error");
        return;
    }
    setFormData(prev => ({
      ...prev,
      scheduledClassSlots: [...prev.scheduledClassSlots, { ...newSlot, tempId: uuidv4() } as Partial<ScheduledClassSlot> & { tempId: string } ],
    }));
    setNewSlot({ dayOfWeek: 1, startTime: '', endTime: '', room: '' }); 
  };

  const handleRemoveSlot = (slotIdentifier: string) => { 
    setFormData(prev => ({
      ...prev,
      scheduledClassSlots: prev.scheduledClassSlots.filter(slot => (slot.id || slot.tempId) !== slotIdentifier),
    }));
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof ClassOfferingFormData | string, string | string[]>> = {};
    if (!formData.name.trim()) errors.name = "Class name is required.";
    if (!formData.category.trim()) errors.category = "Category is required.";
    if (!formData.level) errors.level = "General level is required.";
    if (!formData.descriptionShort.trim()) errors.descriptionShort = "Short description is required.";
    if (!formData.duration.trim()) errors.duration = "Duration is required.";
    if (!formData.price.trim()) errors.price = "Price is required.";
    if (!formData.instructorName.trim()) errors.instructorName = "Instructor name is required.";
    if (formData.capacity === undefined || formData.capacity < 0) errors.capacity = "Capacity must be a non-negative number.";
    else if (formData.capacity === 0) errors.capacity = "Capacity must be greater than 0 if specified, or leave default if no limit.";


    const slotErrorMessages: string[] = [];
    formData.scheduledClassSlots.forEach((slot, index) => {
        let currentSlotErrors: string[] = [];
        if (!slot.startTime || !slot.endTime) {
            currentSlotErrors.push(`Start and End time are required.`);
        } else if (slot.startTime >= slot.endTime) {
            currentSlotErrors.push(`End time must be after start time.`);
        }
        if (!slot.room?.trim()) {
            currentSlotErrors.push(`Room is required.`);
        }
        if (currentSlotErrors.length > 0) {
            slotErrorMessages[index] = `Slot ${index + 1} (${DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || 'N/A Day'}): ${currentSlotErrors.join(' ')}`;
        }
    });
    
    const validSlotErrors = slotErrorMessages.filter(e => e); 
    if (validSlotErrors.length > 0) {
        errors.scheduledClassSlots = validSlotErrors;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      showToast("Please correct the errors in the form.", "error");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    const payloadToSubmit: ClassOfferingFormData = {
      ...formData,
      capacity: Number(formData.capacity) // Ensure capacity is a number
    };

    try {
      if (isEditMode && offeringId) {
        await updateClassOffering(offeringId, payloadToSubmit);
        showToast(`Class offering "${formData.name}" updated successfully.`, 'success');
      } else {
        await createClassOffering(payloadToSubmit);
        showToast(`Class offering "${formData.name}" created successfully.`, 'success');
      }
      navigate('/classes/offerings'); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const programOptions = useMemo(() => {
    return allPrograms.map(p => ({ value: p.name, label: p.name }));
  }, [allPrograms]);

  const availableDancerLevels = useMemo(() => {
    if (!formData.targetPrograms || formData.targetPrograms.length === 0) {
      return [];
    }
    const levelsSet = new Set<DancerLevelName>();
    formData.targetPrograms.forEach(programName => {
      const program = allPrograms.find(p => p.name === programName);
      if (program && program.hasLevels && program.levels) {
        program.levels.forEach(level => levelsSet.add(level));
      }
    });
    return Array.from(levelsSet).sort().map(level => ({ value: level, label: level }));
  }, [formData.targetPrograms, allPrograms]);

  const instructorSelectOptions = useMemo(() => {
    return availableInstructors.map(inst => ({
      value: inst.id,
      label: `${inst.firstName} ${inst.lastName}`
    }));
  }, [availableInstructors]);

  const selectedInstructorIdForSelect = useMemo(() => {
    if (!formData.instructorName) return '';
    const instructor = availableInstructors.find(
      (inst) => `${inst.firstName} ${inst.lastName}` === formData.instructorName
    );
    return instructor ? instructor.id : '';
  }, [formData.instructorName, availableInstructors]);

  const roomOptions = useMemo(() => {
    if (studioRooms.length === 0) {
      return [{ value: '', label: 'No rooms configured' }];
    }
    return [
        { value: '', label: 'Select a room...' },
        ...studioRooms.map(room => ({ value: room.name, label: `${room.name} (Cap: ${room.capacity || 'N/A'})` }))
    ];
  }, [studioRooms]);


  if (isLoading) {
    return <div className="text-center p-10">Loading class offering data...</div>;
  }
   if (submitError && isEditMode && !formData.name && !isLoading) { 
      return <div className="text-center p-10 text-brand-error">Error: {submitError} <NavLink to="/classes/offerings" className="text-brand-primary underline ml-2">Go back</NavLink></div>;
  }

  return (
    <div className="space-y-6">
      <NavLink to="/classes/offerings" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Class Offerings
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <PencilIcon className="w-8 h-8 mr-3 text-brand-primary" />
        {isEditMode ? `Edit Class Offering: ${formData.name || ''}` : 'Add New Class Offering'}
      </h1>
      
      {submitError && !isLoading && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <Card title="Basic Information" icon={<PencilIcon className="text-brand-primary w-5 h-5" />} collapsible={false} className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
            <Input label="Class Name" id="name" name="name" value={formData.name} onChange={handleChange} error={formErrors.name as string} required disabled={isSubmitting}/>
            <Input label="Category" id="category" name="category" value={formData.category} onChange={handleChange} error={formErrors.category as string} required placeholder="e.g., Ballet, Jazz, Hip Hop" disabled={isSubmitting}/>
            <Select label="General Level" id="level" name="level" options={STUDENT_GENERAL_LEVEL_OPTIONS} value={formData.level} onChange={handleChange} error={formErrors.level as string} required disabled={isSubmitting}/>
            <Input label="Duration" id="duration" name="duration" value={formData.duration} onChange={handleChange} error={formErrors.duration as string} required placeholder="e.g., 1 hour, 45 minutes" disabled={isSubmitting}/>
            <Input label="Price" id="price" name="price" value={formData.price} onChange={handleChange} error={formErrors.price as string} required placeholder="e.g., $60/month, $20/class" disabled={isSubmitting}/>
            <Input 
              label="Maximum Capacity" 
              id="capacity" 
              name="capacity" 
              type="number" 
              value={String(formData.capacity)} // Input type number expects string value
              onChange={handleChange} 
              error={formErrors.capacity as string} 
              required 
              min="0"
              placeholder="e.g., 15"
              disabled={isSubmitting}
            />
            <Input label="Icon URL (Optional)" id="iconUrl" name="iconUrl" value={formData.iconUrl || ''} onChange={handleChange} disabled={isSubmitting} containerClassName="md:col-span-2 lg:col-span-full"/>
          </div>
        </Card>

        <Card title="Description & Media" icon={<i className="fas fa-file-alt text-brand-primary w-5 h-5"></i>} collapsible={false} className="mb-6">
            <Input 
                label="Short Description (for listings)" 
                id="descriptionShort" name="descriptionShort" 
                type="textarea" 
                value={formData.descriptionShort} onChange={handleChange} 
                error={formErrors.descriptionShort as string} required 
                rows={2} disabled={isSubmitting}
                placeholder="A brief summary of the class."
            />
            <Input 
                label="Long Description (for details page)" 
                id="descriptionLong" name="descriptionLong" 
                type="textarea" 
                value={formData.descriptionLong} onChange={handleChange} 
                rows={4} disabled={isSubmitting}
                placeholder="Detailed information about class content, goals, etc."
            />
            <Input label="Video Embed URL (Optional)" id="videoEmbedUrl" name="videoEmbedUrl" value={formData.videoEmbedUrl || ''} onChange={handleChange} placeholder="e.g., YouTube or Vimeo embed link" disabled={isSubmitting}/>
        </Card>

        <Card title="Instructor Details" icon={<UserTieIcon className="text-brand-primary w-5 h-5"/>} collapsible={false} className="mb-6">
            <Select 
                label="Instructor Name" 
                id="instructorId_select" 
                name="instructorId_select" 
                options={instructorSelectOptions} 
                value={selectedInstructorIdForSelect} 
                onChange={handleChange} 
                error={formErrors.instructorName as string} 
                required 
                disabled={isSubmitting || availableInstructors.length === 0}
                placeholderOption={availableInstructors.length === 0 ? "No instructors available" : "Select an instructor"}
            />
            <Input 
                label="Instructor Bio (Optional)" 
                id="instructorBio" name="instructorBio" 
                type="textarea"
                value={formData.instructorBio || ''} onChange={handleChange} 
                rows={3} disabled={isSubmitting}
                placeholder="Class-specific notes about the instructor or their role in this class."
            />
        </Card>

        <Card title="Prerequisites" icon={<i className="fas fa-tasks text-brand-primary w-5 h-5"></i>} collapsible={false} className="mb-6">
            <div className="flex items-start space-x-2">
                <Input
                    label="Add Prerequisite"
                    id="currentPrerequisite" name="currentPrerequisite"
                    value={currentPrerequisite} onChange={(e) => setCurrentPrerequisite(e.target.value)}
                    containerClassName="flex-grow mb-0"
                    placeholder="e.g., Min. 2 years ballet"
                    disabled={isSubmitting}
                />
                <Button type="button" variant="primary" onClick={handleAddPrerequisite} leftIcon={<PlusCircleIcon className="w-4 h-4"/>} disabled={!currentPrerequisite.trim() || isSubmitting} className="mt-6">Add</Button>
            </div>
            {(formData.prerequisites || []).length > 0 && (
                <ul className="mt-3 list-disc list-inside pl-1 space-y-1 bg-brand-neutral-50 p-3 rounded-md">
                    {(formData.prerequisites || []).map((prereq, index) => (
                        <li key={index} className="text-sm text-brand-text-secondary flex justify-between items-center">
                            {prereq}
                            <button type="button" onClick={() => handleRemovePrerequisite(prereq)} className="text-brand-error hover:text-brand-error-dark ml-2 p-0.5" disabled={isSubmitting}>
                                <TimesIcon className="w-3.5 h-3.5"/>
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </Card>

        <Card title="Target Audience" icon={<i className="fas fa-bullseye text-brand-primary w-5 h-5"></i>} collapsible={false} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Target Programs (Optional)</label>
                    <div className={`p-2 border rounded-md max-h-40 overflow-y-auto bg-white ${isSubmitting ? 'bg-brand-neutral-100' : 'border-brand-neutral-300'}`}>
                        {allPrograms.length > 0 ? allPrograms.map(program => (
                            <label key={program.id} className={`flex items-center space-x-2 text-sm p-1 rounded ${isSubmitting ? 'cursor-not-allowed text-brand-text-muted' : 'cursor-pointer hover:bg-brand-neutral-50 text-brand-text-secondary'}`}>
                                <input type="checkbox" value={program.name} checked={(formData.targetPrograms || []).includes(program.name)} onChange={() => handleMultiSelectChange('targetPrograms', program.name)} className="form-checkbox h-4 w-4 text-brand-primary" disabled={isSubmitting}/>
                                <span>{program.name}</span>
                            </label>
                        )) : <p className="text-xs text-brand-text-muted">No programs configured. Add programs first.</p>}
                    </div>
                     {formErrors.targetPrograms && <p className="mt-1 text-xs text-brand-error">{formErrors.targetPrograms as string}</p>}
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Target Dancer Levels (Optional)</label>
                    <div className={`p-2 border rounded-md max-h-40 overflow-y-auto bg-white ${isSubmitting || availableDancerLevels.length === 0 ? 'bg-brand-neutral-100' : 'border-brand-neutral-300'}`}>
                        {availableDancerLevels.length > 0 ? availableDancerLevels.map(level => (
                            <label key={level.value} className={`flex items-center space-x-2 text-sm p-1 rounded ${isSubmitting ? 'cursor-not-allowed text-brand-text-muted' : 'cursor-pointer hover:bg-brand-neutral-50 text-brand-text-secondary'}`}>
                                <input type="checkbox" value={level.value} checked={(formData.targetDancerLevels || []).includes(level.value)} onChange={() => handleMultiSelectChange('targetDancerLevels', level.value)} className="form-checkbox h-4 w-4 text-brand-primary" disabled={isSubmitting}/>
                                <span>{level.label}</span>
                            </label>
                        )) : <p className="text-xs text-brand-text-muted">Select target program(s) with defined levels to enable this.</p>}
                    </div>
                     {formErrors.targetDancerLevels && <p className="mt-1 text-xs text-brand-error">{formErrors.targetDancerLevels as string}</p>}
                </div>
            </div>
        </Card>

        <Card title="Class Schedule" icon={<CalendarIcon className="text-brand-primary w-5 h-5"/>} collapsible={false} className="mb-6">
            <div className="space-y-3 p-3 border rounded-md bg-brand-neutral-50/50">
                <h4 className="text-md font-medium text-brand-text-secondary mb-2">Add New Slot</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-end">
                    <Select label="Day" id="newSlotDayOfWeek" name="dayOfWeek" options={DAYS_OF_WEEK} value={newSlot.dayOfWeek || 1} onChange={handleNewSlotChange} containerClassName="mb-0" disabled={isSubmitting}/>
                    <Input label="Start Time" id="newSlotStartTime" name="startTime" type="time" value={newSlot.startTime || ''} onChange={handleNewSlotChange} containerClassName="mb-0" disabled={isSubmitting}/>
                    <Input label="End Time" id="newSlotEndTime" name="endTime" type="time" value={newSlot.endTime || ''} onChange={handleNewSlotChange} containerClassName="mb-0" disabled={isSubmitting}/>
                    <Select
                        label="Room"
                        id="newSlotRoom"
                        name="room"
                        options={roomOptions}
                        value={newSlot.room || ''}
                        onChange={handleNewSlotChange}
                        containerClassName="mb-0"
                        disabled={isSubmitting || studioRooms.length === 0}
                    />
                    <Button type="button" variant="primary" onClick={handleAddSlot} leftIcon={<PlusCircleIcon className="w-4 h-4"/>} disabled={isSubmitting} className="w-full sm:w-auto">Add Slot</Button>
                </div>
            </div>

            {(formData.scheduledClassSlots || []).length > 0 && (
                <div className="mt-4 space-y-2">
                    <h4 className="text-md font-medium text-brand-text-secondary mb-1">Current Slots:</h4>
                    {(formData.scheduledClassSlots || []).map((slot, index) => (
                        <div key={slot.id || slot.tempId || index} className="flex items-center justify-between p-2.5 bg-white border border-brand-neutral-200 rounded-md text-sm">
                            <span className="text-brand-text-secondary">
                                <strong className="text-brand-text-primary">{DAYS_OF_WEEK.find(d => d.value === slot.dayOfWeek)?.label || 'N/A Day'}:</strong> {slot.startTime} - {slot.endTime} in <strong className="text-brand-text-primary">{slot.room || 'N/A Room'}</strong>
                            </span>
                            <Button type="button" variant="danger" size="sm" onClick={() => handleRemoveSlot(slot.id || slot.tempId || String(index))} leftIcon={<TrashIcon className="w-3.5 h-3.5"/>} disabled={isSubmitting}>Remove</Button>
                        </div>
                    ))}
                </div>
            )}
            {Array.isArray(formErrors.scheduledClassSlots) && formErrors.scheduledClassSlots.length > 0 && (
                <div className="mt-2 text-xs text-brand-error space-y-0.5">
                    {(formErrors.scheduledClassSlots as string[]).map((err, i) => <p key={i}>{err}</p>)}
                </div>
            )}
        </Card>
          
        <div className="flex justify-end space-x-3 mt-8">
            <Button type="button" variant="outline" onClick={() => navigate('/classes/offerings')} disabled={isSubmitting}>Cancel</Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading} disabled={isSubmitting || isLoading}>
                {isEditMode ? 'Save Changes' : 'Create Class Offering'}
            </Button>
        </div>
      </form>
    </div>
  );
};

export default ClassOfferingFormPage;
