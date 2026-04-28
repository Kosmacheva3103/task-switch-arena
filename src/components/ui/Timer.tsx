'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
}

export default function Timer({ seconds, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  const percentage = (timeLeft / seconds) * 100;
  const isLow = timeLeft <= 3;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500">Осталось времени</span>
        <span className={`text-2xl font-bold ${isLow ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
          {timeLeft}с
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all duration-1000 ${
            isLow ? 'bg-red-500' : percentage > 50 ? 'bg-green-500' : 'bg-yellow-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}