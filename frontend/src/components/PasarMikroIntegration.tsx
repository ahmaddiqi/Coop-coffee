import { useState, useEffect, useCallback } from 'react';
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";

interface InventoryItem {
  inventory_id: number;
  batch_id: string;
  nama_produk: string;
  tipe_produk: string;
  kuantitas_kg: number;
  tanggal_produksi: string;
  status_inventaris: string;
}

const PasarMikroIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchInventoryData = useCallback(async () => {
    try {
      const userResponse = await api.get('/users/me');
      const koperasiId = userResponse.data.koperasi_id;
      
      if (!koperasiId) {
        throw new Error('User tidak memiliki koperasi yang terkait');
      }

      const response = await api.get(`/inventory?koperasi_id=${koperasiId}`);
      setInventoryData(response.data || []);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
      toast({
        title: "Error",
        description: "Gagal memuat data inventaris",
        variant: "destructive",
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchInventoryData();
    // Load last sync time from localStorage
    const savedSyncTime = localStorage.getItem('pasarmikro_last_sync');
    if (savedSyncTime) {
      setLastSyncTime(savedSyncTime);
    }
  }, [fetchInventoryData]);

  const handleSyncInventory = async () => {
    setLoading(true);
    try {
      // Prepare real inventory data for sync
      const syncPayload = {
        timestamp: new Date().toISOString(),
        totalItems: inventoryData.length,
        inventory: inventoryData.map(item => ({
          batch_id: item.batch_id,
          product_name: item.nama_produk,
          product_type: item.tipe_produk,
          quantity_kg: item.kuantitas_kg,
          production_date: item.tanggal_produksi,
          status: item.status_inventaris
        }))
      };

      const response = await api.post('/pasarmikro/sync-inventory', syncPayload);
      
      // Save sync timestamp
      const syncTime = new Date().toLocaleString('id-ID');
      setLastSyncTime(syncTime);
      localStorage.setItem('pasarmikro_last_sync', syncTime);
      toast({
        title: "Success",
        description: response.data.message,
      });
    } catch (err: unknown) {
      let errorMessage = "Failed to sync inventory.";
      if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
        errorMessage = (err.response.data as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">PasarMikro Integration</h1>
      <p className="text-muted-foreground mb-8">Integrate and synchronize inventory data with PasarMikro.</p>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sync Inventory Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">Sinkronisasi {inventoryData.length} item inventaris ke PasarMikro.</p>
          
          {lastSyncTime && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">
                <strong>Terakhir disinkronisasi:</strong> {lastSyncTime}
              </p>
            </div>
          )}
          
          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-2">Data yang akan dikirim:</p>
            <div className="text-xs bg-gray-50 p-2 rounded">
              <ul className="space-y-1">
                {inventoryData.slice(0, 3).map((item, index) => (
                  <li key={index}>
                    {item.batch_id} - {item.nama_produk} ({item.kuantitas_kg} kg)
                  </li>
                ))}
                {inventoryData.length > 3 && (
                  <li className="text-gray-500">... dan {inventoryData.length - 3} item lainnya</li>
                )}
              </ul>
            </div>
          </div>
          
          <Button 
            onClick={handleSyncInventory} 
            disabled={loading || inventoryData.length === 0}
            className="w-full"
          >
            {loading ? 'Syncing...' : inventoryData.length === 0 ? 'Tidak ada data untuk disinkronisasi' : `Sync ${inventoryData.length} Items`}
          </Button>
        </CardContent>
      </Card>

      <Card className="w-full max-w-md mt-6">
        <CardHeader>
          <CardTitle>Webhook Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">PasarMikro can send updates to the following webhook endpoint:</p>
          <code className="block bg-muted p-2 rounded text-sm">/api/pasarmikro/webhook</code>
          <p className="mt-4 text-muted-foreground text-sm">Ensure this endpoint is configured in your PasarMikro settings to receive real-time updates.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PasarMikroIntegration;
