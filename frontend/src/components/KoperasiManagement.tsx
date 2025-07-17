import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from 'react-hook-form';

interface KoperasiData {
  koperasi_id: number;
  nama_koperasi: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kontak_person: string;
  nomor_telepon: string;
}

function KoperasiManagement() {
  const [koperasiData, setKoperasiData] = useState<KoperasiData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue, reset } = useForm();

  const fetchKoperasiData = useCallback(async () => {
    try {
      setLoading(true);
      // Get current user's koperasi data
      const userResponse = await api.get('/users/me');
      const koperasiId = userResponse.data.koperasi_id;
      
      if (!koperasiId) {
        throw new Error('User belum terdaftar di koperasi');
      }

      const response = await api.get(`/koperasi/${koperasiId}`);
      setKoperasiData(response.data);
      
      // Set form values
      reset({
        nama_koperasi: response.data.nama_koperasi,
        alamat: response.data.alamat,
        provinsi: response.data.provinsi,
        kabupaten: response.data.kabupaten,
        kontak_person: response.data.kontak_person,
        nomor_telepon: response.data.nomor_telepon
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch koperasi data.";
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
    } finally {
      setLoading(false);
    }
  }, [toast, reset]);


  const onUpdateKoperasiSubmit = useCallback(async (data: any) => {
    try {
      if (!koperasiData) return;
      
      const response = await api.put(`/koperasi/${koperasiData.koperasi_id}`, data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchKoperasiData();
    } catch (error: unknown) {
      let errorMessage = "Failed to update koperasi.";
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
  }, [koperasiData, fetchKoperasiData, toast]);

  useEffect(() => {
    fetchKoperasiData();
  }, [fetchKoperasiData]);


  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-orange-100 rounded w-1/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-orange-100 rounded"></div>
              <div className="h-4 bg-orange-100 rounded w-5/6"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!koperasiData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-kopi-pekat/70">Data koperasi tidak ditemukan</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengaturan Koperasi</CardTitle>
        <p className="text-sm text-kopi-pekat/80">
          Edit informasi data koperasi Anda
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onUpdateKoperasiSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="nama_koperasi">Nama Koperasi</Label>
              <Input 
                id="nama_koperasi" 
                placeholder="Masukkan nama koperasi" 
                {...register("nama_koperasi", { required: "Nama koperasi wajib diisi" })} 
              />
              {errors.nama_koperasi && (
                <p className="text-sm text-red-700">{errors.nama_koperasi.message as string}</p>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="kontak_person">Kontak Person</Label>
              <Input 
                id="kontak_person" 
                placeholder="Nama penanggung jawab" 
                {...register("kontak_person", { required: "Kontak person wajib diisi" })} 
              />
              {errors.kontak_person && (
                <p className="text-sm text-red-700">{errors.kontak_person.message as string}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="alamat">Alamat Lengkap</Label>
            <Input 
              id="alamat" 
              placeholder="Masukkan alamat lengkap" 
              {...register("alamat", { required: "Alamat wajib diisi" })} 
            />
            {errors.alamat && (
              <p className="text-sm text-red-700">{errors.alamat.message as string}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col space-y-2">
              <Label htmlFor="provinsi">Provinsi</Label>
              <Input 
                id="provinsi" 
                placeholder="Masukkan provinsi" 
                {...register("provinsi", { required: "Provinsi wajib diisi" })} 
              />
              {errors.provinsi && (
                <p className="text-sm text-red-700">{errors.provinsi.message as string}</p>
              )}
            </div>
            
            <div className="flex flex-col space-y-2">
              <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
              <Input 
                id="kabupaten" 
                placeholder="Masukkan kabupaten/kota" 
                {...register("kabupaten", { required: "Kabupaten wajib diisi" })} 
              />
              {errors.kabupaten && (
                <p className="text-sm text-red-700">{errors.kabupaten.message as string}</p>
              )}
            </div>
          </div>

          <div className="flex flex-col space-y-2">
            <Label htmlFor="nomor_telepon">Nomor Telepon</Label>
            <Input 
              id="nomor_telepon" 
              placeholder="Masukkan nomor telepon" 
              {...register("nomor_telepon", { required: "Nomor telepon wajib diisi" })} 
            />
            {errors.nomor_telepon && (
              <p className="text-sm text-red-700">{errors.nomor_telepon.message as string}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => reset()}>
              Reset
            </Button>
            <Button type="submit">
              Simpan Perubahan
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default KoperasiManagement;