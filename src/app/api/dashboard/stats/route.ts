import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Core Metrics Counts
    const totalStudents = await prisma.student.count({ where: { active: true } });
    const totalStreams = await prisma.classStream.count();
    const totalSubjects = await prisma.subject.count();
    const totalAssessments = await prisma.assessment.count();

    // 2. Average School Performance
    const avgPerfResult = await prisma.result.aggregate({
      _avg: {
        averageScore: true,
      },
    });
    const averagePerformance = avgPerfResult._avg.averageScore
      ? Math.round(avgPerfResult._avg.averageScore * 100) / 100
      : 0;

    // 3. Top Performing Students
    const topResults = await prisma.result.findMany({
      take: 5,
      orderBy: {
        averageScore: "desc",
      },
      include: {
        student: {
          include: {
            classStream: true,
          },
        },
      },
    });

    const topStudents = topResults.map((r, index) => ({
      rank: index + 1,
      name: `${r.student.firstName} ${r.student.lastName}`,
      admissionNumber: r.student.admissionNumber,
      stream: r.student.classStream.name,
      average: Math.round(r.averageScore * 100) / 100,
      grade: r.grade,
    }));

    // 4. Top Performing Classes (Streams)
    const allResults = await prisma.result.findMany({
      include: {
        student: {
          select: {
            classStreamId: true,
          },
        },
      },
    });

    const streamPerformanceMap: Record<string, { total: number; count: number }> = {};
    for (const r of allResults) {
      const streamId = r.student.classStreamId;
      if (!streamPerformanceMap[streamId]) {
        streamPerformanceMap[streamId] = { total: 0, count: 0 };
      }
      streamPerformanceMap[streamId].total += r.averageScore;
      streamPerformanceMap[streamId].count += 1;
    }

    const streams = await prisma.classStream.findMany();
    const classPerformanceList = streams.map((s) => {
      const perf = streamPerformanceMap[s.id];
      const avg = perf && perf.count > 0 ? perf.total / perf.count : 0;
      return {
        id: s.id,
        name: s.name,
        average: Math.round(avg * 100) / 100,
      };
    });

    // Sort descending by average
    classPerformanceList.sort((a, b) => b.average - a.average);
    const topClasses = classPerformanceList.slice(0, 5);

    // 5. Recent Activities (Fetch last 2 students, last 2 assessments, last 2 scores)
    const recentStudents = await prisma.student.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
    });

    const recentAssessments = await prisma.assessment.findMany({
      take: 3,
      orderBy: { createdAt: "desc" },
      include: {
        subject: true,
        classStream: true,
      },
    });

    const activities: Array<{ id: string; type: string; message: string; date: Date }> = [];

    recentStudents.forEach((s) => {
      activities.push({
        id: `student-${s.id}`,
        type: "student",
        message: `Registered student ${s.firstName} ${s.lastName} (Adm: ${s.admissionNumber})`,
        date: s.createdAt,
      });
    });

    recentAssessments.forEach((a) => {
      activities.push({
        id: `assessment-${a.id}`,
        type: "assessment",
        message: `Created assessment "${a.title}" for ${a.classStream.name} - ${a.subject.subjectName}`,
        date: a.createdAt,
      });
    });

    // Sort activities by date descending
    activities.sort((a, b) => b.date.getTime() - a.date.getTime());

    // 6. Grade Performance Distribution (Chart data)
    // Counts of grades: A/A-, B+/B/B-, C, D, E
    const gradeDistribution = [
      { grade: "A", count: 0 },
      { grade: "B", count: 0 },
      { grade: "C", count: 0 },
      { grade: "D", count: 0 },
      { grade: "E", count: 0 },
    ];

    allResults.forEach((r) => {
      const g = r.grade.charAt(0);
      const target = gradeDistribution.find((d) => d.grade === g);
      if (target) {
        target.count++;
      } else {
        // Fallback for E/others
        gradeDistribution[4].count++;
      }
    });

    return NextResponse.json({
      metrics: {
        totalStudents,
        totalStreams,
        totalSubjects,
        totalAssessments,
        averagePerformance,
      },
      topStudents,
      topClasses,
      gradeDistribution,
      activities: activities.slice(0, 5),
    });
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
