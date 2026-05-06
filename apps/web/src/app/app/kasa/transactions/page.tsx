"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  Pencil,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { AccountDto, CategoryTreeNode, TransactionDto } from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/empty-state";
import { TransactionFormModal } from "@/components/kasa/transaction-form-modal";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { formatMoney } from "@/lib/money";
import { prettyDate } from "@/lib/date";
import { cn } from "@/lib/cn";

type FilterMode = "all" | "expense" | "income" | "transfer";

function flattenCategoryNames(
  nodes: CategoryTreeNode[],
  out: Map<string, string> = new Map(),
): Map<string, string> {
  for (const n of nodes) {
    out.set(n.id, n.name);
    if (n.children?.length) flattenCategoryNames(n.children, out);
  }
  return out;
}

function readInitialFilter(value: string | null): FilterMode {
  switch (value) {
    case "expense":
    case "income":
    case "transfer":
    case "all":
      return value;
    default:
      return "all";
  }
}

export default function KasaTransactionsPage() {
  const { t, locale } = useT();
  const searchParams = useSearchParams();

  const [txs, setTxs] = useState<TransactionDto[] | null>(null);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterMode>(() =>
    readInitialFilter(searchParams.get("type")),
  );
  const [search, setSearch] = useState(() => searchParams.get("search") ?? "");
  const [from, setFrom] = useState(() => searchParams.get("from") ?? "");
  const [to, setTo] = useState(() => searchParams.get("to") ?? "");
  const [accountId, setAccountId] = useState<string>(
    () => searchParams.get("account_id") ?? "",
  );
  const [txOpen, setTxOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionDto | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const params: Parameters<typeof api.kasa.transactions.list>[0] = {
        limit: 200,
      };
      if (filter === "expense") params.type = "expense";
      else if (filter === "income") params.type = "income";
      // for "transfer" we'll filter client-side since both legs share group
      if (search) params.search = search;
      if (from) params.from = from;
      if (to) params.to = to;
      if (accountId) params.account_id = accountId;

      const [list, accs, cats] = await Promise.all([
        api.kasa.transactions.list(params),
        accounts.length === 0 ? api.kasa.accounts.list() : Promise.resolve(accounts),
        categories.length === 0
          ? api.kasa.categories.tree({ locale })
          : Promise.resolve(categories),
      ]);
      setTxs(list);
      if (accounts.length === 0) setAccounts(accs);
      if (categories.length === 0) setCategories(cats);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("kasa.transactions.loadFailed"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, from, to, accountId, locale, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleTxs = useMemo(() => {
    if (!txs) return null;
    if (filter === "transfer") {
      return txs.filter((x) => x.type === "transfer_in" || x.type === "transfer_out");
    }
    return txs;
  }, [txs, filter]);

  const categoryNames = useMemo(
    () => flattenCategoryNames(categories),
    [categories],
  );

  const onDelete = async (id: string) => {
    if (!window.confirm(t("kasa.transactions.deleteConfirm"))) return;
    try {
      await api.kasa.transactions.remove(id);
      toast.success(t("kasa.notify.txDeleted"));
      void load();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t("kasa.notify.deleteFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("kasa.transactions.title")}
        description={t("kasa.transactions.description")}
        actions={
          <Button onClick={() => setTxOpen(true)}>
            {t("kasa.newTx")}
          </Button>
        }
      />

      <Card className="p-4 sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-[color:var(--color-surface)]/85">
        <div className="flex flex-wrap items-center gap-2">
          {(["all", "expense", "income", "transfer"] as FilterMode[]).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={cn(
                "h-8 px-3 rounded-full text-xs font-medium border transition-colors",
                filter === f
                  ? "bg-[color:var(--color-accent)] text-[color:var(--color-accent-fg)] border-[color:var(--color-accent)]"
                  : "bg-[color:var(--color-surface)] border-[color:var(--color-border)] text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]",
              )}
            >
              {t(`kasa.transactions.filter${f.charAt(0).toUpperCase() + f.slice(1)}` as never)}
            </button>
          ))}
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[color:var(--color-fg-subtle)]"
              />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("kasa.transactions.search")}
                className="pl-8 w-44"
              />
            </div>
            {accounts.length > 0 && (
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                aria-label={t("kasa.form.account")}
                className="h-10 rounded-md border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg)] px-3 text-sm"
              >
                <option value="">{t("kasa.form.account")}</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            )}
            <Input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-36"
              aria-label={t("kasa.transactions.from")}
            />
            <Input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-36"
              aria-label={t("kasa.transactions.to")}
            />
          </div>
        </div>
      </Card>

      <Card>
        {error ? (
          <ErrorState message={error} onRetry={load} retryLabel={t("common.tryAgain")} />
        ) : !visibleTxs ? (
          <LoadingState />
        ) : visibleTxs.length === 0 ? (
          <div className="p-6">
            <EmptyState
              title={t("kasa.transactions.empty")}
              description={t("kasa.transactions.emptyBody")}
            />
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-border)]">
            {visibleTxs.map((tx) => (
              <Row
                key={tx.id}
                tx={tx}
                accounts={accounts}
                categoryNames={categoryNames}
                locale={locale}
                onDelete={() => onDelete(tx.id)}
                onEdit={() => setEditingTx(tx)}
                deleteAria={t("kasa.ui.deleteTransaction")}
                editAria={t("kasa.transactions.editAria")}
                transferLabel={t("kasa.ui.transferLabel")}
              />
            ))}
          </ul>
        )}
      </Card>

      <TransactionFormModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        onSaved={load}
        accounts={accounts}
        categories={categories}
      />
      <TransactionFormModal
        open={editingTx !== null}
        onClose={() => setEditingTx(null)}
        onSaved={load}
        accounts={accounts}
        categories={categories}
        editingTx={editingTx}
      />
    </div>
  );
}

