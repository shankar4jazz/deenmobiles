import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

interface ActionMenuItem {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  className?: string;
  show?: boolean;
  disabled?: boolean;
}

interface ActionMenuProps {
  items: ActionMenuItem[];
}

export default function ActionMenu({ items }: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const visibleItems = items.filter((item) => item.show !== false);

  return (
    <div className="relative" ref={menuRef} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
        title="Actions"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {visibleItems.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              disabled={item.disabled}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                item.className || 'text-gray-700'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
