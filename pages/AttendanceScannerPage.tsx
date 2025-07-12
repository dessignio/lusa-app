
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { ClassOffering, Student } from '../types';
import { getClassOfferings, markAttendance, getStudents } from '../services/apiService';
import { showToast, formatTimeRange, getLocalDateString } from '../utils';
import { DAYS_OF_WEEK } from '../constants';
import Card from '../components/Card';
import Select from '../components/forms/Select';
import Button from '../components/forms/Button';
import { CameraIcon, CheckCircleIcon, TimesCircleIcon } from '../components/icons';
import Clock from '../components/Clock';

const AttendanceScannerPage: React.FC = () => {
    const [todaysClasses, setTodaysClasses] = useState<ClassOffering[]>([]);
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    // Change state to hold a composite key: "classId;slotId"
    const [selectedClassSlotKey, setSelectedClassSlotKey] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isScanning, setIsScanning] = useState(false);
    const [scanResult, setScanResult] = useState<{ status: 'success' | 'error' | 'info', message: string } | null>(null);

    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const readerId = "qr-reader";

    const fetchInitialData = useCallback(async () => {
        setIsLoading(true);
        try {
            const [offerings, students] = await Promise.all([getClassOfferings(), getStudents()]);
            const today = new Date().getDay();
            // We still fetch all of today's classes, the filtering to specific slots happens in the dropdown memo.
            const classesForToday = offerings.filter(o => o.scheduledClassSlots.some(s => s.dayOfWeek === today));
            setTodaysClasses(classesForToday);
            setAllStudents(students);
        } catch (error) {
            showToast("Failed to load initial data.", 'error');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInitialData();
    }, [fetchInitialData]);

    const stopScanner = useCallback(() => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().then(() => {
                console.log("QR Code scanning stopped.");
                setIsScanning(false);
            }).catch(err => {
                console.error("Failed to stop QR Code scanner.", err);
            });
        }
    }, []);

    // Cleanup on component unmount
    useEffect(() => {
        return () => {
            stopScanner();
        };
    }, [stopScanner]);

    const onScanSuccess = async (decodedText: string, decodedResult: any) => {
        const studentId = decodedText;
        setScanResult(null); // Clear previous result

        // Parse composite key to get classId and slotId
        const [classId, slotId] = selectedClassSlotKey.split(';');
        if (!classId || !slotId) {
            setScanResult({ status: 'error', message: 'No class session selected.' });
            return;
        }

        const student = allStudents.find(s => s.id === studentId);
        if (!student) {
            setScanResult({ status: 'error', message: `Invalid QR Code. Student not found.` });
            return;
        }

        const selectedClass = todaysClasses.find(c => c.id === classId);
        if (!selectedClass) {
            setScanResult({ status: 'error', message: `Internal error: Class details not found.` });
            return;
        }
        
        if (!student.enrolledClasses.includes(selectedClass.id)) {
            setScanResult({ status: 'error', message: `${student.firstName} is not enrolled in ${selectedClass.name}.` });
            return;
        }

        const now = new Date();
        const relevantSlot = selectedClass.scheduledClassSlots.find(s => s.id === slotId);
        if (!relevantSlot?.startTime) {
             setScanResult({ status: 'error', message: `Could not determine class start time for the selected session of ${selectedClass.name}.` });
            return;
        }

        const [hours, minutes] = relevantSlot.startTime.split(':').map(Number);
        const classStartTimeToday = new Date();
        classStartTimeToday.setHours(hours, minutes, 0, 0);

        const diffMinutes = (now.getTime() - classStartTimeToday.getTime()) / 60000;
        const attendanceStatus = diffMinutes <= 15 ? 'Present' : 'Late';
        
        const classDateTimeForDb = new Date(`${getLocalDateString(now)}T${relevantSlot.startTime}`);

        try {
            await markAttendance({
                studentId: student.id,
                classOfferingId: selectedClass.id,
                classDateTime: classDateTimeForDb.toISOString(),
                status: attendanceStatus,
            });
            setScanResult({ status: 'success', message: `${student.firstName} ${student.lastName} marked as ${attendanceStatus} for ${selectedClass.name}.` });
            showToast('Attendance recorded!', 'success');
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setScanResult({ status: 'error', message: `Failed to record attendance: ${errorMessage}` });
        }
    };

    const startScanner = () => {
        if (!selectedClassSlotKey) {
            showToast("Please select a class session first.", "info");
            return;
        }
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode(readerId, { verbose: false });
        }
        
        setScanResult(null);
        setIsScanning(true);

        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        html5QrCodeRef.current.start(
            { facingMode: "environment" },
            config,
            onScanSuccess,
            (errorMessage) => { /* ignore errors */ }
        ).catch(err => {
            console.error("QR Scanner failed to start", err);
            setScanResult({ status: 'error', message: "Could not start camera. Check permissions." });
            setIsScanning(false);
        });
    };
    
    // New memoized options for each specific class slot today
    const classSlotOptions = useMemo(() => {
        const options: { value: string; label: string }[] = [];
        const today = new Date().getDay();
        todaysClasses.forEach(c => {
            c.scheduledClassSlots
                .filter(s => s.dayOfWeek === today && s.id) // Ensure slot has an ID
                .forEach(s => {
                    const time = formatTimeRange(s.startTime, s.endTime);
                    options.push({
                        value: `${c.id};${s.id}`, // Composite key
                        label: `${c.name} (${time})`
                    });
                });
        });
        // Sort options by time
        options.sort((a, b) => {
            const timeA = a.label.substring(a.label.lastIndexOf('(') + 1);
            const timeB = b.label.substring(b.label.lastIndexOf('(') + 1);
            return timeA.localeCompare(timeB);
        });
        return [{ value: '', label: 'Select a class session...' }, ...options];
    }, [todaysClasses]);

    return (
        <div className="container mx-auto max-w-2xl py-8 px-4">
            <Card title="Attendance Scanner" icon={<CameraIcon className="w-6 h-6 text-brand-primary"/>} collapsible={false}>
                <div className="space-y-4">
                    <div className="text-center text-brand-text-secondary"><Clock /></div>
                    <p className="text-brand-text-secondary text-center">Select the class session for check-in, then start the scanner to read student QR codes.</p>
                    <Select
                        id="class-selector"
                        label="Select Class Session for Today"
                        options={classSlotOptions}
                        value={selectedClassSlotKey}
                        onChange={e => setSelectedClassSlotKey(e.target.value)}
                        disabled={isLoading || isScanning}
                        containerClassName="mb-0"
                    />

                    <div className="mt-4 text-center">
                        {!isScanning ? (
                             <Button onClick={startScanner} disabled={!selectedClassSlotKey || isLoading} variant="primary" size="lg">
                                <CameraIcon className="w-5 h-5 mr-2"/> Start Scanner
                            </Button>
                        ) : (
                             <Button onClick={stopScanner} variant="danger" size="lg">
                                <TimesCircleIcon className="w-5 h-5 mr-2"/> Stop Scanner
                            </Button>
                        )}
                    </div>
                    
                    <div id={readerId} className={isScanning ? 'mt-4 border border-brand-neutral-300 rounded-lg overflow-hidden' : ''}></div>
                    
                    {scanResult && (
                        <div className={`mt-4 p-4 rounded-md flex items-start space-x-3 ${
                            scanResult.status === 'success' ? 'bg-brand-success-light text-brand-success-dark' :
                            scanResult.status === 'error' ? 'bg-brand-error-light text-brand-error-dark' :
                            'bg-brand-info-light text-brand-info'
                        }`}>
                            {scanResult.status === 'success' && <CheckCircleIcon className="w-6 h-6"/>}
                            {scanResult.status === 'error' && <TimesCircleIcon className="w-6 h-6"/>}
                            <p className="font-medium">{scanResult.message}</p>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default AttendanceScannerPage;
