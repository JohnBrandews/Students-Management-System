import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeResults } from "@/lib/resultsEngine";

// GET /api/scores
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assessmentId = searchParams.get("assessmentId");

    if (!assessmentId) {
      // Return list of all assessments to select from
      const assessments = await prisma.assessment.findMany({
        include: {
          classStream: true,
          subject: true,
        },
        orderBy: {
          title: "asc",
        },
      });
      return NextResponse.json({ assessments });
    }

    // Fetch assessment details
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: {
        classStream: true,
        subject: true,
      },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Fetch all active students in the class stream
    const students = await prisma.student.findMany({
      where: {
        classStreamId: assessment.classStreamId,
        active: true,
      },
      orderBy: {
        firstName: "asc",
      },
    });

    // Fetch existing scores for this assessment
    const existingScores = await prisma.score.findMany({
      where: { assessmentId },
    });

    return NextResponse.json({ assessment, students, existingScores });
  } catch (error: any) {
    console.error("GET Scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/scores
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN" && (session.user as any).role !== "TEACHER" && (session.user as any).role !== "CLASS_TEACHER") {
      return NextResponse.json({ error: "Unauthorized - Academic staff only" }, { status: 403 });
    }

    const body = await req.json();
    const { assessmentId, scores } = body; // scores is: Array<{ studentId: string, score: number }>

    if (!assessmentId || !scores || !Array.isArray(scores)) {
      return NextResponse.json({ error: "Assessment ID and scores are required" }, { status: 400 });
    }

    // Fetch assessment to validate max marks limit
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (!assessment) {
      return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
    }

    // Validate scores range
    for (const s of scores) {
      if (s.score < 0 || s.score > assessment.totalMarks) {
        return NextResponse.json(
          { error: `Score must be between 0 and maximum possible marks (${assessment.totalMarks})` },
          { status: 400 }
        );
      }
    }

    // Batch upsert scores in transaction
    await prisma.$transaction(
      scores.map((s) =>
        prisma.score.upsert({
          where: {
            studentId_assessmentId: {
              studentId: s.studentId,
              assessmentId,
            },
          },
          create: {
            studentId: s.studentId,
            assessmentId,
            score: s.score,
          },
          update: {
            score: s.score,
          },
        })
      )
    );

    // Recompute ranking summaries for the class stream in results table
    await recomputeResults(assessment.academicYear, assessment.term);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST Scores error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
