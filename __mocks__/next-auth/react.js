export const useSession = jest.fn();
export const signIn = jest.fn();
export const signOut = jest.fn();

// You can add a SessionProvider mock if needed for other tests,
// but for AuthButtons, mocking useSession is usually sufficient.
export const SessionProvider = ({ children }) => children;
