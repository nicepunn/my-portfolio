import type { Messages } from "@/i18n/messages/en";

/** Thai UI: prefer English / transliteration for short labels; Thai for longer copy. */
export const th: Messages = {
  nav: {
    brand: "Resume",
    experience: "Experience",
    projects: "Projects",
    skills: "Skills",
    about: "About",
    pdf: "PDF",
    settings: "Settings",
  },
  hero: {
    emailMe: "Email me",
    github: "GitHub",
  },
  sections: {
    experience: { eyebrow: "Career", title: "Work experience" },
    projects: { eyebrow: "Selected work", title: "Projects", live: "live" },
    skills: { eyebrow: "Toolkit", title: "Technical skills" },
    education: { eyebrow: "Background", title: "Education", gpax: "GPAX" },
    activities: { eyebrow: "Campus life", title: "Activities" },
    interests: { eyebrow: "Off the clock", title: "Interests" },
  },
  footer: {
    blurb: "Scan QR หรือแชร์หน้านี้ Prefer paper? Grab the PDF.",
    viewPdf: "View PDF",
    github: "GitHub",
    editData: "Edit data",
    settings: "Settings",
    scanToOpen: "Scan to open",
    qrAlt: "QR code ลิงก์ไปยัง resume website นี้",
  },
  settings: {
    eyebrow: "Preferences",
    title: "Settings",
    blurb:
      "Language ถูกบันทึกบน device นี้เท่านั้น Browser หรือเครื่องอื่นจะมีค่าของตัวเอง",
    backHome: "← Back to resume",
    language: {
      title: "Language",
      description: "เลือก language สำหรับเว็บนี้บน device นี้",
    },
  },
  common: {
    loadingResume: "Loading resume…",
  },
  a11y: {
    language: "Language",
    settings: "Open settings",
  },
};
