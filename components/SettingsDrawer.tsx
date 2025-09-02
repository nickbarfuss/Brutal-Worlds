import React from 'react';
import { AudioChannel, GameState, MaterialProperties } from '../../types/game';
import SliderCard from './ui/SliderCard';
import SwitchCard from './ui/SwitchCard';

interface SettingsDrawerProps {
  isOpen: boolean;
  isClosing: boolean;
  onClose: () => void;
  volumes: Record<AudioChannel, number>;
  onVolumeChange: (channel: AudioChannel, volume: number) => void;
  mutedChannels: Record<AudioChannel, boolean>;
  onToggleMute: (channel: AudioChannel) => void;
  isBloomEnabled: boolean;
  onToggleBloom: (enabled: boolean) => void;
  bloomSettings: {
    threshold: number;
    strength: number;
    radius: number;
  };
  onBloomSettingChange: (key: keyof SettingsDrawerProps['bloomSettings'], value: number) => void;
  materialSettings: GameState['materialSettings'];
  onMaterialSettingChange: (type: keyof GameState['materialSettings'], key: keyof MaterialProperties, value: number) => void;
  ambientLightIntensity: number;
  onAmbientLightIntensityChange: (value: number) => void;
  tonemappingStrength: number;
  onTonemappingStrengthChange: (value: number) => void;
}

const soundChannels: { key: AudioChannel; label: string; }[] = [
  { key: 'music', label: 'Music' },
  { key: 'ambient', label: 'Ambient' },
  { key: 'fx', label: 'Effects' },
  { key: 'ui', label: 'Interface' },
];

