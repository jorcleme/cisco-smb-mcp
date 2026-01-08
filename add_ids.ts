import { v4 as uuidv4 } from "uuid";

export interface Identifiable {
  id?: string;
}

export function addIdsToData<T extends Identifiable>(data: T[]): T[] {
  return data.map((item) => ({
    ...item,
    id: item.id || uuidv4(),
  }));
}

// Load data from /data/docs/*.json

import { readFile, writeFile } from "fs/promises";

export async function loadDataWithIds<T extends Identifiable>(
  filePath: string
): Promise<T[]> {
  const fileContent = await readFile(filePath, "utf-8");
  const data: T[] = JSON.parse(fileContent);
  return addIdsToData(data);
}

async function saveDataWithIds<T extends Identifiable>(
  filePath: string,
  data: T[]
): Promise<void> {
  const jsonData = JSON.stringify(data, null, 2);
  await writeFile(filePath, jsonData, "utf-8");
}

async function main() {
  const guides = ["catalyst_1200", "catalyst_1300"];
  for (const guide of guides) {
    const adminGuide = await loadDataWithIds(
      `./data/docs/${guide}_admin_guide.json`
    );
    console.log(adminGuide);
    await saveDataWithIds(`./data/docs/${guide}_admin_guide.json`, adminGuide);
  }
}

main().catch(console.error);
