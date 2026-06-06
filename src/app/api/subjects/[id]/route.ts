import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PUT /api/subjects/[id]
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();
    const { subjectName, subjectCode, streamIds } = body; // streamIds is an array of strings

    if (!subjectName || !subjectCode) {
      return NextResponse.json({ error: "Subject Name and Code are required" }, { status: 400 });
    }

    // Check unique code (excluding current subject)
    const duplicate = await prisma.subject.findFirst({
      where: {
        subjectCode,
        NOT: { id },
      },
    });

    if (duplicate) {
      return NextResponse.json({ error: `Subject code "${subjectCode}" is already in use by another subject` }, { status: 400 });
    }

    // Update subject and sync stream relations in transaction
    const updatedSubject = await prisma.$transaction(async (tx) => {
      const subject = await tx.subject.update({
        where: { id },
        data: {
          subjectName,
          subjectCode,
        },
      });

      // Clear existing stream links
      await tx.streamSubject.deleteMany({
        where: { subjectId: id },
      });

      // Add new stream links
      if (streamIds && Array.isArray(streamIds) && streamIds.length > 0) {
        const streamSubjectsData = streamIds.map((streamId: string) => ({
          subjectId: id,
          streamId,
        }));

        await tx.streamSubject.createMany({
          data: streamSubjectsData,
        });
      }

      return subject;
    });

    return NextResponse.json(updatedSubject);
  } catch (error: any) {
    console.error("PUT Subject ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/subjects/[id]
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user as any).role !== "SUPER_ADMIN" && (session.user as any).role !== "SCHOOL_ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Check if there are assessments registered for this subject
    const assessmentCount = await prisma.assessment.count({
      where: { subjectId: id },
    });

    if (assessmentCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete subject. There are assessment records linked to it." },
        { status: 400 }
      );
    }

    // Delete subject (Cascade delete will handle StreamSubject entries)
    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("DELETE Subject ID error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
