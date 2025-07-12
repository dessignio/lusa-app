import React, { useState, useMemo, useEffect } from 'react';
import Card from '../Card';
import { Program, DancerLevelName, ProgramName } from '../../types';
import Select from '../forms/Select';
import Button from '../forms/Button';
import { TimesIcon } from '../icons';

interface ProspectEvaluationModalProps {
    isOpen: boolean;
    onClose: () => void;
    prospectName: string;
    programs: Program[];
    onApprove: (data: { program: ProgramName; dancerLevel: DancerLevelName | null }) => void;
    onReject: () => void;
    isProcessing: boolean;
}

const ProspectEvaluationModal: React.FC<ProspectEvaluationModalProps> = ({
    isOpen,
    onClose,
    prospectName,
    programs,
    onApprove,
    onReject,
    isProcessing,
}) => {
    const [selectedProgram, setSelectedProgram] = useState<ProgramName | ''>('');
    const [selectedLevel, setSelectedLevel] = useState<DancerLevelName | ''>('');
    const [actionTab, setActionTab] = useState<'approve' | 'reject'>('approve');
    const [formError, setFormError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setSelectedProgram('');
            setSelectedLevel('');
            setFormError('');
            setActionTab('approve');
        }
    }, [isOpen]);

    const programOptions = useMemo(() => {
        return [{ value: '', label: 'Select a program...' }, ...programs.map(p => ({ value: p.name, label: p.name }))]
    }, [programs]);

    const levelOptions = useMemo(() => {
        const programDetails = programs.find(p => p.name === selectedProgram);
        if (programDetails?.hasLevels && programDetails.levels?.length) {
            return [{ value: '', label: 'Select a level...' }, ...programDetails.levels.map(l => ({ value: l, label: l }))]
        }
        return [];
    }, [selectedProgram, programs]);

    const handleProgramChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProgram(e.target.value as ProgramName);
        setSelectedLevel('');
        setFormError('');
    };
    
    const handleConfirmApproval = () => {
        if (!selectedProgram) {
            setFormError('A program must be selected to approve the prospect.');
            return;
        }
        const programDetails = programs.find(p => p.name === selectedProgram);
        if (programDetails?.hasLevels && programDetails.levels?.length && !selectedLevel) {
            setFormError('A level must be selected for this program.');
            return;
        }
        setFormError('');
        onApprove({ program: selectedProgram, dancerLevel: selectedLevel || null });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 modal-overlay-animate">
            <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-lg modal-content-animate">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-brand-text-primary">Evaluate Audition: {prospectName}</h3>
                    <button onClick={onClose} disabled={isProcessing} className="text-brand-text-muted hover:text-brand-primary">
                        <TimesIcon className="w-5 h-5"/>
                    </button>
                </div>

                <div className="border-b border-gray-200 mb-4">
                    <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                        <button onClick={() => setActionTab('approve')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${actionTab === 'approve' ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Approve Prospect
                        </button>
                        <button onClick={() => setActionTab('reject')} className={`whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm ${actionTab === 'reject' ? 'border-brand-error text-brand-error' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            Reject Prospect
                        </button>
                    </nav>
                </div>

                {actionTab === 'approve' && (
                    <div className="space-y-4">
                        <p className="text-sm text-brand-text-secondary">To approve this prospect and convert them to a student, assign them to a program. A temporary password will be created.</p>
                        <Select 
                            id="program"
                            label="Assign to Program"
                            options={programOptions}
                            value={selectedProgram}
                            onChange={handleProgramChange}
                            disabled={isProcessing}
                        />
                        {levelOptions.length > 0 && (
                             <Select 
                                id="level"
                                label="Assign to Level"
                                options={levelOptions}
                                value={selectedLevel}
                                onChange={(e) => setSelectedLevel(e.target.value)}
                                disabled={isProcessing}
                            />
                        )}
                        {formError && <p className="text-xs text-brand-error">{formError}</p>}
                        <div className="flex justify-end space-x-3 pt-2">
                            <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                            <Button variant="success" onClick={handleConfirmApproval} isLoading={isProcessing} disabled={isProcessing}>Approve & Convert to Student</Button>
                        </div>
                    </div>
                )}

                {actionTab === 'reject' && (
                    <div className="space-y-4">
                        <p className="text-sm text-brand-text-secondary">This will permanently delete the prospect's record from the system. This action cannot be undone.</p>
                        <div className="flex justify-end space-x-3 pt-2">
                            <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
                            <Button variant="danger" onClick={onReject} isLoading={isProcessing} disabled={isProcessing}>Confirm Rejection</Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProspectEvaluationModal;
