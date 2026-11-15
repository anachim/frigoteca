import { getDb } from "$lib/db";
import { listShopping } from "$lib/shopping";

export async function load() {
  return { items: await listShopping(await getDb()) };
}
