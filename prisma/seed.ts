import { prisma } from "../src/lib/db";
import * as bcrypt from "bcryptjs";

async function main() {
  console.log("Starting database seeding...");

  // 1. Clean existing data
  await prisma.result.deleteMany({});
  await prisma.score.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.streamSubject.deleteMany({});
  await prisma.student.deleteMany({});
  await prisma.classStream.deleteMany({});
  await prisma.subject.deleteMany({});
  await prisma.gradingScale.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Database cleared.");

  // 2. Hash password for the single admin account
  const adminPasswordHash = await bcrypt.hash("KornexAdmin123!", 10);

  // 3. Create Admin User
  const admin = await prisma.user.create({
    data: {
      name: "Kornex Admin",
      email: "kornexadmin@gmail.com",
      password: adminPasswordHash,
      role: "SUPER_ADMIN",
    },
  });
  console.log(`Created Super Admin: ${admin.email}`);

  // 4. Create Class Streams
  const stream1A = await prisma.classStream.create({
    data: {
      name: "Form 1A",
      academicYear: "2026",
    },
  });
  const stream1B = await prisma.classStream.create({
    data: {
      name: "Form 1B",
      academicYear: "2026",
    },
  });
  const stream2A = await prisma.classStream.create({
    data: {
      name: "Form 2A",
      academicYear: "2026",
    },
  });
  console.log("Created Class Streams.");

  // 5. Create Subjects
  const math = await prisma.subject.create({
    data: { subjectCode: "MAT", subjectName: "Mathematics", description: "Core Mathematics" },
  });
  const eng = await prisma.subject.create({
    data: { subjectCode: "ENG", subjectName: "English", description: "Language and Literature" },
  });
  const sci = await prisma.subject.create({
    data: { subjectCode: "SCI", subjectName: "Science", description: "General Integrated Sciences" },
  });
  const his = await prisma.subject.create({
    data: { subjectCode: "HIS", subjectName: "History", description: "History & Government" },
  });
  const geo = await prisma.subject.create({
    data: { subjectCode: "GEO", subjectName: "Geography", description: "Physical and Human Geography" },
  });
  console.log("Created Subjects.");

  // 6. Assign Subjects to Class Streams (StreamSubjects)
  const streamSubjectsData = [
    // Form 1A
    { streamId: stream1A.id, subjectId: math.id },
    { streamId: stream1A.id, subjectId: eng.id },
    { streamId: stream1A.id, subjectId: sci.id },
    { streamId: stream1A.id, subjectId: his.id },
    // Form 1B
    { streamId: stream1B.id, subjectId: math.id },
    { streamId: stream1B.id, subjectId: eng.id },
    { streamId: stream1B.id, subjectId: sci.id },
    { streamId: stream1B.id, subjectId: geo.id },
    // Form 2A
    { streamId: stream2A.id, subjectId: math.id },
    { streamId: stream2A.id, subjectId: eng.id },
    { streamId: stream2A.id, subjectId: sci.id },
    { streamId: stream2A.id, subjectId: his.id },
    { streamId: stream2A.id, subjectId: geo.id },
  ];

  for (const item of streamSubjectsData) {
    await prisma.streamSubject.create({ data: item });
  }
  console.log("Assigned subjects to streams.");

  // 7. Create Grading Scales
  const scales = [
    { minScore: 80, maxScore: 100, grade: "A", remarks: "Excellent performance" },
    { minScore: 75, maxScore: 79.9, grade: "A-", remarks: "Very good effort" },
    { minScore: 70, maxScore: 74.9, grade: "B+", remarks: "Good progress" },
    { minScore: 65, maxScore: 69.9, grade: "B", remarks: "Satisfactory" },
    { minScore: 60, maxScore: 64.9, grade: "B-", remarks: "Fairly average" },
    { minScore: 50, maxScore: 59.9, grade: "C", remarks: "Pass" },
    { minScore: 40, maxScore: 49.9, grade: "D", remarks: "Below average" },
    { minScore: 0, maxScore: 39.9, grade: "E", remarks: "Needs improvement" },
  ];

  for (const scale of scales) {
    await prisma.gradingScale.create({ data: scale });
  }
  console.log("Created Grading Scales.");

  // 8. Create Students
  const students1A = [
    { admissionNumber: "1001", firstName: "John", lastName: "Kamau", gender: "Male", dateOfBirth: new Date("2012-05-15"), parentName: "Samuel Kamau", parentPhone: "0712345678", email: "john.kamau@gmail.com", classStreamId: stream1A.id },
    { admissionNumber: "1002", firstName: "Grace", lastName: "Ochieng", gender: "Female", dateOfBirth: new Date("2012-08-20"), parentName: "Mary Ochieng", parentPhone: "0722345678", email: "grace.ochieng@gmail.com", classStreamId: stream1A.id },
    { admissionNumber: "1003", firstName: "David", lastName: "Mutua", gender: "Male", dateOfBirth: new Date("2012-11-02"), parentName: "Peter Mutua", parentPhone: "0732345678", email: "david.mutua@gmail.com", classStreamId: stream1A.id },
    { admissionNumber: "1004", firstName: "Fatma", lastName: "Hassan", gender: "Female", dateOfBirth: new Date("2012-03-10"), parentName: "Hassan Ali", parentPhone: "0742345678", email: "fatma.hassan@gmail.com", classStreamId: stream1A.id },
    { admissionNumber: "1005", firstName: "Alex", lastName: "Mwangi", gender: "Male", dateOfBirth: new Date("2012-09-12"), parentName: "James Mwangi", parentPhone: "0752345678", email: "alex.mwangi@gmail.com", classStreamId: stream1A.id },
  ];

  const students1B = [
    { admissionNumber: "1006", firstName: "Brian", lastName: "Kiprop", gender: "Male", dateOfBirth: new Date("2012-07-25"), parentName: "Kiprop Koech", parentPhone: "0762345678", email: "brian.kiprop@gmail.com", classStreamId: stream1B.id },
    { admissionNumber: "1007", firstName: "Lucy", lastName: "Wambui", gender: "Female", dateOfBirth: new Date("2012-01-30"), parentName: "Wambui Maina", parentPhone: "0772345678", email: "lucy.wambui@gmail.com", classStreamId: stream1B.id },
    { admissionNumber: "1008", firstName: "Kevin", lastName: "Omwamba", gender: "Male", dateOfBirth: new Date("2012-04-18"), parentName: "Omwamba Onyango", parentPhone: "0782345678", email: "kevin.omwamba@gmail.com", classStreamId: stream1B.id },
    { admissionNumber: "1009", firstName: "Amina", lastName: "Yusuf", gender: "Female", dateOfBirth: new Date("2012-12-05"), parentName: "Yusuf Ahmed", parentPhone: "0792345678", email: "amina.yusuf@gmail.com", classStreamId: stream1B.id },
    { admissionNumber: "1010", firstName: "Ian", lastName: "Ndwiga", gender: "Male", dateOfBirth: new Date("2012-06-08"), parentName: "Ndwiga Njiru", parentPhone: "0702345678", email: "ian.ndwiga@gmail.com", classStreamId: stream1B.id },
  ];

  const allSeededStudents = [];

  for (const s of students1A) {
    const student = await prisma.student.create({ data: s });
    allSeededStudents.push(student);
  }
  for (const s of students1B) {
    const student = await prisma.student.create({ data: s });
    allSeededStudents.push(student);
  }
  console.log("Created Students.");

  // 9. Create Assessments & Scores
  const year = "2026";

  // We will create 3 assessments per subject in Form 1A and Form 1B:
  // - CAT 1 (out of 30)
  // - CAT 2 (out of 30)
  // - End Term (out of 100)
  
  const subjects1A = [math, eng, sci, his];
  const subjects1B = [math, eng, sci, geo];

  const createAssessmentsAndScores = async (streamId: string, students: any[], subjects: any[]) => {
    for (const sub of subjects) {
      // Create assessments
      const cat1 = await prisma.assessment.create({
        data: {
          title: "CAT 1",
          assessmentType: "CAT",
          term: "Term 1",
          academicYear: year,
          subjectId: sub.id,
          classStreamId: streamId,
          totalMarks: 30,
        },
      });

      const cat2 = await prisma.assessment.create({
        data: {
          title: "CAT 2",
          assessmentType: "CAT",
          term: "Term 1",
          academicYear: year,
          subjectId: sub.id,
          classStreamId: streamId,
          totalMarks: 30,
        },
      });

      const exam = await prisma.assessment.create({
        data: {
          title: "End Term Exam",
          assessmentType: "EXAM",
          term: "Term 1",
          academicYear: year,
          subjectId: sub.id,
          classStreamId: streamId,
          totalMarks: 100,
        },
      });

      // Seeding scores for each student
      for (const student of students) {
        // Random but realistic scores
        // Let's seed varying scores to see proper rankings
        const hashBase = (parseInt(student.admissionNumber) + sub.subjectCode.charCodeAt(0)) % 10;
        
        // CAT 1: between 15 and 28
        const scoreCat1 = 15 + (hashBase % 14); 
        // CAT 2: between 16 and 29
        const scoreCat2 = 16 + ((hashBase + 3) % 14);
        // Exam: between 50 and 95
        const scoreExam = 50 + ((hashBase * 4.5) % 46);

        await prisma.score.create({
          data: { studentId: student.id, assessmentId: cat1.id, score: scoreCat1 },
        });
        await prisma.score.create({
          data: { studentId: student.id, assessmentId: cat2.id, score: scoreCat2 },
        });
        await prisma.score.create({
          data: { studentId: student.id, assessmentId: exam.id, score: scoreExam },
        });
      }
    }
  };

  await createAssessmentsAndScores(stream1A.id, allSeededStudents.filter(s => s.classStreamId === stream1A.id), subjects1A);
  await createAssessmentsAndScores(stream1B.id, allSeededStudents.filter(s => s.classStreamId === stream1B.id), subjects1B);
  console.log("Created Assessments and Scores.");

  // 10. Run Ranking/Processing Engine for Seeding Cached Results
  console.log("Computing and caching rankings...");
  await computeAndCacheResults("2026", "Term 1");

  console.log("Seeding complete!");
}

