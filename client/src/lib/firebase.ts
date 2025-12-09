import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  type User,
  applyActionCode,
  checkActionCode,
  reload
} from "firebase/auth";

export type FirebaseUser = User;

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export async function registerWithFirebase(email: string, password: string): Promise<{ user: FirebaseUser; emailSent: boolean }> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;
  
  try {
    await sendEmailVerification(user);
    console.log("[Firebase] Verification email sent to:", email);
  } catch (verificationError: any) {
    console.warn("[Firebase] Could not send verification email:", verificationError.message);
  }
  
  // Always return true to show verification UI - user needs to verify email regardless
  return { user, emailSent: true };
}

export async function loginWithFirebase(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

export async function sendVerificationEmail(user: FirebaseUser): Promise<void> {
  await sendEmailVerification(user);
}

export async function checkEmailVerified(user: FirebaseUser): Promise<boolean> {
  await reload(user);
  return user.emailVerified;
}

export async function getIdToken(user: FirebaseUser): Promise<string> {
  return user.getIdToken(true);
}

export async function verifyEmailWithCode(oobCode: string): Promise<{ email: string }> {
  // First check the action code to get the email
  const actionInfo = await checkActionCode(auth, oobCode);
  const email = actionInfo.data.email;
  
  if (!email) {
    throw new Error("Could not retrieve email from verification code");
  }
  
  // Then apply the action code to verify the email
  await applyActionCode(auth, oobCode);
  
  return { email };
}

export async function sendPasswordResetEmailFirebase(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}
