import { useState, useEffect, useCallback } from 'react';
import api from "@/lib/axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface ReportData {
  provinsi: string;
  total_panen_kg?: number;
  jumlah_petani?: number;
  total_luas_hektar?: number;
}

interface SupplyProjectionData {
  provinsi: string;
  total_estimasi_panen_kg: number;
  bulan_estimasi: string;
}

interface KoperasiData {
  koperasi_id: number;
  nama_koperasi: string;
  provinsi: string;
  kabupaten: string;
}

interface KoperasiPerformance {
  koperasi_id: number;
  totalHarvest: number;
  activeFarmers: number;
  totalLandArea: number;
}

const KementerianDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalHarvestPerProvince, setTotalHarvestPerProvince] = useState<ReportData[]>([]);
  const [activeFarmersPerProvince, setActiveFarmersPerProvince] = useState<ReportData[]>([]);
  const [totalLandAreaPerProvince, setTotalLandAreaPerProvince] = useState<ReportData[]>([]);
  const [supplyProjection, setSupplyProjection] = useState<SupplyProjectionData[]>([]);
  const [koperasiList, setKoperasiList] = useState<KoperasiData[]>([]);
  const [selectedKoperasiId, setSelectedKoperasiId] = useState<string | null>(null);
  const [koperasiPerformance, setKoperasiPerformance] = useState<KoperasiPerformance | null>(null); // State for selected koperasi performance
  const { toast } = useToast();

  const fetchReports = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [
        nationalReportsResponse,
        supplyProjectionResponse,
        koperasiListResponse,
      ] = await Promise.all([
        api.get('/reports/national', { headers }),
        api.get('/reports/national/supply-projection', { headers }),
        api.get('/reports/national/koperasi-list', { headers }),
      ]);

      setTotalHarvestPerProvince(nationalReportsResponse.data.totalHarvestPerProvince);
      setActiveFarmersPerProvince(nationalReportsResponse.data.activeFarmersPerProvince);
      setTotalLandAreaPerProvince(nationalReportsResponse.data.totalLandAreaPerProvince);
      setSupplyProjection(supplyProjectionResponse.data.supplyProjection);
      setKoperasiList(koperasiListResponse.data.koperasiList);

    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch national reports.';
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
        errorMessage = (err.response.data as { message: string }).message;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchKoperasiPerformance = useCallback(async (koperasiId: string) => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get(`/reports/national/koperasi-performance/${koperasiId}`, { headers });
      setKoperasiPerformance(response.data); // Set the performance data
      toast({
        title: "Success",
        description: `Fetched performance for Koperasi ID: ${koperasiId}`,
      });
    } catch (err: unknown) {
      let errorMessage = `Failed to fetch performance for Koperasi ID: ${koperasiId}.`;
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
        errorMessage = (err.response.data as { message: string }).message;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  useEffect(() => {
    if (selectedKoperasiId) {
      fetchKoperasiPerformance(selectedKoperasiId);
    } else {
      setKoperasiPerformance(null); // Clear performance data if no koperasi is selected
    }
  }, [selectedKoperasiId, fetchKoperasiPerformance]);

  if (loading) {
    return <div className="p-4 text-foreground">Loading National Reports...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive-foreground">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold text-foreground mb-6">National Dashboard (Kementerian)</h1>
      <p className="text-muted-foreground mb-8">Aggregated data and reports for national overview.</p>

      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground mb-2">Filter by Koperasi</h2>
        <Select onValueChange={setSelectedKoperasiId} value={selectedKoperasiId || ""}>
          <SelectTrigger className="w-[280px]">
            <SelectValue placeholder="Select a Koperasi" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Koperasi</SelectItem>
            {koperasiList.map((koperasi) => (
              <SelectItem key={koperasi.koperasi_id} value={String(koperasi.koperasi_id)}>
                {koperasi.nama_koperasi} ({koperasi.provinsi})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selectedKoperasiId && koperasiPerformance && (
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance for Koperasi ID: {koperasiPerformance.koperasi_id}</CardTitle>
            </CardHeader>
            <CardContent>
              <p><strong>Total Harvest:</strong> {koperasiPerformance.totalHarvest?.toFixed(2) || 0} Kg</p>
              <p><strong>Active Farmers:</strong> {koperasiPerformance.activeFarmers || 0}</p>
              <p><strong>Total Land Area:</strong> {koperasiPerformance.totalLandArea?.toFixed(2) || 0} Ha</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Harvest per Province (Kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Total Panen (Kg)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalHarvestPerProvince.length > 0 ? (
                  totalHarvestPerProvince.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.provinsi}</TableCell>
                      <TableCell>{data.total_panen_kg?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2}>No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Farmers per Province</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Jumlah Petani</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeFarmersPerProvince.length > 0 ? (
                  activeFarmersPerProvince.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.provinsi}</TableCell>
                      <TableCell>{data.jumlah_petani}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2}>No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Land Area per Province (Hectares)</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Provinsi</TableHead>
                  <TableHead>Total Luas (Ha)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {totalLandAreaPerProvince.length > 0 ? (
                  totalLandAreaPerProvince.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell>{data.provinsi}</TableCell>
                      <TableCell>{data.total_luas_hektar?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2}>No data available.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>National Supply Projection (Kg)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={supplyProjection}
                margin={{
                  top: 5,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="bulan_estimasi" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total_estimasi_panen_kg" name="Estimated Harvest (Kg)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default KementerianDashboard;
