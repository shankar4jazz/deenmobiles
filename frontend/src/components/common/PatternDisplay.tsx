interface PatternDisplayProps {
  pattern: string; // Comma-separated numbers like "0,1,2,5,8"
  size?: number; // Grid size in pixels
}

export function PatternDisplay({ pattern, size = 80 }: PatternDisplayProps) {
  // Parse pattern string to array of numbers
  const patternDots = pattern
    ? pattern.split(',').map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 8)
    : [];

  if (patternDots.length === 0) {
    return <span className="text-gray-400 italic">Not provided</span>;
  }

  const dotSize = size / 6;
  const cellSize = size / 3;

  // Calculate dot center positions
  const getDotCenter = (index: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  };

  return (
    <div
      className="relative bg-gray-100 rounded-lg"
      style={{ width: size, height: size }}
    >
      {/* SVG for drawing lines */}
      {patternDots.length > 1 && (
        <svg
          className="absolute inset-0 pointer-events-none"
          width={size}
          height={size}
        >
          <polyline
            points={patternDots
              .map((index) => {
                const center = getDotCenter(index);
                return `${center.x},${center.y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}

      {/* Dots Grid */}
      <div className="grid grid-cols-3 gap-0 h-full">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
          const isSelected = patternDots.includes(index);
          const selectionOrder = patternDots.indexOf(index) + 1;

          return (
            <div key={index} className="flex items-center justify-center">
              <div
                className={`
                  relative rounded-full
                  ${isSelected ? 'bg-blue-500' : 'bg-gray-300'}
                `}
                style={{ width: dotSize, height: dotSize }}
              >
                {isSelected && (
                  <span
                    className="absolute inset-0 flex items-center justify-center text-white font-bold"
                    style={{ fontSize: dotSize * 0.6 }}
                  >
                    {selectionOrder}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
