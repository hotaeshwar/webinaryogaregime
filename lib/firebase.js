/**
 * Firebase Client & Authentication Service (Official Firebase REST API)
 * Zero external bundle overhead, works 100% reliably in static export and serverless.
 */

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyB2rnsnQJMmbcNi8qI9AvdLweMAqIyOtXQ",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "form-6d0cf.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "form-6d0cf",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "form-6d0cf.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "154166329670",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:154166329670:web:082cb658835da5b0eaa547",
};

const AUTH_STORAGE_KEY = "firebase_admin_user_session";

/**
 * Sign in admin using Email & Password via Firebase Auth REST API
 */
export async function signInAdmin(email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.trim(),
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    const errorMsg = data.error?.message || "Failed to sign in";
    if (errorMsg === "EMAIL_NOT_FOUND" || errorMsg === "INVALID_PASSWORD" || errorMsg === "INVALID_LOGIN_CREDENTIALS") {
      throw new Error("Invalid email or password. Please verify your admin credentials in Firebase Authentication.");
    } else if (errorMsg === "USER_DISABLED") {
      throw new Error("This admin account has been disabled in Firebase.");
    } else if (errorMsg === "TOO_MANY_ATTEMPTS_TRY_LATER") {
      throw new Error("Access temporarily disabled due to many failed login attempts. Try again later.");
    }
    throw new Error(errorMsg);
  }

  const userSession = {
    email: data.email,
    localId: data.localId,
    idToken: data.idToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userSession));
  }

  return userSession;
}

/**
 * Send password reset email
 */
export async function sendAdminPasswordReset(email) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${firebaseConfig.apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requestType: "PASSWORD_RESET",
      email: email.trim(),
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || "Could not send password reset email.");
  }
  return data;
}

/**
 * Get current active session
 */
export function getCurrentAdminUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch (e) {
    return null;
  }
}

/**
 * Sign out admin
 */
export function signOutAdmin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
