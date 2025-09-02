import React, { useRef, useState, useLayoutEffect } from 'react';
import { BriefingContent, WorldProfile } from '../../types/game';
import Card from '../ui/Card';
import OrderBriefing from './OrderBriefing';
import EffectBriefing from './EffectBriefing';
import RouteBriefing from './RouteBriefing';
import DomainBriefing from './DomainBriefing';
import DisasterBriefing from './DisasterBriefing';

type BriefingType = 'order' | 'effect' | 'route' | 'domain' | 'disasterProfile';

interface BriefingCardProps {
    briefing: {
        content: BriefingContent;
        targetRect: DOMRect;
        type: BriefingType;
    } | null;
    world: WorldProfile | null;
}

const BriefingCard: React.FC<BriefingCardProps> = ({ briefing, world }) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [style, setStyle] = useState<React.CSSProperties>({ visibility: 'hidden' });

    useLayoutEffect(() => {
        if (!briefing || !cardRef.current) {
            setStyle({ visibility: 'hidden' });
            return;
        }

        const { targetRect } = briefing;
        const cardElem = cardRef.current;
        const cardRect = cardElem.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        const margin = 16; // 1rem

        const position = targetRect.left > windowWidth / 2 ? 'left' : 'right';
        let left: number;
        let transform: string;

        if (position === 'right') {
            left = targetRect.right;
            transform = 'translateX(24px)';
        } else {
            left = targetRect.left;
            transform = 'translateX(calc(-100% - 24px))';
        }

        let top = targetRect.top + targetRect.height / 2 - cardRect.height / 2;
        top = Math.max(margin, top);
        if (top + cardRect.height > windowHeight - margin) {
            top = windowHeight - cardRect.height - margin;
        }

        setStyle({
            top: `${top}px`,
            left: `${left}px`,
            transform,
            visibility: 'visible',
        });
    }, [briefing]);

    if (!briefing) {
        return null;
    }

    const { content, type } = briefing;

    const renderBriefingContent = () => {
        switch (type) {
            case 'order':
                return <OrderBriefing content={content} />;
            case 'effect':
                return <EffectBriefing content={content} />;
            case 'route':
                return <RouteBriefing content={content} />;
            case 'domain':
                return <DomainBriefing content={content} world={world} />;
            case 'disasterProfile':
                return <DisasterBriefing content={content} />;
            default:
                return null;
        }
    };

    return (
        <Card
            ref={cardRef}
            className="fixed w-96 bg-neutral-900 rounded-xl border border-neutral-700/50 shadow-xl pointer-events-none z-30 animate-fade-in-briefing"
            style={style}
        >
            <Card.Header 
                icon={content.icon}
                iconColorClass={content.iconColorClass}
                iconColorHex={content.iconColorHex}
                title={content.title}
                subtitle={content.subtitle}
                value={content.value}
                valueType={content.valueType}
                owner={content.owner}
                worldPalette={content.worldPalette}
                ownerForces={content.ownerForces}
            />
            
            {renderBriefingContent()}

        </Card>
    );
};

export default BriefingCard;