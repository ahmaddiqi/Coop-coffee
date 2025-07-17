import { useState, useMemo, useCallback } from 'react';
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { AktivitasForm } from './forms/aktivitas-form';

interface Aktivitas {
  aktivitas_id: number;
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

const ROWS_PER_PAGE = 10;

const AktivitasManagement = () => {
  const [aktivitasList, setAktivitasList] = useState<Aktivitas[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [aktivitasToEdit, setAktivitasToEdit] = useState<Aktivitas | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(null);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogDescription, setConfirmDialogDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchAktivitas = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/aktivitas');
      setAktivitasList(response.data);
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch aktivitas data.';
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
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filteredAktivitas = useMemo(() => {
    if (!searchTerm) {
      return aktivitasList;
    }
    return aktivitasList.filter(
      (aktivitas) =>
        aktivitas.jenis_aktivitas.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aktivitas.status.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [aktivitasList, searchTerm]);

  const paginatedAktivitas = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredAktivitas.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredAktivitas, currentPage]);

  const totalPages = Math.ceil(filteredAktivitas.length / ROWS_PER_PAGE);

  const handleAdd = () => {
    setAktivitasToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (aktivitas: Aktivitas) => {
    setAktivitasToEdit(aktivitas);
    setIsFormOpen(true);
  };

  const handleDelete = (aktivitasId: number) => {
    openConfirmationDialog(
      'Confirm Deletion',
      'Are you sure you want to delete this aktivitas? This action cannot be undone.',
      async () => {
        try {
          await api.delete(`/aktivitas/${aktivitasId}`);
          toast({
            title: "Success",
            description: "Aktivitas deleted successfully.",
          });
          fetchAktivitas();
        } catch (err: unknown) {
          let errorMessage = 'Failed to delete aktivitas.';
          if (err instanceof Error) {
            errorMessage = err.message;
          } else if (typeof err === 'object' && err !== null && 'response' in err && typeof err.response === 'object' && err.response !== null && 'data' in err.response && typeof err.response.data === 'object' && err.response.data !== null && 'message' in err.response.data) {
            errorMessage = (err.response.data as { message: string }).message;
          }
          toast({
            title: "Error",
            description: errorMessage,
            variant: "destructive",
          });
        }
      }
    );
  };

  const openConfirmationDialog = (title: string, description: string, onConfirm: () => void) => {
    setConfirmDialogTitle(title);
    setConfirmDialogDescription(description);
    setActionToConfirm(() => onConfirm);
    setIsConfirmDialogOpen(true);
  };

  const handleConfirm = () => {
    if (actionToConfirm) {
      actionToConfirm();
    }
    setIsConfirmDialogOpen(false);
    setActionToConfirm(null);
  };

  if (loading) {
    return <div className="p-4 text-foreground">Loading Aktivitas...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive-foreground">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Aktivitas Budidaya Management</h2>
          <p className="text-muted-foreground">Manage aktivitas budidaya data here.</p>
        </div>
        <Button onClick={handleAdd}>Add Aktivitas</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by activity type or status..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Jenis Aktivitas</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Lahan ID</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAktivitas.map((aktivitas) => (
              <TableRow key={aktivitas.aktivitas_id}>
                <TableCell>{aktivitas.jenis_aktivitas}</TableCell>
                <TableCell>{new Date(aktivitas.tanggal_aktivitas).toLocaleDateString()}</TableCell>
                <TableCell>{aktivitas.status}</TableCell>
                <TableCell>{aktivitas.lahan_id}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(aktivitas)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(aktivitas.aktivitas_id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          Previous
        </Button>
        <span className="text-sm">
          Page {currentPage} of {totalPages}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next
        </Button>
      </div>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{aktivitasToEdit ? 'Edit Aktivitas' : 'Add Aktivitas'}</DialogTitle>
          </DialogHeader>
          <AktivitasForm
            onAktivitasAddedOrUpdated={() => {
              setIsFormOpen(false);
              fetchAktivitas();
            }}
            onCancel={() => setIsFormOpen(false)}
            aktivitasToEdit={aktivitasToEdit}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{confirmDialogTitle}</DialogTitle>
            <DialogDescription>
              {confirmDialogDescription}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirm}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AktivitasManagement;
