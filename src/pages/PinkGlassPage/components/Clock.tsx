import React, { useState, useEffect } from 'react';

interface ClockProps {
    format: '12h' | '24h';
}

const Clock: React.FC<ClockProps> = ({ format }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const formattedTime = time.toLocaleTimeString('en-US', {
        hour12: format === '12h',
        hour: 'numeric',
        minute: '2-digit',
    });

    return (
        <div className="absolute top-20 left-6 text-white/80 font-light text-xl tracking-wider select-none mix-blend-overlay z-10">
            {formattedTime}
        </div>
    );
};

export default Clock;