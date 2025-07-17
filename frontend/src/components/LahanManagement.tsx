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

interface Lahan {
  lahan_id: number;
  koperasi_id: number;
  petani_id: number;
  nama_lahan: string;
  lokasi: string;
  luas_hektar: number;
  estimasi_jumlah_pohon: number;
  jenis_kopi_dominan: string;
  status_lahan: 'Baru Ditanam' | 'Produktif' | 'Tidak Aktif';
  estimasi_panen_pertama?: string;
  petani_name?: string;
}

interface Koperasi {
  koperasi_id: number;
  nama_koperasi: string;
}

interface Petani {
  petani_id: number;
  nama: string;
}

interface LahanFormData {
  koperasi_id: number;
  petani_id: number;
  nama_lahan: string;
  lokasi: string;
  luas_hektar: number;
  estimasi_jumlah_pohon: number;
  jenis_kopi_dominan: string;
  status_lahan: 'Baru Ditanam' | 'Produktif' | 'Tidak Aktif';
  estimasi_panen_pertama?: string;
}

function LahanManagement() {
  const [lahan, setLahan] = useState<Lahan[]>([]);
  const [koperasi, setKoperasi] = useState<Koperasi[]>([]);
  const [petani, setPetani] = useState<Petani[]>([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedLahan, setSelectedLahan] = useState<Lahan | null>(null);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<LahanFormData>();

  const fetchLahan = useCallback(async () => {
    try {
      const response = await api.get("/lahan");
      setLahan(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch lahan.";
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

  const onAddLahanSubmit = useCallback(async (data: LahanFormData) => {
    try {
      const response = await api.post("/lahan", data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchLahan();
    } catch (error: unknown) {
      let errorMessage = "Failed to create lahan.";
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
  }, [fetchLahan, toast]);

  const onEditLahanSubmit = useCallback(async (data: LahanFormData) => {
    try {
      const response = await api.put(`/lahan/${selectedLahan.lahan_id}`, data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchLahan();
      setIsEditOpen(false);
    } catch (error: unknown) {
      let errorMessage = "Failed to update lahan.";
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
  }, [fetchLahan, selectedLahan, toast]);

  useEffect(() => {
    fetchLahan();
    fetchKoperasi();
    fetchPetani();
  }, [fetchLahan, fetchKoperasi, fetchPetani]);

  const openEditDialog = (lahan: Lahan) => {
    setSelectedLahan(lahan);
    setValue("koperasi_id", lahan.koperasi_id);
    setValue("petani_id", lahan.petani_id);
    setValue("nama_lahan", lahan.nama_lahan);
    setValue("lokasi", lahan.lokasi);
    setValue("luas_hektar", lahan.luas_hektar);
    setValue("estimasi_jumlah_pohon", lahan.estimasi_jumlah_pohon);
    setValue("jenis_kopi_dominan", lahan.jenis_kopi_dominan);
    setValue("status_lahan", lahan.status_lahan);
    setValue("estimasi_panen_pertama", lahan.estimasi_panen_pertama);
    setIsEditOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Lahan Management</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Lahan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Lahan</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddLahanSubmit)}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="koperasi_id">Koperasi</Label>
                  <select id="koperasi_id" {...register("koperasi_id", { required: true })}>
                    {koperasi.map((k: any) => (
                      <option key={k.koperasi_id} value={k.koperasi_id}>{k.nama_koperasi}</option>
                    ))}
                  </select>
                  {errors.koperasi_id && <p className="text-red-700">Koperasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="petani_id">Petani</Label>
                  <select id="petani_id" {...register("petani_id", { required: true })}>
                    {petani.map((p: any) => (
                      <option key={p.petani_id} value={p.petani_id}>{p.nama}</option>
                    ))}
                  </select>
                  {errors.petani_id && <p className="text-red-700">Petani is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="nama_lahan">Nama Lahan</Label>
                  <Input id="nama_lahan" placeholder="Enter nama lahan" {...register("nama_lahan", { required: true })} />
                  {errors.nama_lahan && <p className="text-red-700">Nama Lahan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="lokasi">Lokasi</Label>
                  <Input id="lokasi" placeholder="Enter lokasi" {...register("lokasi", { required: true })} />
                  {errors.lokasi && <p className="text-red-700">Lokasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="luas_hektar">Luas Hektar</Label>
                  <Input 
                    id="luas_hektar" 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    placeholder="Enter luas hektar (min 0.01)" 
                    {...register("luas_hektar", { 
                      required: "Luas Hektar is required",
                      min: { value: 0.01, message: "Luas hektar must be greater than 0" },
                      valueAsNumber: true 
                    })} 
                  />
                  {errors.luas_hektar && <p className="text-red-700">{errors.luas_hektar.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="estimasi_jumlah_pohon">Estimasi Jumlah Pohon</Label>
                  <Input 
                    id="estimasi_jumlah_pohon" 
                    type="number" 
                    min="1"
                    placeholder="Enter estimasi jumlah pohon (min 1)" 
                    {...register("estimasi_jumlah_pohon", { 
                      required: "Estimasi Jumlah Pohon is required",
                      min: { value: 1, message: "Estimasi jumlah pohon must be at least 1" },
                      valueAsNumber: true 
                    })} 
                  />
                  {errors.estimasi_jumlah_pohon && <p className="text-red-700">{errors.estimasi_jumlah_pohon.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="jenis_kopi_dominan">Jenis Kopi Dominan</Label>
                  <Input id="jenis_kopi_dominan" placeholder="Enter jenis kopi dominan" {...register("jenis_kopi_dominan", { required: true })} />
                  {errors.jenis_kopi_dominan && <p className="text-red-700">Jenis Kopi Dominan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="status_lahan">Status Lahan</Label>
                  <select id="status_lahan" {...register("status_lahan", { required: true })}>
                    <option value="Baru Ditanam">Baru Ditanam</option>
                    <option value="Produktif">Produktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                  {errors.status_lahan && <p className="text-red-700">Status Lahan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="estimasi_panen_pertama">Estimasi Panen Pertama</Label>
                  <Input id="estimasi_panen_pertama" type="date" {...register("estimasi_panen_pertama")} />
                </div>
                <Button type="submit">Add Lahan</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Lahan</TableHead>
              <TableHead>Lokasi</TableHead>
              <TableHead>Luas (Ha)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {lahan.map((l: Lahan) => (
              <TableRow key={l.lahan_id}>
                <TableCell>{l.nama_lahan}</TableCell>
                <TableCell>{l.lokasi}</TableCell>
                <TableCell>{l.luas_hektar}</TableCell>
                <TableCell>{l.status_lahan}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(l)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lahan</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditLahanSubmit)}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-koperasi_id">Koperasi</Label>
                  <select id="edit-koperasi_id" {...register("koperasi_id", { required: true })}>
                    {koperasi.map((k: any) => (
                      <option key={k.koperasi_id} value={k.koperasi_id}>{k.nama_koperasi}</option>
                    ))}
                  </select>
                  {errors.koperasi_id && <p className="text-red-700">Koperasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-petani_id">Petani</Label>
                  <select id="edit-petani_id" {...register("petani_id", { required: true })}>
                    {petani.map((p: Petani) => (
                      <option key={p.petani_id} value={p.petani_id}>{p.nama}</option>
                    ))}
                  </select>
                  {errors.petani_id && <p className="text-red-700">Petani is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-nama_lahan">Nama Lahan</Label>
                  <Input id="edit-nama_lahan" placeholder="Enter nama lahan" {...register("nama_lahan", { required: true })} />
                  {errors.nama_lahan && <p className="text-red-700">Nama Lahan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-lokasi">Lokasi</Label>
                  <Input id="edit-lokasi" placeholder="Enter lokasi" {...register("lokasi", { required: true })} />
                  {errors.lokasi && <p className="text-red-700">Lokasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-luas_hektar">Luas Hektar</Label>
                  <Input 
                    id="edit-luas_hektar" 
                    type="number" 
                    step="0.01"
                    min="0.01"
                    placeholder="Enter luas hektar (min 0.01)" 
                    {...register("luas_hektar", { 
                      required: "Luas Hektar is required",
                      min: { value: 0.01, message: "Luas hektar must be greater than 0" },
                      valueAsNumber: true 
                    })} 
                  />
                  {errors.luas_hektar && <p className="text-red-700">{errors.luas_hektar.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-estimasi_jumlah_pohon">Estimasi Jumlah Pohon</Label>
                  <Input 
                    id="edit-estimasi_jumlah_pohon" 
                    type="number" 
                    min="1"
                    placeholder="Enter estimasi jumlah pohon (min 1)" 
                    {...register("estimasi_jumlah_pohon", { 
                      required: "Estimasi Jumlah Pohon is required",
                      min: { value: 1, message: "Estimasi jumlah pohon must be at least 1" },
                      valueAsNumber: true 
                    })} 
                  />
                  {errors.estimasi_jumlah_pohon && <p className="text-red-700">{errors.estimasi_jumlah_pohon.message}</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-jenis_kopi_dominan">Jenis Kopi Dominan</Label>
                  <Input id="edit-jenis_kopi_dominan" placeholder="Enter jenis kopi dominan" {...register("jenis_kopi_dominan", { required: true })} />
                  {errors.jenis_kopi_dominan && <p className="text-red-700">Jenis Kopi Dominan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-status_lahan">Status Lahan</Label>
                  <select id="edit-status_lahan" {...register("status_lahan", { required: true })}>
                    <option value="Baru Ditanam">Baru Ditanam</option>
                    <option value="Produktif">Produktif</option>
                    <option value="Tidak Aktif">Tidak Aktif</option>
                  </select>
                  {errors.status_lahan && <p className="text-red-700">Status Lahan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-estimasi_panen_pertama">Estimasi Panen Pertama</Label>
                  <Input id="edit-estimasi_panen_pertama" type="date" {...register("estimasi_panen_pertama")} />
                </div>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default LahanManagement;