import admin from "firebase-admin";

let firebaseApp: admin.app.App | null = null;

function getFirebaseAdmin(): admin.app.App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID;
  
  if (!projectId) {
    throw new Error('FIREBASE_PROJECT_ID environment variable is not set');
  }

  // Check for service account credentials (for production/external hosting)
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  const apps = admin.apps || [];
  if (apps.length === 0) {
    if (serviceAccountKey) {
      // Use service account for external hosting
      try {
        const serviceAccount = JSON.parse(serviceAccountKey);
        firebaseApp = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId,
        });
      } catch (error) {
        console.error('Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', error);
        throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY format');
      }
    } else {
      // Use default credentials (works in Replit or with GOOGLE_APPLICATION_CREDENTIALS)
      firebaseApp = admin.initializeApp({
        projectId,
      });
    }
  } else {
    firebaseApp = apps[0]!;
  }

  return firebaseApp;
}

export async function verifyFirebaseIdToken(idToken: string): Promise<{
  valid: boolean;
  email?: string;
  emailVerified?: boolean;
  uid?: string;
  error?: string;
}> {
  try {
    const app = getFirebaseAdmin();
    const decodedToken = await app.auth().verifyIdToken(idToken);
    
    return {
      valid: true,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      uid: decodedToken.uid,
    };
  } catch (error: any) {
    console.error("Firebase ID token verification error:", error);
    return {
      valid: false,
      error: error.message || "Token verification failed",
    };
  }
}

export async function getFirebaseUserByEmail(email: string): Promise<{
  exists: boolean;
  emailVerified?: boolean;
  uid?: string;
  error?: string;
}> {
  try {
    const app = getFirebaseAdmin();
    const userRecord = await app.auth().getUserByEmail(email);
    
    return {
      exists: true,
      emailVerified: userRecord.emailVerified,
      uid: userRecord.uid,
    };
  } catch (error: any) {
    if (error.code === "auth/user-not-found") {
      return { exists: false };
    }
    console.error("Firebase get user error:", error);
    return {
      exists: false,
      error: error.message || "Failed to get user",
    };
  }
}

export async function sendFirebaseVerificationEmail(email: string): Promise<{
  success: boolean;
  link?: string;
  error?: string;
}> {
  try {
    const app = getFirebaseAdmin();
    // Use APP_URL for external hosting, fallback to localhost for development
    const appUrl = process.env.APP_URL || 'http://localhost:5000';
    const actionCodeSettings = {
      url: `${appUrl}/auth/verify-email`,
      handleCodeInApp: true,
    };
    
    const link = await app.auth().generateEmailVerificationLink(email, actionCodeSettings);
    
    return {
      success: true,
      link,
    };
  } catch (error: any) {
    console.error("Firebase send verification email error:", error);
    return {
      success: false,
      error: error.message || "Failed to send verification email",
    };
  }
}
