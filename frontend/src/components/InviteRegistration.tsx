import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from 'react-hook-form';

interface InviteInfo {
  valid: boolean;
  koperasi_name: string;
  expires_at: string;
}

export default function InviteRegistration() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors } } = useForm();

  useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        toast({
          title: "Error",
          description: "Link undangan tidak valid",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      try {
        const response = await api.get(`/users/validate-invite/${token}`);
        setInviteInfo(response.data);
      } catch (error: unknown) {
        let errorMessage = "Link undangan tidak valid atau sudah kedaluwarsa";
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
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    validateInvite();
  }, [token, navigate, toast]);

  const onSubmit = async (data: any) => {
    if (!token) return;

    try {
      setSubmitting(true);
      const response = await api.post(`/users/register-via-invite/${token}`, data);
      
      toast({
        title: "Success",
        description: response.data.message,
      });
      
      // Redirect to login page
      navigate('/', { state: { message: 'Pendaftaran berhasil! Silakan login.' } });
    } catch (error: unknown) {
      let errorMessage = "Gagal mendaftar melalui undangan";
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
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-krem-muda p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-orange-100 rounded w-3/4"></div>
              <div className="h-4 bg-orange-100 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteInfo?.valid) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-krem-muda p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <p className="text-red-700">Link undangan tidak valid atau sudah kedaluwarsa</p>
            <Button 
              onClick={() => navigate('/')} 
              className="mt-4"
            >
              Kembali ke Halaman Utama
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-krem-muda p-4">
      <Card className="w-full max-w-md shadow-lg border border-neutral-200/80">
        <CardHeader className="text-center space-y-4">
          <div className="w-16 h-16 bg-aksen-oranye rounded-2xl flex items-center justify-center mx-auto shadow-lg">
            <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12.378 1.602a.75.75 0 0 0-.756 0L3 6.632l9 5.25 9-5.25-8.622-5.03ZM21.75 7.933l-9 5.25v9l8.628-5.033a.75.75 0 0 0 .372-.648V7.933ZM2.25 7.933v6.99a.75.75 0 0 0 .372.648l8.628 5.033v-9l-9-5.25Z"/>
            </svg>
          </div>
          <CardTitle className="font-display text-3xl font-bold text-kopi-pekat">
            Bergabung dengan Koperasi
          </CardTitle>
          <div className="text-center">
            <p className="text-kopi-pekat font-medium">
              {inviteInfo.koperasi_name}
            </p>
            <p className="text-sm text-kopi-pekat/70">
              Anda diundang untuk bergabung dengan koperasi ini
            </p>
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nama_lengkap">Nama Lengkap</Label>
              <Input
                id="nama_lengkap"
                placeholder="Masukkan nama lengkap"
                {...register("nama_lengkap", { required: "Nama lengkap wajib diisi" })}
              />
              {errors.nama_lengkap && (
                <p className="text-sm text-red-700">{errors.nama_lengkap.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Masukkan email"
                {...register("email", { 
                  required: "Email wajib diisi",
                  pattern: {
                    value: /\S+@\S+\.\S+/,
                    message: "Format email tidak valid"
                  }
                })}
              />
              {errors.email && (
                <p className="text-sm text-red-700">{errors.email.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                placeholder="Masukkan username"
                {...register("username", { required: "Username wajib diisi" })}
              />
              {errors.username && (
                <p className="text-sm text-red-700">{errors.username.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Masukkan password"
                {...register("password", { 
                  required: "Password wajib diisi",
                  minLength: {
                    value: 6,
                    message: "Password minimal 6 karakter"
                  }
                })}
              />
              {errors.password && (
                <p className="text-sm text-red-700">{errors.password.message as string}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-aksen-oranye"
                {...register("role", { required: "Role wajib dipilih" })}
              >
                <option value="">Pilih Role</option>
                <option value="OPERATOR">OPERATOR</option>
                <option value="ADMIN">ADMIN</option>
              </select>
              {errors.role && (
                <p className="text-sm text-red-700">{errors.role.message as string}</p>
              )}
            </div>

            <Button 
              type="submit" 
              className="w-full bg-aksen-oranye hover:bg-aksen-oranye/90"
              disabled={submitting}
            >
              {submitting ? "Mendaftar..." : "Daftar"}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-kopi-pekat/60">
            <p>Sudah punya akun? {" "}
              <Button 
                variant="link"
                onClick={() => navigate('/')}
                className="text-aksen-oranye hover:underline h-auto p-0"
              >
                Login di sini
              </Button>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}