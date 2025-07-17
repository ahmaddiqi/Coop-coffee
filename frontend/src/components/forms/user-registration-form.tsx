import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";

interface RegistrationFormData {
  username: string;
  password: string;
  confirmPassword: string;
  nama_lengkap: string;
  email: string;
}

export function UserRegistrationForm() {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegistrationFormData>();
  const { toast } = useToast();

  const onSubmit = async (data: RegistrationFormData) => {
    console.log('🔥 Registration form onSubmit called with data:', data);
    
    if (data.password !== data.confirmPassword) {
      console.log('❌ Password mismatch detected');
      toast({
        title: "Error",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      return;
    }
    
    console.log('✅ Password validation passed');
    
    try {
      console.log('📡 About to make API call to /users/register');
      console.log('📝 Request payload:', {
        username: data.username,
        password: data.password,
        nama_lengkap: data.nama_lengkap,
        email: data.email,
      });
      
      const response = await api.post("/users/register", {
        username: data.username,
        password: data.password,
        nama_lengkap: data.nama_lengkap,
        email: data.email,
      });
      
      console.log('🎉 API call successful, response:', response);
      toast({
        title: "Success",
        description: response.data.message,
      });
      
      // Reset form after successful registration
      reset();
      
      // If registration successful, show message about next step
      if (response.data.needs_koperasi_registration) {
        setTimeout(() => {
          toast({
            title: "Info",
            description: "Setelah login, Anda akan diminta untuk mendaftarkan koperasi Anda.",
          });
        }, 2000);
      }
    } catch (error: unknown) {
      console.log('💥 API call failed with error:', error);
      
      let errorMessage = "Registration failed.";
      
      // Handle axios error response
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const axiosError = error as any;
        console.log('🔍 Axios error details:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
          config: axiosError.config
        });
        
        if (axiosError.response?.data?.message) {
          errorMessage = axiosError.response.data.message;
        } else if (axiosError.response?.data?.errors) {
          // Handle validation errors
          const validationErrors = axiosError.response.data.errors;
          errorMessage = validationErrors.map((err: any) => err.msg).join(', ');
        }
      } else if (error instanceof Error) {
        console.log('🔍 Error instance details:', {
          name: error.name,
          message: error.message,
          stack: error.stack
        });
        errorMessage = error.message;
      } else {
        console.log('🔍 Unknown error type:', typeof error, error);
      }
      
      console.log('📢 Showing error toast:', errorMessage);
      
      toast({
        title: "Registration Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid w-full items-center gap-4">
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="nama-lengkap" className="text-foreground">Full Name</Label>
          <Input
            id="nama-lengkap"
            placeholder="Enter your full name"
            {...register("nama_lengkap", { required: "Full name is required." })}
            className="bg-input text-foreground placeholder:text-muted-foreground"
          />
          {errors.nama_lengkap && <p className="text-destructive-foreground text-sm mt-1">{errors.nama_lengkap.message as string}</p>}
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="email" className="text-foreground">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            {...register("email", { required: "Email is required." })}
            className="bg-input text-foreground placeholder:text-muted-foreground"
          />
          {errors.email && <p className="text-destructive-foreground text-sm mt-1">{errors.email.message as string}</p>}
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="username" className="text-foreground">Username</Label>
          <Input
            id="username"
            placeholder="Enter your username"
            {...register("username", { required: "Username is required." })}
            className="bg-input text-foreground placeholder:text-muted-foreground"
          />
          {errors.username && <p className="text-destructive-foreground text-sm mt-1">{errors.username.message as string}</p>}
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="password" className="text-foreground">Password</Label>
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            {...register("password", { required: "Password is required.", minLength: { value: 6, message: "Password must be at least 6 characters." } })}
            className="bg-input text-foreground placeholder:text-muted-foreground"
          />
          {errors.password && <p className="text-destructive-foreground text-sm mt-1">{errors.password.message as string}</p>}
        </div>
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="confirm-password" className="text-foreground">Confirm Password</Label>
          <Input
            id="confirm-password"
            type="password"
            placeholder="Confirm your password"
            {...register("confirmPassword", { required: "Please confirm your password." })}
            className="bg-input text-foreground placeholder:text-muted-foreground"
          />
          {errors.confirmPassword && <p className="text-destructive-foreground text-sm mt-1">{errors.confirmPassword.message as string}</p>}
        </div>
        <Button 
          type="submit" 
          className="w-full"
          onClick={() => console.log('🖱️ Register button clicked')}
        >
          Register
        </Button>
      </div>
    </form>
  );
}