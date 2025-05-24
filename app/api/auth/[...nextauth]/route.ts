import NextAuth from "next-auth";
import { authOptions } from "@/app/lib/auth"; // Adjusted path based on typical project structure

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
