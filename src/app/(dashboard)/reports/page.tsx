"use client";

import React, { useEffect, useState } from "react";
import {
  Download,
  Loader2,
  Trophy,
  Filter,
  CheckCircle,
  AlertCircle,
  FileText,
  Users,
} from "lucide-react";
import { jsPDF } from "jspdf";

interface Stream {
  id: string;
  name: string;
}

interface RankedStudent {
  id: string;
  studentId: string;
  totalMarks: number;
  averageScore: number;
  grade: string;
  overallPosition: number;
  classRank: number;
  remarks: string;
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
  };
}

export default function ReportsPage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [rankedResults, setRankedResults] = useState<RankedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);
  const [batchPdfLoading, setBatchPdfLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Filter states
  const [streamId, setStreamId] = useState("");
  const [academicYear, setAcademicYear] = useState("2026");
  const [term, setTerm] = useState("Term 1");

  // Fetch streams list on load
  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/reports");
        if (!res.ok) throw new Error("Failed to load reports init data");
        const json = await res.json();
        setStreams(json.streams || []);
      } catch (err: any) {
        setError(err.message || "Failed to load streams");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // Fetch ranked results when filters change
  const fetchRankings = async () => {
    if (!streamId) {
      setRankedResults([]);
      return;
    }
    setLoading(true);
    try {
      const qParams = new URLSearchParams({
        streamId,
        academicYear,
        term,
      });
      const res = await fetch(`/api/reports?${qParams.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch reports");
      const json = await res.json();
      setRankedResults(json.results || []);
    } catch (err: any) {
      setError(err.message || "Failed to load rankings");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
  }, [streamId, academicYear, term]);

  const showToast = (type: "success" | "error", message: string) => {
    if (type === "success") {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 4000);
    } else {
      setError(message);
      setTimeout(() => setError(null), 4000);
    }
  };

  // Helper to fetch report card data and generate PDF
  const generatePDFForStudent = async (studentId: string) => {
    try {
      const res = await fetch(`/api/students/${studentId}?academicYear=${academicYear}&term=${term}`);
      if (!res.ok) throw new Error("Failed to retrieve report details");
      const data = await res.json();

      const profile = data.student;
      const reportCard = data.reportCard;

      const doc = new jsPDF();

      // Color Palette
      const primaryColor = [79, 70, 229]; // Indigo rgb
      const textColor = [15, 23, 42]; // Slate 900 rgb
      const mutedTextColor = [100, 116, 139]; // Slate 500 rgb
      const tableHeaderBg = [248, 250, 252]; // Slate 50

      // Header branding
      doc.setFontSize(22);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("IKONEX ACADEMY", 105, 20, { align: "center" });

      doc.setFontSize(9);
      doc.setTextColor(mutedTextColor[0], mutedTextColor[1], mutedTextColor[2]);
      doc.setFont("helvetica", "normal");
      doc.text("P.O. Box 100-00100, Nairobi | Email: info@ikonexacademy.ac.ke | Tel: +254 700 000000", 105, 26, {
        align: "center",
      });

      // Line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(15, 30, 195, 30);

      // Title
      doc.setFontSize(13);
      doc.setTextColor(textColor[0], textColor[1], textColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text("OFFICIAL ACADEMIC REPORT CARD", 105, 39, { align: "center" });

      // Info grid
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Student Name:", 15, 48);
      doc.setFont("helvetica", "normal");
      doc.text(`${profile.firstName} ${profile.lastName}`, 42, 48);

      doc.setFont("helvetica", "bold");
      doc.text("Admission No:", 15, 54);
      doc.setFont("helvetica", "normal");
      doc.text(profile.admissionNumber, 42, 54);

      doc.setFont("helvetica", "bold");
      doc.text("Class Stream:", 15, 60);
      doc.setFont("helvetica", "normal");
      doc.text(profile.classStream.name, 42, 60);

      doc.setFont("helvetica", "bold");
      doc.text("Academic Year:", 120, 48);
      doc.setFont("helvetica", "normal");
      doc.text(reportCard.academicYear, 148, 48);

      doc.setFont("helvetica", "bold");
      doc.text("Term Period:", 120, 54);
      doc.setFont("helvetica", "normal");
      doc.text(reportCard.term, 148, 54);

      doc.setFont("helvetica", "bold");
      doc.text("Gender Status:", 120, 60);
      doc.setFont("helvetica", "normal");
      doc.text(profile.gender, 148, 60);

      // Table Header
      let y = 70;
      doc.setFillColor(tableHeaderBg[0], tableHeaderBg[1], tableHeaderBg[2]);
      doc.rect(15, y, 180, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.text("Code", 18, y + 5.5);
      doc.text("Subject Name", 38, y + 5.5);
      doc.text("Raw Score", 100, y + 5.5);
      doc.text("Grade", 135, y + 5.5);
      doc.text("Class Stream Rank", 160, y + 5.5);

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.line(15, y + 8, 195, y + 8);

      // Rows
      y += 8;
      doc.setFont("helvetica", "normal");
      (reportCard.subjects || []).forEach((sub: any) => {
        doc.text(sub.subjectCode, 18, y + 5.5);
        doc.text(sub.subjectName, 38, y + 5.5);
        doc.text(`${sub.score}%`, 100, y + 5.5);
        doc.text(sub.grade, 135, y + 5.5);
        doc.text(`${sub.position} of ${sub.totalStudents}`, 160, y + 5.5);
        doc.line(15, y + 8, 195, y + 8);
        y += 8;
      });

      // Summary Card
      y += 4;
      doc.setFillColor(241, 245, 249);
      doc.rect(15, y, 180, 24, "F");

      doc.setFont("helvetica", "bold");
      doc.text("ACADEMIC PERFORMANCE SUMMARY", 18, y + 5.5);

      doc.setFont("helvetica", "normal");
      doc.text(`Total Marks: ${reportCard.summary.totalMarks}`, 18, y + 12);
      doc.text(`Average Percentage Score: ${reportCard.summary.averageScore}%`, 18, y + 18);

      doc.text(`Mean Grade: ${reportCard.summary.grade}`, 110, y + 12);
      doc.text(`Overall Stream Rank: ${reportCard.summary.overallPosition} of ${reportCard.summary.totalStudents}`, 110, y + 18);

      // Teacher Remarks
      y += 32;
      doc.setFont("helvetica", "bold");
      doc.text("Class Teacher's Remarks:", 15, y);
      doc.setFont("helvetica", "italic");
      doc.text(`"${reportCard.summary.remarks}"`, 15, y + 6);

      // Signatures
      y += 24;
      doc.setDrawColor(180, 180, 180);
      doc.line(15, y, 70, y);
      doc.line(140, y, 195, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.text("Class Teacher's Signature", 15, y + 4);
      doc.text("Principal's Stamp & Signature", 140, y + 4);

      // Download
      doc.save(`${profile.firstName}_${profile.lastName}_Report_Card.pdf`);
    } catch (err: any) {
      showToast("error", `Failed to generate PDF for student: ${err.message}`);
    }
  };

  const downloadSinglePDF = async (studentId: string) => {
    setPdfLoadingId(studentId);
    await generatePDFForStudent(studentId);
    setPdfLoadingId(null);
  };

  const downloadAllPDFs = async () => {
    if (rankedResults.length === 0) return;
    setBatchPdfLoading(true);
    showToast("success", `Generating batch of ${rankedResults.length} report card PDFs...`);

    // Download sequentially to avoid UI thread block/overload
    for (let i = 0; i < rankedResults.length; i++) {
      const studentId = rankedResults[i].studentId;
      await generatePDFForStudent(studentId);
      // Brief sleep/delay between saves to allow browser download queuing
      await new Promise((resolve) => setTimeout(resolve, 800));
    }

    setBatchPdfLoading(false);
    showToast("success", "Completed downloading all report cards!");
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
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Academic Reports</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            View term-level academic performance ranking sheets and download report cards.
          </p>
        </div>
        {rankedResults.length > 0 && (
          <button
            onClick={downloadAllPDFs}
            disabled={batchPdfLoading}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 disabled:opacity-50 dark:shadow-none"
          >
            {batchPdfLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download All PDF Reports
          </button>
        )}
      </div>

      {/* Filter panel */}
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center">
        {/* Stream Selector */}
        <div className="flex-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Class Stream
          </label>
          <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-1 dark:border-slate-800 dark:bg-slate-950">
            <Filter className="h-4 w-4 text-slate-400" />
            <select
              value={streamId}
              onChange={(e) => setStreamId(e.target.value)}
              className="w-full py-2 text-sm text-slate-700 bg-transparent outline-none dark:text-slate-300"
            >
              <option value="">-- Choose Class Stream --</option>
              {streams.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Term Selection */}
        <div className="w-full md:w-48">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Term Period
          </label>
          <select
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          >
            <option value="Term 1">Term 1</option>
            <option value="Term 2">Term 2</option>
            <option value="Term 3">Term 3</option>
          </select>
        </div>

        {/* Year Input */}
        <div className="w-full md:w-32">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Academic Year
          </label>
          <input
            type="text"
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-white"
          />
        </div>
      </div>

      {/* Main Ranking Table Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading && streamId ? (
          <div className="flex h-64 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          </div>
        ) : !streamId ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <Users className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-sm">Please select a class stream above to display academic rankings.</p>
          </div>
        ) : rankedResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
            <FileText className="h-12 w-12 text-slate-300 mb-3" />
            <p className="font-semibold text-sm">No ranking records calculated for this term/stream.</p>
            <p className="text-xs text-slate-400 mt-1">Make sure you have entered scores and saved the mark sheet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-950/20">
                  <th className="py-3 px-6 text-center w-16">Rank</th>
                  <th className="py-3 px-6">Adm No.</th>
                  <th className="py-3 px-6">Student Name</th>
                  <th className="py-3 px-6">Gender</th>
                  <th className="py-3 px-6 text-right">Total Marks</th>
                  <th className="py-3 px-6 text-right">Average</th>
                  <th className="py-3 px-6 text-center">Grade</th>
                  <th className="py-3 px-6 text-center">Report Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {rankedResults.map((res) => {
                  const isTop3 = res.overallPosition <= 3;
                  return (
                    <tr key={res.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                      <td className="py-4 px-6 text-center">
                        {isTop3 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-50 text-xs font-black text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200">
                            {res.overallPosition}
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-500">{res.overallPosition}</span>
                        )}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">{res.student.admissionNumber}</td>
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {res.student.firstName} {res.student.lastName}
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-300">{res.student.gender}</td>
                      <td className="py-4 px-6 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {res.totalMarks}
                      </td>
                      <td className="py-4 px-6 text-right font-black text-indigo-600 dark:text-indigo-400">
                        {res.averageScore}%
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="rounded bg-indigo-50 px-2.5 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400 border border-indigo-100/50">
                          {res.grade}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => downloadSinglePDF(res.studentId)}
                          disabled={pdfLoadingId !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                        >
                          {pdfLoadingId === res.studentId ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Download className="h-3.5 w-3.5" />
                          )}
                          PDF
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
