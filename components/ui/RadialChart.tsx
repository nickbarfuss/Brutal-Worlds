import React from 'react';

interface RadialChartSegment {
  percentage: number;
  color: string;
}

interface RadialChartProps {
  size: number;
  strokeWidth: number;
  segments: RadialChartSegment[];
  gap?: number;
}

const RadialChart: React.FC<RadialChartProps> = ({ size, strokeWidth, segments, gap }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const activeSegments = segments.filter(s => s.percentage > 0);
  const totalSegments = activeSegments.length;

  // No gaps needed for a single segment, or if there are no segments.
  if (totalSegments <= 1) {
    const segment = activeSegments[0];
    const isFullCircle = segment && segment.percentage >= 1.0;
    const arcLength = segment ? segment.percentage * circumference : 0;
    return (
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth}
        />
        {segment && (
          <circle
            cx={size / 2} cy={size / 2} r={radius} fill="transparent"
            stroke={segment.color} strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            // A full circle with a round cap has a visual artifact where the ends meet.
            strokeLinecap={isFullCircle ? "butt" : "round"}
          />
        )}
      </svg>
    );
  }

  // Multiple segments: calculate gaps
  let gapDegrees: number;

  // The angle subtended by half the stroke width at the given radius.
  // This is the angular "overhang" of a single rounded cap.
  const capAngleInRadians = (radius > strokeWidth / 2) ? Math.asin((strokeWidth / 2) / radius) : 0;

  if (gap && gap > 0 && radius > 0) {
    // Calculate the angle for the desired *visual* gap between the rounded ends.
    const visualGapAngleInRadians = gap / radius;
    // The total angle needed for the separation is the visual gap plus the overhang of the two rounded caps facing each other.
    const totalGapAngleInRadians = visualGapAngleInRadians + (capAngleInRadians * 2);
    gapDegrees = totalGapAngleInRadians * (180 / Math.PI);
  } else {
    // Fallback to the anti-overlap calculation if no explicit gap is provided.
    // The minimum gap is just the space for the two rounded caps to touch without overlapping.
    const totalGapAngleInRadians = capAngleInRadians * 2;
    gapDegrees = totalGapAngleInRadians * (180 / Math.PI);
  }


  const totalGapDegrees = totalSegments * gapDegrees;
  const totalArcDegrees = 360 - totalGapDegrees;

  let accumulatedAngle = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle
        cx={size / 2} cy={size / 2} r={radius}
        fill="transparent" stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidth}
      />
      {totalArcDegrees > 0 && activeSegments.map((segment, index) => {
        // Calculate the arc length for this segment based on its proportion of the available arc space.
        const arcAngle = segment.percentage * totalArcDegrees;
        const arcLength = (arcAngle / 360) * circumference;

        // Position the arc by rotating it. Start after previous arcs and gaps, then shift by half a gap to center it.
        const startAngle = accumulatedAngle + (gapDegrees / 2);

        // Update the accumulated angle for the next segment.
        accumulatedAngle += arcAngle + gapDegrees;

        if (arcLength <= 0) return null;

        return (
          <circle
            key={index}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={segment.color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            transform={`rotate(${startAngle} ${size / 2} ${size / 2})`}
            strokeLinecap="round"
          />
        );
      })}
    </svg>
  );
};

export default RadialChart;
