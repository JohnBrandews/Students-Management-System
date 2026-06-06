"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  User,
  GraduationCap,
  Calendar,
  Phone,
  Mail,
  MapPin,
  ClipboardList,
  Download,
  AlertCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";

interface SubjectResult {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  score: number;
  earnedMarks: number;
  possibleMarks: number;
  grade: string;
  position: number;
  totalStudents: number;
}

interface ReportCardData {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    classStreamId: string;
    classStreamName: string;
  };
  academicYear: string;
  term: string;
  subjects: SubjectResult[];
  summary: {
    totalMarks: number;
    averageScore: number;
    grade: string;
    overallPosition: number;
    totalStudents: number;
    remarks: string;
  };
}

interface StudentProfile {
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
  active: boolean;
  classStream: {
    id: string;
    name: string;
    academicYear: string;
  };
}

export default function StudentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStudentProfile() {
      try {
        const res = await fetch(`/api/students/${id}`);
        if (!res.ok) throw new Error("Failed to load student details");
        const json = await res.json();
        setProfile(json.student);
        setReportCard(json.reportCard);
      } catch (err: any) {
        setError(err.message || "Failed to load profile details");
      } finally {
        setLoading(false);
      }
    }
    fetchStudentProfile();
  }, [id]);

  const handleExportPDF = () => {
    if (!reportCard || !profile) return;

    const doc = new jsPDF();

    // Color Palette
    const primaryColor = [79, 70, 229]; // Indigo rgb
    const textColor = [15, 23, 42]; // Slate 900 rgb
    const mutedTextColor = [100, 116, 139]; // Slate 500 rgb
    const tableHeaderBg = [248, 250, 252]; // Slate 50

    // Header - School Logo & Name
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

    // Decorative line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(15, 30, 195, 30);

    // Title
    doc.setFontSize(13);
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("OFFICIAL ACADEMIC REPORT CARD", 105, 39, { align: "center" });

    // Student & Term Info Grid
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

    // Subject Table Header
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

    // Subject Table Rows
    y += 8;
    doc.setFont("helvetica", "normal");
    reportCard.subjects.forEach((sub) => {
      doc.text(sub.subjectCode, 18, y + 5.5);
      doc.text(sub.subjectName, 38, y + 5.5);
      doc.text(`${sub.score}%`, 100, y + 5.5);
      doc.text(sub.grade, 135, y + 5.5);
      doc.text(`${sub.position} of ${sub.totalStudents}`, 160, y + 5.5);
      doc.line(15, y + 8, 195, y + 8);
      y += 8;
    });

    // Summary Performance Card
    y += 4;
    doc.setFillColor(241, 245, 249);
    doc.rect(15, y, 180, 24, "F");

    doc.setFont("helvetica", "bold");
    doc.text("ACADEMIC PERFORMANCE SUMMARY", 18, y + 5.5);

    doc.setFont("helvetica", "normal");
    doc.text(`Total Marks: ${reportCard.summary.totalMarks}`, 18, y + 12);
    doc.text(`Average Score: ${reportCard.summary.averageScore}%`, 18, y + 18);

    doc.text(`Mean Grade: ${reportCard.summary.grade}`, 110, y + 12);
    doc.text(`Overall Stream Rank: ${reportCard.summary.overallPosition} / ${reportCard.summary.totalStudents}`, 110, y + 18);

    // Teacher Comments
    y += 32;
    doc.setFont("helvetica", "bold");
    doc.text("Class Teacher's Remarks:", 15, y);
    doc.setFont("helvetica", "italic");
    doc.text(`"${reportCard.summary.remarks}"`, 15, y + 6);

    // Signature Area
    y += 24;
    doc.setDrawColor(180, 180, 180);
    doc.line(15, y, 70, y);
    doc.line(140, y, 195, y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text("Class Teacher's Signature", 15, y + 4);
    doc.text("Principal's Stamp & Signature", 140, y + 4);

    // Save File
    doc.save(`${profile.firstName}_${profile.lastName}_Report_Card.pdf`);
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-sm font-medium text-slate-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profile || !reportCard) {
    return (
      <div className="space-y-4">
        <Link
          href="/students"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Directory
        </Link>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-800">
          <h3 className="font-bold">Error</h3>
          <p className="mt-1 text-sm">{error || "Could not retrieve student profile."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href="/students"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Directory
      </Link>

      {/* Profile Header Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Left Card: Student Identity */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-1 flex flex-col items-center text-center justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
            <User className="h-10 w-10" />
          </div>
          <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            {profile.firstName} {profile.lastName}
          </h2>
          <span className="mt-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500 dark:bg-slate-850 dark:text-slate-400">
            Adm: {profile.admissionNumber}
          </span>
          <span className="mt-2 text-xs font-bold text-indigo-600 dark:text-indigo-400">
            Class: {profile.classStream.name}
          </span>
        </div>

        {/* Right Card: Personal Info Details */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 md:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
            Personal & Contact Details
          </h3>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2 text-sm">
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-slate-400">DATE OF BIRTH</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {new Date(profile.dateOfBirth).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-slate-400">PARENT / GUARDIAN CONTACT</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile.parentName} ({profile.parentPhone})
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-slate-400">EMAIL ADDRESS</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile.email || "No email registered"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-slate-400 shrink-0" />
              <div>
                <span className="block text-[10px] font-bold text-slate-400">RESIDENTIAL ADDRESS</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {profile.address || "No address registered"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Academic report section */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Academic Performance - Term 1, 2026</h3>
            <p className="text-xs text-slate-400">Calculated marks averages, subject ranks, and final metrics.</p>
          </div>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 dark:shadow-none"
          >
            <Download className="h-4 w-4" />
            Download Report Card (PDF)
          </button>
        </div>

        {/* Metrics summary cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Average Percentage</span>
            <span className="mt-1 block text-2xl font-black text-indigo-600 dark:text-indigo-400">
              {reportCard.summary.averageScore}%
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Grade Tier</span>
            <span className="mt-1 block text-2xl font-black text-slate-900 dark:text-white">
              {reportCard.summary.grade}
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class Position</span>
            <span className="mt-1 block text-2xl font-black text-slate-900 dark:text-white">
              Pos {reportCard.summary.overallPosition}
            </span>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Class Size</span>
            <span className="mt-1 block text-2xl font-black text-slate-900 dark:text-white">
              {reportCard.summary.totalStudents} Students
            </span>
          </div>
        </div>

        {/* Subjects scores table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800">
                <th className="pb-3 pl-2">Subject Code</th>
                <th className="pb-3">Subject Name</th>
                <th className="pb-3 text-right">Percentage Score</th>
                <th className="pb-3 text-center">Grade</th>
                <th className="pb-3 text-center">Stream Rank</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-855 text-slate-700 dark:text-slate-300">
              {reportCard.subjects.map((sub) => (
                <tr key={sub.subjectId} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/50">
                  <td className="py-3.5 pl-2 font-mono text-slate-500">{sub.subjectCode}</td>
                  <td className="py-3.5 font-bold text-slate-900 dark:text-white">{sub.subjectName}</td>
                  <td className="py-3.5 text-right font-bold text-indigo-600 dark:text-indigo-400">
                    {sub.score}%
                  </td>
                  <td className="py-3.5 text-center">
                    <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-400">
                      {sub.grade}
                    </span>
                  </td>
                  <td className="py-3.5 text-center font-semibold">
                    {sub.position} of {sub.totalStudents}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Teacher comments */}
        <div className="mt-6 border-t border-slate-100 pt-6 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">Class Teacher Remarks</h4>
          <blockquote className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-sm italic text-slate-600 dark:border-slate-800 dark:bg-slate-950/20 dark:text-slate-400">
            "{reportCard.summary.remarks}"
          </blockquote>
        </div>
      </div>
    </div>
  );
}
