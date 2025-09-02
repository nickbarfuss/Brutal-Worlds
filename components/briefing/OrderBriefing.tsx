import React from 'react';
import { BriefingContent } from '../../types/game';
import Card from '../ui/Card';
import ChipCard from '../ui/ChipCard';

interface OrderBriefingProps {
    content: BriefingContent;
}

const OrderBriefing: React.FC<OrderBriefingProps> = ({ content }) => {
    return (
        <>
            {content.description && (
                <Card.Section title="Description">
                    <p className="text-base text-neutral-300">{content.description}</p>
                </Card.Section>
            )}
            {content.effect && (
                <Card.Section title="Effect">
                    <p className="text-base text-neutral-300">{content.effect}</p>
                </Card.Section>
            )}
            {content.birthright && (
                <Card.Section title="Birthright">
                    <ChipCard
                        icon={content.birthright.icon}
                        iconColorClass={content.iconColorClass}
                        iconColorHex={content.iconColorHex}
                        title={content.birthright.name}
                        subtitle={content.birthright.effect}
                    />
                </Card.Section>
            )}
        </>
    );
};

export default OrderBriefing;
