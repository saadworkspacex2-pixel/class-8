"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

type Lang = "en" | "bn";

const translations: Record<string, Record<Lang, string>> = {
  // Site
  "site.title": { en: "Class 8 Result", bn: "৮ম শ্রেণির ফলাফল" },
  "site.subtitle": { en: "Class 8 — Dahlia (B)", bn: "৮ম শ্রেণি — ডালিয়া (খ)" },
  "site.class_section": { en: "Class 8 — Dahlia (B)", bn: "৮ম শ্রেণি — ডালিয়া (খ)" },

  // Nav
  "nav.admin_login": { en: "Admin Login", bn: "অ্যাডমিন লগইন" },
  "nav.live": { en: "Live Results Dashboard", bn: "লাইভ ফলাফল ড্যাশবোর্ড" },

  // Hero
  "dash.result": { en: "Result Dashboard", bn: "ফলাফল ড্যাশবোর্ড" },
  "dash.desc": { en: "View exam results, rankings, and performance analytics for Class 8 — Dahlia (B)", bn: "৮ম শ্রেণি — ডালিয়া (খ) এর পরীক্ষার ফলাফল, র‍্যাংকিং এবং পারফরম্যান্স বিশ্লেষণ দেখুন" },

  // Exams
  "dash.exam": { en: "Select Examination", bn: "পরীক্ষা নির্বাচন করুন" },
  "dash.exam_desc": { en: "Choose an exam to view", bn: "দেখতে পরীক্ষা বাছাই করুন" },
  "exam.1st_monthly": { en: "1st Monthly", bn: "১ম মাসিক" },
  "exam.2nd_monthly": { en: "2nd Monthly", bn: "২য় মাসিক" },
  "exam.half_yearly": { en: "Half Yearly", bn: "অর্ধবার্ষিক" },
  "exam.annual": { en: "Annual", bn: "বার্ষিক" },

  // Leaderboard
  "dash.leaderboard": { en: "Leaderboard", bn: "লিডারবোর্ড" },
  "dash.rankings": { en: "Real-time rankings", bn: "রিয়েল-টাইম র‍্যাংকিং" },
  "dash.top_performers": { en: "Top Performers", bn: "সেরা শিক্ষার্থী" },

  // Stats
  "dash.students": { en: "Total Students", bn: "মোট শিক্ষার্থী" },
  "dash.highest": { en: "Highest", bn: "সর্বোচ্চ" },
  "dash.average": { en: "Class Average", bn: "শ্রেণি গড়" },
  "dash.pass_rate": { en: "Pass Rate", bn: "পাসের হার" },

  // Subjects
  "dash.subject_perf": { en: "Subject Performance", bn: "বিষয়ভিত্তিক পারফরম্যান্স" },
  "dash.grade_dist": { en: "Grade Distribution", bn: "গ্রেড বিতরণ" },
  "dash.no_results": { en: "No Results Yet", bn: "এখনো কোনো ফলাফল নেই" },
  "dash.no_results_desc": { en: "Results for this exam have not been published yet.", bn: "এই পরীক্ষার ফলাফল এখনো প্রকাশিত হয়নি।" },

  // Student Directory
  "dash.student_dir": { en: "Student Directory", bn: "শিক্ষার্থী তালিকা" },
  "dash.click_view": { en: "Click on any student to view details", bn: "বিস্তারিত দেখতে যেকোনো শিক্ষার্থীতে ক্লিক করুন" },

  // Apply
  "dash.apply": { en: "Apply", bn: "আবেদন" },
  "dash.apply_title": { en: "Apply as Student", bn: "শিক্ষার্থী হিসেবে আবেদন" },
  "dash.apply_desc": { en: "Submit your registration request", bn: "আপনার নিবন্ধন অনুরোধ জমা দিন" },
  "dash.apply_success": { en: "Application Submitted!", bn: "আবেদন জমা হয়েছে!" },
  "dash.apply_pending": { en: "Your application is pending approval. You'll be notified once reviewed.", bn: "আপনার আবেদন অনুমোদনের অপেক্ষায় আছে। পর্যালোচনা হলে জানানো হবে।" },
  "dash.submit_app": { en: "Submit Application", bn: "আবেদন জমা দিন" },
  "dash.submitting": { en: "Submitting...", bn: "জমা দেওয়া হচ্ছে..." },
  "dash.close": { en: "Close", bn: "বন্ধ করুন" },
  "dash.no_students": { en: "No students registered yet", bn: "এখনো কোনো শিক্ষার্থী নিবন্ধিত হয়নি" },

  // Teachers
  "dash.our_teachers": { en: "Our Teachers", bn: "আমাদের শিক্ষকবৃন্দ" },
  "dash.class_teacher": { en: "Class Teacher", bn: "শ্রেণি শিক্ষক" },
  "dash.web_dev": { en: "Website Developer", bn: "ওয়েবসাইট ডেভেলপার" },

  // Search
  "dash.search": { en: "Search by name or roll...", bn: "নাম বা রোল দিয়ে খুঁজুন..." },

  // Table Headers
  "common.rank": { en: "Rank", bn: "র‍্যাংক" },
  "common.student": { en: "Student", bn: "শিক্ষার্থী" },
  "common.total": { en: "Total", bn: "মোট" },
  "common.grade": { en: "Grade", bn: "গ্রেড" },
  "common.roll": { en: "Roll", bn: "রোল" },
  "common.name": { en: "Name", bn: "নাম" },
  "common.average": { en: "Average", bn: "গড়" },
  "common.cq": { en: "CQ", bn: "সিকিউ" },
  "common.mcq": { en: "MCQ", bn: "এমসিকিউ" },
  "common.cq_total": { en: "CQ Total", bn: "সিকিউ মোট" },
  "common.mcq_total": { en: "MCQ Total", bn: "এমসিকিউ মোট" },
  "common.overall": { en: "OVERALL", bn: "সামগ্রিক" },
  "common.subject_sel": { en: "Subject…", bn: "বিষয়…" },
  "common.pass": { en: "PASS", bn: "পাস" },
  "common.fail": { en: "FAIL", bn: "ফেল" },
  "common.status": { en: "Status", bn: "স্থিতি" },

  // Subjects
  "sub.bangla_1st": { en: "Bangla 1st", bn: "বাংলা ১ম পত্র" },
  "sub.bangla_2nd": { en: "Bangla 2nd", bn: "বাংলা ২য় পত্র" },
  "sub.english_1st": { en: "English 1st", bn: "ইংরেজি ১ম পত্র" },
  "sub.english_2nd": { en: "English 2nd", bn: "ইংরেজি ২য় পত্র" },
  "sub.mathematics": { en: "Mathematics", bn: "গণিত" },
  "sub.bgs": { en: "BGS", bn: "বাংলাদেশ ও বিশ্বপরিচয়" },
  "sub.science": { en: "Science", bn: "বিজ্ঞান" },
  "sub.islam": { en: "Islam", bn: "ইসলাম শিক্ষা" },
  "sub.ict": { en: "ICT", bn: "তথ্য ও যোগাযোগ প্রযুক্তি" },

  // Form fields
  "form.full_name": { en: "Full Name", bn: "পূর্ণ নাম" },
  "form.roll_number": { en: "Roll Number", bn: "রোল নম্বর" },
  "form.student_id": { en: "Student ID", bn: "শিক্ষার্থী আইডি" },
  "form.father_name": { en: "Father's Name", bn: "পিতার নাম" },
  "form.mother_name": { en: "Mother's Name", bn: "মাতার নাম" },
  "form.mobile": { en: "Mobile Number", bn: "মোবাইল নম্বর" },
  "form.select_roll": { en: "Select roll...", bn: "রোল নির্বাচন করুন..." },
  "form.password": { en: "Password", bn: "পাসওয়ার্ড" },
  "form.enter_password": { en: "Enter admin password", bn: "অ্যাডমিন পাসওয়ার্ড দিন" },
  "form.sign_in": { en: "Sign In", bn: "সাইন ইন" },
  "form.signing_in": { en: "Signing in...", bn: "সাইন ইন হচ্ছে..." },

  // Login
  "login.title": { en: "Admin Login", bn: "অ্যাডমিন লগইন" },
  "login.desc": { en: "Enter your admin password to continue", bn: "চালিয়ে যেতে অ্যাডমিন পাসওয়ার্ড দিন" },

  // Routine
  "routine.title": { en: "Today's Routine", bn: "আজকের রুটিন" },
  "routine.live": { en: "Live Class Tracker", bn: "লাইভ ক্লাস ট্র্যাকার" },
  "routine.now": { en: "NOW", bn: "এখন" },
  "routine.next": { en: "Next class in", bn: "পরবর্তী ক্লাস" },
  "routine.break": { en: "Break / No Class", bn: "বিরতি / ক্লাস নেই" },
  "routine.ended": { en: "Classes ended for today", bn: "আজকের ক্লাস শেষ" },
  "routine.holiday": { en: "No classes today", bn: "আজ ক্লাস নেই" },
  "routine.min": { en: "min", bn: "মিনিট" },

  // Gallery
  "gallery.title": { en: "Gallery", bn: "গ্যালারি" },
  "gallery.desc": { en: "Class moments & projects", bn: "ক্লাসের মুহূর্ত ও প্রকল্প" },

  // Notices
  "notices.title": { en: "Notice Board", bn: "নোটিশ বোর্ড" },
  "notices.desc": { en: "Important announcements", bn: "গুরুত্বপূর্ণ বিজ্ঞপ্তি" },

  // Student Portal
  "portal.login_title": { en: "Student Portal", bn: "শিক্ষার্থী পোর্টাল" },
  "portal.login_desc": { en: "Enter your roll number and password", bn: "আপনার রোল এবং পাসওয়ার্ড লিখুন" },
  "portal.roll": { en: "Roll Number", bn: "রোল নম্বর" },
  "portal.welcome": { en: "Welcome back", bn: "স্বাগতম" },
  "portal.tier_s": { en: "S-TIER — Legendary Scholar", bn: "এস-টিয়ার — কিংবদন্তি" },
  "portal.tier_a": { en: "A-TIER — Outstanding", bn: "এ-টিয়ার — অসাধারণ" },
  "portal.tier_b": { en: "B-TIER — Rising Star", bn: "বি-টিয়ার — উদীয়মান" },
  "portal.tier_c": { en: "C-TIER — Learner", bn: "সি-টিয়ার — শিক্ষানবিস" },
  "portal.tier_d": { en: "D-TIER — Beginner", bn: "ডি-টিয়ার — নবীন" },
  "portal.behavior": { en: "Behavioral Analysis", bn: "আচরণগত বিশ্লেষণ" },
  "portal.behavior_desc": { en: "Your growth across 6 dimensions", bn: "৬টি দিক থেকে আপনার অগ্রগতি" },
  "portal.comments": { en: "Teacher's Comments", bn: "শিক্ষকদের মন্তব্য" },
  "portal.comments_desc": { en: "Feedback from your mentors", bn: "আপনার শিক্ষকদের মতামত" },
  "portal.academic": { en: "Academic Performance", bn: "একাডেমিক পারফরম্যান্স" },
  "portal.grade": { en: "Grade", bn: "গ্রেড" },
  "portal.punctuality": { en: "Punctuality", bn: "সময়নিষ্ঠতা" },
  "portal.discipline": { en: "Discipline", bn: "শৃঙ্খলা" },
  "portal.participation": { en: "Participation", bn: "অংশগ্রহণ" },
  "portal.homework": { en: "Homework", bn: "বাড়ির কাজ" },
  "portal.teamwork": { en: "Teamwork", bn: "দলবদ্ধ কাজ" },
  "portal.creativity": { en: "Creativity", bn: "সৃজনশীলতা" },
  "portal.logout": { en: "Logout", bn: "লগআউট" },
  "portal.overall_behavior": { en: "Overall Behavior", bn: "সামগ্রিক আচরণ" },
  "portal.no_comments": { en: "No comments yet", bn: "এখনো কোনো মন্তব্য নেই" },

  // Footer
  "footer.rights": { en: "All rights reserved.", bn: "সর্বস্বত্ব সংরক্ষিত।" },
};

