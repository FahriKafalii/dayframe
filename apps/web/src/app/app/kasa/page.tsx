"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  Plus,
  Wallet,
} from "lucide-react";
import type {
  AccountDto,
  CategoryTreeNode,
  KasaSummaryDto,
  TransactionDto,
} from "@dayframe/types";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/empty-state";
import { TransactionFormModal } from "@/components/kasa/transaction-form-modal";
import { AccountFormModal } from "@/components/kasa/account-form-modal";
import { TransferFormModal } from "@/components/kasa/transfer-form-modal";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { formatMoney } from "@/lib/money";
import { prettyDate } from "@/lib/date";
import { cn } from "@/lib/cn";

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

export default function KasaPage() {
  const { t, locale } = useT();
  const [summary, setSummary] = useState<KasaSummaryDto | null>(null);
  const [accounts, setAccounts] = useState<AccountDto[]>([]);
  const [categories, setCategories] = useState<CategoryTreeNode[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [txMode, setTxMode] = useState<"expense" | "income">("expense");
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [s, a, c] = await Promise.all([
        api.kasa.summary(),
        api.kasa.accounts.list(),
        api.kasa.categories.tree({ locale }),
      ]);
      setSummary(s);
      setAccounts(a);
      setCategories(c);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("kasa.loadFailed"));
    }
  }, [t, locale]);

  useEffect(() => {
    void load();
  }, [load]);

  const baseCcy = summary?.base_currency ?? "TRY";

  const categoryNames = useMemo(
    () => flattenCategoryNames(categories),
    [categories],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("kasa.title")}
        description={t("kasa.description")}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/app/kasa/analytics">
              <Button variant="ghost">
                <BarChart3 size={16} />
                {t("kasaAnalytics.title")}
              </Button>
            </Link>
            <Button
              variant="secondary"
              onClick={() => setTransferOpen(true)}
              disabled={accounts.length < 2}
            >
              <ArrowLeftRight size={16} />
              {t("kasa.newTransfer")}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                setTxMode("income");
                setTxOpen(true);
              }}
            >
              <ArrowDownRight size={16} />
              {t("kasa.newIncome")}
            </Button>
            <Button
              onClick={() => {
                setTxMode("expense");
                setTxOpen(true);
              }}
            >
              <ArrowUpRight size={16} />
              {t("kasa.newExpense")}
            </Button>
          </div>
        }
      />

      {error ? (
        <ErrorState
          message={error}
          onRetry={load}
          retryLabel={t("common.tryAgain")}
        />
      ) : !summary ? (
        <LoadingState />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label={t("kasa.kpiBalance")}
              value={formatMoney(summary.totals.total_balance, baseCcy, locale)}
              icon={<Wallet size={16} />}
            />
            <StatCard
              label={t("kasa.kpiIncomeMtd")}
              value={
                <span className="text-[color:var(--color-success)]">
                  {formatMoney(summary.totals.income_mtd, baseCcy, locale)}
                </span>
              }
              icon={<ArrowDownRight size={16} />}
            />
            <StatCard
              label={t("kasa.kpiExpenseMtd")}
              value={
                <span className="text-[color:var(--color-danger)]">
                  {formatMoney(summary.totals.expense_mtd, baseCcy, locale)}
                </span>
              }
              icon={<ArrowUpRight size={16} />}
            />
            <StatCard
              label={t("kasa.kpiNetMtd")}
              value={formatMoney(summary.totals.net_mtd, baseCcy, locale)}
            />
          </div>

          <div className="grid lg:grid-cols-[1fr_360px] gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t("kasa.recent")}</CardTitle>
                <Link
                  href="/app/kasa/transactions"
                  className="text-xs underline text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                >
                  {t("kasa.viewAll")}
                </Link>
              </CardHeader>
              <CardBody>
                {summary.recent.length === 0 ? (
                  <EmptyState
                    icon={<Wallet size={18} />}
                    title={t("kasa.noTxYet")}
                    description={t("kasa.noTxYetBody")}
                    action={
                      <Button
                        size="sm"
                        onClick={() => {
                          setTxMode("expense");
                          setTxOpen(true);
                        }}
                      >
                        <Plus size={14} />
                        {t("kasa.newTx")}
                      </Button>
                    }
                  />
                ) : (
                  <ul className="divide-y divide-[color:var(--color-border)]">
                    {summary.recent.map((tx) => (
                      <TxRow
                        key={tx.id}
                        tx={tx}
                        accounts={accounts}
                        categoryNames={categoryNames}
                        locale={locale}
                        transferLabel={t("kasa.ui.transferLabel")}
                      />
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <aside className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t("kasa.accounts")}</CardTitle>
                  <button
                    type="button"
                    onClick={() => setAccountModalOpen(true)}
                    className="text-xs underline text-[color:var(--color-fg-muted)] hover:text-[color:var(--color-fg)]"
                  >
                    {t("kasa.addAccount")}
                  </button>
                </CardHeader>
                <CardBody>
                  {accounts.length === 0 ? (
                    <EmptyState
                      title={t("kasa.noAccounts")}
                      description={t("kasa.noAccountsBody")}
                      action={
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => setAccountModalOpen(true)}
                        >
                          <Plus size={14} />
                          {t("kasa.addAccount")}
                        </Button>
                      }
                    />
                  ) : (
                    <ul className="space-y-1">
                      {accounts.map((acc) => (
                        <li key={acc.id}>
                          <Link
                            href={`/app/kasa/transactions?account_id=${acc.id}`}
                            className="group flex items-center justify-between gap-3 text-sm -mx-2 px-2 py-1.5 rounded-md hover:bg-[color:var(--color-surface-2)] transition-colors"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="h-2.5 w-2.5 rounded-full shrink-0"
                                style={{
                                  background:
                                    acc.color ?? "var(--color-fg-subtle)",
                                }}
                              />
                              <span className="font-medium truncate">
                                {acc.name}
                              </span>
                              <span className="text-[10px] uppercase tracking-wide text-[color:var(--color-fg-subtle)] shrink-0">
                                {t(
                                  `kasa.account.kindLabel.${acc.kind}` as never,
                                )}
                              </span>
                            </div>
                            <span className="tabular-nums font-medium shrink-0">
                              {formatMoney(
                                acc.current_balance,
                                acc.currency,
                                locale,
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </aside>
          </div>
        </>
      )}

      <TransactionFormModal
        open={txOpen}
        onClose={() => setTxOpen(false)}
        onSaved={load}
        accounts={accounts}
        categories={categories}
        initialMode={txMode}
      />
      <AccountFormModal
        open={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        onSaved={load}
      />
      <TransferFormModal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        onSaved={load}
        accounts={accounts}
      />
    </div>
  );
}

function TxRow({
  tx,
  accounts,
  categoryNames,
  locale,
  transferLabel,
}: {
  tx: TransactionDto;
  accounts: AccountDto[];
  categoryNames: Map<string, string>;
  locale: "tr" | "en";
  transferLabel: string;
}) {
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
      className={cn(
        "py-3 flex items-center gap-3",
        isTransfer &&
          "border-l-2 border-[color:var(--color-border-strong)] pl-3 -ml-3",
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
    </li>
  );
}
