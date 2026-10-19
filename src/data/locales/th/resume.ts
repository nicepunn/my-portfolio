import resumeJson from "./resume.json";
import { normalizeResume, resumeSchema, type Resume } from "@/lib/resume-schema";

export const resumeTh: Resume = normalizeResume(resumeSchema.parse(resumeJson));
