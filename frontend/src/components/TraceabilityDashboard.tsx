import React, { useState, useEffect, useCallback } from 'react';
import { TraceabilityFlow } from './TraceabilityFlow';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import api from '@/lib/axios';
import { useToast } from '@/components/ui/use-toast';

const TraceabilityDashboard: React.FC = () => {
  const [batchId, setBatchId] = useState('');
  const [showFlow, setShowFlow] = useState(false);
  const [validatingBatch, setValidatingBatch] = useState(false);
  const [availableBatches, setAvailableBatches] = useState<string[]>([]);
  const { toast } = useToast();

  const fetchAvailableBatches = useCallback(async () => {
    try {
      // Get user's koperasi_id and fetch available batches
      const userResponse = await api.get('/users/me');
      const koperasiId = userResponse.data.koperasi_id;
      
      if (!koperasiId) {
        return;
      }

      const response = await api.get(`/inventory?koperasi_id=${koperasiId}`);
      const batches = response.data.map((item: any) => item.batch_id).filter(Boolean);
      setAvailableBatches(batches);
      
      // Set first batch as default if available
      if (batches.length > 0 && !batchId) {
        setBatchId(batches[0]);
      }
    } catch (error) {
      console.error('Failed to fetch available batches:', error);
    }
  }, [batchId]);

  useEffect(() => {
    fetchAvailableBatches();
  }, [fetchAvailableBatches]);

  const handleSearch = async () => {
    if (!batchId.trim()) {
      toast({
        title: 'Error',
        description: 'Masukkan Batch ID terlebih dahulu',
        variant: 'destructive',
      });
      return;
    }

    setValidatingBatch(true);
    try {
      // Validate batch existence before showing flow
      await api.get(`/reports/traceability/${batchId.trim()}`);
      setShowFlow(true);
    } catch (error: unknown) {
      let errorMessage = 'Batch ID tidak ditemukan';
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as any;
        if (apiError.response?.status === 404) {
          errorMessage = 'Batch ID tidak ditemukan di database';
        } else {
          errorMessage = apiError.response?.data?.message || errorMessage;
        }
      }
      toast({
        title: 'Batch Tidak Ditemukan',
        description: errorMessage,
        variant: 'destructive',
      });
      setShowFlow(false);
    } finally {
      setValidatingBatch(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Search Section */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-soft">
        <h3 className="text-xl font-bold text-coffee-900 font-display mb-4">Batch Traceability Search</h3>
        <p className="text-sm text-kopi-pekat/70 mb-4">Enter a batch ID to view the complete coffee journey timeline</p>
        
        {availableBatches.length > 0 && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-medium text-blue-900 mb-2">Batch tersedia di koperasi Anda:</p>
            <div className="flex flex-wrap gap-2">
              {availableBatches.slice(0, 5).map((batch) => (
                <button
                  key={batch}
                  onClick={() => setBatchId(batch)}
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                >
                  {batch}
                </button>
              ))}
              {availableBatches.length > 5 && (
                <span className="text-xs text-blue-600">+{availableBatches.length - 5} lainnya</span>
              )}
            </div>
          </div>
        )}
        
        <div className="flex gap-4 items-end">
          <div className="flex-1">
            <Label htmlFor="batchId" className="text-sm font-medium text-coffee-900">Batch ID</Label>
            <Input
              id="batchId"
              value={batchId}
              onChange={(e) => setBatchId(e.target.value)}
              placeholder="Enter batch ID (e.g., GB-SDA-042)"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="mt-1"
            />
          </div>
          <Button 
            onClick={handleSearch}
            disabled={validatingBatch}
            className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 disabled:bg-orange-200 disabled:cursor-not-allowed"
          >
            {validatingBatch ? '🔄 Validating...' : '🔍 Track Batch'}
          </Button>
        </div>
      </div>

      {/* Traceability Flow */}
      {showFlow && (
        <TraceabilityFlow batchId={batchId} />
      )}
    </div>
  );
};

export default TraceabilityDashboard;