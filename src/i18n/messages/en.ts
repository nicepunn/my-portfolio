export const en = {
  nav: {
    brand: "Resume",
    experience: "Experience",
    projects: "Projects",
    skills: "Skills",
    about: "About",
    pdf: "PDF",
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
    blurb: "Scan the QR or share this page. Prefer paper? Grab the PDF.",
    viewPdf: "View PDF",
    github: "GitHub",
    editData: "Edit data",
    scanToOpen: "Scan to open",
    qrAlt: "QR code linking to this resume website",
  },
  common: {
    loadingResume: "Loading resume…",
  },
  a11y: {
    language: "Language",
  },
} as const;

export type Messages = {
  nav: {
    brand: string;
    experience: string;
    projects: string;
    skills: string;
    about: string;
    pdf: string;
  };
  hero: {
    emailMe: string;
    github: string;
  };
  sections: {
    experience: { eyebrow: string; title: string };
    projects: { eyebrow: string; title: string; live: string };
    skills: { eyebrow: string; title: string };
    education: { eyebrow: string; title: string; gpax: string };
    activities: { eyebrow: string; title: string };
    interests: { eyebrow: string; title: string };
  };
  footer: {
    blurb: string;
    viewPdf: string;
    github: string;
    editData: string;
    scanToOpen: string;
    qrAlt: string;
  };
  common: {
    loadingResume: string;
  };
  a11y: {
    language: string;
  };
};
