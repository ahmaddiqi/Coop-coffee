import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import api from '@/lib/axios';

interface QualityCheckpoint {
  checkpoint_id: number;
  inventory_id: number;
  checkpoint_type: string;
  checkpoint_name: string;
  checkpoint_date: string;
  quality_score: number;
  status: string;
  test_results?: Record<string, any> | null | undefined;
  defects_found?: string[];
  recommendations?: string;
  notes?: string;
  inspector_name?: string;
  nama_item?: string;
  batch_id?: string;
  nama_koperasi?: string;
}

interface CheckpointForm {
  inventory_id: string;
  checkpoint_type: string;
  checkpoint_name: string;
  checkpoint_date: string;
  quality_score: string;
  status: string;
  test_results: string;
  defects_found: string;
  recommendations: string;
  notes: string;
}

const CHECKPOINT_TYPES = [
  { value: 'HARVEST', label: 'Harvest Quality Check' },
  { value: 'PROCESSING', label: 'Processing Quality Check' },
  { value: 'STORAGE', label: 'Storage Quality Check' },
  { value: 'TRANSPORT', label: 'Transport Quality Check' },
  { value: 'DELIVERY', label: 'Delivery Quality Check' }
];

const QualityControlManagement: React.FC = () => {
  const [checkpoints, setCheckpoints] = useState<QualityCheckpoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchBatchId, setSearchBatchId] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState<QualityCheckpoint | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<CheckpointForm>({
    inventory_id: '',
    checkpoint_type: '',
    checkpoint_name: '',
    checkpoint_date: new Date().toISOString().split('T')[0],
    quality_score: '',
    status: '',
    test_results: '',
    defects_found: '',
    recommendations: '',
    notes: ''
  });

  const fetchCheckpointsByBatch = useCallback(async (batchId: string) => {
    if (!batchId.trim()) {
      setCheckpoints([]);
      return;
    }

    try {
      setLoading(true);
      const response = await api.get(`/quality/checkpoints/batch/${batchId}`);
      setCheckpoints(response.data.checkpoints || []);
      
      if (response.data.checkpoints.length === 0) {
        toast({
          title: "No checkpoints found",
          description: `No quality checkpoints found for batch ${batchId}`,
          variant: "default",
        });
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to fetch quality checkpoints";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        errorMessage = (error as any).response?.data?.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      setCheckpoints([]);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleSearch = () => {
    fetchCheckpointsByBatch(searchBatchId);
  };

  const resetForm = () => {
    setFormData({
      inventory_id: '',
      checkpoint_type: '',
      checkpoint_name: '',
      checkpoint_date: new Date().toISOString().split('T')[0],
      quality_score: '',
      status: '',
      test_results: '',
      defects_found: '',
      recommendations: '',
      notes: ''
    });
    setEditingCheckpoint(null);
  };

  const handleInputChange = (field: keyof CheckpointForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        inventory_id: parseInt(formData.inventory_id),
        quality_score: parseFloat(formData.quality_score),
        test_results: formData.test_results ? JSON.parse(formData.test_results) : null,
        defects_found: formData.defects_found ? formData.defects_found.split(',').map(d => d.trim()) : []
      };

      if (editingCheckpoint) {
        await api.put(`/quality/checkpoints/${editingCheckpoint.checkpoint_id}`, submitData);
        toast({
          title: "Success",
          description: "Quality checkpoint updated successfully",
        });
      } else {
        await api.post('/quality/checkpoints', submitData);
        toast({
          title: "Success",
          description: "Quality checkpoint created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      
      // Refresh checkpoints if we have a batch ID
      if (searchBatchId) {
        fetchCheckpointsByBatch(searchBatchId);
      }
    } catch (error: unknown) {
      let errorMessage = "Failed to save quality checkpoint";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        errorMessage = (error.response as any).data?.message || errorMessage;
      }
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (checkpoint: QualityCheckpoint) => {
    setEditingCheckpoint(checkpoint);
    setFormData({
      inventory_id: checkpoint.inventory_id.toString(),
      checkpoint_type: checkpoint.checkpoint_type,
      checkpoint_name: checkpoint.checkpoint_name,
      checkpoint_date: checkpoint.checkpoint_date,
      quality_score: checkpoint.quality_score.toString(),
      status: checkpoint.status,
      test_results: checkpoint.test_results ? JSON.stringify(checkpoint.test_results, null, 2) : '',
      defects_found: checkpoint.defects_found ? checkpoint.defects_found.join(', ') : '',
      recommendations: checkpoint.recommendations || '',
      notes: checkpoint.notes || ''
    });
    setIsDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'PASSED': return 'default';
      case 'FAILED': return 'destructive';
      case 'PENDING': return 'secondary';
      default: return 'outline';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 font-bold';
    if (score >= 75) return 'text-blue-600 font-semibold';
    if (score >= 60) return 'text-yellow-600 font-semibold';
    return 'text-red-600 font-bold';
  };

  return (
    <div className="container mx-auto p-6">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Quality Control Management</CardTitle>
          <CardDescription>
            Manage quality checkpoints and track quality metrics throughout the coffee supply chain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end mb-4">
            <div className="flex-1">
              <Label htmlFor="searchBatch">Search by Batch ID</Label>
              <Input
                id="searchBatch"
                value={searchBatchId}
                onChange={(e) => setSearchBatchId(e.target.value)}
                placeholder="Enter batch ID to view quality checkpoints"
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>Add Quality Checkpoint</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingCheckpoint ? 'Edit Quality Checkpoint' : 'Add Quality Checkpoint'}
                </DialogTitle>
                <DialogDescription>
                  Create or update quality control checkpoint for inventory items
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="inventory_id">Inventory ID</Label>
                    <Input
                      id="inventory_id"
                      type="number"
                      value={formData.inventory_id}
                      onChange={(e) => handleInputChange('inventory_id', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkpoint_type">Checkpoint Type</Label>
                    <Select 
                      value={formData.checkpoint_type} 
                      onValueChange={(value) => handleInputChange('checkpoint_type', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select checkpoint type" />
                      </SelectTrigger>
                      <SelectContent>
                        {CHECKPOINT_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="checkpoint_name">Checkpoint Name</Label>
                    <Input
                      id="checkpoint_name"
                      value={formData.checkpoint_name}
                      onChange={(e) => handleInputChange('checkpoint_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="checkpoint_date">Checkpoint Date</Label>
                    <Input
                      id="checkpoint_date"
                      type="date"
                      value={formData.checkpoint_date}
                      onChange={(e) => handleInputChange('checkpoint_date', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quality_score">Quality Score (0-100)</Label>
                    <Input
                      id="quality_score"
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      value={formData.quality_score}
                      onChange={(e) => handleInputChange('quality_score', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleInputChange('status', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PASSED">Passed</SelectItem>
                        <SelectItem value="FAILED">Failed</SelectItem>
                        <SelectItem value="PENDING">Pending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="test_results">Test Results (JSON format)</Label>
                  <textarea
                    id="test_results"
                    className="w-full p-2 border rounded-md"
                    rows={3}
                    value={formData.test_results}
                    onChange={(e) => handleInputChange('test_results', e.target.value)}
                    placeholder='{"moisture_content": 12.5, "temperature": 25}'
                  />
                </div>

                <div>
                  <Label htmlFor="defects_found">Defects Found (comma-separated)</Label>
                  <Input
                    id="defects_found"
                    value={formData.defects_found}
                    onChange={(e) => handleInputChange('defects_found', e.target.value)}
                    placeholder="cracked beans, discoloration"
                  />
                </div>

                <div>
                  <Label htmlFor="recommendations">Recommendations</Label>
                  <textarea
                    id="recommendations"
                    className="w-full p-2 border rounded-md"
                    rows={2}
                    value={formData.recommendations}
                    onChange={(e) => handleInputChange('recommendations', e.target.value)}
                    placeholder="Improve drying process, monitor temperature"
                  />
                </div>

                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    className="w-full p-2 border rounded-md"
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Additional notes"
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Saving...' : (editingCheckpoint ? 'Update' : 'Create')}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Quality Checkpoints Table */}
      <Card>
        <CardHeader>
          <CardTitle>Quality Checkpoints</CardTitle>
          <CardDescription>
            {searchBatchId ? `Showing checkpoints for batch: ${searchBatchId}` : 'Search for a batch to view checkpoints'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading checkpoints...</div>
          ) : checkpoints.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Inspector</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {checkpoints.map((checkpoint) => (
                  <TableRow key={checkpoint.checkpoint_id}>
                    <TableCell>
                      <Badge variant="outline">{checkpoint.checkpoint_type}</Badge>
                    </TableCell>
                    <TableCell>{checkpoint.checkpoint_name}</TableCell>
                    <TableCell>{new Date(checkpoint.checkpoint_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={getScoreColor(checkpoint.quality_score)}>
                        {checkpoint.quality_score}%
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(checkpoint.status)}>
                        {checkpoint.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{checkpoint.inspector_name || 'Unknown'}</TableCell>
                    <TableCell>{checkpoint.nama_item || 'N/A'}</TableCell>
                    <TableCell>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEdit(checkpoint)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-kopi-pekat/70">
              {searchBatchId ? 'No quality checkpoints found for this batch' : 'Enter a batch ID to search for quality checkpoints'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QualityControlManagement;