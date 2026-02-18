import { apiGet, apiPost } from "./http";

export type Tag = { id: string; name: string };

export function listTags() {
  return apiGet<Tag[]>("/tags");
}

export function createTag(name: string) {
  return apiPost<Tag>("/tags", { name });
}
