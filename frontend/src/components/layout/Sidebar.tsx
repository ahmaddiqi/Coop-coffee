import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const location = useLocation();
  const userRole = localStorage.getItem('role');

  const menuItems = [
    {
      icon: '📊',
      label: 'Dashboard',
      href: '/dashboard',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '👨‍🌾',
      label: 'Petani',
      href: '/dashboard/petani',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '🌱',
      label: 'Lahan',
      href: '/dashboard/lahan',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '📦',
      label: 'Inventaris',
      href: '/dashboard/inventory',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '📋',
      label: 'Transaksi',
      href: '/dashboard/transaksi-inventory',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '🔗',
      label: 'Traceability',
      href: '/dashboard/traceability',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '📈',
      label: 'Laporan',
      href: '/dashboard/laporan',
      roles: ['ADMIN', 'OPERATOR']
    },
    {
      icon: '🏢',
      label: 'Koperasi',
      href: '/dashboard/koperasi',
      roles: ['ADMIN']
    },
    {
      icon: '👥',
      label: 'Users',
      href: '/dashboard/users',
      roles: ['ADMIN']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(userRole as string)
  );

  return (
    <aside className="w-64 lg:w-64 sm:w-20 flex-shrink-0 bg-kopi-pekat bg-sidebar-texture flex flex-col shadow-coffee-lg">
      {/* Header */}
      <div className="h-20 flex items-center justify-center border-b border-white/10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-aksen-oranye rounded-xl flex items-center justify-center shadow-lg">
            <span className="text-xl text-white">☕</span>
          </div>
          <span className="text-2xl font-bold text-krem-muda font-display">Kopi Digital</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {filteredMenuItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex items-center px-4 py-3 text-base font-medium rounded-xl transition-all duration-300 group",
                isActive
                  ? "bg-krem-muda text-kopi-pekat font-semibold shadow-coffee"
                  : "text-krem-muda/70 hover:text-krem-muda hover:bg-white/10"
              )}
            >
              <span className="w-6 h-6 mr-3 text-lg flex items-center justify-center">
                {item.icon}
              </span>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="w-2 h-2 bg-aksen-oranye rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-white/10">
        <Button 
          variant="ghost"
          onClick={() => {
            // Clear all stored authentication data (consistent with Header logout)
            localStorage.removeItem('token')
            localStorage.removeItem('name')
            localStorage.removeItem('role')
            localStorage.removeItem('user_id')
            window.location.href = '/';
          }}
          className="w-full flex items-center px-4 py-3 text-base font-medium text-krem-muda/70 hover:bg-white/10 hover:text-krem-muda rounded-xl transition-all duration-300 justify-start"
        >
          <span className="w-6 h-6 mr-3 text-lg">🚪</span>
          Keluar
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;