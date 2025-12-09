import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Bot, Eye, EyeOff, User, Mail, Lock, ArrowRight, Users, RefreshCw, CheckCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type LoginValues = z.infer<typeof loginSchema>;
type RegisterValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { login, register, loginPending, registerPending, resendVerificationEmail, resendPending, checkAndRefreshEmailVerification } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [verificationState, setVerificationState] = useState<{
    show: boolean;
    email: string;
    type: "login" | "register";
  } | null>(null);
  const [checkingVerification, setCheckingVerification] = useState(false);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { 
      username: "", 
      email: "", 
      password: "", 
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const onLogin = async (data: LoginValues) => {
    try {
      await login(data);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
      navigate("/");
    } catch (error: any) {
      if (error.requiresEmailVerification) {
        setVerificationState({
          show: true,
          email: error.email || data.email,
          type: "login",
        });
      } else {
        toast({ 
          title: "Login failed", 
          description: error.message || "Invalid email or password",
          variant: "destructive",
        });
      }
    }
  };

  const onRegister = async (data: RegisterValues) => {
    try {
      const result = await register({
        username: data.username,
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      if (result.requiresEmailVerification) {
        toast({ 
          title: "تم إنشاء الحساب!", 
          description: "تم إرسال رابط التحقق إلى بريدك الإلكتروني.",
        });
        // Navigate to verify email page with email in URL
        navigate(`/auth/verify-email?email=${encodeURIComponent(data.email)}`);
      } else {
        toast({ title: "Account created!", description: "Welcome to CodeMaster AI." });
        navigate("/");
      }
    } catch (error: any) {
      toast({ 
        title: "Registration failed", 
        description: error.message || "Could not create account",
        variant: "destructive",
      });
    }
  };

  const handleResendVerification = async () => {
    try {
      await resendVerificationEmail();
      toast({ 
        title: "تم إعادة الإرسال!", 
        description: "تم إرسال رابط تحقق جديد إلى بريدك الإلكتروني.",
      });
    } catch (error: any) {
      toast({ 
        title: "فشل إعادة الإرسال", 
        description: error.message || "حدث خطأ أثناء إعادة إرسال رابط التحقق",
        variant: "destructive",
      });
    }
  };

  const handleCheckVerification = async () => {
    setCheckingVerification(true);
    try {
      const result = await checkAndRefreshEmailVerification();
      if (result.verified) {
        toast({ 
          title: "تم التحقق!", 
          description: "تم التحقق من بريدك الإلكتروني بنجاح.",
        });
        setVerificationState(null);
        navigate("/");
      } else {
        toast({ 
          title: "لم يتم التحقق بعد", 
          description: "يرجى الضغط على الرابط في بريدك الإلكتروني أولاً.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({ 
        title: "خطأ", 
        description: error.message || "حدث خطأ أثناء التحقق",
        variant: "destructive",
      });
    } finally {
      setCheckingVerification(false);
    }
  };

  const handleBackToLogin = () => {
    setVerificationState(null);
    setActiveTab("login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
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
          {verificationState?.show ? (
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 p-3 rounded-full bg-gradient-to-br from-amber-500/20 to-orange-500/20 w-fit">
                  <Mail className="h-8 w-8 text-amber-500" />
                </div>
                <CardTitle className="text-2xl">
                  {verificationState.type === "register" ? "تم إنشاء الحساب!" : "التحقق من البريد مطلوب"}
                </CardTitle>
                <CardDescription className="mt-2">
                  {verificationState.type === "register" 
                    ? "تم إرسال رابط التحقق إلى بريدك الإلكتروني"
                    : "يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm text-muted-foreground mb-1">تم إرسال رابط التحقق إلى:</p>
                  <p className="font-medium">{verificationState.email}</p>
                </div>
                
                <div className="space-y-3">
                  <Button
                    onClick={handleCheckVerification}
                    className="w-full"
                    disabled={checkingVerification}
                    data-testid="button-check-verification"
                  >
                    {checkingVerification ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {checkingVerification ? "جاري التحقق..." : "تحققت من البريد - متابعة"}
                  </Button>
                  
                  <Button
                    onClick={handleResendVerification}
                    variant="outline"
                    className="w-full"
                    disabled={resendPending}
                    data-testid="button-resend-verification"
                  >
                    {resendPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {resendPending ? "جاري الإرسال..." : "إعادة إرسال رابط التحقق"}
                  </Button>
                  
                  <Button
                    onClick={handleBackToLogin}
                    variant="ghost"
                    className="w-full"
                    data-testid="button-back-to-login"
                  >
                    العودة لتسجيل الدخول
                  </Button>
                </div>
                
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    تحقق من مجلد الرسائل غير المرغوب فيها إذا لم تجد الرسالة في صندوق الوارد
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" data-testid="tab-login">Sign In</TabsTrigger>
                  <TabsTrigger value="register" data-testid="tab-register">Sign Up</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <Form {...loginForm}>
                    <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                      <FormField
                        control={loginForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="email@example.com"
                                  className="pl-10"
                                  data-testid="input-login-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Your password"
                                  className="pl-10 pr-10"
                                  data-testid="input-login-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => navigate("/auth/forgot-password")}
                          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                          data-testid="link-forgot-password"
                        >
                          نسيت كلمة السر؟
                        </button>
                      </div>

                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={loginPending}
                        data-testid="button-login-submit"
                      >
                        {loginPending ? "Signing in..." : "Sign In"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </TabsContent>

                <TabsContent value="register">
                  <Form {...registerForm}>
                    <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={registerForm.control}
                          name="firstName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="John"
                                  data-testid="input-register-firstname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={registerForm.control}
                          name="lastName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Last Name</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Doe"
                                  data-testid="input-register-lastname"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  placeholder="johndoe"
                                  className="pl-10"
                                  data-testid="input-register-username"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="email@example.com"
                                  className="pl-10"
                                  data-testid="input-register-email"
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Create a password"
                                  className="pl-10 pr-10"
                                  data-testid="input-register-password"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowPassword(!showPassword)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                        control={registerForm.control}
                        name="confirmPassword"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Confirm Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                  {...field}
                                  type={showPassword ? "text" : "password"}
                                  placeholder="Confirm your password"
                                  className="pl-10"
                                  data-testid="input-register-confirm-password"
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
                        disabled={registerPending}
                        data-testid="button-register-submit"
                      >
                        {registerPending ? "Creating account..." : "Create Account"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </form>
                  </Form>
                </TabsContent>
              </Tabs>

            </CardContent>
          </Card>
          )}

          {/* Human Agent Registration Card */}
          <Card className="mt-6 border-dashed border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/20 shrink-0">
                  <Users className="h-6 w-6 text-orange-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-lg mb-1">هل أنت مطور خبير؟</h3>
                  <p className="text-sm text-muted-foreground mb-1">Are you an expert developer?</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    انضم كـ Human Agent لمساعدة العملاء عندما يفشل الذكاء الاصطناعي. اكسب المال من خبرتك!
                  </p>
                  <Button 
                    onClick={() => navigate("/auth/programmer")}
                    variant="outline"
                    className="w-full border-orange-500/50 text-orange-600 dark:text-orange-400"
                    data-testid="button-register-human-agent"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    التسجيل كـ Human Agent
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
