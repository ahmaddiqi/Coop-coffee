import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { BrowserRouter } from 'react-router-dom';
import InviteRegistration from '../InviteRegistration';
import api from '@/lib/axios';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock axios
jest.mock('@/lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
const mockParams = { token: 'valid-test-token' };

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useParams: () => mockParams,
  BrowserRouter: ({ children }: { children: React.ReactNode }) => <div>{children}</div>
}));

describe('InviteRegistration Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Component Initialization', () => {
    it('should validate invite token on component mount', async () => {
      // Mock successful validation
      mockedApi.get.mockResolvedValueOnce({
        data: {
          valid: true,
          koperasi_name: 'Koperasi Test',
          expires_at: '2025-12-31T23:59:59.000Z'
        }
      });

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockedApi.get).toHaveBeenCalledWith('/users/validate-invite/valid-test-token');
      });

      // Should show koperasi name after validation
      expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
    });

    it('should handle invalid invite token', async () => {
      // Mock invalid token response
      mockedApi.get.mockRejectedValueOnce({
        response: {
          status: 404,
          data: { message: 'Link undangan tidak valid atau sudah kedaluwarsa' }
        }
      });

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Link undangan tidak valid atau sudah kedaluwarsa",
          variant: "destructive",
        });
      });

      // Should navigate back to home
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    it('should show loading state during token validation', () => {
      // Mock pending request
      mockedApi.get.mockImplementationOnce(() => new Promise(() => {}));

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      expect(screen.getByText(/validasi undangan/i)).toBeInTheDocument();
    });
  });

  describe('✅ Registration Form', () => {
    beforeEach(async () => {
      // Mock successful validation for all tests
      mockedApi.get.mockResolvedValue({
        data: {
          valid: true,
          koperasi_name: 'Koperasi Test',
          expires_at: '2025-12-31T23:59:59.000Z'
        }
      });

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
      });
    });

    it('should render all form fields', () => {
      expect(screen.getByLabelText(/nama lengkap/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /daftar/i })).toBeInTheDocument();
    });

    it('should have proper role options', () => {
      const roleSelect = screen.getByLabelText(/role/i);
      
      expect(roleSelect).toBeInTheDocument();
      // Check if ADMIN and OPERATOR options are available
      fireEvent.click(roleSelect);
      expect(screen.getByText('ADMIN')).toBeInTheDocument();
      expect(screen.getByText('OPERATOR')).toBeInTheDocument();
    });

    it('should submit registration successfully', async () => {
      const user = userEvent.setup();

      // Mock successful registration
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'User berhasil didaftarkan melalui undangan',
          user_id: 2,
          username: 'inviteduser',
          role: 'OPERATOR',
          koperasi_id: 1
        }
      });

      // Fill form
      await user.type(screen.getByLabelText(/nama lengkap/i), 'Invited User');
      await user.type(screen.getByLabelText(/email/i), 'invited@example.com');
      await user.type(screen.getByLabelText(/username/i), 'inviteduser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.selectOptions(screen.getByLabelText(/role/i), 'OPERATOR');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /daftar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith(
          '/users/register-via-invite/valid-test-token',
          {
            nama_lengkap: 'Invited User',
            email: 'invited@example.com',
            username: 'inviteduser',
            password: 'password123',
            role: 'OPERATOR'
          }
        );

        expect(mockToast).toHaveBeenCalledWith({
          title: "Success",
          description: 'User berhasil didaftarkan melalui undangan',
        });

        expect(mockNavigate).toHaveBeenCalledWith('/login');
      });
    });

    it('should validate password confirmation', async () => {
      const user = userEvent.setup();

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText(/nama lengkap/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword');
      await user.selectOptions(screen.getByLabelText(/role/i), 'OPERATOR');

      const submitButton = screen.getByRole('button', { name: /daftar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Password tidak sama",
          variant: "destructive",
        });
      });
    });

    it('should handle registration errors', async () => {
      const user = userEvent.setup();

      // Mock registration error
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Username sudah digunakan'
          }
        }
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama lengkap/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'existinguser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.selectOptions(screen.getByLabelText(/role/i), 'OPERATOR');

      const submitButton = screen.getByRole('button', { name: /daftar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: 'Username sudah digunakan',
          variant: "destructive",
        });
      });
    });

    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();

      // Mock delayed response
      mockedApi.post.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              message: 'User berhasil didaftarkan melalui undangan',
              user_id: 2,
              username: 'inviteduser',
              role: 'OPERATOR',
              koperasi_id: 1
            }
          }), 1000)
        )
      );

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama lengkap/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.selectOptions(screen.getByLabelText(/role/i), 'OPERATOR');

      const submitButton = screen.getByRole('button', { name: /daftar/i });
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/mendaftar/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Wait for completion
      await waitFor(() => {
        expect(screen.getByText(/daftar/i)).toBeInTheDocument();
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });
  });

  describe('📱 Accessibility & UX', () => {
    beforeEach(async () => {
      mockedApi.get.mockResolvedValue({
        data: {
          valid: true,
          koperasi_name: 'Koperasi Test',
          expires_at: '2025-12-31T23:59:59.000Z'
        }
      });

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
      });
    });

    it('should have proper ARIA labels', () => {
      expect(screen.getByLabelText(/nama lengkap/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
    });

    it('should maintain proper focus order', async () => {
      const user = userEvent.setup();

      const namaField = screen.getByLabelText(/nama lengkap/i);
      const emailField = screen.getByLabelText(/email/i);
      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/^password$/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      const roleField = screen.getByLabelText(/role/i);
      const submitButton = screen.getByRole('button', { name: /daftar/i });

      // Check focus order
      namaField.focus();
      expect(namaField).toHaveFocus();

      await user.tab();
      expect(emailField).toHaveFocus();

      await user.tab();
      expect(usernameField).toHaveFocus();

      await user.tab();
      expect(passwordField).toHaveFocus();

      await user.tab();
      expect(confirmPasswordField).toHaveFocus();

      await user.tab();
      expect(roleField).toHaveFocus();

      await user.tab();
      expect(submitButton).toHaveFocus();
    });

    it('should show invite information clearly', () => {
      // Should show koperasi name
      expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
      
      // Should show invitation context
      expect(screen.getByText(/bergabung dengan/i)).toBeInTheDocument();
      
      // Should show form title
      expect(screen.getByText(/lengkapi data/i)).toBeInTheDocument();
    });
  });

  describe('🔒 Security Considerations', () => {
    it('should not expose sensitive information in errors', async () => {
      const user = userEvent.setup();

      // Mock network error
      mockedApi.post.mockRejectedValueOnce(new Error('Network Error'));

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      // Wait for validation
      await waitFor(() => {
        expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
      });

      // Fill and submit form
      await user.type(screen.getByLabelText(/nama lengkap/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');
      await user.selectOptions(screen.getByLabelText(/role/i), 'OPERATOR');

      const submitButton = screen.getByRole('button', { name: /daftar/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Network Error",
          variant: "destructive",
        });
      });
    });

    it('should handle token validation timing correctly', async () => {
      // Mock token validation that takes time
      mockedApi.get.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              valid: true,
              koperasi_name: 'Koperasi Test',
              expires_at: '2025-12-31T23:59:59.000Z'
            }
          }), 500)
        )
      );

      render(
        <BrowserRouter>
          <InviteRegistration />
        </BrowserRouter>
      );

      // Should show loading initially
      expect(screen.getByText(/validasi undangan/i)).toBeInTheDocument();

      // Should show form after validation
      await waitFor(() => {
        expect(screen.getByText('Koperasi Test')).toBeInTheDocument();
      }, { timeout: 1000 });
    });
  });
});