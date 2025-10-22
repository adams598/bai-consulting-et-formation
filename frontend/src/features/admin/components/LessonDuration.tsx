// LessonDuration.tsx
import React, { useState, useEffect } from 'react';

interface LessonDurationProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LessonDuration({ value, onChange }: LessonDurationProps) {
  // Extraire les minutes et secondes du format MM:SS
  const [minutes, setMinutes] = useState('00');
  const [seconds, setSeconds] = useState('00');

  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length === 2) {
        setMinutes(parts[0].padStart(2, '0'));
        setSeconds(parts[1].padStart(2, '0'));
      }
    }
  }, [value]);

  const handleMinutesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Supprimer les non-chiffres
    const numVal = Math.min(parseInt(val || '0'), 999); // Max 999 minutes
    const formattedMin = numVal.toString().padStart(2, '0');
    setMinutes(formattedMin);
    onChange(`${formattedMin}:${seconds}`);
  };

  const handleSecondsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, ''); // Supprimer les non-chiffres
    const numVal = Math.min(parseInt(val || '0'), 59); // Max 59 secondes
    const formattedSec = numVal.toString().padStart(2, '0');
    setSeconds(formattedSec);
    onChange(`${minutes}:${formattedSec}`);
  };

  return (
    <div>
      <label htmlFor="duration" className="lesson-label">
        Durée estimée (MM:SS)
      </label>

      <div className="flex items-center gap-2 max-w-40">
        <input
          type="text"
          value={minutes}
          onChange={handleMinutesChange}
          maxLength={3}
          placeholder="MM"
          className="py-2.5 sm:py-3 px-4 w-20 text-center border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400 dark:focus:ring-neutral-600"
        />
        <span className="text-gray-500">:</span>
        <input
          type="text"
          value={seconds}
          onChange={handleSecondsChange}
          maxLength={2}
          placeholder="SS"
          className="py-2.5 sm:py-3 px-4 w-20 text-center border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400 dark:focus:ring-neutral-600"
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Format : Minutes:Secondes (ex: 02:30 pour 2 minutes 30 secondes)
      </p>
    </div>
  );
}
