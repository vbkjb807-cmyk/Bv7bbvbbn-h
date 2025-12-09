import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Bot, ArrowRight, RefreshCw, Mail, ShieldCheck, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

type OTPMode = "email" | "login" | "password-reset";

interface ModeConfig {
  title: string;
  description: string;
  icon: typeof Mail;
  resendType: "email" | "login" | "password-reset";
}

const modeConfigs: Record<OTPMode, ModeConfig> = {
  email: {
    title: "التحقق من البريد الإلكتروني",
    description: "أدخل الرمز المكون من 6 أرقام الذي أرسلناه إلى بريدك الإلكتروني",
    icon: Mail,
    resendType: "email",
  },
  login: {
    title: "التحقق من تسجيل الدخول",
    description: "أدخل رمز التحقق للمتابعة في تسجيل الدخول",
    icon: ShieldCheck,
    resendType: "login",
  },
  "password-reset": {
    title: "التحقق لإعادة تعيين كلمة السر",
    description: "أدخل الرمز الذي أرسلناه لإعادة تعيين كلمة السر",
    icon: KeyRound,
    resendType: "password-reset",
  },
};

export default function VerifyOTP() {
  const [, navigate] = useLocation();
  const searchString = useSearch();
  const { toast } = useToast();
  const { verifyEmailCode, verifyLoginCode, resendCode, verifyEmailCodePending, verifyLoginCodePending, resendCodePending } = useAuth();
  
  const [otp, setOtp] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  const params = new URLSearchParams(searchString);
  const mode = (params.get("mode") as OTPMode) || "email";
  const email = params.get("email") || "";

  const config = modeConfigs[mode] || modeConfigs.email;
  const IconComponent = config.icon;

  useEffect(() => {
    if (!email) {
      navigate("/auth");
      return;
    }

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown, email, navigate]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      toast({
        title: "خطأ",
        description: "يرجى إدخال الرمز المكون من 6 أرقام",
        variant: "destructive",
      });
      return;
    }

    try {
      if (mode === "email") {
        await verifyEmailCode({ email, code: otp });
        toast({
          title: "تم التحقق بنجاح!",
          description: "تم تفعيل حسابك. يمكنك الآن تسجيل الدخول.",
        });
        navigate("/auth");
      } else if (mode === "login") {
        await verifyLoginCode({ email, code: otp });
        toast({
          title: "تم تسجيل الدخول!",
          description: "مرحباً بك مجدداً.",
        });
        navigate("/");
      } else if (mode === "password-reset") {
        navigate(`/auth/reset-password?email=${encodeURIComponent(email)}&code=${encodeURIComponent(otp)}`);
      }
    } catch (error: any) {
      toast({
        title: "فشل التحقق",
        description: error.message || "الرمز غير صحيح أو منتهي الصلاحية",
        variant: "destructive",
      });
    }
  };

  const handleResend = async () => {
    try {
      await resendCode({ email, type: config.resendType });
      setCountdown(60);
      setCanResend(false);
      setOtp("");
      toast({
        title: "تم إرسال الرمز!",
        description: "تم إرسال رمز جديد إلى بريدك الإلكتروني.",
      });
    } catch (error: any) {
      toast({
        title: "فشل إعادة الإرسال",
        description: error.message || "حدث خطأ أثناء إعادة إرسال الرمز",
        variant: "destructive",
      });
    }
  };

  const isPending = verifyEmailCodePending || verifyLoginCodePending;

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
                <IconComponent className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">{config.title}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
              <p className="text-sm text-muted-foreground mt-2">
                تم إرسال الرمز إلى: <span className="font-medium text-foreground">{email}</span>
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center" dir="ltr">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  data-testid="input-otp"
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} data-testid="input-otp-slot-0" />
                    <InputOTPSlot index={1} data-testid="input-otp-slot-1" />
                    <InputOTPSlot index={2} data-testid="input-otp-slot-2" />
                    <InputOTPSlot index={3} data-testid="input-otp-slot-3" />
                    <InputOTPSlot index={4} data-testid="input-otp-slot-4" />
                    <InputOTPSlot index={5} data-testid="input-otp-slot-5" />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <Button
                onClick={handleVerify}
                className="w-full"
                disabled={isPending || otp.length !== 6}
                data-testid="button-verify-otp"
              >
                {isPending ? "جاري التحقق..." : "تحقق"}
                <ArrowRight className="mr-2 h-4 w-4" />
              </Button>

              <div className="text-center space-y-2">
                {canResend ? (
                  <Button
                    variant="ghost"
                    onClick={handleResend}
                    disabled={resendCodePending}
                    className="text-sm"
                    data-testid="button-resend-code"
                  >
                    <RefreshCw className={`h-4 w-4 ml-2 ${resendCodePending ? "animate-spin" : ""}`} />
                    {resendCodePending ? "جاري الإرسال..." : "إعادة إرسال الرمز"}
                  </Button>
                ) : (
                  <p className="text-sm text-muted-foreground" data-testid="text-countdown">
                    يمكنك إعادة إرسال الرمز بعد <span className="font-medium text-foreground">{countdown}</span> ثانية
                  </p>
                )}

                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors block mx-auto"
                  data-testid="link-back-to-auth"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
