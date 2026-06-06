import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// GET /api/students
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const streamId = searchParams.get("streamId") || "";
    const gender = searchParams.get("gender") || "";
    const status = searchParams.get("status") || "active"; // active, deleted, all
    const sortBy = searchParams.get("sortBy") || "name"; // name, admissionNumber, averageScore
    const sortOrder = searchParams.get("sortOrder") || "asc"; // asc, desc
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    // Build Prisma query clauses
    const whereClause: any = {};

    // Search filter (First name, Last name, Admission number)
    if (search) {
      whereClause.OR = [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { admissionNumber: { contains: search } },
      ];
    }

    // Stream filter
    if (streamId) {
      whereClause.classStreamId = streamId;
    }

    // Gender filter
    if (gender) {
      whereClause.gender = gender;
    }

    // Active status filter (Soft delete support)
    if (status === "active") {
      whereClause.active = true;
    } else if (status === "deleted") {
      whereClause.active = false;
    }
    // if "all", we don't apply the active filter

    // Fetch students
    // To implement sorting, we can either do it in DB or in memory
    // Let's do it in DB for standard fields (name, admissionNumber, dateOfBirth)
    // We will do it in memory for relation fields if needed, or stick to DB sorting for reliability
    let orderBy: any = {};
    if (sortBy === "admissionNumber") {
      orderBy = { admissionNumber: sortOrder };
    } else if (sortBy === "name") {
      orderBy = { firstName: sortOrder };
    } else {
      orderBy = { createdAt: "desc" };
    }

    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        classStream: {
          select: {
            id: true,
            name: true,
          },
        },
        results: {
          where: {
            academicYear: "2026",
            term: "Term 1",
          },
          select: {
            averageScore: true,
            grade: true,
            overallPosition: true,
          },
        },
      },
      orderBy,
      // For now let's paginating in DB. If sorting by results in memory, we skip DB pagination,
      // but standard DB sorting is sufficient. Let's do DB pagination:
      skip,
      take: limit,
    });

    const totalStudents = await prisma.student.count({
      where: whereClause,
    });

    // Also fetch all active streams for selection dropdowns
    const streams = await prisma.classStream.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      students,
      pagination: {
        total: totalStudents,
        pages: Math.ceil(totalStudents / limit),
        currentPage: page,
      },
      streams,
    });
  } catch (error: any) {
    console.error("GET Students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/students
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized - Administrators only" }, { status: 403 });
    }

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
    } = body;

    // Validate required fields
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

    // Check if admission number is unique
    const existingStudent = await prisma.student.findUnique({
      where: { admissionNumber },
    });

    if (existingStudent) {
      return NextResponse.json({ error: "Admission number is already in use" }, { status: 400 });
    }

    const student = await prisma.student.create({
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
      },
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: any) {
    console.error("POST Students error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
