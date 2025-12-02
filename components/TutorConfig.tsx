import React from 'react';
import type { TutorConfigData } from '../types';
import { TUTOR_LEVEL_OPTIONS } from '../types';

interface TutorConfigProps {
  value: TutorConfigData;
  onChange: (value: TutorConfigData) => void;
  disabled: boolean;
}

const TutorConfig: React.FC<TutorConfigProps> = ({ value, onChange, disabled }) => {
  const handleChange = (
    field: keyof TutorConfigData,
    fieldValue: string
  ) => {
    onChange({ ...value, [field]: fieldValue });
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="tutor-level" className="block text-sm font-medium text-gray-300 mb-2">
          अपनी कक्षा / परीक्षा का स्तर चुनें:
        </label>
        <select
          id="tutor-level"
          value={value.level}
          onChange={(e) => handleChange('level', e.target.value)}
          disabled={disabled}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg py-2 px-3 text-white focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {TUTOR_LEVEL_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default TutorConfig;
