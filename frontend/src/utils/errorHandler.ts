/**
 * Centralized error handling utility for consistent error messaging
 * across all frontend components.
 */

export interface ErrorHandlerResult {
  title: string;
  description: string;
  shouldRedirectToLogin?: boolean;
}

/**
 * Handles different types of errors and returns user-friendly messages
 * @param error - The error object (usually from axios)
 * @param context - Context about where the error occurred (e.g., 'login', 'create user', etc.)
 * @returns Object with title, description, and optional redirect flag
 */
export function handleApiError(error: unknown, context: string = 'operasi'): ErrorHandlerResult {
  // Default error message
  let title = 'Error';
  let description = `Terjadi kesalahan saat ${context}. Silakan coba lagi.`;
  let shouldRedirectToLogin = false;

  if (typeof error === 'object' && error !== null) {
    const axiosError = error as any;
    
    // Network errors (CORS, connection refused, etc.)
    if (axiosError.code === 'ERR_NETWORK' || axiosError.message === 'Network Error') {
      title = 'Koneksi Bermasalah';
      description = 'Tidak dapat terhubung ke server. Periksa koneksi internet Anda atau coba lagi nanti.';
    } else if (axiosError.code === 'ERR_CONNECTION_REFUSED') {
      title = 'Server Tidak Tersedia';
      description = 'Server tidak dapat diakses. Silakan coba lagi nanti.';
    } else if (axiosError.code === 'ECONNABORTED') {
      title = 'Koneksi Timeout';
      description = 'Koneksi timeout. Silakan coba lagi.';
    } else if ('response' in axiosError && axiosError.response) {
      // Server responded with error status
      const status = axiosError.response.status;
      const responseData = axiosError.response.data;
      
      if (responseData?.message) {
        description = responseData.message;
      } else if (responseData?.error) {
        description = responseData.error;
      } else if (responseData?.errors && Array.isArray(responseData.errors)) {
        // Handle validation errors
        const validationErrors = responseData.errors;
        description = validationErrors.map((err: any) => err.msg || err.message || err).join(', ');
      } else {
        // Handle based on status code
        switch (status) {
          case 400:
            title = 'Data Tidak Valid';
            description = 'Data yang dikirim tidak valid. Periksa kembali input Anda.';
            break;
          case 401:
            title = 'Unauthorized';
            description = 'Sesi Anda telah berakhir. Silakan login kembali.';
            shouldRedirectToLogin = true;
            break;
          case 403:
            title = 'Akses Ditolak';
            description = 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
            break;
          case 404:
            title = 'Data Tidak Ditemukan';
            description = 'Data yang diminta tidak ditemukan.';
            break;
          case 409:
            title = 'Konflik Data';
            description = 'Data yang Anda coba simpan sudah ada atau bertentangan dengan data lain.';
            break;
          case 422:
            title = 'Data Tidak Valid';
            description = 'Data yang dikirim tidak dapat diproses. Periksa kembali input Anda.';
            break;
          case 500:
            title = 'Kesalahan Server';
            description = 'Terjadi kesalahan pada server. Silakan coba lagi nanti.';
            break;
          case 503:
            title = 'Service Unavailable';
            description = 'Layanan sedang tidak tersedia. Silakan coba lagi nanti.';
            break;
          default:
            title = 'Kesalahan Tidak Diketahui';
            description = `Terjadi kesalahan (${status}) saat ${context}. Silakan coba lagi.`;
        }
      }
    } else if (axiosError.message) {
      description = axiosError.message;
    }
  } else if (error instanceof Error) {
    description = error.message;
  }

  return {
    title,
    description,
    shouldRedirectToLogin
  };
}

/**
 * Handles login-specific errors with appropriate messaging
 * @param error - The error object from login attempt
 * @returns Error handler result with login-specific messages
 */
export function handleLoginError(error: unknown): ErrorHandlerResult {
  const result = handleApiError(error, 'login');
  
  // Override some messages for login context
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as any;
    
    if (axiosError.response?.status === 401) {
      result.title = 'Login Gagal';
      result.description = 'Username atau password salah.';
      result.shouldRedirectToLogin = false; // Already on login page
    }
  }
  
  return result;
}

/**
 * Handles registration-specific errors
 * @param error - The error object from registration attempt
 * @returns Error handler result with registration-specific messages
 */
export function handleRegistrationError(error: unknown): ErrorHandlerResult {
  const result = handleApiError(error, 'pendaftaran');
  
  // Override some messages for registration context
  if (typeof error === 'object' && error !== null) {
    const axiosError = error as any;
    
    if (axiosError.response?.status === 409) {
      result.title = 'Pendaftaran Gagal';
      result.description = 'Username sudah digunakan. Silakan pilih username lain.';
    }
  }
  
  return result;
}

/**
 * Handles CRUD operation errors (Create, Read, Update, Delete)
 * @param error - The error object from CRUD operation
 * @param operation - The type of operation ('create', 'update', 'delete', 'fetch')
 * @param resource - The resource being operated on (e.g., 'petani', 'lahan', 'koperasi')
 * @returns Error handler result with operation-specific messages
 */
export function handleCrudError(error: unknown, operation: string, resource: string): ErrorHandlerResult {
  const operationMap: { [key: string]: string } = {
    create: 'membuat',
    update: 'memperbarui',
    delete: 'menghapus',
    fetch: 'mengambil data'
  };
  
  const context = `${operationMap[operation] || operation} ${resource}`;
  return handleApiError(error, context);
}

/**
 * Shows a toast notification with proper error handling
 * @param toast - The toast function from useToast hook
 * @param error - The error object
 * @param context - Context about where the error occurred
 */
export function showErrorToast(toast: any, error: unknown, context: string = 'operasi') {
  const errorResult = handleApiError(error, context);
  
  toast({
    title: errorResult.title,
    description: errorResult.description,
    variant: 'destructive',
  });
  
  // Handle redirect if needed
  if (errorResult.shouldRedirectToLogin) {
    // Clear auth data and redirect to login
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    localStorage.removeItem('role');
    window.location.href = '/';
  }
}

/**
 * Shows a success toast notification
 * @param toast - The toast function from useToast hook
 * @param message - Success message
 * @param title - Optional title (defaults to 'Berhasil')
 */
export function showSuccessToast(toast: any, message: string, title: string = 'Berhasil') {
  toast({
    title,
    description: message,
    variant: 'default',
  });
}

export default {
  handleApiError,
  handleLoginError,
  handleRegistrationError,
  handleCrudError,
  showErrorToast,
  showSuccessToast
};