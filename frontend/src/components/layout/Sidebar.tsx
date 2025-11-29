import { BarChart3, LayoutDashboard, Plus, Package, Shield, UserCog, Database, Wallet, Receipt, AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { UserRole } from '@/types';
import { useState } from 'react';

interface NavItem {
  name: string;
  icon: typeof LayoutDashboard;
  path: string;
  roles?: UserRole[];
  children?: NavItem[];
}

const getNavItems = (role: string): NavItem[] => {
  const baseItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
  ];

  if (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN) {
    baseItems.push({ name: 'Branches', icon: Package, path: '/admin/branches' });
    baseItems.push({ name: 'Roles', icon: Shield, path: '/admin/roles' });
    baseItems.push({ name: 'Employees', icon: UserCog, path: '/admin/employees' });

    // Petty Cash Management for Admins
    baseItems.push({
      name: 'Petty Cash',
      icon: Wallet,
      path: '/admin/petty-cash',
      children: [
        { name: 'Transfers', icon: Receipt, path: '/admin/petty-cash/transfers' },
        { name: 'Branch Requests', icon: AlertCircle, path: '/admin/petty-cash/requests' },
      ],
    });
  }

  // Master Data access for Admin, Branch Admin, and Manager roles
  if (
    role === UserRole.SUPER_ADMIN ||
    role === UserRole.ADMIN ||
    role === UserRole.BRANCH_ADMIN ||
    role === UserRole.MANAGER
  ) {
    // Super Admin and Admin use /admin/masters (DashboardLayout)
    // Branch Admin and Manager use /branch/masters (BranchLayout)
    const mastersPath = (role === UserRole.SUPER_ADMIN || role === UserRole.ADMIN)
      ? '/admin/masters'
      : '/branch/masters';
    baseItems.push({ name: 'Master Data', icon: Database, path: mastersPath });
  }

  return baseItems;
};

interface SidebarProps {
  isOpen: boolean;
}

export default function Sidebar({ isOpen }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['Petty Cash']);

  if (!user) return null;

  const navItems = getNavItems(user.role);

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
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    if (hasChildren) {
      return (
        <div key={item.name} className="mb-2">
          <button
            onClick={() => toggleMenu(item.name)}
            className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg transition-all ${
              childActive
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.name}</span>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
          {isExpanded && (
            <div className="ml-4 mt-1 space-y-1">
              {item.children?.map((child) => {
                const ChildIcon = child.icon;
                const isChildActive = location.pathname === child.path;
                return (
                  <button
                    key={child.path}
                    onClick={() => navigate(child.path)}
                    className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${
                      isChildActive
                        ? 'bg-cyan-500 text-white shadow-lg'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <ChildIcon className="h-4 w-4" />
                    <span className="text-sm font-medium">{child.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={item.path}
        onClick={() => navigate(item.path)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all ${
          isActive
            ? 'bg-white/10 text-white'
            : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{item.name}</span>
      </button>
    );
  };

  return (
    <aside
      className={`fixed left-0 top-0 h-full bg-gradient-to-b from-[#1a0b2e] to-[#2d1b50] text-white transition-all duration-300 ${
        isOpen ? 'w-60' : 'w-0'
      } overflow-hidden z-50`}
    >
      {/* Logo */}
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center">
          <LayoutDashboard className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">DeenMobiles</h1>
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Add New Entry Button */}
      <div className="absolute bottom-6 left-0 right-0 px-6">
        <button className="w-full bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors shadow-lg">
          <Plus className="h-5 w-5" />
          <span className="font-medium">Add new entry</span>
        </button>
      </div>
    </aside>
  );
}
