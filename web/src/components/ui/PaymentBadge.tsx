import { Banknote, CreditCard, Smartphone, Wallet } from "lucide-react";
import { Badge, type BadgeVariant } from "./Badge";
import { PAYMENT_TYPE_LABELS, type PaymentType } from "@/lib/types";

// Distinct color per PaymentType, built on top of the shared Badge
// component rather than one-off classes at each call site.
const PAYMENT_VARIANT: Record<PaymentType, BadgeVariant> = {
  CASH: "success",
  CARD: "info",
  MOBILE_MONEY: "purple",
  OTHER: "neutral",
};

const PAYMENT_ICON: Record<PaymentType, typeof Banknote> = {
  CASH: Banknote,
  CARD: CreditCard,
  MOBILE_MONEY: Smartphone,
  OTHER: Wallet,
};

export function PaymentBadge({ type }: { type: PaymentType }) {
  const Icon = PAYMENT_ICON[type];
  return (
    <Badge variant={PAYMENT_VARIANT[type]}>
      <Icon size={11} strokeWidth={2.25} />
      {PAYMENT_TYPE_LABELS[type]}
    </Badge>
  );
}
