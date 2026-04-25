import { z } from "zod";

export const courseModuleAnchorSchema = z.object({
  label: z.string().min(1),
  seconds: z.number().nonnegative(),
});

export const courseModuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  paragraphs: z.array(z.string().min(1)).min(1),
  anchors: z.array(courseModuleAnchorSchema).optional(),
});

export const generatedCourseSchema = z.object({
  videoId: z.string().min(1),
  title: z.string().min(1),
  subtitle: z.string().optional(),
  summary: z.string().min(1),
  learningObjectives: z.array(z.string().min(1)).min(1),
  modules: z.array(courseModuleSchema).min(1),
  keyTakeaways: z.array(z.string().min(1)).min(1),
  disclaimer: z.array(z.string().min(1)).min(1),
  tags: z.array(z.string()).optional(),
  estimatedMinutes: z.number().positive().optional(),
  sourceVideoUrl: z.string().url(),
});

export type GeneratedCourse = z.infer<typeof generatedCourseSchema>;
export type CourseModule = z.infer<typeof courseModuleSchema>;

export const courseCatalogEntrySchema = z.object({
  videoId: z.string().min(1),
  category: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().optional(),
  thumbnailUrl: z.string().url().optional(),
});

export const courseCatalogSchema = z.object({
  courses: z.array(courseCatalogEntrySchema),
});

export type CourseCatalog = z.infer<typeof courseCatalogSchema>;
export type CourseCatalogEntry = z.infer<typeof courseCatalogEntrySchema>;
