import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/assessments
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assessments = await prisma.assessment.findMany({
      include: {
        classStream: {
          select: {
            id: true,
            name: true,
          },
        },
        subject: {
          select: {
            id: true,
            subjectCode: true,
            subjectName: true,
          },
        },
        _count: {
          select: {
            scores: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const streams = await prisma.classStream.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const subjects = await prisma.subject.findMany({
      include: {
        streamSubjects: true,
      },
      orderBy: {
        subjectName: "asc",
      },
    });

    return NextResponse.json({ assessments, streams, subjects });
  } catch (error: any) {
    console.error("GET Assessments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/assessments
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN" && (session.user as any).role !== "TEACHER") {
      return NextResponse.json({ error: "Unauthorized - Administrative or Teacher access required" }, { status: 403 });
    }

    const body = await req.json();
    const { title, term, academicYear, totalMarks, classStreamId, subjectId } = body;

    if (!title || !term || !academicYear || !totalMarks || !classStreamId || !subjectId) {
      return NextResponse.json({ error: "All assessment details are required" }, { status: 400 });
    }

    const totalMarksNum = parseInt(totalMarks);
    if (isNaN(totalMarksNum) || totalMarksNum <= 0) {
      return NextResponse.json({ error: "Total marks must be a valid positive integer" }, { status: 400 });
    }

    const assessment = await prisma.assessment.create({
      data: {
        title,
        term,
        academicYear,
        totalMarks: totalMarksNum,
        classStreamId,
        subjectId,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error: any) {
    console.error("POST Assessments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
