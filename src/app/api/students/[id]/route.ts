import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStudentReportCard } from "@/lib/resultsEngine";

// GET /api/students/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        classStream: true,
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Fetch report card details (Term 1, 2026 as standard or via query params)
    const { searchParams } = new URL(req.url);
    const academicYear = searchParams.get("academicYear") || "2026";
    const term = searchParams.get("term") || "Term 1";

    const reportCard = await getStudentReportCard(id, academicYear, term);

    return NextResponse.json({ student, reportCard });
  } catch (error: any) {
    console.error("GET Student ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/students/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const {
      admissionNumber,
      firstName,
      lastName,
      gender,
      dateOfBirth,
      parentName,
      parentPhone,
      email,
      address,
      classStreamId,
      active,
    } = body;

    // Validate fields
    if (
      !admissionNumber ||
      !firstName ||
      !lastName ||
      !gender ||
      !dateOfBirth ||
      !parentName ||
      !parentPhone ||
      !classStreamId
    ) {
      return NextResponse.json({ error: "All required fields must be provided" }, { status: 400 });
    }

    // Validate that admissionNumber is not already used by another student
    const duplicate = await prisma.student.findFirst({
      where: {
        admissionNumber,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: "Admission number is already in use by another student" }, { status: 400 });
    }

    const updatedStudent = await prisma.student.update({
      where: { id },
      data: {
        admissionNumber,
        firstName,
        lastName,
        gender,
        dateOfBirth: new Date(dateOfBirth),
        parentName,
        parentPhone,
        email: email || null,
        address: address || null,
        classStreamId,
        active: active !== undefined ? active : true,
      },
    });

    return NextResponse.json(updatedStudent);
  } catch (error: any) {
    console.error("PUT Student ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/students/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Soft delete by setting active to false
    const softDeletedStudent = await prisma.student.update({
      where: { id },
      data: { active: false },
    });

    return NextResponse.json({ success: true, student: softDeletedStudent });
  } catch (error: any) {
    console.error("DELETE Student ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
