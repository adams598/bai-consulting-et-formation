import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
  onClick?: () => void;
  loading?: boolean;
}

const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  onClick,
  loading = false
}) => {
  const colorConfig = {
    blue: {
      bg: 'bg-blue-50',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
      accent: 'border-blue-200'
    },
    green: {
      bg: 'bg-green-50',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
      accent: 'border-green-200'
    },
    yellow: {
      bg: 'bg-yellow-50',
      iconBg: 'bg-yellow-100',
      iconColor: 'text-yellow-600',
      accent: 'border-yellow-200'
    },
    red: {
      bg: 'bg-red-50',
      iconBg: 'bg-red-100',
      iconColor: 'text-red-600',
      accent: 'border-red-200'
    },
    purple: {
      bg: 'bg-purple-50',
      iconBg: 'bg-purple-100',
      iconColor: 'text-purple-600',
      accent: 'border-purple-200'
    },
    gray: {
      bg: 'bg-gray-50',
      iconBg: 'bg-gray-100',
      iconColor: 'text-gray-600',
      accent: 'border-gray-200'
    }
  };

  const config = colorConfig[color];

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
            <div className="w-12 h-6 bg-gray-200 rounded"></div>
          </div>
          <div className="w-3/4 h-4 bg-gray-200 rounded mb-2"></div>
          <div className="w-1/2 h-3 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-6 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''
      } ${config.bg} ${config.accent}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${config.iconBg}`}>
          <Icon className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        
        {trend && (
          <div className={`flex items-center text-sm ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            <span className="font-medium">
              {trend.isPositive ? '+' : ''}{trend.value}%
            </span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </span>
        </div>
        
        <p className="text-sm font-medium text-gray-600">
          {title}
        </p>
        
        {subtitle && (
          <p className="text-xs text-gray-500">
            {subtitle}
          </p>
        )}
        
        {trend && (
          <p className="text-xs text-gray-500">
            {trend.label}
          </p>
        )}
      </div>
    </div>
  );
};

export default StatsCard;
