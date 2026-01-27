import React from 'react';
import { motion } from 'framer-motion';

const Card = ({
    children,
    className = '',
    hover = false,
    onClick,
    ...props
}) => {
    const baseClass = hover ? 'card-hover' : 'card';
    const combinedClassName = `${baseClass} ${className}`.trim();

    const Component = onClick ? motion.div : 'div';
    const motionProps = onClick ? {
        whileHover: { scale: 1.02 },
        whileTap: { scale: 0.98 },
    } : {};

    return (
        <Component
            className={combinedClassName}
            onClick={onClick}
            {...motionProps}
            {...props}
        >
            {children}
        </Component>
    );
};

export const CardHeader = ({ children, className = '' }) => (
    <div className={`card-header ${className}`}>
        {children}
    </div>
);

export const CardBody = ({ children, className = '' }) => (
    <div className={`card-body ${className}`}>
        {children}
    </div>
);

export const CardFooter = ({ children, className = '' }) => (
    <div className={`card-footer ${className}`}>
        {children}
    </div>
);

export default Card;
