import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Mail, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const forgotPasswordSchema = z.object({
  email: z.string().email("يرجى إدخال بريد إلكتروني صحيح"),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPassword() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { forgotPassword, forgotPasswordPending } = useAuth();

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = async (data: ForgotPasswordValues) => {
    try {
      await forgotPassword({ email: data.email });
      toast({
        title: "تم إرسال رمز إعادة التعيين!",
        description: "يرجى التحقق من بريدك الإلكتروني للحصول على الرمز.",
      });
      navigate(`/auth/verify-otp?mode=password-reset&email=${encodeURIComponent(data.email)}`);
    } catch (error: any) {
      toast({
        title: "فشل إرسال الرمز",
        description: error.message || "حدث خطأ أثناء إرسال رمز إعادة التعيين",
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
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">نسيت كلمة السر؟</CardTitle>
              <CardDescription>
                أدخل بريدك الإلكتروني وسنرسل لك رمز إعادة تعيين كلمة السر
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>البريد الإلكتروني</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              {...field}
                              type="email"
                              placeholder="email@example.com"
                              className="pr-10"
                              dir="ltr"
                              data-testid="input-forgot-email"
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
                    disabled={forgotPasswordPending}
                    data-testid="button-send-reset-code"
                  >
                    {forgotPasswordPending ? "جاري الإرسال..." : "إرسال رمز إعادة التعيين"}
                    <ArrowRight className="mr-2 h-4 w-4" />
                  </Button>

                  <button
                    type="button"
                    onClick={() => navigate("/auth")}
                    className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    data-testid="link-back-to-auth"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    العودة لتسجيل الدخول
                  </button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
