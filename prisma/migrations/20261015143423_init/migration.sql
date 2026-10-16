-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT,
    "role" TEXT NOT NULL DEFAULT 'student',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "GuestSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isReset" BOOLEAN NOT NULL DEFAULT false
);

-- CreateTable
CREATE TABLE "AcademicProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "institutionName" TEXT NOT NULL,
    "facultyName" TEXT,
    "programName" TEXT NOT NULL,
    "educationLevel" TEXT NOT NULL DEFAULT 'S1',
    "entryYear" INTEGER NOT NULL,
    "currentSemester" INTEGER NOT NULL,
    "totalCurriculumCredits" INTEGER NOT NULL DEFAULT 144,
    "completedCredits" INTEGER NOT NULL DEFAULT 0,
    "inProgressCredits" INTEGER NOT NULL DEFAULT 0,
    "gpa" REAL,
    "goals" TEXT NOT NULL DEFAULT 'balanced',
    "interests" TEXT NOT NULL DEFAULT '[]',
    "studyMode" TEXT,
    "takEnabled" BOOLEAN NOT NULL DEFAULT true,
    "takTarget" INTEGER,
    "weeklyHours" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AcademicProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AcademicProfile_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Roadmap" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "title" TEXT NOT NULL DEFAULT 'Roadmap Saya',
    "status" TEXT NOT NULL DEFAULT 'active',
    "currentVersionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Roadmap_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Roadmap_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoadmapVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roadmapId" TEXT NOT NULL,
    "versionNum" INTEGER NOT NULL,
    "label" TEXT,
    "description" TEXT,
    "isBaseline" BOOLEAN NOT NULL DEFAULT false,
    "appliedFromSimulationId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RoadmapVersion_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SemesterPlan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roadmapVersionId" TEXT NOT NULL,
    "semesterNum" INTEGER NOT NULL,
    "semesterLabel" TEXT,
    "targetCredits" INTEGER NOT NULL DEFAULT 20,
    "plannedCredits" INTEGER NOT NULL DEFAULT 0,
    "isCurrentSemester" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SemesterPlan_roadmapVersionId_fkey" FOREIGN KEY ("roadmapVersionId") REFERENCES "RoadmapVersion" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RoadmapTask" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "semesterPlanId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'akademik',
    "credits" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'planned',
    "targetDate" TEXT,
    "completedDate" TEXT,
    "courseCode" TEXT,
    "notes" TEXT,
    "dataSource" TEXT NOT NULL DEFAULT 'mahasiswa',
    "certaintyLevel" TEXT NOT NULL DEFAULT 'estimasi',
    "nodePositionX" REAL,
    "nodePositionY" REAL,
    "prerequisites" TEXT NOT NULL DEFAULT '[]',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RoadmapTask_semesterPlanId_fkey" FOREIGN KEY ("semesterPlanId") REFERENCES "SemesterPlan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "type" TEXT NOT NULL,
    "semesterNum" INTEGER NOT NULL,
    "answers" TEXT NOT NULL,
    "roadmapUpdates" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CheckIn_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Simulation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "roadmapId" TEXT NOT NULL,
    "baselineVersionId" TEXT,
    "scenarioType" TEXT NOT NULL,
    "parameters" TEXT NOT NULL,
    "rulesResult" TEXT,
    "aiExplanation" TEXT,
    "assumptions" TEXT,
    "unknowns" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "appliedVersionId" TEXT,
    "title" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Simulation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Simulation_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Simulation_roadmapId_fkey" FOREIGN KEY ("roadmapId") REFERENCES "Roadmap" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "institutionName" TEXT,
    "programName" TEXT,
    "cohortYear" INTEGER,
    "goals" TEXT,
    "semesterSteps" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL DEFAULT 'pengalaman',
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "usefulCount" INTEGER NOT NULL DEFAULT 0,
    "authorDisplayName" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Template_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateClone" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sourceTemplateId" TEXT NOT NULL,
    "clonedByUserId" TEXT,
    "guestSessionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateClone_sourceTemplateId_fkey" FOREIGN KEY ("sourceTemplateId") REFERENCES "Template" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TemplateVote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TemplateVote_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TemplateVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentId" TEXT,
    "content" TEXT NOT NULL,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Comment" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "templateId" TEXT,
    "commentId" TEXT,
    "reportedByUserId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "moderatorNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Report_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "Template" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Report_reportedByUserId_fkey" FOREIGN KEY ("reportedByUserId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ThesisAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "methods" TEXT NOT NULL,
    "dataAvailability" TEXT NOT NULL,
    "timeAvailable" TEXT NOT NULL,
    "skills" TEXT NOT NULL,
    "constraints" TEXT,
    "directions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ThesisAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdvisingLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "supervisor" TEXT NOT NULL,
    "topics" TEXT NOT NULL,
    "decisions" TEXT,
    "followUps" TEXT,
    "dueDate" TEXT,
    "status" TEXT NOT NULL DEFAULT 'open',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdvisingLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CareerAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "interests" TEXT NOT NULL,
    "experience" TEXT,
    "skills" TEXT NOT NULL,
    "priorities" TEXT,
    "actionPlan" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CareerAssessment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Achievement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT NOT NULL,
    "startDate" TEXT,
    "endDate" TEXT,
    "impact" TEXT,
    "skills" TEXT NOT NULL DEFAULT '[]',
    "evidenceUrl" TEXT,
    "includeInCv" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Achievement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Achievement_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CVProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "summary" TEXT,
    "phone" TEXT,
    "linkedin" TEXT,
    "portfolio" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CVProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Reminder" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "guestSessionId" TEXT,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "deadline" TEXT,
    "sourceUrl" TEXT,
    "sourceLabel" TEXT,
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Reminder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Reminder_guestSessionId_fkey" FOREIGN KEY ("guestSessionId") REFERENCES "GuestSession" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GuestSession_token_key" ON "GuestSession"("token");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProfile_userId_key" ON "AcademicProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "AcademicProfile_guestSessionId_key" ON "AcademicProfile"("guestSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "RoadmapVersion_roadmapId_versionNum_key" ON "RoadmapVersion"("roadmapId", "versionNum");

-- CreateIndex
CREATE UNIQUE INDEX "SemesterPlan_roadmapVersionId_semesterNum_key" ON "SemesterPlan"("roadmapVersionId", "semesterNum");

-- CreateIndex
CREATE UNIQUE INDEX "TemplateVote_templateId_userId_key" ON "TemplateVote"("templateId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "CVProfile_userId_key" ON "CVProfile"("userId");
