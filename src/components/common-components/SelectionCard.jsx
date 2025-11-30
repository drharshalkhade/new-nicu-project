import React from 'react';
import { CheckCircle } from 'lucide-react';

const SelectionCard = ({
    value,
    onChange,
    options,
    multi = false,
    cols = 2
}) => {
    const handleSelect = (optionValue) => {
        if (multi) {
            const currentValues = Array.isArray(value) ? value : [];
            const newValue = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue];
            onChange?.(newValue);
        } else {
            onChange?.(optionValue);
        }
    };

    return (
        <div className={`grid grid-cols-1 sm:grid-cols-${cols} gap-3`}>
            {options.map((option) => {
                const isSelected = multi
                    ? (Array.isArray(value) && value.includes(option.value))
                    : value === option.value;

                return (
                    <div
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={`
              relative flex items-center p-4 cursor-pointer rounded-xl border-2 transition-all duration-200 group
              ${isSelected
                                ? 'border-blue-600 bg-blue-50 shadow-md'
                                : 'border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50'
                            }
            `}
                    >
                        <div className={`
              p-2 rounded-lg mr-3 transition-colors
              ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600'}
            `}>
                            {option.icon}
                        </div>
                        <div className="flex-1">
                            <p className={`font-semibold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                                {option.label}
                            </p>
                            {option.description && (
                                <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                            )}
                        </div>
                        {isSelected && (
                            <div className="absolute top-3 right-3 text-blue-600">
                                <CheckCircle size={18} className="fill-blue-100" />
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default SelectionCard;
