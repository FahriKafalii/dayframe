"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import type { JournalEntryDto } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { LoadingState } from "@/components/ui/empty-state";
import { MoodPicker } from "@/components/journal/mood-picker";
import { DatePicker } from "@/components/ui/date-picker";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import {
  addDays,
  parseISO,
  prettyDate,
  subDays,
  todayIso,
  toIso,
} from "@/lib/date";
import { toast } from "sonner";

function JournalEditor() {
  const searchParams = useSearchParams();
  const { t, locale } = useT();
  const initialDate = searchParams.get("date") ?? todayIso();
  const [date, setDate] = useState<string>(initialDate);
  const [entry, setEntry] = useState<JournalEntryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState<number | null>(null);
  const [wins, setWins] = useState("");
  const [blockers, setBlockers] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(
    async (d: string) => {
      setLoading(true);
      try {
        const data = await api.journal.get(d);
        setEntry(data);
        setMood(data.mood);
        setWins(data.wins ?? "");
        setBlockers(data.blockers ?? "");
        setNotes(data.notes ?? "");
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          setEntry(null);
          setMood(null);
          setWins("");
          setBlockers("");
          setNotes("");
        } else {
          toast.error(
            err instanceof ApiError ? err.message : t("journal.loadFailed"),
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  useEffect(() => {
    void load(date);
    const url = new URL(window.location.href);
    url.searchParams.set("date", date);
    window.history.replaceState(null, "", url.toString());
  }, [date, load]);

  async function handleSave() {
    setSaving(true);
    try {
      const saved = await api.journal.upsert(date, {
        mood,
        wins,
        blockers,
        notes: notes.trim() ? notes : null,
      });
      setEntry(saved);
      toast.success(t("journal.saved"));
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("journal.saveFailed"),
      );
    } finally {
      setSaving(false);
    }
  }

  function shift(days: number) {
    const d = parseISO(date);
    setDate(toIso(days > 0 ? addDays(d, days) : subDays(d, -days)));
  }

  return (
    <div>
      <PageHeader
        title={t("journal.title")}
        description={prettyDate(date, locale)}
        actions={
          <>
            <div className="flex items-center gap-1">
              <button
                onClick={() => shift(-1)}
                className="h-10 w-10 rounded-md inline-flex items-center justify-center border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft size={16} />
              </button>
              <DatePicker
                value={date}
                onChange={(v) => v && setDate(v)}
                allowClear={false}
                align="end"
                className="w-44"
              />
              <button
                onClick={() => shift(1)}
                className="h-10 w-10 rounded-md inline-flex items-center justify-center border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)] hover:bg-[color:var(--color-surface-2)] transition-colors"
                aria-label="Next day"
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <Button variant="secondary" onClick={() => setDate(todayIso())}>
              {t("common.today")}
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save size={16} />
              {saving
                ? t("common.saving")
                : entry
                  ? t("common.update")
                  : t("common.save")}
            </Button>
          </>
        }
      />

      {loading ? (
        <LoadingState />
      ) : (
        <div className="space-y-4 max-w-3xl">
          <Card>
            <CardBody>
              <Label>{t("journal.mood")}</Label>
              <MoodPicker value={mood} onChange={setMood} />
              {entry && mood !== entry.mood && (
                <p className="mt-2 text-xs text-[color:var(--color-fg-subtle)]">
                  {t("journal.unsavedMood")}
                </p>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Label htmlFor="wins">{t("journal.wins")}</Label>
              <Textarea
                id="wins"
                rows={3}
                placeholder={t("journal.winsPlaceholder")}
                value={wins}
                onChange={(e) => setWins(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Label htmlFor="blockers">{t("journal.blockers")}</Label>
              <Textarea
                id="blockers"
                rows={3}
                placeholder={t("journal.blockersPlaceholder")}
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
              />
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Label htmlFor="notes">{t("journal.notes")}</Label>
              <Textarea
                id="notes"
                rows={6}
                placeholder={t("journal.notesPlaceholder")}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardBody>
          </Card>

          <div className="flex items-center justify-end gap-2">
            <Button onClick={handleSave} disabled={saving} size="lg">
              <Save size={16} />
              {saving
                ? t("common.saving")
                : entry
                  ? t("journal.updateEntry")
                  : t("journal.saveEntry")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function JournalPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <JournalEditor />
    </Suspense>
  );
}
