import React from 'react';

interface SliderControlProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  color?: 'blue' | 'purple' | 'orange' | 'cyan' | 'green' | 'pink' | 'yellow';
}

const SliderControl: React.FC<SliderControlProps> = ({
  label,
  value,
  min,
  max,
  onChange,
  color = 'blue',
}) => {
  const colorClasses = {
    blue: 'text-blue-400 accent-blue-500',
    purple: 'text-purple-400 accent-purple-500',
    orange: 'text-orange-400 accent-orange-500',
    cyan: 'text-cyan-400 accent-cyan-500',
    green: 'text-green-400 accent-green-500',
    pink: 'text-pink-400 accent-pink-500',
    yellow: 'text-yellow-400 accent-yellow-500',
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseInt(e.target.value));
  };

  return (
    <div className="bg-slate-900/50 rounded-xl p-3 border border-slate-700/50">
      <div className="flex justify-between items-center mb-2">
        <label className="text-xs font-medium text-slate-300">{label}</label>
        <span className={`text-xs font-bold min-w-[3ch] text-right ${colorClasses[color].split(' ')[0]}`}>
          {value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={handleChange}
        className={`w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer ${colorClasses[color].split(' ')[1]}`}
      />
    </div>
  );
};

export default SliderControl;

