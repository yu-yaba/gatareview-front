export const redirect = jest.fn();
export const notFound = jest.fn(() => {
  // Simulate the behavior of notFound by throwing an error or returning a specific structure
  // For testing, just logging or doing nothing might be sufficient
  console.log('notFound mock called');
  // Or throw new Error('NOT_FOUND');
});

// Mock other exports from next/navigation if your component uses them
// For example, if LectureDetailPage uses useRouter:
export const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  // Add other router methods if needed
}));

// Mock usePathname, useSearchParams, etc., if necessary
export const usePathname = jest.fn(() => '/mock-path');
export const useSearchParams = jest.fn(() => new URLSearchParams());
