import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/class-streams
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const streams = await prisma.classStream.findMany({
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            students: { where: { active: true } },
            streamSubjects: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    // Fetch teachers list for dropdown selection
    const teachers = await prisma.user.findMany({
      where: {
        role: {
          in: ["TEACHER", "CLASS_TEACHER"],
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ streams, teachers });
  } catch (error: any) {
    console.error("GET Class Streams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/class-streams
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Administrators only" }, { status: 403 });
    }

    const body = await req.json();
    const { name, academicYear, teacherId } = body;

    if (!name || !academicYear) {
      return NextResponse.json({ error: "Name and Academic Year are required" }, { status: 400 });
    }

    const stream = await prisma.classStream.create({
      data: {
        name,
        academicYear,
        teacherId: teacherId || null,
      },
    });

    return NextResponse.json(stream, { status: 201 });
  } catch (error: any) {
    console.error("POST Class Streams error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
