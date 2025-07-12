
import React, { useState, useEffect } from 'react';
import Card from '../Card';
import { Student } from '../../types';
import { getStudents } from '../../services/apiService';
import { showToast } from '../../utils';
import { CakeIcon, UserPlusIcon } from '../icons';

const StudentLifecycleWidget: React.FC = () => {
    const [upcomingBirthdays, setUpcomingBirthdays] = useState<Student[]>([]);
    const [newStudents, setNewStudents] = useState<Student[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchStudentData = async () => {
            setIsLoading(true);
            try {
                const students = await getStudents();
                const today = new Date();
                const nextWeek = new Date();
                nextWeek.setDate(today.getDate() + 7);
                const lastWeek = new Date();
                lastWeek.setDate(today.getDate() - 7);

                const birthdays: Student[] = [];
                const newSignups: Student[] = [];

                students.forEach(student => {
                    if (student.dateOfBirth) {
                        const dob = new Date(student.dateOfBirth);
                        const studentBirthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate() + 1); // Add 1 to handle timezone issues
                        if (studentBirthdayThisYear >= today && studentBirthdayThisYear <= nextWeek) {
                            birthdays.push(student);
                        }
                    }
                    if (student.createdAt) {
                        const createdAtDate = new Date(student.createdAt);
                        if (createdAtDate >= lastWeek && createdAtDate <= today) {
                            newSignups.push(student);
                        }
                    }
                });

                setUpcomingBirthdays(birthdays);
                setNewStudents(newSignups);
            } catch (err) {
                showToast("Failed to load student lifecycle data.", "error");
            } finally {
                setIsLoading(false);
            }
        };

        fetchStudentData();
    }, []);

    const renderStudentList = (title: string, students: Student[], icon: React.ReactNode, emptyMessage: string) => (
        <div>
            <h4 className="flex items-center text-md font-medium text-brand-text-primary mb-2">
                {icon}
                <span className="ml-2">{title}</span>
            </h4>
            {students.length > 0 ? (
                <ul className="space-y-2">
                    {students.map(student => (
                        <li key={student.id} className="text-sm text-brand-text-secondary p-2 bg-brand-neutral-50 rounded-md">
                            {student.firstName} {student.lastName}
                             <span className="text-xs text-brand-text-muted ml-2">
                                {student.dateOfBirth ? `(${new Date(student.dateOfBirth).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })})` : ''}
                            </span>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-xs text-brand-text-muted p-2">{emptyMessage}</p>
            )}
        </div>
    );
    

    return (
        <Card title="Comunidad y Retención">
            {isLoading ? (
                 <div className="text-center p-4 text-brand-text-secondary">Loading student data...</div>
            ) : (
                 <div className="space-y-4">
                    {renderStudentList("Próximos Cumpleaños", upcomingBirthdays, <CakeIcon className="text-brand-pink" />, "No hay cumpleaños esta semana.")}
                    <div className="border-t border-brand-neutral-200"></div>
                    {renderStudentList("Nuevos Alumnos (Últ. 7 días)", newStudents, <UserPlusIcon className="text-brand-success" />, "No hay nuevos alumnos esta semana.")}
                </div>
            )}
        </Card>
    );
};

export default StudentLifecycleWidget;
