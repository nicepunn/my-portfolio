import { z } from "zod";

export const experienceSchema = z.object({
  company: z.string().min(1),
  role: z.string().min(1),
  period: z.string().min(1),
  bullets: z.array(z.string().min(1)).min(1),
});

export const projectSchema = z.object({
  name: z.string().min(1),
  stack: z.string().min(1),
  description: z.array(z.string().min(1)).min(1),
  url: z.union([z.string().url(), z.literal("")]).optional(),
});

export const skillGroupSchema = z.object({
  label: z.string().min(1),
  items: z.array(z.string().min(1)).min(1),
});

export const resumeSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  summary: z.string().min(1),
  location: z.string().min(1),
  email: z.string().email(),
  github: z.object({
    label: z.string().min(1),
    url: z.string().url(),
  }),
  pdfPath: z.string().min(1),
  experience: z.array(experienceSchema),
  projects: z.array(projectSchema),
  skills: z.array(skillGroupSchema),
  education: z.object({
    degree: z.string().min(1),
    school: z.string().min(1),
    period: z.string().min(1),
    gpax: z.string().min(1),
  }),
  activities: z.array(z.string().min(1)),
  interests: z.array(z.string().min(1)),
});

export type Resume = z.infer<typeof resumeSchema>;
export type Experience = z.infer<typeof experienceSchema>;
export type Project = z.infer<typeof projectSchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;

export function normalizeResume(data: Resume): Resume {
  return {
    ...data,
    projects: data.projects.map((project) => {
      const url = project.url?.trim();
      return url ? { ...project, url } : { ...project, url: undefined };
    }),
  };
}
