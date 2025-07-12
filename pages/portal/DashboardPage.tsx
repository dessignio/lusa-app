import React, { useMemo, useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useClientAuth } from '../../contexts/ClientAuthContext';
import Card from '../../components/Card';
import Button from '../../components/forms/Button';
import { Announcement, ClassOffering, MembershipPlanDefinition } from '../../types';
import { CalendarIcon, IdCardIcon, EnvelopeIcon, QrCodeIcon } from '../../components/icons';
import { formatTimeRange, calculateAge, showToast } from '../../utils';
import { getClassOfferings, getAnnouncements, getMembershipPlans } from '../../services/apiService';

const TodaysClassesWidget: React.FC = () => {
    const { selectedStudent } = useClientAuth();
    const [todaysClasses, setTodaysClasses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!selectedStudent) {
            setIsLoading(false);
            return;
        }

        const fetchClasses = async () => {
            setIsLoading(true);
            try {
                const offerings = await getClassOfferings();
                const studentClasses = offerings.filter(o => selectedStudent.enrolledClasses.includes(o.id));
                const todayDayOfWeek = new Date().getDay();

                const classes = studentClasses.flatMap(offering => 
                    offering.scheduledClassSlots
                        .filter(slot => slot.dayOfWeek === todayDayOfWeek && slot.startTime)
                        .map(slot => ({
                            id: `${offering.id}-${slot.id || slot.dayOfWeek}`,
                            name: offering.name,
                            time: formatTimeRange(slot.startTime, slot.endTime),
                            room: slot.room,
                            classOfferingId: offering.id
                        }))
                ).sort((a,b) => a.time.localeCompare(b.time));
                setTodaysClasses(classes);
            } catch (error) {
                console.error("Failed to load today's classes", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchClasses();
    }, [selectedStudent]);

    return (
        <Card title="Today's Schedule" icon={<CalendarIcon className="w-5 h-5 text-brand-primary"/>}>
            {isLoading ? <p>Loading classes...</p> : todaysClasses.length > 0 ? (
                <ul className="space-y-2">
                    {todaysClasses.map(cls => (
                         <li key={cls.id} className="p-3 bg-brand-neutral-50 rounded-md">
                            <p className="font-semibold text-brand-text-primary">{cls.name}</p>
                            <p className="text-sm text-brand-text-secondary">{cls.time} in {cls.room}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-brand-text-muted py-4">No classes scheduled for today.</p>
            )}
        </Card>
    );
};

const MembershipWidget: React.FC = () => {
    const { selectedStudent } = useClientAuth();
    const [plans, setPlans] = useState<MembershipPlanDefinition[]>([]);

    useEffect(() => {
        getMembershipPlans().then(setPlans).catch(err => console.error(err));
    }, []);
    
    const currentPlan = useMemo(() => {
        return plans.find(p => p.id === selectedStudent?.membershipPlanId);
    }, [plans, selectedStudent]);

    return (
        <Card title="My Membership" icon={<IdCardIcon className="w-5 h-5 text-brand-primary"/>}>
            {selectedStudent && currentPlan ? (
                <div className="space-y-2">
                    <h4 className="text-lg font-bold text-brand-primary">{currentPlan.name}</h4>
                    <p><strong className="font-medium">Classes per week:</strong> {currentPlan.classesPerWeek}</p>
                    <p><strong className="font-medium">Monthly Price:</strong> ${Number(currentPlan.monthlyPrice).toFixed(2)}</p>
                    {selectedStudent.membershipRenewalDate && (
                         <p><strong className="font-medium">Next Renewal:</strong> {new Date(selectedStudent.membershipRenewalDate).toLocaleDateString()}</p>
                    )}
                    <NavLink to="/portal/account" className="text-brand-primary hover:underline text-sm font-medium mt-2 block">Manage Membership &rarr;</NavLink>
                </div>
            ) : (
                 <p className="text-center text-brand-text-muted py-4">No active membership plan.</p>
            )}
        </Card>
    );
};

const QRCodeWidget: React.FC = () => {
    const { selectedStudent } = useClientAuth();
    if (!selectedStudent) return null;

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(selectedStudent.id)}`;

    const handleAddToWallet = (walletType: 'Apple' | 'Google') => {
        showToast(`Adding to ${walletType} Wallet is coming soon!`, 'info');
    };

    return (
        <Card title="My Attendance ID" icon={<QrCodeIcon className="w-5 h-5 text-brand-primary"/>}>
            <div className="text-center">
                <p className="text-sm text-brand-text-secondary mb-4">
                    Present this QR code at the studio to mark your attendance.
                </p>
                <div className="flex justify-center p-2 bg-white rounded-lg border">
                    <img src={qrCodeUrl} alt="Student Attendance QR Code" />
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleAddToWallet('Apple')}>Add to Apple Wallet</Button>
                    <Button variant="outline" size="sm" onClick={() => handleAddToWallet('Google')}>Add to Google Wallet</Button>
                </div>
            </div>
        </Card>
    );
};


const AnnouncementsWidget: React.FC = () => {
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getAnnouncements().then(data => {
            setAnnouncements(data.slice(0, 3)); // Get latest 3
            setIsLoading(false);
        }).catch(err => {
            console.error(err);
            setIsLoading(false);
        });
    }, []);
    
    return (
        <Card title="Latest Announcements" icon={<EnvelopeIcon className="w-5 h-5 text-brand-primary"/>}>
             {isLoading ? <p>Loading announcements...</p> : announcements.length > 0 ? (
                <div className="space-y-3">
                    {announcements.map(ann => (
                        <div key={ann.id} className="p-3 border-b border-brand-neutral-100 last:border-b-0">
                             <p className="font-semibold text-brand-text-primary">{ann.title}</p>
                             <p className="text-sm text-brand-text-secondary mt-1 line-clamp-2">{ann.content}</p>
                             <p className="text-xs text-brand-text-muted mt-2">{new Date(ann.date).toLocaleDateString()}</p>
                        </div>
                    ))}
                    <NavLink to="/portal/announcements" className="text-brand-primary hover:underline text-sm font-medium mt-2 block text-right">View All &rarr;</NavLink>
                </div>
             ) : (
                <p className="text-center text-brand-text-muted py-4">No recent announcements.</p>
             )}
        </Card>
    );
};


const PortalDashboardPage: React.FC = () => {
    const { selectedStudent } = useClientAuth();

    const studentAge = selectedStudent ? calculateAge(selectedStudent.dateOfBirth) : null;
    const isMinor = studentAge !== null && studentAge < 18;

    if (!selectedStudent) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-brand-text-secondary">Please select a student profile to view the dashboard.</p>
            </div>
        );
    }
    
    return (
        <div className="space-y-6">
            <div>
                 <h1 className="text-2xl md:text-3xl font-bold text-brand-text-primary">Welcome, {selectedStudent.firstName}!</h1>
                 <p className="text-brand-text-secondary mt-1">Here is a summary of your account.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <TodaysClassesWidget />
                    <AnnouncementsWidget />
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <QRCodeWidget />
                    {!isMinor && <MembershipWidget />}
                </div>
            </div>
        </div>
    );
};

export default PortalDashboardPage;
