import { readFile } from "fs/promises";
import { join } from "path";
import { courseCatalogSchema, generatedCourseSchema } from "@/lib/learn-schema";
import type { CourseCatalog, GeneratedCourse } from "@/lib/learn-schema";

const coursesDir = () => join(process.cwd(), "content", "courses");

export async function loadCourseCatalog(): Promise<CourseCatalog> {
  const raw = await readFile(join(coursesDir(), "index.json"), "utf8");
  return courseCatalogSchema.parse(JSON.parse(raw));
}

export async function loadCourse(videoId: string): Promise<GeneratedCourse> {
  const raw = await readFile(join(coursesDir(), `${videoId}.json`), "utf8");
  return generatedCourseSchema.parse(JSON.parse(raw));
}
