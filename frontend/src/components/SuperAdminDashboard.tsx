import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';
import { CrossCooperativeComparison } from './superadmin/CrossCooperativeComparison';

interface NationalStats {
  totalHarvestPerProvince: Array<{
    provinsi: string;
    total_panen_kg: number;
  }>;
  activeFarmersPerProvince: Array<{
    provinsi: string;
    jumlah_petani: number;
  }>;
  totalLandAreaPerProvince: Array<{
    provinsi: string;
    total_luas_hektar: number;
  }>;
}

interface KoperasiListItem {
  koperasi_id: number;
  nama_koperasi: string;
  provinsi: string;
  kabupaten: string;
}

interface SupplyProjection {
  supplyProjection: Array<{
    provinsi: string;
    total_estimasi_panen_kg: number;
    bulan_estimasi: string;
  }>;
}

export default function SuperAdminDashboard() {
  const [nationalStats, setNationalStats] = useState<NationalStats | null>(null);
  const [koperasiList, setKoperasiList] = useState<KoperasiListItem[]>([]);
  const [supplyProjection, setSupplyProjection] = useState<SupplyProjection | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchNationalData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all national data in parallel
      const [statsRes, koperasiRes, supplyRes] = await Promise.all([
        api.get('/reports/national'),
        api.get('/reports/national/koperasi-list'),
        api.get('/reports/national/supply-projection')
      ]);

      setNationalStats(statsRes.data);
      setKoperasiList(koperasiRes.data.koperasiList);
      setSupplyProjection(supplyRes.data);
    } catch (error: unknown) {
      let errorMessage = 'Gagal memuat data nasional';
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
  }, [toast]);

  useEffect(() => {
    fetchNationalData();
  }, [fetchNationalData]);

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="coffee-card p-6 rounded-xl animate-pulse">
              <div className="h-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2].map((i) => (
            <div key={i} className="coffee-card p-6 rounded-xl animate-pulse">
              <div className="h-64 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!nationalStats) {
    return (
      <div className="text-center py-12">
        <p className="text-kopi-pekat/70">Data nasional tidak tersedia</p>
      </div>
    );
  }

  // Calculate national totals
  const totalNationalHarvest = nationalStats.totalHarvestPerProvince.reduce(
    (sum, item) => sum + parseFloat(item.total_panen_kg.toString()), 0
  );
  const totalNationalFarmers = nationalStats.activeFarmersPerProvince.reduce(
    (sum, item) => sum + parseInt(item.jumlah_petani.toString()), 0
  );
  const totalNationalLand = nationalStats.totalLandAreaPerProvince.reduce(
    (sum, item) => sum + parseFloat(item.total_luas_hektar.toString()), 0
  );

  // Get next 3 months supply projection
  const nextThreeMonths = supplyProjection?.supplyProjection
    .slice(0, 3)
    .reduce((sum, item) => sum + parseFloat(item.total_estimasi_panen_kg.toString()), 0) || 0;

  const nationalSummaryCards = [
    {
      title: 'Total Koperasi',
      value: koperasiList.length,
      unit: 'koperasi',
      icon: '🏢',
      color: 'text-blue-600',
      subtitle: `Di ${new Set(koperasiList.map(k => k.provinsi)).size} provinsi`
    },
    {
      title: 'Total Petani',
      value: totalNationalFarmers.toLocaleString(),
      unit: 'petani',
      icon: '👥',
      color: 'text-daun-hijau',
      subtitle: 'Nasional aktif'
    },
    {
      title: 'Total Panen',
      value: totalNationalHarvest.toFixed(0),
      unit: 'kg',
      icon: '🌾',
      color: 'text-aksen-oranye',
      subtitle: 'Akumulasi nasional'
    },
    {
      title: 'Total Lahan',
      value: totalNationalLand.toFixed(1),
      unit: 'ha',
      icon: '🌱',
      color: 'text-green-600',
      subtitle: 'Luas total nasional'
    },
    {
      title: 'Proyeksi 3 Bulan',
      value: nextThreeMonths.toFixed(0),
      unit: 'kg',
      icon: '📈',
      color: 'text-purple-600',
      subtitle: 'Estimasi panen'
    },
    {
      title: 'Produktivitas Nasional',
      value: totalNationalLand > 0 ? (totalNationalHarvest / totalNationalLand).toFixed(1) : '0',
      unit: 'kg/ha',
      icon: '⚡',
      color: 'text-red-600',
      subtitle: 'Rata-rata nasional'
    }
  ];

  return (
    <div className="space-y-8">
      {/* National Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {nationalSummaryCards.map((card, index) => (
          <div key={index} className="coffee-card p-4 rounded-xl hover-lift">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <span className="text-xs text-kopi-pekat/60 uppercase tracking-wide">
                {card.title}
              </span>
            </div>
            <div className="text-right">
              <div className={`text-lg font-bold ${card.color}`}>
                {card.value}
              </div>
              <div className="text-xs text-kopi-pekat/60">
                {card.unit}
              </div>
              <div className="text-xs text-kopi-pekat/50 mt-1">
                {card.subtitle}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Provincial Performance & Koperasi List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Provincial Harvest Performance */}
        <div className="coffee-card p-6 rounded-xl hover-lift">
          <h3 className="text-lg font-bold text-kopi-pekat mb-4">
            Kinerja Panen per Provinsi
          </h3>
          <div className="space-y-3">
            {nationalStats.totalHarvestPerProvince
              .sort((a, b) => parseFloat(b.total_panen_kg.toString()) - parseFloat(a.total_panen_kg.toString()))
              .slice(0, 8)
              .map((item, index) => (
                <div key={item.provinsi} className="flex items-center justify-between p-3 bg-aksen-oranye/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm bg-daun-hijau/20 text-daun-hijau px-2 py-1 rounded font-medium">
                      #{index + 1}
                    </span>
                    <span className="font-medium text-kopi-pekat">
                      {item.provinsi}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-kopi-pekat">
                      {parseFloat(item.total_panen_kg.toString()).toLocaleString()} kg
                    </div>
                    <div className="text-xs text-kopi-pekat/60">
                      {totalNationalHarvest > 0 ? 
                        `${((parseFloat(item.total_panen_kg.toString()) / totalNationalHarvest) * 100).toFixed(1)}%`
                        : '0%'} dari total
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Registered Cooperatives */}
        <div className="coffee-card p-6 rounded-xl hover-lift">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-kopi-pekat mb-2">
              Koperasi Terdaftar
            </h3>
            <p className="text-sm text-kopi-pekat/60">
              {koperasiList.length} koperasi di {new Set(koperasiList.map(k => k.provinsi)).size} provinsi
            </p>
          </div>
          
          <div className="max-h-80 overflow-y-auto space-y-2">
            {koperasiList.map((koperasi) => (
              <div key={koperasi.koperasi_id} className="flex items-center justify-between p-3 bg-aksen-oranye/5 rounded-lg hover:bg-aksen-oranye/10 transition-colors">
                <div>
                  <div className="font-medium text-kopi-pekat text-sm">
                    {koperasi.nama_koperasi}
                  </div>
                  <div className="text-xs text-kopi-pekat/60">
                    {koperasi.kabupaten}, {koperasi.provinsi}
                  </div>
                </div>
                <div className="text-right">
                  <Link 
                    to={`/dashboard/koperasi/${koperasi.koperasi_id}`}
                    className="text-xs text-aksen-oranye hover:underline"
                  >
                    Detail →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cross-Cooperative Performance Comparison */}
      <CrossCooperativeComparison />

      {/* Supply Projection Chart */}
      {supplyProjection && supplyProjection.supplyProjection.length > 0 && (
        <div className="coffee-card p-6 rounded-xl hover-lift">
          <h3 className="text-lg font-bold text-kopi-pekat mb-4">
            Proyeksi Pasokan Nasional
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {supplyProjection.supplyProjection
              .slice(0, 6)
              .map((item, index) => (
                <div key={`${item.provinsi}-${item.bulan_estimasi}`} className="text-center p-4 bg-aksen-oranye/5 rounded-lg">
                  <div className="text-sm font-medium text-kopi-pekat mb-1">
                    {item.provinsi}
                  </div>
                  <div className="text-lg font-bold text-aksen-oranye">
                    {parseFloat(item.total_estimasi_panen_kg.toString()).toLocaleString()}
                  </div>
                  <div className="text-xs text-kopi-pekat/60">
                    kg di {item.bulan_estimasi}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}