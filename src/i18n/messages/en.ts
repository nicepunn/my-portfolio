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
      "Language and appearance are saved on this device only. Other browsers and devices keep their own choice.",
    backHome: "← Back to resume",
    appearance: {
      title: "Appearance",
      description:
        "Choose a look for this site. Light and dark still switch from the header.",
      skins: {
        editorial: {
          name: "Editorial",
          description: "Teal and paper, the original look",
        },
        soft: {
          name: "Soft",
          description: "Lilac washes and rounded controls",
        },
        glass: {
          name: "(beta) Liquid Glass",
          description: "Soft color, frosted and see-through",
        },
        cyber: {
          name: "Cyber",
          description: "Cyan, mono headings, and a grid",
        },
      },
      transparency: "Transparency",
      transparencyHint: "Liquid Glass only. Further right is more see-through.",
    },
    language: {
      title: "Language",
      description: "Choose the language for this site on this device.",
    },
  },
  common: {
    loadingResume: "Loading resume…",
  },
  edit: {
    eyebrow: "Content editor",
    title: "Edit resume data",
    blurbPrefix: "Form layout is driven by",
    blurbSuffix:
      ". Values save through the API and update the live site + PDF.",
    persistenceReady:
      "Save stages your changes. Nothing is published until you finish or choose to save this language only.",
    persistenceUnavailable:
      "Persistent storage is not configured on this host. Final save will download JSON instead.",
    lockEditor: "Lock editor",
    save: "Save",
    saving: "Saving…",
    downloadJson: "Download JSON",
    previewPdf: "Preview PDF",
    editingLocale: "Editing",
    otherLanguagesTitle: "Do you want to change in other language?",
    otherLanguagesBlurb:
      "Select one or more other languages to update next. Nothing is saved until you finish the full flow — or choose to save this language only.",
    selectLanguages: "Languages to edit",
    continueToOther: "Continue",
    saveThisOnly: "No, save this language only",
    cancel: "Cancel",
    selectAtLeastOne: "Select at least one language.",
    leaveConfirmTitle: "Leave without saving?",
    leaveConfirmBlurb:
      "You have unsaved changes. If you go back now, those edits will be discarded.",
    leaveConfirm: "Discard and leave",
    leaveStay: "Keep editing",
    saveThisOnlyConfirmTitle: "Save this language only?",
    saveThisOnlyConfirmBlurb:
      "Only the current language will be published. Other languages will not be updated in this save.",
    saveThisOnlyConfirm: "Yes, save this language only",
    reviewTitle: "Translate / update other language",
    reviewSource: "Source (read-only)",
    reviewTarget: "Editing",
    reviewQueue: "Still to edit",
    reviewDone: "Publish all languages",
    reviewNext: "Save & continue to next language",
    reviewAbandon: "Discard all changes",
    reviewHint:
      "Left shows the language you already edited. Right is the selected language. Leaving mid-flow discards everything — nothing is published yet.",
    fieldChanged: "Changed in the source language from its original stage",
    fieldChangedLegend:
      "Red + ! — still needs an update on the right (source changed)",
    fieldResolved: "Updated on this side to match the source change",
    fieldResolvedLegend:
      "Green + ✓ — you already edited this field on the right",
    scrollToNextPending: "Jump to next red field",
    itemRemoved: "Removed",
    itemAdded: "New",
    itemAddedOnSource: "Added on source — add here",
    orderChanged: "Order changed",
    orderResolved: "Order updated on this side",
    applySourceOrder: "Apply source order",
    dragToReorder: "Drag to reorder",
    published: "Published",
    noDraft: "No staged edit found. Start from the editor.",
    backToEditor: "← Back to editor",
    backHome: "← Back to resume",
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
    appearance: {
      title: string;
      description: string;
      skins: {
        editorial: { name: string; description: string };
        soft: { name: string; description: string };
        glass: { name: string; description: string };
        cyber: { name: string; description: string };
      };
      transparency: string;
      transparencyHint: string;
    };
    language: {
      title: string;
      description: string;
    };
  };
  common: {
    loadingResume: string;
  };
  edit: {
    eyebrow: string;
    title: string;
    blurbPrefix: string;
    blurbSuffix: string;
    persistenceReady: string;
    persistenceUnavailable: string;
    lockEditor: string;
    save: string;
    saving: string;
    downloadJson: string;
    previewPdf: string;
    editingLocale: string;
    otherLanguagesTitle: string;
    otherLanguagesBlurb: string;
    selectLanguages: string;
    continueToOther: string;
    saveThisOnly: string;
    cancel: string;
    selectAtLeastOne: string;
    leaveConfirmTitle: string;
    leaveConfirmBlurb: string;
    leaveConfirm: string;
    leaveStay: string;
    saveThisOnlyConfirmTitle: string;
    saveThisOnlyConfirmBlurb: string;
    saveThisOnlyConfirm: string;
    reviewTitle: string;
    reviewSource: string;
    reviewTarget: string;
    reviewQueue: string;
    reviewDone: string;
    reviewNext: string;
    reviewAbandon: string;
    reviewHint: string;
    fieldChanged: string;
    fieldChangedLegend: string;
    fieldResolved: string;
    fieldResolvedLegend: string;
    scrollToNextPending: string;
    itemRemoved: string;
    itemAdded: string;
    itemAddedOnSource: string;
    orderChanged: string;
    orderResolved: string;
    applySourceOrder: string;
    dragToReorder: string;
    published: string;
    noDraft: string;
    backToEditor: string;
    backHome: string;
  };
  a11y: {
    language: string;
    settings: string;
  };
};
