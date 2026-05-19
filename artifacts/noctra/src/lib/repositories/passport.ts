// Passport data is computed dynamically from reports/tasks/signals — no dedicated table.

export async function getPassport(): Promise<null> {
  return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function upsertPassport(_patch: Record<string, unknown>): Promise<null> {
  return null;
}
