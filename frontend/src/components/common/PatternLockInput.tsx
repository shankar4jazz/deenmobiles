import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Eye, EyeOff } from 'lucide-react';

interface PatternLockInputProps {
  value?: string;
  onChange: (pattern: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  showPattern?: boolean;
}

// Dot positions in a 3x3 grid (0-8)
// 0 1 2
// 3 4 5
// 6 7 8

export function PatternLockInput({
  value = '',
  onChange,
  disabled = false,
  error,
  label = 'Pattern Lock',
  showPattern: initialShowPattern = false,
}: PatternLockInputProps) {
  const [pattern, setPattern] = useState<number[]>(() => {
    // Parse initial value
    if (value) {
      return value.split(',').map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 8);
    }
    return [];
  });
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPattern, setShowPattern] = useState(initialShowPattern);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update pattern when value prop changes
  useEffect(() => {
    if (value) {
      const parsed = value.split(',').map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 8);
      if (parsed.join(',') !== pattern.join(',')) {
        setPattern(parsed);
      }
    } else if (value === '' && pattern.length > 0) {
      setPattern([]);
    }
  }, [value]);

  // Notify parent of pattern changes
  useEffect(() => {
    const patternStr = pattern.join(',');
    if (patternStr !== value) {
      onChange(patternStr);
    }
  }, [pattern, onChange, value]);

  const handleDotClick = useCallback((index: number) => {
    if (disabled) return;

    setPattern((prev) => {
      // If dot already in pattern, don't add it again
      if (prev.includes(index)) {
        return prev;
      }
      return [...prev, index];
    });
    setIsDrawing(true);
  }, [disabled]);

  const handleDotEnter = useCallback((index: number) => {
    if (!isDrawing || disabled) return;

    setPattern((prev) => {
      // If dot already in pattern, don't add it again
      if (prev.includes(index)) {
        return prev;
      }
      return [...prev, index];
    });
  }, [isDrawing, disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const handleClear = useCallback(() => {
    if (disabled) return;
    setPattern([]);
    onChange('');
  }, [disabled, onChange]);

  // Handle mouse up outside component
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDrawing(false);
    };
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  // Calculate dot centers for drawing lines
  const getDotCenter = (index: number, size: number) => {
    const row = Math.floor(index / 3);
    const col = index % 3;
    const cellSize = size / 3;
    return {
      x: col * cellSize + cellSize / 2,
      y: row * cellSize + cellSize / 2,
    };
  };

  const gridSize = 160; // px
  const dotSize = 20; // px

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      <div className="flex items-start gap-4">
        {/* Pattern Grid */}
        <div
          ref={containerRef}
          className={`
            relative select-none touch-none
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          `}
          style={{ width: gridSize, height: gridSize }}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => setIsDrawing(false)}
        >
          {/* SVG for drawing lines */}
          {showPattern && pattern.length > 1 && (
            <svg
              className="absolute inset-0 pointer-events-none"
              width={gridSize}
              height={gridSize}
            >
              <polyline
                points={pattern
                  .map((index) => {
                    const center = getDotCenter(index, gridSize);
                    return `${center.x},${center.y}`;
                  })
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}

          {/* Dots Grid */}
          <div className="grid grid-cols-3 gap-0 h-full">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((index) => {
              const isSelected = pattern.includes(index);
              const selectionOrder = pattern.indexOf(index) + 1;

              return (
                <div
                  key={index}
                  className="flex items-center justify-center"
                  onMouseDown={() => handleDotClick(index)}
                  onMouseEnter={() => handleDotEnter(index)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    handleDotClick(index);
                  }}
                >
                  <div
                    className={`
                      relative rounded-full transition-all duration-150
                      ${isSelected
                        ? 'bg-blue-500 shadow-md'
                        : 'bg-gray-300 hover:bg-gray-400'
                      }
                      ${disabled ? '' : 'hover:scale-110'}
                    `}
                    style={{ width: dotSize, height: dotSize }}
                  >
                    {/* Show selection order number */}
                    {showPattern && isSelected && (
                      <span
                        className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold"
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

        {/* Controls */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={handleClear}
            disabled={disabled || pattern.length === 0}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear pattern"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowPattern(!showPattern)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title={showPattern ? 'Hide pattern' : 'Show pattern'}
          >
            {showPattern ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Pattern info */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>
          {pattern.length === 0
            ? 'Click dots to draw pattern'
            : `Pattern: ${pattern.length} dots`}
        </span>
        {showPattern && pattern.length > 0 && (
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            {pattern.join('-')}
          </span>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
