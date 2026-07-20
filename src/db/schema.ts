import {
  pgTable,
  serial,
  text,
  integer,
  real,
  timestamp,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").default("Sunshine Academy").notNull(),
  schoolLogo: text("school_logo").default(""),
  principalName: text("principal_name").default(""),
  classTeacherName: text("class_teacher_name").default(""),
  classTeacherDegree: text("class_teacher_degree").default(""),
  classTeacherPicture: text("class_teacher_picture").default(""),
  academicYear: text("academic_year").default("2025"),
  nextRollNumber: integer("next_roll_number").default(2),
  adminPassword: text("admin_password").default("admin123").notNull(),
  superAdminPassword: text("super_admin_password").default("saad.admin").notNull(),
  examFullMarks: jsonb("exam_full_marks").$type<Record<string, Record<string, number>>>(),
  developerName: text("developer_name").default(""),
  developerRoll: integer("developer_roll").default(6),
  developerBio: text("developer_bio").default(""),
  developerPicture: text("developer_picture").default(""),
  captainRoll: integer("captain_roll"),
  captainTitle: text("captain_title").default("Captain"),
  monitorRoll: integer("monitor_roll"),
  monitorTitle: text("monitor_title").default("Monitor"),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: integer("roll_number").notNull().unique(),
  password: text("password").notNull(),
  profilePicture: text("profile_picture").default(""),
  fatherName: text("father_name").default(""),
  motherName: text("mother_name").default(""),
  mobileNumber: text("mobile_number").default(""),
  studentId: text("student_id").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const applications = pgTable("applications", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  rollNumber: integer("roll_number").notNull(),
  studentId: text("student_id").default(""),
  fatherName: text("father_name").default(""),
  motherName: text("mother_name").default(""),
  mobileNumber: text("mobile_number").default(""),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const marks = pgTable("marks", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  examType: text("exam_type").notNull(),
  subject: text("subject").notNull(),
  cq: real("cq").default(0),
  mcq: real("mcq").default(0),
  total: real("total").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  degree: text("degree").default(""),
  subject: text("subject").default(""),
  profilePicture: text("profile_picture").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const routine = pgTable("routine", {
  id: serial("id").primaryKey(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Sun,1=Mon...6=Sat
  periodNumber: integer("period_number").notNull(),
  subject: text("subject").notNull(),
  teacher: text("teacher").default(""),
  startTime: text("start_time").notNull(), // "09:00"
  endTime: text("end_time").notNull(),     // "09:45"
});

export const gallery = pgTable("gallery", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleBn: text("title_bn").default(""),
  description: text("description").default(""),
  descriptionBn: text("description_bn").default(""),
  imageUrl: text("image_url").notNull(),
  category: text("category").default("event"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notices = pgTable("notices", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleBn: text("title_bn").default(""),
  content: text("content").default(""),
  contentBn: text("content_bn").default(""),
  priority: text("priority").default("normal"), // normal, important, urgent
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const behaviors = pgTable("behaviors", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  punctuality: integer("punctuality").default(70),
  discipline: integer("discipline").default(70),
  participation: integer("participation").default(70),
  homework: integer("homework").default(70),
  teamwork: integer("teamwork").default(70),
  creativity: integer("creativity").default(70),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  teacherName: text("teacher_name").notNull(),
  teacherSubject: text("teacher_subject").default(""),
  teacherPicture: text("teacher_picture").default(""),
  comment: text("comment").notNull(),
  type: text("type").default("positive"), // positive, neutral, advice
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const studyMaterials = pgTable("study_materials", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleBn: text("title_bn").default(""),
  subject: text("subject").default(""),
  type: text("type").default("note"), // note, pdf, video, link
  url: text("url").default(""),
  description: text("description").default(""),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const upcomingEvents = pgTable("upcoming_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleBn: text("title_bn").default(""),
  description: text("description").default(""),
  eventDate: text("event_date").notNull(),
  eventType: text("event_type").default("exam"), // exam, event, holiday, deadline
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const pendingChanges = pgTable("pending_changes", {
  id: serial("id").primaryKey(),
  actionType: text("action_type").notNull(), // create_student, update_marks, delete_student, etc
  actionLabel: text("action_label").notNull(), // human-readable description
  endpoint: text("endpoint").notNull(), // API endpoint to call when approved
  method: text("method").notNull(), // POST, PUT, DELETE
  payload: jsonb("payload").$type<Record<string, unknown>>(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id: serial("id").primaryKey(),
  action: text("action").notNull(),
  details: text("details"),
  performedBy: text("performed_by").default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
