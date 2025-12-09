import { ArrowUpRight, ArrowDownLeft, RefreshCw, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { Transaction } from "@shared/schema";

interface TransactionHistoryProps {
  transactions: Transaction[];
}

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  topup: { label: "Top Up", icon: ArrowDownLeft, color: "text-green-500" },
  charge: { label: "Charge", icon: ArrowUpRight, color: "text-red-500" },
  refund: { label: "Refund", icon: RefreshCw, color: "text-blue-500" },
  payout: { label: "Payout", icon: CreditCard, color: "text-purple-500" },
};

export function TransactionHistory({ transactions }: TransactionHistoryProps) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>No transactions yet</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
            <th className="pb-3 font-medium">Type</th>
            <th className="pb-3 font-medium">Description</th>
            <th className="pb-3 font-medium text-right">Amount</th>
            <th className="pb-3 font-medium text-right">Balance</th>
            <th className="pb-3 font-medium text-right">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {transactions.map((tx) => {
            const config = typeConfig[tx.type] || typeConfig.charge;
            const Icon = config.icon;
            const isPositive = tx.type === "topup" || tx.type === "refund";

            return (
              <tr key={tx.id} className="group" data-testid={`transaction-row-${tx.id}`}>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full bg-muted ${config.color}`}>
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <Badge variant="outline" size="sm">{config.label}</Badge>
                  </div>
                </td>
                <td className="py-4">
                  <p className="text-sm truncate max-w-[200px]">{tx.description || "—"}</p>
                </td>
                <td className="py-4 text-right">
                  <span className={`font-mono font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}>
                    {isPositive ? "+" : "-"}${Math.abs(parseFloat(tx.amount)).toFixed(2)}
                  </span>
                </td>
                <td className="py-4 text-right">
                  <span className="font-mono text-muted-foreground">
                    ${parseFloat(tx.balanceAfter || "0").toFixed(2)}
                  </span>
                </td>
                <td className="py-4 text-right text-sm text-muted-foreground">
                  {new Date(tx.createdAt || Date.now()).toLocaleDateString()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
