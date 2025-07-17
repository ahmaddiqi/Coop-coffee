import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { KoperasiRegistrationForm } from '../koperasi-registration-form';
import api from '@/lib/axios';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock axios
jest.mock('@/lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

describe('KoperasiRegistrationForm', () => {
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Form Rendering', () => {
    it('should render all required form fields', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Check all form fields are present
      expect(screen.getByLabelText(/nama koperasi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/alamat lengkap/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/provinsi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kabupaten/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/penanggung jawab/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nomor telepon/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /daftarkan koperasi/i })).toBeInTheDocument();
    });

    it('should have proper placeholder texts', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      expect(screen.getByPlaceholderText('Contoh: Koperasi Kopi Sumber Daya Alam')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Jalan, Desa/Kelurahan, Kecamatan')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contoh: Jawa Timur')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Contoh: Sidoarjo')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Nama lengkap penanggung jawab')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('08xxxxxxxxx')).toBeInTheDocument();
    });

    it('should display proper header and description', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      expect(screen.getByText('Daftarkan Koperasi Anda')).toBeInTheDocument();
      expect(screen.getByText('Lengkapi data koperasi untuk melanjutkan menggunakan sistem')).toBeInTheDocument();
      expect(screen.getByText('Setelah koperasi terdaftar, Anda akan menjadi Admin Koperasi dan dapat mengelola semua data koperasi')).toBeInTheDocument();
    });

    it('should have proper form layout and styling', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Check for card layout
      const card = screen.getByRole('main', { hidden: true }) || screen.getByText('Daftarkan Koperasi Anda').closest('div');
      expect(card).toHaveClass('shadow-lg');

      // Check for grid layout
      const form = screen.getByRole('form', { hidden: true }) || screen.getByText('Nama Koperasi').closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('✅ Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Submit form without filling any fields
      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nama koperasi wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Alamat wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Provinsi wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Kabupaten wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Penanggung jawab wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Nomor telepon wajib diisi.')).toBeInTheDocument();
      });
    });

    it('should validate individual fields correctly', async () => {
      const user = userEvent.setup();
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Try to submit with only some fields filled
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Test Koperasi');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Filled fields should not show errors
        expect(screen.queryByText('Nama koperasi wajib diisi.')).not.toBeInTheDocument();
        expect(screen.queryByText('Provinsi wajib diisi.')).not.toBeInTheDocument();

        // Empty fields should show errors
        expect(screen.getByText('Alamat wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Kabupaten wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Penanggung jawab wajib diisi.')).toBeInTheDocument();
        expect(screen.getByText('Nomor telepon wajib diisi.')).toBeInTheDocument();
      });
    });
  });

  describe('✅ Successful Registration', () => {
    it('should submit form successfully with valid data', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
          koperasi_id: 1,
          nama_koperasi: 'Koperasi Test'
        }
      });

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill form with valid data
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Kopi Sumber Daya Alam');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Kopi No. 123, Desa Kopi, Kec. Kopi');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Malang');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Budi Santoso');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/users/register-koperasi', {
          nama_koperasi: 'Koperasi Kopi Sumber Daya Alam',
          alamat: 'Jl. Kopi No. 123, Desa Kopi, Kec. Kopi',
          provinsi: 'Jawa Timur',
          kabupaten: 'Malang',
          kontak_person: 'Budi Santoso',
          nomor_telepon: '081234567890'
        });

        expect(mockToast).toHaveBeenCalledWith({
          title: "Success",
          description: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
        });
      });
    });

    it('should call onSuccess callback after successful registration', async () => {
      const user = userEvent.setup();
      
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
          koperasi_id: 1,
          nama_koperasi: 'Koperasi Test'
        }
      });

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });

    it('should handle onSuccess callback being undefined', async () => {
      const user = userEvent.setup();
      
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
          koperasi_id: 1,
          nama_koperasi: 'Koperasi Test'
        }
      });

      render(<KoperasiRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Success",
          description: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
        });
      });

      // Should not throw error when onSuccess is undefined
    });
  });

  describe('❌ Error Handling', () => {
    it('should handle API business logic errors', async () => {
      const user = userEvent.setup();
      
      // Mock API business logic error
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'User sudah terdaftar di koperasi'
          }
        }
      });

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "User sudah terdaftar di koperasi",
          variant: "destructive",
        });
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockedApi.post.mockRejectedValueOnce(new Error('Network Error'));

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Network Error",
          variant: "destructive",
        });
      });
    });

    it('should handle unknown error types', async () => {
      const user = userEvent.setup();
      
      // Mock unknown error type
      mockedApi.post.mockRejectedValueOnce('Unknown error');

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Gagal mendaftarkan koperasi.",
          variant: "destructive",
        });
      });
    });

    it('should handle complex error response parsing', async () => {
      const user = userEvent.setup();
      
      // Mock complex error response
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            errors: [
              { msg: 'Nama koperasi sudah terdaftar' },
              { msg: 'Nomor telepon format tidak valid' }
            ]
          }
        }
      });

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Existing');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), 'invalid-phone');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Gagal mendaftarkan koperasi.",
          variant: "destructive",
        });
      });
    });
  });

  describe('🔄 Loading States & UX', () => {
    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockedApi.post.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              message: 'Koperasi berhasil didaftarkan dan user menjadi Admin Koperasi',
              koperasi_id: 1,
              nama_koperasi: 'Koperasi Test'
            }
          }), 1000)
        )
      );

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      // Button should show loading text and be disabled
      await waitFor(() => {
        expect(screen.getByText('Mendaftarkan...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      await waitFor(() => {
        expect(screen.getByText('Daftarkan Koperasi')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });

    it('should reset loading state on error', async () => {
      const user = userEvent.setup();
      
      // Mock delayed error response
      mockedApi.post.mockImplementationOnce(() => 
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Server Error')), 500)
        )
      );

      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama koperasi/i), 'Koperasi Test');
      await user.type(screen.getByLabelText(/alamat lengkap/i), 'Jl. Test No. 123');
      await user.type(screen.getByLabelText(/provinsi/i), 'Jawa Timur');
      await user.type(screen.getByLabelText(/kabupaten/i), 'Sidoarjo');
      await user.type(screen.getByLabelText(/penanggung jawab/i), 'Test Person');
      await user.type(screen.getByLabelText(/nomor telepon/i), '081234567890');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      // Should show loading state
      await waitFor(() => {
        expect(screen.getByText('Mendaftarkan...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Should reset loading state after error
      await waitFor(() => {
        expect(screen.getByText('Daftarkan Koperasi')).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 1000 });
    });
  });

  describe('📱 Accessibility & Layout', () => {
    it('should have proper ARIA labels and form structure', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Check for proper labels
      expect(screen.getByLabelText(/nama koperasi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/alamat lengkap/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/provinsi/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/kabupaten/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/penanggung jawab/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/nomor telepon/i)).toBeInTheDocument();

      // Check submit button accessibility
      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should maintain proper focus order', async () => {
      const user = userEvent.setup();
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      const namaKoperasi = screen.getByLabelText(/nama koperasi/i);
      const alamat = screen.getByLabelText(/alamat lengkap/i);
      const provinsi = screen.getByLabelText(/provinsi/i);
      const kabupaten = screen.getByLabelText(/kabupaten/i);
      const kontakPerson = screen.getByLabelText(/penanggung jawab/i);
      const nomorTelepon = screen.getByLabelText(/nomor telepon/i);
      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });

      // Focus should move through fields in logical order
      namaKoperasi.focus();
      expect(namaKoperasi).toHaveFocus();

      await user.tab();
      expect(alamat).toHaveFocus();

      await user.tab();
      expect(provinsi).toHaveFocus();

      await user.tab();
      expect(kabupaten).toHaveFocus();

      await user.tab();
      expect(kontakPerson).toHaveFocus();

      await user.tab();
      expect(nomorTelepon).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should be responsive and well-structured', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Check for responsive classes
      const container = screen.getByText('Daftarkan Koperasi Anda').closest('div');
      expect(container).toHaveClass('min-h-screen');

      // Check grid layout for form fields
      const form = screen.getByLabelText(/nama koperasi/i).closest('form');
      expect(form).toBeInTheDocument();
    });
  });

  describe('🎨 Visual Design & Styling', () => {
    it('should display proper coffee theme styling', () => {
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      // Check for coffee-themed classes
      const icon = screen.getByRole('img', { hidden: true }) || document.querySelector('svg');
      expect(icon).toBeInTheDocument();

      // Check for proper color classes
      const title = screen.getByText('Daftarkan Koperasi Anda');
      expect(title).toHaveClass('text-kopi-pekat');

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      expect(submitButton).toHaveClass('bg-aksen-oranye');
    });

    it('should display validation error styling', async () => {
      const user = userEvent.setup();
      render(<KoperasiRegistrationForm onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole('button', { name: /daftarkan koperasi/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText('Nama koperasi wajib diisi.');
        expect(errorMessage).toHaveClass('text-red-600');
      });
    });
  });
});