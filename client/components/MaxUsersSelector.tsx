"use client";

interface MaxUsersSelectorProps {
    value: number;
    onChange: (value: number) => void;
}

export default function MaxUsersSelector({ value, onChange }: MaxUsersSelectorProps) {
    const options = [5, 10, 20, 50];

    return (
        <div className="w-full">
            <div className="grid grid-cols-2 gap-3">
                {options.map((option) => (
                    <button
                        key={option}
                        type="button"
                        onClick={() => onChange(option)}
                        className={`
                            px-6 py-4 rounded-lg font-semibold text-lg
                            transition-all duration-200 
                            ${value === option
                                ? 'bg-[#4169E1] text-[#F8F6F0] border-2 border-[#4169E1] shadow-lg shadow-[#4169E1]/50 scale-105'
                                : 'bg-[#F8F6F0]/5 text-[#F8F6F0]/70 border-2 border-[#F8F6F0]/20 hover:border-[#4169E1]/50 hover:bg-[#F8F6F0]/10 hover:text-[#F8F6F0]'
                            }
                        `}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-2xl font-bold">{option}</span>
                            <span className="text-xs mt-1 opacity-80">
                                {option === 1 ? 'user' : 'users'}
                            </span>
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
