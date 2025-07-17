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

export function InventoryList() {
  const [inventory, setInventory] = useState([]);
  const [koperasi, setKoperasi] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] = useState<any>(null);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

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

  const onAddInventorySubmit = useCallback(async (data: any) => {
    try {
      const response = await api.post("/inventory", data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchInventory();
    } catch (error: unknown) {
      let errorMessage = "Failed to create inventory item.";
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
  }, [fetchInventory, toast]);

  const onEditInventorySubmit = useCallback(async (data: any) => {
    try {
      const response = await api.put(`/inventory/${selectedInventory.inventory_id}`, data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchInventory();
      setIsEditOpen(false);
    } catch (error: unknown) {
      let errorMessage = "Failed to update inventory item.";
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
  }, [fetchInventory, selectedInventory, toast]);

  useEffect(() => {
    fetchInventory();
    fetchKoperasi();
  }, [fetchInventory, fetchKoperasi]);

  const openEditDialog = (inventory: any) => {
    setSelectedInventory(inventory);
    setValue("koperasi_id", inventory.koperasi_id);
    setValue("nama_item", inventory.nama_item);
    setValue("tipe_transaksi", inventory.tipe_transaksi);
    setValue("tanggal", inventory.tanggal);
    setValue("jumlah", inventory.jumlah);
    setValue("satuan", inventory.satuan);
    setValue("batch_id", inventory.batch_id);
    setValue("parent_batch_id", inventory.parent_batch_id);
    setValue("keterangan", inventory.keterangan);
    setValue("referensi_pasarmikro", inventory.referensi_pasarmikro);
    setIsEditOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Inventory List</CardTitle>
        <Dialog>
          <DialogTrigger asChild>
            <Button>Add Inventory Item</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddInventorySubmit)}>
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
                  <Label htmlFor="nama_item">Nama Item</Label>
                  <Input id="nama_item" placeholder="Enter nama item" {...register("nama_item", { required: true })} />
                  {errors.nama_item && <p className="text-red-700">Nama Item is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="tipe_transaksi">Tipe Transaksi</Label>
                  <select id="tipe_transaksi" {...register("tipe_transaksi", { required: true })}>
                    <option value="MASUK">MASUK</option>
                    <option value="KELUAR">KELUAR</option>
                  </select>
                  {errors.tipe_transaksi && <p className="text-red-700">Tipe Transaksi is required.</p>}
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
                  <Label htmlFor="satuan">Satuan</Label>
                  <Input id="satuan" placeholder="Enter satuan" {...register("satuan", { required: true })} />
                  {errors.satuan && <p className="text-red-700">Satuan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="batch_id">Batch ID</Label>
                  <Input id="batch_id" placeholder="Enter batch ID" {...register("batch_id")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="parent_batch_id">Parent Batch ID</Label>
                  <Input id="parent_batch_id" placeholder="Enter parent batch ID" {...register("parent_batch_id")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="keterangan">Keterangan</Label>
                  <Input id="keterangan" placeholder="Enter keterangan" {...register("keterangan")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="referensi_pasarmikro">Referensi PasarMikro</Label>
                  <Input id="referensi_pasarmikro" placeholder="Enter referensi PasarMikro" {...register("referensi_pasarmikro")} />
                </div>
                <Button type="submit">Add Inventory Item</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Item</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Satuan</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {inventory.map((i: Inventory) => (
              <TableRow key={i.inventory_id}>
                <TableCell>{i.nama_item}</TableCell>
                <TableCell>{i.tipe_transaksi}</TableCell>
                <TableCell>{i.tanggal}</TableCell>
                <TableCell>{i.jumlah}</TableCell>
                <TableCell>{i.satuan}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(i)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditInventorySubmit)}>
            <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-koperasi_id">Koperasi</Label>
                  <select id="edit-koperasi_id" {...register("koperasi_id", { required: true })}>
                    {koperasi.map((k: Koperasi) => (
                      <option key={k.koperasi_id} value={k.koperasi_id}>{k.nama_koperasi}</option>
                    ))}
                  </select>
                  {errors.koperasi_id && <p className="text-red-700">Koperasi is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-nama_item">Nama Item</Label>
                  <Input id="edit-nama_item" placeholder="Enter nama item" {...register("nama_item", { required: true })} />
                  {errors.nama_item && <p className="text-red-700">Nama Item is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-tipe_transaksi">Tipe Transaksi</Label>
                  <select id="edit-tipe_transaksi" {...register("tipe_transaksi", { required: true })}>
                    <option value="MASUK">MASUK</option>
                    <option value="KELUAR">KELUAR</option>
                  </select>
                  {errors.tipe_transaksi && <p className="text-red-700">Tipe Transaksi is required.</p>}
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
                  <Label htmlFor="edit-satuan">Satuan</Label>
                  <Input id="edit-satuan" placeholder="Enter satuan" {...register("satuan", { required: true })} />
                  {errors.satuan && <p className="text-red-700">Satuan is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-batch_id">Batch ID</Label>
                  <Input id="edit-batch_id" placeholder="Enter batch ID" {...register("batch_id")} />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="edit-parent_batch_id">Parent Batch ID</Label>
                  <Input id="edit-parent_batch_id" placeholder="Enter parent batch ID" {...register("parent_batch_id")} />
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