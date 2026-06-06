"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  Users,
  BookOpen,
  TrendingUp,
  User,
  GraduationCap,
  Calendar,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  parentName: string;
  parentPhone: string;
  results: Array<{
    averageScore: number;
    grade: string;
    overallPosition: number;
  }>;
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
}

interface StreamDetailsData {
  stream: {
    id: string;
    name: string;
    academicYear: string;
    teacher: {
      name: string;
    } | null;
    students: Student[];
    streamSubjects: Array<{
      subject: Subject;
    }>;
  };
  stats: {
    streamName: string;
    classAverage: number;
    totalStudents: number;
    topStudents: Array<{
      name: string;
      average: number;
      grade: string;
      position: number;
    }>;
    subjectStats: Array<{
      subjectId: string;
      subjectCode: string;
      subjectName: string;
      meanScore: number;
      highestScore: number;
      lowestScore: number;
      passRate: number;
    }>;
    distribution: {
      A: number;
      B: number;
      C: number;
      D: number;
      E: number;
    };
  } | null;
}

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function ClassStreamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<StreamDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"students" | "subjects" | "analytics">("students");

  useEffect(() => {
    async function fetchDetails() {
      try {
        const res = await fetch(`/api/class-streams/${id}`);
        if (!res.ok) throw new Error("Failed to fetch class stream details");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading stream details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="space-y-4">
        <Link
          href="/class-streams"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Streams
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h3 className="font-bold">Error</h3>
          <p className="mt-1 text-sm">{error || "Could not retrieve details."}</p>
        </div>
      </div>
    );
  }

  const { stream, stats } = data;
  const subjects = stream.streamSubjects.map((ss) => ss.subject);

  // Distribution chart data
  const distData = stats
    ? [
        { name: "A", value: stats.distribution.A },
        { name: "B", value: stats.distribution.B },
        { name: "C", value: stats.distribution.C },
        { name: "D", value: stats.distribution.D },
        { name: "E", value: stats.distribution.E },
      ].filter((d) => d.value > 0)
    : [];

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/class-streams"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Streams
      </Link>

      {/* Header Cards Info */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <GraduationCap className="h-8 w-8" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">{stream.name}</h1>
              <p className="mt-1 flex flex-wrap items-center gap-x-4 text-xs font-semibold text-slate-400">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> Academic Year: {stream.academicYear}
                </span>
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5" /> Class Teacher: {stream.teacher ? stream.teacher.name : "None"}
                </span>
              </p>
            </div>
          </div>
          {stats && (
            <div className="flex items-center gap-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 px-6 py-3 dark:bg-indigo-950/20 dark:border-indigo-900/30">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Class Average
                </span>
                <span className="block text-xl font-black text-slate-900 dark:text-white">
                  {stats.classAverage}%
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab("students")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-bold transition-all ${
            activeTab === "students"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Users className="h-4 w-4" />
          Students ({stream.students.length})
        </button>
        <button
          onClick={() => setActiveTab("subjects")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-bold transition-all ${
            activeTab === "subjects"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <BookOpen className="h-4 w-4" />
          Subjects ({subjects.length})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`flex items-center gap-2 border-b-2 px-6 py-3.5 text-sm font-bold transition-all ${
            activeTab === "analytics"
              ? "border-indigo-600 text-indigo-600"
              : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          Class Analytics
        </button>
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {/* STUDENTS TAB */}
        {activeTab === "students" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Registered Students</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="pb-3 pl-2">Adm No.</th>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Gender</th>
                    <th className="pb-3">Parent Name</th>
                    <th className="pb-3">Parent Phone</th>
                    <th className="pb-3 text-right">Term 1 Average</th>
                    <th className="pb-3 text-center">Rank</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stream.students.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center text-slate-400 py-8">
                        No students enrolled in this stream yet.
                      </td>
                    </tr>
                  ) : (
                    stream.students.map((student) => {
                      const latestRes = student.results[0];
                      return (
                        <tr key={student.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                          <td className="py-3.5 pl-2 font-mono text-slate-500 dark:text-slate-400">
                            {student.admissionNumber}
                          </td>
                          <td className="py-3.5 font-bold text-slate-900 dark:text-white">
                            <Link href={`/students/${student.id}`} className="hover:text-indigo-600">
                              {student.firstName} {student.lastName}
                            </Link>
                          </td>
                          <td className="py-3.5 text-slate-600 dark:text-slate-300">{student.gender}</td>
                          <td className="py-3.5 text-slate-600 dark:text-slate-300">{student.parentName}</td>
                          <td className="py-3.5 text-slate-500 dark:text-slate-400">{student.parentPhone}</td>
                          <td className="py-3.5 text-right font-black text-slate-900 dark:text-white">
                            {latestRes ? `${Math.round(latestRes.averageScore * 100) / 100}%` : "—"}
                          </td>
                          <td className="py-3.5 text-center">
                            {latestRes ? (
                              <span className="rounded bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                                Pos {latestRes.overallPosition}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SUBJECTS TAB */}
        {activeTab === "subjects" && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Assigned Subjects</h2>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {subjects.length === 0 ? (
                <p className="text-center text-slate-400 py-8 col-span-full">No subjects assigned to this stream.</p>
              ) : (
                subjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                      <span className="text-xs font-black">{sub.subjectCode}</span>
                    </div>
                    <div>
                      <span className="block text-sm font-bold text-slate-900 dark:text-white">
                        {sub.subjectName}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            {stats ? (
              <>
                {/* Subject Means and Distribution */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Subject statistics */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:col-span-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Subject Performance Stats
                    </h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800 uppercase tracking-wider font-semibold">
                            <th className="pb-3">Subject</th>
                            <th className="pb-3 text-right">Mean</th>
                            <th className="pb-3 text-right">Highest</th>
                            <th className="pb-3 text-right">Lowest</th>
                            <th className="pb-3 text-right">Pass Rate</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                          {stats.subjectStats.map((sub) => (
                            <tr key={sub.subjectId}>
                              <td className="py-3 font-semibold text-slate-900 dark:text-white">
                                {sub.subjectName} ({sub.subjectCode})
                              </td>
                              <td className="py-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                {sub.meanScore}%
                              </td>
                              <td className="py-3 text-right text-emerald-600 font-medium">{sub.highestScore}%</td>
                              <td className="py-3 text-right text-red-500 font-medium">{sub.lowestScore}%</td>
                              <td className="py-3 text-right">
                                <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                                  {sub.passRate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Distribution Card */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
                      Grade Performance Distribution
                    </h3>
                    <div className="flex h-56 w-full items-center justify-center">
                      {distData.length === 0 ? (
                        <p className="text-center text-xs text-slate-400">No grades processed yet.</p>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={distData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {distData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                    {/* Legend */}
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      {distData.map((d, index) => (
                        <div key={d.name} className="flex items-center gap-1">
                          <span
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span>
                            Grade {d.name} ({d.value})
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Subject Means Chart */}
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">Subject Means</h3>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.subjectStats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                        <XAxis dataKey="subjectCode" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar dataKey="meanScore" fill="#4f46e5" radius={[4, 4, 0, 0]}>
                          {stats.subjectStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center text-slate-400 py-8">No performance analytics compiled yet.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
