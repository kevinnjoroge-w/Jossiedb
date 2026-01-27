import React from 'react';
import { X } from 'lucide-react';

const Badge = ({
    children,
    variant = 'primary',
    onRemove,
    className = '',
    ...props
}) => {
    const variantClass = `badge-${variant}`;
    const combinedClassName = `badge ${variantClass} ${className}`.trim();

    return (
        <span className={combinedClassName} {...props}>
            {children}
            {onRemove && (
                <button
                    onClick={onRemove}
                    className="ml-1 hover:bg-black/10 rounded-full p-0.5 transition-colors"
                    type="button"
                >
                    <X className="w-3 h-3" />
                </button>
            )}
        </span>
    );
};

export default Badge;
