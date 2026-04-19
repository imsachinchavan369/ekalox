import type { Category } from "@/types";

export const CATEGORY_OPTIONS: ReadonlyArray<{ value: Category; label: string }> = [
  { value: "design", label: "Design" },
  { value: "templates", label: "Templates" },
  { value: "code", label: "Code" },
  { value: "audio", label: "Audio" },
  { value: "video", label: "Video" },
  { value: "ebooks", label: "eBooks" },
  { value: "courses", label: "Courses" },
  { value: "other", label: "Other" },
];
