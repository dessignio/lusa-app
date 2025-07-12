
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, NavLink } from 'react-router-dom'; // Updated for v6: useNavigate
import { Program } from '../../types'; 
import Input from '../../components/forms/Input';
import Button from '../../components/forms/Button';
import Card from '../../components/Card';
import { UserPlusIcon, PencilIcon, ChevronLeftIcon, PlusCircleIcon, TimesIcon } from '../../components/icons';
import { getProgramById, createProgram, updateProgram } from '../../services/apiService';
import { showToast } from '../../utils';

const initialProgramState: Partial<Program> = {
    name: '', 
    ageRange: '',
    hasLevels: false,
    levels: [],
};

const ProgramFormPage: React.FC = () => {
  const { programId } = useParams<{ programId: string }>();
  const navigate = useNavigate(); 
  const isEditMode = Boolean(programId);

  const [program, setProgram] = useState<Partial<Program>>(initialProgramState);
  const [currentLevelInput, setCurrentLevelInput] = useState('');
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof Program | 'currentLevel', string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProgramData = async (id: string) => {
      setIsLoading(true);
      setSubmitError(null);
      try {
        const existingProgram = await getProgramById(id);
        if (!existingProgram) throw new Error("Program not found");
        setProgram({
            ...initialProgramState, 
            ...existingProgram,
            levels: existingProgram.levels || [], 
            hasLevels: existingProgram.hasLevels || false,
        });
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch program data.';
        setSubmitError(errorMsg);
        showToast(errorMsg, 'error');
        if (isEditMode) navigate('/classes/programs'); 
      } finally {
        setIsLoading(false);
      }
    };

    if (isEditMode && programId) {
      fetchProgramData(programId);
    } else {
      setProgram(initialProgramState);
    }
  }, [programId, isEditMode, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    const checked = (e.target as HTMLInputElement).checked; 

    setProgram(prev => {
        const newState = { 
            ...prev, 
            [name]: type === 'checkbox' ? checked : value 
        };
        if (name === 'hasLevels' && !checked) {
            newState.levels = [];
        }
        return newState;
    });

    if (formErrors[name as keyof Program]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  const handleAddLevel = () => {
    if (!currentLevelInput.trim()) {
        setFormErrors(prev => ({ ...prev, currentLevel: 'Level name cannot be empty.'}));
        return;
    }
    if ((program.levels || []).includes(currentLevelInput.trim())) {
        setFormErrors(prev => ({ ...prev, currentLevel: 'This level already exists.'}));
        return;
    }
    setProgram(prev => ({
        ...prev,
        levels: [...(prev.levels || []), currentLevelInput.trim()]
    }));
    setCurrentLevelInput('');
    setFormErrors(prev => ({ ...prev, currentLevel: undefined, levels: undefined }));
  };

  const handleRemoveLevel = (levelToRemove: string) => {
    setProgram(prev => ({
        ...prev,
        levels: (prev.levels || []).filter(level => level !== levelToRemove)
    }));
  };


  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof Program | 'currentLevel', string>> = {};
    if (!program.name?.trim()) {
        errors.name = "Program name is required.";
    }
    if (!program.ageRange?.trim()) errors.ageRange = "Age range is required.";
    
    if (program.hasLevels && (!program.levels || program.levels.length === 0)) {
        errors.levels = "At least one level must be added if 'Has Levels' is checked.";
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

    const programDataToSubmit: Partial<Program> = {
        name: program.name,
        ageRange: program.ageRange,
        hasLevels: program.hasLevels || false,
        levels: program.hasLevels ? (program.levels || []) : [],
    };
    
    if (isEditMode && programId) {
        programDataToSubmit.id = programId; 
    } else {
        delete programDataToSubmit.id; 
    }
    

    try {
      if (isEditMode && programId) {
        await updateProgram(programId, programDataToSubmit);
        showToast(`Program "${program.name}" updated successfully.`, 'success');
      } else {
        await createProgram(programDataToSubmit); 
        showToast(`Program "${program.name}" created successfully.`, 'success');
      }
      navigate('/classes/programs'); 
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An unknown error occurred.';
      setSubmitError(errorMsg);
      showToast(`Operation failed: ${errorMsg}`, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isLoading && isEditMode) {
    return <div className="text-center p-10">Loading program data...</div>;
  }
 
  return (
    <div className="space-y-6">
      <NavLink to="/classes/programs" className="inline-flex items-center text-brand-primary hover:text-brand-primary-dark text-sm mb-2">
        <ChevronLeftIcon className="w-5 h-5 mr-1" />
        Back to Program List
      </NavLink>
      <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary flex items-center">
         <i className="fas fa-sitemap fa-fw mr-3 text-brand-primary"></i>
        {isEditMode ? `Edit Program: ${program.name || ''}` : 'Add New Program'}
      </h1>
      
      {submitError && !isLoading && <div className="p-3 bg-brand-error-light text-brand-error-dark rounded-md text-sm mb-4">{submitError}</div>}

      <form onSubmit={handleSubmit}>
        <Card 
          title="Program Details" 
          icon={isEditMode ? <PencilIcon className="text-brand-primary w-5 h-5" /> : <UserPlusIcon className="text-brand-primary w-5 h-5" />}
          collapsible={false}
          className="mb-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <Input 
                label="Program Name" 
                id="name" 
                name="name" 
                value={program.name || ''} 
                onChange={handleChange} 
                error={formErrors.name} 
                required 
                disabled={isSubmitting || isEditMode} 
                placeholder="e.g., Ballet Foundations, Adult Jazz"
            />
            
            <Input 
                label="Age Range" 
                id="ageRange" 
                name="ageRange" 
                value={program.ageRange || ''} 
                onChange={handleChange} 
                error={formErrors.ageRange} 
                required 
                disabled={isSubmitting} 
                placeholder="e.g., 5-7 years, 18+ years"
            />
            
            <div className="md:col-span-2 mt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                        type="checkbox"
                        id="hasLevels"
                        name="hasLevels"
                        checked={program.hasLevels || false}
                        onChange={handleChange}
                        className="form-checkbox h-5 w-5 text-brand-primary rounded border-brand-neutral-400 focus:ring-brand-primary-light"
                        disabled={isSubmitting}
                    />
                    <span className="text-sm font-medium text-brand-text-secondary">This program uses specific levels</span>
                </label>
            </div>

            {program.hasLevels && (
              <div className="md:col-span-2 mt-2 space-y-3 p-4 border border-brand-neutral-200 rounded-md bg-brand-neutral-50/50">
                <label className="block text-sm font-medium text-brand-text-secondary">Manage Levels</label>
                <div className="flex items-end space-x-2">
                  <Input
                    id="currentLevelInput"
                    name="currentLevelInput"
                    placeholder="Enter level name (e.g., Beginner)"
                    value={currentLevelInput}
                    onChange={(e) => {
                        setCurrentLevelInput(e.target.value);
                        if (formErrors.currentLevel) setFormErrors(prev => ({...prev, currentLevel: undefined}));
                    }}
                    error={formErrors.currentLevel}
                    containerClassName="mb-0 flex-grow"
                    disabled={isSubmitting}
                  />
                  <Button 
                    type="button" 
                    variant="primary" 
                    onClick={handleAddLevel} 
                    leftIcon={<PlusCircleIcon className="w-4 h-4"/>} 
                    disabled={isSubmitting || !currentLevelInput.trim()} 
                    className="shrink-0 self-end mb-0"
                  > 
                    Add Level
                  </Button>
                </div>

                { (program.levels && program.levels.length > 0) && (
                    <div className="flex flex-wrap gap-2 mt-2">
                        {program.levels.map(level => (
                            <span key={level} className="flex items-center bg-brand-primary text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                                {level}
                                <button 
                                    type="button" 
                                    onClick={() => handleRemoveLevel(level)} 
                                    className="ml-2 text-brand-primary-light hover:text-white"
                                    aria-label={`Remove level ${level}`}
                                    disabled={isSubmitting}
                                >
                                    <TimesIcon className="w-3 h-3"/>
                                </button>
                            </span>
                        ))}
                    </div>
                )}
                {formErrors.levels && <p className="mt-1 text-xs text-brand-error">{formErrors.levels}</p>}
              </div>
            )}
          </div>
        </Card>
          
        <div className="flex justify-end space-x-3 mt-6">
          <Button type="button" variant="outline" onClick={() => navigate('/classes/programs')} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
            {isEditMode ? 'Save Changes' : 'Create Program'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ProgramFormPage;
