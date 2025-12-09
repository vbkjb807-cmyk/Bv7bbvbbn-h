import { Wallet, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BalanceDisplayProps {
  balance: string;
  onTopUp?: () => void;
  compact?: boolean;
}

export function BalanceDisplay({ balance, onTopUp, compact = false }: BalanceDisplayProps) {
  const formattedBalance = parseFloat(balance || "0").toFixed(2);
  
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="gap-1 px-3 py-1">
          <Wallet className="h-3 w-3" />
          <span className="font-mono text-sm">${formattedBalance}</span>
        </Badge>
        {onTopUp && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onTopUp}
            data-testid="button-topup-compact"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-border bg-card">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-full bg-primary/10">
          <Wallet className="h-6 w-6 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Available Balance</p>
          <p className="text-3xl font-bold tabular-nums font-mono">${formattedBalance}</p>
        </div>
      </div>
      {onTopUp && (
        <Button onClick={onTopUp} className="ml-auto" data-testid="button-topup">
          <Plus className="h-4 w-4 mr-2" />
          Top Up
        </Button>
      )}
    </div>
  );
}
