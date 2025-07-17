import React, { useState, useEffect, useCallback } from 'react'
import api from '@/lib/axios'
import { useToast } from '@/components/ui/use-toast'

interface TraceabilityFlowProps {
  batchId?: string
}

interface TraceabilityStage {
  stage: string;
  title: string;
  timestamp: string;
  details: any;
}

interface TraceabilityData {
  batchInfo: {
    batch_id: string;
    nama_produk: string;
    tipe_produk: string;
    kuantitas_kg: number;
    tanggal_produksi: string;
    status_inventaris: string;
    nama_koperasi: string;
    provinsi: string;
  };
  origin: {
    nama_lahan: string;
    nama_petani: string;
    jenis_kopi: string;
    luas_hektar: number;
    hasil_panen_kg: number;
  } | null;
  processingHistory: Array<{
    tanggal_transaksi: string;
    jenis_transaksi: string;
    kuantitas_kg: number;
    catatan: string;
  }>;
  qualityCheckpoints: Array<{
    tanggal_kontrol: string;
    checkpoint_type: string;
    hasil_kontrol: string;
    catatan_kualitas: string;
  }>;
  traceabilityStages: TraceabilityStage[];
}

export function TraceabilityFlow({ batchId = 'GB-SDA-042' }: TraceabilityFlowProps) {
  const [traceabilityData, setTraceabilityData] = useState<TraceabilityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const fetchTraceabilityData = useCallback(async () => {
    if (!batchId) return
    
    try {
      setLoading(true)
      setError(null)
      
      const response = await api.get(`/reports/traceability/${batchId}`)
      setTraceabilityData(response.data)
    } catch (error: unknown) {
      let errorMessage = 'Gagal memuat data traceability'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const apiError = error as any
        if (apiError.response?.status === 404) {
          errorMessage = 'Batch ID tidak ditemukan'
        } else {
          errorMessage = apiError.response?.data?.message || errorMessage
        }
      }
      setError(errorMessage)
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }, [batchId, toast])

  useEffect(() => {
    fetchTraceabilityData()
  }, [fetchTraceabilityData])

  if (loading) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-large">
        <div className="text-center mb-12">
          <div className="inline-block bg-orange-100 animate-pulse h-8 w-32 rounded-full mb-4"></div>
          <div className="h-8 bg-orange-100 animate-pulse rounded mb-2"></div>
          <div className="h-4 bg-orange-100 animate-pulse rounded w-1/2 mx-auto"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="text-center">
              <div className="w-20 h-20 bg-orange-100 animate-pulse rounded-full mx-auto mb-6"></div>
              <div className="bg-orange-100 animate-pulse h-32 rounded-xl"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !traceabilityData) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-large">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-kopi-pekat mb-2">Data Tidak Ditemukan</h3>
          <p className="text-kopi-pekat/70 mb-4">{error || 'Batch ID tidak valid atau tidak tersedia'}</p>
          <p className="text-sm text-kopi-pekat/60">Batch ID: {batchId}</p>
        </div>
      </div>
    )
  }

  // Format stages with real data
  const timelineStages = [
    {
      icon: '🌱',
      title: 'Origin',
      details: {
        main: traceabilityData.origin?.nama_lahan || 'Lahan tidak diketahui',
        sub: traceabilityData.origin ? [
          `Petani: ${traceabilityData.origin.nama_petani}`,
          `Jenis: ${traceabilityData.origin.jenis_kopi}`,
          `Luas: ${traceabilityData.origin.luas_hektar} ha`
        ] : ['Data origin tidak tersedia']
      }
    },
    {
      icon: '🍒',
      title: 'Harvest',
      details: {
        main: 'Panen ' + traceabilityData.batchInfo.tipe_produk,
        sub: [
          `Tanggal: ${new Date(traceabilityData.batchInfo.tanggal_produksi).toLocaleDateString('id-ID')}`,
          `Hasil: ${traceabilityData.batchInfo.kuantitas_kg} kg`,
          `Status: ${traceabilityData.batchInfo.status_inventaris}`
        ]
      }
    },
    {
      icon: '⚙️',
      title: 'Processing',
      details: {
        main: 'Pemrosesan Kopi',
        sub: [
          `Total Proses: ${traceabilityData.processingHistory.length}`,
          traceabilityData.processingHistory.length > 0 
            ? `Terakhir: ${traceabilityData.processingHistory[traceabilityData.processingHistory.length - 1].jenis_transaksi}`
            : 'Belum ada proses',
          `Tipe: ${traceabilityData.batchInfo.tipe_produk}`
        ]
      }
    },
    {
      icon: '📦',
      title: 'Stock Status',
      details: {
        main: 'Status Inventaris',
        sub: [
          `Status: ${traceabilityData.batchInfo.status_inventaris}`,
          `Koperasi: ${traceabilityData.batchInfo.nama_koperasi}`,
          `Lokasi: ${traceabilityData.batchInfo.provinsi}`
        ]
      }
    }
  ]

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-large">
      <div className="text-center mb-12">
        <div className="inline-block bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full font-semibold text-sm mb-4">
          Batch ID: {traceabilityData.batchInfo.batch_id}
        </div>
        <h3 className="text-2xl font-bold text-coffee-900 font-display">{traceabilityData.batchInfo.nama_produk}</h3>
        <p className="text-kopi-pekat/70 mt-2">Pelacakan lengkap dari {traceabilityData.batchInfo.nama_koperasi}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
        {timelineStages.map((stage, index) => (
          <div key={index} className="text-center relative">
            {/* Timeline Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-coffee-900 to-coffee-800 rounded-full flex items-center justify-center text-3xl mb-6 mx-auto shadow-coffee relative z-10">
              <span className="text-white">{stage.icon}</span>
            </div>
            
            {/* Timeline Connector */}
            {index < timelineStages.length - 1 && (
              <div className="absolute top-10 left-1/2 w-full h-0.5 bg-gradient-to-r from-orange-500 to-transparent hidden lg:block z-0" 
                   style={{ transform: 'translateX(40px)', width: 'calc(100% - 80px)' }} />
            )}

            {/* Content */}
            <div className="bg-orange-50 p-4 rounded-xl">
              <h4 className="text-lg font-bold text-coffee-900 font-display mb-3">{stage.title}</h4>
              <div className="text-sm text-kopi-pekat/80 space-y-1">
                <div className="font-semibold text-coffee-900">{stage.details.main}</div>
                {stage.details.sub.map((detail, idx) => (
                  <div key={idx}>{detail}</div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quality Indicators */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 text-xl">✅</span>
            </div>
            <div className="font-semibold text-coffee-900">Status Kualitas</div>
            <div className="text-sm text-kopi-pekat/70">
              {traceabilityData.qualityCheckpoints.length > 0 
                ? `${traceabilityData.qualityCheckpoints.length} Checkpoint` 
                : 'Belum ada kontrol kualitas'}
            </div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-blue-600 text-xl">🔗</span>
            </div>
            <div className="font-semibold text-coffee-900">Traceable</div>
            <div className="text-sm text-kopi-pekat/70">Full Chain Tracked</div>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-orange-600 text-xl">📋</span>
            </div>
            <div className="font-semibold text-coffee-900">Verified</div>
            <div className="text-sm text-kopi-pekat/70">{traceabilityData.batchInfo.tipe_produk}</div>
          </div>
        </div>
      </div>
    </div>
  )
}