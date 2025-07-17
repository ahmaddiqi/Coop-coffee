import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import api from "@/lib/axios";
import { useToast } from "@/components/ui/use-toast";
import { useForm } from 'react-hook-form';

interface User {
  user_id: string;
  username: string;
  nama_lengkap: string;
  email: string;
  role: string;
  is_active: boolean;
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState<string>('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const { toast } = useToast();
  const { register, handleSubmit, formState: { errors }, setValue } = useForm();

  const fetchUsers = useCallback(async () => {
    try {
      const response = await api.get("/users");
      setUsers(response.data);
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch users.";
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
  }, [toast]);

  const onAddUserSubmit = useCallback(async (data: any) => {
    try {
      const response = await api.post("/users/create-for-koperasi", data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchUsers();
    } catch (error: unknown) {
      let errorMessage = "Failed to create user.";
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
  }, [fetchUsers, toast]);

  const onEditUserSubmit = useCallback(async (data: any) => {
    try {
      const response = await api.put(`/users/${selectedUser.user_id}`, data);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchUsers();
      setIsEditOpen(false);
    } catch (error: unknown) {
      let errorMessage = "Failed to update user.";
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
  }, [fetchUsers, selectedUser, toast]);

  const generateInviteLink = useCallback(async () => {
    try {
      const response = await api.post('/users/generate-invite');
      setInviteLink(response.data.invite_link);
      setIsInviteDialogOpen(true);
      toast({
        title: "Success",
        description: response.data.message,
      });
    } catch (error: unknown) {
      let errorMessage = "Failed to generate invite link.";
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
  }, [toast]);

  const copyInviteLink = useCallback(() => {
    navigator.clipboard.writeText(inviteLink);
    toast({
      title: "Copied!",
      description: "Link undangan berhasil disalin",
    });
  }, [inviteLink, toast]);

  const onDeleteUser = useCallback(async (userId: string) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      toast({
        title: "Success",
        description: response.data.message,
      });
      fetchUsers();
    } catch (error: unknown) {
      let errorMessage = "Failed to delete user.";
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
  }, [fetchUsers, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const openEditDialog = (user: any) => {
    setSelectedUser(user);
    setValue("nama_lengkap", user.nama_lengkap);
    setValue("email", user.email);
    setValue("username", user.username);
    setValue("role", user.role);
    setIsEditOpen(true);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Management</CardTitle>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateInviteLink}>
            Generate Link Undangan
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Tambah User Koperasi</Button>
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah User Baru untuk Koperasi</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddUserSubmit)}>
              <div className="grid w-full items-center gap-4">
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="nama-lengkap">Full Name</Label>
                  <Input id="nama-lengkap" placeholder="Enter full name" {...register("nama_lengkap", { required: true })} />
                  {errors.nama_lengkap && <p className="text-red-700">Full name is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" placeholder="Enter email" {...register("email", { required: true })} />
                  {errors.email && <p className="text-red-700">Email is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="username">Username</Label>
                  <Input id="username" placeholder="Enter username" {...register("username", { required: true })} />
                  {errors.username && <p className="text-red-700">Username is required.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" placeholder="Enter password" {...register("password", { required: true, minLength: 6 })} />
                  {errors.password && <p className="text-red-700">Password is required and must be at least 6 characters.</p>}
                </div>
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="role">Role</Label>
                  <select id="role" {...register("role", { required: true })}>
                    <option value="OPERATOR">OPERATOR</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  {errors.role && <p className="text-red-700">Role is required.</p>}
                </div>
                <Button type="submit">Add User</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Username</TableHead>
              <TableHead>Full Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Active</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user: User) => (
              <TableRow key={user.user_id}>
                <TableCell>{user.username}</TableCell>
                <TableCell>{user.nama_lengkap}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{user.role}</TableCell>
                <TableCell>{user.is_active ? 'Yes' : 'No'}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" className="mr-2" onClick={() => openEditDialog(user)}>Edit</Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">Delete</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently delete the user.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteUser(user.user_id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onEditUserSubmit)}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-nama-lengkap">Full Name</Label>
                <Input id="edit-nama-lengkap" placeholder="Enter full name" {...register("nama_lengkap", { required: true })} />
                {errors.nama_lengkap && <p className="text-red-700">Full name is required.</p>}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-email">Email</Label>
                <Input id="edit-email" type="email" placeholder="Enter email" {...register("email", { required: true })} />
                {errors.email && <p className="text-red-700">Email is required.</p>}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-username">Username</Label>
                <Input id="edit-username" placeholder="Enter username" {...register("username", { required: true })} />
                {errors.username && <p className="text-red-700">Username is required.</p>}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="edit-role">Role</Label>
                <select id="edit-role" {...register("role", { required: true })}>
                  <option value="OPERATOR">OPERATOR</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN</option>
                </select>
                {errors.role && <p className="text-red-700">Role is required.</p>}
              </div>
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invite Link Dialog */}
      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link Undangan Koperasi</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Link Undangan</Label>
              <div className="flex gap-2">
                <Input 
                  value={inviteLink} 
                  readOnly 
                  className="flex-1" 
                />
                <Button onClick={copyInviteLink} variant="outline">
                  Copy
                </Button>
              </div>
            </div>
            <div className="text-sm text-kopi-pekat/70">
              <p>• Link ini akan berlaku selama 7 hari</p>
              <p>• User yang mendaftar akan otomatis tergabung ke koperasi Anda</p>
              <p>• Bagikan link ini kepada calon anggota koperasi</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default UserManagement;