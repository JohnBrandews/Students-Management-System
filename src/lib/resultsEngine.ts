import { prisma } from "@/lib/db";

export interface SubjectResult {
  subjectId: string;
  subjectCode: string;
  subjectName: string;
  score: number;       // Student's total score in this subject (percentage)
  earnedMarks: number; // Raw marks earned
  possibleMarks: number; // Raw marks possible
  grade: string;
  position: number;    // Rank in class stream for this subject
  totalStudents: number;
}

export interface StudentReportCard {
  student: {
    id: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    classStreamId: string;
    classStreamName: string;
  };
  academicYear: string;
  term: string;
  subjects: SubjectResult[];
  summary: {
    totalMarks: number;      // Sum of subject percentage scores
    averageScore: number;    // Overall average percentage
    grade: string;
    overallPosition: number;
    totalStudents: number;
    remarks: string;
  };
}

// Helper to fetch grading scale
export async function getGradeForScore(score: number): Promise<{ grade: string; remarks: string }> {
  const gradingScales = await prisma.gradingScale.findMany({
    orderBy: { minScore: "desc" },
  });

  for (const scale of gradingScales) {
    if (score >= scale.minScore && score <= scale.maxScore) {
      return { grade: scale.grade, remarks: scale.remarks || "" };
    }
  }
  return { grade: "E", remarks: "Needs improvement" };
}

/**
 * Recomputes totals, averages, grades, and positions for all students in a given academic year & term,
 * then updates the `results` cache table.
 */
export async function recomputeResults(academicYear: string, term: string): Promise<void> {
  // Fetch active students with their scores and class streams
  const students = await prisma.student.findMany({
    where: { active: true },
    include: {
      classStream: {
        include: {
          streamSubjects: {
            include: {
              subject: true,
            },
          },
        },
      },
      scores: {
        include: {
          assessment: true,
        },
      },
    },
  });

  const summaries: Array<{
    studentId: string;
    classStreamId: string;
    totalMarks: number; // Sum of percentage scores
    averageScore: number;
    grade: string;
  }> = [];

  for (const student of students) {
    const subjects = student.classStream.streamSubjects.map((ss) => ss.subject);
    let totalPercentage = 0;
    let subjectsCount = 0;

    for (const subject of subjects) {
      // Find assessments for this subject in the given term/year
      const studentScores = student.scores.filter(
        (s) =>
          s.assessment.subjectId === subject.id &&
          s.assessment.term === term &&
          s.assessment.academicYear === academicYear
      );

      if (studentScores.length > 0) {
        let earned = 0;
        let possible = 0;
        for (const s of studentScores) {
          earned += s.score;
          possible += s.assessment.totalMarks;
        }

        const percentage = possible > 0 ? (earned / possible) * 100 : 0;
        totalPercentage += percentage;
        subjectsCount++;
      }
    }

    const average = subjectsCount > 0 ? totalPercentage / subjectsCount : 0;
    const { grade } = await getGradeForScore(average);

    summaries.push({
      studentId: student.id,
      classStreamId: student.classStreamId,
      totalMarks: totalPercentage,
      averageScore: average,
      grade,
    });
  }

  // Rank students per Class Stream
  const streams = Array.from(new Set(summaries.map((s) => s.classStreamId)));

  for (const streamId of streams) {
    const streamSummaries = summaries.filter((s) => s.classStreamId === streamId);
    // Sort descending by averageScore
    streamSummaries.sort((a, b) => b.averageScore - a.averageScore);

    // Compute positions with standard tie-breaking (1, 1, 3)
    let rank = 1;
    for (let i = 0; i < streamSummaries.length; i++) {
      if (i > 0 && streamSummaries[i].averageScore < streamSummaries[i - 1].averageScore) {
        rank = i + 1;
      }
      const summary = streamSummaries[i];

      // Upsert results cache
      await prisma.result.upsert({
        where: {
          studentId_academicYear_term: {
            studentId: summary.studentId,
            academicYear,
            term,
          },
        },
        create: {
          studentId: summary.studentId,
          academicYear,
          term,
          totalMarks: summary.totalMarks,
          averageScore: summary.averageScore,
          grade: summary.grade,
          overallPosition: rank,
        },
        update: {
          totalMarks: summary.totalMarks,
          averageScore: summary.averageScore,
          grade: summary.grade,
          overallPosition: rank,
        },
      });
    }
  }
}

