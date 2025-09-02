import React from 'react';
import { BriefingContent } from '../../types/game';
import Card from '../ui/Card';

interface RouteBriefingProps {
    content: BriefingContent;
}

const RouteBriefing: React.FC<RouteBriefingProps> = ({ content }) => {
    return (
        <>
            {content.description && (
                <Card.Section title="Description">
                    <p className="text-base text-neutral-300">{content.description}</p>
                </Card.Section>
            )}
        </>
    );
};

export default RouteBriefing;
