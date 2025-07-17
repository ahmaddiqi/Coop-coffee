import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface Aktivitas {
  aktivitas_id?: number;
  lahan_id: number;
  jenis_aktivitas: string;
  tanggal_aktivitas: string;
  tanggal_estimasi?: string;
  jumlah_estimasi_kg?: number;
  jumlah_aktual_kg?: number;
  jenis_bibit?: string;
  status: string;
  keterangan?: string;
  created_from: string;
}

interface AktivitasFormProps {
  onAktivitasAddedOrUpdated: () => void;
  onCancel: () => void;
  aktivitasToEdit?: Aktivitas | null;
}

export function AktivitasForm({ onAktivitasAddedOrUpdated, onCancel, aktivitasToEdit }: AktivitasFormProps) {
  const [formData, setFormData] = useState<Aktivitas>({
    lahan_id: 0,
    jenis_aktivitas: 'TANAM',
    tanggal_aktivitas: '',
    status: 'TERJADWAL',
    created_from: 'MANUAL',
  });
  const [error, setError] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (aktivitasToEdit) {
      setFormData(aktivitasToEdit);
    }
  }, [aktivitasToEdit]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSelectChange = useCallback((id: string, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }, []);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.lahan_id || !formData.jenis_aktivitas || !formData.tanggal_aktivitas || !formData.status) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      const method = aktivitasToEdit ? 'put' : 'post';
      const url = aktivitasToEdit ? `/aktivitas/${aktivitasToEdit.aktivitas_id}` : '/aktivitas';
      
      await api[method](url, formData);

      toast({
        title: "Success",
        description: `Aktivitas ${aktivitasToEdit ? 'updated' : 'created'} successfully.`,
      });
      onAktivitasAddedOrUpdated();
    } catch (err: unknown) {
      let errorMessage = `Failed to ${aktivitasToEdit ? 'update' : 'create'} aktivitas.`;
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
  }, [formData, aktivitasToEdit, toast, onAktivitasAddedOrUpdated]);

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="lahan_id" className="text-right">
            Lahan ID
          </Label>
          <Input id="lahan_id" type="number" value={formData.lahan_id} onChange={handleChange} className="col-span-3" />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="jenis_aktivitas" className="text-right">
            Jenis Aktivitas
          </Label>
          <Select value={formData.jenis_aktivitas} onValueChange={(value) => handleSelectChange("jenis_aktivitas", value)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TANAM">Tanam</SelectItem>
              <SelectItem value="PANEN">Panen</SelectItem>
              <SelectItem value="ESTIMASI_PANEN">Estimasi Panen</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="tanggal_aktivitas" className="text-right">
            Tanggal Aktivitas
          </Label>
          <Input id="tanggal_aktivitas" type="date" value={formData.tanggal_aktivitas} onChange={handleChange} className="col-span-3" />
        </div>
        {formData.jenis_aktivitas === 'ESTIMASI_PANEN' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tanggal_estimasi" className="text-right">
              Tanggal Estimasi
            </Label>
            <Input id="tanggal_estimasi" type="date" value={formData.tanggal_estimasi} onChange={handleChange} className="col-span-3" />
          </div>
        )}
        {(formData.jenis_aktivitas === 'PANEN' || formData.jenis_aktivitas === 'ESTIMASI_PANEN') && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jumlah_estimasi_kg" className="text-right">
              Jumlah Estimasi (kg)
            </Label>
            <Input id="jumlah_estimasi_kg" type="number" value={formData.jumlah_estimasi_kg} onChange={handleChange} className="col-span-3" />
          </div>
        )}
        {formData.jenis_aktivitas === 'PANEN' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jumlah_aktual_kg" className="text-right">
              Jumlah Aktual (kg)
            </Label>
            <Input id="jumlah_aktual_kg" type="number" value={formData.jumlah_aktual_kg} onChange={handleChange} className="col-span-3" />
          </div>
        )}
        {formData.jenis_aktivitas === 'TANAM' && (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="jenis_bibit" className="text-right">
              Jenis Bibit
            </Label>
            <Input id="jenis_bibit" value={formData.jenis_bibit} onChange={handleChange} className="col-span-3" />
          </div>
        )}
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="status" className="text-right">
            Status
          </Label>
          <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TERJADWAL">Terjadwal</SelectItem>
              <SelectItem value="SELESAI">Selesai</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="keterangan" className="text-right">
            Keterangan
          </Label>
          <Input id="keterangan" value={formData.keterangan} onChange={handleChange} className="col-span-3" />
        </div>
        {error && <p className="col-span-4 text-center text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">{aktivitasToEdit ? 'Update' : 'Create'}</Button>
      </div>
    </form>
  );
}
