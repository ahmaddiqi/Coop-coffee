import React, { ReactNode, useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import api from '@/lib/axios';

interface DashboardLayoutProps {
  children: ReactNode;
  pageTitle: string;
  pageDescription: string;
}

interface User {
  user_id: number;
  username: string;
  nama_lengkap: string;
  email: string;
  role: string;
  koperasi_id: number | null;
}

interface MenuItem {
  path: string;
  label: string;
  icon: string;
  roles: string[];
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    path: '/dashboard',
    label: 'Dashboard Utama',
    icon: '🏠',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Ringkasan operasional'
  },
  {
    path: '/dashboard/superadmin',
    label: 'Dashboard Nasional',
    icon: '🇮🇩',
    roles: ['SUPER_ADMIN'],
    description: 'Monitoring nasional'
  },
  {
    path: '/dashboard/users',
    label: 'Manajemen Pengguna',
    icon: '👥',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    description: 'Kelola pengguna'
  },
  {
    path: '/dashboard/koperasi',
    label: 'Manajemen Koperasi',
    icon: '🏢',
    roles: ['ADMIN', 'SUPER_ADMIN'],
    description: 'Data koperasi'
  },
  {
    path: '/dashboard/petani',
    label: 'Manajemen Petani',
    icon: '👨‍🌾',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Data petani anggota'
  },
  {
    path: '/dashboard/lahan',
    label: 'Manajemen Lahan',
    icon: '🌱',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Data lahan & estimasi'
  },
  {
    path: '/dashboard/aktivitas',
    label: 'Aktivitas Pertanian',
    icon: '📝',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Catat aktivitas'
  },
  {
    path: '/dashboard/inventory',
    label: 'Inventaris',
    icon: '📦',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Stok & batch kopi'
  },
  {
    path: '/dashboard/transaksi-inventory',
    label: 'Transaksi Inventaris',
    icon: '🔄',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Keluar masuk inventaris'
  },
  {
    path: '/dashboard/traceability',
    label: 'Traceability',
    icon: '🔍',
    roles: ['ADMIN', 'OPERATOR', 'SUPER_ADMIN'],
    description: 'Lacak asal-usul kopi'
  },
  {
    path: '/dashboard/quality',
    label: 'Kontrol Kualitas',
    icon: '⭐',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Manajemen kualitas'
  },
  {
    path: '/dashboard/laporan',
    label: 'Laporan',
    icon: '📊',
    roles: ['ADMIN', 'OPERATOR'],
    description: 'Analisis & ekspor data'
  },
  {
    path: '/dashboard/kementerian',
    label: 'Dashboard Kementerian',
    icon: '🏛️',
    roles: ['ADMIN'],
    description: 'Data nasional'
  }
];

export default function DashboardLayout({ children, pageTitle, pageDescription }: DashboardLayoutProps) {
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await api.get('/users/me');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user data:', error);
        // If user fetch fails, redirect to login
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    fetchUser();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    navigate('/');
  };

  const filteredMenuItems = menuItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-krem-muda">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aksen-oranye"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-krem-muda flex">
      {/* Sidebar */}
      <div className={`bg-white shadow-lg transition-all duration-300 ${
        sidebarOpen ? 'w-64' : 'w-16'
      } flex flex-col`}>
        {/* Logo & Toggle */}
        <div className="p-4 border-b border-neutral-200">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-3 ${sidebarOpen ? '' : 'justify-center'}`}>
              <div className="w-8 h-8 bg-aksen-oranye rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">☕</span>
              </div>
              {sidebarOpen && (
                <span className="font-bold text-kopi-pekat font-display">Kopi Digital</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-kopi-pekat hover:bg-aksen-oranye/10"
            >
              {sidebarOpen ? '◀' : '▶'}
            </Button>
          </div>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-neutral-200">
          <div className={`flex items-center space-x-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-8 h-8 bg-daun-hijau rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {user.nama_lengkap?.charAt(0) || user.username.charAt(0)}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-kopi-pekat truncate">
                  {user.nama_lengkap || user.username}
                </p>
                <p className="text-xs text-kopi-pekat/60 truncate">
                  {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 
                   user.role === 'ADMIN' ? 'Administrator' : 'Operator'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 p-3 rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-aksen-oranye text-white' 
                    : 'text-kopi-pekat hover:bg-aksen-oranye/10'
                } ${sidebarOpen ? '' : 'justify-center'}`}
                title={!sidebarOpen ? item.label : ''}
              >
                <span className="text-lg">{item.icon}</span>
                {sidebarOpen && (
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.label}</p>
                    {item.description && (
                      <p className={`text-xs truncate ${
                        isActive ? 'text-white/80' : 'text-kopi-pekat/60'
                      }`}>
                        {item.description}
                      </p>
                    )}
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="p-4 border-t border-neutral-200">
          <Button
            onClick={handleLogout}
            variant="ghost"
            className={`w-full text-red-700 hover:bg-red-50 hover:text-red-800 ${
              sidebarOpen ? 'justify-start' : 'justify-center px-2'
            }`}
          >
            <span className="text-lg">🚪</span>
            {sidebarOpen && <span className="ml-3">Logout</span>}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-neutral-200 p-6">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold text-kopi-pekat font-display">
              {pageTitle}
            </h1>
            <p className="text-kopi-pekat/70 mt-1">
              {pageDescription}
            </p>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}