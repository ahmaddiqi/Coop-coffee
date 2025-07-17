import { useState, useEffect, useMemo, useCallback } from 'react';
import api from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { TransaksiInventoryForm } from './forms/transaksi-inventory-form';

interface TransaksiInventory {
  transaksi_id: number;
  inventory_id: number;
  koperasi_id: number;
  tipe_transaksi: string;
  jenis_operasi: string;
  tanggal: string;
  jumlah: number;
  petani_id?: number;
  lahan_id?: number;
  buyer?: string;
  harga_total?: number;
  keterangan?: string;
  referensi_pasarmikro?: string;
}

const ROWS_PER_PAGE = 10;

const TransaksiInventoryManagement = () => {
  const [transaksiList, setTransaksiList] = useState<TransaksiInventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [transaksiToEdit, setTransaksiToEdit] = useState<TransaksiInventory | null>(null);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<(() => void) | null>(null);
  const [confirmDialogTitle, setConfirmDialogTitle] = useState('');
  const [confirmDialogDescription, setConfirmDialogDescription] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();

  const fetchTransaksi = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/transaksi-inventory', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setTransaksiList(response.data);
    } catch (err: unknown) {
      let errorMessage = 'Failed to fetch transaksi inventory data.';
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

  useEffect(() => {
    fetchTransaksi();
  }, [fetchTransaksi]);

  const filteredTransaksi = useMemo(() => {
    if (!searchTerm) {
      return transaksiList;
    }
    return transaksiList.filter(
      (transaksi) =>
        transaksi.tipe_transaksi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaksi.jenis_operasi.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaksi.buyer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaksi.keterangan?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transaksiList, searchTerm]);

  const paginatedTransaksi = useMemo(() => {
    const startIndex = (currentPage - 1) * ROWS_PER_PAGE;
    return filteredTransaksi.slice(startIndex, startIndex + ROWS_PER_PAGE);
  }, [filteredTransaksi, currentPage]);

  const totalPages = Math.ceil(filteredTransaksi.length / ROWS_PER_PAGE);

  const handleAdd = () => {
    setTransaksiToEdit(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaksi: TransaksiInventory) => {
    setTransaksiToEdit(transaksi);
    setIsFormOpen(true);
  };

  const handleDelete = (transaksiId: number) => {
    openConfirmationDialog(
      'Confirm Deletion',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          await api.delete(`/transaksi-inventory/${transaksiId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          toast({
            title: "Success",
            description: "Transaksi Inventory deleted successfully.",
          });
          fetchTransaksi();
        } catch (err: unknown) {
          let errorMessage = 'Failed to delete transaksi inventory.';
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
    return <div className="p-4 text-foreground">Loading Transaksi Inventory...</div>;
  }

  if (error) {
    return <div className="p-4 text-destructive-foreground">Error: {error}</div>;
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Transaksi Inventory Management</h2>
          <p className="text-muted-foreground">Manage transaksi inventory data here.</p>
        </div>
        <Button onClick={handleAdd}>Add Transaksi Inventory</Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search by type, operation, buyer, or notes..."
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
              <TableHead>Tipe Transaksi</TableHead>
              <TableHead>Jenis Operasi</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jumlah</TableHead>
              <TableHead>Buyer</TableHead>
              <TableHead>Harga Total</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransaksi.map((transaksi) => (
              <TableRow key={transaksi.transaksi_id}>
                <TableCell>{transaksi.tipe_transaksi}</TableCell>
                <TableCell>{transaksi.jenis_operasi}</TableCell>
                <TableCell>{new Date(transaksi.tanggal).toLocaleDateString()}</TableCell>
                <TableCell>{transaksi.jumlah}</TableCell>
                <TableCell>{transaksi.buyer}</TableCell>
                <TableCell>{transaksi.harga_total}</TableCell>
                <TableCell className="space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(transaksi)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(transaksi.transaksi_id)}>Delete</Button>
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
            <DialogTitle>{transaksiToEdit ? 'Edit Transaksi Inventory' : 'Add Transaksi Inventory'}</DialogTitle>
          </DialogHeader>
          <TransaksiInventoryForm
            onTransaksiAddedOrUpdated={() => {
              setIsFormOpen(false);
              fetchTransaksi();
            }}
            onCancel={() => setIsFormOpen(false)}
            transaksiToEdit={transaksiToEdit}
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

export default TransaksiInventoryManagement;
