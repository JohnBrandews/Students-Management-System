"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Layers,
  BookOpen,
  ClipboardList,
  Award,
  TrendingUp,
  UserCheck,
  Calendar,
  Activity,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";

interface DashboardData {
  metrics: {
    totalStudents: number;
    totalStreams: number;
    totalSubjects: number;
    totalAssessments: number;
    averagePerformance: number;
  };
  topStudents: Array<{
    rank: number;
    name: string;
    admissionNumber: string;
    stream: string;
    average: number;
    grade: string;
  }>;
  topClasses: Array<{
    id: string;
    name: string;
    average: number;
  }>;
  gradeDistribution: Array<{
    grade: string;
    count: number;
  }>;
  activities: Array<{
    id: string;
    type: string;
    message: string;
    date: string;
  }>;
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/dashboard/stats");
        if (!res.ok) throw new Error("Failed to load dashboard data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading metrics & charts...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h3 className="font-bold">Error</h3>
        <p className="mt-1 text-sm">{error || "Could not retrieve statistics."}</p>
      </div>
    );
  }

  const { metrics, topStudents, topClasses, gradeDistribution, activities } = data;

  const cardItems = [
    {
      title: "Total Students",
      value: metrics.totalStudents,
      icon: Users,
      color: "bg-blue-500",
      description: "Active enrollments",
    },
    {
      title: "Class Streams",
      value: metrics.totalStreams,
      icon: Layers,
      color: "bg-indigo-500",
      description: "Registered streams",
    },
    {
      title: "Subjects Offered",
      value: metrics.totalSubjects,
      icon: BookOpen,
      color: "bg-emerald-500",
      description: "Academic syllabus",
    },
    {
      title: "Assessments Conducted",
      value: metrics.totalAssessments,
      icon: ClipboardList,
      color: "bg-amber-500",
      description: "CATs & exams",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Title section */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Academy Analytics</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Real-time performance metrics and system activities.
          </p>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Calendar className="h-4 w-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
            Academic Year: 2026
          </span>
        </div>
      </div>

      {/* Grid count cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cardItems.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {card.title}
                  </span>
                  <span className="mt-2 block text-3xl font-black text-slate-900 dark:text-white">
                    {card.value}
                  </span>
                </div>
                <div className={`rounded-xl ${card.color} p-3 text-white shadow-lg shadow-indigo-100 dark:shadow-none`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
              <div className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
                {card.description}
              </div>
            </div>
          );
        })}
      </div>

      {/* Highlights & Average Score Card */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Award className="h-8 w-8" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Average School Performance
              </span>
              <span className="mt-1 block text-2xl font-black text-slate-900 dark:text-white">
                {metrics.averagePerformance}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-400">
            <TrendingUp className="h-5 w-5 text-emerald-600" />
            <span className="text-xs font-semibold">Standard performance target met</span>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Grade Distribution Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Grade Performance Distribution</h2>
          <p className="text-xs text-slate-400 mb-6">Number of students achieving each grade tier.</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={gradeDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis dataKey="grade" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                  {gradeDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Streams Chart */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Performing Streams</h2>
          <p className="text-xs text-slate-400 mb-6">Average score per class stream.</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topClasses} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} tickLine={false} domain={[0, 100]} />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={12} tickLine={false} width={80} />
                <Tooltip
                  contentStyle={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: "8px",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="average" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables and Activity Logs */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Top Students Table */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Top Performing Students</h2>
              <p className="text-xs text-slate-400">Highest average overall scores across all classes.</p>
            </div>
            <UserCheck className="h-5 w-5 text-indigo-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-855">
                  <th className="pb-3 pl-2">Rank</th>
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Adm No.</th>
                  <th className="pb-3">Class</th>
                  <th className="pb-3 text-right">Average</th>
                  <th className="pb-3 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-855">
                {topStudents.map((student) => (
                  <tr key={student.admissionNumber} className="group hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                    <td className="py-3.5 pl-2 font-bold text-slate-900 dark:text-white">#{student.rank}</td>
                    <td className="py-3.5 font-semibold text-slate-700 dark:text-slate-300">{student.name}</td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400 font-mono">{student.admissionNumber}</td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">{student.stream}</td>
                    <td className="py-3.5 text-right font-black text-indigo-600 dark:text-indigo-400">
                      {student.average}%
                    </td>
                    <td className="py-3.5 text-center">
                      <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                        {student.grade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Activities</h2>
              <p className="text-xs text-slate-400">Logs of recent database changes.</p>
            </div>
            <Activity className="h-5 w-5 text-emerald-600" />
          </div>

          <div className="space-y-6">
            {activities.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">No recent activity logged.</p>
            ) : (
              activities.map((act) => (
                <div key={act.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {act.type === "student" ? (
                      <Users className="h-4 w-4 text-blue-600" />
                    ) : (
                      <ClipboardList className="h-4 w-4 text-amber-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {act.message}
                    </p>
                    <span className="mt-1 block text-[10px] text-slate-400">
                      {new Date(act.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
