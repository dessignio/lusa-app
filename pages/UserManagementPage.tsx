import React from 'react';
import Card from '../components/Card';
import { UsersIcon, UserTieIcon, UserCheckIcon, UserFriendsIcon } from '../components/icons'; 
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const UserManagementPage: React.FC = () => {
  const navLinkBaseClass = "block hover:shadow-lg transition-shadow duration-200 rounded-lg";
  const navLinkActiveClass = "ring-2 ring-brand-primary";
  const navLinkIndigoActiveClass = "ring-2 ring-brand-indigo";
  const navLinkSuccessActiveClass = "ring-2 ring-brand-success";
  const navLinkPinkActiveClass = "ring-2 ring-brand-pink";


  const { hasPermission } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-brand-text-primary">User Management</h1>
      <Card title="Manage Users" icon={<UsersIcon className="text-brand-primary w-6 h-6" />}>
        <p className="text-brand-text-secondary mb-6">
          This section allows administrators to manage user accounts, including students and instructors. 
          Detailed profiles, class assignments, and role-based permissions will be managed here.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Student Management Card */}
          {hasPermission('view_students') && (
            <NavLink 
              to="/users/students" 
              className={({ isActive }) => `${navLinkBaseClass} ${isActive ? navLinkActiveClass : ''}`}
            >
              <div className="p-6 bg-brand-accent-light/30 rounded-lg border border-brand-accent-light h-full flex flex-col">
                <div className="flex items-center mb-3">
                  <UsersIcon className="text-brand-primary w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold text-brand-primary-dark">Student Management</h3>
                </div>
                <p className="text-sm text-brand-text-secondary mb-3 flex-grow">
                  Manage student profiles, enrollment details, contact information, and academic progress.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-brand-text-secondary">
                  <li>Create, View, Edit, Delete Students</li>
                  <li>Track Program & Level</li>
                  <li>Manage Membership & Status</li>
                </ul>
                <div className="mt-4 text-right">
                    <span className="text-brand-primary hover:underline font-medium text-sm">
                      Go to Students &rarr;
                    </span>
                </div>
              </div>
            </NavLink>
          )}
          
          {/* Parent Management Card */}
          {hasPermission('manage_students') && (
            <NavLink
              to="/users/parents"
              className={({ isActive }) => `${navLinkBaseClass} ${isActive ? navLinkPinkActiveClass : ''}`}
            >
              <div className="p-6 bg-brand-pink-light/30 rounded-lg border border-brand-pink-light h-full flex flex-col">
                <div className="flex items-center mb-3">
                  <UserFriendsIcon className="text-brand-pink w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold text-brand-pink">Parent Management</h3>
                </div>
                <p className="text-sm text-brand-text-secondary mb-3 flex-grow">
                  Manage parent and guardian accounts, contact information, and linked students.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-brand-text-secondary">
                  <li>Create, View, Edit, Delete Parents</li>
                  <li>Manage Contact Details</li>
                  <li>Link to Students</li>
                </ul>
                <div className="mt-4 text-right">
                  <span className="text-brand-pink hover:underline font-medium text-sm">
                    Go to Parents &rarr;
                  </span>
                </div>
              </div>
            </NavLink>
          )}

          {/* Prospect Management Card */}
          {hasPermission('manage_students') && (
             <NavLink 
              to="/users/prospects" 
              className={({ isActive }) => `${navLinkBaseClass} ${isActive ? navLinkSuccessActiveClass : ''}`}
            >
              <div className="p-6 bg-brand-success-light/30 rounded-lg border border-brand-success-light h-full flex flex-col">
                <div className="flex items-center mb-3">
                  <UserCheckIcon className="text-brand-success-dark w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold text-brand-success-dark">Prospect Management</h3>
                </div>
                <p className="text-sm text-brand-text-secondary mb-3 flex-grow">
                  Manage audition prospects, process payments, and convert approved prospects into students.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-brand-text-secondary">
                  <li>Create & Manage Prospects</li>
                  <li>Process Audition Payments</li>
                  <li>Approve or Reject Auditions</li>
                </ul>
                <div className="mt-4 text-right">
                    <span className="text-brand-success-dark hover:underline font-medium text-sm">
                      Go to Prospects &rarr;
                    </span>
                </div>
              </div>
            </NavLink>
          )}


          {/* Instructor Management Card */}
          {hasPermission('view_instructors') && (
            <NavLink 
              to="/users/instructors" 
              className={({ isActive }) => `${navLinkBaseClass} ${isActive ? navLinkIndigoActiveClass : ''}`}
            >
              <div className="p-6 bg-brand-indigo-light/30 rounded-lg border border-brand-indigo-light h-full flex flex-col">
                <div className="flex items-center mb-3">
                  <UserTieIcon className="text-brand-indigo w-7 h-7 mr-3" />
                  <h3 className="text-xl font-semibold text-brand-indigo">Instructor Management</h3>
                </div>
                <p className="text-sm text-brand-text-secondary mb-3 flex-grow">
                  Manage instructor profiles, specializations, teaching availability, and assigned classes.
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm text-brand-text-secondary">
                  <li>Create, View, Edit, Delete Instructors</li>
                  <li>Define Specializations</li>
                  <li>Set Weekly Availability</li>
                </ul>
                 <div className="mt-4 text-right">
                    <span className="text-brand-indigo hover:underline font-medium text-sm">
                      Go to Instructors &rarr;
                    </span>
                </div>
              </div>
            </NavLink>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserManagementPage;
