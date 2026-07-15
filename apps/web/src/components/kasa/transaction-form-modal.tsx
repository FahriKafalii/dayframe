"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { AccountDto, CategoryTreeNode, TransactionDto } from "@dayframe/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { todayIso } from "@/lib/date";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";

type Mode = "expense" | "income";

export function TransactionFormModal({
  open,
  onClose,
  onSaved,
  accounts,
  categories,
  initialMode = "expense",
  editingTx = null,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  accounts: AccountDto[];
  categories: CategoryTreeNode[];
  initialMode?: Mode;
  editingTx?: TransactionDto | null;
}) {
  const { t } = useT();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [accountId, setAccountId] = useState<string>("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<string>(todayIso());
  const [payee, setPayee] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editingTx) {
      const editMode: Mode =
        editingTx.type === "income" ? "income" : "expense";
      setMode(editMode);
      setAmount(editingTx.amount);
      setPayee(editingTx.payee ?? "");
      setNote(editingTx.note ?? "");
      setDate(editingTx.occurred_at.slice(0, 10));
      setCategoryId(editingTx.category_id ?? "");
      setAccountId(editingTx.account_id);
    } else {
      setMode(initialMode);
      setAmount("");
      setPayee("");
      setNote("");
      setDate(todayIso());
      setCategoryId("");
      setAccountId(accounts[0]?.id ?? "");
    }
  }, [open, initialMode, accounts, editingTx]);

  const flatCats = useMemo(() => {
    const out: { id: string; name: string; depth: number }[] = [];
    const walk = (nodes: CategoryTreeNode[], depth: number) => {
      for (const n of nodes) {
        if (n.type === mode) out.push({ id: n.id, name: n.name, depth });
        walk(n.children ?? [], depth + 1);
      }
    };
    walk(categories, 0);
    return out;
  }, [categories, mode]);

  const selectedAccount = accounts.find((a) => a.id === accountId);
  const currency = selectedAccount?.currency ?? "TRY";

  const submit = async () => {
    if (!amount || Number(amount.replace(",", ".")) <= 0) {
      toast.error(t("kasa.form.amountRequired"));
      return;
    }
    if (!accountId) {
      toast.error(t("kasa.form.selectAccount"));
      return;
    }
    setSubmitting(true);
    try {
      if (editingTx) {
        await api.kasa.transactions.update(editingTx.id, {
          account_id: accountId,
          category_id: categoryId || null,
          type: mode,
          amount: amount.replace(",", "."),
          currency,
          occurred_at: date,
          payee: payee || undefined,
          note: note || undefined,
        });
        toast.success(t("kasa.notify.txUpdated"));
      } else {
        await api.kasa.transactions.create({
          account_id: accountId,
          category_id: categoryId || null,
          type: mode,
          amount: amount.replace(",", "."),
          currency,
          occurred_at: date,
          payee: payee || undefined,
          note: note || undefined,
        });
        toast.success(t("kasa.notify.txCreated"));
      }
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("kasa.notify.saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingTx ? t("kasa.transactions.editTitle") : t("kasa.newTx")}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("kasa.form.cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting}>
            {t("kasa.form.save")}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-2 mb-4">
        <button
          type="button"
          onClick={() => setMode("expense")}
          className={cn(
            "h-9 rounded-md text-sm font-medium border transition-colors",
            mode === "expense"
              ? "bg-[color:var(--color-danger-soft)] border-[color:var(--color-danger)]/40 text-[color:var(--color-danger)]"
              : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]",
          )}
        >
          {t("kasa.newExpense")}
        </button>
        <button
          type="button"
          onClick={() => setMode("income")}
          className={cn(
            "h-9 rounded-md text-sm font-medium border transition-colors",
            mode === "income"
              ? "bg-[color:var(--color-success-soft)] border-[color:var(--color-success)]/40 text-[color:var(--color-success)]"
              : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-fg-muted)]",
          )}
        >
          {t("kasa.newIncome")}
        </button>
      </div>

      <div className="space-y-3">
        <div>
          <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
            {t("kasa.form.amount")}
          </label>
          <div className="relative">
            <Input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t("kasa.ui.amountPlaceholder")}
              autoFocus
              className={cn(
                "h-14 text-2xl font-semibold tabular-nums tracking-tight pr-16",
                mode === "income"
                  ? "text-[color:var(--color-success)]"
                  : "text-[color:var(--color-danger)]",
              )}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium uppercase tracking-wide text-[color:var(--color-fg-subtle)] tabular-nums">
              {currency}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
              {t("kasa.form.account")}
            </label>
            <select
              className="h-9 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg)] px-3 text-sm"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
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
              {t("kasa.form.date")}
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
            {t("kasa.form.category")}
          </label>
          <select
            className="h-9 w-full rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg)] px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">— {t("kasa.form.selectCategory")} —</option>
            {flatCats.map((c) => (
              <option key={c.id} value={c.id}>
                {"  ".repeat(c.depth)}
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
            {t("kasa.form.payee")}
          </label>
          <Input
            value={payee}
            onChange={(e) => setPayee(e.target.value)}
            placeholder={t("kasa.form.payeePlaceholder")}
            className="h-9"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
            {t("kasa.form.note")}
          </label>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            placeholder={t("kasa.form.notePlaceholder")}
          />
        </div>
      </div>
    </Modal>
  );
}
