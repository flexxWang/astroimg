"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { login } from "@/services/userApi";
import { useUserStore } from "@/stores/userStore";

export default function LoginPage() {
  const router = useRouter();
  const setToken = useUserStore((state) => state.setToken);
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      const result = await login({ usernameOrEmail, password });
      setToken(result.data.accessToken);
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
          <h1 className="text-2xl font-semibold">欢迎回来</h1>
          <p className="text-sm text-white/60">登录进入你的天文社区</p>
        </div>
        <Input
          placeholder="用户名或邮箱"
          value={usernameOrEmail}
          onChange={(event) => setUsernameOrEmail(event.target.value)}
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
          {loading ? "登录中..." : "登录"}
        </Button>
        <p className="text-center text-sm text-white/60">
          还没有账号？{" "}
          <Link href="/register" className="text-white underline">
            立即注册
          </Link>
        </p>
      </form>
    </div>
  );
}
