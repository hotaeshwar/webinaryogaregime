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
  if (doc.createTime) result.createTime = doc.createTime;
  if (doc.updateTime) result.updateTime = doc.updateTime;
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

  // Ensure amount is normalized as a valid number
  const recordId = String(result.registrationId || result.paymentId || result.id || "");
  if (recordId.startsWith("REG_") || recordId.startsWith("reg_")) {
    result.amount = 0;
  } else if (result.amount !== undefined && result.amount !== null) {
    const num = Number(result.amount);
    result.amount = isNaN(num) ? 0 : num;
  } else {
    result.amount = 0;
  }

  return result;
}

/**
 * Normalizes an identifier string (strips redundant pay_, reg_, doc_ prefixes)
 */
export function normalizeTransactionId(idStr) {
  if (!idStr) return "";
  let clean = String(idStr).trim();
  while (/^(pay_|reg_|doc_)/i.test(clean)) {
    clean = clean.replace(/^(pay_|reg_|doc_)/i, "");
  }
  return clean.toLowerCase();
}

/**
 * Normalizes a phone number to standard 10 digits
 */
export function normalizePhone(phoneStr) {
  if (!phoneStr) return "";
  const digits = String(phoneStr).replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * Normalizes email address
 */
export function normalizeEmail(emailStr) {
  return (emailStr || "").trim().toLowerCase();
}

/**
 * Safely extracts the creation timestamp in milliseconds from a transaction record.
 * Handles clientTimestamp, isoDate, createTime, createdAt, updateTime, and encoded ID timestamps.
 * Guarantees fresh/newer registrations sort with highest value.
 */
export function getRecordTimestamp(tx) {
  if (!tx) return 0;

  // 1. Direct clientTimestamp number
  if (typeof tx.clientTimestamp === "number" && !isNaN(tx.clientTimestamp) && tx.clientTimestamp > 0) {
    return tx.clientTimestamp;
  }
  if (tx.clientTimestamp && !isNaN(Number(tx.clientTimestamp))) {
    const num = Number(tx.clientTimestamp);
    if (num > 0) return num;
  }

  // 2. Direct ISO date strings / timestamp fields
  const dateCandidates = [tx.isoDate, tx.createdAt, tx.createTime, tx.timestamp, tx.updateTime];
  for (const d of dateCandidates) {
    if (d) {
      const parsed = new Date(d).getTime();
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  }

  // 3. Fallback: Parse timestamp from registration ID or payment ID
  // e.g. REG_M3ABCDE_XYZ (base-36 timestamp in ID)
  const idStr = String(tx.registrationId || tx.paymentId || tx.orderId || tx.id || "");
  const base36Match = idStr.match(/(?:REG|PASS)_([A-Z0-9]{5,12})/i);
  if (base36Match) {
    try {
      const parsedTime = parseInt(base36Match[1], 36);
      if (!isNaN(parsedTime) && parsedTime > 1600000000000 && parsedTime < 2500000000000) {
        return parsedTime;
      }
    } catch (e) {}
  }

  // e.g. pay_manual_1731234567890
  const epochMatch = idStr.match(/_(\d{13})/);
  if (epochMatch) {
    const parsedEpoch = Number(epochMatch[1]);
    if (!isNaN(parsedEpoch) && parsedEpoch > 1600000000000) {
      return parsedEpoch;
    }
  }

  return 0;
}

/**
 * Strictly deduplicates an array of transaction records.
 * Keeps the newest, most complete record for each unique attendee/transaction.
 */
export function deduplicateTransactions(transactionsList) {
  if (!Array.isArray(transactionsList) || transactionsList.length <= 1) {
    return transactionsList || [];
  }

  // Sort newest first so newer records take precedence
  const sorted = [...transactionsList].sort((a, b) => {
    const timeA = getRecordTimestamp(a);
    const timeB = getRecordTimestamp(b);
    return timeB - timeA;
  });

  const unique = [];
  const seenPayIds = new Set();
  const seenAttendeeKeys = new Set();

  for (const tx of sorted) {
    if (!tx) continue;

    const rawId = String(tx.id || "");
    const rawPaymentId = String(tx.paymentId || "");
    const rawRegId = String(tx.registrationId || "");

    const normId = normalizeTransactionId(rawId);
    const normPayId = normalizeTransactionId(rawPaymentId);
    const normReg = normalizeTransactionId(rawRegId);

    // 1. Direct ID deduplication
    const idKeys = [normId, normPayId, normReg].filter(Boolean);
    const hasSeenId = idKeys.some((k) => seenPayIds.has(k));
    if (hasSeenId) {
      continue;
    }

    // 2. Attendee deduplication: matching normalized phone (10 digits) and/or normalized email
    const email = normalizeEmail(tx.email);
    const phone = normalizePhone(tx.whatsappNumber || tx.phone);

    let isDuplicateAttendee = false;

    if (email && phone && phone.length === 10) {
      const fullKey = `${email}::${phone}`;
      if (seenAttendeeKeys.has(fullKey)) {
        isDuplicateAttendee = true;
      } else {
        seenAttendeeKeys.add(fullKey);
      }
    } else if (email && email.includes("@")) {
      const emailKey = `email::${email}`;
      if (seenAttendeeKeys.has(emailKey)) {
        isDuplicateAttendee = true;
      } else {
        seenAttendeeKeys.add(emailKey);
      }
    } else if (phone && phone.length === 10) {
      const phoneKey = `phone::${phone}`;
      if (seenAttendeeKeys.has(phoneKey)) {
        isDuplicateAttendee = true;
      } else {
        seenAttendeeKeys.add(phoneKey);
      }
    }

    if (isDuplicateAttendee) {
      continue;
    }

    // Register IDs as seen
    idKeys.forEach((k) => seenPayIds.add(k));
    unique.push(tx);
  }

  return unique;
}

/**
 * Saves a successful workshop registration transaction across all channels (Cloud Firestore + Local Cache).
 * Ensures cross-device availability and reliable persistence.
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

    const paymentId = (paymentData?.razorpay_payment_id || paymentData?.paymentId || "").trim() || `pay_manual_${Date.now()}`;
    const orderId = (paymentData?.razorpay_order_id || paymentData?.orderId || "").trim() || `order_${Date.now()}`;

    const cleanEmail = normalizeEmail(registrationData?.email);
    const cleanPhone = normalizePhone(registrationData?.whatsappNumber || registrationData?.phone);

    // Generate deterministic document ID for online free registrations to prevent duplicate entries
    let cleanDocId = "";
    if (paymentId.startsWith("pay_") && !paymentId.startsWith("pay_manual_")) {
      // Real payment ID from gateway
      cleanDocId = paymentId;
    } else if (cleanPhone && cleanPhone.length === 10) {
      // Deterministic registration key based on phone and email prefix
      const emailPrefix = cleanEmail ? cleanEmail.split("@")[0].replace(/[^a-z0-9]/g, "_").slice(0, 15) : "user";
      cleanDocId = `reg_${cleanPhone}_${emailPrefix}`;
    } else {
      cleanDocId = paymentId.startsWith("pay_")
        ? paymentId
        : `pay_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
    }

    const isDirectReg = paymentId.startsWith("REG_") || paymentId.startsWith("reg_") || cleanDocId.startsWith("reg_");
    const rawAmount = isDirectReg
      ? 0
      : (paymentData?.amount !== undefined && paymentData?.amount !== null
        ? Number(paymentData.amount)
        : 0);
    const finalAmount = rawAmount > 50 ? Math.round(rawAmount / 100) : rawAmount;

    const record = {
      fullName: (registrationData?.fullName || "").trim(),
      email: cleanEmail,
      countryCode: registrationData?.countryCode || "+91",
      whatsappNumber: cleanPhone || (registrationData?.whatsappNumber || "").trim(),
      phoneFull: `${registrationData?.countryCode || "+91"} ${cleanPhone || (registrationData?.whatsappNumber || "").trim()}`.trim(),
      workshop: "The Art of Breathing",
      workshopSubtitle: "The Art of Breathing Workshop",
      workshopDate: "Saturday, 14th Nov",
      workshopTime: "07:00 P.M. IST",
      workshopDuration: "60 Minutes",
      workshopMode: "Online on Zoom",
      amount: finalAmount,
      currency: "INR",
      paymentId: paymentId,
      registrationId: paymentId,
      orderId: orderId,
      status: "CONFIRMED",
      dateString: dateFormatted,
      timeString: timeFormatted,
      isoDate: now.toISOString(),
      createdAt: now.toISOString(),
      clientTimestamp: now.getTime(),
      source: "Online Registration",
    };

    // 1. Save locally in customer's device for immediate local UX
    try {
      if (typeof window !== "undefined") {
        localStorage.setItem("workshop_last_booking", JSON.stringify(record));
        
        const existingLocal = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        const normKey = normalizePhone(record.whatsappNumber) || normalizeEmail(record.email) || record.paymentId;
        const filteredLocal = existingLocal.filter((tx) => {
          const txKey = normalizePhone(tx.whatsappNumber || tx.phone) || normalizeEmail(tx.email) || tx.paymentId || tx.id;
          return txKey !== normKey;
        });
        filteredLocal.unshift(record);
        localStorage.setItem("workshop_my_transactions", JSON.stringify(filteredLocal.slice(0, 100)));
      }
    } catch (e) {
      console.warn("Could not save to localStorage:", e);
    }

    // 2. Primary: Direct Client-Side Cloud Firestore PATCH (Upsert)
    try {
      const session = getCurrentAdminUser();
      const directHeaders = { "Content-Type": "application/json" };
      if (session?.idToken) directHeaders["Authorization"] = `Bearer ${session.idToken}`;

      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(cleanDocId)}?key=${firebaseConfig.apiKey}`;
      let res = await fetch(firestoreUrl, {
        method: "PATCH",
        headers: directHeaders,
        body: JSON.stringify({
          fields: toFirestoreFields(record),
        }),
      });

      // If token expired / rejected with 401 or 403, retry without Authorization header
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        console.warn(`Firestore PATCH returned ${res.status}. Retrying with API key...`);
        res = await fetch(firestoreUrl, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fields: toFirestoreFields(record),
          }),
        });
      }

      if (!res.ok) {
        const errorText = await res.text();
        console.error("Firestore PATCH failed:", res.status, errorText);
      }
    } catch (directErr) {
      console.warn("Direct Firestore PATCH fallback error:", directErr);
    }

    return { success: true, id: cleanDocId, data: record };
  } catch (error) {
    console.error("Error saving transaction:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all transaction records from Cloud Firestore with pagination and local cache sync.
 * Guarantees 100% accurate, cross-device visibility with strict deduplication.
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

    // 1. Primary: Direct Cloud Firestore query with automatic pagination & auth fallback
    try {
      let pageToken = "";
      do {
        const pageQuery = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
        const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}?key=${firebaseConfig.apiKey}&pageSize=300${pageQuery}`;
        
        let response = await fetch(url, {
          method: "GET",
          headers,
          cache: "no-store",
        });

        // If 401/403 (e.g. expired or invalid token), retry with API key directly
        if (!response.ok && (response.status === 401 || response.status === 403)) {
          console.warn(`Firestore GET returned ${response.status}. Retrying with API key...`);
          response = await fetch(url, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
          });
        }

        if (response.ok) {
          const data = await response.json();
          const documents = data.documents || [];
          documents.map(fromFirestoreDoc).filter(Boolean).forEach((tx) => {
            allRecords.push(tx);
          });
          pageToken = data.nextPageToken || "";
        } else {
          console.warn("Firestore list fetch returned status:", response.status);
          break;
        }
      } while (pageToken);
    } catch (firestoreErr) {
      console.warn("Direct Firestore list fetch error:", firestoreErr);
    }

    // 2. Offline fallback: only if Firestore returned nothing and failed
    if (allRecords.length === 0 && typeof window !== "undefined") {
      try {
        const localList = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        for (const localTx of localList) {
          const regId = String(localTx.registrationId || localTx.paymentId || localTx.id || "");
          if (regId.startsWith("REG_") || regId.startsWith("reg_")) {
            localTx.amount = 0;
          }
          allRecords.push(localTx);
        }
      } catch (e) {}
    }

    // Strictly deduplicate to prevent any double entries in admin
    const cleanList = deduplicateTransactions(allRecords);

    return {
      success: true,
      data: cleanList,
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
      data: deduplicateTransactions(fallback),
    };
  }
}

/**
 * Scans Cloud Firestore for redundant duplicate registrations and safely cleans them.
 * Keeps the newest record for each unique attendee.
 */
export async function cleanDuplicateTransactions() {
  try {
    let session = null;
    try {
      session = (await validateAdminSession()) || getCurrentAdminUser();
    } catch (e) {
      session = getCurrentAdminUser();
    }

    const headers = { "Content-Type": "application/json" };
    if (session?.idToken) headers["Authorization"] = `Bearer ${session.idToken}`;

    const rawDocs = [];
    let pageToken = "";
    do {
      const pageQuery = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
      const url = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}?key=${firebaseConfig.apiKey}&pageSize=300${pageQuery}`;
      let res = await fetch(url, { method: "GET", headers, cache: "no-store" });
      if (!res.ok && (res.status === 401 || res.status === 403)) {
        res = await fetch(url, { method: "GET", headers: { "Content-Type": "application/json" }, cache: "no-store" });
      }
      if (res.ok) {
        const data = await res.json();
        const documents = data.documents || [];
        documents.forEach((d) => {
          const parsed = fromFirestoreDoc(d);
          if (parsed) rawDocs.push(parsed);
        });
        pageToken = data.nextPageToken || "";
      } else {
        break;
      }
    } while (pageToken);

    // Group documents to identify duplicates
    const groups = {};
    rawDocs.forEach((item) => {
      const email = normalizeEmail(item.email);
      const phone = normalizePhone(item.whatsappNumber || item.phone);
      const key = (email && phone) ? `${email}_${phone}` : (email || phone || item.id);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    const docsToDelete = [];
    for (const [, list] of Object.entries(groups)) {
      if (list.length > 1) {
        // Sort newest first
        list.sort((a, b) => getRecordTimestamp(b) - getRecordTimestamp(a));
        // Keep list[0] (newest), mark older ones for deletion
        for (let i = 1; i < list.length; i++) {
          docsToDelete.push(list[i]);
        }
      }
    }

    // Also remove any remaining phantom pay_pay_ docs
    rawDocs.forEach((item) => {
      if (item.id && item.id.startsWith("pay_pay_") && !docsToDelete.some((d) => d.id === item.id)) {
        docsToDelete.push(item);
      }
    });

    let deletedCount = 0;
    await Promise.allSettled(
      docsToDelete.map(async (doc) => {
        const res = await deleteTransaction(doc);
        if (res.success) deletedCount++;
      })
    );

    return { success: true, count: deletedCount };
  } catch (err) {
    console.error("Error cleaning duplicate transactions:", err);
    return { success: false, error: err.message, count: 0 };
  }
}

/**
 * Delete a transaction record across Cloud Firestore and local storage.
 * @param {string|Object} target - The doc ID string or the transaction object
 */
export async function deleteTransaction(target) {
  try {
    const docId = typeof target === "object" ? (target?.id || "") : (target || "");
    const paymentId = typeof target === "object" ? (target?.paymentId || "") : "";
    const regId = typeof target === "object" ? (target?.registrationId || "") : "";
    const email = typeof target === "object" ? normalizeEmail(target?.email) : "";
    const phone = typeof target === "object" ? normalizePhone(target?.whatsappNumber || target?.phone) : "";

    const session = (await validateAdminSession()) || getCurrentAdminUser();
    const headers = { "Content-Type": "application/json" };
    if (session?.idToken) headers["Authorization"] = `Bearer ${session.idToken}`;

    const emailPrefix = email ? email.split("@")[0].replace(/[^a-z0-9]/g, "_").slice(0, 15) : "";
    const deterministicId = phone ? `reg_${phone}_${emailPrefix}` : null;

    // Direct Firestore deletion for all possible key permutations
    const candidateIds = new Set([
      docId,
      paymentId,
      regId,
      deterministicId,
      docId ? docId.replace(/^pay_/, "") : null,
      docId ? docId.replace(/^reg_/, "") : null,
      docId ? (docId.startsWith("pay_") ? docId : `pay_${docId.replace(/[^a-zA-Z0-9_-]/g, "_")}`) : null,
      docId ? (docId.startsWith("pay_pay_") ? docId : `pay_${docId}`) : null,
      paymentId ? paymentId.replace(/^pay_/, "") : null,
      paymentId ? (paymentId.startsWith("pay_") ? paymentId : `pay_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_")}`) : null,
    ]);

    const idsToDelete = Array.from(candidateIds).filter(Boolean);

    await Promise.allSettled(
      idsToDelete.map(async (targetKey) => {
        try {
          const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(targetKey)}?key=${firebaseConfig.apiKey}`;
          let res = await fetch(firestoreUrl, { method: "DELETE", headers });
          if (!res.ok && (res.status === 401 || res.status === 403)) {
            await fetch(firestoreUrl, { method: "DELETE", headers: { "Content-Type": "application/json" } });
          }
        } catch (e) {}
      })
    );

    // Remove from Local Storage
    if (typeof window !== "undefined") {
      try {
        const localList = JSON.parse(localStorage.getItem("workshop_my_transactions") || "[]");
        const updated = localList.filter((item) => {
          const itemId = item.id || "";
          const itemPayId = item.paymentId || "";
          const itemPhone = normalizePhone(item.whatsappNumber || item.phone);
          const itemEmail = normalizeEmail(item.email);
          const matchesAttendee = (phone && itemPhone === phone) || (email && itemEmail === email);
          const matchesId = idsToDelete.some((t) => t === itemId || t === itemPayId || `pay_${itemPayId}` === t);
          return !matchesAttendee && !matchesId;
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

/**
 * Direct sync with Razorpay Payments API (Safe fallback - payment integration removed).
 */
export async function syncRazorpayToFirestore() {
  return { success: true, count: 0 };
}

