import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface Petani {
  petani_id?: number;
  koperasi_id: number;
  nama: string;
  kontak: string;
  alamat: string;
}

interface PetaniFormProps {
  onPetaniAddedOrUpdated: () => void;
  onCancel: () => void;
  petaniToEdit?: Petani | null;
}

export function PetaniForm({ onPetaniAddedOrUpdated, onCancel, petaniToEdit }: PetaniFormProps) {
  const [formData, setFormData] = useState<Petani>({
    koperasi_id: 0,
    nama: '',
    kontak: '',
    alamat: '',
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (petaniToEdit) {
      setFormData(petaniToEdit);
    }
  }, [petaniToEdit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.nama || !formData.koperasi_id) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const method = petaniToEdit ? 'put' : 'post';
      const url = petaniToEdit ? `/petani/${petaniToEdit.petani_id}` : '/petani';
      
      await api[method](url, formData);

      toast({
        title: "Success",
        description: `Petani ${petaniToEdit ? 'updated' : 'created'} successfully.`,
      });
      onPetaniAddedOrUpdated();
    } catch (err: unknown) {
      let errorMessage = `Failed to ${petaniToEdit ? 'update' : 'create'} petani.`;
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
  }, [formData, petaniToEdit, toast, onPetaniAddedOrUpdated]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nama" className="text-right">
            Nama
          </Label>
          <Input id="nama" value={formData.nama} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="kontak" className="text-right">
            Kontak
          </Label>
          <Input id="kontak" value={formData.kontak} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="alamat" className="text-right">
            Alamat
          </Label>
          <Input id="alamat" value={formData.alamat} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="koperasi_id" className="text-right">
            Koperasi ID
          </Label>
          <Input id="koperasi_id" type="number" value={formData.koperasi_id} onChange={handleChange} className="col-span-3" />
        </div>
        {error && <p className="col-span-4 text-center text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{petaniToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
