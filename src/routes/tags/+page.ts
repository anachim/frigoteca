import { getDb } from "$lib/db";
import { listTags } from "$lib/tags";

export async function load() {
  return { tags: await listTags(await getDb()) };
}
