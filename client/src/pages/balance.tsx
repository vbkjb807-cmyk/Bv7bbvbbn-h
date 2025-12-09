import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  Plus, 
  Loader2,
  CreditCard,
  Wallet,
  TrendingUp,
  AlertCircle,
  Copy,
  Check,
  Clock,
  RefreshCw,
  Bitcoin
} from "lucide-react";
import { SiTether } from "react-icons/si";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { TransactionHistory } from "@/components/TransactionHistory";
import type { Transaction, CryptoPayment } from "@shared/schema";

const topUpAmounts = ["10", "25", "50", "100", "250", "500"];

interface CryptoPaymentResponse {
  success: boolean;
  paymentId: string;
  addressIn: string;
  amount: string;
  coin: string;
  expiresAt: string;
  qrCode: string;
}

export default function Balance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedAmount, setSelectedAmount] = useState("50");
  const [paymentTab, setPaymentTab] = useState("crypto");
  const [cryptoPayment, setCryptoPayment] = useState<CryptoPaymentResponse | null>(null);
  const [copied, setCopied] = useState(false);
  const [checking, setChecking] = useState(false);

  const { data: transactions = [], isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: cryptoPayments = [] } = useQuery<CryptoPayment[]>({
    queryKey: ["/api/crypto/payments"],
  });

  const createCryptoPayment = useMutation({
    mutationFn: async (amount: string) => {
      const res = await apiRequest("POST", "/api/crypto/create-payment", { amount });
      return res.json();
    },
    onSuccess: (data: CryptoPaymentResponse) => {
      setCryptoPayment(data);
      toast({
        title: "Payment Created",
        description: "Send USDT to the address shown to complete payment.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const checkPayment = async (paymentId: string) => {
    setChecking(true);
    try {
      const res = await fetch(`/api/crypto/check-payment/${paymentId}`, {
        credentials: "include",
      });
      const payment = await res.json();
      
      if (payment.status === "confirmed") {
        toast({
          title: "Payment Confirmed",
          description: `${payment.amountReceived} USDT has been added to your balance.`,
        });
        queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        queryClient.invalidateQueries({ queryKey: ["/api/crypto/payments"] });
        setCryptoPayment(null);
        setTopUpOpen(false);
      } else if (payment.status === "confirming") {
        toast({
          title: "Payment Pending",
          description: `Confirmations: ${payment.confirmations}/1. Please wait...`,
        });
      } else {
        toast({
          title: "Waiting for Payment",
          description: "No payment detected yet. Please send USDT to the address.",
        });
      }
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Failed to check payment status.",
        variant: "destructive",
      });
    }
    setChecking(false);
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (cryptoPayment?.paymentId) {
      interval = setInterval(() => {
        checkPayment(cryptoPayment.paymentId);
      }, 30000);
    }
    return () => clearInterval(interval);
  }, [cryptoPayment?.paymentId]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };

  const handleCreateCryptoPayment = () => {
    const amount = customAmount || selectedAmount;
    if (parseFloat(amount) > 0) {
      createCryptoPayment.mutate(amount);
    }
  };

  const topUp = useMutation({
    mutationFn: async (amount: string) => {
      await apiRequest("POST", "/api/transactions/topup", { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setTopUpOpen(false);
      toast({
        title: "Top Up Successful",
        description: `$${selectedAmount} has been added to your balance.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Top Up Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleTestTopUp = () => {
    const amount = customAmount || selectedAmount;
    if (parseFloat(amount) > 0) {
      topUp.mutate(amount);
    }
  };

  const resetCryptoPayment = () => {
    setCryptoPayment(null);
  };

  const totalSpent = transactions
    .filter(t => t.type === "charge")
    .reduce((sum, t) => sum + Math.abs(parseFloat(t.amount)), 0);

  const totalTopUp = transactions
    .filter(t => t.type === "topup")
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const pendingPayments = cryptoPayments.filter(
    p => p.status === "waiting" || p.status === "confirming"
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Confirmed</Badge>;
      case "confirming":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Confirming</Badge>;
      case "waiting":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Waiting</Badge>;
      case "expired":
        return <Badge className="bg-muted text-muted-foreground">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Balance & Payments</h1>
          <p className="text-muted-foreground mt-1">
            Manage your account balance and view transaction history
          </p>
        </div>
        <Dialog open={topUpOpen} onOpenChange={(open) => {
          setTopUpOpen(open);
          if (!open) resetCryptoPayment();
        }}>
          <DialogTrigger asChild>
            <Button data-testid="button-open-topup">
              <Plus className="h-4 w-4 mr-2" />
              Top Up Balance
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Top Up Balance</DialogTitle>
              <DialogDescription>
                Add funds to your account using cryptocurrency (USDT TRC20).
              </DialogDescription>
            </DialogHeader>
            
            {!cryptoPayment ? (
              <Tabs value={paymentTab} onValueChange={setPaymentTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="crypto" className="gap-2">
                    <SiTether className="h-4 w-4" />
                    Crypto (USDT)
                  </TabsTrigger>
                  <TabsTrigger value="test" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Test Mode
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="crypto" className="space-y-4">
                  <div className="py-2 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {topUpAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                          className="h-12 font-mono"
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount("");
                          }}
                          data-testid={`button-amount-${amount}`}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                    <div className="relative">
                      <Label htmlFor="customAmount" className="text-sm text-muted-foreground">
                        Or enter custom amount
                      </Label>
                      <div className="relative mt-2">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <Input
                          id="customAmount"
                          type="number"
                          step="0.01"
                          min="1"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="pl-7"
                          placeholder="Enter amount"
                          data-testid="input-custom-amount"
                        />
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-muted flex items-start gap-3">
                      <SiTether className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium">Pay with USDT (TRC20)</p>
                        <p className="text-muted-foreground">
                          Fast, secure cryptocurrency payment via CryptAPI.
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTopUpOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateCryptoPayment}
                      disabled={createCryptoPayment.isPending}
                      data-testid="button-create-crypto-payment"
                    >
                      {createCryptoPayment.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Bitcoin className="h-4 w-4 mr-2" />
                      )}
                      Create Payment ${customAmount || selectedAmount}
                    </Button>
                  </DialogFooter>
                </TabsContent>
                
                <TabsContent value="test" className="space-y-4">
                  <div className="py-2 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      {topUpAmounts.map((amount) => (
                        <Button
                          key={amount}
                          variant={selectedAmount === amount && !customAmount ? "default" : "outline"}
                          className="h-12 font-mono"
                          onClick={() => {
                            setSelectedAmount(amount);
                            setCustomAmount("");
                          }}
                        >
                          ${amount}
                        </Button>
                      ))}
                    </div>
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-3">
                      <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-yellow-500">Test Mode</p>
                        <p className="text-muted-foreground">
                          This adds fake balance for testing purposes only.
                        </p>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setTopUpOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleTestTopUp}
                      disabled={topUp.isPending}
                      variant="secondary"
                    >
                      {topUp.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add Test ${customAmount || selectedAmount}
                    </Button>
                  </DialogFooter>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="space-y-4 py-2">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center p-3 rounded-full bg-green-500/10 mb-4">
                    <SiTether className="h-8 w-8 text-green-500" />
                  </div>
                  <h3 className="font-semibold text-lg">Send {cryptoPayment.amount} USDT</h3>
                  <p className="text-sm text-muted-foreground">TRC20 Network</p>
                </div>
                
                <div className="flex justify-center">
                  <img
                    src={cryptoPayment.qrCode}
                    alt="Payment QR Code"
                    className="w-48 h-48 rounded-lg border bg-white p-2"
                    data-testid="img-qr-code"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">Payment Address</Label>
                  <div className="flex gap-2">
                    <Input
                      value={cryptoPayment.addressIn}
                      readOnly
                      className="font-mono text-sm"
                      data-testid="input-payment-address"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(cryptoPayment.addressIn)}
                      data-testid="button-copy-address"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Expires: {new Date(cryptoPayment.expiresAt).toLocaleString()}</span>
                  </div>
                  <Badge variant="outline">{cryptoPayment.coin}</Badge>
                </div>
                
                <div className="p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                  <p>Send exactly <strong>{cryptoPayment.amount} USDT</strong> to the address above.</p>
                  <p className="mt-1">Your balance will be updated automatically after 1 confirmation.</p>
                </div>
                
                <DialogFooter className="flex-col sm:flex-row gap-2">
                  <Button
                    variant="outline"
                    onClick={resetCryptoPayment}
                    className="w-full sm:w-auto"
                  >
                    Create New Payment
                  </Button>
                  <Button
                    onClick={() => checkPayment(cryptoPayment.paymentId)}
                    disabled={checking}
                    className="w-full sm:w-auto"
                    data-testid="button-check-payment"
                  >
                    {checking ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Check Payment
                  </Button>
                </DialogFooter>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Current Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-primary" data-testid="text-current-balance">
              ${parseFloat(user?.balance || "0").toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Available to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Top-Ups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono text-green-500">
              ${totalTopUp.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold font-mono">
              ${totalSpent.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">On projects</p>
          </CardContent>
        </Card>
      </div>

      {parseFloat(user?.balance || "0") < 10 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="flex items-center gap-4 py-4">
            <AlertCircle className="h-6 w-6 text-yellow-500 shrink-0" />
            <div className="flex-1">
              <p className="font-medium">Low Balance Warning</p>
              <p className="text-sm text-muted-foreground">
                Your balance is running low. Top up to continue using AI agents and programmer services.
              </p>
            </div>
            <Button onClick={() => setTopUpOpen(true)}>
              Top Up Now
            </Button>
          </CardContent>
        </Card>
      )}

      {pendingPayments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Payments
            </CardTitle>
            <CardDescription>
              Crypto payments waiting for confirmation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingPayments.map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted"
                  data-testid={`pending-payment-${payment.id}`}
                >
                  <div className="flex items-center gap-3">
                    <SiTether className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-mono text-sm">{payment.amountRequested} USDT</p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {payment.addressIn?.slice(0, 10)}...{payment.addressIn?.slice(-6)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(payment.status || "waiting")}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => checkPayment(payment.id)}
                      data-testid={`button-check-${payment.id}`}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent transactions and balance changes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <TransactionHistory transactions={transactions} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
