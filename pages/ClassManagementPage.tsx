import React from 'react';
import Card from '../components/Card';
import { ClassesIcon, ChevronRightIcon } from '../components/icons';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ManagementOptionCard: React.FC<{ title: string; description: string; linkTo: string; icon: React.ReactNode }> = ({ title, description, linkTo, icon }) => {
  const baseClass = "block hover:shadow-lg transition-shadow duration-200 rounded-lg";
  const activeClass = "ring-2 ring-brand-primary";
  return (
    <NavLink 
      to={linkTo} 
      className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
    >
      <div className="p-6 bg-white rounded-lg border border-brand-neutral-200 h-full flex flex-col justify-between">
        <div>
          <div className="flex items-center mb-3">
            <span className="text-brand-primary mr-3">{icon}</span>
            <h3 className="text-xl font-semibold text-brand-primary-dark">{title}</h3>
          </div>
          <p className="text-sm text-brand-text-secondary mb-4">
            {description}
          </p>
        </div>
        <div className="mt-auto text-right">
          <span className="text-brand-primary hover:underline font-medium text-sm flex items-center justify-end">
            Manage {title}
            <ChevronRightIcon className="w-4 h-4 ml-1" />
          </span>
        </div>
      </div>
    </NavLink>
  );
};


const ClassManagementPage: React.FC = () => {
    const { hasPermission } = useAuth();
  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <ClassesIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-3xl font-bold text-brand-text-primary">Class & Program Management</h1>
      </div>
      
      <p className="text-brand-text-secondary max-w-2xl">
        Oversee all aspects of your studio's curriculum. Define programs, manage class offerings,
        set schedules, and assign instructors.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {hasPermission('manage_programs') && (
            <ManagementOptionCard 
            title="Programs"
            description="Define and manage the core dance programs offered by your studio, including their age ranges and specific levels."
            linkTo="/classes/programs"
            icon={<i className="fas fa-sitemap fa-fw fa-lg"></i>} 
            />
        )}
        {hasPermission('manage_class_offerings') && (
            <ManagementOptionCard 
            title="Class Offerings"
            description="Create, edit, and manage individual class offerings within each program. Detail class descriptions, levels, prerequisites, and assign instructors."
            linkTo="/classes/offerings"
            icon={<i className="fas fa-chalkboard fa-fw fa-lg"></i>}
            />
        )}
        {hasPermission('manage_schedules') && (
            <ManagementOptionCard 
            title="Scheduling"
            description="Build and manage class schedules. Assign classes to specific days, times, rooms, and view overall studio timetables."
            linkTo="/classes/schedules" 
            icon={<i className="fas fa-calendar-alt fa-fw fa-lg"></i>}
            />
        )}
         <ManagementOptionCard 
          title="Room Management"
          description="Define and manage studio rooms or spaces available for classes and events."
          linkTo="/classes/rooms"
          icon={<i className="fas fa-door-open fa-fw fa-lg"></i>}
        />
      </div>

      <Card title="Quick Overview" icon={<ClassesIcon className="text-brand-primary" />}>
        <p className="text-brand-text-secondary">
          This section provides tools to structure and manage your studio's educational offerings.
          Start by defining your programs, then create specific class offerings within those programs.
          Finally, schedule these classes and assign instructors.
        </p>
         <ul className="list-disc list-inside space-y-2 text-brand-text-secondary mt-4 pl-4">
            <li>Define Programs (e.g., New Stars, Dancers).</li>
            <li>Create Class Offerings (e.g., Ballet I, Hip Hop Advanced).</li>
            <li>Set up Class Schedules (Days, Times, Rooms).</li>
            <li>Assign Instructors to Classes.</li>
          </ul>
      </Card>
    </div>
  );
};

export default ClassManagementPage;
