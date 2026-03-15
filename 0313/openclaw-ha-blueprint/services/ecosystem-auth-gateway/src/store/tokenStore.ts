import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export type TokenRecord = {
  provider: string;
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  expiresAt?: string;
};

type TokenStoreFile = {
  providers?: Record<string, TokenRecord>;
};

async function readStore(path: string): Promise<TokenStoreFile> {
  try {
    const text = await readFile(path, "utf8");
    return JSON.parse(text) as TokenStoreFile;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

export async function loadTokenRecord(
  path: string,
  provider: string,
): Promise<TokenRecord | null> {
  const store = await readStore(path);
  return store.providers?.[provider] ?? null;
}

export async function saveTokenRecord(
  path: string,
  provider: string,
  record: TokenRecord,
): Promise<void> {
  const store = await readStore(path);
  await mkdir(dirname(path), { recursive: true });
  await writeFile(
    path,
    JSON.stringify(
      {
        providers: {
          ...(store.providers ?? {}),
          [provider]: record,
        },
      },
      null,
      2,
    ),
    "utf8",
  );
}
