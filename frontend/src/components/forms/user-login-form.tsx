import { useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import api from "@/lib/axios";
import { useNavigate } from 'react-router-dom';
import { useToast } from "@/components/ui/use-toast";
import { showErrorToast, showSuccessToast, handleLoginError } from '@/utils/errorHandler';

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginResponseData {
  token: string;
  user_id: string;
  username: string;
  role: string;
}

interface UserLoginFormProps {
  onLoginSuccess?: () => Promise<void>;
}

export function UserLoginForm({ onLoginSuccess }: UserLoginFormProps) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const onSubmit = async (data: LoginFormData) => {
    console.log('Form submitted with data:', data);
    setIsLoading(true);
    try {
      console.log('Sending login request...');
      const response = await api.post<LoginResponseData>("/users/login", {
        username: data.username,
        password: data.password,
      });
      console.log('Login response received:', response.data);
      
      // Store JWT and user info
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user_id", response.data.user_id);
      localStorage.setItem("username", response.data.username);
      localStorage.setItem("role", response.data.role);

      showSuccessToast(toast, "Login berhasil!", "Selamat datang");

      // Call the callback to update parent state
      if (onLoginSuccess) {
        await onLoginSuccess();
      }

      // Let the parent component handle navigation based on koperasi status
      // Don't navigate directly to dashboard here

    } catch (error: unknown) {
      showErrorToast(toast, error, 'login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid w-full items-center gap-4">
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
            {...register("password", { required: "Password is required." })}
            className="bg-input text-foreground placeholder:text-muted-foreground"
          />
          {errors.password && <p className="text-destructive-foreground text-sm mt-1">{errors.password.message as string}</p>}
        </div>
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
          onClick={() => console.log('Login button clicked')}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>
      </div>
    </form>
  );
}