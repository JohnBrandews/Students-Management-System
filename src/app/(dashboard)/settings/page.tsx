"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import {
  Save,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sliders,
  GraduationCap,
} from "lucide-react";

interface ScaleItem {
  id?: string;
  minScore: number;
  maxScore: number;
  grade: string;
  remarks: string;
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const isAdmin =
    session?.user &&
    ((session.user as any).role === "SUPER_ADMIN" ||
      (session.user as any).role === "SCHOOL_ADMIN");

  const [scales, setScales] = useState<ScaleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGradingScales() {
      try {
        const res = await fetch("/api/settings/grading-scale");
        if (!res.ok) throw new Error("Failed to fetch grading scale");
        const json = await res.json();
        setScales(json.scales || []);
      } catch (err: any) {
        setError(err.message || "Failed to load scales");
      } finally {
        setLoading(false);
      }
    }
    fetchGradingScales();
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

  const handleInputChange = (index: number, key: keyof ScaleItem, val: string) => {
    const updated = [...scales];
    if (key === "minScore" || key === "maxScore") {
      const num = parseFloat(val);
      updated[index] = { ...updated[index], [key]: isNaN(num) ? 0 : num };
    } else {
      updated[index] = { ...updated[index], [key]: val };
    }
    setScales(updated);
  };

  const handleAddRow = () => {
    setScales([
      ...scales,
      {
        grade: "",
        minScore: 0,
        maxScore: 100,
        remarks: "",
      },
    ]);
  };

  const handleRemoveRow = (index: number) => {
    const updated = [...scales];
    updated.splice(index, 1);
    setScales(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showToast("error", "Access denied. Only school administrators can edit grading scales.");
      return;
    }

    // Client-side validations
    for (const item of scales) {
      if (!item.grade.trim()) {
        showToast("error", "All grading items must specify a Grade (e.g. A, B, C).");
        return;
      }
      if (item.minScore < 0 || item.maxScore > 100 || item.minScore > item.maxScore) {
        showToast(
          "error",
          `Invalid bounds for Grade ${item.grade}. Scores must be 0-100, and Minimum <= Maximum.`
        );
        return;
      }
    }

    setActionLoading(true);
    try {
      const res = await fetch("/api/settings/grading-scale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scales }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save grading boundaries");

      showToast("success", "Grading scales updated successfully! Academic rankings have been recalculated.");
    } catch (err: any) {
      showToast("error", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading settings...</p>
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
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Configure academic system boundaries, grading scales, and general parameters.
        </p>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Left Side: Navigation Links */}
        <div className="md:col-span-1 space-y-2">
          <button className="flex w-full items-center gap-3 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-bold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Sliders className="h-4 w-4" />
            Grading Scales
          </button>
        </div>

        {/* Right Side: Active Editor Pane */}
        <div className="md:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Grading Scale System</h3>
              <p className="text-xs text-slate-400">Define boundaries for score percentages to assign grade tiers.</p>
            </div>
            {isAdmin && (
              <button
                type="button"
                onClick={handleAddRow}
                className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Grade Tier
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                    <th className="pb-3 w-28">Grade</th>
                    <th className="pb-3 w-28">Min Score (%)</th>
                    <th className="pb-3 w-28">Max Score (%)</th>
                    <th className="pb-3">Remarks / Comment</th>
                    {isAdmin && <th className="pb-3 text-center w-16">Remove</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {scales.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-slate-400 py-8">
                        No grading scales configured yet. Click "Add Grade Tier" to start.
                      </td>
                    </tr>
                  ) : (
                    scales.map((item, idx) => (
                      <tr key={idx} className="group hover:bg-slate-50/20">
                        <td className="py-2.5">
                          <input
                            type="text"
                            placeholder="e.g. A"
                            value={item.grade}
                            onChange={(e) => handleInputChange(idx, "grade", e.target.value)}
                            disabled={!isAdmin}
                            required
                            className="w-20 rounded-xl border border-slate-200 bg-slate-50/50 py-2 text-center text-sm font-black text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-650 dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-60"
                          />
                        </td>
                        <td className="py-2.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 80"
                            value={item.minScore}
                            onChange={(e) => handleInputChange(idx, "minScore", e.target.value)}
                            disabled={!isAdmin}
                            required
                            className="w-20 rounded-xl border border-slate-200 bg-slate-50/50 py-2 text-center text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-650 dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-60"
                          />
                        </td>
                        <td className="py-2.5">
                          <input
                            type="number"
                            step="any"
                            placeholder="e.g. 100"
                            value={item.maxScore}
                            onChange={(e) => handleInputChange(idx, "maxScore", e.target.value)}
                            disabled={!isAdmin}
                            required
                            className="w-20 rounded-xl border border-slate-200 bg-slate-50/50 py-2 text-center text-sm font-semibold text-slate-900 placeholder-slate-400 outline-none focus:border-indigo-650 dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-60"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <input
                            type="text"
                            placeholder="e.g. Excellent Work"
                            value={item.remarks}
                            onChange={(e) => handleInputChange(idx, "remarks", e.target.value)}
                            disabled={!isAdmin}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-indigo-650 dark:border-slate-800 dark:bg-slate-950 dark:text-white disabled:opacity-60"
                          />
                        </td>
                        {isAdmin && (
                          <td className="py-2.5 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveRow(idx)}
                              className="rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-red-600 dark:hover:bg-slate-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {isAdmin && scales.length > 0 && (
              <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 dark:shadow-none"
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating scale...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Grading Scales
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
