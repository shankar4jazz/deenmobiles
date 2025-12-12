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
  label,
  showPattern = false,
}: PatternLockInputProps & { showPattern?: boolean }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPattern, setTempPattern] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse value to pattern array
  const parsePattern = (val: string): number[] => {
    if (!val) return [];
    return val.split(',').map(Number).filter((n) => !isNaN(n) && n >= 0 && n <= 8);
  };

  // When opening the modal, initialize temp pattern from current value
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

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleCancel();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

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

  const gridSize = 180; // px
  const dotSize = 24; // px
  const currentPattern = parsePattern(value);

  return (
    <div className={label ? 'space-y-1' : ''}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Collapsed view - show button or pattern sequence */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className={`
            inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border
            ${disabled
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
              : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <Grid3X3 className="h-4 w-4" />
          {currentPattern.length > 0 ? 'Edit' : 'Draw'}
        </button>

        {currentPattern.length > 0 && (
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <span className="font-mono text-sm bg-blue-50 text-blue-700 px-2 py-1 rounded border border-blue-200 truncate">
              {currentPattern.map(n => n + 1).join(' → ')}
            </span>
            <button
              type="button"
              onClick={() => onChange('')}
              disabled={disabled}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded flex-shrink-0 disabled:opacity-50"
              title="Clear pattern"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 transition-opacity"
            onClick={handleCancel}
          />

          {/* Modal Content */}
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative bg-white rounded-xl shadow-xl max-w-sm w-full p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Draw Pattern
                </h3>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Pattern Grid */}
              <div className="flex justify-center mb-4">
                <div
                  ref={containerRef}
                  className="relative select-none touch-none cursor-pointer bg-gray-50 rounded-xl p-4"
                  style={{ width: gridSize + 32, height: gridSize + 32 }}
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
                          strokeWidth="4"
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
                                  ? 'bg-blue-500 shadow-lg scale-110'
                                  : 'bg-gray-300 hover:bg-gray-400 hover:scale-110'
                                }
                              `}
                              style={{ width: dotSize, height: dotSize }}
                            >
                              <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${isSelected ? 'text-white' : 'text-gray-600'}`}>
                                {index + 1}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Pattern Info */}
              <div className="text-center mb-4">
                {tempPattern.length === 0 ? (
                  <p className="text-sm text-gray-500">Click and drag to draw pattern</p>
                ) : (
                  <div className="space-y-1">
                    <p className="text-sm text-gray-600">{tempPattern.length} dots selected</p>
                    <p className="font-mono text-sm bg-gray-100 px-3 py-1 rounded inline-block">
                      {tempPattern.map(n => n + 1).join(' → ')}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={tempPattern.length === 0}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw className="h-4 w-4" />
                  Clear
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg transition-colors"
                >
                  <Check className="h-4 w-4" />
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
