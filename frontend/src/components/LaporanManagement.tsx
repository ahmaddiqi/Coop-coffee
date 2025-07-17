import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface ProductivityData {
  nama_lahan: string;
  nama_petani: string;
  luas_hektar: number;
  total_panen_kg: number;
  produktivitas_kg_per_ha: number;
}

interface InventoryStats {
  totalCherry: number;
  totalGreenBean: number;
  totalStock: number;
}

const LaporanManagement: React.FC = () => {
  const [productivityData, setProductivityData] = useState<ProductivityData[]>([])
  const [inventoryStats, setInventoryStats] = useState<InventoryStats | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchReportData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get user's koperasi_id from token/user data
      const userResponse = await api.get('/users/me')
      const koperasiId = userResponse.data.koperasi_id
      
      if (!koperasiId) {
        throw new Error('User tidak memiliki koperasi yang terkait')
      }

      // Fetch productivity data
      const productivityResponse = await api.get(`/reports/productivity/${koperasiId}`)
      setProductivityData(productivityResponse.data.productivity || [])

      // Fetch dashboard data for inventory stats
      const dashboardResponse = await api.get(`/reports/dashboard/${koperasiId}`)
      setInventoryStats(dashboardResponse.data.inventoryStats)
      
    } catch (error: unknown) {
      let errorMessage = 'Gagal memuat data laporan'
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
    fetchReportData()
  }, [fetchReportData])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {[1, 2].map((i) => (
            <div key={i} className="bg-krem-kartu p-6 rounded-xl animate-pulse">
              <div className="h-64 bg-orange-100 rounded"></div>
            </div>
          ))}
        </div>
        <div className="bg-krem-kartu p-6 rounded-xl animate-pulse">
          <div className="h-64 bg-orange-100 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Laporan Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-krem-kartu p-6 rounded-xl border border-neutral-200/80 shadow-sm">
          <h3 className="text-xl font-bold text-kopi-pekat font-display mb-4">
            Laporan Produksi (3 Bulan Terakhir)
          </h3>
          <div className="h-64 flex items-center justify-center bg-orange-50 rounded-lg">
            <div className="text-center">
              <p className="text-kopi-pekat/70 mb-2">Data Produksi (3 Bulan Terakhir)</p>
              <p className="text-sm text-kopi-pekat/60">Chart visualization sedang dikembangkan</p>
              <div className="mt-4 text-kopi-pekat">
                <p className="text-lg font-semibold">Total Panen: {productivityData.reduce((sum, item) => sum + parseFloat(item.total_panen_kg.toString()), 0).toFixed(1)} kg</p>
                <p className="text-sm">dari {productivityData.length} lahan aktif</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-krem-kartu p-6 rounded-xl border border-neutral-200/80 shadow-sm">
          <h3 className="text-xl font-bold text-kopi-pekat font-display mb-4">
            Komposisi Stok Saat Ini
          </h3>
          <div className="h-64 flex items-center justify-center bg-orange-50 rounded-lg">
            <div className="text-center">
              <p className="text-kopi-pekat/70 mb-4">Komposisi Stok Saat Ini</p>
              {inventoryStats ? (
                <div className="grid grid-cols-1 gap-4">
                  <div className="flex justify-between items-center px-6 py-3 bg-white rounded-lg">
                    <span className="text-kopi-pekat font-medium">Cherry:</span>
                    <span className="text-aksen-oranye font-bold">{inventoryStats.totalCherry} kg</span>
                  </div>
                  <div className="flex justify-between items-center px-6 py-3 bg-white rounded-lg">
                    <span className="text-kopi-pekat font-medium">Green Bean:</span>
                    <span className="text-daun-hijau font-bold">{inventoryStats.totalGreenBean} kg</span>
                  </div>
                  <div className="flex justify-between items-center px-6 py-3 bg-kopi-pekat text-white rounded-lg">
                    <span className="font-medium">Total Stok:</span>
                    <span className="font-bold">{inventoryStats.totalStock} kg</span>
                  </div>
                </div>
              ) : (
                <p className="text-kopi-pekat/60">Tidak ada data stok tersedia</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Produktifitas Table */}
      <div className="bg-krem-kartu p-6 rounded-xl border border-neutral-200/80 shadow-sm">
        <h3 className="text-xl font-bold text-kopi-pekat font-display mb-4">
          Produktifitas Lahan (kg/ha)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-amber-50/50 text-xs text-kopi-pekat/70 uppercase">
              <tr>
                <th className="px-6 py-3 font-semibold">Nama Lahan</th>
                <th className="px-6 py-3 font-semibold">Pemilik</th>
                <th className="px-6 py-3 font-semibold">Luas (ha)</th>
                <th className="px-6 py-3 font-semibold">Total Panen (kg)</th>
                <th className="px-6 py-3 font-semibold">Produktifitas (kg/ha)</th>
              </tr>
            </thead>
            <tbody>
              {productivityData.length > 0 ? (
                productivityData.map((item, index) => (
                  <tr key={index} className="border-b border-neutral-200/80 hover:bg-amber-50/30 transition-colors">
                    <td className="px-6 py-4 font-medium text-kopi-pekat">{item.nama_lahan}</td>
                    <td className="px-6 py-4 text-kopi-pekat/80">{item.nama_petani}</td>
                    <td className="px-6 py-4 text-kopi-pekat/80">{parseFloat(item.luas_hektar.toString()).toFixed(1)}</td>
                    <td className="px-6 py-4 text-kopi-pekat/80">{parseFloat(item.total_panen_kg.toString()).toFixed(0)}</td>
                    <td className={`px-6 py-4 font-bold ${
                      parseFloat(item.produktivitas_kg_per_ha.toString()) > 300 
                        ? 'text-daun-hijau' 
                        : parseFloat(item.produktivitas_kg_per_ha.toString()) > 200 
                        ? 'text-aksen-oranye' 
                        : 'text-red-600'
                    }`}>
                      {parseFloat(item.produktivitas_kg_per_ha.toString()).toFixed(1)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-kopi-pekat/60">
                    Tidak ada data produktivitas tersedia
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LaporanManagement;