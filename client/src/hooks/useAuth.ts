import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User, Programmer } from "@shared/schema";
import { 
  auth, 
  onAuthChange, 
  loginWithFirebase, 
  registerWithFirebase, 
  logoutFirebase, 
  sendVerificationEmail,
  sendPasswordResetEmailFirebase,
  checkEmailVerified,
  getIdToken,
  type FirebaseUser 
} from "@/lib/firebase";
import { getFirebaseToken, setFirebaseToken, clearFirebaseToken } from "@/lib/queryClient";

interface AuthUser extends User {
  programmer?: Programmer | null;
}

interface RegisterProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role?: string;
}

interface RegisterProgrammerProfileData {
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  skills: string[];
  bio: string;
  hourlyRate?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseLoading, setFirebaseLoading] = useState(true);
  const [loginPending, setLoginPending] = useState(false);
  const [registerPending, setRegisterPending] = useState(false);
  const [registerProgrammerPending, setRegisterProgrammerPending] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [resendPending, setResendPending] = useState(false);
  const [forgotPasswordPending, setForgotPasswordPending] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (user) => {
      setFirebaseUser(user);
      
      if (user) {
        try {
          const token = await getIdToken(user);
          setFirebaseToken(token);
        } catch (error) {
          console.error("Failed to get Firebase token:", error);
          clearFirebaseToken();
        }
      } else {
        clearFirebaseToken();
      }
      
      setFirebaseLoading(false);
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    });

    return () => unsubscribe();
  }, [queryClient]);

  const { data: user, isLoading: profileLoading, error, refetch } = useQuery<AuthUser | null>({
    queryKey: ["/api/auth/me"],
    retry: false,
    enabled: !firebaseLoading && !!firebaseUser,
    queryFn: async () => {
      const token = getFirebaseToken();
      if (!token) {
        return null;
      }

      const res = await fetch("/api/auth/me", {
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });
      
      if (res.status === 401) {
        return null;
      }
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Failed to fetch user");
      }
      
      return res.json();
    },
  });

  const login = useCallback(async (data: { email: string; password: string }) => {
    setLoginPending(true);
    try {
      const firebaseUserResult = await loginWithFirebase(data.email, data.password);
      
      const emailVerified = await checkEmailVerified(firebaseUserResult);
      
      if (!emailVerified) {
        const error = new Error("يرجى التحقق من بريدك الإلكتروني قبل تسجيل الدخول") as Error & { 
          requiresEmailVerification: boolean; 
          email: string;
          firebaseUser: FirebaseUser;
        };
        error.requiresEmailVerification = true;
        error.email = data.email;
        error.firebaseUser = firebaseUserResult;
        throw error;
      }
      
      const token = await getIdToken(firebaseUserResult);
      setFirebaseToken(token);
      
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      
      return { success: true };
    } finally {
      setLoginPending(false);
    }
  }, [queryClient]);

  const register = useCallback(async (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    setRegisterPending(true);
    try {
      const { user: fbUser, emailSent } = await registerWithFirebase(data.email, data.password);
      
      const token = await getIdToken(fbUser);
      setFirebaseToken(token);
      
      const profileData: RegisterProfileData = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || "client",
      };
      
      const res = await fetch("/api/auth/register-profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "فشل في إنشاء الملف الشخصي");
      }
      
      const result = await res.json();
      
      return {
        ...result,
        requiresEmailVerification: emailSent,
        firebaseUser: fbUser,
      };
    } finally {
      setRegisterPending(false);
    }
  }, []);

  const registerProgrammer = useCallback(async (data: {
    username: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    skills: string[];
    bio: string;
    hourlyRate?: string;
  }) => {
    setRegisterProgrammerPending(true);
    try {
      const { user: fbUser, emailSent } = await registerWithFirebase(data.email, data.password);
      
      const token = await getIdToken(fbUser);
      setFirebaseToken(token);
      
      const profileData: RegisterProgrammerProfileData = {
        username: data.username,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        skills: data.skills,
        bio: data.bio,
        hourlyRate: data.hourlyRate,
      };
      
      const res = await fetch("/api/auth/register-profile/programmer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(profileData),
      });
      
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "فشل في إنشاء الملف الشخصي");
      }
      
      const result = await res.json();
      
      return {
        ...result,
        requiresEmailVerification: emailSent,
        firebaseUser: fbUser,
      };
    } finally {
      setRegisterProgrammerPending(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLogoutPending(true);
    try {
      await logoutFirebase();
      clearFirebaseToken();
      queryClient.clear();
    } finally {
      setLogoutPending(false);
    }
  }, [queryClient]);

  const resendVerificationEmail = useCallback(async () => {
    setResendPending(true);
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("لا يوجد مستخدم حالي");
      }
      
      await sendVerificationEmail(currentUser);
      return { success: true, message: "تم إرسال رابط التحقق بنجاح" };
    } finally {
      setResendPending(false);
    }
  }, []);

  const checkAndRefreshEmailVerification = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return { verified: false };
    }
    
    const verified = await checkEmailVerified(currentUser);
    
    if (verified) {
      const token = await getIdToken(currentUser);
      setFirebaseToken(token);
      await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    }
    
    return { verified };
  }, [queryClient]);

  const forgotPassword = useCallback(async (email: string) => {
    setForgotPasswordPending(true);
    try {
      await sendPasswordResetEmailFirebase(email);
      return { success: true, message: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني" };
    } finally {
      setForgotPasswordPending(false);
    }
  }, []);

  const isLoading = firebaseLoading || (!!firebaseUser && profileLoading);
  const isAuthenticated = !isLoading && !!user && !!firebaseUser;

  return {
    user,
    firebaseUser,
    isLoading,
    isAuthenticated,
    error,
    refetch,
    login,
    loginPending,
    register,
    registerPending,
    registerProgrammer,
    registerProgrammerPending,
    logout,
    logoutPending,
    resendVerificationEmail,
    resendPending,
    checkAndRefreshEmailVerification,
    forgotPassword,
    forgotPasswordPending,
  };
}
