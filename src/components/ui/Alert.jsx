import React from 'react';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

const Alert = ({
    variant = 'info',
    title,
    children,
    onClose,
    className = ''
}) => {
    const icons = {
        success: CheckCircle,
        warning: AlertTriangle,
        danger: AlertCircle,
        info: Info,
    };

    const Icon = icons[variant];
    const variantClass = `alert-${variant}`;

    return (
        <div className={`${variantClass} ${className}`}>
            <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
                {title && (
                    <h4 className="font-semibold mb-1">{title}</h4>
                )}
                <div className="text-sm">{children}</div>
            </div>
            {onClose && (
                <button
                    onClick={onClose}
                    className="flex-shrink-0 p-1 hover:bg-black/10 rounded transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
};

export default Alert;
