import { render, screen, fireEvent, waitFor } from '../utils/testUtils';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import Auth from '../../components/Auth';

// Mock Supabase client
vi.mock('../../supabaseClient', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
    },
  },
}));

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const getMockSupabase = () => vi.mocked(await import('../../supabaseClient')).supabase;

  it('should render login form correctly', () => {
    render(<Auth />);

    expect(screen.getByText('Bienvenido al Tutor de IA')).toBeInTheDocument();
    expect(screen.getByText('Inicia sesión para guardar tu progreso.')).toBeInTheDocument();
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar enlace mágico' })).toBeInTheDocument();
  });

  it('should have email input with correct attributes', () => {
    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico') as HTMLInputElement;

    expect(emailInput.type).toBe('email');
    expect(emailInput.placeholder).toBe('tu@email.com');
    expect(emailInput.required).toBe(true);
    expect(emailInput.value).toBe('');
  });

  it('should update email input when user types', () => {
    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput).toHaveValue('test@example.com');
  });

  it('should enable submit button by default', () => {
    render(<Auth />);

    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    expect(submitButton).not.toBeDisabled();
  });

  it('should disable submit button when loading', async () => {
    mockSupabase.auth.signInWithOtp.mockImplementation(
      () => new Promise(() => {}) // Never resolves to keep loading state
    );

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveTextContent('Enviando...');
  });

  it('should submit form with valid email', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  it('should show success message on successful login', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('¡Revisa tu correo! Hemos enviado un enlace para que inicies sesión.')).toBeInTheDocument();
    });
  });

  it('should show error message on failed login', async () => {
    const errorMessage = 'Invalid email format';
    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: errorMessage },
    });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeInTheDocument();
    });
  });

  it('should clear message when user types after error', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'Invalid email' },
    });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    // First trigger an error
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
    });

    // Then type again
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Error message should be cleared
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('should not submit form with empty email', async () => {
    render(<Auth />);

    const form = screen.getByRole('form') || screen.getByText('Correo Electrónico').closest('form');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    if (form) {
      fireEvent.submit(form);
    } else {
      fireEvent.click(submitButton);
    }

    // Should not call signInWithOtp if form is invalid
    expect(mockSupabase.auth.signInWithOtp).not.toHaveBeenCalled();
  });

  it('should handle form submission on Enter key', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.submit(emailInput.closest('form')!);

    await waitFor(() => {
      expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'test@example.com',
      });
    });
  });

  it('should prevent multiple submissions while loading', async () => {
    let resolvePromise: (value: any) => void;
    mockSupabase.auth.signInWithOtp.mockReturnValue(
      new Promise(resolve => {
        resolvePromise = resolve;
      })
    );

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Click multiple times
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);
    fireEvent.click(submitButton);

    // Should only call once
    expect(mockSupabase.auth.signInWithOtp).toHaveBeenCalledTimes(1);

    // Resolve the promise
    resolvePromise!({ error: null });

    await waitFor(() => {
      expect(screen.getByText(/¡Revisa tu correo!/)).toBeInTheDocument();
    });
  });

  it('should reset loading state after successful submission', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Initially should be disabled
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Enviar enlace mágico');
    });
  });

  it('should reset loading state after failed submission', async () => {
    mockSupabase.auth.signInWithOtp.mockResolvedValue({
      error: { message: 'Network error' },
    });

    render(<Auth />);

    const emailInput = screen.getByLabelText('Correo Electrónico');
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
      expect(submitButton).toHaveTextContent('Enviar enlace mágico');
    });
  });

  it('should have proper accessibility attributes', () => {
    render(<Auth />);

    // Check for proper labeling
    expect(screen.getByLabelText('Correo Electrónico')).toBeInTheDocument();

    // Check for proper button text
    expect(screen.getByRole('button', { name: 'Enviar enlace mágico' })).toBeInTheDocument();

    // Check for proper form structure
    const form = screen.getByText('Correo Electrónico').closest('form');
    expect(form).toBeInTheDocument();
  });

  it('should have correct CSS classes and styling', () => {
    render(<Auth />);

    // Check main container
    const container = screen.getByText('Bienvenido al Tutor de IA').closest('div');
    expect(container).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center', 'p-4');

    // Check form container
    const formContainer = screen.getByText('Bienvenido al Tutor de IA').parentElement;
    expect(formContainer).toHaveClass('w-full', 'max-w-sm', 'bg-slate-800/60');

    // Check input styling
    const emailInput = screen.getByLabelText('Correo Electrónico');
    expect(emailInput).toHaveClass('w-full', 'px-3', 'py-2', 'text-white');

    // Check button styling
    const submitButton = screen.getByRole('button', { name: 'Enviar enlace mágico' });
    expect(submitButton).toHaveClass('w-full', 'bg-blue-600', 'hover:bg-blue-700');
  });
});