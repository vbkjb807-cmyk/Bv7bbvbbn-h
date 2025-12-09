import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Lock, Eye, EyeOff, ArrowRight, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const resetPasswordSchema = z.object({
  password: z.string().min(8, "كلمة السر يجب أن تكون 8 أحرف على الأقل"),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات السر غير متطابقة",
  path: ["confirmPassword"],
});

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { resetPassword, resetPasswordPending } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const params = new URLSearchParams(searchString);
  const email = params.get("email") || "";
  const code = params.get("code") || "";

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (!email || !code) {
      toast({
        title: "خطأ",
        description: "رابط إعادة التعيين غير صحيح",
        variant: "destructive",
      });
      navigate("/auth");
    }
  }, [email, code, navigate, toast]);

  const onSubmit = async (data: ResetPasswordValues) => {
    try {
      await resetPassword({ email, code, newPassword: data.password });
      toast({
        title: "تم إعادة تعيين كلمة السر!",
        description: "يمكنك الآن تسجيل الدخول بكلمة السر الجديدة.",
      });
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "فشل إعادة تعيين كلمة السر",
        description: error.message || "حدث خطأ أثناء إعادة تعيين كلمة السر",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col" dir="rtl">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 p-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">CodeMaster AI</span>
        </button>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 p-3 rounded-full bg-primary/10 w-fit">
                <KeyRound className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">إعادة تعيين كلمة السر</CardTitle>
              <CardDescription>
                أدخل كلمة السر الجديدة لحسابك
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>كلمة السر الجديدة</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="أدخل كلمة السر الجديدة"
                              className="pr-10 pl-10"
                              dir="ltr"
                              data-testid="input-new-password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                              data-testid="button-toggle-password"
                            >
                              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>تأكيد كلمة السر</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type={showPassword ? "text" : "password"}
                              placeholder="أعد إدخال كلمة السر"
                              className="pr-10"
                              dir="ltr"
                              data-testid="input-confirm-password"
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={resetPasswordPending}
                    data-testid="button-reset-password"
                  >
                    {resetPasswordPending ? "جاري الحفظ..." : "حفظ كلمة السر الجديدة"}
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