function Row({
  tx,
  accounts,
  categoryNames,
  locale,
  onDelete,
  onEdit,
  deleteAria,
  editAria,
  transferLabel,
}: {
  tx: TransactionDto;
  accounts: AccountDto[];
  categoryNames: Map<string, string>;
  locale: "tr" | "en";
  onDelete: () => void;
  onEdit: () => void;
  deleteAria: string;
  editAria: string;
  transferLabel: string;
}) {
  const editable = tx.type !== "transfer_in" && tx.type !== "transfer_out";
  const acc = accounts.find((a) => a.id === tx.account_id);
  const isIncome = tx.type === "income" || tx.type === "transfer_in";
  const isTransfer = tx.type === "transfer_in" || tx.type === "transfer_out";
  const sign = isIncome ? "+" : "−";
  const categoryName = tx.category_id
    ? categoryNames.get(tx.category_id)
    : undefined;
  const primary = isTransfer
    ? transferLabel
    : tx.payee || categoryName || tx.note || "—";
  return (
    <li
      onDoubleClick={editable ? onEdit : undefined}
      className={cn(
        "py-3 px-4 flex items-center gap-3 group",
        isTransfer &&
          "border-l-2 border-[color:var(--color-border-strong)] bg-[color:var(--color-surface-2)]/40",
      )}
    >
      <div
        className={cn(
          "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
          isTransfer
            ? "bg-[color:var(--color-surface-2)] text-[color:var(--color-fg-muted)]"
            : isIncome
              ? "bg-[color:var(--color-success-soft)] text-[color:var(--color-success)]"
              : "bg-[color:var(--color-danger-soft)] text-[color:var(--color-danger)]",
        )}
      >
        {isTransfer ? (
          <ArrowLeftRight size={16} />
        ) : isIncome ? (
          <ArrowDownRight size={16} />
        ) : (
          <ArrowUpRight size={16} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "text-sm font-medium truncate",
            isTransfer && "italic text-[color:var(--color-fg-muted)]",
          )}
        >
          {primary}
        </p>
        <p className="text-xs text-[color:var(--color-fg-subtle)]">
          {prettyDate(tx.occurred_at.slice(0, 10), locale)}
          {acc ? ` · ${acc.name}` : ""}
        </p>
      </div>
      <div
        className={cn(
          "tabular-nums font-medium text-sm",
          isTransfer
            ? "text-[color:var(--color-fg-muted)]"
            : isIncome
              ? "text-[color:var(--color-success)]"
              : "text-[color:var(--color-danger)]",
        )}
      >
        {isTransfer ? "" : sign}
        {formatMoney(tx.amount, tx.currency, locale)}
      </div>
      {editable && (
        <button
          type="button"
          onClick={onEdit}
          className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:bg-[color:var(--color-surface-2)] hover:text-[color:var(--color-fg)]"
          aria-label={editAria}
        >
          <Pencil size={14} />
        </button>
      )}
      <button
        type="button"
        onClick={onDelete}
        className="opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity h-8 w-8 rounded-md inline-flex items-center justify-center text-[color:var(--color-fg-subtle)] hover:bg-[color:var(--color-danger-soft)] hover:text-[color:var(--color-danger)]"
        aria-label={deleteAria}
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
