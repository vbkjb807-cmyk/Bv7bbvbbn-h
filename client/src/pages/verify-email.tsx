import { useState, useEffect } from "react";
import { useLocation, useSearch } from "wouter";
import { Mail, CheckCircle, RefreshCw, ArrowRight, Bot, AlertCircle, Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { apiRequest } from "@/lib/queryClient";
import { verifyEmailWithCode, auth, sendVerificationEmail, loginWithFirebase } from "@/lib/firebase";

export default function VerifyEmailPage() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const { toast } = useToast();
  
  const [isVerified, setIsVerified] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [hasOobCode, setHasOobCode] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(search);
    const emailParam = params.get("email");
    const oobCode = params.get("oobCode");
    const mode = params.get("mode");
    
    if (emailParam) {
      const decodedEmail = decodeURIComponent(emailParam);
      setEmail(decodedEmail);
    }
    
    if (oobCode && mode === "verifyEmail") {
      setHasOobCode(true);
      handleVerifyWithCode(oobCode);
    } else if (emailParam) {
      checkVerificationStatus(decodeURIComponent(emailParam));
    } else {
      setIsInitialLoading(false);
    }
  }, [search]);

  const handleVerifyWithCode = async (oobCode: string) => {
    setIsVerifying(true);
    setVerificationError(null);
    
    try {
      console.log("[VerifyEmail] Applying Firebase verification code...");
      const result = await verifyEmailWithCode(oobCode);
      console.log("[VerifyEmail] Firebase verification successful for:", result.email);
      
      setEmail(result.email);
      
      const response = await fetch(`/api/auth/check-verification/${encodeURIComponent(result.email)}`);
      const data = await response.json();
      
      if (data.emailVerified) {
        setIsVerified(true);
        toast({
          title: "تم التحقق بنجاح!",
          description: "تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول.",
        });
      } else {
        await syncVerificationWithBackend(result.email);
      }
    } catch (error: any) {
      console.error("[VerifyEmail] Verification error:", error);
      
      let errorMessage = "حدث خطأ أثناء التحقق من البريد الإلكتروني.";
      
      if (error.code === "auth/invalid-action-code") {
        errorMessage = "رابط التحقق غير صالح أو منتهي الصلاحية. يرجى طلب رابط جديد.";
      } else if (error.code === "auth/expired-action-code") {
        errorMessage = "انتهت صلاحية رابط التحقق. يرجى طلب رابط جديد.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setVerificationError(errorMessage);
    } finally {
      setIsVerifying(false);
      setIsInitialLoading(false);
    }
  };

  const syncVerificationWithBackend = async (emailToSync: string) => {
    try {
      const response = await apiRequest("POST", "/api/auth/verify-email", { email: emailToSync });
      const data = await response.json();
      
      if (response.ok && data.emailVerified) {
        setIsVerified(true);
        toast({
          title: "تم التحقق بنجاح!",
          description: "تم تأكيد بريدك الإلكتروني. يمكنك الآن تسجيل الدخول.",
        });
      }
    } catch (error) {
      console.error("[VerifyEmail] Backend sync error:", error);
    }
  };

  const checkVerificationStatus = async (emailToCheck: string) => {
    setIsCheckingStatus(true);
    try {
      const response = await fetch(`/api/auth/check-verification/${encodeURIComponent(emailToCheck)}`);
      const data = await response.json();
      
      if (data.emailVerified) {
        setIsVerified(true);
        toast({
          title: "تم التحقق بالفعل!",
          description: "بريدك الإلكتروني محقق. يمكنك تسجيل الدخول.",
        });
      }
    } catch (error) {
      console.error("[VerifyEmail] Status check error:", error);
    } finally {
      setIsCheckingStatus(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendVerification = async () => {
    if (countdown > 0) return;
    
    if (!email) {
      toast({
        title: "البريد الإلكتروني مطلوب",
        description: "يرجى إدخال بريدك الإلكتروني لإعادة إرسال رابط التحقق",
        variant: "destructive",
      });
      return;
    }
    
    setIsResending(true);
    setVerificationError(null);
    
    try {
      const currentUser = auth.currentUser;
      
      if (currentUser && currentUser.email === email) {
        await sendVerificationEmail(currentUser);
        setCountdown(60);
        toast({
          title: "تم إرسال الرابط",
          description: "تم إرسال رابط تحقق جديد إلى بريدك الإلكتروني.",
        });
      } else {
        const response = await apiRequest("POST", "/api/auth/resend-verification", { email });
        const data = await response.json();
        
        if (response.ok) {
          setCountdown(60);
          toast({
            title: "تم إرسال الرابط",
            description: data.message || "تم إرسال رابط تحقق جديد إلى بريدك الإلكتروني.",
          });
        } else {
          toast({
            title: "فشل الإرسال",
            description: data.message || "تعذر إرسال رابط جديد. يرجى المحاولة مرة أخرى.",
            variant: "destructive",
          });
        }
      }
    } catch (error: any) {
      console.error("[VerifyEmail] Resend error:", error);
      toast({
        title: "فشل الإرسال",
        description: "تعذر إرسال رابط جديد. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!email) {
      toast({
        title: "البريد الإلكتروني مطلوب",
        description: "يرجى إدخال بريدك الإلكتروني للتحقق من الحالة",
        variant: "destructive",
      });
      return;
    }
    
    await checkVerificationStatus(email);
  };

  const handleGoToLogin = () => {
    navigate("/auth");
  };

  if (isInitialLoading || isVerifying) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 p-4">
          <button onClick={() => navigate("/")} className="flex items-center gap-2" data-testid="link-home">
            <div className="p-2 rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            <span className="font-bold text-lg">AgentForge AI</span>
          </button>
          <ThemeToggle />
        </header>

        <div className="flex-1 flex items-center justify-center p-4 pt-20">
          <div className="w-full max-w-md">
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-4 rounded-full bg-primary/10">
                  <RefreshCw className="h-12 w-12 text-primary animate-spin" />
                </div>
                <CardTitle className="text-2xl" data-testid="text-loading-title">
                  {isVerifying ? "جاري التحقق من بريدك الإلكتروني..." : "جاري التحميل..."}
                </CardTitle>
                <CardDescription data-testid="text-loading-description">
                  {isVerifying 
                    ? "يرجى الانتظار بينما نتحقق من رابط التحقق"
                    : "يرجى الانتظار بينما نتحقق من حالة بريدك الإلكتروني"
                  }
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between gap-4 p-4">
        <button onClick={() => navigate("/")} className="flex items-center gap-2" data-testid="link-home-main">
          <div className="p-2 rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <span className="font-bold text-lg">AgentForge AI</span>
        </button>
        <ThemeToggle />
      </header>

      <div className="flex-1 flex items-center justify-center p-4 pt-20">
        <div className="w-full max-w-md">
          <Card className="overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-primary via-purple-500 to-primary" />
            
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 p-4 rounded-full bg-gradient-to-br from-primary/20 to-purple-500/20">
                {isVerified ? (
                  <CheckCircle className="h-12 w-12 text-green-500" />
                ) : verificationError ? (
                  <AlertCircle className="h-12 w-12 text-amber-500" />
                ) : (
                  <Mail className="h-12 w-12 text-primary" />
                )}
              </div>
              <CardTitle className="text-2xl" data-testid="text-page-title">
                {isVerified 
                  ? "تم التحقق بنجاح!" 
                  : verificationError
                    ? "فشل التحقق"
                    : "تحقق من بريدك الإلكتروني"
                }
              </CardTitle>
              <CardDescription className="text-base" data-testid="text-page-description">
                {isVerified 
                  ? "تم تأكيد حسابك بنجاح. يمكنك الآن تسجيل الدخول." 
                  : verificationError
                    ? "حدثت مشكلة أثناء التحقق من بريدك الإلكتروني"
                    : email 
                      ? (
                        <span>
                          أرسلنا رابط تحقق إلى
                          <br />
                          <span className="font-medium text-foreground">{email}</span>
                        </span>
                      )
                      : "يرجى الضغط على الرابط المرسل إلى بريدك الإلكتروني"
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {verificationError && (
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-amber-700 dark:text-amber-400" data-testid="text-error-message">
                      {verificationError}
                    </p>
                  </div>
                </div>
              )}

              {!isVerified && !verificationError && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium mb-2">تعليمات:</p>
                      <ol className="list-decimal list-inside space-y-1 mr-2">
                        <li>تحقق من صندوق الوارد (ومجلد البريد المزعج)</li>
                        <li>اضغط على رابط التحقق في الرسالة</li>
                        <li>سيتم تحويلك تلقائياً بعد التحقق</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}

              {isVerified && (
                <Button 
                  className="w-full" 
                  onClick={handleGoToLogin}
                  data-testid="button-go-to-login"
                >
                  الانتقال لتسجيل الدخول
                  <ArrowRight className="mr-2 h-4 w-4" />
                </Button>
              )}

              {!isVerified && (
                <>
                  <Button 
                    variant="outline"
                    onClick={handleCheckStatus}
                    disabled={isCheckingStatus || !email}
                    className="w-full gap-2"
                    data-testid="button-check-status"
                  >
                    {isCheckingStatus ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        جاري التحقق...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4" />
                        لقد ضغطت على الرابط - تحقق الآن
                      </>
                    )}
                  </Button>

                  <div className="flex flex-col items-center gap-3 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">لم تستلم الرابط؟</p>
                    
                    <Button 
                      variant="outline"
                      onClick={handleResendVerification}
                      disabled={countdown > 0 || isResending || !email}
                      className="w-full gap-2"
                      data-testid="button-resend-verification"
                    >
                      {isResending ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          جاري الإرسال...
                        </>
                      ) : countdown > 0 ? (
                        <>
                          <RefreshCw className="h-4 w-4" />
                          إعادة الإرسال ({countdown}ث)
                        </>
                      ) : (
                        <>
                          <Mail className="h-4 w-4" />
                          إعادة إرسال رابط التحقق
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-center">
                    <button
                      onClick={handleGoToLogin}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                      data-testid="link-back-to-login"
                    >
                      العودة لتسجيل الدخول
                    </button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
