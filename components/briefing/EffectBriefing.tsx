import React from 'react';
import { BriefingContent } from '../../types/game';
import Card from '../ui/Card';

interface EffectBriefingProps {
    content: BriefingContent;
}

const EffectBriefing: React.FC<EffectBriefingProps> = ({ content }) => {
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
        </>
    );
};

export default EffectBriefing;
