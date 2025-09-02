
import { GambitProfile } from '../types/profiles';

export const GAMBITS: { [key: string]: GambitProfile } = {
  // --- ARCHETYPE GAMBITS ---
  // First Sword
  'war-fulcrum': {
    key: 'war-fulcrum', name: 'War Fulcrum', icon: 'campaign',
    description: "The First Sword takes personal command of an enclave's forces, transforming it into the epicenter of the invasion and inspiring unparalleled ferocity in its attacks.",
    target: 'Player', category: 'Archetype', restriction: 'First Sword',
    availabilityTurn: 3, uses: 1,
    effect: 'For 3 turns, all "Attack" orders originating from the target enclave have their attacking forces multiplied by 2.'
  },
  'shatterpoint-strike': {
    key: 'shatterpoint-strike', name: 'Shatterpoint Strike', icon: 'bolt',
    description: "All power is focused into a focused, cataclysmic strike, designed to shatter an enclave's defenses and break the opponent's will to fight.",
    target: 'Opponent', category: 'Archetype', restriction: 'First Sword',
    availabilityTurn: 5, uses: 1,
    effect: 'A single "Attack" order has its force value doubled for one turn.'
  },
  // Pact Whisperer
  'incite-rebellion': {
    key: 'incite-rebellion', name: 'Incite Rebellion', icon: 'record_voice_over',
    description: "Seeds of dissent are sown within an opponent enclave, crippling its production as it struggles to maintain control.",
    target: 'Opponent', category: 'Archetype', restriction: 'Pact Whisperer',
    availabilityTurn: 4, uses: 1,
    effect: "For the next turn, the target enclave's force production is halved."
  },
  'void-embargo': {
    key: 'void-embargo', name: 'Void Embargo', icon: 'sailing',
    description: "Through masterful negotiation or veiled threats, all void routes are temporarily closed to the opponent, halting their invasions across all expanses.",
    target: 'Opponent', category: 'Archetype', restriction: 'Pact Whisperer',
    availabilityTurn: 6, uses: 1,
    effect: "For three turns, all routes are considered disabled for the opponent player. The player who issued Void Embargo can still use the routes."
  },
  // World Artificer
  'rapid-reinforcement': {
    key: 'rapid-reinforcement', name: 'Rapid Reinforcement', icon: 'local_shipping',
    description: "A surge of forces is directed to a key location, bolstering an allied enclave with unexpected speed and strength.",
    target: 'Player', category: 'Archetype', restriction: 'World Artificer',
    availabilityTurn: 2, uses: 1,
    effect: 'For one turn, the target "Assist" order transfers all but 1 of its forces.'
  },
  'establish-supply-line': {
    key: 'establish-supply-line', name: 'Establish Supply Line', icon: 'add_road',
    description: "A new, temporary route is engineered between two friendly enclaves, creating a vital strategic connection where none existed before.",
    target: 'Player', category: 'Archetype', restriction: 'World Artificer',
    availabilityTurn: 5, uses: 1,
    effect: "Create a temporary Route for two turns between the two target enclaves, provided they are not currently connected."
  },
  // Labyrinthine Ghost
  'sabotage-route': {
    key: 'sabotage-route', name: 'Sabotage Route', icon: 'link_off',
    description: "A critical opponent connection is severed, temporarily disabling a route and disrupting opponent logistics and attack plans.",
    target: 'Opponent', category: 'Archetype', restriction: 'Labyrinthine Ghost',
    availabilityTurn: 3, uses: 1,
    effect: "Temporarily destroy the target Route for two turns."
  },
  'counter-intelligence': {
    key: 'counter-intelligence', name: 'Counter-Intelligence', icon: 'shield_question',
    description: "A hidden agent intercepts and nullifies an opponent command, canceling an incoming order before it can be executed.",
    target: 'Player', category: 'Archetype', restriction: 'Labyrinthine Ghost',
    availabilityTurn: 5, uses: 1,
    effect: "Cancel an incoming 'Attack' or 'Assist' order that is targeting one of your enclaves."
  },

  // --- COMMON GAMBITS ---
  'ambiguous-orders': {
    key: 'ambiguous-orders', name: 'Ambiguous Orders', icon: 'alt_route',
    description: "When an enclave is given assist orders, other enclaves send forces as well.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 3, uses: 2,
    effect: "When the target enclave receives an 'Assist' order, all other friendly enclaves adjacent to it also send 10% of their forces."
  },
  'assassination': {
    key: 'assassination', name: 'Assassination', icon: 'person_off',
    description: "All Military strategists, diplomats and other characters are removed from play.",
    target: 'Global', category: 'Common', restriction: 'None',
    availabilityTurn: 10, uses: 1,
    effect: 'Removes all active "Military Strategist" and "Diplomat Measures" effects from all players.'
  },
  'biological-warfare': {
    key: 'biological-warfare', name: 'Biological Warfare', icon: 'coronavirus',
    description: "Spread disease and plague, making this enclave loose 1/3 of its armies per turn for 5 turns.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 6, uses: 1,
    effect: "For 5 turns, the target enclave loses 33% of its forces at the start of each turn."
  },
  'casualties-of-war': {
    key: 'casualties-of-war', name: 'Casualties of War', icon: 'personal_injury',
    description: "Nearby enclaves lose 2 forces while this enclave has orders issued.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 1, uses: 3,
    effect: "For the next turn, all opponent enclaves adjacent to the target enclave lose 2 forces."
  },
  'communications-blackout': {
    key: 'communications-blackout', name: 'Communications Blackout', icon: 'visibility_off',
    description: "The force display in all your enclaves are not displayed to opponents for X turns.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 5, uses: 2,
    effect: "For 3 turns, the opponent cannot see the force counts of any of the player's enclaves."
  },
  'communications-disruption': {
    key: 'communications-disruption', name: 'Communications Disruption', icon: 'signal_disconnected',
    description: "Opponents cannot issue gambits for X turns.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 7, uses: 1,
    effect: "The opponent cannot use any gambits for 2 turns."
  },
  'conversion': {
    key: 'conversion', name: 'Conversion', icon: 'record_voice_over',
    description: "Convert forces to your cause. Forces from an enclave is decreased and added to your capital.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 5, uses: 2,
    effect: "The target enclave immediately loses 15 forces. These forces are added to the player's capital enclave if the capital is still owned."
  },
  'covert-operatives': {
    key: 'covert-operatives', name: 'Covert Operatives', icon: 'shield_moon',
    description: "When the enclave is attacked X forces appears.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 2, uses: 3,
    effect: "The next time the target enclave is attacked, it immediately gains 15 forces before combat is resolved."
  },
  'defensive-grid': {
    key: 'defensive-grid', name: 'Defensive Grid', icon: 'shield',
    description: "Concentrate your anti-aircraft and missile-shield satellites, cover traffic routes with mines, and implement martial law on this enclave, making it impervious to attack for a limited time.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 5, uses: 1,
    effect: "The target enclave cannot be attacked for 2 full turns. It can still issue outgoing orders."
  },
  'diplomacy': {
    key: 'diplomacy', name: 'Diplomacy', icon: 'handshake',
    description: "No attack orders can be directly executed on this enclave while it remains under the control of the issuing player.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 6, uses: 1,
    effect: "The target enclave cannot be targeted by opponent attack orders for 3 turns."
  },
  'diplomat-measures': {
    key: 'diplomat-measures', name: 'Diplomat Measures', icon: 'speaker_notes',
    description: "Recruit a diplomat capable of preventing an enclave from attacking until it has a force greater than X.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 4, uses: 2,
    effect: "The target enclave cannot issue attack orders for 3 turns."
  },
  'embargo': {
    key: 'embargo', name: 'Embargo', icon: 'block',
    description: "1/2 of the enclaves routes are destroyed making it unable to attack or defend certain locations.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 4, uses: 2,
    effect: "50% of the target enclave's routes are disabled for 2 turns."
  },
  'hidden-tunnels': {
    key: 'hidden-tunnels', name: 'Hidden Tunnels', icon: 'hub',
    description: "This enclave can attack or supply outlying enclaves. The routes are expanded.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 4, uses: 2,
    effect: "For 3 turns, the target enclave is considered adjacent to all enclaves that are two steps away, allowing for extended attack and assist orders."
  },
  'high-tech-weaponry': {
    key: 'high-tech-weaponry', name: 'High Tech Weaponry', icon: 'biotech',
    description: "Forces developed from this enclave are stronger.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 8, uses: 1,
    effect: "For the rest of the game, a force produced by the target enclave has a +10% bonus in combat."
  },
  'hope': {
    key: 'hope', name: 'Hope', icon: 'volunteer_activism',
    description: "Inspirational messages give the population hope making defending armies twice as effective and produce one additional army per turn.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 1, uses: 2,
    effect: "For 3 turns, the target enclave's defending forces are considered doubled during combat calculations. It also gains +1 force generation per turn."
  },
  'its-a-trap': {
    key: 'its-a-trap', name: 'It\'s a trap', icon: 'trip',
    description: "Once an opponent attack order is given it cannot be rescinded. The forces must attack until the enclave has won or lost combat.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 5, uses: 1,
    effect: "For the next 3 turns, any opponent attack order targeting the target enclave cannot be canceled by the opponent."
  },
  'mercenary-reinforcements': {
    key: 'mercenary-reinforcements', name: 'Mercenary Reinforcements', icon: 'groups',
    description: "Deploy mercenary armies specially trained to fight for the highest bidder.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 3, uses: 2,
    effect: "The target enclave immediately gains 25 forces."
  },
  'military-strategist': {
    key: 'military-strategist', name: 'Military Strategist', icon: 'military_tech',
    description: "Recruit a brilliant military commander to accompany forces, making them twice as effective.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 4, uses: 1,
    effect: "For 3 turns, all attack orders originating from the target enclave have their forces multiplied by 2."
  },
  'missile-barrage': {
    key: 'missile-barrage', name: 'Missile Barrage', icon: 'rocket_launch',
    description: "Launch a barrage of missiles at population centers and military facilities, destroying enclave centers.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 8, uses: 1,
    effect: "The target enclave immediately loses 33% of its current forces."
  },
  'naval-blockade': {
    key: 'naval-blockade', name: 'Naval Blockade', icon: 'sailing',
    description: "Routes across water are unavailable for X turns.",
    target: 'Global', category: 'Common', restriction: 'None',
    availabilityTurn: 5, uses: 1,
    effect: "All sea routes on the map are disabled for all players for 2 turns."
  },
  'nuclear-assault': {
    key: 'nuclear-assault', name: 'Nuclear Assault', icon: 'explosion',
    description: "Reduce the number of armies in this enclave to 1 by launching nuclear weapons at every major military base and population center. This will also destroy 1/4 of the armies in surrounding enclaves due to the nuclear fallout.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 15, uses: 1,
    effect: "The target enclave's forces are reduced to 1. All adjacent enclaves (friend or foe) lose 25% of their forces due to fallout."
  },
  'off-world-reinforcements': {
    key: 'off-world-reinforcements', name: 'Off World Reinforcements', icon: 'rocket',
    description: "Augment your forces in this enclave by bringing in 50 armies from nearby loyal star systems.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 12, uses: 1,
    effect: "The target enclave immediately gains 50 forces."
  },
  'orbital-bombardment': {
    key: 'orbital-bombardment', name: 'Orbital Bombardment', icon: 'satellite_alt',
    description: "Orbiting ships and satellites batter the defenses a single enclave destroying 2/3 of the armies.",
    target: 'Opponent', category: 'Common', restriction: 'None',
    availabilityTurn: 10, uses: 1,
    effect: "The target enclave immediately loses 66% of its current forces."
  },
  'propaganda': {
    key: 'propaganda', name: 'Propaganda', icon: 'podcasts',
    description: "A random neutral enclave becomes yours.",
    target: 'Neutral', category: 'Common', restriction: 'None',
    availabilityTurn: 5, uses: 1,
    effect: "One random neutral enclave on the map immediately becomes friendly-owned with 5 forces."
  },
  'retreat': {
    key: 'retreat', name: 'Retreat', icon: 'pan_tool',
    description: "Forces retreat in panic, distributing equally to any nearby enclaves.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 1, uses: 3,
    effect: "Cancel the target enclave's 'Hold' order while it is under attack. Its forces are immediately distributed as evenly as possible to adjacent friendly enclaves. The attacking opponent conquers the enclave unopposed."
  },
  'return-to-the-holy-land': {
    key: 'return-to-the-holy-land', name: 'Return to the Holy Land', icon: 'temple_hindu',
    description: "All forces in the enclave retreat to their capital to worship and gain inspiration from their religious leaders. The enclave becomes permanently unusable for the rest of the game.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 1, uses: 1,
    effect: "All of the target enclave's forces are transferred to the player's capital. The target enclave becomes neutral and cannot be captured or used for the rest of the game."
  },
  'scatter-bomb': {
    key: 'scatter-bomb', name: 'Scatter Bomb', icon: 'scatter_plot',
    description: "5 random enclaves are bombarded by satellite guided missiles losing 1/2 their forces.",
    target: 'Global', category: 'Common', restriction: 'None',
    availabilityTurn: 6, uses: 1,
    effect: "5 random enclaves on the map (friend or foe) immediately lose 50% of their current forces."
  },
  'stasis-field': {
    key: 'stasis-field', name: 'Stasis Field', icon: 'hourglass_empty',
    description: "Time passes differently in this enclave as forces enters. When being attacked the results calculate only every other turn.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 6, uses: 1,
    effect: "For the next 4 turns, combat in the target enclave is only resolved every second turn."
  },
  'teleportation-route': {
    key: 'teleportation-route', name: 'Teleportation Route', icon: 'public',
    description: "This enclave now has a new route to available to any new enclave selected on the planet.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 10, uses: 1,
    effect: "The target enclave gains a permanent route to any other friendly enclave on the map."
  },
  'time-warp': {
    key: 'time-warp', name: 'Time Warp', icon: 'fast_forward',
    description: "X turns automatically take place when the next turn ends. Gambits cannot be issued during this time.",
    target: 'Global', category: 'Common', restriction: 'None',
    availabilityTurn: 10, uses: 1,
    effect: "At the end of the current turn, 2 additional turns are immediately resolved without allowing any player to change their orders."
  },
  'trade-routes': {
    key: 'trade-routes', name: 'Trade Routes', icon: 'lan',
    description: "Gain X random routes to nearby enclaves.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 2, uses: 2,
    effect: "The target enclave gains 2 new, permanent land routes to the closest friendly enclaves it is not already connected to."
  },
  'training-facility': {
    key: 'training-facility', name: 'Training Facility', icon: 'school',
    description: "Surrounding enclaves produce forces at a greater rate.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 1, uses: 1,
    effect: "For 3 turns, the target enclave and all adjacent friendly enclaves gain +1 force generation."
  },
  'traitors': {
    key: 'traitors', name: 'Traitors', icon: 'group_remove',
    description: "Every enclave that has more forces than your capital loses X forces. That force is added to your capital.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 7, uses: 1,
    effect: "Identify the player's capital enclave. Every other friendly enclave with more forces than the capital loses 25% of its forces, which are then added to the capital's force count."
  },
  'victory-parades': {
    key: 'victory-parades', name: 'Victory Parades', icon: 'celebration',
    description: "All new enclaves taken on the following turn have their morale boosted. Enclaves gets an X bonus number of forces.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 3, uses: 2,
    effect: "For the next turn, any opponent enclave conquered by the player will start with 10 bonus forces."
  },
  'weapons-disarmament': {
    key: 'weapons-disarmament', name: 'Weapons Disarmament', icon: 'gavel',
    description: "Nukes, Missile Barrage, Scatter bomb and related gambits can no longer be issued.",
    target: 'Global', category: 'Common', restriction: 'None',
    availabilityTurn: 12, uses: 1,
    effect: 'For the rest of the game, no player can use the "Nuclear Assault", "Missile Barrage", or "Scatter Bomb" gambits.'
  },
  'zeal': {
    key: 'zeal', name: 'Zeal', icon: 'star',
    description: "All your enclaves gain X forces.",
    target: 'Player', category: 'Common', restriction: 'None',
    availabilityTurn: 8, uses: 1,
    effect: "All friendly enclaves immediately gain 5 forces."
  },
};