const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ 
    isOpen, isClosing, onClose, volumes, onVolumeChange,
    mutedChannels, onToggleMute, isBloomEnabled, onToggleBloom,
    bloomSettings, onBloomSettingChange, materialSettings, onMaterialSettingChange,
    ambientLightIntensity, onAmbientLightIntensityChange, tonemappingStrength, onTonemappingStrengthChange
}) => {
  if (!isOpen && !isClosing) return null;

  const animationClass = isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right';

  const getSoundIcon = (channel: AudioChannel) => {
    if (mutedChannels[channel]) return 'volume_off';
    if (volumes[channel] === 0) return 'volume_mute';
    return 'volume_up';
  };

  return (
    <div className={`fixed top-0 right-0 h-full w-full max-w-[420px] bg-neutral-900 z-50 shadow-2xl border-l border-neutral-700/50 flex flex-col ${animationClass}`}>
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-neutral-700 flex-shrink-0">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button onClick={onClose} className="text-neutral-400 hover:text-white transition-colors duration-200 p-2 rounded-full">
          <span className="material-symbols-outlined text-3xl">close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow p-4 overflow-y-auto no-scrollbar space-y-6">
        {/* Sound Section */}
        <div>
          <h3 className="font-medium text-base text-neutral-600 uppercase tracking-wider mb-3 px-1">Sound</h3>
          <div className="space-y-2">
            {soundChannels.map(({ key, label }) => (
              <SliderCard
                key={key}
                icon={getSoundIcon(key)}
                label={label}
                onIconClick={() => onToggleMute(key)}
                sliderProps={{
                    min: 0,
                    max: 1,
                    step: 0.01,
                    value: volumes[key],
                    onChange: (value) => onVolumeChange(key, value),
                    disabled: mutedChannels[key],
                }}
              />
            ))}
          </div>
        </div>

        {/* Lighting Section */}
        <div>
          <h3 className="font-medium text-base text-neutral-600 uppercase tracking-wider mb-3 px-1">Lighting</h3>
          <div className="space-y-2">
             <SliderCard
                icon="light_mode"
                label="Ambient"
                valueDisplay={ambientLightIntensity.toFixed(2)}
                sliderProps={{ min: 0, max: 2, step: 0.01, value: ambientLightIntensity, onChange: onAmbientLightIntensityChange }}
            />
            <SwitchCard
                icon="flare"
                label="Bloom Effect"
                checked={isBloomEnabled}
                onChange={onToggleBloom}
            />
            <SliderCard
                icon="filter_tilt_shift"
                label="Threshold"
                valueDisplay={bloomSettings.threshold.toFixed(2)}
                sliderProps={{ min: 0, max: 1, step: 0.01, value: bloomSettings.threshold, onChange: (v) => onBloomSettingChange('threshold', v), disabled: !isBloomEnabled }}
            />
            <SliderCard
                icon="flare"
                label="Strength"
                valueDisplay={bloomSettings.strength.toFixed(2)}
                sliderProps={{ min: 0, max: 2, step: 0.01, value: bloomSettings.strength, onChange: (v) => onBloomSettingChange('strength', v), disabled: !isBloomEnabled }}
            />
            <SliderCard
                icon="blur_on"
                label="Radius"
                valueDisplay={bloomSettings.radius.toFixed(2)}
                sliderProps={{ min: 0, max: 1, step: 0.01, value: bloomSettings.radius, onChange: (v) => onBloomSettingChange('radius', v), disabled: !isBloomEnabled }}
            />
            <SliderCard
                icon="tonality"
                label="Tonemapping"
                valueDisplay={tonemappingStrength.toFixed(2)}
                sliderProps={{ min: 0, max: 1, step: 0.01, value: tonemappingStrength, onChange: onTonemappingStrengthChange }}
            />
          </div>
        </div>

        {/* Materials Section */}
        <div>
          <h3 className="font-medium text-base text-neutral-600 uppercase tracking-wider mb-3 px-1">Materials</h3>
          <div className="space-y-4">
            {/* Player */}
            <div>
              <h4 className="font-semibold text-neutral-400 mb-2 px-1">Player</h4>
              <div className="space-y-2">
                <SliderCard
                  icon="texture"
                  label="Metalness"
                  valueDisplay={materialSettings.player.metalness.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.player.metalness, onChange: (v) => onMaterialSettingChange('player', 'metalness', v) }}
                />
                <SliderCard
                  icon="brightness_6"
                  label="Roughness"
                  valueDisplay={materialSettings.player.roughness.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.player.roughness, onChange: (v) => onMaterialSettingChange('player', 'roughness', v) }}
                />
                <SliderCard
                  icon="highlight"
                  label="Emissive"
                  valueDisplay={materialSettings.player.emissiveIntensity?.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.player.emissiveIntensity ?? 0, onChange: (v) => onMaterialSettingChange('player', 'emissiveIntensity', v) }}
                />
              </div>
            </div>
             {/* Neutral */}
            <div>
              <h4 className="font-semibold text-neutral-400 mb-2 px-1">Neutral</h4>
              <div className="space-y-2">
                <SliderCard
                  icon="texture"
                  label="Metalness"
                  valueDisplay={materialSettings.neutral.metalness.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.neutral.metalness, onChange: (v) => onMaterialSettingChange('neutral', 'metalness', v) }}
                />
                <SliderCard
                  icon="brightness_6"
                  label="Roughness"
                  valueDisplay={materialSettings.neutral.roughness.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.neutral.roughness, onChange: (v) => onMaterialSettingChange('neutral', 'roughness', v) }}
                />
                <SliderCard
                  icon="highlight"
                  label="Emissive"
                  valueDisplay={materialSettings.neutral.emissiveIntensity?.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.neutral.emissiveIntensity ?? 0, onChange: (v) => onMaterialSettingChange('neutral', 'emissiveIntensity', v) }}
                />
              </div>
            </div>
             {/* Void */}
            <div>
              <h4 className="font-semibold text-neutral-400 mb-2 px-1">Void</h4>
              <div className="space-y-2">
                <SliderCard
                  icon="texture"
                  label="Metalness"
                  valueDisplay={materialSettings.void.metalness.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.void.metalness, onChange: (v) => onMaterialSettingChange('void', 'metalness', v) }}
                />
                <SliderCard
                  icon="brightness_6"
                  label="Roughness"
                  valueDisplay={materialSettings.void.roughness.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.void.roughness, onChange: (v) => onMaterialSettingChange('void', 'roughness', v) }}
                />
                 <SliderCard
                  icon="highlight"
                  label="Emissive"
                  valueDisplay={materialSettings.void.emissiveIntensity?.toFixed(2)}
                  sliderProps={{ min: 0, max: 1, step: 0.01, value: materialSettings.void.emissiveIntensity ?? 0, onChange: (v) => onMaterialSettingChange('void', 'emissiveIntensity', v) }}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsDrawer;