import React from 'react';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import { UserCircleIcon, LogoutIcon } from '../../components/icons';

const StudentSelectorPage: React.FC = () => {
    const { user, students, selectStudent, logout } = useClientAuth();

    if (!user) {
        return <div>Loading...</div>; // Should be handled by layout/router
    }

    return (
        <div className="flex items-center justify-center min-h-screen bg-brand-background-light p-4">
            <div className="w-full max-w-2xl text-center">
                <div className="mb-8">
                     <h1 className="text-3xl font-bold text-brand-text-primary">Welcome, {user.firstName}!</h1>
                     <p className="text-brand-text-secondary mt-2">Please select a student profile to continue.</p>
                </div>
               
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                    {students.map(student => (
                         <div key={student.id} onClick={() => selectStudent(student.id)} className="group cursor-pointer">
                            <div className="bg-white p-6 rounded-xl shadow-lg group-hover:shadow-2xl group-hover:-translate-y-2 transform transition-all duration-300 flex flex-col items-center space-y-3">
                                {student.profilePictureUrl ? (
                                    <img src={student.profilePictureUrl} alt={student.firstName} className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-md"/>
                                ) : (
                                    <UserCircleIcon className="w-24 h-24 text-brand-neutral-300" />
                                )}
                                <p className="text-lg font-semibold text-brand-text-primary">{student.firstName} {student.lastName}</p>
                            </div>
                         </div>
                    ))}
                </div>

                <div className="mt-12">
                     <button onClick={logout} className="text-sm text-brand-text-muted hover:text-brand-error flex items-center mx-auto">
                        <LogoutIcon className="w-4 h-4 mr-1.5"/>
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default StudentSelectorPage;
