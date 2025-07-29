import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  ClipboardList, 
  MessageSquare, 
  Bot, 
  Settings, 
  HelpCircle,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';

interface SidebarProps {
  onPageChange: (page: string) => void;
  activePage: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onPageChange, activePage }) => {
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const { theme, setTheme } = useTheme();

  const toggleMenu = (menuId: string) => {
    const newExpanded = new Set(expandedMenus);
    if (newExpanded.has(menuId)) {
      newExpanded.delete(menuId);
    } else {
      newExpanded.add(menuId);
    }
    setExpandedMenus(newExpanded);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, dataSection: 'dashboard' },
    {
      id: 'leads',
      label: 'Leads',
      icon: Users,
      hasSubmenu: true,
      submenu: [
        { id: 'all-leads', label: 'All Leads', badge: '24', dataSection: 'leads-all' },
        { id: 'qualified', label: 'Qualified', badge: '8', dataSection: 'leads-qualified' },
        { id: 'unqualified', label: 'Unqualified', badge: '12', dataSection: 'leads-unqualified' },
        { id: 'no-response', label: 'No Response', badge: '3', dataSection: 'leads-no-response' },
        { id: 'blocked', label: 'Blocked', badge: '1', dataSection: 'leads-blocked' },
      ]
    },
    { id: 'analytics', label: 'Analytics', icon: TrendingUp, dataSection: 'analytics' },
    {
      id: 'upload',
      label: 'Upload Lists',
      icon: ClipboardList,
      hasSubmenu: true,
      submenu: [
        { id: 'saved-lists', label: 'Saved Lists', badge: '5', dataSection: 'upload-saved' },
        { id: 'used-lists', label: 'Used Lists', badge: '12', dataSection: 'upload-used' },
      ]
    },
    { id: 'templates', label: 'Templates', icon: MessageSquare, dataSection: 'templates' },
    { id: 'automations', label: 'Automations', icon: Bot, dataSection: 'automations' },
    {
      id: 'admin',
      label: 'Admin',
      icon: Settings,
      hasSubmenu: true,
      submenu: [
        { id: 'users', label: 'Users & Permissions', dataSection: 'admin-users' },
        { id: 'webhooks', label: 'Webhooks & Integrations', dataSection: 'admin-webhooks' },
        { id: 'settings', label: 'Account Settings', dataSection: 'admin-account' },
      ]
    },
    { id: 'help', label: 'Help & Docs', icon: HelpCircle, dataSection: 'help' },
  ];

  return (
    <div className="w-72 bg-card border-r border-border flex flex-col min-h-screen shadow-lg">
      {/* Brand */}
      <div className="p-6 border-b border-border bg-card">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">SMS Qualifier</h1>
        <p className="text-sm text-muted-foreground mt-1">Lead Management Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => (
          <div key={item.id}>
            <button
              onClick={() => {
                if (item.hasSubmenu) {
                  toggleMenu(item.id);
                } else {
                  onPageChange(item.id);
                }
              }}
              data-section={item.dataSection}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-left rounded-xl transition-all duration-200 group",
                activePage === item.id
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              {item.hasSubmenu && (
                <ChevronRight
                  className={cn(
                    "w-4 h-4 transition-transform duration-200",
                    expandedMenus.has(item.id) ? "rotate-90" : ""
                  )}
                />
              )}
            </button>

            {/* Submenu */}
            {item.hasSubmenu && expandedMenus.has(item.id) && (
              <div className="ml-8 mt-2 space-y-1">
                {item.submenu?.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => onPageChange(subItem.id)}
                    data-section={subItem.dataSection}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2.5 text-left rounded-lg transition-all duration-200 text-sm",
                      activePage === subItem.id
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <span className="font-medium">{subItem.label}</span>
                    {subItem.badge && (
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
                        {subItem.badge}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      {/* Theme Toggle */}
      <div className="p-4 border-t border-border bg-card">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-foreground">Theme</span>
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-muted-foreground" />
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={cn(
                "relative w-11 h-6 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                theme === 'dark' ? "bg-primary" : "bg-muted"
              )}
            >
              <div
                className={cn(
                  "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-300 shadow-sm",
                  theme === 'dark' ? "translate-x-5" : "translate-x-0.5"
                )}
              />
            </button>
            <Moon className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>
    </div>
  );
};