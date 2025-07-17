import { useState, useEffect, useCallback } from "react";
import { UserRegistrationForm } from "./components/forms/user-registration-form";
import { UserLoginForm } from "./components/forms/user-login-form";
import { KoperasiRegistrationForm } from "./components/forms/koperasi-registration-form";
import { Button } from "@/components/ui/button";
import api from '@/lib/axios';
import { Routes, Route, Navigate } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/layout/DashboardLayout';
import UserManagement from './components/UserManagement';
import FarmManagement from './components/FarmManagement';
import InventoryManagement from './components/InventoryManagement';
import KoperasiManagement from './components/KoperasiManagement';
import PetaniManagement from './components/PetaniManagement';
import LahanManagement from './components/LahanManagement';
import AktivitasManagement from './components/AktivitasManagement';
import TransaksiInventoryManagement from './components/TransaksiInventoryManagement';
import KementerianDashboard from './components/KementerianDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import TraceabilityDashboard from './components/TraceabilityDashboard';
import QualityControlManagement from './components/QualityControlManagement';
import LaporanManagement from './components/LaporanManagement';
import PWAInstallPrompt from './components/PWAInstallPrompt';
import InviteRegistration from './components/InviteRegistration';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

function App() {
  const [showLogin, setShowLogin] = useState(true);
  const [needsKoperasiRegistration, setNeedsKoperasiRegistration] = useState(false);
  const [isCheckingKoperasi, setIsCheckingKoperasi] = useState(true);
  const { toast } = useToast();

  // Check authentication and koperasi registration status
  const isAuthenticated = () => {
    return localStorage.getItem('token') !== null;
  };

  const checkKoperasiStatus = async () => {
    if (!isAuthenticated()) {
      setIsCheckingKoperasi(false);
      return false;
    }
    
    try {
      setIsCheckingKoperasi(true);
      const response = await api.get('/users/me');
      
      // SUPER_ADMIN doesn't need koperasi registration
      if (response.data.role === 'SUPER_ADMIN') {
        setNeedsKoperasiRegistration(false);
        setIsCheckingKoperasi(false);
        return true;
      }
      
      const hasKoperasi = response.data.koperasi_id !== null;
      setNeedsKoperasiRegistration(!hasKoperasi);
      setIsCheckingKoperasi(false);
      return hasKoperasi;
    } catch (error: unknown) {
      console.error('Failed to check koperasi status:', error);
      setIsCheckingKoperasi(false);
      
      let errorMessage = "Gagal mengecek status koperasi";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        errorMessage = (error as any).response?.data?.message || errorMessage;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      
      // If API fails, assume user needs to login again
      localStorage.removeItem('token');
      return false;
    }
  };

  useEffect(() => {
    if (isAuthenticated()) {
      checkKoperasiStatus();
    }
  }, []); // Initial check on mount

  const handleLoginSuccess = useCallback(async () => {
    // Called when user successfully logs in
    await checkKoperasiStatus();
  }, []);

  const handleKoperasiRegistrationSuccess = () => {
    setNeedsKoperasiRegistration(false);
    // Refresh the page to update all components with new koperasi data
    window.location.reload();
  };

  return (
    <>
      <Routes>
        <Route path="/" element={
          !isAuthenticated() ? (
          <div className="flex flex-col items-center justify-center min-h-screen bg-krem-muda p-4">
            <Card className="w-full max-w-md shadow-lg border border-neutral-200/80">
              <CardHeader className="text-center space-y-4">
                <div className="w-16 h-16 bg-aksen-oranye rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03ZM21.75 7.933l-9 5.25v9l8.628-5.033a.75.75 0 0 0 .372-.648V7.933ZM2.25 7.933v6.99a.75.75 0 0 0 .372.648l8.628 5.033v-9l-9-5.25Z"/>
                  </svg>
                </div>
                <CardTitle className="font-display text-3xl font-bold text-kopi-pekat">
                  Coop-Coffee
                </CardTitle>
                <CardDescription className="text-kopi-pekat/70">
                  Digitalisasi & Traceability Koperasi Kopi
                </CardDescription>
              </CardHeader>

              <CardContent>
                {/* Toggle Buttons */}
                <div className="flex bg-orange-50 rounded-lg p-1 mb-6">
                  <Button 
                    onClick={() => setShowLogin(true)}
                    variant={showLogin ? "default" : "ghost"}
                    className={`flex-1 rounded-md font-medium ${!showLogin ? 'text-orange-600 hover:bg-orange-100' : ''}`}
                  >
                    Login
                  </Button>
                  <Button 
                    onClick={() => setShowLogin(false)}
                    variant={!showLogin ? "default" : "ghost"}
                    className={`flex-1 rounded-md font-medium ${showLogin ? 'text-orange-600 hover:bg-orange-100' : ''}`}
                  >
                    Register
                  </Button>
                </div>

                
                {/* Forms */}
                {showLogin ? <UserLoginForm onLoginSuccess={handleLoginSuccess} /> : <UserRegistrationForm />}
              </CardContent>

              <CardFooter className="text-center text-kopi-pekat/60 text-sm justify-center">
                Sistem manajemen koperasi kopi dengan teknologi traceability
              </CardFooter>
            </Card>
          </div>
        ) : isCheckingKoperasi ? (
          <div className="flex flex-col items-center justify-center min-h-screen bg-krem-muda p-4">
            <Card className="w-full max-w-md">
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-aksen-oranye mx-auto mb-4"></div>
                <p className="text-kopi-pekat">Memuat data koperasi...</p>
              </CardContent>
            </Card>
          </div>
        ) : needsKoperasiRegistration ? (
          <KoperasiRegistrationForm onSuccess={handleKoperasiRegistrationSuccess} />
        ) : (
          <Navigate to={localStorage.getItem('role') === 'SUPER_ADMIN' ? "/dashboard/superadmin" : "/dashboard"} />
        )
        } />
        
        <Route path="/invite/:token" element={<InviteRegistration />} />
        
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard/*" element={
            <Routes>
              <Route index element={<DashboardLayout pageTitle="Dashboard Utama" pageDescription="Ringkasan operasional Koperasi Sidoarjo Makmur"><Dashboard /></DashboardLayout>} />
              <Route path="users" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout pageTitle="Manajemen Pengguna" pageDescription="Kelola akun pengguna dan peran"><UserManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="koperasi" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout pageTitle="Manajemen Koperasi" pageDescription="Kelola data koperasi"><KoperasiManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="petani" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Manajemen Petani" pageDescription="Kelola data petani anggota koperasi"><PetaniManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="lahan" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Manajemen Lahan" pageDescription="Kelola data lahan dan estimasi panen"><LahanManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="aktivitas" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Manajemen Aktivitas" pageDescription="Catat aktivitas pertanian"><AktivitasManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="farm" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Manajemen Pertanian" pageDescription="Ikhtisar dan pengelolaan pertanian"><FarmManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Manajemen Inventaris" pageDescription="Kelola stok dan batch kopi"><InventoryManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="transaksi-inventory" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Transaksi Inventaris" pageDescription="Catat transaksi keluar masuk inventaris"><TransaksiInventoryManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="kementerian" element={<ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout pageTitle="Dashboard Kementerian" pageDescription="Ringkasan data nasional dan laporan"><KementerianDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="superadmin" element={<ProtectedRoute allowedRoles={['SUPER_ADMIN']}><DashboardLayout pageTitle="Dashboard Nasional" pageDescription="Monitoring dan analitik nasional untuk SUPER_ADMIN"><SuperAdminDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="traceability" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Traceability Kopi" pageDescription="Lacak asal-usul dan riwayat kopi"><TraceabilityDashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="quality" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Kontrol Kualitas" pageDescription="Manajemen dan pelaporan kualitas kopi"><QualityControlManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="laporan" element={<ProtectedRoute allowedRoles={['ADMIN', 'OPERATOR']}><DashboardLayout pageTitle="Laporan" pageDescription="Analisis dan ekspor data operasional"><LaporanManagement /></DashboardLayout></ProtectedRoute>} />
            </Routes>
          } />
        </Route>

        {/* Fallback for any unmatched routes */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt />
    </>
  );
}

export default App;
