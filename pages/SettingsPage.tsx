import React from 'react';
import Card from '../components/Card';
import { SettingsIcon, UsersIcon as RolesIcon, DollarSignIcon as BillingIcon, CalendarIcon as CalendarSettingsIcon, UserShieldIcon, IdCardIcon } from '../components/icons'; 
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface SettingsCardProps {
  title: string;
  description: string;
  icon: React.ReactElement<{ className?: string }>; 
  linkTo: string;
  iconBgColorClass?: string;
  iconColorClass?: string;
}

const SettingsNavigationCard: React.FC<SettingsCardProps> = ({ title, description, icon, linkTo, iconBgColorClass = 'bg-brand-primary-light/20', iconColorClass = 'text-brand-primary' }) => {
  const baseClass = "block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 border border-brand-neutral-200 group";
  const activeClass = "ring-2 ring-brand-primary";
  return (
    <NavLink
      to={linkTo}
      className={({ isActive }) => `${baseClass} ${isActive ? activeClass : ''}`}
    >
      <div className="flex items-start space-x-4">
        <div className={`p-3 rounded-full ${iconBgColorClass}`}>
          {React.cloneElement(icon, { className: `w-6 h-6 ${iconColorClass}` })}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-brand-text-primary group-hover:text-brand-primary transition-colors">{title}</h3>
          <p className="text-sm text-brand-text-secondary mt-1">{description}</p>
        </div>
      </div>
    </NavLink>
  );
};

const SettingsPage: React.FC = () => {
  const { hasPermission } = useAuth();
    
  const settingsOptions: (SettingsCardProps & { show: boolean })[] = [
    {
      title: "General Settings",
      description: "Manage academy name, contact info, address, logo, and business hours.",
      icon: <SettingsIcon />,
      linkTo: "/settings/general", 
      iconBgColorClass: 'bg-brand-accent-light/30',
      iconColorClass: 'text-brand-accent-dark',
      show: hasPermission('manage_general_settings'),
    },
    {
      title: "Role & Permission Management",
      description: "Define user roles and assign specific permissions for system access.",
      icon: <RolesIcon />, 
      linkTo: "/settings/roles",
      iconBgColorClass: 'bg-brand-indigo-light/30',
      iconColorClass: 'text-brand-indigo',
      show: hasPermission('manage_roles_permissions'),
    },
    {
      title: "Admin User Accounts",
      description: "Manage users who can access this admin panel, assign roles, and set their status.",
      icon: <UserShieldIcon />,
      linkTo: "/settings/admin-users",
      iconBgColorClass: 'bg-brand-error-light/30',
      iconColorClass: 'text-brand-error-dark',
      show: hasPermission('manage_admin_users'),
    },
    {
      title: "Membership Plans",
      description: "Create, edit, and manage membership plans, pricing, and included benefits.",
      icon: <IdCardIcon className="w-5 h-5"/>, // Using IdCardIcon, ensure it exists or use BillingIcon
      linkTo: "/settings/membership-plans", 
      iconBgColorClass: 'bg-brand-success-light/30',
      iconColorClass: 'text-brand-success-dark',
      show: hasPermission('manage_membership_plans'),
    },
    {
        title: "Calendar & Scheduling",
        description: "Configure terms, sessions, holidays, and room/resource management.",
        icon: <CalendarSettingsIcon />,
        linkTo: "/settings/calendar", 
        iconBgColorClass: 'bg-brand-pink-light/30',
        iconColorClass: 'text-brand-pink',
        show: hasPermission('manage_calendar_settings'),
    },
    {
      title: "Payment Gateway",
      description: "Configure API keys and settings for your payment processor (Stripe).",
      icon: <BillingIcon />,
      linkTo: "/settings/payments",
      iconBgColorClass: 'bg-brand-purple-light/30',
      iconColorClass: 'text-brand-purple',
      show: hasPermission('manage_general_settings'), // Reuse permission or create a new one
    },
    {
      title: "Payouts & Billing",
      description: "Connect your Stripe account to accept payments and manage payouts.",
      icon: <BillingIcon />,
      linkTo: "/settings/payouts-billing",
      iconBgColorClass: 'bg-brand-blue-light/30',
      iconColorClass: 'text-brand-blue',
      show: hasPermission('manage_general_settings'),
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <SettingsIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-3xl font-bold text-brand-text-primary">Academy Configuration</h1>
      </div>
      <p className="text-brand-text-secondary max-w-2xl">
        Manage various settings for your dance academy. This section allows you to configure roles, permissions,
        general information, membership plans, and calendar settings to tailor the system to your needs.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        {settingsOptions.filter(opt => opt.show).map(option => (
          <SettingsNavigationCard
            key={option.title}
            title={option.title}
            description={option.description}
            icon={option.icon}
            linkTo={option.linkTo}
            iconBgColorClass={option.iconBgColorClass}
            iconColorClass={option.iconColorClass}
          />
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
