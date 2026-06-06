"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import teacherImage from "@/images/teacher.jpg";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "kornexadmin@gmail.com",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setLoading(true);
    setError(null);

    try {
      const response = await signIn("credentials", {
        redirect: false,
        email: data.email.trim().toLowerCase(),
        password: data.password,
        callbackUrl,
      });

      if (response?.error) {
        setError(response.error || "Authentication failed. Please check your credentials.");
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#040713] text-white">
      <div className="relative grid min-h-screen lg:grid-cols-[0.95fr_1.05fr]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(124,58,237,0.24),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.15),_transparent_34%),linear-gradient(135deg,_#050816_0%,_#04050b_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />

        <section className="relative flex flex-col justify-between px-6 py-6 sm:px-10 lg:px-12 lg:py-10">
          <Link href="/" className="inline-flex w-fit items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_18px_40px_rgba(99,102,241,0.35)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">Ikonex Academy</p>
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">
                Back to homepage
              </p>
            </div>
          </Link>

          <div className="mt-10 max-w-2xl lg:mt-0">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Secure admin portal
            </div>

            <h1 className="mt-7 text-5xl font-black leading-none tracking-tight sm:text-6xl xl:text-7xl">
              Welcome back to{" "}
              <span className="text-violet-400">Ikonex Academy</span>.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-white/68 sm:text-lg">
              Sign in to manage students, scores, reports, and school performance from one place.
            </p>

            <div className="mt-10 overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(2,6,23,0.55)] backdrop-blur-xl">
              <div className="relative aspect-[16/10]">
                <Image
                  src={teacherImage}
                  alt="Teacher in a classroom"
                  fill
                  className="object-cover"
                  style={{ objectPosition: "center 22%" }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#040713] via-[#040713]/30 to-transparent" />
                <div className="absolute inset-0 flex items-end">
                  <div className="p-5 sm:p-6">
                    <div className="max-w-md rounded-[28px] border border-white/10 bg-black/25 p-4 backdrop-blur-md">
                      <p className="text-sm font-semibold text-white">Focused teaching</p>
                      <p className="mt-1 text-sm text-white/65">
                        Quick access for school leaders and staff.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/"
            className="mt-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-violet-400/40 hover:bg-white/10 lg:mt-0"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to homepage
          </Link>
        </section>

        <section className="relative flex items-center justify-center px-4 py-6 sm:px-8 lg:px-10">
          <div className="w-full max-w-lg rounded-[36px] border border-white/10 bg-[#070b19]/95 p-6 shadow-[0_32px_80px_rgba(2,6,23,0.65)] backdrop-blur-2xl sm:p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-violet-200">
              <ShieldCheck className="h-4 w-4" />
              Admin login
            </div>

            <h2 className="mt-6 text-3xl font-black tracking-tight text-white sm:text-4xl">
              Sign in
            </h2>
            <p className="mt-3 text-base leading-7 text-white/60">
              Use the seeded admin account to continue.
            </p>

            {error && (
              <div className="mt-6 flex items-start gap-3 rounded-2xl border border-red-400/20 bg-red-500/10 p-4 text-sm text-red-100">
                <div className="mt-0.5 rounded-full bg-red-500/20 p-1.5">
                  <AlertCircle className="h-4 w-4" />
                </div>
                <div>
                  <p className="font-semibold">Sign in failed</p>
                  <p className="mt-0.5">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-xs font-bold uppercase tracking-[0.22em] text-white/65"
                >
                  Email address
                </label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/35">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    id="email"
                    type="email"
                    placeholder="kornexadmin@gmail.com"
                    {...register("email")}
                    className={`block w-full rounded-2xl border bg-white/5 py-4 pl-12 pr-4 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:ring-2 ${
                      errors.email
                        ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/30"
                        : "border-white/10 focus:border-violet-400 focus:ring-violet-400/25"
                    }`}
                  />
                </div>
                {errors.email && <p className="mt-2 text-xs text-red-300">{errors.email.message}</p>}
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold uppercase tracking-[0.22em] text-white/65"
                  >
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-white/35">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    {...register("password")}
                    className={`block w-full rounded-2xl border bg-white/5 py-4 pl-12 pr-12 text-[15px] text-white outline-none transition placeholder:text-white/30 focus:ring-2 ${
                      errors.password
                        ? "border-red-400/70 focus:border-red-400 focus:ring-red-400/30"
                        : "border-white/10 focus:border-violet-400 focus:ring-violet-400/25"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/45 transition hover:text-white"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-2 text-xs text-red-300">{errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 py-4 text-base font-bold text-white shadow-[0_22px_50px_rgba(99,102,241,0.35)] transition hover:brightness-110 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-5 w-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-[28px] border border-dashed border-violet-400/20 bg-white/5 p-5 text-center">
              <p className="text-sm font-semibold text-white">Admin Credentials</p>
              <p className="mt-2 text-sm text-white/60">
                <span className="font-mono text-violet-300">kornexadmin@gmail.com</span> -{" "}
                <span className="font-mono text-violet-300">KornexAdmin123!</span>
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#040713]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
