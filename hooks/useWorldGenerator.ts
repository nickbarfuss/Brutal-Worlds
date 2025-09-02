
import * as THREE from 'three';
import { geoVoronoi } from 'd3-geo-voronoi';
import { geoCentroid } from 'd3-geo';
import { MapCell, Enclave, Domain, Route, Rift, Expanse, WorldProfile } from '../types/game';
import { GAME_CONFIG } from '../data/config';
import { convertLatLonToVector3 as convertLatLonToVector3Util } from '../utils/geo';

// A simple seeded pseudo-random number generator (PRNG) to make world generation deterministic.
const createSeededRandom = (seed: number) => {
    return () => {
        seed = (seed * 9301 + 49297) % 233280;
        return seed / 233280;
    };
};

// List of available enclave image numbers, based on provided URLs
const availableImageNumbers = [
    ...Array.from({ length: 20 }, (_, i) => i + 1), // 1-20
    22, 23, 25, 26, 27, 28, 30, 31, 120
];
const enclaveImageUrls = availableImageNumbers.map(num => 
    `https://storage.googleapis.com/brutal-worlds/enclave/enclave-${String(num).padStart(3, '0')}.jpg`
);


export const generateNewWorld = (worldProfile: WorldProfile): {
    newMapData: MapCell[];
    newEnclaveData: { [id: number]: Enclave };
    newDomainData: { [id: number]: Domain };
    newRiftData: { [id: number]: Rift };
    newExpanseData: { [id: number]: Expanse };
    newRoutes: Route[];
    planetName: string;
} => {
    const { config, names } = worldProfile;
    const random = createSeededRandom(config.seed);
    const SPHERE_RADIUS = config.SPHERE_RADIUS;

    const convertLatLonToVector3 = (lat: number, lon: number) => convertLatLonToVector3Util(lat, lon, SPHERE_RADIUS);
    
    // --- 1. Generate Voronoi Data ---
    const sites: [number, number][] = [];
    while (sites.length < config.NUM_POINTS) {
        const lon = random() * 360 - 180;
        const lat = random() * 180 - 90;
        const absLat = Math.abs(lat);
        const poleBias = 1.0 - Math.pow(absLat / 90, 2) * 0.9;
        if (random() < poleBias) sites.push([lon, lat]);
    }
    const voronoi = geoVoronoi(sites);
    const polygons = voronoi.polygons().features;
    const neighbors: number[][] = Array.from({ length: sites.length }, () => []);
    voronoi.links().features.forEach(link => {
        const sourceIndex = sites.findIndex(s => s[0] === link.properties.source[0] && s[1] === link.properties.source[1]);
        const targetIndex = sites.findIndex(s => s[0] === link.properties.target[0] && s[1] === link.properties.target[1]);
        if (sourceIndex > -1 && targetIndex > -1) {
            neighbors[sourceIndex].push(targetIndex);
            neighbors[targetIndex].push(sourceIndex);
        }
    });
    
    // Calculate cell centers once, and include them in the map data.
    const cellCenters: [number, number][] = polygons.map(p => geoCentroid(p.geometry));
    let newMapData: MapCell[] = polygons.map((p, i) => ({
        id: i, polygon: p.geometry, neighbors: neighbors[i] || [], type: 'void', domainId: null,
        voidId: null, voidType: null, enclaveId: null, owner: null, baseMaterialIndex: 3, geometryGroupIndex: -1,
        center: convertLatLonToVector3(cellCenters[i][1], cellCenters[i][0]),
    }));

    // --- 2. Generate Domains (Continents/Islands) ---
    const landCoverage = random() * (config.LAND_COVERAGE_MAX - config.LAND_COVERAGE_MIN) + config.LAND_COVERAGE_MIN;
    const totalLandCells = Math.floor(config.NUM_POINTS * landCoverage);
    const numDomains = names.domains.length;
    const numIslands = Math.floor(random() * (config.ISLAND_DOMAINS_MAX - config.ISLAND_DOMAINS_MIN + 1)) + config.ISLAND_DOMAINS_MIN;
    
    const domainSpecs = Array.from({ length: numDomains }, (_, id) => ({
        id, size: 0, isIsland: id < numIslands, strength: names.domains[id].strength,
    }));

    let remainingLand = totalLandCells;
    const numContinents = numDomains - numIslands;
    if (numContinents > 0) {
        const avgContinentSize = Math.floor(remainingLand / numContinents);
        domainSpecs.forEach(spec => {
            if (!spec.isIsland) {
                const size = Math.max(config.ENCLAVE_SIZE_MAX, Math.floor(avgContinentSize * (random() * 0.4 + 0.8)));
                spec.size = Math.min(size, remainingLand);
                remainingLand -= spec.size;
            }
        });
    }
    domainSpecs.forEach(spec => {
        if (spec.isIsland) {
            const size = Math.floor(random() * (config.ENCLAVE_SIZE_MAX * 2 - config.ENCLAVE_SIZE_MIN) + config.ENCLAVE_SIZE_MIN);
            spec.size = Math.min(size, remainingLand);
            remainingLand -= spec.size;
        }
    });

    domainSpecs.forEach(spec => {
        if (spec.size <= 0) return;
        const unassigned = newMapData.filter(c => c.type === 'void');
        if (unassigned.length === 0) return;

        let startCell: MapCell | undefined;
        if (spec.isIsland) {
            const oceanic = unassigned.filter(c => !c.neighbors.some(nId => newMapData[nId]?.type === 'area'));
            startCell = oceanic.length > 0 ? oceanic[Math.floor(random() * oceanic.length)] : unassigned[Math.floor(random() * unassigned.length)];
        } else {
             const coastal = unassigned.filter(c => c.neighbors.some(nId => newMapData[nId]?.type === 'area'));
             startCell = coastal.length > 0 && random() < config.DOMAIN_TOUCH_CHANCE ? coastal[Math.floor(random() * coastal.length)] : unassigned[Math.floor(random() * unassigned.length)];
        }

        if (!startCell) return;
        const queue = [startCell.id];
        const visited = new Set([startCell.id]);
        startCell.type = 'area';
        startCell.domainId = spec.id;
        let count = 1;

        while (queue.length > 0 && count < spec.size) {
            const currentId = queue.shift()!;
            const shuffledNeighbors = [...newMapData[currentId].neighbors].sort(() => random() - 0.5);
            for (const neighborId of shuffledNeighbors) {
                if (count >= spec.size) break;
                const neighbor = newMapData[neighborId];
                if (neighbor && neighbor.type === 'void' && !visited.has(neighborId)) {
                    visited.add(neighborId);
                    const isCoastal = neighbor.neighbors.some(nId => newMapData[nId]?.type === 'void' && !visited.has(nId));
                    if (!isCoastal || random() > config.PENINSULA_CHANCE) {
                        neighbor.type = 'area';
                        neighbor.domainId = spec.id;
                        queue.push(neighborId);
                        count++;
                    }
                }
            }
        }
    });

    // --- 3. Carve Enclaves ---
    let enclaveIdCounter = 0;
    const landCells = newMapData.filter(c => c.type === 'area');
    const visitedEnclaveCarving = new Set<number>();

    landCells.forEach(startCell => {
        if (visitedEnclaveCarving.has(startCell.id) || startCell.domainId === null) return;
        const enclaveSize = Math.floor(random() * (config.ENCLAVE_SIZE_MAX - config.ENCLAVE_SIZE_MIN + 1)) + config.ENCLAVE_SIZE_MIN;
        const enclaveCells: number[] = [];
        const queue = [startCell.id];
        visitedEnclaveCarving.add(startCell.id);

        while (queue.length > 0 && enclaveCells.length < enclaveSize) {
            const cellId = queue.shift()!;
            const cell = newMapData[cellId];
            if (cell.domainId === startCell.domainId && cell.enclaveId === null) {
                enclaveCells.push(cellId);
                cell.neighbors.forEach(nId => {
                    const neighbor = newMapData[nId];
                    if (neighbor && !visitedEnclaveCarving.has(nId) && neighbor.domainId === startCell.domainId) {
                        visitedEnclaveCarving.add(nId);
                        queue.push(nId);
                    }
                });
            }
        }
        enclaveCells.forEach(id => newMapData[id].enclaveId = enclaveIdCounter);
        enclaveIdCounter++;
    });
    
    // Assign stragglers
    let stragglers = newMapData.filter(c => c.type === 'area' && c.enclaveId === null);
    let iterations = 0;
    while(stragglers.length > 0 && iterations < 5) {
        let assignedInPass = 0;
        stragglers.forEach(cell => {
            const neighborEnclaves = cell.neighbors
                .map(nId => newMapData[nId]?.enclaveId)
                .filter(id => id !== null);
            if (neighborEnclaves.length > 0) {
                const counts = neighborEnclaves.reduce((acc, id) => { acc[id!] = (acc[id!] || 0) + 1; return acc; }, {} as {[id: number]: number});
                const mostCommonEnclaveId = Object.keys(counts).reduce((a, b) => counts[parseInt(a)] > counts[parseInt(b)] ? a : b);
                cell.enclaveId = parseInt(mostCommonEnclaveId, 10);
                assignedInPass++;
            }
        });
        stragglers = newMapData.filter(c => c.type === 'area' && c.enclaveId === null);
        if (assignedInPass === 0 && stragglers.length > 0) {
            const pocket = stragglers[0];
            const newEnclaveId = enclaveIdCounter++;
            const queue = [pocket.id];
            const visitedPocket = new Set([pocket.id]);
            pocket.enclaveId = newEnclaveId;
            while(queue.length > 0) {
                const currentId = queue.shift()!;
                newMapData[currentId].neighbors.forEach(nId => {
                    const neighbor = newMapData[nId];
                    if (neighbor?.type === 'area' && neighbor.enclaveId === null && !visitedPocket.has(nId)) {
                        visitedPocket.add(nId);
                        neighbor.enclaveId = newEnclaveId;
                        queue.push(nId);
                    }
                });
            }
        }
        stragglers = newMapData.filter(c => c.type === 'area' && c.enclaveId === null);
        iterations++;
    }

    // Merge micro-enclaves
    const enclaveCellCounts = newMapData.reduce((acc, cell) => {
        if (cell.enclaveId !== null) acc[cell.enclaveId] = (acc[cell.enclaveId] || 0) + 1;
        return acc;
    }, {} as { [id: number]: number });
    Object.entries(enclaveCellCounts).forEach(([enclaveIdStr, count]) => {
        const enclaveId = parseInt(enclaveIdStr, 10);
        if ((count as number) < 3) {
            const microCells = newMapData.filter(c => c.enclaveId === enclaveId);
            const neighborEnclaves: { [id: number]: number } = {};
            microCells.forEach(cell => {
                cell.neighbors.forEach(nId => {
                    const neighbor = newMapData[nId];
                    if (neighbor?.enclaveId !== null && neighbor.enclaveId !== enclaveId) {
                        neighborEnclaves[neighbor.enclaveId] = (neighborEnclaves[neighbor.enclaveId] || 0) + 1;
                    }
                });
            });
            const largestNeighborId = Object.keys(neighborEnclaves).length > 0 ?
                Object.keys(neighborEnclaves).reduce((a, b) => enclaveCellCounts[parseInt(a)] > enclaveCellCounts[parseInt(b)] ? a : b) : null;
            if (largestNeighborId) microCells.forEach(cell => cell.enclaveId = parseInt(largestNeighborId, 10));
        }
    });

    // --- 4. Analyze Voids ---
    let voidIdCounter = 0;
    const newRiftData: { [id: number]: Rift } = {};
    const newExpanseData: { [id: number]: Expanse } = {};
    const unvisitedVoids = new Set(newMapData.filter(c => c.type === 'void').map(c => c.id));
    const allVoidBodies: { id: number; size: number; cellIds: Set<number> }[] = [];
    while (unvisitedVoids.size > 0) {
        const startId = unvisitedVoids.values().next().value;
        const queue = [startId];
        const bodyCellIds = new Set([startId]);
        unvisitedVoids.delete(startId);
        while (queue.length > 0) {
            const cellId = queue.shift()!;
            newMapData[cellId].neighbors.forEach(nId => { if (unvisitedVoids.has(nId)) { unvisitedVoids.delete(nId); bodyCellIds.add(nId); queue.push(nId); } });
        }
        allVoidBodies.push({ id: voidIdCounter++, size: bodyCellIds.size, cellIds: bodyCellIds });
    }
    allVoidBodies.sort((a, b) => b.size - a.size);
    const [oceanBody, ...potentialLakes] = allVoidBodies;

    const MIN_RIFT_SIZE = 5;
    const maxRifts = Math.floor(random() * 4);
    const validLakes = potentialLakes.filter(body => body.size >= MIN_RIFT_SIZE);
    const riftsToCreate = validLakes.slice(0, maxRifts);

    riftsToCreate.forEach(body => {
        body.cellIds.forEach(id => { newMapData[id].voidId = voidIdCounter; newMapData[id].voidType = 'rift'; });
        const cells = [...body.cellIds].map(id => newMapData[id]);
        if (cells.length > 0) {
            const averageCenter = new THREE.Vector3();
            cells.forEach(cell => averageCenter.add(cell.center));
            averageCenter.divideScalar(cells.length);
            const closestCell = cells.reduce((closest, current) => 
                current.center.distanceToSquared(averageCenter) < closest.center.distanceToSquared(averageCenter) ? current : closest
            );
            newRiftData[voidIdCounter] = { id: voidIdCounter, name: 'Rift', center: closestCell.center.clone(), description: 'A deep scar in the world\'s surface.' };
        } else {
             newRiftData[voidIdCounter] = { id: voidIdCounter, name: 'Rift', center: new THREE.Vector3(), description: 'A deep scar in the world\'s surface.' };
        }
        voidIdCounter++;
    });

    // --- 4.5 Fill Puddles ---
    const puddlesToProcess = potentialLakes.filter(body => !riftsToCreate.includes(body));
    const PUDDLE_FILL_THRESHOLD = 15; // Increased threshold for stricter filling

    puddlesToProcess.forEach(puddle => {
        if (puddle.size < PUDDLE_FILL_THRESHOLD) {
            const allLandNeighbors: MapCell[] = [];
            const neighborIds = new Set<number>();
            puddle.cellIds.forEach(id => {
                const cell = newMapData[id];
                cell.neighbors.forEach(nId => {
                    const neighbor = newMapData[nId];
                    if (neighbor && neighbor.type === 'area' && !neighborIds.has(nId)) {
                        allLandNeighbors.push(neighbor);
                        neighborIds.add(nId);
                    }
                });
            });

            if (allLandNeighbors.length > 0) {
                const neighborEnclaveCounts = new Map<number, number>();
                allLandNeighbors.forEach(cell => {
                    if (cell.enclaveId !== null) {
                        neighborEnclaveCounts.set(cell.enclaveId, (neighborEnclaveCounts.get(cell.enclaveId) ?? 0) + 1);
                    }
                });

                let targetDomainId: number | null = null;
                let targetEnclaveId: number | null = null;

                if (neighborEnclaveCounts.size > 0) {
                    const mostCommonEnclaveId = [...neighborEnclaveCounts.entries()].reduce((a, b) => a[1] > b[1] ? a : b)[0];
                    const representativeNeighbor = allLandNeighbors.find(n => n.enclaveId === mostCommonEnclaveId);
                    
                    // FIX: This is a critical defensive check. A non-null assertion was here previously,
                    // which could crash the entire world generation process in rare edge cases.
                    if (representativeNeighbor) {
                        targetDomainId = representativeNeighbor.domainId;
                        targetEnclaveId = representativeNeighbor.enclaveId;
                    } else {
                        // This block should not be reached, but as a fallback, assign to the first neighbor.
                        console.warn("Could not find representative neighbor for puddle filling, using fallback.");
                        targetDomainId = allLandNeighbors[0].domainId;
                        targetEnclaveId = allLandNeighbors[0].enclaveId;
                    }
                } else {
                    targetDomainId = allLandNeighbors[0].domainId;
                    targetEnclaveId = null; 
                }
                
                puddle.cellIds.forEach(id => {
                    const cell = newMapData[id];
                    cell.type = 'area';
                    cell.domainId = targetDomainId;
                    cell.enclaveId = targetEnclaveId;
                });
            }
        }
    });

    if (oceanBody) {
        const numExpanses = Math.min(Math.floor(oceanBody.size / config.EXPANSE_MAX_SIZE) || 1, config.EXPANSE_COUNT_MAX);
        const oceanCellIds = Array.from(oceanBody.cellIds);
        if (oceanCellIds.length > 0 && numExpanses > 0) {
            const seeds = [...Array(numExpanses)].map(() => oceanCellIds[Math.floor(random() * oceanCellIds.length)]);
            const queues = seeds.map(seedId => [seedId]);
            const visited = new Set(seeds);
            const expansePartitions = seeds.map(() => new Set<number>());
            let activeQueues = true;
            while (activeQueues) {
                activeQueues = false;
                for (let i = 0; i < queues.length; i++) {
                    const queue = queues[i];
                    if (queue.length > 0) {
                        activeQueues = true;
                        const cellId = queue.shift()!;
                        expansePartitions[i].add(cellId);
                        newMapData[cellId].neighbors.forEach(nId => {
                             if (oceanBody.cellIds.has(nId) && !visited.has(nId)) {
                                 visited.add(nId);
                                 queue.push(nId);
                             }
                        });
                    }
                }
            }
            expansePartitions.forEach(partition => {
                if (partition.size === 0) return;
                partition.forEach(id => { newMapData[id].voidId = voidIdCounter; newMapData[id].voidType = 'expanse'; });
                const cells = [...partition].map(id => newMapData[id]);
                if (cells.length > 0) {
                    const averageCenter = new THREE.Vector3();
                    cells.forEach(cell => averageCenter.add(cell.center));
                    averageCenter.divideScalar(cells.length);
                    const closestCell = cells.reduce((closest, current) => 
                        current.center.distanceToSquared(averageCenter) < closest.center.distanceToSquared(averageCenter) ? current : closest
                    );
                    newExpanseData[voidIdCounter] = { id: voidIdCounter, name: 'Expanse', center: closestCell.center.clone(), description: 'A vast, open body of liquid or void.' };
                } else {
                    newExpanseData[voidIdCounter] = { id: voidIdCounter, name: 'Expanse', center: new THREE.Vector3(), description: 'A vast, open body of liquid or void.' };
                }
                voidIdCounter++;
            });
        }
    }
    
    // --- 5. Finalize Data Structures ---
    const newDomainData: { [id: number]: Domain } = {};
    const newEnclaveData: { [id: number]: Enclave } = {};
    const finalEnclaveIds = new Set(newMapData.map(c => c.enclaveId).filter(id => id !== null));
    finalEnclaveIds.forEach(enclaveId => {
        const cells = newMapData.filter(c => c.enclaveId === enclaveId);
        if (cells.length === 0) return;
        const averageCenter = new THREE.Vector3();
        cells.forEach(cell => averageCenter.add(cell.center));
        averageCenter.divideScalar(cells.length);
        const closestCell = cells.reduce((closest, current) => 
            current.center.distanceToSquared(averageCenter) < closest.center.distanceToSquared(averageCenter) ? current : closest
        );
        const domainId = cells[0]?.domainId ?? -1;
        
        const imageUrl = enclaveImageUrls[Math.floor(random() * enclaveImageUrls.length)];

        newEnclaveData[enclaveId as number] = {
            id: enclaveId as number,
            name: '',
            owner: null,
            forces: 5,
            center: closestCell.center.clone(),
            domainId,
            activeEffects: [],
            vfxToPlayThisTurn: [],
            imageUrl,
        };
    });
    
    const finalDomainIds = new Set(newMapData.map(c => c.domainId).filter(id => id !== null));
    finalDomainIds.forEach(domainId => {
        const cells = newMapData.filter(c => c.domainId === domainId);
        if (cells.length === 0) return;
        const averageCenter = new THREE.Vector3();
        cells.forEach(cell => averageCenter.add(cell.center));
        averageCenter.divideScalar(cells.length);
        const closestCell = cells.reduce((closest, current) => 
            current.center.distanceToSquared(averageCenter) < closest.center.distanceToSquared(averageCenter) ? current : closest
        );
        const isIsland = cells.every(c => c.neighbors.every(nId => newMapData[nId]?.domainId === domainId || newMapData[nId]?.type === 'void'));
        newDomainData[domainId as number] = { id: domainId as number, name: '', isIsland, center: closestCell.center.clone(), strength: 0 };
    });

    // --- 6. Assign Names ---
    let riftNameIndex = 0;
    for (const id in newRiftData) {
        newRiftData[id].name = names.rifts[riftNameIndex % names.rifts.length] || `Rift ${id}`;
        riftNameIndex++;
    }
    let expanseNameIndex = 0;
    for (const id in newExpanseData) {
        newExpanseData[id].name = names.expanses[expanseNameIndex % names.expanses.length] || `Expanse ${id}`;
        expanseNameIndex++;
    }
    names.domains.forEach((domainInfo, index) => {
        if (newDomainData[index]) {
            newDomainData[index].name = domainInfo.name;
            newDomainData[index].strength = domainInfo.strength;
            const enclavesInDomain = Object.values(newEnclaveData).filter(e => e.domainId === index);
            enclavesInDomain.forEach((enclave, eIndex) => {
                enclave.name = domainInfo.enclaves[eIndex]?.name || `${domainInfo.name} Outpost ${eIndex + 1}`;
            });
        }
    });

    // --- 7. Generate Routes ---
    const newRoutes: Route[] = [];
    const createdRoutes = new Set<string>();
    finalEnclaveIds.forEach(enclaveId => {
        const cells = newMapData.filter(c => c.enclaveId === enclaveId);
        const neighborEnclaveIds = new Set<number>();
        cells.forEach(cell => cell.neighbors.forEach(nId => {
            const neighborCell = newMapData[nId];
            if (neighborCell && neighborCell.enclaveId !== null && neighborCell.enclaveId !== enclaveId) {
                neighborEnclaveIds.add(neighborCell.enclaveId);
            }
        }));
        neighborEnclaveIds.forEach(neighborId => {
            const routeKey = [enclaveId, neighborId].sort().join('-');
            if (!createdRoutes.has(routeKey)) {
                newRoutes.push({ from: enclaveId as number, to: neighborId, type: 'land', disabledForTurns: 0, isDestroyed: false });
                createdRoutes.add(routeKey);
            }
        });
    });

    // --- 8. Assign Starting Enclaves ---
    if (GAME_CONFIG.FORCE_ADJACENT_START && GAME_CONFIG.PLAYER_STARTING_ENCLAVES > 1) {
        const allLandEnclaves = Object.values(newEnclaveData);

        const findAdjacentPair = (candidates: Enclave[], occupied: Set<number>): Enclave[] => {
            const shuffled = [...candidates].sort(() => random() - 0.5);
            for (const first of shuffled) {
                if (occupied.has(first.id)) continue;
                
                const neighbors = newRoutes
                    .filter(r => (r.from === first.id || r.to === first.id) && !r.isDestroyed)
                    .map(r => r.from === first.id ? r.to : r.from);
                
                const validSecondCandidates = candidates.filter(c => neighbors.includes(c.id) && c.id !== first.id && !occupied.has(c.id));
                
                if (validSecondCandidates.length > 0) {
                    const second = validSecondCandidates[Math.floor(random() * validSecondCandidates.length)];
                    return [first, second];
                }
            }
            console.warn("Could not find adjacent starting pair in candidate set, using fallback.");
            return candidates.filter(c => !occupied.has(c.id)).slice(0, GAME_CONFIG.PLAYER_STARTING_ENCLAVES);
        };

        const occupiedEnclaves = new Set<number>();
        const sortedEnclaves = allLandEnclaves.sort((a, b) => b.center.y - a.center.y);
        const halfwayIndex = Math.floor(sortedEnclaves.length / 2);
        const northernCandidates = sortedEnclaves.slice(0, halfwayIndex);
        const southernCandidates = sortedEnclaves.slice(halfwayIndex);
        
        const playerStarts = findAdjacentPair(northernCandidates, occupiedEnclaves);
        playerStarts.forEach(e => occupiedEnclaves.add(e.id));
        
        const opponentStarts = findAdjacentPair(southernCandidates, occupiedEnclaves);
        
        playerStarts.forEach(e => { e.owner = 'player-1'; e.forces = 10; });
        opponentStarts.forEach(e => { e.owner = 'player-2'; e.forces = 10; });

    } else {
        const allLandEnclaves = Object.values(newEnclaveData).sort((a, b) => b.center.y - a.center.y);
        const playerStarts = allLandEnclaves.slice(0, GAME_CONFIG.PLAYER_STARTING_ENCLAVES);
        const opponentStarts = allLandEnclaves.slice(-GAME_CONFIG.PLAYER_STARTING_ENCLAVES);
        playerStarts.forEach(e => { e.owner = 'player-1'; e.forces = 10; });
        opponentStarts.forEach(e => { e.owner = 'player-2'; e.forces = 10; });
    }
    
    newMapData.forEach(cell => { if (cell.enclaveId !== null) cell.owner = newEnclaveData[cell.enclaveId].owner; });
    
    return {
        newMapData, newEnclaveData, newDomainData, newRiftData, newExpanseData, newRoutes,
        planetName: worldProfile.name,
    };
};
