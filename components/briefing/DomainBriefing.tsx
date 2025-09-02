import React from 'react';
import { BriefingContent, WorldProfile } from '../../types/game';
import Card from '../ui/Card';
import ChipCard from '../ui/ChipCard';
import { getIconForEntityType } from '../../utils/entityUtils';

interface DomainBriefingProps {
    content: BriefingContent;
    world: WorldProfile | null;
}

const DomainBriefing: React.FC<DomainBriefingProps> = ({ content, world }) => {
    return (
        <>
            {content.isContested && content.enclavesByOwner ? (
                (() => {
                    const ownerOrder = ['player-1', 'player-2', 'null'];
                    const sortedOwners = Object.keys(content.enclavesByOwner!).sort((a, b) => {
                        const indexA = ownerOrder.indexOf(a);
                        const indexB = ownerOrder.indexOf(b);
                        if (indexA === -1) return 1;
                        if (indexB === -1) return -1;
                        return indexA - indexB;
                    });

                    return sortedOwners.map(ownerKey => {
                        const enclaves = content.enclavesByOwner![ownerKey];
                        if (!enclaves || enclaves.length === 0) return null;
                        
                        let ownerName = 'Neutral';
                        if (ownerKey === 'player-1') ownerName = 'Player-1';
                        if (ownerKey === 'player-2') ownerName = 'Player-2';
                        
                        return (
                            <Card.Section key={ownerKey} title={`${ownerName} Enclaves`}>
                                {enclaves.map(enclave => (
                                    <ChipCard
                                        key={enclave.id}
                                        icon={getIconForEntityType('enclave')}
                                        title={enclave.name}
                                        value={enclave.forces}
                                        valueType="force"
                                        owner={enclave.owner}
                                        worldPalette={world?.neutralColorPalette}
                                    />
                                ))}
                            </Card.Section>
                        );
                    });
                })()
            ) : content.enclaves ? (
                 <Card.Section title="Enclaves">
                    {content.enclaves.map(enclave => (
                        <ChipCard
                            key={enclave.id}
                            icon={getIconForEntityType('enclave')}
                            title={enclave.name}
                            value={enclave.forces}
                            valueType="force"
                            owner={enclave.owner}
                            worldPalette={world?.neutralColorPalette}
                        />
                    ))}
                </Card.Section>
            ) : null}
        </>
    );
};

export default DomainBriefing;