// Subject name translation map
const subjectTranslations: Record<string, string> = {
  "Bangla 1st": "বাংলা ১ম পত্র",
  "Bangla 2nd": "বাংলা ২য় পত্র",
  "English 1st": "ইংরেজি ১ম পত্র",
  "English 2nd": "ইংরেজি ২য় পত্র",
  "Mathematics": "গণিত",
  "BGS": "বাংলাদেশ ও বিশ্বপরিচয়",
  "Science": "বিজ্ঞান",
  "Islam": "ইসলাম শিক্ষা",
  "ICT": "তথ্য ও যোগাযোগ প্রযুক্তি",
  "Debate": "বিতর্ক",
  "Library": "লাইব্রেরি",
  "Free Period": "ফাঁকা",
  "Agriculture": "কৃষি শিক্ষা",
  "General Knowledge": "সাধারণ জ্ঞান",
  "Music": "সংগীত",
  "Tiffin": "টিফিন",
};

// Exam name translation map
const examTranslations: Record<string, string> = {
  "1st Monthly": "১ম মাসিক",
  "2nd Monthly": "২য় মাসিক",
  "Half Yearly": "অর্ধবার্ষিক",
  "Annual": "বার্ষিক",
};

interface I18nContextType {
  lang: Lang;
  toggleLang: () => void;
  t: (key: string) => string;
  tSubject: (name: string) => string;
  tExam: (name: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  lang: "en",
  toggleLang: () => {},
  t: (key: string) => key,
  tSubject: (name: string) => name,
  tExam: (name: string) => name,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("bn");

  const toggleLang = useCallback(() => {
    setLang((prev) => (prev === "en" ? "bn" : "en"));
  }, []);

  const t = useCallback(
    (key: string) => translations[key]?.[lang] ?? key,
    [lang]
  );

  const tSubject = useCallback(
    (name: string) => (lang === "bn" ? subjectTranslations[name] ?? name : name),
    [lang]
  );

  const tExam = useCallback(
    (name: string) => (lang === "bn" ? examTranslations[name] ?? name : name),
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, toggleLang, t, tSubject, tExam }}>
      <div className={lang === "bn" ? "font-bangla" : "font-sans"}>{children}</div>
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
