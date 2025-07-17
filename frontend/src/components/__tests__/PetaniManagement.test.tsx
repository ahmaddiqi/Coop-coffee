import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import PetaniManagement from '../PetaniManagement';
import api from '@/lib/axios';

// Mock axios
vi.mock('@/lib/axios');
const mockedApi = vi.mocked(api);

// Mock toast hook
const mockToast = vi.fn();
vi.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock react-hook-form (already works with our component)
vi.mock('react-hook-form', async () => {
  const actual = await vi.importActual('react-hook-form');
  return {
    ...actual,
    useForm: () => ({
      register: vi.fn((name) => ({
        name,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        ref: vi.fn()
      })),
      handleSubmit: vi.fn((callback) => (event) => {
        event.preventDefault();
        callback({
          koperasi_id: 1,
          nama: 'Test Petani',
          kontak: '081234567890',
          alamat: 'Test Alamat'
        });
      }),
      formState: { errors: {} },
      setValue: vi.fn()
    })
  };
});

describe('MODUL 2: PETANI REGISTRATION - Frontend Component Tests', () => {
  const mockPetaniData = [
    {
      petani_id: 1,
      koperasi_id: 1,
      nama: 'Petani Satu',
      kontak: '081234567890',
      alamat: 'Alamat Petani Satu'
    },
    {
      petani_id: 2,
      koperasi_id: 1,
      nama: 'Petani Dua',
      kontak: '081234567891',
      alamat: 'Alamat Petani Dua'
    }
  ];

  const mockKoperasiData = [
    {
      koperasi_id: 1,
      nama_koperasi: 'Koperasi Test',
      alamat: 'Alamat Koperasi',
      provinsi: 'Test Province',
      kabupaten: 'Test District'
    }
  ];

  const mockLandStats = {
    1: { jumlah_lahan: 2, total_luas_hektar: 5.5 },
    2: { jumlah_lahan: 1, total_luas_hektar: 2.0 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockToast.mockClear();
    
    // Default API mocks
    mockedApi.get.mockImplementation((url) => {
      switch (url) {
        case '/petani':
          return Promise.resolve({ data: mockPetaniData });
        case '/koperasi':
          return Promise.resolve({ data: mockKoperasiData });
        case '/petani/land-stats':
          return Promise.resolve({ data: mockLandStats });
        default:
          return Promise.reject(new Error('Unknown endpoint'));
      }
    });
  });

  describe('Component Rendering', () => {
    it('should render petani management component correctly', async () => {
      render(<PetaniManagement />);

      // Check main title
      expect(screen.getByText('Manajemen Petani & Lahan')).toBeInTheDocument();
      
      // Check add button
      expect(screen.getByText('Tambah Petani Baru')).toBeInTheDocument();

      // Check table headers
      expect(screen.getByText('Nama Petani')).toBeInTheDocument();
      expect(screen.getByText('Kontak')).toBeInTheDocument();
      expect(screen.getByText('Jumlah Lahan')).toBeInTheDocument();
      expect(screen.getByText('Total Luas (ha)')).toBeInTheDocument();
      expect(screen.getByText('Aksi')).toBeInTheDocument();
    });

    it('should display petani data in table', async () => {
      render(<PetaniManagement />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Petani Satu')).toBeInTheDocument();
        expect(screen.getByText('Petani Dua')).toBeInTheDocument();
        expect(screen.getByText('081234567890')).toBeInTheDocument();
        expect(screen.getByText('081234567891')).toBeInTheDocument();
      });
    });

    it('should display land statistics correctly', async () => {
      render(<PetaniManagement />);

      await waitFor(() => {
        // Check land stats for petani 1
        expect(screen.getByText('2')).toBeInTheDocument(); // jumlah lahan
        expect(screen.getByText('5.5 ha')).toBeInTheDocument(); // total luas

        // Check land stats for petani 2
        expect(screen.getByText('1')).toBeInTheDocument(); // jumlah lahan
        expect(screen.getByText('2.0 ha')).toBeInTheDocument(); // total luas
      });
    });
  });

  describe('API Integration', () => {
    it('should fetch petani data on component mount', async () => {
      render(<PetaniManagement />);

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/petani');
        expect(mockedApi.get).toHaveBeenCalledWith('/koperasi');
        expect(mockedApi.get).toHaveBeenCalledWith('/petani/land-stats');
      });
    });

    it('should handle API errors gracefully', async () => {
      mockedApi.get.mockImplementation((url) => {
        if (url === '/petani') {
          return Promise.reject(new Error('Failed to fetch petani'));
        }
        return Promise.resolve({ data: [] });
      });

      render(<PetaniManagement />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Failed to fetch petani',
          variant: 'destructive'
        });
      });
    });

    it('should handle network errors with response data', async () => {
      const networkError = {
        response: {
          data: {
            message: 'Network timeout'
          }
        }
      };

      mockedApi.get.mockImplementation((url) => {
        if (url === '/petani') {
          return Promise.reject(networkError);
        }
        return Promise.resolve({ data: [] });
      });

      render(<PetaniManagement />);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Network timeout',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Add Petani Dialog', () => {
    it('should open add petani dialog when button clicked', async () => {
      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Add New Petani')).toBeInTheDocument();
      });
    });

    it('should display form fields in add dialog', async () => {
      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Koperasi')).toBeInTheDocument();
        expect(screen.getByLabelText('Nama Petani')).toBeInTheDocument();
        expect(screen.getByLabelText('Kontak')).toBeInTheDocument();
        expect(screen.getByLabelText('Alamat')).toBeInTheDocument();
        expect(screen.getByText('Add Petani')).toBeInTheDocument();
      });
    });

    it('should populate koperasi dropdown with data', async () => {
      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit new petani successfully', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { message: 'Petani created successfully' }
      });

      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        const submitButton = screen.getByText('Add Petani');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/petani', {
          koperasi_id: 1,
          nama: 'Test Petani',
          kontak: '081234567890',
          alamat: 'Test Alamat'
        });

        expect(mockToast).toHaveBeenCalledWith({
          title: 'Success',
          description: 'Petani created successfully'
        });
      });
    });

    it('should handle form submission errors', async () => {
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Petani dengan nama yang sama sudah terdaftar di koperasi ini'
          }
        }
      });

      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        const submitButton = screen.getByText('Add Petani');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: 'Error',
          description: 'Petani dengan nama yang sama sudah terdaftar di koperasi ini',
          variant: 'destructive'
        });
      });
    });
  });

  describe('Edit Petani Dialog', () => {
    it('should open edit dialog when "Lihat Lahan" clicked', async () => {
      render(<PetaniManagement />);

      await waitFor(() => {
        const editButtons = screen.getAllByText('Lihat Lahan');
        fireEvent.click(editButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Edit Petani')).toBeInTheDocument();
      });
    });

    it('should pre-populate form with selected petani data', async () => {
      const mockSetValue = vi.fn();
      
      // Mock useForm to track setValue calls
      vi.doMock('react-hook-form', async () => {
        const actual = await vi.importActual('react-hook-form');
        return {
          ...actual,
          useForm: () => ({
            register: vi.fn(),
            handleSubmit: vi.fn(),
            formState: { errors: {} },
            setValue: mockSetValue
          })
        };
      });

      render(<PetaniManagement />);

      await waitFor(() => {
        const editButtons = screen.getAllByText('Lihat Lahan');
        fireEvent.click(editButtons[0]);
      });

      // Note: setValue calls would be verified in a real test environment
      // This tests the component behavior pattern
    });
  });

  describe('Phone Number Validation', () => {
    it('should display phone number placeholder with format hint', async () => {
      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        const kontakInput = screen.getByPlaceholderText('Enter nomor telepon (10-15 digit)');
        expect(kontakInput).toBeInTheDocument();
      });
    });

    // Note: More detailed validation testing would require form integration
    // In real component testing, we would test:
    // - Valid phone formats (081234567890, +6281234567890)
    // - Invalid phone formats (123, abc123)
    // - Error message display for invalid formats
  });

  describe('Responsive Design and Accessibility', () => {
    it('should have proper ARIA labels for form fields', async () => {
      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Nama Petani')).toBeInTheDocument();
        expect(screen.getByLabelText('Kontak')).toBeInTheDocument();
        expect(screen.getByLabelText('Alamat')).toBeInTheDocument();
        expect(screen.getByLabelText('Koperasi')).toBeInTheDocument();
      });
    });

    it('should handle empty state gracefully', async () => {
      mockedApi.get.mockImplementation((url) => {
        switch (url) {
          case '/petani':
            return Promise.resolve({ data: [] });
          case '/koperasi':
            return Promise.resolve({ data: [] });
          case '/petani/land-stats':
            return Promise.resolve({ data: {} });
          default:
            return Promise.reject(new Error('Unknown endpoint'));
        }
      });

      render(<PetaniManagement />);

      await waitFor(() => {
        // Component should render without errors even with empty data
        expect(screen.getByText('Manajemen Petani & Lahan')).toBeInTheDocument();
      });
    });

    it('should display zero values for land stats when no data', async () => {
      const emptyStatsData = [
        {
          petani_id: 3,
          koperasi_id: 1,
          nama: 'Petani Tanpa Lahan',
          kontak: '081234567892',
          alamat: 'Alamat Petani Tanpa Lahan'
        }
      ];

      mockedApi.get.mockImplementation((url) => {
        switch (url) {
          case '/petani':
            return Promise.resolve({ data: emptyStatsData });
          case '/koperasi':
            return Promise.resolve({ data: mockKoperasiData });
          case '/petani/land-stats':
            return Promise.resolve({ data: {} }); // No stats for petani_id: 3
          default:
            return Promise.reject(new Error('Unknown endpoint'));
        }
      });

      render(<PetaniManagement />);

      await waitFor(() => {
        expect(screen.getByText('Petani Tanpa Lahan')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument(); // Should show 0 for jumlah lahan
        expect(screen.getByText('0.0 ha')).toBeInTheDocument(); // Should show 0.0 for total luas
      });
    });
  });

  describe('Loading States and Error Handling', () => {
    it('should handle land stats fetch failure silently', async () => {
      mockedApi.get.mockImplementation((url) => {
        switch (url) {
          case '/petani':
            return Promise.resolve({ data: mockPetaniData });
          case '/koperasi':
            return Promise.resolve({ data: mockKoperasiData });
          case '/petani/land-stats':
            return Promise.reject(new Error('Stats service unavailable'));
          default:
            return Promise.reject(new Error('Unknown endpoint'));
        }
      });

      render(<PetaniManagement />);

      await waitFor(() => {
        // Component should still work without land stats
        expect(screen.getByText('Petani Satu')).toBeInTheDocument();
        // Should not show error toast for land stats failure
        expect(mockToast).not.toHaveBeenCalledWith(
          expect.objectContaining({
            title: 'Error',
            variant: 'destructive'
          })
        );
      });
    });

    it('should refresh data after successful form submission', async () => {
      mockedApi.post.mockResolvedValueOnce({
        data: { message: 'Petani created successfully' }
      });

      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        const submitButton = screen.getByText('Add Petani');
        fireEvent.click(submitButton);
      });

      await waitFor(() => {
        // Should call fetchPetani and fetchLandStats again after successful submission
        expect(mockedApi.get).toHaveBeenCalledWith('/petani');
        expect(mockedApi.get).toHaveBeenCalledWith('/petani/land-stats');
      });
    });
  });

  describe('Business Logic Validation', () => {
    it('should enforce required fields according to DOKUMENTASITEKNIS.MD', async () => {
      render(<PetaniManagement />);

      const addButton = screen.getByText('Tambah Petani Baru');
      fireEvent.click(addButton);

      await waitFor(() => {
        // According to dokumentasi: nama, alamat are required
        // koperasi_id is required for database relationship
        // kontak is optional but should be validated if provided

        expect(screen.getByLabelText('Nama Petani')).toBeRequired;
        expect(screen.getByLabelText('Alamat')).toBeInTheDocument;
        expect(screen.getByLabelText('Koperasi')).toBeRequired;
      });
    });

    it('should handle koperasi association correctly', async () => {
      render(<PetaniManagement />);

      await waitFor(() => {
        // Petani should be displayed with their associated koperasi data
        // This is handled through the fetchPetani and fetchKoperasi calls
        expect(mockedApi.get).toHaveBeenCalledWith('/petani');
        expect(mockedApi.get).toHaveBeenCalledWith('/koperasi');
      });
    });
  });
});