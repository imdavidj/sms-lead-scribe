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
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    {
      id: 'leads',
      label: 'Leads',
      icon: '👥',
      hasSubmenu: true,
      submenu: [
        { id: 'all-leads', label: 'All Leads', badge: '24' },
        { id: 'qualified', label: 'Qualified', badge: '8' },
        { id: 'unqualified', label: 'Unqualified', badge: '12' },
        { id: 'no-response', label: 'No Response', badge: '3' },
        { id: 'blocked', label: 'Blocked', badge: '1' },
      ]
    },
    { id: 'analytics', label: 'Analytics', icon: '📈' },
    {
      id: 'upload',
      label: 'Upload Lists',
      icon: '📋',
      hasSubmenu: true,
      submenu: [
        { id: 'saved-lists', label: 'Saved Lists', badge: '5' },
        { id: 'used-lists', label: 'Used Lists', badge: '12' },
      ]
    },
    { id: 'templates', label: 'Templates', icon: '💬' },
    { id: 'automations', label: 'Automations', icon: '🤖' },
    {
      id: 'admin',
      label: 'Admin',
      icon: '⚙️',
      hasSubmenu: true,
      submenu: [
        { id: 'users', label: 'Users & Permissions' },
        { id: 'webhooks', label: 'Webhooks & Integrations' },
        { id: 'settings', label: 'Account Settings' },
      ]
    },
    { id: 'help', label: 'Help & Docs', icon: '❓' },
  ];

  return (
    <div className="w-70 bg-white border-r border-gray-200 shadow-sm flex flex-col min-h-screen">
      {/* Brand */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-green-600">📱 SMS Qualifier</h1>
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
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 text-left rounded-lg transition-all duration-200",
                activePage === item.id
                  ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <div className="flex items-center gap-3">
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>
              {item.hasSubmenu && (
                <span
                  className={cn(
                    "text-gray-400 transition-transform duration-200",
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
                    className={cn(
                      "w-full flex items-center justify-between px-4 py-2 text-left rounded-lg transition-all duration-200 text-sm",
                      activePage === subItem.id
                        ? "bg-green-50 text-green-700 border-l-4 border-green-500"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    )}
                  >
                    <span>{subItem.label}</span>
                    {subItem.badge && (
                      <span className="bg-gray-200 text-gray-600 px-2 py-1 rounded-full text-xs">
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
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center gap-3">
          <span>🌙</span>
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className={cn(
              "relative w-11 h-6 rounded-full transition-colors duration-200",
              theme === 'dark' ? "bg-green-500" : "bg-gray-300"
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