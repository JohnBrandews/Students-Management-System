import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT /api/assessments/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN" && (session.user as any).role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { title, term, academicYear, totalMarks, classStreamId, subjectId } = body;

    if (!title || !term || !academicYear || !totalMarks || !classStreamId || !subjectId) {
      return NextResponse.json({ error: "All assessment details are required" }, { status: 400 });
    }

    const totalMarksNum = parseInt(totalMarks);
    if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
      return NextResponse.json({ error: "Total marks must be a valid positive integer" }, { status: 400 });
    }

    // Check if there are already scores entered for this assessment,
    // if so, we can let them edit details, but maybe not totalMarks if it conflicts with entered scores.
    if (totalMarksNum) {
      const highestScore = await prisma.score.aggregate({
        where: { assessmentId: id },
        _max: { score: true },
      });

      if (highestScore._max.score && highestScore._max.score > totalMarksNum) {
        return NextResponse.json(
          {
            error: `Cannot reduce total marks to ${totalMarksNum}. There are existing scores entered up to ${highestScore._max.score} marks.`,
          },
          { status: 400 }
        );
      }
    }

    const updatedAssessment = await prisma.assessment.update({
      where: { id },
      data: {
        title,
        term,
        academicYear,
        totalMarks: totalMarksNum,
        classStreamId,
        subjectId,
      },
    });

    return NextResponse.json(updatedAssessment);
  } catch (error: any) {
    console.error("PUT Assessment ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/assessments/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check if there are scores entered for this assessment
    const scoreCount = await prisma.score.count({
      where: { assessmentId: id },
    });

    if (scoreCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete assessment. There are grades/scores registered under this assessment. Please clear them first." },
        { status: 400 }
      );
    }

    await prisma.assessment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Assessment ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