/**
 * Generates a full report card structure for a single student.
 */
export async function getStudentReportCard(
  studentId: string,
  academicYear: string,
  term: string
): Promise<StudentReportCard | null> {
  const student = await prisma.student.findUnique({
    where: { id: studentId, active: true },
    include: {
      classStream: true,
      scores: {
        include: {
          assessment: true,
        },
      },
    },
  });

  if (!student) return null;

  // Retrieve cached result
  const cachedResult = await prisma.result.findUnique({
    where: {
      studentId_academicYear_term: {
        studentId,
        academicYear,
        term,
      },
    },
  });

  // If result is not cached, trigger a recompute
  if (!cachedResult) {
    await recomputeResults(academicYear, term);
  }

  const result = await prisma.result.findUnique({
    where: {
      studentId_academicYear_term: {
        studentId,
        academicYear,
        term,
      },
    },
  });

  const totalStudents = await prisma.student.count({
    where: { classStreamId: student.classStreamId, active: true },
  });

  // Get stream subjects
  const streamSubjects = await prisma.streamSubject.findMany({
    where: { streamId: student.classStreamId },
    include: { subject: true },
  });

  // For each subject, find the student's score, then compute its position within the stream
  const subjectsResults: SubjectResult[] = [];


  for (const ss of streamSubjects) {
    const sub = ss.subject;

    // Student's scores in this subject
    const studentScores = student.scores.filter(
      (s) =>
        s.assessment.subjectId === sub.id &&
        s.assessment.term === term &&
        s.assessment.academicYear === academicYear
    );

    let earnedMarks = 0;
    let possibleMarks = 0;
    for (const s of studentScores) {
      earnedMarks += s.score;
      possibleMarks += s.assessment.totalMarks;
    }

    const percentage = possibleMarks > 0 ? (earnedMarks / possibleMarks) * 100 : 0;
    const { grade } = await getGradeForScore(percentage);

    // Compute subject rank among all students in this stream
    // Find all other students' scores for this subject
    const otherStudents = await prisma.student.findMany({
      where: { classStreamId: student.classStreamId, active: true },
      include: {
        scores: {
          where: {
            assessment: {
              subjectId: sub.id,
              academicYear,
              term,
            },
          },
          include: {
            assessment: true,
          },
        },
      },
    });

    const studentAverages = otherStudents.map((os) => {
      let osEarned = 0;
      let osPossible = 0;
      for (const s of os.scores) {
        osEarned += s.score;
        osPossible += s.assessment.totalMarks;
      }
      return {
        studentId: os.id,
        average: osPossible > 0 ? (osEarned / osPossible) * 100 : 0,
      };
    });

    // Sort averages descending
    studentAverages.sort((a, b) => b.average - a.average);

    // Find position with standard tie-break
    let subjectPosition = 1;
    for (let i = 0; i < studentAverages.length; i++) {
      if (i > 0 && studentAverages[i].average < studentAverages[i - 1].average) {
        subjectPosition = i + 1;
      }
      if (studentAverages[i].studentId === student.id) {
        break;
      }
    }

    subjectsResults.push({
      subjectId: sub.id,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      score: Math.round(percentage * 100) / 100,
      earnedMarks,
      possibleMarks,
      grade,
      position: subjectPosition,
      totalStudents: studentAverages.length,
    });
  }

  const average = result?.averageScore ?? 0;
  const { remarks } = await getGradeForScore(average);

  return {
    student: {
      id: student.id,
      admissionNumber: student.admissionNumber,
      firstName: student.firstName,
      lastName: student.lastName,
      gender: student.gender,
      classStreamId: student.classStreamId,
      classStreamName: student.classStream.name,
    },
    academicYear,
    term,
    subjects: subjectsResults,
    summary: {
      totalMarks: Math.round((result?.totalMarks ?? 0) * 100) / 100,
      averageScore: Math.round(average * 100) / 100,
      grade: result?.grade ?? "E",
      overallPosition: result?.overallPosition ?? totalStudents,
      totalStudents,
      remarks,
    },
  };
}

