import { randomUUID } from "crypto";
import { journalRepository } from "@/repositories/journalRepository";
import { AppError } from "@/lib/errors";

export interface UpsertJournalInput {
  mood?: number | null;
  wins?: string;
  blockers?: string;
  notes?: string | null;
}

export const journalService = {
  async upsert(userId: string, date: string, input: UpsertJournalInput) {
    return journalRepository.upsert({
      id: randomUUID(),
      user_id: userId,
      date,
      mood: input.mood ?? null,
      wins: input.wins ?? "",
      blockers: input.blockers ?? "",
      notes: input.notes ?? null,
    });
  },

  async getByDate(userId: string, date: string) {
    const entry = await journalRepository.findByUserAndDate(userId, date);
    if (!entry) {
      throw new AppError("NOT_FOUND", "Journal entry not found");
    }
    return entry;
  },
};
