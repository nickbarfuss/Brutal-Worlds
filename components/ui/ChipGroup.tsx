import React from 'react';
import { Owner, HighlightType } from '../../types/game';

interface Segment {
  id: Owner;
  icon: string;
  count: number;
  color: string;
}

interface ChipGroupProps {
  label: string;
  type: HighlightType;
  segments: Segment[];
  activeOwners: Set<Owner>;
  onLabelClick: (type: HighlightType) => void;
  onSegmentClick: (type: HighlightType, owner: Owner) => void;
}

const ChipGroup: React.FC<ChipGroupProps> = ({
  label,
  type,
  segments,
  activeOwners,
  onLabelClick,
  onSegmentClick,
}) => {
  const visibleSegments = segments.filter(s => s.count > 0);
  if (visibleSegments.length === 0) return null;

  const allVisibleSegmentsActive = visibleSegments.length > 0 && visibleSegments.every(s => activeOwners.has(s.id));

  return (
    <div className="flex items-stretch bg-neutral-800 rounded-full text-sm">
      <button
        onClick={() => onLabelClick(type)}
        className={`px-3 py-1.5 font-medium text-neutral-300 rounded-l-full transition-colors ${
          allVisibleSegmentsActive ? 'bg-neutral-700' : 'hover:bg-neutral-700'
        }`}
      >
        {label}
      </button>
      {visibleSegments.map((segment, index) => {
        const isActive = activeOwners.has(segment.id);
        const isLast = index === visibleSegments.length - 1;

        const segmentClasses = `
          flex items-center gap-1.5 px-2.5 py-1.5 transition-colors border-l border-neutral-700
          ${isLast ? 'rounded-r-full' : ''}
          ${isActive ? 'bg-neutral-700' : 'hover:bg-neutral-700'}
        `;

        return (
          <button
            key={segment.id || 'neutral'}
            onClick={() => onSegmentClick(type, segment.id)}
            className={segmentClasses}
          >
            <span
              className="material-symbols-outlined text-base"
              style={{ color: segment.color }}
            >
              {segment.icon}
            </span>
            <span className="font-semibold text-neutral-100">{segment.count}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ChipGroup;