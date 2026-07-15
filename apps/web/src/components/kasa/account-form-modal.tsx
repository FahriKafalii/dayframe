"use client";

import { useEffect, useState } from "react";
import {
  Banknote,
  Bitcoin,
  CreditCard,
  Gem,
  Landmark,
  PiggyBank,
  Smartphone,
  TicketSlash,
  TrendingUp,
  Wallet,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import type { AccountKind } from "@dayframe/types";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api";
import { useT } from "@/lib/i18n-context";
import { cn } from "@/lib/cn";

const KIND_ICONS: Record<AccountKind, React.ComponentType<{ size?: number }>> = {
  cash: Banknote,
  checking: Landmark,
  savings: PiggyBank,
  credit_card: CreditCard,
  debit_card: WalletCards,
  prepaid: TicketSlash,
  wallet: Smartphone,
  investment: TrendingUp,
  loan: Wallet,
  gold: Gem,
  crypto: Bitcoin,
};

const KINDS: AccountKind[] = [
  "cash",
  "checking",
  "savings",
  "credit_card",
  "debit_card",
  "prepaid",
  "wallet",
  "investment",
  "loan",
  "gold",
  "crypto",
];

export function AccountFormModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useT();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<AccountKind>("checking");
  const [currency, setCurrency] = useState("TRY");
  const [opening, setOpening] = useState("0");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setKind("checking");
    setCurrency("TRY");
    setOpening("0");
  }, [open]);

  const submit = async () => {
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await api.kasa.accounts.create({
        name: name.trim(),
        kind,
        currency,
        opening_balance: opening.replace(",", ".") || "0",
      });
      toast.success(t("kasa.notify.accountCreated"));
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
      title={t("kasa.account.create")}
      maxWidth="max-w-md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            {t("kasa.form.cancel")}
          </Button>
          <Button onClick={submit} disabled={submitting || !name.trim()}>
            {t("kasa.form.save")}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label
            htmlFor="account-name"
            className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1"
          >
            {t("kasa.account.name")}
          </label>
          <Input
            id="account-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <span className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1">
            {t("kasa.account.kind")}
          </span>
          <div
            role="radiogroup"
            aria-label={t("kasa.account.kind")}
            className="grid grid-cols-3 sm:grid-cols-4 gap-2"
          >
            {KINDS.map((k) => {
              const Icon = KIND_ICONS[k];
              const active = kind === k;
              return (
                <button
                  key={k}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setKind(k)}
                  className={cn(
                    "flex flex-col items-center justify-center gap-1.5 h-[68px] rounded-md border text-[11px] font-medium leading-tight text-center px-2 transition-colors",
                    active
                      ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/10 text-[color:var(--color-fg)]"
                      : "border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-fg-muted)] hover:bg-[color:var(--color-surface-2)]",
                  )}
                >
                  <Icon size={18} />
                  <span className="truncate w-full">
                    {t(`kasa.account.kindLabel.${k}` as never)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label
              htmlFor="account-currency"
              className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1"
            >
              {t("kasa.account.currency")}
            </label>
            <Input
              id="account-currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value.toUpperCase())}
              maxLength={4}
            />
          </div>
          <div>
            <label
              htmlFor="account-opening"
              className="block text-xs font-medium text-[color:var(--color-fg-muted)] mb-1"
            >
              {t("kasa.account.openingBalance")}
            </label>
            <Input
              id="account-opening"
              type="text"
              inputMode="decimal"
              value={opening}
              onChange={(e) => setOpening(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
