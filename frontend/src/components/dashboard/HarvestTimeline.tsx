import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface HarvestEstimation {
  aktivitas_id: string;
  lahan_id: string;
  tanggal_estimasi: string;
  jumlah_estimasi_kg: number;
  keterangan: string;
  nama_lahan: string;
  jenis_kopi_dominan: string;
  petani_name: string;
  petani_kontak: string;
}

interface HarvestTimelineData {
  upcoming_harvests: HarvestEstimation[];
  total_estimated_kg: number;
  count: number;
}

export function HarvestTimeline() {
  const [data, setData] = useState<HarvestTimelineData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHarvestData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/aktivitas/estimasi-panen-upcoming');
        setData(response.data);
      } catch (error: unknown) {
        let errorMessage = 'Gagal memuat data estimasi panen';
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

    fetchHarvestData();
  }, [toast]);

  if (loading) {
    return (
      <div className="coffee-card p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-3/4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.upcoming_harvests.length === 0) {
    return (
      <div className="coffee-card p-6 rounded-xl">
        <h3 className="text-lg font-bold text-kopi-pekat mb-4">
          Timeline Estimasi Panen
        </h3>
        <p className="text-center text-kopi-pekat/70 py-8">
          Belum ada estimasi panen dalam 3 bulan ke depan
        </p>
      </div>
    );
  }

  const getTimelineColor = (index: number) => {
    const colors = ['bg-daun-hijau', 'bg-aksen-oranye', 'bg-blue-500', 'bg-purple-500'];
    return colors[index % colors.length];
  };

  return (
    <div className="coffee-card p-6 rounded-xl hover-lift">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-kopi-pekat mb-2">
          Timeline Estimasi Panen
        </h3>
        <p className="text-sm text-kopi-pekat/60">
          {data.count} estimasi panen dalam 3 bulan ke depan
        </p>
      </div>

      <div className="mb-6 p-4 bg-daun-hijau/10 rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-kopi-pekat/80">Total Estimasi:</span>
          <span className="font-bold text-daun-hijau text-lg">
            {data.total_estimated_kg.toFixed(0)} kg
          </span>
        </div>
      </div>

      <div className="relative space-y-4">
        {data.upcoming_harvests.map((harvest, index) => (
          <div key={harvest.aktivitas_id} className="relative flex items-start space-x-4">
            {/* Timeline dot */}
            <div className={`w-3 h-3 rounded-full mt-2 ${getTimelineColor(index)}`}></div>
            
            {/* Timeline line */}
            {index < data.upcoming_harvests.length - 1 && (
              <div className="absolute left-[5px] top-6 w-0.5 h-16 bg-gray-200"></div>
            )}

            {/* Content */}
            <div className="flex-1 bg-aksen-oranye/5 p-4 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-medium text-kopi-pekat">{harvest.nama_lahan}</h4>
                  <p className="text-sm text-kopi-pekat/60">
                    Petani: {harvest.petani_name}
                  </p>
                </div>
                <div className="text-right">
                  <div className="font-bold text-kopi-pekat">
                    {harvest.jumlah_estimasi_kg} kg
                  </div>
                  <div className="text-xs text-kopi-pekat/60">
                    {harvest.jenis_kopi_dominan || 'Arabika'}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-kopi-pekat/80">
                  {new Date(harvest.tanggal_estimasi).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </span>
                <span className="text-xs bg-aksen-oranye/20 text-aksen-oranye px-2 py-1 rounded">
                  {Math.ceil(
                    (new Date(harvest.tanggal_estimasi).getTime() - new Date().getTime()) / 
                    (1000 * 60 * 60 * 24)
                  )} hari lagi
                </span>
              </div>
              
              {harvest.keterangan && (
                <p className="text-xs text-kopi-pekat/60 mt-2 italic">
                  {harvest.keterangan}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}