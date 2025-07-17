import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import api from '@/lib/axios'
import { useToast } from '@/components/ui/use-toast'
import { QuickStats } from './dashboard/QuickStats'
import { HarvestTimeline } from './dashboard/HarvestTimeline'
import { ProductivityChart } from './dashboard/ProductivityChart'
import { TraceabilityPreview } from './dashboard/TraceabilityPreview'

interface DashboardStats {
  nextHarvest: {
    nama_lahan: string;
    tanggal_estimasi: string;
    jumlah_estimasi_kg: number;
  } | null;
  inventoryStats: {
    totalCherry: number;
    totalGreenBean: number;
    totalStock: number;
  };
  recentTransactions: Array<{
    tanggal_transaksi: string;
    nama_produk: string;
    jenis_transaksi: string;
    kuantitas_kg: number;
  }>;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [koperasiId, setKoperasiId] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      // Get user's koperasi_id from token/user data
      const userResponse = await api.get('/users/me')
      const userKoperasiId = userResponse.data.koperasi_id
      
      if (!userKoperasiId) {
        throw new Error('User tidak memiliki koperasi yang terkait')
      }

      const response = await api.get(`/reports/dashboard/${userKoperasiId}`)
      setDashboardData(response.data)
      setKoperasiId(userKoperasiId)
    } catch (error: unknown) {
      let errorMessage = 'Gagal memuat data dashboard'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        errorMessage = (error as any).response?.data?.message || errorMessage
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="coffee-card p-4 md:p-6 rounded-xl animate-pulse">
              <div className="h-16 bg-orange-100 rounded"></div>
            </div>
          ))}
        </div>
        <div className="coffee-card p-4 md:p-6 rounded-xl animate-pulse">
          <div className="h-64 bg-orange-100 rounded"></div>
        </div>
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-kopi-pekat/70">Tidak ada data dashboard tersedia</p>
      </div>
    )
  }

  // Format stats data from API
  const stats = [
    {
      title: 'Estimasi Panen Terdekat',
      value: dashboardData.nextHarvest ? 
        new Date(dashboardData.nextHarvest.tanggal_estimasi).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long', 
          year: 'numeric'
        }) : 'Tidak ada data',
      subtitle: dashboardData.nextHarvest ? 
        `${dashboardData.nextHarvest.nama_lahan} (~${dashboardData.nextHarvest.jumlah_estimasi_kg} kg)` : 
        'Belum ada estimasi panen',
      icon: '📅'
    },
    {
      title: 'Stok Kunci',
      value: `${dashboardData.inventoryStats.totalStock} kg`,
      subtitle: `${dashboardData.inventoryStats.totalCherry}kg Cherry | ${dashboardData.inventoryStats.totalGreenBean}kg Green Bean`,
      icon: '📦'
    },
    {
      title: 'Transaksi Terbaru',
      value: `${dashboardData.recentTransactions.length} Transaksi`,
      subtitle: 'Lihat Detail Transaksi',
      icon: '🛒'
    }
  ]

  const inventoryData = dashboardData.recentTransactions.map(transaction => ({
    tanggal: new Date(transaction.tanggal_transaksi).toLocaleDateString('id-ID'),
    item: transaction.nama_produk,
    status: transaction.jenis_transaksi === 'MASUK' ? 'Masuk' : 
            transaction.jenis_transaksi === 'KELUAR' ? 'Keluar' : 'Lainnya',
    jumlah: `${transaction.kuantitas_kg} kg`
  }))

  return (
    <div className="space-y-8">
      {/* Quick Stats Overview */}
      {koperasiId && (
        <div className="mb-8">
          <QuickStats koperasiId={koperasiId} />
        </div>
      )}

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="coffee-card p-4 md:p-6 rounded-xl flex items-start space-x-4 hover-lift">
            <div className="bg-aksen-oranye/10 p-3 rounded-xl">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <div>
              <p className="text-sm text-kopi-pekat/60 mb-1 font-medium">{stat.title}</p>
              <p className="text-xl md:text-2xl font-bold text-kopi-pekat font-display">{stat.value}</p>
              <p className="text-sm text-kopi-pekat/70 mt-1">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Advanced Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HarvestTimeline />
        {koperasiId && <ProductivityChart koperasiId={koperasiId} />}
      </div>

      {/* Secondary Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {koperasiId && <TraceabilityPreview koperasiId={koperasiId} />}
        
        {/* Recent Inventory Activities */}
        <div className="coffee-card p-4 md:p-6 rounded-xl hover-lift">
          <div className="mb-6">
            <h3 className="text-xl font-bold text-kopi-pekat font-display mb-2">Aktivitas Inventaris Terbaru</h3>
            <p className="text-sm text-kopi-pekat/60">
              Ini adalah 3 transaksi terakhir. Untuk data lengkap, silakan kunjungi halaman{' '}
              <Link to="/dashboard/inventory" className="text-aksen-oranye hover:underline font-medium">Inventaris</Link>.
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-aksen-oranye/5 text-xs text-kopi-pekat/70 uppercase">
                <tr>
                  <th className="px-6 py-3 font-semibold">Tanggal</th>
                  <th className="px-6 py-3 font-semibold">Nama Item</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold">Jumlah</th>
                </tr>
              </thead>
              <tbody>
                {inventoryData.map((item, index) => (
                  <tr key={index} className="border-b border-kopi-pekat/10 hover:bg-aksen-oranye/5 transition-colors">
                    <td className="px-6 py-4 text-kopi-pekat/80">{item.tanggal}</td>
                    <td className="px-6 py-4 font-medium text-kopi-pekat">{item.item}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${
                        item.status.toLowerCase() === 'masuk' ? 'text-daun-hijau bg-daun-hijau/10' : 
                        item.status.toLowerCase() === 'keluar' ? 'text-red-800 bg-red-50' :
                        'text-aksen-oranye bg-aksen-oranye/10'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-kopi-pekat/80 font-medium">{item.jumlah}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}