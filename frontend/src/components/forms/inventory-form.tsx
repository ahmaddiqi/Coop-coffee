import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface Inventory {
  inventory_id?: number;
  koperasi_id: number;
  nama_item: string;
  tipe_transaksi: string;
  tanggal: string;
  jumlah: number;
  satuan: string;
  batch_id: string;
  parent_batch_id?: string;
  keterangan?: string;
  referensi_pasarmikro?: string;
}

interface InventoryFormProps {
  onInventoryAddedOrUpdated: () => void;
  onCancel: () => void;
  inventoryToEdit?: Inventory | null;
}

export function InventoryForm({ onInventoryAddedOrUpdated, onCancel, inventoryToEdit }: InventoryFormProps) {
  const [formData, setFormData] = useState<Inventory>({
    koperasi_id: 0,
    nama_item: '',
    tipe_transaksi: 'MASUK',
    tanggal: '',
    jumlah: 0,
    satuan: '',
    batch_id: '',
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (inventoryToEdit) {
      setFormData(inventoryToEdit);
    }
  }, [inventoryToEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.koperasi_id || !formData.nama_item || !formData.tipe_transaksi || !formData.tanggal || !formData.jumlah || !formData.satuan || !formData.batch_id) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const method = inventoryToEdit ? 'put' : 'post';
      const url = inventoryToEdit ? `/inventory/${inventoryToEdit.inventory_id}` : '/inventory';
      
      await api[method](url, formData);

      toast({
        title: "Success",
        description: `Inventory item ${inventoryToEdit ? 'updated' : 'created'} successfully.`,
      });
      onInventoryAddedOrUpdated();
    } catch (err: unknown) {
      let errorMessage = `Failed to ${inventoryToEdit ? 'update' : 'create'} inventory item.`;
      if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
        errorMessage = (err.response.data as { message: string }).message;
      }
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="koperasi_id" className="text-right">
            Koperasi ID
          </Label>
          <Input id="koperasi_id" type="number" value={formData.koperasi_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nama_item" className="text-right">
            Nama Item
          </Label>
          <Input id="nama_item" value={formData.nama_item} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="tipe_transaksi" className="text-right">
            Tipe Transaksi
          </Label>
          <Select value={formData.tipe_transaksi} onValueChange={(value) => handleSelectChange("tipe_transaksi", value)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select transaction type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="MASUK">Masuk</SelectItem>
              <SelectItem value="KELUAR">Keluar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="tanggal" className="text-right">
            Tanggal
          </Label>
          <Input id="tanggal" type="date" value={formData.tanggal} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="jumlah" className="text-right">
            Jumlah
          </Label>
          <Input id="jumlah" type="number" value={formData.jumlah} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="satuan" className="text-right">
            Satuan
          </Label>
          <Input id="satuan" value={formData.satuan} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="batch_id" className="text-right">
            Batch ID
          </Label>
          <Input id="batch_id" value={formData.batch_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="parent_batch_id" className="text-right">
            Parent Batch ID
          </Label>
          <Input id="parent_batch_id" value={formData.parent_batch_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="keterangan" className="text-right">
            Keterangan
          </Label>
          <Input id="keterangan" value={formData.keterangan} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="referensi_pasarmikro" className="text-right">
            Referensi PasarMikro
          </Label>
          <Input id="referensi_pasarmikro" value={formData.referensi_pasarmikro} onChange={handleChange} className="col-span-3" />
        </div>
        {error && <p className="col-span-4 text-center text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{inventoryToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
