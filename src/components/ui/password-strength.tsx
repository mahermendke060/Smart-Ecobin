import React from 'react';
import { getPasswordStrengthScore } from '@/utils/validation';

interface PasswordStrengthProps {
  password: string;
  className?: string;
}

export const PasswordStrength: React.FC<PasswordStrengthProps> = ({ 
  password, 
  className = "" 
}) => {
  const { score, label, color } = getPasswordStrengthScore(password);
  
  if (!password) return null;

  const strengthBars = Array.from({ length: 4 }, (_, index) => (
    <div
      key={index}
      className={`h-1 rounded-full transition-colors duration-200 ${
        index < Math.ceil(score / 2) 
          ? score <= 2 
            ? 'bg-red-500' 
            : score <= 4 
            ? 'bg-yellow-500' 
            : score <= 5 
            ? 'bg-blue-500' 
            : 'bg-green-500'
          : 'bg-gray-200'
      }`}
    />
  ));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex gap-1">
        {strengthBars}
      </div>
      <p className={`text-sm font-medium ${color}`}>
        Password strength: {label}
      </p>
    </div>
  );
};
