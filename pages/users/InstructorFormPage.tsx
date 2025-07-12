
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom'; // Updated for v6: useNavigate
import { Instructor, Program, ProgramName, InstructorAvailabilitySlot } from '../../types';
import { DAYS_OF_WEEK } from '../../constants';
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, PlusCircleIcon, TrashIcon, UserTieIcon } from '../../components/icons';
import { getInstructorById, createInstructor, updateInstructor, getPrograms } from '../../services/apiService';
import { v4 as uuidv4 } from 'uuid';
import { showToast } from '../../utils';

const initialInstructorState: Partial<Instructor> = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    profilePictureUrl: '',
    bio: '',
    specializations: [],
    availability: [],
};

const InstructorFormPage: React.FC = () => {
  const { instructorId } = useParams<{ instructorId: string }>();
  const navigate = useNavigate(); 
  const isEditMode = Boolean(instructorId);

  const [instructor, setInstructor] = useState<Partial<Instructor>>(initialInstructorState);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [formErrors, setFormErrors] = useState<Partial<Record<string, string | Record<string, string[]>> >>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingPrograms, setIsFetchingPrograms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFormData = async () => {
      setIsLoading(true);
      setIsFetchingPrograms(true);
      setSubmitError(null);
      try {
        const programsData = await getPrograms();
        setAllPrograms(programsData);
        setIsFetchingPrograms(false);

        if (isEditMode && instructorId) {
          const existingInstructor = await getInstructorById(instructorId);
          if (!existingInstructor) throw new Error("Instructor not found");
          setInstructor({
            ...initialInstructorState, 
            ...existingInstructor,
            availability: (existingInstructor.availability || []).map(slot => ({...slot, id: slot.id || uuidv4() })) 
          });
        } else {
          setInstructor({...initialInstructorState, availability: []}); 
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch form data.';
        setSubmitError(errorMsg);
        showToast(errorMsg, 'error');
        console.error(err);
        if (isEditMode) navigate('/users/instructors'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchFormData();
  }, [instructorId, isEditMode, navigate]);
  

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setInstructor(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSpecializationChange = (programName: ProgramName) => {
    setInstructor(prev => {
        const currentSpecializations = prev.specializations || [];
        const newSpecializations = currentSpecializations.includes(programName)
            ? currentSpecializations.filter(s => s !== programName)
            : [...currentSpecializations, programName];
        return { ...prev, specializations: newSpecializations };
    });
    if (formErrors.specializations) {
      setFormErrors(prev => ({ ...prev, specializations: undefined }));
    }
  };

  const handleAvailabilityChange = (slotId: string, field: keyof Omit<InstructorAvailabilitySlot, 'id'>, value: string | number) => {
    setInstructor(prev => ({
        ...prev,
        availability: (prev.availability || []).map(slot => 
            slot.id === slotId ? { ...slot, [field]: value } : slot
        )
    }));
  };

  const addAvailabilitySlot = (day: number) => {
    const newSlot: InstructorAvailabilitySlot = {
        id: uuidv4(),
        dayOfWeek: day,
        startTime: '',
        endTime: ''
    };
    setInstructor(prev => ({ ...prev, availability: [...(prev.availability || []), newSlot] }));
  };

  const removeAvailabilitySlot = (slotId: string) => {
    setInstructor(prev => ({
        ...prev,
        availability: (prev.availability || []).filter(slot => slot.id !== slotId)
    }));
  };
  
  const validateForm = (): boolean => {
    const errors: Partial<Record<string, string | Record<string, string[]>>> = {};
    if (!instructor.firstName?.trim()) errors.firstName = "First name is required.";
    if (!instructor.lastName?.trim()) errors.lastName = "Last name is required.";
    if (!instructor.email?.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(instructor.email)) errors.email = "Email is invalid.";
    if (!instructor.specializations || instructor.specializations.length === 0) {
        errors.specializations = "At least one specialization is required.";
    }

    const availabilityErrors: Record<string, string[]> = {};
    (instructor.availability || []).forEach(slot => {
        if (slot.startTime && slot.endTime && slot.startTime >= slot.endTime) {
            if (!availabilityErrors[slot.id]) availabilityErrors[slot.id] = [];
            availabilityErrors[slot.id].push("End time must be after start time.");
        }
        if (slot.startTime && !slot.endTime) {
             if (!availabilityErrors[slot.id]) availabilityErrors[slot.id] = [];
            availabilityErrors[slot.id].push("End time is required if start time is set.");
        }
        if (!slot.startTime && slot.endTime) {
             if (!availabilityErrors[slot.id]) availabilityErrors[slot.id] = [];
            availabilityErrors[slot.id].push("Start time is required if end time is set.");
        }
    });
    if (Object.keys(availabilityErrors).length > 0) {
        errors.availability = availabilityErrors;
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

    const completeAvailabilitySlots = (instructor.availability || [])
        .filter(slot => slot.startTime && slot.endTime); 

    const instructorDataToSubmit: Partial<Instructor> = {
      ...instructor,
      availability: completeAvailabilitySlots, 
    };

    try {
      if (isEditMode && instructorId) {
        await updateInstructor(instructorId, instructorDataToSubmit);
        showToast(`Instructor ${instructor.firstName} ${instructor.lastName} updated successfully.`, 'success');
      } else {
        await createInstructor(instructorDataToSubmit);
        showToast(`Instructor ${instructor.firstName} ${instructor.lastName} created successfully.`, 'success');
      }
      navigate('/users/instructors'); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred during submission.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const programCheckboxOptions = useMemo(() => {
    return allPrograms.map(p => ({ value: p.name, label: p.name }));
  }, [allPrograms]);

  if (isLoading && isEditMode) {
    return <div className="text-center p-10">Loading instructor data...</div>;
  }
   if (submitError && isEditMode && !instructor.id && !isLoading) { 
      return <div className="text-center p-10 text-brand-error">Error: {submitError} <NavLink to="/users/instructors" className="text-brand-primary underline ml-2">Go back</NavLink></div>;
  }

  return (
    <div className="space-y-6">
      <NavLink to="/users/instructors" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Instructor List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
        <UserTieIcon className="w-8 h-8 mr-3 text-brand-primary" />
        {isEditMode ? `Edit Instructor: ${instructor.firstName || ''} ${instructor.lastName || ''}` : 'Add New Instructor'}
      </h1>
      
      {submitError && !isLoading && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <Card 
          title="Instructor Details" 
          icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5" /> : <UserPlusIcon className="text-brand-primary w-5 h-5" />}
          collapsible={false}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
            <Input label="First Name" id="firstName" name="firstName" value={instructor.firstName || ''} onChange={handleChange} error={formErrors.firstName as string} required disabled={isSubmitting}/>
            <Input label="Last Name" id="lastName" name="lastName" value={instructor.lastName || ''} onChange={handleChange} error={formErrors.lastName as string} required disabled={isSubmitting}/>
            <Input label="Email" id="email" name="email" type="email" value={instructor.email || ''} onChange={handleChange} error={formErrors.email as string} required disabled={isSubmitting}/>
            <Input label="Phone (Optional)" id="phone" name="phone" type="tel" value={instructor.phone || ''} onChange={handleChange} error={formErrors.phone as string} disabled={isSubmitting}/>
            <Input label="Profile Picture URL (Optional)" id="profilePictureUrl" name="profilePictureUrl" value={instructor.profilePictureUrl || ''} onChange={handleChange} containerClassName="md:col-span-2" error={formErrors.profilePictureUrl as string} disabled={isSubmitting}/>
            <div className="md:col-span-full">
                <label htmlFor="bio" className="block text-sm font-medium text-brand-text-secondary mb-1">Bio (Optional)</label>
                <textarea id="bio" name="bio" rows={4} value={instructor.bio || ''} onChange={handleChange} className={`block w-full px-3 py-2 border bg-white rounded-md shadow-sm text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light ${isSubmitting ? 'bg-brand-neutral-100' : 'border-brand-neutral-300'}`} disabled={isSubmitting}/>
            </div>
          </div>
        </Card>

        <Card title="Specializations" collapsible={false} className="mb-6">
            <div className="mb-2">
                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Select applicable programs:</label>
                 {isFetchingPrograms && <p className="text-sm text-brand-text-muted">Loading programs...</p>}
                 {!isFetchingPrograms && allPrograms.length === 0 && <p className="text-sm text-brand-text-muted">No programs available to select.</p>}
                 {!isFetchingPrograms && allPrograms.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 p-2 border rounded-md bg-white border-brand-neutral-300">
                        {programCheckboxOptions.map(option => (
                            <label key={option.value} className={`flex items-center space-x-2 text-sm p-1.5 rounded ${isSubmitting ? 'cursor-not-allowed text-brand-text-muted' : 'cursor-pointer hover:bg-brand-neutral-50 text-brand-text-secondary'}`}>
                                <input
                                    type="checkbox"
                                    value={option.value}
                                    checked={(instructor.specializations || []).includes(option.value)}
                                    onChange={() => handleSpecializationChange(option.value)}
                                    className="form-checkbox h-4 w-4 text-brand-primary rounded border-brand-neutral-400 focus:ring-brand-primary-light"
                                    disabled={isSubmitting}
                                />
                                <span>{option.label}</span>
                            </label>
                        ))}
                    </div>
                 )}
                {formErrors.specializations && <p className="mt-1 text-xs text-brand-error">{formErrors.specializations as string}</p>}
            </div>
        </Card>
        
        <Card title="Weekly Availability" collapsible={false} className="mb-6">
            <div className="space-y-4">
                {DAYS_OF_WEEK.map(day => (
                    <div key={day.value} className="p-3 border rounded-md bg-brand-neutral-50/50 border-brand-neutral-200">
                        <div className="flex justify-between items-center mb-2">
                            <h4 className="font-medium text-brand-text-primary">{day.label}</h4>
                            <Button type="button" variant="outline" size="sm" onClick={() => addAvailabilitySlot(day.value)} leftIcon={<PlusCircleIcon className="w-4 h-4"/>} disabled={isSubmitting}>
                                Add Slot
                            </Button>
                        </div>
                        {(instructor.availability || []).filter(slot => slot.dayOfWeek === day.value).map((slot, index) => (
                            <div key={slot.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end mb-2 p-2 border-b border-brand-neutral-100 last:border-b-0">
                                <Input 
                                    label={`Start Time ${index + 1}`} 
                                    id={`start-${slot.id}`} type="time" 
                                    value={slot.startTime} 
                                    onChange={(e) => handleAvailabilityChange(slot.id, 'startTime', e.target.value)}
                                    error={(formErrors.availability as Record<string, string[] | undefined>)?.[slot.id]?.find(msg => msg.includes("Start time"))}
                                    containerClassName="mb-0" disabled={isSubmitting}
                                />
                                <Input 
                                    label={`End Time ${index + 1}`} 
                                    id={`end-${slot.id}`} type="time" 
                                    value={slot.endTime} 
                                    onChange={(e) => handleAvailabilityChange(slot.id, 'endTime', e.target.value)}
                                    error={(formErrors.availability as Record<string, string[] | undefined>)?.[slot.id]?.find(msg => msg.includes("End time"))}
                                    containerClassName="mb-0" disabled={isSubmitting}
                                />
                                <Button type="button" variant="danger" size="sm" onClick={() => removeAvailabilitySlot(slot.id)} leftIcon={<TrashIcon className="w-3 h-3" />} disabled={isSubmitting} className="w-full sm:w-auto self-end mb-0 sm:mb-[1.125rem]"> 
                                    Remove
                                 </Button>
                                 {(formErrors.availability as Record<string, string[] | undefined>)?.[slot.id]?.map((err, i) => (
                                    !err.includes("Start time") && !err.includes("End time") && <p key={i} className="text-xs text-brand-error col-span-full mt-0.5">{err}</p>
                                ))}
                            </div>
                        ))}
                        {(instructor.availability || []).filter(slot => slot.dayOfWeek === day.value).length === 0 && (
                            <p className="text-xs text-brand-text-muted text-center py-2">No availability slots for {day.label}.</p>
                        )}
                    </div>
                ))}
            </div>
        </Card>
          
        <div className="flex justify-end space-x-3 mt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/users/instructors')} disabled={isSubmitting}>
                Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading} disabled={isSubmitting || isLoading}>
                {isEditMode ? 'Save Changes' : 'Create Instructor'}
            </Button>
        </div>
        </form>
    </div>
  );
};

export default InstructorFormPage;
