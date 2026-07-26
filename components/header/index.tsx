/** 헤더 메인 */
import Link from "next/link";
import Navbar from "@/components/header/Navbar";
import AuthButtons from "@/components/header/auth-button";
import ThemeToggle from "@/components/header/ThemeToggle";

const Header = () => {
  const sha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7);
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-gray-950/80 px-6 py-3 backdrop-blur">
      <Link href="/" className="flex items-baseline gap-2 font-bold tracking-tight">
        <span>
          <span className="text-indigo-600 dark:text-indigo-400">JVision</span> Hub
        </span>
        <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
          v0.1{sha ? ` · ${sha}` : ""}
        </span>
      </Link>
      <Navbar />
      <div className="flex items-center gap-3">
        <ThemeToggle />
        <AuthButtons />
      </div>
    </header>
  );
};

export default Header;
