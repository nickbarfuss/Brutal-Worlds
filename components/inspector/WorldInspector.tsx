import React from 'react';
import { WorldProfile, Domain, Enclave, Owner, Rift, Expanse } from '../../types/game';
import { DISASTER_PROFILES } from '../../data/disasters';
import Card from '../ui/Card';
import ChipCard from '../ui/ChipCard';
import { getIconForEntityType } from '../../utils/entityUtils';
import { getAssetUrl } from '../../utils/assetUtils';

interface WorldInspectorProps {
    world: WorldProfile;
    domainData: { [id: number]: Domain };
    enclaveData: { [id: number]: Enclave };
    riftData: { [id: number]: Rift };
    expanseData: { [id: number]: Expanse };
    onTriggerDisaster: (key: string) => void;
    onPointerMove: (e: React.PointerEvent<HTMLDivElement>) => void;
    onPointerLeave: (e: React.PointerEvent<HTMLDivElement>) => void;
}

const WorldInspector: React.FC<WorldInspectorProps> = ({ world, domainData, enclaveData, riftData, expanseData, onTriggerDisaster, onPointerMove, onPointerLeave }) => {
    const domains = Object.values(domainData).sort((a, b) => a.name.localeCompare(b.name));
    const expanses = Object.values(expanseData).sort((a, b) => a.name.localeCompare(b.name));
    const rifts = Object.values(riftData).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <>
             <div className="sticky top-0 bg-neutral-900/80 backdrop-blur-sm z-10 flex-shrink-0">
                <div className="w-full h-2 bg-neutral-800" />
                <Card.Header 
                    icon={getIconForEntityType('world')}
                    iconColorHex={world.neutralColorPalette.base}
                    title={world.name}
                />
            </div>
            <div className="flex-grow overflow-y-auto no-scrollbar" onPointerMove={onPointerMove} onPointerLeave={onPointerLeave}>
                <div className="w-full aspect-video">
                    <img 
                        src={getAssetUrl(world.illustrationUrl)}
                        className="w-full h-full object-cover"
                        alt={`Illustration of ${world.name}`}
                    />
                </div>
                
                <Card.Section title="Description">
                    <p className="text-base text-neutral-300">{world.description}</p>
                </Card.Section>

                {world.possibleDisasters.length > 0 && (
                    <Card.Section title="Possible Disasters">
                        <div className="space-y-2">
                            {world.possibleDisasters.map(disasterKey => {
                                const disaster = DISASTER_PROFILES[disasterKey];
                                if (!disaster) return null;
                                return (
                                    <ChipCard 
                                        key={disasterKey}
                                        icon={disaster.ui.icon}
                                        iconColorClass="text-amber-400"
                                        title={disaster.ui.name}
                                        subtitle={disaster.ui.description.split('.')[0] + '.'}
                                        briefingProps={{ type: 'disasterProfile', key: disasterKey }}
                                        onClick={() => onTriggerDisaster(disasterKey)}
                                    />
                                );
                            })}
                        </div>
                    </Card.Section>
                )}
                
                {domains.map(domain => {
                    const enclavesInDomain = Object.values(enclaveData)
                        .filter(e => e.domainId === domain.id)
                        .sort((a, b) => a.name.localeCompare(b.name));
                    
                    if (enclavesInDomain.length === 0) return null;

                    return (
                        <Card.Section key={domain.id} title={domain.name}>
                            <div className="space-y-2">
                                {enclavesInDomain.map(enclave => (
                                    <ChipCard
                                        key={enclave.id}
                                        icon={getIconForEntityType('enclave')}
                                        title={enclave.name}
                                        value={enclave.forces}
                                        valueType="force"
                                        owner={enclave.owner}
                                        worldPalette={world.neutralColorPalette}
                                    />
                                ))}
                            </div>
                        </Card.Section>
                    );
                })}

                {expanses.length > 0 && (
                     <Card.Section title="Expanses">
                        <div className="space-y-2">
                            {expanses.map(expanse => (
                                <ChipCard
                                    key={expanse.id}
                                    icon={getIconForEntityType('expanse')}
                                    title={expanse.name}
                                    worldPalette={world.neutralColorPalette}
                                />
                            ))}
                        </div>
                    </Card.Section>
                )}

                {rifts.length > 0 && (
                     <Card.Section title="Rifts">
                        <div className="space-y-2">
                            {rifts.map(rift => (
                                <ChipCard
                                    key={rift.id}
                                    icon={getIconForEntityType('rift')}
                                    title={rift.name}
                                    worldPalette={world.neutralColorPalette}
                                />
                            ))}
                        </div>
                    </Card.Section>
                )}
            </div>
        </>
    );
};

export default WorldInspector;