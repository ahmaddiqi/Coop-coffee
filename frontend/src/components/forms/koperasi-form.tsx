import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface Koperasi {
  koperasi_id?: number;
  nama_koperasi: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kontak_person: string;
  nomor_telepon: string;
}

interface KoperasiFormProps {
  onKoperasiAddedOrUpdated: () => void;
  onCancel: () => void;
  koperasiToEdit?: Koperasi | null;
}

export function KoperasiForm({ onKoperasiAddedOrUpdated, onCancel, koperasiToEdit }: KoperasiFormProps) {
  const [formData, setFormData] = useState<Koperasi>({
    nama_koperasi: '',
    alamat: '',
    provinsi: '',
    kabupaten: '',
    kontak_person: '',
    nomor_telepon: '',
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (koperasiToEdit) {
      setFormData(koperasiToEdit);
    }
  }, [koperasiToEdit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nama_koperasi || !formData.alamat || !formData.provinsi || !formData.kabupaten) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const method = koperasiToEdit ? 'put' : 'post';
      const url = koperasiToEdit ? `/koperasi/${koperasiToEdit.koperasi_id}` : '/koperasi';
      
      await api[method](url, formData);

      toast({
        title: "Success",
        description: `Koperasi ${koperasiToEdit ? 'updated' : 'created'} successfully.`,
      });
      onKoperasiAddedOrUpdated();
    } catch (err: unknown) {
      let errorMessage = `Failed to ${koperasiToEdit ? 'update' : 'create'} koperasi.`;
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
  }, [formData, onKoperasiAddedOrUpdated, koperasiToEdit, toast]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nama_koperasi" className="text-right">
            Nama Koperasi
          </Label>
          <Input id="nama_koperasi" value={formData.nama_koperasi} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="alamat" className="text-right">
            Alamat
          </Label>
          <Input id="alamat" value={formData.alamat} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="provinsi" className="text-right">
            Provinsi
          </Label>
          <Input id="provinsi" value={formData.provinsi} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="kabupaten" className="text-right">
            Kabupaten
          </Label>
          <Input id="kabupaten" value={formData.kabupaten} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="kontak_person" className="text-right">
            Kontak Person
          </Label>
          <Input id="kontak_person" value={formData.kontak_person} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nomor_telepon" className="text-right">
            Nomor Telepon
          </Label>
          <Input id="nomor_telepon" value={formData.nomor_telepon} onChange={handleChange} className="col-span-3" />
        </div>
        {error && <p className="col-span-4 text-center text-sm text-red-600">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{koperasiToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
