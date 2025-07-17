import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface Lahan {
  lahan_id?: number;
  koperasi_id: number;
  petani_id: number;
  nama_lahan: string;
  lokasi: string;
  luas_hektar: number;
  estimasi_jumlah_pohon: number;
  jenis_kopi_dominan: string;
  status_lahan: string;
  estimasi_panen_pertama: string;
}

interface LahanFormProps {
  onLahanAddedOrUpdated: () => void;
  onCancel: () => void;
  lahanToEdit?: Lahan | null;
}

export function LahanForm({ onLahanAddedOrUpdated, onCancel, lahanToEdit }: LahanFormProps) {
  const [formData, setFormData] = useState<Lahan>({
    koperasi_id: 0,
    petani_id: 0,
    nama_lahan: '',
    lokasi: '',
    luas_hektar: 0,
    estimasi_jumlah_pohon: 0,
    jenis_kopi_dominan: '',
    status_lahan: 'Baru Ditanam',
    estimasi_panen_pertama: '',
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (lahanToEdit) {
      setFormData(lahanToEdit);
    }
  }, [lahanToEdit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nama_lahan || !formData.koperasi_id || !formData.petani_id) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const method = lahanToEdit ? 'put' : 'post';
      const url = lahanToEdit ? `/lahan/${lahanToEdit.lahan_id}` : '/lahan';
      
      await api[method](url, formData);

      toast({
        title: "Success",
        description: `Lahan ${lahanToEdit ? 'updated' : 'created'} successfully.`,
      });
      onLahanAddedOrUpdated();
    } catch (err: unknown) {
      let errorMessage = `Failed to ${lahanToEdit ? 'update' : 'create'} lahan.`;
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
  }, [formData, lahanToEdit, toast, onLahanAddedOrUpdated]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nama_lahan" className="text-right">
            Nama Lahan
          </Label>
          <Input id="nama_lahan" value={formData.nama_lahan} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lokasi" className="text-right">
            Lokasi
          </Label>
          <Input id="lokasi" value={formData.lokasi} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="luas_hektar" className="text-right">
            Luas (ha)
          </Label>
          <Input id="luas_hektar" type="number" value={formData.luas_hektar} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="estimasi_jumlah_pohon" className="text-right">
            Estimasi Pohon
          </Label>
          <Input id="estimasi_jumlah_pohon" type="number" value={formData.estimasi_jumlah_pohon} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="jenis_kopi_dominan" className="text-right">
            Jenis Kopi
          </Label>
          <Input id="jenis_kopi_dominan" value={formData.jenis_kopi_dominan} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status_lahan" className="text-right">
            Status Lahan
          </Label>
          <Input id="status_lahan" value={formData.status_lahan} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="estimasi_panen_pertama" className="text-right">
            Estimasi Panen
          </Label>
          <Input id="estimasi_panen_pertama" type="date" value={formData.estimasi_panen_pertama} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="koperasi_id" className="text-right">
            Koperasi ID
          </Label>
          <Input id="koperasi_id" type="number" value={formData.koperasi_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="petani_id" className="text-right">
            Petani ID
          </Label>
          <Input id="petani_id" type="number" value={formData.petani_id} onChange={handleChange} className="col-span-3" />
        </div>
        {error && <p className="col-span-4 text-center text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{lahanToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
