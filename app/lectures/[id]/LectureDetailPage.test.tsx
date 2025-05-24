import { render, screen, act } from '@testing-library/react';
import LectureDetailPage from './page'; // Component to test
import { getServerSession } from 'next-auth/next';
import { redirect, notFound } from 'next/navigation';
// Remove direct import of authOptions, we will mock the entire module
// import { authOptions } from '@/app/api/auth/[...nextauth]/route'; 

// Mock next-auth/next
jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
  notFound: jest.fn(),
}));

// Mock the entire module that exports authOptions from its new location
jest.mock('@/app/lib/auth', () => ({
  authOptions: { /* minimal mock of authOptions if its structure is needed by getServerSession */
    providers: [], // Example property
    // Add other properties if getServerSession mock relies on them, e.g., secret
    secret: 'mockSecret',
  },
  // No need to mock GET/POST handlers as they are not in this module
}));

// Mock fetch
global.fetch = jest.fn();

// Typed mocks
const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;
const mockRedirect = redirect as jest.MockedFunction<typeof redirect>;
const mockNotFound = notFound as jest.MockedFunction<typeof notFound>;
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

describe('LectureDetailPage (Protected Route)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset fetch mock for each test to avoid interference
    mockFetch.mockReset();
  });

  test('redirects unauthenticated users to sign-in page', async () => {
    mockGetServerSession.mockResolvedValue(null); // Simulate no session

    await act(async () => {
      const Page = await LectureDetailPage({ params: { id: 1 } });
      // Render the promise returned by the async component
      render(await Page);
    });
    
    expect(mockRedirect).toHaveBeenCalledTimes(1);
    expect(mockRedirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  test('renders page content for authenticated users and fetches data', async () => {
    const mockSession = { user: { email: 'test@example.com' } };
    mockGetServerSession.mockResolvedValue(mockSession); // Simulate authenticated session

    // Mock successful fetch responses
    const mockLectureData = { id: 1, title: 'Test Lecture', lecturer: 'Dr. Test', faculty: 'Science' };
    // Corrected mockReviewsData structure based on ReviewSchema
    const mockReviewsData = [
      { 
        id: 1, 
        rating: 5, 
        content: 'Great lecture!', 
        lecture_id: 1,
        textbook: 'Recommended Text',
        attendance: 'Sometimes',
        grading_type: 'Exam and Report',
        content_difficulty: 'Moderate',
        content_quality: 'High',
        period_year: '2023',
        period_term: 'Spring',
        created_at: new Date(),
        updated_at: new Date(),
      }
    ];
    
    mockFetch
      .mockResolvedValueOnce({ // For lecture details
        ok: true,
        json: async () => mockLectureData,
      } as Response)
      .mockResolvedValueOnce({ // For reviews
        ok: true,
        json: async () => mockReviewsData,
      } as Response);

    await act(async () => {
      const Page = await LectureDetailPage({ params: { id: 1 } });
      render(await Page);
    });

    expect(mockRedirect).not.toHaveBeenCalled();
    expect(screen.getByText(mockLectureData.title)).toBeInTheDocument();
    // Ensure we are looking for 'content' which is 'Great lecture!'
    expect(screen.getByText('Great lecture!')).toBeInTheDocument(); 
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/1`);
    expect(mockFetch).toHaveBeenCalledWith(`${process.env.NEXT_PUBLIC_ENV}/api/v1/lectures/1/reviews`);
  });

  test('calls notFound if params.id is missing', async () => {
    const mockSession = { user: { email: 'test@example.com' } };
    mockGetServerSession.mockResolvedValue(mockSession);
    
    await act(async () => {
      // @ts-expect-error Testing invalid params (id missing)
      const Page = await LectureDetailPage({ params: {} }); 
      // Ensure the promise resolves before trying to render or check mocks
      try {
        render(await Page);
      } catch (e) {
        // Catch error if Page throws, e.g. due to notFound()
      }
    });
    expect(mockNotFound).toHaveBeenCalled();
  });

  test('handles lecture fetch error (404 not found for lecture)', async () => {
    const mockSession = { user: { email: 'test@example.com' } };
    mockGetServerSession.mockResolvedValue(mockSession);

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await act(async () => {
      const Page = await LectureDetailPage({ params: { id: 999 } });
      try {
        render(await Page); 
      } catch (e) {
        // Catch error if Page throws
      }
    });
    expect(mockNotFound).toHaveBeenCalled();
  });
  
  test('handles general lecture fetch error (network error)', async () => {
    const mockSession = { user: { email: 'test@example.com' } };
    mockGetServerSession.mockResolvedValue(mockSession);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    await act(async () => {
      const Page = await LectureDetailPage({ params: { id: 1 } });
      render(await Page);
    });

    expect(screen.getByText('Error loading lecture details.')).toBeInTheDocument();
  });

  test('handles reviews fetch error gracefully (warns and continues)', async () => {
    const mockSession = { user: { email: 'test@example.com' } };
    mockGetServerSession.mockResolvedValue(mockSession);

    const mockLectureData = { id: 1, title: 'Test Lecture With Failed Reviews', lecturer: 'Dr. Test', faculty: 'Science' };
    mockFetch
      .mockResolvedValueOnce({ // For lecture details (success)
        ok: true,
        json: async () => mockLectureData,
      } as Response)
      .mockResolvedValueOnce({ // For reviews (failure)
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      } as Response);
    
    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await act(async () => {
      const Page = await LectureDetailPage({ params: { id: 1 } });
      render(await Page);
    });

    expect(screen.getByText(mockLectureData.title)).toBeInTheDocument();
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining('Failed to fetch reviews: Internal Server Error'));
    consoleWarnSpy.mockRestore();
  });
});
