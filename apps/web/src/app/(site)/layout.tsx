import Link from "next/link";
import { Button } from "@/components/ui/button";
import UserMenu from "@/components/UserMenu";
import NotificationBell from "@/components/NotificationBell";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#dbeafe,transparent_45%),radial-gradient(circle_at_top_right,#fef9c3,transparent_40%),radial-gradient(circle_at_bottom,#e9d5ff,transparent_35%)]">
      <header className="sticky top-0 z-10 border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-6">
          <Link href="/" className="text-xl font-semibold">
            Astroimg
          </Link>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/explore">探索</Link>
            <Link href="/post/create">发布</Link>
            <Link href="/drafts">草稿箱</Link>
            <Link href="/messages">私信</Link>
            <Link href="/user/astro">我的主页</Link>
          </nav>
          <div className="flex items-center gap-4">
            <NotificationBell />
            <UserMenu />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
