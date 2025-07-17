import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface ProductivityData {
  nama_lahan: string;
  nama_petani: string;
  luas_hektar: number;
  total_panen_kg: number;
  produktivitas_kg_per_ha: number;
}

interface ProductivityChartProps {
  koperasiId: string;
}

export function ProductivityChart({ koperasiId }: ProductivityChartProps) {
  const [data, setData] = useState<ProductivityData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProductivityData = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/reports/productivity/${koperasiId}`);
        setData(response.data.productivity);
      } catch (error: unknown) {
        let errorMessage = 'Gagal memuat data produktivitas';
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
      fetchProductivityData();
    }
  }, [koperasiId, toast]);

  if (loading) {
    return (
      <div className="coffee-card p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-3 bg-gray-200 rounded flex-1"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="coffee-card p-6 rounded-xl">
        <h3 className="text-lg font-bold text-kopi-pekat mb-4">Produktivitas Lahan</h3>
        <p className="text-center text-kopi-pekat/70 py-8">
          Belum ada data produktivitas tersedia
        </p>
      </div>
    );
  }

  const maxProductivity = Math.max(...data.map(item => item.produktivitas_kg_per_ha));
  const topProductive = data.slice(0, 5);

  return (
    <div className="coffee-card p-6 rounded-xl hover-lift">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-kopi-pekat mb-2">
          Top 5 Lahan Produktif
        </h3>
        <p className="text-sm text-kopi-pekat/60">
          Berdasarkan kg/ha dalam 12 bulan terakhir
        </p>
      </div>

      <div className="space-y-4">
        {topProductive.map((item, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-aksen-oranye/5 rounded-lg">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="text-sm font-medium text-kopi-pekat">
                  {item.nama_lahan}
                </span>
                <span className="text-xs bg-daun-hijau/20 text-daun-hijau px-2 py-1 rounded">
                  #{index + 1}
                </span>
              </div>
              <div className="text-xs text-kopi-pekat/60 space-x-4">
                <span>Petani: {item.nama_petani}</span>
                <span>Luas: {item.luas_hektar} ha</span>
                <span>Total: {item.total_panen_kg} kg</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-kopi-pekat">
                {item.produktivitas_kg_per_ha.toFixed(1)}
              </div>
              <div className="text-xs text-kopi-pekat/60">kg/ha</div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-aksen-oranye/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-kopi-pekat/80">Rata-rata Produktivitas:</span>
          <span className="font-bold text-kopi-pekat">
            {data.length > 0 ? (
              data.reduce((sum, item) => sum + item.produktivitas_kg_per_ha, 0) / data.length
            ).toFixed(1) : 0} kg/ha
          </span>
        </div>
      </div>
    </div>
  );
}