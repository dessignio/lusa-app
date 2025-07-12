

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom';
import { StudentFormData, Program, ProgramName, DancerLevelName, StudentStatus, Address, EmergencyContact, Student, Parent } from '../../types'; 
import { STUDENT_STATUS_OPTIONS, GENDER_OPTIONS } from '../../constants';
import Input from '../../components/forms/Input';
import Select from '../../components/forms/Select';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, UserShieldIcon, UserFriendsIcon, TimesIcon } from '../../components/icons';
import { getStudentById, createStudent, updateStudent, getPrograms, getParents } from '../../services/apiService';
import { showToast, calculateAge, resizeImage } from '../../utils';

const initialStudentFormData: StudentFormData = {
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '', 
    gender: undefined, 
    phone: '',
    profilePictureUrl: '',
    address: { street: '', city: '', state: '', zipCode: '' },
    emergencyContact: { name: '', phone: '', relationship: '' },
    program: null, 
    dancerLevel: null, 
    status: 'Activo', 
    enrolledClasses: [],
    notes: '',
    personalGoals: '',
    parentId: null,
};

const StudentFormPage: React.FC = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate(); 
  const isEditMode = Boolean(studentId);

  const [formData, setFormData] = useState<StudentFormData>(initialStudentFormData);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(null);
  const [profilePictureFile, setProfilePictureFile] = useState<File | null>(null);

  const [initialUsername, setInitialUsername] = useState<string | null | undefined>(null);
  const [availableLevels, setAvailableLevels] = useState<{ value: DancerLevelName, label: DancerLevelName }[]>([]);
  const [allPrograms, setAllPrograms] = useState<Program[]>([]);
  const [allParents, setAllParents] = useState<Parent[]>([]);
  
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StudentFormData | string, string>>>({});
  
  const [isLoading, setIsLoading] = useState(true); 
  const [isFetchingInitialData, setIsFetchingInitialData] = useState(true); 
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
        setIsFetchingInitialData(true); 
        setIsLoading(true); 
        setSubmitError(null);
        try {
            const [programsData, parentsData] = await Promise.all([
                getPrograms(),
                getParents()
            ]);
            setAllPrograms(programsData);
            setAllParents(parentsData);

            if (isEditMode && studentId) {
                const existingStudent = await getStudentById(studentId);
                setInitialUsername(existingStudent.username);
                const studentDataForForm: StudentFormData = {
                    ...initialStudentFormData,
                    ...existingStudent,
                    password: '', 
                    confirmPassword: '',
                    dateOfBirth: existingStudent.dateOfBirth ? existingStudent.dateOfBirth.split('T')[0] : '',
                    address: { ...(initialStudentFormData.address as Address), ...(existingStudent.address || {}) },
                    emergencyContact: { ...(initialStudentFormData.emergencyContact as EmergencyContact), ...(existingStudent.emergencyContact || {}) },
                    enrolledClasses: Array.isArray(existingStudent.enrolledClasses) ? existingStudent.enrolledClasses : [],
                    status: existingStudent.status || 'Activo',
                    parentId: existingStudent.parentId || null,
                };
                setFormData(studentDataForForm);
                if (existingStudent.profilePictureUrl) {
                  setProfilePicturePreview(existingStudent.profilePictureUrl);
                }
            } else {
                setFormData({...initialStudentFormData, enrolledClasses: [], status: 'Activo'});
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to fetch initial form data.';
            setSubmitError(errorMsg);
            showToast(errorMsg, 'error');
        } finally {
            setIsFetchingInitialData(false); 
            setIsLoading(false); 
        }
    };
    fetchInitialData();
  }, [studentId, isEditMode]); 


  useEffect(() => {
    if (allPrograms.length > 0) {
        const selectedProgramData = allPrograms.find(p => p.name === formData.program);
        if (selectedProgramData?.hasLevels && selectedProgramData.levels) {
            setAvailableLevels(selectedProgramData.levels.map(l => ({ value: l, label: l })));
        } else {
            setAvailableLevels([]);
        }
    } else {
         setAvailableLevels([]);
    }
  }, [formData.program, allPrograms]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const [field, subField] = name.split('.');

    setFormData(prev => {
      let newState: StudentFormData;
      if (subField && (field === 'address' || field === 'emergencyContact')) {
        newState = {
          ...prev,
          [field]: {
            ...(prev[field as keyof StudentFormData] as object), 
            [subField]: value
          }
        };
      } else if (name === 'program') { 
        const programValue = value as ProgramName | "";
        const newProgram = programValue === "" ? null : programValue;
        newState = { ...prev, program: newProgram, dancerLevel: null }; 
      } else if (name === 'dancerLevel') {
        const levelValue = value as DancerLevelName | "";
        newState = { ...prev, [name]: levelValue === "" ? null : levelValue };
      } else if (name === 'status') {
         newState = { ...prev, status: value as StudentStatus };
      }
      else {
        newState = { ...prev, [name]: value };
      }
      return newState;
    });
    
    if (formErrors[name as keyof StudentFormData | string]) { 
        setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      if (file.size > 5 * 1024 * 1024) { // 5MB limit before trying to resize
        showToast("File is too large (max 5MB). Please select a smaller image.", "error");
        return;
      }

      setProfilePictureFile(file);
      
      try {
        showToast("Processing image...", "info", 1500);
        const resizedBase64 = await resizeImage(file, 800, 800, 0.7);
        setProfilePicturePreview(resizedBase64);
        // The payload sent to the server will now be much smaller
      } catch (error) {
        showToast("Could not process image. Please try another file.", "error");
        console.error("Image resizing error:", error);
        setProfilePictureFile(null);
        setProfilePicturePreview(null);
      }

      if (formErrors.profilePictureUrl) setFormErrors(prev => ({...prev, profilePictureUrl: undefined}));
    }
  };


  const removeProfilePicture = () => {
    setProfilePictureFile(null);
    setProfilePicturePreview(null);
    setFormData(prev => ({ ...prev, profilePictureUrl: '' }));
  };


  const studentAge = useMemo(() => calculateAge(formData.dateOfBirth || ''), [formData.dateOfBirth]);
  const isUnderage = studentAge !== null && studentAge < 18;

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof StudentFormData | string, string>> = {};
    if (!formData.firstName?.trim()) errors.firstName = "First name is required.";
    if (!formData.lastName?.trim()) errors.lastName = "Last name is required.";
    if (!formData.email?.trim()) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = "Email is invalid.";
    
    const trimmedUsername = formData.username?.trim();
    if (trimmedUsername && trimmedUsername.length < 3) errors.username = "Username must be at least 3 characters.";
    else if (trimmedUsername && /\s/.test(trimmedUsername)) errors.username = "Username cannot contain spaces.";

    if (!isEditMode && !formData.password) errors.password = "Password is required for new students.";
    if (formData.password && formData.password.length < 6) errors.password = "Password must be at least 6 characters long.";
    if (formData.password && formData.password !== formData.confirmPassword) errors.confirmPassword = "Passwords do not match.";
    
    if (!formData.dateOfBirth) errors.dateOfBirth = "Date of birth is required.";
    
    if (isUnderage && !formData.parentId) {
        errors.parentId = "A parent is required for students under 18.";
    }

    if (!formData.program) errors.program = "Program is required.";
    
    const selectedProgramDetails = allPrograms.find(p => p.name === formData.program);
    if (selectedProgramDetails?.hasLevels && !formData.dancerLevel && (selectedProgramDetails.levels || []).length > 0) {
        errors.dancerLevel = "Level is required for this program.";
    }

    if (!formData.status) errors.status = "Status is required."; 
    
    if (!formData.address?.street?.trim()) errors["address.street"] = "Street is required.";
    if (!formData.address?.city?.trim()) errors["address.city"] = "City is required.";
    if (!formData.emergencyContact?.name?.trim()) errors["emergencyContact.name"] = "Emergency contact name is required.";
    if (!formData.emergencyContact?.phone?.trim()) errors["emergencyContact.phone"] = "Emergency contact phone is required.";
    
    // The file size check is now interactive in handleProfilePictureChange, so it's removed from here.
    if (profilePictureFile && !['image/jpeg', 'image/png', 'image/gif'].includes(profilePictureFile.type)){
        errors.profilePictureUrl = "Invalid file type. Allowed: JPG, PNG, GIF.";
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

    const payload: Partial<StudentFormData> = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        address: formData.address,
        emergencyContact: formData.emergencyContact,
        program: formData.program,
        dancerLevel: formData.dancerLevel,
        status: formData.status,
        notes: formData.notes,
        personalGoals: formData.personalGoals,
        parentId: formData.parentId,
    };
    
    if (profilePictureFile && profilePicturePreview && profilePicturePreview.startsWith('data:image')) {
      payload.profilePictureUrl = profilePicturePreview;
    } else if (!profilePicturePreview && !profilePictureFile) {
      payload.profilePictureUrl = '';
    } else {
        payload.profilePictureUrl = formData.profilePictureUrl;
    }

    if (formData.password) {
      payload.password = formData.password;
    }

    try {
      if (isEditMode && studentId) {
        await updateStudent(studentId, payload);
        showToast(`Student ${formData.firstName} ${formData.lastName} updated successfully.`, 'success');
      } else {
        await createStudent(payload as StudentFormData);
        showToast(`Student ${formData.firstName} ${formData.lastName} created successfully.`, 'success');
      }
      navigate('/users/students'); 
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'An unknown error occurred during submission.');
      showToast(`Operation failed: ${err instanceof Error ? err.message : 'Unknown error'}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const programOptions = useMemo(() => {
      return allPrograms.map(p => ({ value: p.name, label: p.name }))
  }, [allPrograms]);
  
  const parentOptions = useMemo(() => {
      return allParents.map(p => ({ value: p.id, label: `${p.firstName} ${p.lastName} (${p.email})` }))
  }, [allParents]);

  const statusSelectOptions = STUDENT_STATUS_OPTIONS.map(opt => ({
    value: opt.value, 
    label: opt.label,
  }));

  if (isFetchingInitialData) {
    return <div className="text-center p-10 text-brand-text-secondary">Loading student data...</div>;
  }
  
  if (submitError && isEditMode && !formData.firstName) { 
      return (
        <div className="text-center p-10">
          <p className="text-brand-error mb-4">Error loading student details: {submitError}</p>
          <NavLink to="/users/students" className="text-brand-primary underline hover:text-brand-primary-dark">
            Go back to Student List
          </NavLink>
        </div>
      );
  }

  const selectedProgramDetails = allPrograms.find(p => p.name === formData.program);

  return (
    <div className="space-y-6">
      <NavLink to="/users/students" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Student List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">
        {isEditMode ? `Edit Student: ${formData.firstName || ''} ${formData.lastName || ''}` : 'Add New Student'}
      </h1>
      
      {submitError && (formData.firstName || !isEditMode) && 
        <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm">{submitError}</div>
      }

      <form onSubmit={handleSubmit}>
        <Card 
          title="Student Details" 
          icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5" /> : <UserPlusIcon className="text-brand-primary w-5 h-5" />}
          collapsible={false}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
            <Input label="First Name" id="firstName" name="firstName" value={formData.firstName || ''} onChange={handleChange} error={formErrors.firstName} required disabled={isSubmitting || isLoading}/>
            <Input label="Last Name" id="lastName" name="lastName" value={formData.lastName || ''} onChange={handleChange} error={formErrors.lastName} required disabled={isSubmitting || isLoading}/>
            <Input label="Email" id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} error={formErrors.email} required disabled={isSubmitting || isLoading}/>
            <Input label="Date of Birth" id="dateOfBirth" name="dateOfBirth" type="date" value={formData.dateOfBirth || ''} onChange={handleChange} error={formErrors.dateOfBirth} required disabled={isSubmitting || isLoading}/>
            <Select label="Gender" id="gender" name="gender" options={GENDER_OPTIONS} value={formData.gender || ''} onChange={handleChange} placeholderOption="Select gender" error={formErrors.gender as string} disabled={isSubmitting || isLoading}/>
            <Input label="Phone" id="phone" name="phone" type="tel" value={formData.phone || ''} onChange={handleChange} error={formErrors.phone} disabled={isSubmitting || isLoading}/>
          </div>
          <div className="mt-4 pt-4 border-t border-brand-neutral-200">
             <label className="block text-sm font-medium text-brand-text-secondary mb-1">Profile Picture</label>
             <div className="flex items-center space-x-4">
                {profilePicturePreview ? (
                  <div className="relative group">
                      <img src={profilePicturePreview} alt="Profile preview" className="h-24 w-24 rounded-full object-cover border-2 border-brand-neutral-200 shadow-sm"/>
                      <button type="button" onClick={removeProfilePicture} className="absolute top-0 right-0 bg-brand-error text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100" aria-label="Remove image" disabled={isSubmitting}>
                          <TimesIcon className="w-3.5 h-3.5"/>
                      </button>
                  </div>
                ) : <div className="h-24 w-24 rounded-full bg-brand-neutral-200 flex items-center justify-center text-brand-text-muted">No Image</div>}
                
                <Input type="file" id="profilePictureFile" name="profilePictureFile" label={profilePicturePreview ? "Change Picture" : "Upload Picture"} onChange={handleProfilePictureChange} accept="image/png, image/jpeg, image/gif" error={formErrors.profilePictureUrl} disabled={isSubmitting} containerClassName="w-full max-w-sm mb-0"/>
             </div>
          </div>
        </Card>

        {isUnderage && (
            <Card title="Parent/Guardian Information" icon={<UserFriendsIcon className="text-brand-primary w-5 h-5" />} collapsible={false} className="mb-6">
                 <p className="text-xs text-brand-text-muted mb-2">
                    A parent or guardian must be assigned for students under 18 years of age.
                 </p>
                 <Select
                    label="Assigned Parent"
                    id="parentId"
                    name="parentId"
                    options={parentOptions}
                    value={formData.parentId || ''}
                    onChange={handleChange}
                    error={formErrors.parentId}
                    required={isUnderage}
                    disabled={isSubmitting || isLoading || allParents.length === 0}
                    placeholderOption={allParents.length === 0 ? "No parents available" : "Select a parent..."}
                />
            </Card>
        )}

        <Card title="Login Credentials" icon={<UserShieldIcon className="text-brand-primary w-5 h-5" />} collapsible={false} className="mb-6">
            <p className="text-xs text-brand-text-muted mb-3">
                {isEditMode ? "Leave password fields blank to keep the current password. Username cannot be changed after creation." : "Password is required for new students. Username is optional but recommended for student login."}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                <Input 
                    label="Username (Optional)" 
                    id="username" 
                    name="username" 
                    value={formData.username || ''} 
                    onChange={handleChange} 
                    error={formErrors.username} 
                    disabled={isSubmitting || isLoading || (isEditMode && !!initialUsername)} 
                    placeholder="e.g., student.name"
                />
                 <Input 
                    label={isEditMode ? "New Password (Optional)" : "Password"}
                    id="password" 
                    name="password" 
                    type="password" 
                    value={formData.password || ''} 
                    onChange={handleChange} 
                    error={formErrors.password} 
                    required={!isEditMode} 
                    disabled={isSubmitting || isLoading}
                />
                <Input 
                    label={isEditMode ? "Confirm New Password" : "Confirm Password"}
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    value={formData.confirmPassword || ''} 
                    onChange={handleChange} 
                    error={formErrors.confirmPassword} 
                    required={!isEditMode && !!formData.password} 
                    disabled={isSubmitting || isLoading}
                />
            </div>
        </Card>

        <Card title="Address" collapsible={false} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                <Input label="Street" id="address.street" name="address.street" value={formData.address?.street || ''} onChange={handleChange} error={formErrors["address.street"]} disabled={isSubmitting || isLoading}/>
                <Input label="City" id="address.city" name="address.city" value={formData.address?.city || ''} onChange={handleChange} error={formErrors["address.city"]} disabled={isSubmitting || isLoading}/>
                <Input label="State" id="address.state" name="address.state" value={formData.address?.state || ''} onChange={handleChange} error={formErrors["address.state"]} disabled={isSubmitting || isLoading}/>
                <Input label="Zip Code" id="address.zipCode" name="address.zipCode" value={formData.address?.zipCode || ''} onChange={handleChange} error={formErrors["address.zipCode"]} disabled={isSubmitting || isLoading}/>
            </div>
        </Card>

        <Card title="Emergency Contact" collapsible={false} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                <Input label="Contact Name" id="emergencyContact.name" name="emergencyContact.name" value={formData.emergencyContact?.name || ''} onChange={handleChange} error={formErrors["emergencyContact.name"]} disabled={isSubmitting || isLoading}/>
                <Input label="Contact Phone" id="emergencyContact.phone" name="emergencyContact.phone" type="tel" value={formData.emergencyContact?.phone || ''} onChange={handleChange} error={formErrors["emergencyContact.phone"]} disabled={isSubmitting || isLoading}/>
                <Input label="Relationship" id="emergencyContact.relationship" name="emergencyContact.relationship" value={formData.emergencyContact?.relationship || ''} onChange={handleChange} error={formErrors["emergencyContact.relationship"]} disabled={isSubmitting || isLoading}/>
            </div>
        </Card>
        
        <Card title="Enrollment Details" collapsible={false} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-0">
                <Select 
                    label="Program" 
                    id="program" 
                    name="program" 
                    options={isLoading || allPrograms.length === 0 ? [{value: '', label: 'Loading programs...'}] : programOptions} 
                    value={formData.program || ''} 
                    onChange={handleChange} 
                    placeholderOption="Select a program" 
                    error={formErrors.program} 
                    required 
                    disabled={isSubmitting || isLoading || allPrograms.length === 0}
                />
                
                {selectedProgramDetails?.hasLevels && (
                    <Select 
                        label="Level" 
                        id="dancerLevel" 
                        name="dancerLevel" 
                        options={availableLevels} 
                        value={formData.dancerLevel || ''} 
                        onChange={handleChange} 
                        placeholderOption={(selectedProgramDetails.levels && selectedProgramDetails.levels.length > 0) ? "Select a level" : "No levels defined for program"}
                        error={formErrors.dancerLevel} 
                        required={selectedProgramDetails?.hasLevels && (selectedProgramDetails.levels || []).length > 0}
                        disabled={isSubmitting || isLoading || availableLevels.length === 0}
                    />
                )}
                 {selectedProgramDetails?.hasLevels && (!selectedProgramDetails.levels || selectedProgramDetails.levels.length === 0) && ( 
                    <div className="text-brand-text-muted text-sm p-3 border border-brand-neutral-200 rounded-md bg-brand-neutral-50 md:col-start-2 flex items-center justify-center h-full">
                        This program has no levels defined yet.
                    </div>
                )}
                <Select label="Status" id="status" name="status" options={statusSelectOptions} value={formData.status || 'Activo'} onChange={handleChange} error={formErrors.status} required disabled={isSubmitting || isLoading}/>
            </div>
        </Card>

        <Card title="Additional Information" collapsible={false} className="mb-6">
             <div className="grid grid-cols-1 gap-x-6 gap-y-0">
                <div className="mb-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-brand-text-secondary mb-1">Notes</label>
                    <textarea id="notes" name="notes" rows={3} value={formData.notes || ''} onChange={handleChange} className={`block w-full px-3 py-2 border bg-white rounded-md shadow-sm text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light ${(isSubmitting || isLoading) ? 'bg-brand-neutral-100' : 'border-brand-neutral-300'}`} disabled={isSubmitting || isLoading}/>
                </div>
                 <div className="mb-4">
                    <label htmlFor="personalGoals" className="block text-sm font-medium text-brand-text-secondary mb-1">Personal Goals</label>
                    <textarea id="personalGoals" name="personalGoals" rows={3} value={formData.personalGoals || ''} onChange={handleChange} className={`block w-full px-3 py-2 border bg-white rounded-md shadow-sm text-sm text-brand-text-primary focus:outline-none focus:ring-2 focus:ring-brand-primary-light focus:border-brand-primary-light ${(isSubmitting || isLoading) ? 'bg-brand-neutral-100' : 'border-brand-neutral-300'}`} disabled={isSubmitting || isLoading}/>
                </div>
            </div>
        </Card>
          
        <div className="flex justify-end space-x-3 mt-4">
            <Button type="button" variant="outline" onClick={() => navigate('/users/students')} disabled={isSubmitting || isLoading}>
                Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting || isLoading} disabled={isSubmitting || isLoading}>
                {isEditMode ? 'Save Changes' : 'Create Student'}
            </Button>
        </div>
        </form>
    </div>
  );
};

export default StudentFormPage;
