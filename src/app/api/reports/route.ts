import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/reports
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const streamId = searchParams.get("streamId") || "";
    const academicYear = searchParams.get("academicYear") || "2026";
    const term = searchParams.get("term") || "Term 1";

    let results: any[] = [];

    if (streamId) {
      results = await prisma.result.findMany({
        where: {
          student: {
            classStreamId: streamId,
            active: true,
          },
          academicYear,
          term,
        },
        include: {
          student: {
            select: {
              id: true,
              admissionNumber: true,
              firstName: true,
              lastName: true,
              gender: true,
            },
          },
        },
        orderBy: {
          overallPosition: "asc",
        },
      });
    }

    const streams = await prisma.classStream.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ results, streams });
  } catch (error: any) {
    console.error("GET Reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
