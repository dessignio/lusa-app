
import React, { useState, useEffect } from 'react';

const Clock: React.FC<{className?: string}> = ({ className }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timerId = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timerId);
    }, []);

    const dateOptions: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };

    return (
        <div className={`text-center ${className || ''}`}>
            <span className="font-medium">{time.toLocaleDateString('en-US', dateOptions)}</span>
            <span className="font-mono ml-2 tracking-wider">{time.toLocaleTimeString('en-US', timeOptions)}</span>
        </div>
    );
};

export default Clock;
