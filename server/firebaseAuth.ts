import type { Express, RequestHandler, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { firebaseRegisterSchema, firebaseProgrammerRegisterSchema } from "@shared/schema";
import { verifyFirebaseIdToken } from "./firebaseAdmin";

declare global {
  namespace Express {
    interface Request {
      firebaseUser?: {
        uid: string;
        email?: string;
        emailVerified?: boolean;
      };
      currentUser?: {
        id: string;
        email: string | null;
        username: string | null;
        firstName: string | null;
        lastName: string | null;
        role: string | null;
        firebaseUid: string | null;
      };
    }
  }
}

export const verifyFirebaseToken: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "لم يتم توفير رمز المصادقة" });
    }
    
    const idToken = authHeader.split("Bearer ")[1];
    
    if (!idToken) {
      return res.status(401).json({ message: "رمز المصادقة غير صالح" });
    }
    
    const result = await verifyFirebaseIdToken(idToken);
    
    if (!result.valid) {
      return res.status(401).json({ message: "رمز المصادقة منتهي الصلاحية أو غير صالح", error: result.error });
    }
    
    req.firebaseUser = {
      uid: result.uid!,
      email: result.email,
      emailVerified: result.emailVerified,
    };
    
    next();
  } catch (error) {
    console.error("Firebase token verification error:", error);
    return res.status(401).json({ message: "فشل التحقق من رمز المصادقة" });
  }
};

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const idToken = authHeader.split("Bearer ")[1];
    
    if (!idToken) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const result = await verifyFirebaseIdToken(idToken);
    
    if (!result.valid || !result.uid) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    const user = await storage.getUserByFirebaseUid(result.uid);
    
    if (!user) {
      return res.status(401).json({ message: "User not found. Please complete registration." });
    }
    
    if (!user.isActive) {
      return res.status(403).json({ message: "هذا الحساب معطل" });
    }
    
    req.currentUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      firebaseUid: user.firebaseUid,
    };
    
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Unauthorized" });
  }
};

export const isProgrammer: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.currentUser.role !== "programmer") {
      return res.status(403).json({ message: "Access denied. Programmer role required." });
    }
    
    const programmer = await storage.getProgrammerByUserId(req.currentUser.id);
    if (!programmer || !programmer.isApproved) {
      return res.status(403).json({ message: "حساب المبرمج بانتظار الموافقة" });
    }
    
    next();
  } catch (error) {
    console.error("Programmer check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const isAdmin: RequestHandler = async (req, res, next) => {
  try {
    if (!req.currentUser) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.currentUser.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }
    
    next();
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);

  app.post("/api/auth/register-profile", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const { uid: firebaseUid, email: firebaseEmail, emailVerified } = req.firebaseUser;

      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (existingUser) {
        return res.json({
          id: existingUser.id,
          email: existingUser.email,
          username: existingUser.username,
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          role: existingUser.role,
          balance: existingUser.balance,
          emailVerified: existingUser.emailVerified,
          message: "المستخدم موجود بالفعل",
        });
      }

      const result = firebaseRegisterSchema.safeParse({
        ...req.body,
        email: firebaseEmail || req.body.email,
        firebaseUid,
      });

      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        });
      }

      const { username, email, firstName, lastName, role } = result.data;

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "البريد الإلكتروني مسجل بالفعل" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }

      const user = await storage.createUser({
        firebaseUid,
        username,
        email,
        firstName,
        lastName,
        role: role || "client",
        emailVerified: emailVerified || false,
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        emailVerified: user.emailVerified,
        message: "تم إنشاء الحساب بنجاح",
      });
    } catch (error) {
      console.error("Register profile error:", error);
      res.status(500).json({ message: "فشل في إنشاء الحساب" });
    }
  });

  app.post("/api/auth/register-profile/programmer", verifyFirebaseToken, async (req, res) => {
    try {
      if (!req.firebaseUser) {
        return res.status(401).json({ message: "غير مصرح" });
      }

      const { uid: firebaseUid, email: firebaseEmail, emailVerified } = req.firebaseUser;

      const existingUser = await storage.getUserByFirebaseUid(firebaseUid);
      if (existingUser) {
        return res.status(400).json({ message: "المستخدم موجود بالفعل" });
      }

      const result = firebaseProgrammerRegisterSchema.safeParse({
        ...req.body,
        email: firebaseEmail || req.body.email,
        firebaseUid,
      });

      if (!result.success) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: result.error.flatten().fieldErrors 
        });
      }

      const { username, email, firstName, lastName, skills, bio, hourlyRate } = result.data;

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(400).json({ message: "البريد الإلكتروني مسجل بالفعل" });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ message: "اسم المستخدم مستخدم بالفعل" });
      }

      const user = await storage.createUser({
        firebaseUid,
        username,
        email,
        firstName,
        lastName,
        role: "programmer",
        emailVerified: emailVerified || false,
      });

      await storage.createProgrammer({
        userId: user.id,
        skills,
        bio,
        hourlyRate: hourlyRate || "25.00",
        isApproved: false,
      });

      res.status(201).json({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        emailVerified: user.emailVerified,
        message: "تم التسجيل بنجاح. حسابك بانتظار موافقة المسؤول.",
      });
    } catch (error) {
      console.error("Programmer register profile error:", error);
      res.status(500).json({ message: "فشل في التسجيل" });
    }
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      if (!req.currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const user = await storage.getUser(req.currentUser.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let programmerProfile = null;
      if (user.role === "programmer") {
        programmerProfile = await storage.getProgrammerByUserId(user.id);
      }

      res.json({
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        balance: user.balance,
        profileImageUrl: user.profileImageUrl,
        emailVerified: user.emailVerified,
        programmer: programmerProfile,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    res.json({ message: "تم تسجيل الخروج بنجاح" });
  });

  app.post("/api/auth/sync-email-verification", isAuthenticated, async (req, res) => {
    try {
      if (!req.currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const idToken = authHeader.split("Bearer ")[1];
      const result = await verifyFirebaseIdToken(idToken);

      if (result.valid && result.emailVerified) {
        await storage.updateUser(req.currentUser.id, {
          emailVerified: true,
        });

        res.json({
          emailVerified: true,
          message: "تم تحديث حالة التحقق من البريد الإلكتروني",
        });
      } else {
        res.json({
          emailVerified: false,
          message: "البريد الإلكتروني غير محقق بعد",
        });
      }
    } catch (error) {
      console.error("Sync email verification error:", error);
      res.status(500).json({ message: "فشل في تحديث حالة التحقق" });
    }
  });

  app.get("/api/auth/check-profile/:firebaseUid", async (req, res) => {
    try {
      const { firebaseUid } = req.params;
      const user = await storage.getUserByFirebaseUid(firebaseUid);
      
      res.json({
        hasProfile: !!user,
        user: user ? {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        } : null,
      });
    } catch (error) {
      console.error("Check profile error:", error);
      res.status(500).json({ message: "فشل في التحقق من الملف الشخصي" });
    }
  });
}
