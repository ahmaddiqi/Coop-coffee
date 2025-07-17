import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

interface InventoryItem {
  inventory_id: string;
  batch_id: string;
  nama_item: string;
  jumlah: number;
  satuan: string;
  tanggal: string;
  keterangan: string;
}

interface TraceabilityPreviewProps {
  koperasiId: string;
}

export function TraceabilityPreview({ koperasiId }: TraceabilityPreviewProps) {
  const [recentBatches, setRecentBatches] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchRecentBatches = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/inventory?koperasi_id=${koperasiId}`);
        
        // Get recent batches with batch_id for traceability
        const batchedItems = response.data.filter((item: InventoryItem) => 
          item.batch_id && item.batch_id.startsWith('BATCH-')
        );
        
        // Sort by most recent and take top 5
        const sortedBatches = batchedItems
          .sort((a: InventoryItem, b: InventoryItem) => 
            new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime()
          )
          .slice(0, 5);
        
        setRecentBatches(sortedBatches);
      } catch (error: unknown) {
        let errorMessage = 'Gagal memuat data traceability';
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
      fetchRecentBatches();
    }
  }, [koperasiId, toast]);

  if (loading) {
    return (
      <div className="coffee-card p-6 rounded-xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 rounded"></div>
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded mb-1"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (recentBatches.length === 0) {
    return (
      <div className="coffee-card p-6 rounded-xl">
        <h3 className="text-lg font-bold text-kopi-pekat mb-4">
          Traceability Terbaru
        </h3>
        <p className="text-center text-kopi-pekat/70 py-8">
          Belum ada batch yang dapat dilacak
        </p>
      </div>
    );
  }

  const getBatchTypeIcon = (namaItem: string) => {
    if (namaItem.toLowerCase().includes('cherry')) return '🍒';
    if (namaItem.toLowerCase().includes('green')) return '🌱';
    if (namaItem.toLowerCase().includes('roasted')) return '☕';
    return '📦';
  };

  const getBatchTypeColor = (namaItem: string) => {
    if (namaItem.toLowerCase().includes('cherry')) return 'bg-red-100 text-red-800';
    if (namaItem.toLowerCase().includes('green')) return 'bg-green-100 text-green-800';
    if (namaItem.toLowerCase().includes('roasted')) return 'bg-amber-100 text-amber-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="coffee-card p-6 rounded-xl hover-lift">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-kopi-pekat mb-2">
          Batch Traceability Terbaru
        </h3>
        <p className="text-sm text-kopi-pekat/60">
          {recentBatches.length} batch terbaru yang dapat dilacak
        </p>
      </div>

      <div className="space-y-4">
        {recentBatches.map((batch, index) => (
          <div key={batch.inventory_id} className="flex items-center justify-between p-3 bg-aksen-oranye/5 rounded-lg hover:bg-aksen-oranye/10 transition-colors">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{getBatchTypeIcon(batch.nama_item)}</span>
              <div>
                <div className="font-medium text-kopi-pekat text-sm">
                  {batch.nama_item}
                </div>
                <div className="text-xs text-kopi-pekat/60">
                  {batch.jumlah} {batch.satuan} • {new Date(batch.tanggal).toLocaleDateString('id-ID')}
                </div>
                <div className="text-xs text-kopi-pekat/50 mt-1">
                  ID: {batch.batch_id}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className={`text-xs px-2 py-1 rounded-full ${getBatchTypeColor(batch.nama_item)}`}>
                Batch #{index + 1}
              </span>
              <div className="mt-2">
                <Link 
                  to={`/dashboard/traceability/${batch.batch_id}`}
                  className="text-xs text-aksen-oranye hover:underline"
                >
                  Lacak →
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 pt-4 border-t border-kopi-pekat/10">
        <Link 
          to="/dashboard/inventory"
          className="text-sm text-aksen-oranye hover:underline flex items-center justify-center space-x-2"
        >
          <span>Lihat Semua Inventaris</span>
          <span>→</span>
        </Link>
      </div>
    </div>
  );
}