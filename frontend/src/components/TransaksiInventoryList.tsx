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

export function TransaksiInventoryList() {
  const [transaksi, setTransaksi] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [koperasi, setKoperasi] = useState([]);
  const [petani, setPetani] = useState([]);
  const [lahan, setLahan] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTransaksi, setSelectedTransaksi] = useState<any>(null);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();


  const fetchTransaksi = useCallback(async () => {
    try {
      const response = await api.get("/transaksi-inventory");
      setTransaksi(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch transaksi.";
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

  const fetchInventory = useCallback(async () => {
    try {
      const response = await api.get("/inventory");
      setInventory(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch inventory.";
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

  const onAddTransaksiSubmit = useCallback(async (data: any) => {
    try {
      const response = await api.post("/transaksi-inventory", data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchTransaksi();
    } catch (error: unknown) {
      let errorMessage = "Failed to create transaksi.";
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
  }, [fetchTransaksi, toast]);

  const onEditTransaksiSubmit = useCallback(async (data: any) => {
    try {
      const response = await api.put(`/transaksi-inventory/${selectedTransaksi.transaksi_id}`, data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchTransaksi();
      setIsEditOpen(false);
    } catch (error: unknown) {
      let errorMessage = "Failed to update transaksi.";
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
  }, [fetchTransaksi, selectedTransaksi, toast]);

  const openEditDialog = (transaksi: any) => {
    setSelectedTransaksi(transaksi);
    setValue("inventory_id", transaksi.inventory_id);
    setValue("koperasi_id", transaksi.koperasi_id);
    setValue("tipe_transaksi", transaksi.tipe_transaksi);
    setValue("jenis_operasi", transaksi.jenis_operasi);
    setValue("tanggal", transaksi.tanggal);
    setValue("jumlah", transaksi.jumlah);
    setValue("petani_id", transaksi.petani_id);
    setValue("lahan_id", transaksi.lahan_id);
    setValue("buyer", transaksi.buyer);
    setValue("harga_total", transaksi.harga_total);
    setValue("keterangan", transaksi.keterangan);
    setValue("referensi_pasarmikro", transaksi.referensi_pasarmikro);
    setIsEditOpen(true);
  };

  useEffect(() => {
    fetchTransaksi();
    fetchInventory();
    fetchKoperasi();
    fetchPetani();
    fetchLahan();
  }, [fetchTransaksi, fetchInventory, fetchKoperasi, fetchPetani, fetchLahan]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Transaksi Inventory List</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Transaksi</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Transaksi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddTransaksiSubmit)}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="inventory_id">Inventory Item</Label>
                  <select id="inventory_id" {...register("inventory_id", { required: true })}>
                    {inventory.map((i: any) => (
                      <option key={i.inventory_id} value={i.inventory_id}>{i.nama_item}</option>
                    ))}
                  </select>
                  {errors.inventory_id && <p className="text-red-700">Inventory Item is required.</p>}
                </div>
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
                  <Label htmlFor="tipe_transaksi">Tipe Transaksi</Label>
                  <select id="tipe_transaksi" {...register("tipe_transaksi", { required: true })}>
                    <option value="MASUK">MASUK</option>
                    <option value="KELUAR">KELUAR</option>
                    <option value="PROSES">PROSES</option>
                    <option value="JUAL">JUAL</option>
                  </select>
                  {errors.tipe_transaksi && <p className="text-red-700">Tipe Transaksi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="jenis_operasi">Jenis Operasi</Label>
                  <select id="jenis_operasi" {...register("jenis_operasi", { required: true })}>
                    <option value="PEMBELIAN">PEMBELIAN</option>
                    <option value="PANEN">PANEN</option>
                    <option value="DISTRIBUSI">DISTRIBUSI</option>
                    <option value="PENJUALAN">PENJUALAN</option>
                    <option value="TRANSFORMASI">TRANSFORMASI</option>
                  </select>
                  {errors.jenis_operasi && <p className="text-red-700">Jenis Operasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="tanggal">Tanggal</Label>
                  <Input id="tanggal" type="date" {...register("tanggal", { required: true })} />
                  {errors.tanggal && <p className="text-red-700">Tanggal is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="jumlah">Jumlah</Label>
                  <Input id="jumlah" type="number" placeholder="Enter jumlah" {...register("jumlah", { required: true })} />
                  {errors.jumlah && <p className="text-red-700">Jumlah is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="petani_id">Petani</Label>
                  <select id="petani_id" {...register("petani_id")}>
                    <option value="">Select Petani</option>
                    {petani.map((p: any) => (
                      <option key={p.petani_id} value={p.petani_id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="lahan_id">Lahan</Label>
                  <select id="lahan_id" {...register("lahan_id")}>
                    <option value="">Select Lahan</option>
                    {lahan.map((l: any) => (
                      <option key={l.lahan_id} value={l.lahan_id}>{l.nama_lahan}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="buyer">Buyer</Label>
                  <Input id="buyer" placeholder="Enter buyer" {...register("buyer")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="harga_total">Harga Total</Label>
                  <Input id="harga_total" type="number" placeholder="Enter harga total" {...register("harga_total")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Input id="keterangan" placeholder="Enter keterangan" {...register("keterangan")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="referensi_pasarmikro">Referensi PasarMikro</Label>
                  <Input id="referensi_pasarmikro" placeholder="Enter referensi PasarMikro" {...register("referensi_pasarmikro")} />
                </div>
                <Button type="submit">Add Transaksi</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tipe</TableHead>
              <TableHead>Jenis</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transaksi.map((t: Transaksi) => (
              <TableRow key={t.transaksi_id}>
                <TableCell>{t.tipe_transaksi}</TableCell>
                <TableCell>{t.jenis_operasi}</TableCell>
                <TableCell>{t.tanggal}</TableCell>
                <TableCell>{t.jumlah}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(t)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaksi</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditTransaksiSubmit)}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-inventory_id">Inventory Item</Label>
                  <select id="edit-inventory_id" {...register("inventory_id", { required: true })}>
                    {inventory.map((i: any) => (
                      <option key={i.inventory_id} value={i.inventory_id}>{i.nama_item}</option>
                    ))}
                  </select>
                  {errors.inventory_id && <p className="text-red-700">Inventory Item is required.</p>}
                </div>
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
                  <Label htmlFor="edit-tipe_transaksi">Tipe Transaksi</Label>
                  <select id="edit-tipe_transaksi" {...register("tipe_transaksi", { required: true })}>
                    <option value="MASUK">MASUK</option>
                    <option value="KELUAR">KELUAR</option>
                    <option value="PROSES">PROSES</option>
                    <option value="JUAL">JUAL</option>
                  </select>
                  {errors.tipe_transaksi && <p className="text-red-700">Tipe Transaksi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-jenis_operasi">Jenis Operasi</Label>
                  <select id="edit-jenis_operasi" {...register("jenis_operasi", { required: true })}>
                    <option value="PEMBELIAN">PEMBELIAN</option>
                    <option value="PANEN">PANEN</option>
                    <option value="DISTRIBUSI">DISTRIBUSI</option>
                    <option value="PENJUALAN">PENJUALAN</option>
                    <option value="TRANSFORMASI">TRANSFORMASI</option>
                  </select>
                  {errors.jenis_operasi && <p className="text-red-700">Jenis Operasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-tanggal">Tanggal</Label>
                  <Input id="edit-tanggal" type="date" {...register("tanggal", { required: true })} />
                  {errors.tanggal && <p className="text-red-700">Tanggal is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-jumlah">Jumlah</Label>
                  <Input id="edit-jumlah" type="number" placeholder="Enter jumlah" {...register("jumlah", { required: true })} />
                  {errors.jumlah && <p className="text-red-700">Jumlah is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-petani_id">Petani</Label>
                  <select id="edit-petani_id" {...register("petani_id")}>
                    <option value="">Select Petani</option>
                    {petani.map((p: any) => (
                      <option key={p.petani_id} value={p.petani_id}>{p.nama}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-lahan_id">Lahan</Label>
                  <select id="edit-lahan_id" {...register("lahan_id")}>
                    <option value="">Select Lahan</option>
                    {lahan.map((l: Lahan) => (
                      <option key={l.lahan_id} value={l.lahan_id}>{l.nama_lahan}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-buyer">Buyer</Label>
                  <Input id="edit-buyer" placeholder="Enter buyer" {...register("buyer")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-harga_total">Harga Total</Label>
                  <Input id="edit-harga_total" type="number" placeholder="Enter harga total" {...register("harga_total")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-keterangan">Keterangan</Label>
                  <Input id="edit-keterangan" placeholder="Enter keterangan" {...register("keterangan")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-referensi_pasarmikro">Referensi PasarMikro</Label>
                  <Input id="edit-referensi_pasarmikro" placeholder="Enter referensi PasarMikro" {...register("referensi_pasarmikro")} />
                </div>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}