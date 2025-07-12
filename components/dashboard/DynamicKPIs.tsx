
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, UsersIcon, ClassesIcon, UserTieIcon } from '../icons';
import { getStudents, getClassOfferings, getPrograms, getInstructors } from '../../services/apiService';
import { showToast } from '../../utils';

// Mock data for the sparklines. In a real implementation, this would come from a time-series endpoint.
const generateSparklineData = () => Array.from({ length: 10 }, (_, i) => ({ name: `Page ${i}`, uv: Math.floor(Math.random() * 500) + 100 }));

interface KPIStatProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactElement<{ className?: string }>;
  sparklineData: any[];
}

const KPIStat: React.FC<KPIStatProps> = ({ title, value, change, isPositive, icon, sparklineData }) => {
  const changeColor = isPositive ? 'text-brand-success' : 'text-brand-error';
  const sparklineColor = !change ? '#9397BD' : (isPositive ? '#10B981' : '#EF4444');

  return (
    <div className="bg-white p-4 rounded-lg shadow-md flex items-start space-x-4">
      <div className={`p-3 rounded-full bg-brand-primary-light/20`}>
        {React.cloneElement(icon, { className: 'w-6 h-6 text-brand-primary' })}
      </div>
      <div className="flex-grow">
        <p className="text-sm text-brand-text-secondary">{title}</p>
        <div className="flex items-baseline space-x-2">
            <p className="text-2xl font-bold text-brand-text-primary">{value}</p>
            {change && (
              <div className={`flex items-center text-sm font-semibold ${changeColor}`}>
                  {isPositive ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
                  <span>{change}</span>
              </div>
            )}
        </div>
      </div>
      <div className="w-20 h-10">
        <ResponsiveContainer>
          <AreaChart data={sparklineData}>
            <defs>
              <linearGradient id={`color-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={sparklineColor} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={sparklineColor} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="uv" stroke={sparklineColor} fillOpacity={1} fill={`url(#color-${title.replace(/\s+/g, '-')})`} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


export const DynamicKPIs: React.FC = () => {
    const [metrics, setMetrics] = useState({
        activeStudents: { value: 0, change: '' },
        classOccupancy: { value: 0, change: '' },
        totalPrograms: { value: 0, change: '' },
        totalInstructors: { value: 0, change: '' },
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            setIsLoading(true);
            try {
                // Fetch data from base entities instead of a dedicated dashboard endpoint
                const [students, offerings, programs, instructors] = await Promise.all([
                    getStudents(),
                    getClassOfferings(),
                    getPrograms(),
                    getInstructors(),
                ]);

                // Calculate Active Students
                const activeStudentsCount = students.filter(s => s.status === 'Activo').length;

                // Calculate Class Occupancy
                const applicableOfferings = offerings.filter(o => o.capacity > 0);
                const totalOccupancy = applicableOfferings.reduce((acc, o) => acc + (o.enrolledCount / o.capacity), 0);
                const avgOccupancy = applicableOfferings.length > 0 ? (totalOccupancy / applicableOfferings.length) * 100 : 0;
                
                // Get total programs and instructors
                const totalProgramsCount = programs.length;
                const totalInstructorsCount = instructors.length;

                setMetrics({
                    activeStudents: { value: activeStudentsCount, change: '' },
                    classOccupancy: { value: Math.round(avgOccupancy), change: '' },
                    totalPrograms: { value: totalProgramsCount, change: '' },
                    totalInstructors: { value: totalInstructorsCount, change: '' },
                });

            } catch (err) {
                showToast("Failed to load key performance indicators.", "error");
                setMetrics({
                    activeStudents: { value: 0, change: '' },
                    classOccupancy: { value: 0, change: '' },
                    totalPrograms: { value: 0, change: '' },
                    totalInstructors: { value: 0, change: '' },
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (isLoading) {
        return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="bg-white p-4 rounded-lg shadow-md h-24 animate-pulse"></div>)}
        </div>
    }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <KPIStat 
        title="Alumnos Activos"
        value={String(metrics.activeStudents.value)}
        change={metrics.activeStudents.change}
        isPositive={true}
        icon={<UsersIcon />}
        sparklineData={generateSparklineData()}
      />
      <KPIStat 
        title="Ocupación Media"
        value={`${metrics.classOccupancy.value}%`}
        change={metrics.classOccupancy.change}
        isPositive={true}
        icon={<ClassesIcon />}
        sparklineData={generateSparklineData()}
      />
       <KPIStat 
        title="Programas Totales"
        value={String(metrics.totalPrograms.value)}
        change={metrics.totalPrograms.change}
        isPositive={true}
        icon={<i className="fa-solid fa-sitemap"></i>}
        sparklineData={generateSparklineData()}
      />
      <KPIStat 
        title="Instructores Totales"
        value={String(metrics.totalInstructors.value)}
        change={metrics.totalInstructors.change}
        isPositive={true}
        icon={<UserTieIcon />}
        sparklineData={generateSparklineData()}
      />
    </div>
  );
};
