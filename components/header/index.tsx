/** 헤더 메인 */
import Link from "next/link";
import Navbar from "@/components/header/Navbar";
import AuthButtons from "@/components/header/auth-button";

const Header = () => {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950/80 px-6 py-3 backdrop-blur">
      <Link href="/" className="font-bold tracking-tight">
        <span className="text-indigo-400">JVision</span> Hub
      </Link>
      <Navbar />
      <AuthButtons />
    </header>
  );
};

export default Header;
