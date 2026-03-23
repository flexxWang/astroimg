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
            <div className="group relative">
              <button className="text-sm text-muted-foreground hover:text-foreground">
                发布
              </button>
              <div className="pointer-events-none absolute left-1/2 top-full z-10 w-40 -translate-x-1/2 pt-3 opacity-0 transition group-hover:opacity-100 group-hover:pointer-events-auto">
                <div className="rounded-xl border bg-white/95 p-2 shadow-lg">
                <Link
                  href="/work/create"
                  className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-slate-100"
                >
                  发布作品
                </Link>
                <Link
                  href="/post/create"
                  className="block rounded-lg px-3 py-2 text-sm text-foreground hover:bg-slate-100"
                >
                  发布帖子
                </Link>
                </div>
              </div>
            </div>
            <Link href="/drafts">草稿箱</Link>
            <Link href="/messages">私信</Link>
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
