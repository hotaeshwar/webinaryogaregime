import { firebaseConfig, getCurrentAdminUser, validateAdminSession } from "./firebase";

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
 * Saves a successful workshop registration transaction across all channels (Server API + Cloud Firestore + Local Cache).
 * Ensures cross-device availability.
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

    const paymentId = (paymentData?.razorpay_payment_id || "").trim() || `pay_manual_${Date.now()}`;
    const orderId = (paymentData?.razorpay_order_id || "").trim() || `order_${Date.now()}`;
    const cleanDocId = `pay_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    const record = {
      fullName: (registrationData?.fullName || "").trim(),
      email: (registrationData?.email || "").trim(),
      countryCode: registrationData?.countryCode || "+91",
      whatsappNumber: (registrationData?.whatsappNumber || "").trim(),
      phoneFull: `${registrationData?.countryCode || "+91"} ${(registrationData?.whatsappNumber || "").trim()}`.trim(),
      workshop: "Lock Your Energies, Unlock Your Strength",
      workshopSubtitle: "Bandhas & Nauli Kriya Workshop",
      workshopDate: "Saturday, 19 Sept",
      workshopTime: "8:00 AM IST",
      amount: 19,
      currency: "INR",
      paymentId: paymentId,
      orderId: orderId,
      status: "SUCCESS",
      dateString: dateFormatted,
      timeString: timeFormatted,
      isoDate: now.toISOString(),
      clientTimestamp: now.getTime(),
    };

    // 1. Save locally in customer's device for immediate local UX
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("workshop_last_booking", JSON.stringify(record));
        
        const existingLocal = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        if (!existingLocal.some((tx) => tx.paymentId === record.paymentId)) {
          existingLocal.unshift(record);
          localStorage.setItem("workshop_my_transactions", JSON.stringify(existingLocal.slice(0, 100)));
        }
      }
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    // 2. Primary: Save via Server API Route (/api/transactions)
    let serverOk = false;
    try {
      const session = getCurrentAdminUser();
      const apiHeaders = { "Content-Type": "application/json" };
      if (session?.idToken) apiHeaders["Authorization"] = `Bearer ${session.idToken}`;

      const apiRes = await fetch("/api/transactions", {
        method: "POST",
        headers: apiHeaders,
        body: JSON.stringify({ registrationData, paymentData }),
      });

      if (apiRes.ok) {
        serverOk = true;
      }
    } catch (apiErr) {
      console.warn("API /api/transactions POST fallback:", apiErr);
    }

    // 3. Redundancy: Direct Client-Side Cloud Firestore PATCH (Upsert)
    try {
      const session = getCurrentAdminUser();
      const directHeaders = { "Content-Type": "application/json" };
      if (session?.idToken) directHeaders["Authorization"] = `Bearer ${session.idToken}`;

      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${cleanDocId}?key=${firebaseConfig.apiKey}`;
      await fetch(firestoreUrl, {
        method: "PATCH",
        headers: directHeaders,
        body: JSON.stringify({
          fields: toFirestoreFields(record),
        }),
      });
    } catch (directErr) {
      console.warn("Direct Firestore PATCH fallback:", directErr);
    }

    return { success: true, id: cleanDocId, data: record };
  } catch (error) {
    console.error("Error saving transaction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all transaction records from Central Cloud API & Cloud Firestore.
 * Guarantees cross-device visibility regardless of which device registered.
 */
export async function getTransactionsList() {
  try {
    let session = null;
    try {
      session = (await validateAdminSession()) || getCurrentAdminUser();
    } catch (e) {
      session = getCurrentAdminUser();
    }

    const headers = { "Content-Type": "application/json" };
    if (session?.idToken) {
      headers["Authorization"] = `Bearer ${session.idToken}`;
    }

    const allRecords = [];
    const seenIds = new Set();

    // 1. Primary: Fetch from Central Server API Route
    try {
      const apiRes = await fetch("/api/transactions", {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.data && Array.isArray(apiData.data)) {
          apiData.data.forEach((tx) => {
            const id = tx.paymentId || tx.id;
            if (id && !seenIds.has(id)) {
              seenIds.add(id);
              allRecords.push(tx);
            }
          });
        }
      }
    } catch (apiErr) {
      console.warn("API /api/transactions GET warning:", apiErr);
    }

    // 2. Direct Cloud Firestore query fallback
    try {
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}?key=${firebaseConfig.apiKey}&pageSize=300`;
      const response = await fetch(url, {
        method: "GET",
        headers,
        cache: "no-store",
      });

      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || [];
        documents.map(fromFirestoreDoc).filter(Boolean).forEach((tx) => {
          const id = tx.paymentId || tx.id;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allRecords.push(tx);
          }
        });
      }
    } catch (firestoreErr) {
      console.warn("Direct Firestore list fallback error:", firestoreErr);
    }

    // 3. Merge local device storage as fallback
    if (typeof window !== "undefined") {
      try {
        const localList = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        localList.forEach((localTx) => {
          const id = localTx.paymentId || localTx.id;
          if (id && !seenIds.has(id)) {
            seenIds.add(id);
            allRecords.push(localTx);
          }
        });
      } catch (e) {}
    }

    // Sort newest first
    allRecords.sort((a, b) => {
      const timeA = a.clientTimestamp || (a.isoDate ? new Date(a.isoDate).getTime() : 0);
      const timeB = b.clientTimestamp || (b.isoDate ? new Date(b.isoDate).getTime() : 0);
      return timeB - timeA;
    });

    return {
      success: true,
      data: allRecords,
    };
  } catch (error) {
    console.error("Error in getTransactionsList:", error);
    let fallback = [];
    if (typeof window !== "undefined") {
      try {
        fallback = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
      } catch (e) {}
    }
    return {
      success: false,
      error: error.message,
      data: fallback,
    };
  }
}

/**
 * Delete a transaction record across Cloud Firestore, Server API, and local storage.
 * @param {string|Object} target - The doc ID string or the transaction object
 */
export async function deleteTransaction(target) {
  try {
    const docId = typeof target === "object" ? (target?.id || "") : (target || "");
    const paymentId = typeof target === "object" ? (target?.paymentId || "") : "";

    const session = (await validateAdminSession()) || getCurrentAdminUser();
    const headers = { "Content-Type": "application/json" };
    if (session?.idToken) headers["Authorization"] = `Bearer ${session.idToken}`;

    // 1. Delete via Server API (which deletes all variants in Firestore & RTDB)
    try {
      const queryParams = new URLSearchParams();
      if (docId) queryParams.set("id", docId);
      if (paymentId) queryParams.set("paymentId", paymentId);

      await fetch(`/api/transactions?${queryParams.toString()}`, {
        method: "DELETE",
        headers,
      });
    } catch (e) {
      console.warn("API delete error:", e);
    }

    // 2. Direct Firestore fallback deletion for all possible key permutations
    const candidateIds = new Set([
      docId,
      paymentId,
      docId ? docId.replace(/^pay_/, "") : null,
      docId ? docId.replace(/^doc_/, "") : null,
      docId ? `pay_${docId.replace(/[^a-zA-Z0-9_-]/g, "_")}` : null,
      paymentId ? paymentId.replace(/^pay_/, "") : null,
      paymentId ? `pay_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_")}` : null,
    ]);

    const idsToDelete = Array.from(candidateIds).filter(Boolean);

    await Promise.allSettled(
      idsToDelete.map(async (targetKey) => {
        try {
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(targetKey)}?key=${firebaseConfig.apiKey}`;
          await fetch(firestoreUrl, { method: "DELETE", headers });
        } catch (e) {}
      })
    );

    // 3. Remove from Local Storage
    if (typeof window !== "undefined") {
      try {
        const localList = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        const updated = localList.filter((item) => {
          const itemId = item.id || "";
          const itemPayId = item.paymentId || "";
          return !idsToDelete.some((t) => t === itemId || t === itemPayId || `pay_${itemPayId}` === t);
        });
        localStorage.setItem("workshop_my_transactions", JSON.stringify(updated));
      } catch (e) {}
    }

    return { success: true };
  } catch (err) {
    console.error("deleteTransaction error:", err);
    return { success: false, error: err.message };
  }
}

/**
 * Polling subscription for real-time cross-device updates.
 */
export function subscribeToTransactions(onUpdate, onError) {
  let isMounted = true;

  const fetchAndNotify = async () => {
    try {
      const result = await getTransactionsList();
      if (!isMounted) return;
      onUpdate(result.data || []);
    } catch (err) {
      if (isMounted && onError) onError(err);
    }
  };

  fetchAndNotify();

  // Poll every 4 seconds for live real-time reflection across devices
  const interval = setInterval(fetchAndNotify, 4000);

  return () => {
    isMounted = false;
    clearInterval(interval);
  };
}
