interface SfxProfile {
  url: string;
}

export type SfxCategoryName = 'ui' | 'game' | 'ambient' | 'music' | 'archetype';

export const SFX_SOURCES: {
  [key in SfxCategoryName]: { [key: string]: SfxProfile }
} = {
  ui: {
    'tap-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/ui-tap-1.mp3' },
    'button-game-start': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/button-game-start.mp3' },
    'button-dialog-complete': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/button-dialog-complete.mp3' },
    'button-dialog-nav': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/button-dialog-nav.mp3' },
  },
  game: {
    'void-surge-impact': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/void-surge-impact.mp3' },
    'void-surge-aftermath': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/void-surge-aftermath.mp3' },
    'warp-engage-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/warp-engage-1.mp3' },
    'warp-exit-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/warp-exit-1.mp3' },
    'warp-exit-2': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/warp-exit-2.mp3' },
    'warp-exit-3': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/warp-exit-3.mp3' },
    'warp-exit-4': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/warp-exit-4.mp3' },
    'command-mode-enter': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/command-mode-enter.mp3' },
    'command-mode-exit': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/command-mode-exit.mp3' },
    'order-issue-attack': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/order-issue-attack.mp3' },
    'order-issue-assist': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/order-issue-assist.mp3' },
    'order-issue-hold': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/order-issue-hold.mp3' },
    'conquest-player-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/conquest-explosion-1.mp3' },
    'conquest-player-2': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/conquest-explosion-2.mp3' },
  },
  archetype: {
    'first-sword-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/first-sword-1.mp3' },
    'first-sword-2': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/first-sword-2.mp3' },
    'first-sword-3': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/first-sword-3.mp3' },
    'first-sword-4': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/first-sword-4.mp3' },
    'pact-whisperer-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/pact-whisperer-1.mp3' },
    'pact-whisperer-2': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/pact-whisperer-2.mp3' },
    'pact-whisperer-3': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/pact-whisperer-3.mp3' },
    'pact-whisperer-4': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/pact-whisperer-4.mp3' },
    'labyrinthine-ghost-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/labyrinthine-ghost-1.mp3' },
    'labyrinthine-ghost-2': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/labyrinthine-ghost-2.mp3' },
    'labyrinthine-ghost-3': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/labyrinthine-ghost-3.mp3' },
    'labyrinthine-ghost-4': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/labyrinthine-ghost-4.mp3' },
    'world-artificer-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/world-artificer-1.mp3' },
    'world-artificer-2': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/world-artificer-2.mp3' },
    'world-artificer-3': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/world-artificer-3.mp3' },
    'world-artificer-4': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/world-artificer-4.mp3' },
    'world-artificer-5': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/world-artificer-5.mp3' },
  },
  ambient: {
    'gameplay-1': { url: 'https://storage.googleapis.com/brutal-worlds/sfx/ambient-1.mp3' },
  },
  music: {
    'track-1': { url: 'https://storage.googleapis.com/brutal-worlds/music/ambient-remote-research.mp3' },
    'track-2': { url: 'https://storage.googleapis.com/brutal-worlds/music/spaceship-workstation-ambience.mp3' },
    'track-3': { url: 'https://storage.googleapis.com/brutal-worlds/music/lost-signals.mp3' },
    'track-4': { url: 'https://storage.googleapis.com/brutal-worlds/music/ambient-space-station.mp3' },
    'track-5': { url: 'https://storage.googleapis.com/brutal-worlds/music/klolomna-space-ambience.mp3' },
    'track-6': { url: 'https://storage.googleapis.com/brutal-worlds/music/desert-night-crossing.mp3' },
    'track-7': { url: 'https://storage.googleapis.com/brutal-worlds/music/desert-moon-outpost.mp3' },
    'track-8': { url: 'https://storage.googleapis.com/brutal-worlds/music/distant-planet-ambience.mp3' },
  },
};