import React from 'react';
import Card from '../components/Card';
import { ChartBarIcon, UsersIcon, CalendarIcon as AttendanceIcon, DollarSignIcon, IdCardIcon, ChevronRightIcon, ListOlIcon } from '../components/icons';
import { NavLink } from 'react-router-dom';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactElement<{ className?: string }>; 
  subReports: { name: string; link: string; description?: string }[];
}

const ReportCategoryCard: React.FC<ReportCardProps> = ({ title, description, icon, subReports }) => {
  return (
    <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 flex flex-col">
      <div className="p-6 border-b border-brand-neutral-200">
        <div className="flex items-center mb-3">
          <span className="text-brand-primary mr-3">{React.cloneElement(icon, { className: "w-7 h-7" })}</span>
          <h3 className="text-xl font-semibold text-brand-primary-dark">{title}</h3>
        </div>
        <p className="text-sm text-brand-text-secondary mb-4">
          {description}
        </p>
      </div>
      {subReports && subReports.length > 0 && (
        <div className="p-4 space-y-2 bg-brand-neutral-50/50 flex-grow">
          {subReports.map(report => (
            <NavLink 
              key={report.link}
              to={report.link} 
              className="block p-2.5 rounded-md hover:bg-brand-primary-light/10 transition-colors group"
            >
              <div className="flex justify-between items-center">
                <div>
                    <h4 className="font-medium text-brand-text-primary group-hover:text-brand-primary">{report.name}</h4>
                    {report.description && <p className="text-xs text-brand-text-muted group-hover:text-brand-primary-dark">{report.description}</p>}
                </div>
                <ChevronRightIcon className="w-4 h-4 text-brand-text-muted group-hover:text-brand-primary transition-colors" />
              </div>
            </NavLink>
          ))}
        </div>
      )}
    </div>
  );
};


const ReportsPage: React.FC = () => {

  const reportCategories: ReportCardProps[] = [
    {
      title: "Student Reports",
      description: "Analyze student data, including demographics and registration trends.",
      icon: <UsersIcon />,
      subReports: [
        { name: "New Students Report", link: "/reports/new-students", description: "Track newly registered students over time." },
        { name: "Student Status Overview", link: "/reports/student-status", description: "Visualize the distribution of student statuses." },
        { name: "Student Demographics", link: "/reports/student-demographics", description: "Breakdown of student age, gender, and location." },
      ]
    },
    {
      title: "Attendance & Absence Reports",
      description: "Monitor class attendance, track student absences, and identify trends.",
      icon: <AttendanceIcon />,
      subReports: [
        { name: "Attendance by Class", link: "/reports/attendance-by-class", description: "Detailed attendance records for each class." },
        { name: "Attendance by Student", link: "/reports/attendance-by-student", description: "Individual student attendance history." },
        { name: "Attendance by Instructor", link: "/reports/attendance-by-instructor", description: "Track attendance for classes taught by an instructor." },
        { name: "Absences by Class", link: "/reports/absences-by-class", description: "Absence patterns for specific classes." },
        { name: "Absences by Student", link: "/reports/absences-by-student", description: "Individual student absence records." },
      ]
    },
    {
      title: "Enrollment Reports",
      description: "Gain insights into class and program enrollments.",
      icon: <ListOlIcon />,
      subReports: [
        { name: "Enrollment by Program", link: "/reports/enrollment-by-program", description: "Student distribution across different programs." },
        { name: "Enrollment by Class", link: "/reports/enrollment-by-class", description: "Enrollment numbers for each class offering." },
      ]
    },
    {
      title: "Financial Reports",
      description: "Track payments, dues, and financial performance.",
      icon: <DollarSignIcon />,
      subReports: [
        { name: "BI Dashboard", link: "/reports/financial-dashboard", description: "Key financial metrics for your business." },
        { name: "Payments Received", link: "/reports/financial-payments", description: "Overview of all payments collected." },
      ]
    },
    {
      title: "Membership Reports",
      description: "Analyze membership plan subscriptions and distribution.",
      icon: <IdCardIcon />,
      subReports: [
        { name: "Membership Plan Distribution", link: "/reports/membership-distribution", description: "See how many students are on each plan." },
      ]
    },
  ];


  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <ChartBarIcon className="w-8 h-8 text-brand-primary" />
        <h1 className="text-3xl font-bold text-brand-text-primary">Reports & Analytics</h1>
      </div>
      <p className="text-brand-text-secondary max-w-2xl">
        Select a report category below to view detailed analytics and gain insights into your studio's operations.
        Use filters to narrow down data and export reports as needed.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportCategories.map(category => (
          <ReportCategoryCard 
            key={category.title}
            title={category.title}
            description={category.description}
            icon={category.icon}
            subReports={category.subReports}
          />
        ))}
      </div>
    </div>
  );
};

export default ReportsPage;
