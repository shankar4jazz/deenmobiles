import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Users,
  Wrench,
  UserCheck,
  Package,
  TrendingUp,
  Settings,
  Building2,
  Box,
  Truck,
  ShoppingCart,
  ChevronDown,
  ChevronRight,
  BarChart3,
  RefreshCw,
  Database,
  Wallet,
  Receipt,
  RotateCcw,
  Send,
  Clock,
  History,
  PieChart,
  FileText,
  Banknote,
  FileCheck,
  ClipboardList,
  Palette,
  Plus,
  List,
} from 'lucide-react';

interface NavItem {
  name: string;
  path?: string;
  icon: any;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Masters',
    icon: Database,
    children: [
      {
        name: 'Master Data',
        path: '/masters',
        icon: Database,
      },
    ],
  },
  {
    name: 'Employees',
    path: '/employees',
    icon: Users,
  },
  {
    name: 'My Tasks',
    path: '/my-tasks',
    icon: ClipboardList,
  },
  {
    name: 'Services',
    icon: Wrench,
    children: [
      {
        name: 'Create Service',
        path: '/services/new',
        icon: Plus,
      },
      {
        name: 'Services List',
        path: '/services',
        icon: List,
      },
    ],
  },
  {
    name: 'Invoices',
    icon: Receipt,
    children: [
      {
        name: 'Invoices',
        path: '/invoices',
        icon: Receipt,
      },
      {
        name: 'Estimates',
        path: '/estimates',
        icon: ClipboardList,
      },
      {
        name: 'Sales Returns',
        path: '/sales-returns',
        icon: RotateCcw,
      },
    ],
  },
  {
    name: 'Customers',
    path: '/customers',
    icon: UserCheck,
  },
  {
    name: 'Inventory',
    icon: Box,
    children: [
      {
        name: 'Items Catalog',
        path: '/items',
        icon: Database,
      },
      {
        name: 'Branch Stock',
        path: '/inventory',
        icon: Package,
      },
      {
        name: 'Suppliers',
        path: '/suppliers',
        icon: Truck,
      },
      {
        name: 'Purchases',
        path: '/purchases',
        icon: ShoppingCart,
      },
      {
        name: 'Purchase Return',
        path: '/returns-management',
        icon: RotateCcw,
      },
      {
        name: 'Stock Adjust',
        path: '/inventory/adjust',
        icon: RefreshCw,
      },
    ],
  },
  {
    name: 'Expenses',
    path: '/expenses',
    icon: Wallet,
  },
  {
    name: 'Petty Cash',
    path: '/petty-cash',
    icon: Banknote,
  },
  {
    name: 'Reports',
    path: '/reports',
    icon: TrendingUp,
  },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      {
        name: 'Templates',
        path: '/settings',
        icon: FileText,
      },
    ],
  },
];

export default function BranchSidebar() {
  const location = useLocation();
  const { user } = useAuthStore();
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Masters', 'Services', 'Inventory', 'Invoices']);

  const toggleMenu = (name: string) => {
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((item) => item !== name) : [...prev, name]
    );
  };

  const isChildActive = (children?: NavItem[]) => {
    if (!children) return false;
    return children.some((child) => child.path === location.pathname);
  };

  const renderNavItem = (item: NavItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedMenus.includes(item.name);
    const childActive = isChildActive(item.children);

    if (hasChildren) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
              childActive
                ? 'bg-purple-700 text-white'
                : 'text-purple-100 hover:bg-purple-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon className="h-5 w-5" />
              <span className="font-medium">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => (
                <NavLink
                  key={child.path}
                  to={child.path!}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      isActive
                        ? 'bg-white text-purple-900 shadow-lg'
                        : 'text-purple-100 hover:bg-purple-700 hover:text-white'
                    }`
                  }
                >
                  <child.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{child.name}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    return (
      <NavLink
        key={item.path}
        to={item.path!}
        className={({ isActive }) =>
          `flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
            isActive
              ? 'bg-white text-purple-900 shadow-lg'
              : 'text-purple-100 hover:bg-purple-700 hover:text-white'
          }`
        }
      >
        <item.icon className="h-5 w-5" />
        <span className="font-medium">{item.name}</span>
      </NavLink>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 to-purple-800">
      {/* Branch Info Section */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-purple-700">
        <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center">
          <Building2 className="h-5 w-5 text-purple-600" />
        </div>
        <h2 className="text-white font-semibold text-sm">{user?.activeBranch?.name || 'Branch'}</h2>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <div className="space-y-1">{navItems.map((item) => renderNavItem(item))}</div>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-purple-700">
        <div className="bg-purple-700 rounded-lg p-4">
          <p className="text-purple-200 text-xs font-medium mb-1">Branch Manager</p>
          <p className="text-white text-sm">Quick Access Portal</p>
        </div>
      </div>
    </div>
  );
}
