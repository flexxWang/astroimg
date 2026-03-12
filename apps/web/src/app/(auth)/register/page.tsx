"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { fetchMe, register } from "@/services/userApi";
import { useUserStore } from "@/stores/userStore";

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useUserStore((state) => state.setUser);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register({ username, email, password });
      const me = await fetchMe();
      setUser(me.data);
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-8"
      >
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">加入 Astroimg</h1>
          <p className="text-sm text-white/60">创建账户，开始分享星空</p>
        </div>
        <Input
          placeholder="用户名"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className="bg-white/90 text-slate-900 placeholder:text-slate-500"
        />
        <Input
          placeholder="邮箱"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="bg-white/90 text-slate-900 placeholder:text-slate-500"
        />
        <Input
          placeholder="密码"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="bg-white/90 text-slate-900 placeholder:text-slate-500"
        />
        <Button type="submit" className="w-full" disabled={loading}>
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
  );
}
