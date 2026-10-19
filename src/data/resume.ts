import resumeJson from "./resume.json";
import { normalizeResume, resumeSchema, type Resume } from "@/lib/resume-schema";

export type { Experience, Project, Resume, SkillGroup } from "@/lib/resume-schema";

export const resume: Resume = normalizeResume(resumeSchema.parse(resumeJson));
