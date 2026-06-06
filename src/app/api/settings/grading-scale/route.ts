import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { recomputeResults } from "@/lib/resultsEngine";

// GET /api/settings/grading-scale
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scales = await prisma.gradingScale.findMany({
      orderBy: {
        minScore: "desc",
      },
    });

    return NextResponse.json({ scales });
  } catch (error: any) {
    console.error("GET GradingScale error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/settings/grading-scale
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Admin access required" }, { status: 403 });
    }

    const body = await req.json();
    const { scales } = body; // Array of { minScore, maxScore, grade, remarks }

    if (!scales || !Array.isArray(scales) || scales.length === 0) {
      return NextResponse.json({ error: "Scales array is required" }, { status: 400 });
    }

    // Validation
    for (const scale of scales) {
      const min = parseFloat(scale.minScore);
      const max = parseFloat(scale.maxScore);

      if (isNaN(min) || isNaN(max)) {
        return NextResponse.json({ error: "Scores must be valid numbers" }, { status: 400 });
      }

      if (min < 0 || max > 100 || min > max) {
        return NextResponse.json(
          { error: `Invalid boundary for Grade ${scale.grade}: must be between 0 and 100, and min <= max` },
          { status: 400 }
        );
      }
    }

    // Update in transaction: delete all, insert new
    await prisma.$transaction(async (tx) => {
      await tx.gradingScale.deleteMany();

      const newScales = scales.map((s) => ({
        minScore: parseFloat(s.minScore),
        maxScore: parseFloat(s.maxScore),
        grade: s.grade.toUpperCase(),
        remarks: s.remarks || null,
      }));

      await tx.gradingScale.createMany({
        data: newScales,
      });
    });

    // Recompute cached rankings & grades to reflect new boundaries
    await recomputeResults("2026", "Term 1");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("POST GradingScale error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
