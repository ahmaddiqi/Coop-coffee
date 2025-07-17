import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface KoperasiPerformance {
  koperasi_id: number;
  nama_koperasi: string;
  provinsi: string;
  kabupaten: string;
  totalHarvest: number;
  activeFarmers: number;
  totalLandArea: number;
  productivity: number;
}

export function CrossCooperativeComparison() {
  const [performances, setPerformances] = useState<KoperasiPerformance[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchCooperativePerformances = async () => {
      try {
        setLoading(true);
        
        // First get list of cooperatives
        const koperasiRes = await api.get('/reports/national/koperasi-list');
        const koperasiList = koperasiRes.data.koperasiList;
        
        // Get performance for each cooperative
        const performancePromises = koperasiList.map(async (koperasi: any) => {
          try {
            const perfRes = await api.get(`/reports/national/koperasi-performance/${koperasi.koperasi_id}`);
            const perfData = perfRes.data;
            
            return {
              koperasi_id: koperasi.koperasi_id,
              nama_koperasi: koperasi.nama_koperasi,
              provinsi: koperasi.provinsi,
              kabupaten: koperasi.kabupaten,
              totalHarvest: perfData.totalHarvest || 0,
              activeFarmers: perfData.activeFarmers || 0,
              totalLandArea: perfData.totalLandArea || 0,
              productivity: perfData.totalLandArea > 0 ? perfData.totalHarvest / perfData.totalLandArea : 0
            };
          } catch (error) {
            console.error(`Error fetching performance for koperasi ${koperasi.koperasi_id}:`, error);
            return {
              koperasi_id: koperasi.koperasi_id,
              nama_koperasi: koperasi.nama_koperasi,
              provinsi: koperasi.provinsi,
              kabupaten: koperasi.kabupaten,
              totalHarvest: 0,
              activeFarmers: 0,
              totalLandArea: 0,
              productivity: 0
            };
          }
        });
        
        const allPerformances = await Promise.all(performancePromises);
        setPerformances(allPerformances.sort((a, b) => b.productivity - a.productivity));
        
      } catch (error: unknown) {
        let errorMessage = 'Gagal memuat perbandingan koperasi';
        if (typeof error === 'object' && error !== null && 'response' in error) {
          errorMessage = (error as any).response?.data?.message || errorMessage;
        }
        toast({
          title: 'Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCooperativePerformances();
  }, [toast]);

  if (loading) {
    return (
      <div className="coffee-card p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (performances.length === 0) {
    return (
      <div className="coffee-card p-6 rounded-xl">
        <h3 className="text-lg font-bold text-kopi-pekat mb-4">
          Perbandingan Kinerja Koperasi
        </h3>
        <p className="text-center text-kopi-pekat/70 py-8">
          Belum ada data kinerja koperasi tersedia
        </p>
      </div>
    );
  }

  const getPerformanceRank = (productivity: number, index: number) => {
    if (productivity > 0) return index + 1;
    return '-';
  };

  const getPerformanceColor = (rank: number | string) => {
    if (rank === 1) return 'text-yellow-600 bg-yellow-100';
    if (rank === 2) return 'text-gray-600 bg-gray-100';
    if (rank === 3) return 'text-amber-600 bg-amber-100';
    return 'text-blue-600 bg-blue-100';
  };

  return (
    <div className="coffee-card p-6 rounded-xl hover-lift">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-kopi-pekat mb-2">
          Ranking Kinerja Koperasi Nasional
        </h3>
        <p className="text-sm text-kopi-pekat/60">
          Berdasarkan produktivitas (kg/ha) dan indikator kinerja lainnya
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-aksen-oranye/10 text-xs text-kopi-pekat/70 uppercase">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Rank</th>
              <th className="px-4 py-3 text-left font-semibold">Koperasi</th>
              <th className="px-4 py-3 text-left font-semibold">Lokasi</th>
              <th className="px-4 py-3 text-right font-semibold">Petani</th>
              <th className="px-4 py-3 text-right font-semibold">Lahan (ha)</th>
              <th className="px-4 py-3 text-right font-semibold">Panen (kg)</th>
              <th className="px-4 py-3 text-right font-semibold">Produktivitas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-kopi-pekat/10">
            {performances.map((koperasi, index) => {
              const rank = getPerformanceRank(koperasi.productivity, index);
              return (
                <tr key={koperasi.koperasi_id} className="hover:bg-aksen-oranye/5 transition-colors">
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${getPerformanceColor(rank)}`}>
                      #{rank}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="font-medium text-kopi-pekat">
                      {koperasi.nama_koperasi}
                    </div>
                    <div className="text-xs text-kopi-pekat/60">
                      ID: {koperasi.koperasi_id}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-kopi-pekat">
                      {koperasi.kabupaten}
                    </div>
                    <div className="text-xs text-kopi-pekat/60">
                      {koperasi.provinsi}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-kopi-pekat">
                      {koperasi.activeFarmers}
                    </span>
                    <div className="text-xs text-kopi-pekat/60">petani</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-kopi-pekat">
                      {koperasi.totalLandArea.toFixed(1)}
                    </span>
                    <div className="text-xs text-kopi-pekat/60">hektar</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className="font-medium text-kopi-pekat">
                      {koperasi.totalHarvest.toLocaleString()}
                    </span>
                    <div className="text-xs text-kopi-pekat/60">kg total</div>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <span className={`font-bold ${
                      koperasi.productivity > 0 ? 'text-daun-hijau' : 'text-kopi-pekat/40'
                    }`}>
                      {koperasi.productivity > 0 ? koperasi.productivity.toFixed(2) : '-'}
                    </span>
                    {koperasi.productivity > 0 && (
                      <div className="text-xs text-kopi-pekat/60">kg/ha</div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-aksen-oranye/5 rounded-lg">
        <div className="text-center">
          <div className="text-lg font-bold text-kopi-pekat">
            {performances.length}
          </div>
          <div className="text-xs text-kopi-pekat/60">Total Koperasi</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-daun-hijau">
            {performances.reduce((sum, k) => sum + k.activeFarmers, 0).toLocaleString()}
          </div>
          <div className="text-xs text-kopi-pekat/60">Total Petani</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-aksen-oranye">
            {performances.reduce((sum, k) => sum + k.totalLandArea, 0).toFixed(1)}
          </div>
          <div className="text-xs text-kopi-pekat/60">Total Lahan (ha)</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {performances.length > 0 ? (
              performances.reduce((sum, k) => sum + k.productivity, 0) / performances.filter(k => k.productivity > 0).length || 0
            ).toFixed(2) : '0'}
          </div>
          <div className="text-xs text-kopi-pekat/60">Rata-rata Produktivitas</div>
        </div>
      </div>
    </div>
  );
}