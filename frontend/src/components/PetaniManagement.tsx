import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from 'react-hook-form';

interface Petani {
  petani_id: number;
  koperasi_id: number;
  nama: string;
  kontak: string;
  alamat: string;
}

interface Koperasi {
  koperasi_id: number;
  nama_koperasi: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
}

interface PetaniFormData {
  koperasi_id: number;
  nama: string;
  kontak: string;
  alamat: string;
}

function PetaniManagement() {
  const [petani, setPetani] = useState<Petani[]>([]);
  const [koperasi, setKoperasi] = useState<Koperasi[]>([]);
  const [landStats, setLandStats] = useState<Record<number, {jumlah_lahan: number, total_luas_hektar: number}>>({});
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPetani, setSelectedPetani] = useState<Petani | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<PetaniFormData>();

  const fetchPetani = useCallback(async () => {
    try {
      const response = await api.get("/petani");
      setPetani(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch petani.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data) {
        errorMessage = (error.response.data as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchKoperasi = useCallback(async () => {
    try {
      const response = await api.get("/koperasi");
      setKoperasi(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch koperasi.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data) {
        errorMessage = (error.response.data as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [toast]);

  const fetchLandStats = useCallback(async () => {
    try {
      const response = await api.get("/petani/land-stats");
      setLandStats(response.data);
    } catch (error: unknown) {
      console.error("Failed to fetch land stats:", error);
      // Don't show error toast for land stats as it's supplementary data
    }
  }, []);

  const onAddPetaniSubmit = useCallback(async (data: PetaniFormData) => {
    try {
      const response = await api.post("/petani", data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchPetani();
      fetchLandStats(); // Refresh land stats after adding new farmer
    } catch (error: unknown) {
      let errorMessage = "Failed to create petani.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data) {
        errorMessage = (error.response.data as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [fetchPetani, toast]);

  const onEditPetaniSubmit = useCallback(async (data: PetaniFormData) => {
    try {
      const response = await api.put(`/petani/${selectedPetani.petani_id}`, data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchPetani();
      fetchLandStats(); // Refresh land stats after editing farmer
      setIsEditOpen(false);
    } catch (error: unknown) {
      let errorMessage = "Failed to update petani.";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'message' in error.response.data) {
        errorMessage = (error.response.data as { message: string }).message;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  }, [fetchPetani, selectedPetani, toast]);

  useEffect(() => {
    fetchPetani();
    fetchKoperasi();
    fetchLandStats();
  }, [fetchPetani, fetchKoperasi, fetchLandStats]);

  const openEditDialog = (petani: Petani) => {
    setSelectedPetani(petani);
    setValue("koperasi_id", petani.koperasi_id);
    setValue("nama", petani.nama);
    setValue("kontak", petani.kontak);
    setValue("alamat", petani.alamat);
    setIsEditOpen(true);
  };

  return (
    <div className="bg-krem-kartu p-6 rounded-xl border border-neutral-200/80 shadow-sm">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h3 className="text-xl font-bold text-kopi-pekat font-display">Manajemen Petani & Lahan</h3>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span>Tambah Petani Baru</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Petani</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddPetaniSubmit)}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="koperasi_id">Koperasi</Label>
                  <select id="koperasi_id" {...register("koperasi_id", { required: true, valueAsNumber: true })}>
                    {koperasi.map((k: Koperasi) => (
                      <option key={k.koperasi_id} value={k.koperasi_id}>{k.nama_koperasi}</option>
                    ))}
                  </select>
                  {errors.koperasi_id && <p className="text-red-700">Koperasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="nama">Nama Petani</Label>
                  <Input id="nama" placeholder="Enter nama petani" {...register("nama", { required: true })} />
                  {errors.nama && <p className="text-red-700">Nama Petani is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="kontak">Kontak</Label>
                  <Input 
                    id="kontak" 
                    placeholder="Enter nomor telepon (10-15 digit)" 
                    {...register("kontak", {
                      pattern: {
                        value: /^[\+]?[0-9]{10,15}$/,
                        message: "Nomor telepon harus dalam format yang valid (10-15 digit)"
                      }
                    })} 
                  />
                  {errors.kontak && <p className="text-red-700">{errors.kontak.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="alamat">Alamat</Label>
                  <Input id="alamat" placeholder="Enter alamat" {...register("alamat")} />
                </div>
                <Button type="submit">Add Petani</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-orange-50 text-xs text-kopi-pekat uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Nama Petani</th>
              <th className="px-6 py-3 font-semibold">Kontak</th>
              <th className="px-6 py-3 font-semibold text-center">Jumlah Lahan</th>
              <th className="px-6 py-3 font-semibold text-center">Total Luas (ha)</th>
              <th className="px-6 py-3 font-semibold text-center">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {petani.map((p: Petani) => (
              <tr key={p.petani_id} className="border-b border-neutral-200/80">
                <td className="px-6 py-4 font-medium">{p.nama}</td>
                <td className="px-6 py-4 text-kopi-pekat/70">{p.kontak}</td>
                <td className="px-6 py-4 text-kopi-pekat/70 text-center">
                  {landStats[p.petani_id]?.jumlah_lahan || 0}
                </td>
                <td className="px-6 py-4 text-kopi-pekat/70 text-center">
                  {landStats[p.petani_id]?.total_luas_hektar?.toFixed(1) || '0.0'} ha
                </td>
                <td className="px-6 py-4 text-center">
                  <Button 
                    variant="link" 
                    className="text-sm font-semibold h-auto p-0" 
                    onClick={() => openEditDialog(p)}
                  >
                    Lihat Lahan
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Petani</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditPetaniSubmit)}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-koperasi_id">Koperasi</Label>
                  <select id="edit-koperasi_id" {...register("koperasi_id", { required: true, valueAsNumber: true })}>
                    {koperasi.map((k: Koperasi) => (
                      <option key={k.koperasi_id} value={k.koperasi_id}>{k.nama_koperasi}</option>
                    ))}
                  </select>
                  {errors.koperasi_id && <p className="text-red-700">Koperasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-nama">Nama Petani</Label>
                  <Input id="edit-nama" placeholder="Enter nama petani" {...register("nama", { required: true })} />
                  {errors.nama && <p className="text-red-700">Nama Petani is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-kontak">Kontak</Label>
                  <Input 
                    id="edit-kontak" 
                    placeholder="Enter nomor telepon (10-15 digit)" 
                    {...register("kontak", {
                      pattern: {
                        value: /^[\+]?[0-9]{10,15}$/,
                        message: "Nomor telepon harus dalam format yang valid (10-15 digit)"
                      }
                    })} 
                  />
                  {errors.kontak && <p className="text-red-700">{errors.kontak.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-alamat">Alamat</Label>
                  <Input id="edit-alamat" placeholder="Enter alamat" {...register("alamat")} />
                </div>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PetaniManagement;