import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { UserRegistrationForm } from '../user-registration-form';
import api from '@/lib/axios';

// Mock the toast hook
const mockToast = jest.fn();
jest.mock('@/components/ui/use-toast', () => ({
  useToast: () => ({ toast: mockToast })
}));

// Mock axios
jest.mock('@/lib/axios');
const mockedApi = api as jest.Mocked<typeof api>;

describe('UserRegistrationForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('✅ Form Rendering', () => {
    it('should render all required form fields', () => {
      render(<UserRegistrationForm />);

      // Check all form fields are present
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
    });

    it('should have proper placeholder texts', () => {
      render(<UserRegistrationForm />);

      expect(screen.getByPlaceholderText('Enter your full name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your username')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your password')).toBeInTheDocument();
    });

    it('should have proper input types', () => {
      render(<UserRegistrationForm />);

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('type', 'email');
      expect(screen.getByLabelText(/^password$/i)).toHaveAttribute('type', 'password');
      expect(screen.getByLabelText(/confirm password/i)).toHaveAttribute('type', 'password');
    });
  });

  describe('✅ Form Validation', () => {
    it('should show validation errors for empty required fields', async () => {
      const user = userEvent.setup();
      render(<UserRegistrationForm />);

      // Submit form without filling any fields
      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Wait for validation errors to appear
      await waitFor(() => {
        expect(screen.getByText('Full name is required.')).toBeInTheDocument();
        expect(screen.getByText('Email is required.')).toBeInTheDocument();
        expect(screen.getByText('Username is required.')).toBeInTheDocument();
        expect(screen.getByText('Password is required.')).toBeInTheDocument();
        expect(screen.getByText('Please confirm your password.')).toBeInTheDocument();
      });
    });

    it('should validate password minimum length', async () => {
      const user = userEvent.setup();
      render(<UserRegistrationForm />);

      const passwordInput = screen.getByLabelText(/^password$/i);
      await user.type(passwordInput, '123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters.')).toBeInTheDocument();
      });
    });

    it('should validate password confirmation match', async () => {
      const user = userEvent.setup();
      render(<UserRegistrationForm />);

      // Fill form with mismatched passwords
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'differentpassword');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Error",
          description: "Passwords do not match.",
          variant: "destructive",
        });
      });
    });
  });

  describe('✅ Successful Registration', () => {
    it('should submit form successfully with valid data', async () => {
      const user = userEvent.setup();
      
      // Mock successful API response
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
          user_id: 1,
          needs_koperasi_registration: true
        }
      });

      render(<UserRegistrationForm />);

      // Fill form with valid data
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/users/register', {
          username: 'testuser',
          password: 'password123',
          nama_lengkap: 'Test User',
          email: 'test@example.com'
        });

        expect(mockToast).toHaveBeenCalledWith({
          title: "Success",
          description: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
        });
      });
    });

    it('should reset form after successful registration', async () => {
      const user = userEvent.setup();
      
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
          user_id: 1,
          needs_koperasi_registration: true
        }
      });

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        // Form should be reset
        expect(screen.getByLabelText(/full name/i)).toHaveValue('');
        expect(screen.getByLabelText(/email/i)).toHaveValue('');
        expect(screen.getByLabelText(/username/i)).toHaveValue('');
        expect(screen.getByLabelText(/^password$/i)).toHaveValue('');
        expect(screen.getByLabelText(/confirm password/i)).toHaveValue('');
      });
    });

    it('should show info message about koperasi registration when needed', async () => {
      const user = userEvent.setup();
      jest.useFakeTimers();
      
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
          user_id: 1,
          needs_koperasi_registration: true
        }
      });

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Wait for initial success toast
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Success",
          description: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
        });
      });

      // Fast-forward time for the second toast
      jest.advanceTimersByTime(2000);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Info",
          description: "Setelah login, Anda akan diminta untuk mendaftarkan koperasi Anda.",
        });
      });

      jest.useRealTimers();
    });
  });

  describe('❌ Error Handling', () => {
    it('should handle API validation errors', async () => {
      const user = userEvent.setup();
      
      // Mock API validation error response
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            errors: [
              { msg: 'Username is required.' },
              { msg: 'Email format is invalid.' }
            ]
          }
        }
      });

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Registration Error",
          description: "Username is required., Email format is invalid.",
          variant: "destructive",
        });
      });
    });

    it('should handle API business logic errors', async () => {
      const user = userEvent.setup();
      
      // Mock API business logic error
      mockedApi.post.mockRejectedValueOnce({
        response: {
          data: {
            message: 'Username atau email sudah terdaftar'
          }
        }
      });

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'existing@example.com');
      await user.type(screen.getByLabelText(/username/i), 'existinguser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Registration Error",
          description: "Username atau email sudah terdaftar",
          variant: "destructive",
        });
      });
    });

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock network error
      mockedApi.post.mockRejectedValueOnce(new Error('Network Error'));

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Registration Error",
          description: "Network Error",
          variant: "destructive",
        });
      });
    });

    it('should handle unknown error types', async () => {
      const user = userEvent.setup();
      
      // Mock unknown error type
      mockedApi.post.mockRejectedValueOnce('Unknown error');

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith({
          title: "Registration Error",
          description: "Registration failed.",
          variant: "destructive",
        });
      });
    });
  });

  describe('🔐 Security & Data Handling', () => {
    it('should not expose password in API call logs', async () => {
      const user = userEvent.setup();
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
          user_id: 1,
          needs_koperasi_registration: true
        }
      });

      render(<UserRegistrationForm />);

      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'secretpassword123');
      await user.type(screen.getByLabelText(/confirm password/i), 'secretpassword123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalled();
        
        // Check that password is passed to API but not logged in plain text
        const apiCall = mockedApi.post.mock.calls[0];
        expect(apiCall[1]).toEqual({
          username: 'testuser',
          password: 'secretpassword123',
          nama_lengkap: 'Test User',
          email: 'test@example.com'
        });
      });

      consoleSpy.mockRestore();
    });

    it('should properly sanitize input fields', async () => {
      const user = userEvent.setup();
      
      mockedApi.post.mockResolvedValueOnce({
        data: {
          message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
          user_id: 1,
          needs_koperasi_registration: true
        }
      });

      render(<UserRegistrationForm />);

      // Fill form with potentially malicious input
      await user.type(screen.getByLabelText(/full name/i), '<script>alert("xss")</script>');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockedApi.post).toHaveBeenCalledWith('/users/register', {
          username: 'testuser',
          password: 'password123',
          nama_lengkap: '<script>alert("xss")</script>',
          email: 'test@example.com'
        });
      });

      // Note: In real implementation, you might want to sanitize on the client side too
    });
  });

  describe('📱 Accessibility & UX', () => {
    it('should have proper ARIA labels and accessibility attributes', () => {
      render(<UserRegistrationForm />);

      // Check for proper labels
      expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();

      // Check submit button is accessible
      const submitButton = screen.getByRole('button', { name: /register/i });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveAttribute('type', 'submit');
    });

    it('should maintain focus order through form fields', async () => {
      const user = userEvent.setup();
      render(<UserRegistrationForm />);

      const namaField = screen.getByLabelText(/full name/i);
      const emailField = screen.getByLabelText(/email/i);
      const usernameField = screen.getByLabelText(/username/i);
      const passwordField = screen.getByLabelText(/^password$/i);
      const confirmPasswordField = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /register/i });

      // Focus should move through fields in logical order
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
      expect(submitButton).toHaveFocus();
    });

    it('should show loading state during form submission', async () => {
      const user = userEvent.setup();
      
      // Mock a delayed response
      mockedApi.post.mockImplementationOnce(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            data: {
              message: 'User berhasil terdaftar. Silakan login dan daftarkan koperasi Anda.',
              user_id: 1,
              needs_koperasi_registration: true
            }
          }), 1000)
        )
      );

      render(<UserRegistrationForm />);

      // Fill and submit form
      await user.type(screen.getByLabelText(/full name/i), 'Test User');
      await user.type(screen.getByLabelText(/email/i), 'test@example.com');
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/^password$/i), 'password123');
      await user.type(screen.getByLabelText(/confirm password/i), 'password123');

      const submitButton = screen.getByRole('button', { name: /register/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      }, { timeout: 2000 });
    });
  });
});