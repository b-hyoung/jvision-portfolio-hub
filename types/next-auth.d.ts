import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    studentNo: string;
    name: string | null;
  }
  interface Session {
    user: { id: string; studentNo: string; name: string | null };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string;
    studentNo?: string;
    name?: string | null;
  }
}
