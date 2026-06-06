"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Plus,
  Edit2,
  Trash2,
  PenTool,
  Loader2,
  ClipboardList,
  Layers,
  BookOpen,
  Calendar,
  Award,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

interface Stream {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  subjectCode: string;
  subjectName: string;
  streamSubjects: Array<{
    streamId: string;
  }>;
}

interface Assessment {
  id: string;
  title: string;
  term: string;
  academicYear: string;
  totalMarks: number;
  classStreamId: string;
  subjectId: string;
  classStream: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    subjectCode: string;
    subjectName: string;
  };
  _count: {
    scores: number;
  };
}

export default function AssessmentsPage() {
  const { data: session } = useSession();
  const isAuthorized =
    session?.user &&
    ((session.user as any).role === "SUPER_ADMIN" ||
      (session.user as any).role === "SCHOOL_ADMIN" ||
      (session.user as any).role === "TEACHER" ||
      (session.user as any).role === "CLASS_TEACHER");

  const isAdmin =
    session?.user &&
    ((session.user as any).role === "SUPER_ADMIN" ||
      (session.user as any).role === "SCHOOL_ADMIN");

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [streams, setStreams] = useState<Stream[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    term: "Term 1",
    academicYear: new Date().getFullYear().toString(),
    totalMarks: "100",
    classStreamId: "",
    subjectId: "",
  });
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null);

  // Dynamic filtered subjects based on selected stream
  const [filteredSubjects, setFilteredSubjects] = useState<Subject[]>([]);

  const fetchAssessments = async () => {
    try {
      const res = await fetch("/api/assessments");
      if (!res.ok) throw new Error("Failed to fetch assessments");
      const data = await res.json();
      setAssessments(data.assessments);
      setStreams(data.streams);
      setSubjects(data.subjects);
    } catch (err: any) {
      setError(err.message || "Failed to load assessments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  // Filter subjects whenever classStreamId in formData changes
  useEffect(() => {
    if (formData.classStreamId) {
      const filtered = subjects.filter((sub) =>
        sub.streamSubjects.some((ss) => ss.streamId === formData.classStreamId)
      );
      setFilteredSubjects(filtered);
      // Reset subjectId if current is not in filtered list
      if (!filtered.some((f) => f.id === formData.subjectId)) {
        setFormData((prev) => ({ ...prev, subjectId: "" }));
      }
    } else {
      setFilteredSubjects([]);
    }
  }, [formData.classStreamId, subjects]);

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
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to create assessment");

      showToast("success", `Assessment "${formData.title}" created successfully!`);
      setIsCreateOpen(false);
      resetForm();
      fetchAssessments();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditClick = (assessment: Assessment) => {
    setSelectedAssessmentId(assessment.id);
    setFormData({
      title: assessment.title,
      term: assessment.term,
      academicYear: assessment.academicYear,
      totalMarks: assessment.totalMarks.toString(),
      classStreamId: assessment.classStreamId,
      subjectId: assessment.subjectId,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/assessments/${selectedAssessmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update assessment");

      showToast("success", `Assessment details updated successfully!`);
      setIsEditOpen(false);
      resetForm();
      setSelectedAssessmentId(null);
      fetchAssessments();
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (assessment: Assessment) => {
    setSelectedAssessmentId(assessment.id);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssessmentId) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/assessments/${selectedAssessmentId}`, {
        method: "DELETE",
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to delete assessment");

      showToast("success", "Assessment deleted successfully!");
      setIsDeleteOpen(false);
      setSelectedAssessmentId(null);
      fetchAssessments();
    } catch (err: any) {
      showToast("error", err.message);
      setIsDeleteOpen(false);
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      term: "Term 1",
      academicYear: new Date().getFullYear().toString(),
      totalMarks: "100",
      classStreamId: streams[0]?.id || "",
      subjectId: "",
    });
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading exams & assessments...</p>
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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Assessments & Exams</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Define continuous assessment tests (CATs) or exams per subject and stream.
          </p>
        </div>
        {isAuthorized && (
          <button
            onClick={() => {
              resetForm();
              setIsCreateOpen(true);
            }}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 dark:shadow-none"
          >
            <Plus className="h-4 w-4" />
            Create Assessment
          </button>
        )}
      </div>

      {/* Assessment Listing Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {assessments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-slate-400 col-span-full">
            No assessments defined yet. Click "Create Assessment" to start.
          </div>
        ) : (
          assessments.map((a) => (
            <div
              key={a.id}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
                      <ClipboardList className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white truncate max-w-[150px]">{a.title}</h3>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {a.term} - {a.academicYear}
                      </span>
                    </div>
                  </div>

                  {/* Actions (Update/Delete) */}
                  {isAuthorized && (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleEditClick(a)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-indigo-650 dark:hover:bg-slate-800 dark:hover:text-indigo-400"
                        title="Edit Details"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteClick(a)}
                          className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 hover:text-red-600 dark:hover:bg-slate-800 dark:hover:text-red-400"
                          title="Delete Assessment"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <hr className="my-4 border-slate-100 dark:border-slate-800" />

                <div className="space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Class Stream: {a.classStream.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Subject: {a.subject.subjectName} ({a.subject.subjectCode})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Award className="h-4 w-4 text-slate-400 shrink-0" />
                    <span>Max Marks: {a.totalMarks} marks</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>GRADING ENTRIES</span>
                  <span className="text-slate-900 dark:text-white">{a._count.scores} entries</span>
                </div>
                {/* Link to Enter scores */}
                <Link
                  href={`/scores?assessmentId=${a.id}`}
                  className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-indigo-50 py-2.5 text-xs font-bold text-indigo-700 hover:bg-indigo-100/70 transition-all dark:bg-indigo-950/30 dark:text-indigo-400"
                >
                  <PenTool className="h-4 w-4" />
                  Enter / Edit Scores
                </Link>
              </div>
            </div>
          ))
        )}
      </div>

      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsCreateOpen(false)} />
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Create Assessment</h3>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assessment Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. CAT 1, End of Term Exam"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                  disabled={!formData.classStreamId}
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-50"
                >
                  <option value="">
                    {formData.classStreamId ? "Select a Subject" : "Select Class Stream first"}
                  </option>
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectName} ({sub.subjectCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Term
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Marks possible
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
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
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Edit Assessment</h3>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Assessment Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
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
                  Subject
                </label>
                <select
                  value={formData.subjectId}
                  onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  {filteredSubjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.subjectName} ({sub.subjectCode})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Term
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    required
                    className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Total Marks possible
                </label>
                <input
                  type="number"
                  value={formData.totalMarks}
                  onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                  required
                  className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Assessment</h3>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Are you sure you want to delete this assessment? This will delete all records of this assessment. It will fail if any student grades/scores are currently registered under this assessment.
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
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Assessment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
