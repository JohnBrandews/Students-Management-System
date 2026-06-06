"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  PenTool,
  Loader2,
  CheckCircle,
  AlertCircle,
  Save,
  Trash,
  RotateCcw,
} from "lucide-react";

interface Assessment {
  id: string;
  title: string;
  term: string;
  academicYear: string;
  totalMarks: number;
  classStream: {
    name: string;
  };
  subject: {
    subjectName: string;
    subjectCode: string;
  };
}

interface Student {
  id: string;
  admissionNumber: string;
  firstName: string;
  lastName: string;
}

interface ExistingScore {
  studentId: string;
  score: number;
}

function ScoreEntrySheet() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();

  const isAuthorized =
    session?.user &&
    ((session.user as any).role === "SUPER_ADMIN" ||
      (session.user as any).role === "SCHOOL_ADMIN" ||
      (session.user as any).role === "TEACHER" ||
      (session.user as any).role === "CLASS_TEACHER");

  const queryAssessmentId = searchParams.get("assessmentId") || "";

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState(queryAssessmentId);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [scores, setScores] = useState<Record<string, string>>({}); // studentId -> score as string

  const [loading, setLoading] = useState(true);
  const [sheetLoading, setSheetLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Draft state
  const [hasDraft, setHasDraft] = useState(false);
  const [draftSavedTime, setDraftSavedTime] = useState<string | null>(null);

  // Fetch assessments initially
  useEffect(() => {
    async function fetchAssessmentsList() {
      try {
        const res = await fetch("/api/scores");
        if (!res.ok) throw new Error("Failed to load assessments");
        const json = await res.json();
        setAssessments(json.assessments || []);
      } catch (err: any) {
        setError(err.message || "Failed to load assessments list");
      } finally {
        setLoading(false);
      }
    }
    fetchAssessmentsList();
  }, []);

  // Fetch student roster and existing scores when selectedAssessmentId changes
  useEffect(() => {
    if (!selectedAssessmentId) {
      setAssessment(null);
      setStudents([]);
      setScores({});
      setHasDraft(false);
      return;
    }

    async function fetchScoreSheet() {
      setSheetLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/scores?assessmentId=${selectedAssessmentId}`);
        if (!res.ok) throw new Error("Failed to fetch score sheet");
        const json = await res.json();
        setAssessment(json.assessment);
        setStudents(json.students || []);

        // Load existing scores from DB
        const dbScores: Record<string, string> = {};
        (json.existingScores || []).forEach((item: ExistingScore) => {
          dbScores[item.studentId] = item.score.toString();
        });

        // Check if there is an unsaved local draft in localStorage
        const draftKey = `ikonex_score_draft_${selectedAssessmentId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
          try {
            const parsed = JSON.parse(savedDraft);
            setHasDraft(true);
            // Default to DB scores, but alert user that draft is available
            setScores(dbScores);
          } catch (e) {
            setScores(dbScores);
          }
        } else {
          setScores(dbScores);
          setHasDraft(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load sheet details");
      } finally {
        setSheetLoading(false);
      }
    }
    fetchScoreSheet();
  }, [selectedAssessmentId]);

  const handleAssessmentChange = (val: string) => {
    setSelectedAssessmentId(val);
    // Update URL query param quietly
    const newParams = new URLSearchParams(searchParams.toString());
    if (val) {
      newParams.set("assessmentId", val);
    } else {
      newParams.delete("assessmentId");
    }
    router.push(`/scores?${newParams.toString()}`);
  };

  const handleScoreInputChange = (studentId: string, val: string) => {
    const updated = { ...scores, [studentId]: val };
    setScores(updated);

    // Autosave to localStorage
    if (selectedAssessmentId) {
      const draftKey = `ikonex_score_draft_${selectedAssessmentId}`;
      localStorage.setItem(
        draftKey,
        JSON.stringify({
          scores: updated,
          updatedAt: new Date().toISOString(),
        })
      );
      setDraftSavedTime(new Date().toLocaleTimeString());
    }
  };

  const handleRestoreDraft = () => {
    if (!selectedAssessmentId) return;
    const draftKey = `ikonex_score_draft_${selectedAssessmentId}`;
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft);
        setScores(parsed.scores);
        setHasDraft(false);
        showToast("success", "Unsaved draft restored successfully!");
      } catch (e) {
        showToast("error", "Failed to restore draft.");
      }
    }
  };

  const handleClearDraft = () => {
    if (!selectedAssessmentId) return;
    const draftKey = `ikonex_score_draft_${selectedAssessmentId}`;
    localStorage.removeItem(draftKey);
    setHasDraft(false);
    showToast("success", "Draft cleared.");
  };

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssessmentId || !assessment) return;
    setActionLoading(true);
    setError(null);

    // Format scores and filter empty values
    const formattedScores = Object.entries(scores)
      .map(([studentId, val]) => ({
        studentId,
        score: parseFloat(val),
      }))
      .filter((s) => !isNaN(s.score));

    // Client-side validation: ensure score is between 0 and assessment.totalMarks
    for (const s of formattedScores) {
      if (s.score < 0 || s.score > assessment.totalMarks) {
        const targetStudent = students.find((st) => st.id === s.studentId);
        const name = targetStudent ? `${targetStudent.firstName} ${targetStudent.lastName}` : "Student";
        showToast("error", `Invalid score for ${name}. Marks must be between 0 and ${assessment.totalMarks}`);
        setActionLoading(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: selectedAssessmentId,
          scores: formattedScores,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to submit scores");

      // Successful submit - clear local draft
      const draftKey = `ikonex_score_draft_${selectedAssessmentId}`;
      localStorage.removeItem(draftKey);
      setHasDraft(false);
      setDraftSavedTime(null);

      showToast("success", "Scores saved successfully, and rankings recalculated!");
    } catch (err: any) {
      showToast("error", err.message || "An error occurred while saving scores.");
    } finally {
      setActionLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
        <h3 className="font-bold">Access Denied</h3>
        <p className="mt-1 text-sm">Only teachers and administrators can enter academic scores.</p>
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Academic Score Entry</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Select an assessment to log student marks, validate entries, and sync records.
        </p>
      </div>

      {/* Assessment Selector */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
          Select Academic Assessment
        </label>
        <select
          value={selectedAssessmentId}
          onChange={(e) => handleAssessmentChange(e.target.value)}
          className="mt-2 block w-full max-w-md rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
        >
          <option value="">-- Choose Assessment --</option>
          {assessments.map((a) => (
            <option key={a.id} value={a.id}>
              {a.title} ({a.classStream.name} - {a.subject.subjectCode})
            </option>
          ))}
        </select>
      </div>

      {/* Draft Recovery Notification */}
      {hasDraft && (
        <div className="flex flex-col gap-4 rounded-2xl border border-indigo-100 bg-indigo-50/40 p-4 dark:border-indigo-900/30 dark:bg-indigo-950/20 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-indigo-800 dark:text-indigo-400">
            <RotateCcw className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">
              You have an unsaved local draft for this assessment scores sheet.
            </span>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRestoreDraft}
              className="rounded-lg bg-indigo-650 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              Restore Draft
            </button>
            <button
              onClick={handleClearDraft}
              className="rounded-lg border border-indigo-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900/30 dark:bg-slate-900 dark:text-indigo-400"
            >
              Clear Draft
            </button>
          </div>
        </div>
      )}

      {/* Score sheet body */}
      {selectedAssessmentId && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
          {sheetLoading ? (
            <div className="flex h-64 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {/* Assessment Meta details header */}
              {assessment && (
                <div className="flex flex-col gap-4 bg-slate-50/50 border-b border-slate-100 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/20 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{assessment.title}</h3>
                    <p className="text-xs text-slate-500 flex flex-wrap gap-x-4">
                      <span>Stream: {assessment.classStream.name}</span>
                      <span>Subject: {assessment.subject.subjectName} ({assessment.subject.subjectCode})</span>
                      <span>Maximum Marks: {assessment.totalMarks} marks</span>
                    </p>
                  </div>
                  {draftSavedTime && (
                    <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider dark:text-indigo-400">
                      Draft autosaved at {draftSavedTime}
                    </div>
                  )}
                </div>
              )}

              {/* Roster table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                      <th className="py-3 px-6 pl-8">Admission No.</th>
                      <th className="py-3 px-6">Student Name</th>
                      <th className="py-3 px-6 text-center w-48">Score / {assessment?.totalMarks}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-center text-slate-400 py-12">
                          No active students found in this stream.
                        </td>
                      </tr>
                    ) : (
                      students.map((student) => {
                        const val = scores[student.id] || "";
                        const valNum = parseFloat(val);
                        const isInvalid =
                          val !== "" &&
                          (isNaN(valNum) || valNum < 0 || (assessment && valNum > assessment.totalMarks));

                        return (
                          <tr key={student.id} className="hover:bg-slate-50/20">
                            <td className="py-3.5 px-6 pl-8 font-mono text-slate-500">
                              {student.admissionNumber}
                            </td>
                            <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                              {student.firstName} {student.lastName}
                            </td>
                            <td className="py-3.5 px-6 text-center">
                              <div className="flex flex-col items-center">
                                <input
                                  type="number"
                                  step="any"
                                  min="0"
                                  max={assessment?.totalMarks}
                                  placeholder="Enter marks"
                                  value={val}
                                  onChange={(e) => handleScoreInputChange(student.id, e.target.value)}
                                  className={`w-32 text-center rounded-xl border ${
                                    isInvalid
                                      ? "border-red-500 focus:border-red-500 focus:ring-red-500 focus:ring-1"
                                      : "border-slate-200 focus:border-indigo-600 focus:ring-indigo-600 dark:border-slate-800"
                                  } bg-slate-50/50 py-2 text-sm text-slate-900 placeholder-slate-400 outline-none dark:bg-slate-950 dark:text-white`}
                                />
                                {isInvalid && (
                                  <span className="mt-1 text-[10px] text-red-500 font-semibold">
                                    Must be 0 - {assessment?.totalMarks}
                                  </span>
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

              {/* Submit panel footer */}
              {students.length > 0 && (
                <div className="flex justify-end gap-3 bg-slate-50/50 border-t border-slate-100 px-6 py-4 dark:border-slate-800 dark:bg-slate-950/20">
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 dark:shadow-none"
                  >
                    {actionLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving & Ranking...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Scores Sheet
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScoreEntryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ScoreEntrySheet />
    </Suspense>
  );
}

