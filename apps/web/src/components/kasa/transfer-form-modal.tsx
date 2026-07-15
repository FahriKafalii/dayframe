"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AccountDto } from "@dayframe/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { todayIso } from "@/lib/date";
import { useT } from "@/lib/i18n-context";

export function TransferFormModal({
  open,
  onClose,
  onSaved,
  accounts,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  accounts: AccountDto[];
}) {
  const { t } = useT();
  const [fromId, setFromId] = useState<string>("");
  const [toId, setToId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayIso());
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setNote("");
    setDate(todayIso());
    const first = accounts[0]?.id ?? "";
    const second = accounts.find((a) => a.id !== first)?.id ?? "";
    setFromId(first);
    setToId(second);
  }, [open, accounts]);

  const toAccountOptions = useMemo(
    () => accounts.filter((a) => a.id !== fromId),
    [accounts, fromId],
  );

  const submit = async () => {
    if (!amount || Number(amount) <= 0) {
      toast.error(t("kasa.form.amountRequired"));
      return;
    }
    if (!fromId || !toId) {
      toast.error(t("kasa.form.selectAccount"));
      return;
    }
    if (fromId === toId) {
      toast.error(t("kasa.transfer.sameAccount"));
      return;
    }
    setSubmitting(true);
    try {
      await api.kasa.transfer({
        from_account_id: fromId,
        to_account_id: toId,
        amount: amount.replace(",", "."),
        occurred_at: date,
        note: note || undefined,
      });
      toast.success(t("kasa.notify.transferDone"));
      onSaved();
      onClose();
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : t("kasa.notify.saveFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const notEnoughAccounts = accounts.length < 2;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("kasa.transfer.title")}
      description={t("kasa.transfer.subtitle")}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("kasa.form.cancel")}
          </Button>
          <Button
            onClick={submit}
            disabled={submitting || notEnoughAccounts}
          >
            {t("kasa.transfer.execute")}
          </Button>
        </>
      }
    >
      {notEnoughAccounts ? (
        <p className="text-sm text-[color:var(--color-fg-subtle)] py-4">
          {t("kasa.transfer.needTwoAccounts")}
        </p>
      ) : (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
              {t("kasa.transfer.amount")}
            </label>
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              className="text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
                {t("kasa.form.fromAccount")}
              </label>
              <select
                className="h-9 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm"
                value={fromId}
                onChange={(e) => {
                  const next = e.target.value;
                  setFromId(next);
                  if (next === toId) {
                    const alt = accounts.find((a) => a.id !== next);
                    if (alt) setToId(alt.id);
                  }
                }}
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
                {t("kasa.form.toAccount")}
              </label>
              <select
                className="h-9 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 text-sm"
                value={toId}
                onChange={(e) => setToId(e.target.value)}
              >
                {toAccountOptions.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
              {t("kasa.form.date")}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
              {t("kasa.transfer.noteOptional")}
            </label>
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              placeholder={t("kasa.form.notePlaceholder")}
            />
          </div>
        </div>
      )}
    </Modal>
  );
}
