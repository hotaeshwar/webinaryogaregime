import { firebaseConfig, getCurrentAdminUser } from "./firebase";

const COLLECTION = "registrations";

/**
 * Converts a standard JavaScript object into Firestore REST API fields format.
 */
function toFirestoreFields(obj) {
  const fields = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === "boolean") {
      fields[key] = { booleanValue: value };
    } else if (typeof value === "number") {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: String(value) };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (value instanceof Date) {
      fields[key] = { timestampValue: value.toISOString() };
    } else if (typeof value === "string") {
      fields[key] = { stringValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map((v) => ({ stringValue: String(v) })),
        },
      };
    } else {
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

/**
 * Converts Firestore REST API document format into a plain JavaScript object.
 */
function fromFirestoreDoc(doc) {
  if (!doc) return null;
  const id = doc.name ? doc.name.split("/").pop() : "";
  const result = { id };
  const fields = doc.fields || {};

  for (const [key, valObj] of Object.entries(fields)) {
    if ("stringValue" in valObj) {
      result[key] = valObj.stringValue;
    } else if ("integerValue" in valObj) {
      result[key] = Number(valObj.integerValue);
    } else if ("doubleValue" in valObj) {
      result[key] = Number(valObj.doubleValue);
    } else if ("booleanValue" in valObj) {
      result[key] = valObj.booleanValue;
    } else if ("timestampValue" in valObj) {
      result[key] = valObj.timestampValue;
    } else if ("nullValue" in valObj) {
      result[key] = null;
    } else if ("arrayValue" in valObj) {
      result[key] = (valObj.arrayValue.values || []).map((v) => v.stringValue || "");
    }
  }

  return result;
}

/**
 * Saves a successful workshop registration transaction to Cloud Firestore.
 * Also persists the record locally in the customer's browser.
 * @param {Object} registrationData 
 * @param {Object} paymentData 
 */
export async function saveTransaction(registrationData, paymentData) {
  try {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const timeFormatted = now.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const record = {
      fullName: (registrationData.fullName || "").trim(),
      email: (registrationData.email || "").trim(),
      countryCode: registrationData.countryCode || "+91",
      whatsappNumber: (registrationData.whatsappNumber || "").trim(),
      phoneFull: `${registrationData.countryCode || "+91"} ${(registrationData.whatsappNumber || "").trim()}`.trim(),
      workshop: "Lock Your Energies, Unlock Your Strength",
      workshopSubtitle: "Bandhas & Nauli Kriya Workshop",
      workshopDate: "Saturday, 19 Sept",
      workshopTime: "8:00 AM IST",
      amount: 19,
      currency: "INR",
      paymentId: paymentData.razorpay_payment_id || "N/A",
      orderId: paymentData.razorpay_order_id || "N/A",
      status: "SUCCESS",
      dateString: dateFormatted,
      timeString: timeFormatted,
      isoDate: now.toISOString(),
      clientTimestamp: now.getTime(),
    };

    // 1. Save locally in customer's device
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("workshop_last_booking", JSON.stringify(record));
        
        // Also save to a local transactions archive in attendee browser
        const existingLocal = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        existingLocal.unshift(record);
        localStorage.setItem("workshop_my_transactions", JSON.stringify(existingLocal.slice(0, 50)));
      }
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    // 2. Save directly to Cloud Firestore REST API
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}?key=${firebaseConfig.apiKey}`;
    
    const firestoreBody = {
      fields: toFirestoreFields(record),
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(firestoreBody),
    });

    const result = await response.json();

    if (!response.ok) {
      console.warn("Firestore write error response:", result);
      return { success: false, error: result.error?.message || "Failed to write to Firestore" };
    }

    const docId = result.name ? result.name.split("/").pop() : "doc_" + Date.now();
    return { success: true, id: docId, data: record };
  } catch (error) {
    console.error("Error saving transaction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all transaction records from Cloud Firestore.
 */
export async function getTransactionsList() {
  try {
    const session = getCurrentAdminUser();
    const tokenParam = session?.idToken ? `&bearer=${session.idToken}` : "";
    const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}?key=${firebaseConfig.apiKey}&pageSize=300${tokenParam}`;

    const response = await fetch(url, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn("Firestore list error:", data);
      // Fallback to locally stored transactions if any
      if (typeof window !== "undefined") {
        const local = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        return local;
      }
      return [];
    }

    const documents = data.documents || [];
    const list = documents.map(fromFirestoreDoc).filter(Boolean);

    // Sort date-wise properly (newest first)
    list.sort((a, b) => {
      const timeA = a.clientTimestamp || (a.isoDate ? new Date(a.isoDate).getTime() : 0);
      const timeB = b.clientTimestamp || (b.isoDate ? new Date(b.isoDate).getTime() : 0);
      return timeB - timeA;
    });

    return list;
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return [];
  }
}

/**
 * Polling subscription for real-time table reflection.
 */
export function subscribeToTransactions(onUpdate, onError) {
  let isMounted = true;

  const fetchAndNotify = async () => {
    try {
      const list = await getTransactionsList();
      if (isMounted) onUpdate(list);
    } catch (err) {
      if (isMounted && onError) onError(err);
    }
  };

  fetchAndNotify();

  // Poll every 5 seconds for live real-time updates
  const interval = setInterval(fetchAndNotify, 5000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}