// Function to calculate and save results for a given year & term
async function computeAndCacheResults(academicYear: string, term: string) {
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

  const gradingScales = await prisma.gradingScale.findMany({
    orderBy: { minScore: "desc" },
  });

  const getGradeAndRemarks = (percentage: number) => {
    for (const scale of gradingScales) {
      if (percentage >= scale.minScore && percentage <= scale.maxScore) {
        return { grade: scale.grade, remarks: scale.remarks || "" };
      }
    }
    return { grade: "E", remarks: "Needs improvement" };
  };

  interface StudentSummary {
    studentId: string;
    classStreamId: string;
    totalMarks: number; // Sum of percentage scores
    averageScore: number;
    grade: string;
  }

  const summaries: StudentSummary[] = [];

  for (const student of students) {
    const subjects = student.classStream.streamSubjects.map(ss => ss.subject);
    let totalPercentage = 0;
    let subjectsCount = 0;

    for (const subject of subjects) {
      // Find assessments for this subject in the given term/year
      const studentScores = student.scores.filter(
        s => s.assessment.subjectId === subject.id &&
             s.assessment.term === term &&
             s.assessment.academicYear === academicYear
      );

      if (studentScores.length > 0) {
        let earnedMarks = 0;
        let possibleMarks = 0;
        for (const s of studentScores) {
          earnedMarks += s.score;
          possibleMarks += s.assessment.totalMarks;
        }

        const percentage = possibleMarks > 0 ? (earnedMarks / possibleMarks) * 100 : 0;
        totalPercentage += percentage;
        subjectsCount++;
      }
    }

    const average = subjectsCount > 0 ? totalPercentage / subjectsCount : 0;
    const { grade } = getGradeAndRemarks(average);

    summaries.push({
      studentId: student.id,
      classStreamId: student.classStreamId,
      totalMarks: totalPercentage,
      averageScore: average,
      grade,
    });
  }

  // Rank students overall per Class Stream
  // Group by stream
  const streams = Array.from(new Set(summaries.map(s => s.classStreamId)));

  for (const streamId of streams) {
    const streamSummaries = summaries.filter(s => s.classStreamId === streamId);
    // Sort descending by averageScore
    streamSummaries.sort((a, b) => b.averageScore - a.averageScore);

    // Compute positions with tie-breaking
    let rank = 1;
    for (let i = 0; i < streamSummaries.length; i++) {
      if (i > 0 && streamSummaries[i].averageScore < streamSummaries[i - 1].averageScore) {
        rank = i + 1;
      }
      const summary = streamSummaries[i];

      // Insert or Update results cache
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

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
