"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Space_Grotesk } from "next/font/google";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { showErrorToast } from "@/lib/showToastMessage";
import { fetchMe, register } from "@/services/userApi";
import { useUserStore } from "@/stores/userStore";
import { useToast } from "@/hooks/useToast";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const { hasToast } = useToast();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !email.trim() || !password.trim()) {
      if (!hasToast("请填写完整信息")) {
        showErrorToast("请填写完整信息", "用户名、邮箱和密码不能为空。");
      }
      return;
    }
    setLoading(true);
    try {
      await register({ username, email, password });
      const me = await fetchMe();
      setUser(me.data);
      router.push("/");
    } catch {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative min-h-screen bg-slate-950 text-white ${spaceGrotesk.className}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-32 top-10 h-[320px] w-[320px] rounded-full bg-sky-500/20 blur-[120px]" />
        <div className="absolute right-0 top-1/3 h-[380px] w-[380px] rounded-full bg-fuchsia-500/20 blur-[140px]" />
        <div className="absolute left-1/4 bottom-0 h-[260px] w-[260px] rounded-full bg-indigo-400/20 blur-[120px]" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <div className="grid w-full gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.2em] text-white/60">
              Astroimg Community
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                开启你的观测档案，
                <br />
                记录每一次星空追踪
              </h1>
              <p className="max-w-xl text-base text-white/60">
                创建账户，建立你的观测日志、作品集与观测地图。
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                "作品瀑布流展示",
                "观测点地图记录",
                "私信与通知",
                "作品/帖子双轨内容",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="w-full space-y-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur"
          >
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold">加入 Astroimg</h2>
              <p className="text-sm text-white/60">创建账户，开始分享星空</p>
            </div>
            <div className="space-y-3">
              <label className="text-xs text-white/60">用户名</label>
              <Input
                placeholder="你的昵称"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="bg-white/90 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs text-white/60">邮箱</label>
              <Input
                placeholder="astro@example.com"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-white/90 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <div className="space-y-3">
              <label className="text-xs text-white/60">密码</label>
              <Input
                placeholder="请输入密码"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="bg-white/90 text-slate-900 placeholder:text-slate-500"
              />
            </div>
            <Button
              type="submit"
              className="h-12 w-full bg-gradient-to-r from-sky-400 via-blue-500 to-indigo-500 text-base text-white shadow-lg shadow-sky-500/20 hover:from-sky-300 hover:via-blue-400 hover:to-indigo-400"
              disabled={loading}
            >
              {loading ? "注册中..." : "注册"}
            </Button>
            <p className="text-center text-sm text-white/60">
              已经有账号？{" "}
              <Link href="/login" className="text-white underline">
                去登录
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
