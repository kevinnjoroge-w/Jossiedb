import React from 'react';

const Loading = ({ size = 'md', text = 'Loading...' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className="flex flex-col items-center justify-center gap-3 py-8">
            <svg
                className={`animate-spin text-primary-600 ${sizes[size]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                ></circle>
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
            </svg>
            {text && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{text}</p>
            )}
        </div>
    );
};

export const Skeleton = ({ className = '', count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div key={index} className={`skeleton ${className}`} />
            ))}
        </>
    );
};

export const TableSkeleton = ({ rows = 5, columns = 5 }) => {
    return (
        <div className="space-y-3">
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-4">
                    {Array.from({ length: columns }).map((_, colIndex) => (
                        <Skeleton key={colIndex} className="h-10 flex-1" />
                    ))}
                </div>
            ))}
        </div>
    );
};

export default Loading;
