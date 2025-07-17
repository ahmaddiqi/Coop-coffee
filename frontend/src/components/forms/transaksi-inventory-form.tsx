import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface TransaksiInventory {
  transaksi_id?: number;
  inventory_id: number;
  koperasi_id: number;
  tipe_transaksi: string;
  jenis_operasi: string;
  tanggal: string;
  jumlah: number;
  petani_id?: number;
  lahan_id?: number;
  buyer?: string;
  harga_total?: number;
  keterangan?: string;
  referensi_pasarmikro?: string;
}

interface TransaksiInventoryFormProps {
  onTransaksiAddedOrUpdated: () => void;
  onCancel: () => void;
  transaksiToEdit?: TransaksiInventory | null;
}

export function TransaksiInventoryForm({ onTransaksiAddedOrUpdated, onCancel, transaksiToEdit }: TransaksiInventoryFormProps) {
  const [formData, setFormData] = useState<TransaksiInventory>({
    inventory_id: 0,
    koperasi_id: 0,
    tipe_transaksi: 'MASUK',
    jenis_operasi: 'PEMBELIAN',
    tanggal: '',
    jumlah: 0,
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (transaksiToEdit) {
      setFormData(transaksiToEdit);
    }
  }, [transaksiToEdit]);

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

    if (!formData.inventory_id || !formData.koperasi_id || !formData.tipe_transaksi || !formData.jenis_operasi || !formData.tanggal || !formData.jumlah) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const method = transaksiToEdit ? 'put' : 'post';
      const url = transaksiToEdit ? `/transaksi-inventory/${transaksiToEdit.transaksi_id}` : '/transaksi-inventory';
      
      await api[method](url, formData);

      toast({
        title: "Success",
        description: `Transaksi Inventory ${transaksiToEdit ? 'updated' : 'created'} successfully.`,
      });
      onTransaksiAddedOrUpdated();
    } catch (err: unknown) {
      let errorMessage = `Failed to ${transaksiToEdit ? 'update' : 'create'} transaksi inventory.`;
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
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="inventory_id" className="text-right">
            Inventory ID
          </Label>
          <Input id="inventory_id" type="number" value={formData.inventory_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="koperasi_id" className="text-right">
            Koperasi ID
          </Label>
          <Input id="koperasi_id" type="number" value={formData.koperasi_id} onChange={handleChange} className="col-span-3" />
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
              <SelectItem value="PROSES">Proses</SelectItem>
              <SelectItem value="JUAL">Jual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="jenis_operasi" className="text-right">
            Jenis Operasi
          </Label>
          <Select value={formData.jenis_operasi} onValueChange={(value) => handleSelectChange("jenis_operasi", value)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select operation type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PEMBELIAN">Pembelian</SelectItem>
              <SelectItem value="PANEN">Panen</SelectItem>
              <SelectItem value="DISTRIBUSI">Distribusi</SelectItem>
              <SelectItem value="PENJUALAN">Penjualan</SelectItem>
              <SelectItem value="TRANSFORMASI">Transformasi</SelectItem>
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
          <Label htmlFor="petani_id" className="text-right">
            Petani ID
          </Label>
          <Input id="petani_id" type="number" value={formData.petani_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lahan_id" className="text-right">
            Lahan ID
          </Label>
          <Input id="lahan_id" type="number" value={formData.lahan_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="buyer" className="text-right">
            Buyer
          </Label>
          <Input id="buyer" value={formData.buyer} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="harga_total" className="text-right">
            Harga Total
          </Label>
          <Input id="harga_total" type="number" value={formData.harga_total} onChange={handleChange} className="col-span-3" />
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
        <Button type="submit">{transaksiToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
