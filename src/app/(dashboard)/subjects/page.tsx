"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Plus,
  Edit2,
  Trash2,
  Loader2,
  BookOpen,
  Layers,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Stream {
  id: string;
  name: string;
}

interface StreamSubject {
  stream: {
    id: string;
    name: string;
  };
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  streamSubjects: StreamSubject[];
}

export default function SubjectsPage() {
  const { data: session } = useSession();
  const isAdmin =
    session?.user &&
    ((session.user as any).role === "SUPER_ADMIN" ||
      (session.user as any).role === "SCHOOL_ADMIN");

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState<{
    subjectName: string;
    subjectCode: string;
    streamIds: string[];
  }>({
    subjectName: "",
    subjectCode: "",
    streamIds: [],
  });
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);

  const fetchSubjects = async () => {
    try {
      const res = await fetch("/api/subjects");
      if (!res.ok) throw new Error("Failed to fetch subjects");
      const data = await res.json();
      setSubjects(data.subjects);
      setStreams(data.streams);
    } catch (err: any) {
      setError(err.message || "Failed to load subjects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleStreamCheckboxChange = (streamId: string, checked: boolean) => {
    const currentIds = [...formData.streamIds];
    if (checked) {
      currentIds.push(streamId);
    } else {
      const idx = currentIds.indexOf(streamId);
      if (idx > -1) currentIds.splice(idx, 1);
    }
    setFormData({ ...formData, streamIds: currentIds });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create subject");

      showToast("success", `Subject "${formData.subjectName}" created successfully!`);
      setIsCreateOpen(false);
      resetForm();
      fetchSubjects();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setFormData({
      subjectName: subject.subjectName,
      subjectCode: subject.subjectCode,
      streamIds: subject.streamSubjects.map((ss) => ss.stream.id),
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/subjects/${selectedSubjectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update subject");

      showToast("success", `Subject updated successfully!`);
      setIsEditOpen(false);
      resetForm();
      setSelectedSubjectId(null);
      fetchSubjects();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (subject: Subject) => {
    setSelectedSubjectId(subject.id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSubjectId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/subjects/${selectedSubjectId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete subject");

      showToast("success", "Subject deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedSubjectId(null);
      fetchSubjects();
    } catch (err: any) {
      showToast("error", err.message);
      setIsDeleteOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      subjectName: "",
      subjectCode: "",
      streamIds: [],
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading syllabus subjects...</p>
        </div>
      </div>
    );
  }

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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Academic Subjects</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define subjects and map them to their respective class streams.
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
            Add Subject
          </button>
        )}
      </div>

      {/* Subject list */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {subjects.map((sub) => (
          <div
            key={sub.id}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">{sub.subjectName}</h3>
                  <span className="text-xs font-mono font-bold text-slate-400">Code: {sub.subjectCode}</span>
                </div>
              </div>

              {/* Action buttons */}
              {isAdmin && (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleEditClick(sub)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-600 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(sub)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <hr className="my-4 border-slate-100 dark:border-slate-800" />

            {/* Assigned Streams */}
            <div>
              <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">
                <Layers className="h-3.5 w-3.5" /> Assigned Streams ({sub.streamSubjects.length})
              </span>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {sub.streamSubjects.length === 0 ? (
                  <span className="text-xs text-slate-400 italic">Not assigned to any class stream yet.</span>
                ) : (
                  sub.streamSubjects.map((ss) => (
                    <span
                      key={ss.stream.id}
                      className="rounded-lg bg-indigo-50/50 border border-indigo-100/50 px-2 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/20 dark:border-indigo-900/30 dark:text-indigo-400"
                    >
                      {ss.stream.name}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Add Subject</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Mathematics, English Language"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. MAT, ENG, BIO"
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Class Streams Assigning */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Assign to Class Streams
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  {streams.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.streamIds.includes(s.id)}
                        onChange={(e) => handleStreamCheckboxChange(s.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                  {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
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
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Subject</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject Name
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Subject Code
                </label>
                <input
                  type="text"
                  value={formData.subjectCode}
                  onChange={(e) => setFormData({ ...formData, subjectCode: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {/* Class Streams Assigning */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Assign to Class Streams
                </label>
                <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950">
                  {streams.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                      <input
                        type="checkbox"
                        checked={formData.streamIds.includes(s.id)}
                        onChange={(e) => handleStreamCheckboxChange(s.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Subject</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete this subject? This action will remove all stream mappings and cannot be undone. It will fail if any assessment scores are currently registered under this subject.
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
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Subject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
