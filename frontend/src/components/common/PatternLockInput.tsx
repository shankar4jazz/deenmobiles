import { useState, useRef, useCallback, useEffect } from 'react';
import { RotateCcw, Check, X, Grid3X3 } from 'lucide-react';

interface PatternLockInputProps {
  value?: string;
  onChange: (pattern: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
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
}: PatternLockInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to pattern array
  const parsePattern = (val: string): number[] => {
    if (!val) return [];
    return val.split(',').map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 8);
  };

  // When opening the drawer, initialize temp pattern from current value
  const handleOpen = () => {
    if (disabled) return;
    setTempPattern(parsePattern(value));
    setIsOpen(true);
  };

  // Confirm the pattern
  const handleConfirm = () => {
    onChange(tempPattern.join(','));
    setIsOpen(false);
  };

  // Cancel and revert
  const handleCancel = () => {
    setTempPattern([]);
    setIsOpen(false);
  };

  // Clear pattern while drawing
  const handleClear = () => {
    setTempPattern([]);
  };

  const handleDotClick = useCallback((index: number) => {
    if (disabled) return;

    setTempPattern((prev) => {
      if (prev.includes(index)) {
        return prev;
      }
      return [...prev, index];
    });
    setIsDrawing(true);
  }, [disabled]);

  const handleDotEnter = useCallback((index: number) => {
    if (!isDrawing || disabled) return;

    setTempPattern((prev) => {
      if (prev.includes(index)) {
        return prev;
      }
      return [...prev, index];
    });
  }, [isDrawing, disabled]);

  const handleMouseUp = useCallback(() => {
    setIsDrawing(false);
  }, []);

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

  const gridSize = 140; // px
  const dotSize = 18; // px
  const currentPattern = parsePattern(value);

  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {!isOpen ? (
        // Collapsed view - show button or pattern sequence
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleOpen}
            disabled={disabled}
            className={`
              inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md border
              ${disabled
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <Grid3X3 className="h-4 w-4" />
            {currentPattern.length > 0 ? 'Edit Pattern' : 'Draw Pattern'}
          </button>

          {currentPattern.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm bg-blue-50 text-blue-700 px-3 py-1.5 rounded-md border border-blue-200">
                {currentPattern.join(' → ')}
              </span>
              <button
                type="button"
                onClick={() => onChange('')}
                disabled={disabled}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded disabled:opacity-50"
                title="Clear pattern"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      ) : (
        // Expanded view - show pattern grid
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-4">
            {/* Pattern Grid */}
            <div
              ref={containerRef}
              className="relative select-none touch-none cursor-pointer bg-white rounded-lg border border-gray-200 p-2"
              style={{ width: gridSize + 16, height: gridSize + 16 }}
              onMouseUp={handleMouseUp}
              onMouseLeave={() => setIsDrawing(false)}
            >
              <div style={{ width: gridSize, height: gridSize, position: 'relative' }}>
                {/* SVG for drawing lines */}
                {tempPattern.length > 1 && (
                  <svg
                    className="absolute inset-0 pointer-events-none"
                    width={gridSize}
                    height={gridSize}
                  >
                    <polyline
                      points={tempPattern
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
                    const isSelected = tempPattern.includes(index);
                    const selectionOrder = tempPattern.indexOf(index) + 1;

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
                            hover:scale-110
                          `}
                          style={{ width: dotSize, height: dotSize }}
                        >
                          {isSelected && (
                            <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                              {selectionOrder}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Info and Controls */}
            <div className="flex flex-col gap-3">
              <div className="text-sm text-gray-600">
                {tempPattern.length === 0
                  ? 'Click and drag to draw pattern'
                  : `${tempPattern.length} dots selected`}
              </div>

              {tempPattern.length > 0 && (
                <div className="font-mono text-xs bg-white px-2 py-1 rounded border border-gray-200">
                  {tempPattern.join(' → ')}
                </div>
              )}

              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={tempPattern.length === 0}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear
                </button>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-200">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded border border-gray-300"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded"
                >
                  <Check className="h-3.5 w-3.5" />
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
