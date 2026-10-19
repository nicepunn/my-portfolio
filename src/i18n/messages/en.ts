export const en = {
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
    blurb: "Scan the QR or share this page. Prefer paper? Grab the PDF.",
    viewPdf: "View PDF",
    github: "GitHub",
    editData: "Edit data",
    settings: "Settings",
    scanToOpen: "Scan to open",
    qrAlt: "QR code linking to this resume website",
  },
  settings: {
    eyebrow: "Preferences",
    title: "Settings",
    blurb:
      "Language is saved on this device only. Other browsers and devices keep their own choice.",
    backHome: "← Back to resume",
    language: {
      title: "Language",
      description: "Choose the language for this site on this device.",
    },
  },
  common: {
    loadingResume: "Loading resume…",
  },
  a11y: {
    language: "Language",
    settings: "Open settings",
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
    settings: string;
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
    settings: string;
    scanToOpen: string;
    qrAlt: string;
  };
  settings: {
    eyebrow: string;
    title: string;
    blurb: string;
    backHome: string;
    language: {
      title: string;
      description: string;
    };
  };
  common: {
    loadingResume: string;
  };
  a11y: {
    language: string;
    settings: string;
  };
};
