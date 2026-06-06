"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  Search,
  Filter,
  Loader2,
  Users,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

interface Stream {
  id: string;
  name: string;
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  email: string | null;
  address: string | null;
  classStreamId: string;
  active: boolean;
  classStream: {
    id: string;
    name: string;
  };
  results: Array<{
    averageScore: number;
    grade: string;
    overallPosition: number;
  }>;
}

export default function StudentsPage() {
  const { data: session } = useSession();
  const isAdmin =
    session?.user &&
    ((session.user as any).role === "SUPER_ADMIN" ||
      (session.user as any).role === "SCHOOL_ADMIN");

  const [students, setStudents] = useState<Student[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filters & Pagination state
  const [search, setSearch] = useState("");
  const [streamId, setStreamId] = useState("");
  const [gender, setGender] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    admissionNumber: "",
    firstName: "",
    lastName: "",
    gender: "Male",
    dateOfBirth: "",
    parentName: "",
    parentPhone: "",
    email: "",
    address: "",
    classStreamId: "",
    active: true,
  });
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        search,
        streamId,
        gender,
        page: currentPage.toString(),
        limit: "10",
      });

      const res = await fetch(`/api/students?${queryParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      const data = await res.json();
      setStudents(data.students);
      setStreams(data.streams);
      setTotalPages(data.pagination.pages);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [search, streamId, gender, currentPage]);

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to register student");

      showToast("success", `Student ${formData.firstName} registered successfully!`);
      setIsCreateOpen(false);
      resetForm();
      fetchStudents();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (student: Student) => {
    setSelectedStudentId(student.id);
    setFormData({
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      dateOfBirth: new Date(student.dateOfBirth).toISOString().split("T")[0],
      parentName: student.parentName,
      parentPhone: student.parentPhone,
      email: student.email || "",
      address: student.address || "",
      classStreamId: student.classStreamId,
      active: student.active,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${selectedStudentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update student");

      showToast("success", `Student profile updated successfully!`);
      setIsEditOpen(false);
      resetForm();
      setSelectedStudentId(null);
      fetchStudents();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (student: Student) => {
    setSelectedStudentId(student.id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedStudentId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/students/${selectedStudentId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete student");

      showToast("success", "Student soft-deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedStudentId(null);
      fetchStudents();
    } catch (err: any) {
      showToast("error", err.message);
      setIsDeleteOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      admissionNumber: "",
      firstName: "",
      lastName: "",
      gender: "Male",
      dateOfBirth: "",
      parentName: "",
      parentPhone: "",
      email: "",
      address: "",
      classStreamId: streams[0]?.id || "",
      active: true,
    });
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      {success && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <CheckCircle className="h-5 w-5" />
          <span>{success}</span>
        </div>
      )}
      {error && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-medium text-white shadow-xl">
          <AlertCircle className="h-5 w-5" />
          <span>{error}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Student Directory</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Search, filter, enroll new students, and view academic reports.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 dark:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Register Student
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute inset-y-0 left-3 my-auto h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or admission number..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-600 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          {/* Class Stream filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={streamId}
              onChange={(e) => {
                setStreamId(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2.5 text-sm text-slate-600 bg-transparent outline-none dark:text-slate-300"
            >
              <option value="">All Streams</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Gender Filter */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 dark:border-slate-800 dark:bg-slate-900">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={gender}
              onChange={(e) => {
                setGender(e.target.value);
                setCurrentPage(1);
              }}
              className="py-2.5 text-sm text-slate-600 bg-transparent outline-none dark:text-slate-300"
            >
              <option value="">All Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Listing */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="py-3 px-6">Adm No.</th>
                  <th className="py-3 px-6">Name</th>
                  <th className="py-3 px-6">Class Stream</th>
                  <th className="py-3 px-6">Gender</th>
                  <th className="py-3 px-6">Parent Info</th>
                  <th className="py-3 px-6 text-right">Term 1 Average</th>
                  <th className="py-3 px-6 text-center">Rank</th>
                  <th className="py-3 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-slate-400 py-12">
                      No students found matching the filters.
                    </td>
                  </tr>
                ) : (
                  students.map((student) => {
                    const result = student.results[0];
                    return (
                      <tr
                        key={student.id}
                        className={`group hover:bg-slate-50/50 dark:hover:bg-slate-850/50 ${
                          !student.active ? "opacity-60 bg-slate-50/20" : ""
                        }`}
                      >
                        <td className="py-4 px-6 font-mono font-semibold text-slate-500">
                          {student.admissionNumber}
                        </td>
                        <td className="py-4 px-6">
                          <span className="block font-bold text-slate-900 dark:text-white">
                            {student.firstName} {student.lastName}
                          </span>
                          {!student.active && (
                            <span className="inline-block mt-0.5 rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold text-red-600 uppercase tracking-wider">
                              Inactive
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">
                          {student.classStream.name}
                        </td>
                        <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{student.gender}</td>
                        <td className="py-4 px-6">
                          <span className="block text-slate-700 dark:text-slate-300 font-semibold text-xs">
                            {student.parentName}
                          </span>
                          <span className="block text-slate-400 text-[11px] mt-0.5">{student.parentPhone}</span>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-slate-900 dark:text-white">
                          {result ? `${Math.round(result.averageScore * 100) / 100}%` : "—"}
                        </td>
                        <td className="py-4 px-6 text-center">
                          {result ? (
                            <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                              Pos {result.overallPosition}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <Link
                              href={`/students/${student.id}`}
                              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-950 dark:hover:bg-slate-800 dark:hover:text-white"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            {isAdmin && (
                              <>
                                <button
                                  onClick={() => handleEditClick(student)}
                                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-655 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                                  title="Edit Profile"
                                >
                                  <Edit2 className="h-4 w-4" />
                                </button>
                                {student.active && (
                                  <button
                                    onClick={() => handleDeleteClick(student)}
                                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                                    title="Deactivate/Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/20">
            <span className="text-xs font-semibold text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Register Student</h3>
            <form onSubmit={handleCreateSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Admission Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. ADM/2026/001"
                  value={formData.admissionNumber}
                  onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Class Stream
                </label>
                <select
                  value={formData.classStreamId}
                  onChange={(e) => setFormData({ ...formData, classStreamId: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="">Select a Stream</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  First Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. John"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Robert Doe"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Parent/Guardian Phone
                </label>
                <input
                  type="tel"
                  placeholder="e.g. +254 712 345678"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Student/Parent Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="e.g. parent@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Home Address (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nairobi, Kenya"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 sm:col-span-2 border-t border-slate-100 mt-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enroll Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsEditOpen(false)} />
          <div className="relative w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Student Profile</h3>
            <form onSubmit={handleEditSubmit} className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Admission Number
                </label>
                <input
                  type="text"
                  value={formData.admissionNumber}
                  onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Class Stream
                </label>
                <select
                  value={formData.classStreamId}
                  onChange={(e) => setFormData({ ...formData, classStreamId: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Parent/Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Parent/Guardian Phone
                </label>
                <input
                  type="tel"
                  value={formData.parentPhone}
                  onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Student/Parent Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Home Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div className="flex items-center gap-2 mt-2 sm:col-span-2">
                <input
                  type="checkbox"
                  id="active"
                  checked={formData.active}
                  onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="active" className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Active Enrollment Status
                </label>
              </div>
              <div className="flex items-center justify-end gap-3 pt-6 sm:col-span-2 border-t border-slate-100 mt-2 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsDeleteOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deactivate Student Profile</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to deactivate this student? They will be marked as inactive and omitted from active registries, but their performance history remains preserved.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-6">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Deactivation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
