import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

interface KoperasiRegistrationData {
  nama_koperasi: string;
  alamat: string;
  provinsi: string;
  kabupaten: string;
  kontak_person: string;
  nomor_telepon: string;
}

interface KoperasiRegistrationFormProps {
  onSuccess?: () => void;
}

export function KoperasiRegistrationForm({ onSuccess }: KoperasiRegistrationFormProps) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<KoperasiRegistrationData>();
  const { toast } = useToast();

  const onSubmit = async (data: KoperasiRegistrationData) => {
    try {
      const response = await api.post("/users/register-koperasi", data);
      
      toast({
        title: "Success",
        description: response.data.message,
      });

      // Call success callback to refresh user data
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      let errorMessage = "Gagal mendaftarkan koperasi.";
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
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-krem-muda p-4">
      <Card className="w-full max-w-2xl shadow-lg border border-neutral-200/80">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-aksen-oranye rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
          <CardTitle className="font-display text-3xl font-bold text-kopi-pekat">
            Daftarkan Koperasi Anda
          </CardTitle>
          <CardDescription className="text-kopi-pekat/70">
            Lengkapi data koperasi untuk melanjutkan menggunakan sistem
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 flex flex-col space-y-1.5">
                <Label htmlFor="nama_koperasi" className="text-kopi-pekat">Nama Koperasi</Label>
                <Input
                  id="nama_koperasi"
                  placeholder="Contoh: Koperasi Kopi Sumber Daya Alam"
                  {...register("nama_koperasi", { required: "Nama koperasi wajib diisi." })}
                  className="coffee-input"
                />
                {errors.nama_koperasi && <p className="text-red-700 text-sm mt-1">{errors.nama_koperasi.message}</p>}
              </div>

              <div className="md:col-span-2 flex flex-col space-y-1.5">
                <Label htmlFor="alamat" className="text-kopi-pekat">Alamat Lengkap</Label>
                <Input
                  id="alamat"
                  placeholder="Jalan, Desa/Kelurahan, Kecamatan"
                  {...register("alamat", { required: "Alamat wajib diisi." })}
                  className="coffee-input"
                />
                {errors.alamat && <p className="text-red-700 text-sm mt-1">{errors.alamat.message}</p>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="provinsi" className="text-kopi-pekat">Provinsi</Label>
                <Input
                  id="provinsi"
                  placeholder="Contoh: Jawa Timur"
                  {...register("provinsi", { required: "Provinsi wajib diisi." })}
                  className="coffee-input"
                />
                {errors.provinsi && <p className="text-red-700 text-sm mt-1">{errors.provinsi.message}</p>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="kabupaten" className="text-kopi-pekat">Kabupaten/Kota</Label>
                <Input
                  id="kabupaten"
                  placeholder="Contoh: Sidoarjo"
                  {...register("kabupaten", { required: "Kabupaten wajib diisi." })}
                  className="coffee-input"
                />
                {errors.kabupaten && <p className="text-red-700 text-sm mt-1">{errors.kabupaten.message}</p>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="kontak_person" className="text-kopi-pekat">Penanggung Jawab</Label>
                <Input
                  id="kontak_person"
                  placeholder="Nama lengkap penanggung jawab"
                  {...register("kontak_person", { required: "Penanggung jawab wajib diisi." })}
                  className="coffee-input"
                />
                {errors.kontak_person && <p className="text-red-700 text-sm mt-1">{errors.kontak_person.message}</p>}
              </div>

              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="nomor_telepon" className="text-kopi-pekat">Nomor Telepon</Label>
                <Input
                  id="nomor_telepon"
                  placeholder="08xxxxxxxxx"
                  {...register("nomor_telepon", { required: "Nomor telepon wajib diisi." })}
                  className="coffee-input"
                />
                {errors.nomor_telepon && <p className="text-red-700 text-sm mt-1">{errors.nomor_telepon.message}</p>}
              </div>
            </div>

            <div className="pt-4">
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-aksen-oranye text-white hover:bg-aksen-oranye/90 font-semibold py-3"
              >
                {isSubmitting ? 'Mendaftarkan...' : 'Daftarkan Koperasi'}
              </Button>
            </div>
          </form>
        </CardContent>

        <CardFooter className="text-center text-kopi-pekat/60 text-sm justify-center">
          Setelah koperasi terdaftar, Anda akan menjadi Admin Koperasi dan dapat mengelola semua data koperasi
        </CardFooter>
      </Card>
    </div>
  );
}