/**
 * Returns class performance stats (Class average, subject statistics, top students, etc.)
 */
export async function getClassPerformanceReport(
  classStreamId: string,
  academicYear: string,
  term: string
) {
  const stream = await prisma.classStream.findUnique({
    where: { id: classStreamId },
    include: {
      students: {
        where: { active: true },
      },
    },
  });

  if (!stream) return null;

  // Retrieve cached results for all students in this stream
  const studentResults = await prisma.result.findMany({
    where: {
      academicYear,
      term,
      student: {
        classStreamId,
        active: true,
      },
    },
    include: {
      student: true,
    },
    orderBy: {
      averageScore: "desc",
    },
  });

  const totalStudents = studentResults.length;
  const classSum = studentResults.reduce((acc, curr) => acc + curr.averageScore, 0);
  const classAverage = totalStudents > 0 ? classSum / totalStudents : 0;

  // Top Performing Students
  const topStudents = studentResults.slice(0, 5).map((r) => ({
    studentId: r.student.id,
    name: `${r.student.firstName} ${r.student.lastName}`,
    admissionNumber: r.student.admissionNumber,
    average: Math.round(r.averageScore * 100) / 100,
    position: r.overallPosition,
    grade: r.grade,
  }));

  // Fetch stream subjects
  const streamSubjects = await prisma.streamSubject.findMany({
    where: { streamId: classStreamId },
    include: { subject: true },
  });

  // Calculate subject means
  const subjectStats = [];

  for (const ss of streamSubjects) {
    const sub = ss.subject;

    // Find all student scores for this subject in the stream
    const otherStudents = await prisma.student.findMany({
      where: { classStreamId, active: true },
      include: {
        scores: {
          where: {
            assessment: {
              subjectId: sub.id,
              academicYear,
              term,
            },
          },
          include: {
            assessment: true,
          },
        },
      },
    });

    const scoresList = otherStudents
      .map((os) => {
        let earned = 0;
        let possible = 0;
        for (const s of os.scores) {
          earned += s.score;
          possible += s.assessment.totalMarks;
        }
        return possible > 0 ? (earned / possible) * 100 : 0;
      })
      .filter((s) => s > 0);

    const subCount = scoresList.length;
    const subSum = scoresList.reduce((acc, curr) => acc + curr, 0);
    const subAverage = subCount > 0 ? subSum / subCount : 0;
    const highest = subCount > 0 ? Math.max(...scoresList) : 0;
    const lowest = subCount > 0 ? Math.min(...scoresList) : 0;

    // Pass rate: percentage of students with score >= 40%
    const passes = scoresList.filter((s) => s >= 40).length;
    const passRate = subCount > 0 ? (passes / subCount) * 100 : 0;

    subjectStats.push({
      subjectId: sub.id,
      subjectCode: sub.subjectCode,
      subjectName: sub.subjectName,
      meanScore: Math.round(subAverage * 100) / 100,
      highestScore: Math.round(highest * 100) / 100,
      lowestScore: Math.round(lowest * 100) / 100,
      passRate: Math.round(passRate * 100) / 100,
      studentCount: subCount,
    });
  }

  // Performance distribution (A: count, B: count, etc.)
  const distribution = { A: 0, B: 0, C: 0, D: 0, E: 0 };
  studentResults.forEach((r) => {
    const mainGrade = r.grade.charAt(0); // A-, B+, etc. will group as A, B
    if (mainGrade === "A") distribution.A++;
    else if (mainGrade === "B") distribution.B++;
    else if (mainGrade === "C") distribution.C++;
    else if (mainGrade === "D") distribution.D++;
    else distribution.E++;
  });

  return {
    streamName: stream.name,
    classAverage: Math.round(classAverage * 100) / 100,
    totalStudents,
    topStudents,
    subjectStats,
    distribution,
  };
}
