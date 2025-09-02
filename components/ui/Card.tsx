import React from 'react';
import ValueDisplay from './ValueDisplay';
import { Owner, WorldProfile } from '../../types/game';

interface CardHeaderProps {
  icon?: string;
  iconColorClass?: string;
  iconColorHex?: string;
  title: string;
  subtitle?: string;
  value?: string | number;
  valueType?: 'force' | 'duration';
  owner?: Owner;
  worldPalette?: WorldProfile['neutralColorPalette'];
  ownerForces?: { owner: Owner; forces: number }[];
}

const CardHeader: React.FC<CardHeaderProps> = ({ 
    icon, iconColorClass, iconColorHex, title, subtitle, 
    value, valueType, owner, worldPalette, ownerForces
}) => {
    const iconStyle = iconColorHex ? { color: iconColorHex } : {};
    const finalIconColorClass = iconColorHex ? '' : iconColorClass;

    return (
      <div className="p-4 flex items-start">
        {icon && <span className={`material-symbols-outlined mr-3 text-3xl ${finalIconColorClass}`} style={iconStyle}>{icon}</span>}
        <div className="flex-grow">
          <h3 className="text-2xl font-bold text-gray-200 leading-tight">{title}</h3>
          {subtitle && <p className="text-lg text-neutral-500 leading-tight -mt-0.5">{subtitle}</p>}
        </div>
        {value !== undefined && valueType && (
          <div className="ml-4">
            <ValueDisplay
                value={value}
                valueType={valueType}
                owner={owner}
                worldPalette={worldPalette}
                size="large"
                ownerForces={ownerForces}
            />
          </div>
        )}
      </div>
    );
};

interface CardSectionProps {
  title?: string;
  children: React.ReactNode;
  hasContent?: boolean; // Default to true
}

const CardSection: React.FC<CardSectionProps> = ({ title, children, hasContent = true }) => {
  if (!hasContent) return null;
  return (
    <>
      <hr className="border-neutral-700" />
      <div className="p-4">
        {title && <h4 className="font-medium text-base text-neutral-600 uppercase tracking-wider mb-2">{title}</h4>}
        <div className="space-y-2">{children}</div>
      </div>
    </>
  );
};

interface CardFooterProps {
    children: React.ReactNode;
}
  
const CardFooter: React.FC<CardFooterProps> = ({ children }) => (
    <div className="flex-shrink-0 mt-auto p-4 bg-neutral-900/80 backdrop-blur-sm border-t border-neutral-700">
        {children}
    </div>
);

interface CardComponentProps {
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    onPointerMove?: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerLeave?: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const CardRoot = React.forwardRef<HTMLDivElement, CardComponentProps>(
  ({ children, className, style, onPointerMove, onPointerLeave }, ref) => (
    <div ref={ref} className={className} style={style} onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
      {children}
    </div>
  )
);
CardRoot.displayName = 'Card';

interface CardComponent extends React.ForwardRefExoticComponent<CardComponentProps & React.RefAttributes<HTMLDivElement>> {
  Header: typeof CardHeader;
  Section: typeof CardSection;
  Footer: typeof CardFooter;
}

const Card = CardRoot as CardComponent;

Card.Header = CardHeader;
Card.Section = CardSection;
Card.Footer = CardFooter;

export default Card;