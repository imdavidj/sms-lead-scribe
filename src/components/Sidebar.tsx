import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

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
    { id: 'dashboard', label: 'Dashboard', icon: '📊', dataSection: 'dashboard' },
    {
      id: 'leads',
      label: 'Leads',
      icon: '👥',
      hasSubmenu: true,
      submenu: [
        { id: 'all-leads', label: 'All Leads', badge: '24', dataSection: 'leads-all' },
        { id: 'qualified', label: 'Qualified', badge: '8', dataSection: 'leads-qualified' },
        { id: 'unqualified', label: 'Unqualified', badge: '12', dataSection: 'leads-unqualified' },
        { id: 'no-response', label: 'No Response', badge: '3', dataSection: 'leads-no-response' },
        { id: 'blocked', label: 'Blocked', badge: '1', dataSection: 'leads-blocked' },
      ]
    },
    { id: 'analytics', label: 'Analytics', icon: '📈', dataSection: 'analytics' },
    {
      id: 'upload',
      label: 'Upload Lists',
      icon: '📋',
      hasSubmenu: true,
      submenu: [
        { id: 'saved-lists', label: 'Saved Lists', badge: '5', dataSection: 'upload-saved' },
        { id: 'used-lists', label: 'Used Lists', badge: '12', dataSection: 'upload-used' },
      ]
    },
    { id: 'templates', label: 'Templates', icon: '💬', dataSection: 'templates' },
    { id: 'automations', label: 'Automations', icon: '🤖', dataSection: 'automations' },
    {
      id: 'admin',
      label: 'Admin',
      icon: '⚙️',
      hasSubmenu: true,
      submenu: [
        { id: 'users', label: 'Users & Permissions', dataSection: 'admin-users' },
        { id: 'webhooks', label: 'Webhooks & Integrations', dataSection: 'admin-webhooks' },
        { id: 'settings', label: 'Account Settings', dataSection: 'admin-account' },
      ]
    },
    { id: 'help', label: 'Help & Docs', icon: '❓', dataSection: 'help' },
  ];

  return (
    <div className="w-70 bg-background border-r border-border shadow-sm flex flex-col min-h-screen">
      {/* Brand */}
      <div className="p-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary">📱 SMS Qualifier</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
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
                "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200",
                activePage === item.id
                  ? "bg-primary/10 text-primary border-l-4 border-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.hasSubmenu && (
                <span
                  className={cn(
                    "text-muted-foreground transition-transform duration-200",
                    expandedMenus.has(item.id) ? "rotate-90" : ""
                  )}
                >
                  ▶
                </span>
              )}
            </button>

            {/* Submenu */}
            {item.hasSubmenu && expandedMenus.has(item.id) && (
              <div className="ml-5 mt-1 space-y-1">
                {item.submenu?.map((subItem) => (
                  <button
                    key={subItem.id}
                    onClick={() => onPageChange(subItem.id)}
                    data-section={subItem.dataSection}
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-left rounded-lg transition-all duration-200 text-sm",
                      activePage === subItem.id
                        ? "bg-primary/10 text-primary border-l-4 border-primary"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <span>{subItem.label}</span>
                    {subItem.badge && (
                      <span className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs">
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
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <span>🌙</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-200",
              theme === 'dark' ? "bg-primary" : "bg-muted"
            )}
          >
            <div
              className={cn(
                "absolute top-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200",
                theme === 'dark' ? "translate-x-5" : "translate-x-0.5"
              )}
            />
          </button>
          <span>☀️</span>
        </div>
      </div>
    </div>
  );
};