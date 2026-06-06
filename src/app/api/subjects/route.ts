import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/subjects
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const subjects = await prisma.subject.findMany({
      include: {
        streamSubjects: {
          include: {
            stream: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: {
        subjectName: "asc",
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

    return NextResponse.json({ subjects, streams });
  } catch (error: any) {
    console.error("GET Subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/subjects
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Administrators only" }, { status: 403 });
    }

    const body = await req.json();
    const { subjectName, subjectCode, streamIds } = body; // streamIds is an array of strings

    if (!subjectName || !subjectCode) {
      return NextResponse.json({ error: "Subject Name and Code are required" }, { status: 400 });
    }

    // Check unique code
    const duplicate = await prisma.subject.findUnique({
      where: { subjectCode },
    });

    if (duplicate) {
      return NextResponse.json({ error: `Subject code "${subjectCode}" is already in use` }, { status: 400 });
    }

    // Transaction to create subject and link streams
    const result = await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.create({
        data: {
          subjectName,
          subjectCode,
        },
      });

      if (streamIds && Array.isArray(streamIds) && streamIds.length > 0) {
        const streamSubjectsData = streamIds.map((streamId: string) => ({
          subjectId: subject.id,
          streamId,
        }));

        await tx.streamSubject.createMany({
          data: streamSubjectsData,
        });
      }

      return subject;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("POST Subjects error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
