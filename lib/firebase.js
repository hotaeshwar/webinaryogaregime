/**
 * Firebase Client & Authentication Service (Official Firebase REST API)
 * Direct integration with Google Firebase Authentication & Cloud Firestore.
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
 * Format Firebase Auth REST API error messages into user-friendly explanations.
 */
function parseFirebaseError(rawError, emailAttempt = "") {
  const errorMsg = rawError?.message || rawError || "";
  
  if (
    errorMsg.includes("INVALID_LOGIN_CREDENTIALS") ||
    errorMsg.includes("INVALID_PASSWORD")
  ) {
    return `Incorrect password for ${emailAttempt || "this account"}. Please re-enter your password or click "Forgot?" to reset it. You can also change the password directly in the Firebase Console (click ⋮ next to the user > Change password).`;
  }
  if (errorMsg.includes("EMAIL_NOT_FOUND")) {
    return `Account "${emailAttempt}" was not found in Firebase. Please verify the email address or register it using the 'Register Admin' tab.`;
  }
  if (errorMsg.includes("EMAIL_EXISTS")) {
    return "An admin account with this email already exists. Please switch to the 'Sign In' tab.";
  }
  if (errorMsg.includes("WEAK_PASSWORD")) {
    return "Password is too weak. Please use a password with at least 6 characters.";
  }
  if (errorMsg.includes("USER_DISABLED")) {
    return "This admin account has been disabled in the Firebase Console.";
  }
  if (errorMsg.includes("TOO_MANY_ATTEMPTS_TRY_LATER")) {
    return "Access temporarily locked due to multiple failed login attempts. Please reset password or try again later.";
  }
  if (errorMsg.includes("INVALID_EMAIL")) {
    return "Please enter a valid email address.";
  }
  if (errorMsg.includes("OPERATION_NOT_ALLOWED")) {
    return "Email/Password provider is not enabled in Firebase Authentication Console.";
  }
  return errorMsg || "Authentication failed. Please verify credentials.";
}

/**
 * Sign in admin using Email & Password via Firebase Auth REST API
 */
export async function signInAdmin(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: cleanEmail,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseFirebaseError(data.error, cleanEmail));
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
 * Sign up / register a new admin in Firebase Authentication
 */
export async function signUpAdmin(email, password) {
  const cleanEmail = (email || "").trim().toLowerCase();
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${firebaseConfig.apiKey}`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: cleanEmail,
      password,
      returnSecureToken: true,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(parseFirebaseError(data.error, cleanEmail));
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
 * Validates the admin session against Firebase Authentication API.
 * Automatically refreshes token if expired or near expiry.
 */
export async function validateAdminSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    let session = JSON.parse(raw);

    // If near expiry (< 5 mins remaining), refresh token
    const isExpiringSoon = session.expiresAt && Date.now() > (session.expiresAt - 5 * 60 * 1000);
    
    if (isExpiringSoon && session.refreshToken) {
      try {
        const refreshUrl = `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`;
        const refreshRes = await fetch(refreshUrl, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(session.refreshToken)}`,
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.id_token) {
          session.idToken = refreshData.id_token;
          session.refreshToken = refreshData.refresh_token || session.refreshToken;
          session.expiresAt = Date.now() + Number(refreshData.expires_in || 3600) * 1000;
          localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
        }
      } catch (err) {
        console.warn("Token refresh error:", err);
      }
    }

    // Verify token validity with Firebase Auth lookup
    if (session.idToken) {
      const lookupUrl = `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`;
      const lookupRes = await fetch(lookupUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: session.idToken }),
      });
      const lookupData = await lookupRes.json();

      if (lookupRes.ok && lookupData.users && lookupData.users.length > 0) {
        session.email = lookupData.users[0].email || session.email;
        session.localId = lookupData.users[0].localId || session.localId;
        return session;
      }
    }

    // If lookup failed and expired, clear session
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
 * Get current cached session synchronously
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
 * Send password reset email via Firebase Auth
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
    throw new Error(parseFirebaseError(data.error) || "Could not send password reset email.");
  }
  return data;
}

/**
 * Sign out admin
 */
export function signOutAdmin() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
