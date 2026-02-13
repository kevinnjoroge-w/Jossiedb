import React from 'react';

const Input = React.forwardRef(({
    label,
    error,
    icon: Icon,
    className = '',
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">
                    {label}
                </label>
            )}
            <div className="relative">
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon className="w-5 h-5" />
                    </div>
                )}
                <input
                    ref={ref}
                    className={`${error ? 'input-error' : 'input'} ${Icon ? 'pl-10' : ''} ${className}`}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export default Input;
