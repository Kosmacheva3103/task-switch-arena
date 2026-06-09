'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  seconds: number;
  onComplete?: () => void;
}

export default function Timer({ seconds, onComplete }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft, onComplete]);

  const percentage = seconds > 0 ? (timeLeft / seconds) * 100 : 0;
  const isLow = timeLeft <= 3;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-400">Осталось времени</span>
        <span className={`text-2xl font-bold ${isLow ? 'text-red-500 animate-pulse' : 'text-white'}`}>
          {timeLeft}с
        </span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-3">
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