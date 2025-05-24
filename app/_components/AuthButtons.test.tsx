import { render, screen, fireEvent } from '@testing-library/react';
import AuthButtons from './AuthButtons'; // Adjust path as necessary
import { useSession, signIn, signOut } from 'next-auth/react';

// Mock the next-auth/react module
jest.mock('next-auth/react');

describe('AuthButtons Component', () => {
  // Typed mock for useSession
  const mockUseSession = useSession as jest.MockedFunction<typeof useSession>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('displays loading state', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    render(<AuthButtons />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  describe('when unauthenticated', () => {
    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
      render(<AuthButtons />);
    });

    test('displays "Not signed in" message', () => {
      expect(screen.getByText('Not signed in')).toBeInTheDocument();
    });

    test('displays "Sign in with Google" button', () => {
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });

    test('calls signIn("google") when "Sign in with Google" button is clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: /Sign in with Google/i }));
      expect(signIn).toHaveBeenCalledTimes(1);
      expect(signIn).toHaveBeenCalledWith('google');
    });
  });

  describe('when authenticated', () => {
    const mockSession = {
      user: { email: 'test@example.com', name: 'Test User', image: 'test-image.jpg' },
      expires: '1', // Mock expires value
    };

    beforeEach(() => {
      mockUseSession.mockReturnValue({ data: mockSession, status: 'authenticated' });
      render(<AuthButtons />);
    });

    test('displays signed in message with user email', () => {
      expect(screen.getByText(`Signed in as ${mockSession.user.email}`)).toBeInTheDocument();
    });

    test('displays "Sign out" button', () => {
      expect(screen.getByRole('button', { name: /Sign out/i })).toBeInTheDocument();
    });

    test('calls signOut when "Sign out" button is clicked', () => {
      fireEvent.click(screen.getByRole('button', { name: /Sign out/i }));
      expect(signOut).toHaveBeenCalledTimes(1);
    });
  });
});
