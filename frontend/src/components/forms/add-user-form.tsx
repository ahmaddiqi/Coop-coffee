
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import api from "@/lib/axios";

interface AddUserFormProps {
  onUserAdded: () => void;
  onCancel: () => void;
}

export function AddUserForm({ onUserAdded, onCancel }: AddUserFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [namaLengkap, setNamaLengkap] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [error, setError] = useState("");
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username || !password || !namaLengkap || !email) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await api.post(
        "/users",
        {
          username,
          password,
          nama_lengkap: namaLengkap,
          email,
          role,
        }
      );
      toast({
        title: "Success",
        description: "User created successfully.",
      });
      onUserAdded();
    } catch (err: unknown) {
      let errorMessage = "Failed to create user.";
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
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="nama-lengkap" className="text-right">
            Full Name
          </Label>
          <Input
            id="nama-lengkap"
            value={namaLengkap}
            onChange={(e) => setNamaLengkap(e.target.value)}
            className="col-span-3"
            placeholder="User's full name"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="email" className="text-right">
            Email
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="col-span-3"
            placeholder="User's email address"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="username" className="text-right">
            Username
          </Label>
          <Input
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="col-span-3"
            placeholder="Login username"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="password" className="text-right">
            Password
          </Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="col-span-3"
            placeholder="A strong password"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="role" className="text-right">
            Role
          </Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPERATOR">Operator</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {error && <p className="col-span-4 text-center text-sm text-red-700">{error}</p>}
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create User</Button>
      </div>
    </form>
  );
}
