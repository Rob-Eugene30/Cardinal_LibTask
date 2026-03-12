import { apiDelete, apiGet, apiPost } from "./http";
import type { TagRecord } from "../types/tag";

export type Tag = TagRecord;

export function listTags() {
  return apiGet<Tag[]>("/tags");
}

export function createTag(name: string) {
  return apiPost<Tag>("/tags", { name });
}

export function deleteTag(tagId: string) {
  return apiDelete<{ deleted: boolean }>(`/tags/${encodeURIComponent(tagId)}`);
}
