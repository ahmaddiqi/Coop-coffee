import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface QuickStatsData {
  totalFarmers: number;
  totalLandArea: number;
  totalHarvest: number;
  activeLands: number;
  avgProductivity: number;
  monthlyGrowth: number;
}

interface QuickStatsProps {
  koperasiId: string;
}

export function QuickStats({ koperasiId }: QuickStatsProps) {
  const [stats, setStats] = useState<QuickStatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        setLoading(true);
        
        // Fetch data from multiple endpoints
        const [performanceRes, productivityRes] = await Promise.all([
          api.get(`/reports/national/koperasi-performance/${koperasiId}`),
          api.get(`/reports/productivity/${koperasiId}`)
        ]);

        const performance = performanceRes.data;
        const productivity = productivityRes.data.productivity;

        // Calculate additional metrics
        const activeLands = productivity.filter((p: any) => p.total_panen_kg > 0).length;
        const avgProductivity = productivity.length > 0 ? 
          productivity.reduce((sum: number, p: any) => sum + p.produktivitas_kg_per_ha, 0) / productivity.length : 0;

        setStats({
          totalFarmers: performance.activeFarmers || 0,
          totalLandArea: performance.totalLandArea || 0,
          totalHarvest: performance.totalHarvest || 0,
          activeLands: activeLands,
          avgProductivity: avgProductivity,
          monthlyGrowth: 0 // This would require historical data comparison
        });
      } catch (error: unknown) {
        let errorMessage = 'Gagal memuat statistik cepat';
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

    if (koperasiId) {
      fetchQuickStats();
    }
  }, [koperasiId, toast]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="coffee-card p-4 rounded-xl animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="coffee-card p-6 rounded-xl">
        <p className="text-center text-kopi-pekat/70">
          Statistik tidak tersedia
        </p>
      </div>
    );
  }

  const quickStatsData = [
    {
      title: 'Total Petani',
      value: stats.totalFarmers,
      unit: 'orang',
      icon: '👥',
      color: 'text-daun-hijau'
    },
    {
      title: 'Total Lahan',
      value: stats.totalLandArea.toFixed(1),
      unit: 'ha',
      icon: '🌱',
      color: 'text-aksen-oranye'
    },
    {
      title: 'Total Panen',
      value: stats.totalHarvest.toFixed(0),
      unit: 'kg',
      icon: '🌾',
      color: 'text-kopi-pekat'
    },
    {
      title: 'Lahan Aktif',
      value: stats.activeLands,
      unit: 'lahan',
      icon: '🏡',
      color: 'text-blue-600'
    },
    {
      title: 'Produktivitas',
      value: stats.avgProductivity.toFixed(1),
      unit: 'kg/ha',
      icon: '📈',
      color: 'text-purple-600'
    },
    {
      title: 'Pertumbuhan',
      value: stats.monthlyGrowth.toFixed(1),
      unit: '% bulan ini',
      icon: '📊',
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {quickStatsData.map((stat, index) => (
        <div key={index} className="coffee-card p-4 rounded-xl hover-lift">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{stat.icon}</span>
            <span className="text-xs text-kopi-pekat/60 uppercase tracking-wide">
              {stat.title}
            </span>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.value}
            </div>
            <div className="text-xs text-kopi-pekat/60">
              {stat.unit}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}