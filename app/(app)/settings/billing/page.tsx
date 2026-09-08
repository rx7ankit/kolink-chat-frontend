"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBilling, type Billing } from "@/lib/api/settings";
import { ApiError } from "@/lib/api/client";
import { formatNumber } from "@/lib/utils";

export default function BillingSettingsPage() {
  const [billing, setBilling] = useState<Billing | null>(null);

  useEffect(() => {
    void getBilling()
      .then(setBilling)
      .catch((error) => toast.error(error instanceof ApiError ? error.detail : "Failed to load billing"));
  }, []);

  const used = billing?.active_contacts_used ?? 0;
  const limit = billing?.active_contacts_limit ?? 1;
  const usage = Math.round((used / limit) * 100);

  return (
    <div>
      <h1 className="text-xl font-semibold">Billing</h1>
      <p className="mt-1 text-sm text-muted-foreground">{billing?.plan ?? "Growth"} plan · billed monthly.</p>
      <div className="mt-6 glass rounded-2xl p-5">
        <p className="text-sm font-medium">{billing?.plan ?? "Growth"} plan</p>
        <p className="mt-2 text-3xl font-semibold tracking-tight">${billing?.price_monthly ?? 149} / mo</p>
        <p className="mt-4 text-xs text-muted-foreground">
          {formatNumber(used)} of {formatNumber(limit)} active contacts
        </p>
        <Progress className="mt-2" value={usage} />
      </div>
      <h2 className="mt-8 mb-3 text-sm font-medium">Invoices</h2>
      <div className="glass rounded-2xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(billing?.invoices ?? []).map((invoice) => (
              <TableRow key={invoice.id}>
                <TableCell>{invoice.number}</TableCell>
                <TableCell>
                  {new Date(invoice.issued_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </TableCell>
                <TableCell>${(invoice.amount_cents / 100).toFixed(2)}</TableCell>
                <TableCell className="capitalize">{invoice.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
