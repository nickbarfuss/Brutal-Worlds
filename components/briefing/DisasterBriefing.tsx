import React from 'react';
import { BriefingContent } from '../../types/game';
import Card from '../ui/Card';
import ChipCard from '../ui/ChipCard';

interface DisasterBriefingProps {
    content: BriefingContent;
}

const DisasterBriefing: React.FC<DisasterBriefingProps> = ({ content }) => {
    return (
        <>
            {content.disasterDescription && (
                <Card.Section title="Description">
                    <p className="text-base text-neutral-300">{content.disasterDescription}</p>
                </Card.Section>
            )}
            {content.alertPhase && (
                <Card.Section title="Alert Phase">
                    <ChipCard icon="looks_one" iconColorClass="text-amber-400" title={content.alertPhase.name} subtitle={content.alertPhase.effect} value={content.alertPhase.duration} valueType="duration" />
                </Card.Section>
            )}
            {content.impactPhase && (
                <Card.Section title="Impact Phase">
                    <ChipCard icon="looks_two" iconColorClass="text-amber-400" title={content.impactPhase.name} subtitle={content.impactPhase.effect} value={content.impactPhase.duration} valueType="duration" />
                </Card.Section>
            )}
            {content.aftermathPhase && (
                <Card.Section title="Aftermath Phase">
                    <ChipCard icon="looks_3" iconColorClass="text-amber-400" title={content.aftermathPhase.name} subtitle={content.aftermathPhase.effect} value={content.aftermathPhase.duration} valueType="duration" />
                </Card.Section>
            )}
        </>
    );
};

export default DisasterBriefing;