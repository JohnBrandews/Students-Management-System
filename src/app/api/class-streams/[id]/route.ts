import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getClassPerformanceReport } from "@/lib/resultsEngine";

// GET /api/class-streams/[id]
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const stream = await prisma.classStream.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
          },
        },
        students: {
          where: { active: true },
          include: {
            results: {
              take: 1,
              orderBy: { updatedAt: "desc" },
            },
          },
        },
        streamSubjects: {
          include: {
            subject: true,
          },
        },
      },
    });

    if (!stream) {
      return NextResponse.json({ error: "Class Stream not found" }, { status: 404 });
    }

    // Fetch class statistics (mean, subject averages, performance distribution)
    // Default to Term 1, 2026 for stats if none provided, or we can fetch them
    const stats = await getClassPerformanceReport(id, "2026", "Term 1");

    return NextResponse.json({ stream, stats });
  } catch (error: any) {
    console.error("GET Class Stream ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/class-streams/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { name, academicYear, teacherId } = body;

    if (!name || !academicYear) {
      return NextResponse.json({ error: "Name and Academic Year are required" }, { status: 400 });
    }

    const updatedStream = await prisma.classStream.update({
      where: { id },
      data: {
        name,
        academicYear,
        teacherId: teacherId || null,
      },
    });

    return NextResponse.json(updatedStream);
  } catch (error: any) {
    console.error("PUT Class Stream ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/class-streams/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check if there are active students in the stream
    const studentCount = await prisma.student.count({
      where: { classStreamId: id, active: true },
    });

    if (studentCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete stream. There are active students assigned to it. Please reassign them first." },
        { status: 400 }
      );
    }

    await prisma.classStream.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Class Stream ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
