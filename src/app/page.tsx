import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";
import { authOptions } from "@/lib/auth";
import studentsImage from "@/images/students.jpg";
import teacherImage from "@/images/teacher.jpg";

const stats = [
  { label: "Students", value: "2,441", icon: Users },
  { label: "Classes", value: "48", icon: BookOpen },
  { label: "Pass rate", value: "98%", icon: TrendingUp },
  { label: "Reports", value: "12", icon: CalendarDays },
];

const featurePoints = [
  "Student and teacher dashboards",
  "Assessments, scores, and ranking",
  "Report cards and analytics",
  "Built for school administration teams",
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  const ctaHref = session ? "/dashboard" : "/auth/login";

  return (
    <main className="min-h-screen bg-[#040713] text-white">
      <div className="relative isolate overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.25),_transparent_25%),radial-gradient(circle_at_bottom_right,_rgba(34,211,238,0.16),_transparent_30%),linear-gradient(135deg,_#050816_0%,_#04050b_100%)]" />
        <div className="absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:76px_76px]" />

        <header className="relative mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 sm:px-10 lg:px-12">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_18px_40px_rgba(99,102,241,0.35)]">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-lg font-extrabold tracking-tight">Ikonex Academy</p>
              <p className="text-xs uppercase tracking-[0.32em] text-white/45">
                Student Management System
              </p>
            </div>
          </div>

          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:border-violet-400/40 hover:bg-white/10"
          >
            Sign in
            <ArrowRight className="h-4 w-4" />
          </Link>
        </header>

        <section className="relative mx-auto grid w-full max-w-7xl gap-10 px-6 pb-16 pt-6 sm:px-10 lg:grid-cols-[1fr_0.95fr] lg:px-12 lg:pb-24 lg:pt-12">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-2 text-sm font-medium text-violet-100 backdrop-blur">
              <Sparkles className="h-4 w-4 text-amber-300" />
              Learning, reporting, and administration in one place
            </div>

            <h1 className="mt-7 text-5xl font-black leading-none tracking-tight sm:text-6xl xl:text-7xl">
              A cleaner way to run{" "}
              <span className="text-violet-400">school operations</span>.
            </h1>

            <p className="mt-6 max-w-xl text-base leading-8 text-white/68 sm:text-lg">
              Ikonex Academy helps schools manage students, teachers, assessments, rankings, and
              report cards from one modern dashboard built for daily use.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-500 to-indigo-500 px-6 py-4 text-base font-bold text-white shadow-[0_20px_50px_rgba(99,102,241,0.35)] transition hover:brightness-110"
              >
                Sign in
                <ArrowRight className="h-5 w-5" />
              </Link>
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-sm text-white/70">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                Secure admin access
              </div>
            </div>

            <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {stats.map((stat) => {
                const Icon = stat.icon;

                return (
                  <div
                    key={stat.label}
                    className="rounded-3xl border border-white/10 bg-white/6 p-5 backdrop-blur-md"
                  >
                    <Icon className="h-5 w-5 text-violet-300" />
                    <p className="mt-5 text-3xl font-black">{stat.value}</p>
                    <p className="mt-1 text-sm text-white/55">{stat.label}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 grid gap-3 text-sm text-white/65 sm:grid-cols-2">
              {featurePoints.map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-4 top-6 hidden rounded-[30px] border border-white/10 bg-white/6 p-4 backdrop-blur-xl lg:block">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500">
                  <Star className="h-5 w-5 fill-current text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Trusted platform</p>
                  <p className="text-sm text-white/55">Built for daily school use</p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:pl-10">
              <div className="overflow-hidden rounded-[36px] border border-white/10 bg-white/5 shadow-[0_28px_90px_rgba(2,6,23,0.6)] backdrop-blur-xl">
                <div className="relative aspect-[4/5]">
                  <Image
                    src={studentsImage}
                    alt="Students in a classroom"
                    fill
                    priority
                    className="object-cover"
                    style={{ objectPosition: "center 22%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#040713] via-[#040713]/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <div className="rounded-[28px] border border-white/10 bg-black/25 p-4 backdrop-blur-md">
                      <p className="text-sm font-semibold text-white">Student life</p>
                      <p className="mt-1 text-sm text-white/65">
                        A clear view of learners, classes, and results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-[0.92fr_1.08fr]">
                <div className="overflow-hidden rounded-[30px] border border-white/10 bg-white/5 shadow-[0_24px_70px_rgba(2,6,23,0.45)]">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={teacherImage}
                      alt="Teacher in class"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#040713] via-transparent to-transparent" />
                  </div>
                </div>

                <div className="rounded-[30px] border border-white/10 bg-white/6 p-6 shadow-[0_24px_70px_rgba(2,6,23,0.45)] backdrop-blur-md">
                  <p className="text-sm font-semibold uppercase tracking-[0.3em] text-violet-200">
                    Why Ikonex
                  </p>
                  <p className="mt-4 text-2xl font-black leading-tight text-white">
                    Designed for schools that need speed and clarity.
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-white/65">
                    <li>Simple navigation for staff</li>
                    <li>Performance and ranking tracking</li>
                    <li>Ready for future growth</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
