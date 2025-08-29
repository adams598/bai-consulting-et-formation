// LessonDuration.tsx
import React from 'react';

interface LessonDurationProps {
  value: string;
  onChange: (value: string) => void;
}

export default function LessonDuration({ value, onChange }: LessonDurationProps) {
  // Convertir HH:MM en HH:MM pour l'input time
  const timeValue = value || '00:00';

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div>
      <label htmlFor="duration" className="lesson-label">
        Durée estimée (HH:MM)
      </label>

      <div className="max-w-32">
        <input
          type="time"
          value={timeValue}
          onChange={handleTimeChange}
          className="py-2.5 sm:py-3 px-4 block w-full border-gray-200 rounded-lg sm:text-sm focus:border-blue-500 focus:ring-blue-500 disabled:opacity-50 disabled:pointer-events-none dark:bg-neutral-900 dark:border-neutral-700 dark:text-neutral-200 dark:placeholder-neutral-400 dark:focus:ring-neutral-600"
          placeholder="Basic time picker"
        />
      </div>

      <p className="text-xs text-gray-500 mt-2">
        Durée estimée pour compléter cette leçon
      </p>
    </div>
  );
}
