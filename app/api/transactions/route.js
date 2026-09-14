import { NextResponse } from "next/server";
import { firebaseConfig } from "@/lib/firebase";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

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

// In-memory server cache fallback across devices on the same instance
let serverMemoryCache = [];

/**
 * GET /api/transactions
 * Returns all saved transactions across all devices.
 */
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  const headers = { "Content-Type": "application/json" };
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  const allRecords = [];
  const seenIds = new Set();

  // 1. Fetch from Cloud Firestore REST API
  try {
    const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}?key=${firebaseConfig.apiKey}&pageSize=300`;
    const response = await fetch(firestoreUrl, {
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
    } else {
      const err = await response.json().catch(() => ({}));
      console.warn("Firestore GET warning in /api/transactions:", err);
    }
  } catch (err) {
    console.warn("Firestore fetch error:", err);
  }

  // 2. Fetch from Firebase Realtime Database backup
  const rtdbUrls = [
    `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com/registrations.json?auth=${firebaseConfig.apiKey}`,
    `https://${firebaseConfig.projectId}.firebaseio.com/registrations.json?auth=${firebaseConfig.apiKey}`,
  ];

  for (const rtdbUrl of rtdbUrls) {
    try {
      const res = await fetch(rtdbUrl, { cache: "no-store" });
      if (res.ok) {
        const rtdbData = await res.json();
        if (rtdbData && typeof rtdbData === "object") {
          Object.entries(rtdbData).forEach(([docKey, tx]) => {
            if (tx && typeof tx === "object") {
              const id = tx.paymentId || docKey;
              if (id && !seenIds.has(id)) {
                seenIds.add(id);
                allRecords.push({ ...tx, id: docKey });
              }
            }
          });
        }
      }
    } catch (e) {}
  }

  // 3. Merge server-memory cache
  serverMemoryCache.forEach((tx) => {
    const id = tx.paymentId || tx.id;
    if (id && !seenIds.has(id)) {
      seenIds.add(id);
      allRecords.push(tx);
    }
  });

  // Sort newest first
  allRecords.sort((a, b) => {
    const timeA = a.clientTimestamp || (a.isoDate ? new Date(a.isoDate).getTime() : 0);
    const timeB = b.clientTimestamp || (b.isoDate ? new Date(b.isoDate).getTime() : 0);
    return timeB - timeA;
  });

  return NextResponse.json({
    success: true,
    count: allRecords.length,
    data: allRecords,
  });
}

/**
 * POST /api/transactions
 * Saves transaction to Firebase Firestore + Realtime DB backup + Server Cache.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { registrationData, paymentData } = body;

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

    const cleanDocId = `pay_${paymentId.replace(/[^a-zA-Z0-9_-]/g, "_")}`;

    // A. Save to server memory cache
    const existingIndex = serverMemoryCache.findIndex((item) => item.paymentId === paymentId);
    if (existingIndex >= 0) {
      serverMemoryCache[existingIndex] = { ...record, id: cleanDocId };
    } else {
      serverMemoryCache.unshift({ ...record, id: cleanDocId });
    }

    // B. Save to Cloud Firestore REST API using PATCH (UPSERT)
    let firestoreSaved = false;
    try {
      const authHeader = request.headers.get("authorization");
      const headers = { "Content-Type": "application/json" };
      if (authHeader) headers["Authorization"] = authHeader;

      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${cleanDocId}?key=${firebaseConfig.apiKey}`;
      const firestoreRes = await fetch(firestoreUrl, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          fields: toFirestoreFields(record),
        }),
      });

      if (firestoreRes.ok) {
        firestoreSaved = true;
      } else {
        const errData = await firestoreRes.json().catch(() => ({}));
        console.warn("Firestore PATCH response in /api/transactions:", errData);
      }
    } catch (e) {
      console.warn("Firestore save error:", e);
    }

    // C. Save to Firebase Realtime Database as cloud backup
    const rtdbUrls = [
      `https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com/registrations/${cleanDocId}.json`,
      `https://${firebaseConfig.projectId}.firebaseio.com/registrations/${cleanDocId}.json`,
    ];
    for (const url of rtdbUrls) {
      try {
        await fetch(url, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(record),
        });
      } catch (e) {}
    }

    return NextResponse.json({
      success: true,
      id: cleanDocId,
      firestoreSaved,
      data: record,
    });
  } catch (error) {
    console.error("API transactions POST error:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions
 * Deletes a transaction document and all ID variants across Cloud Firestore, RTDB, and cache.
 */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const docId = searchParams.get("id") || "";
    const paymentId = searchParams.get("paymentId") || "";

    if (!docId && !paymentId) {
      return NextResponse.json({ success: false, error: "Missing id or paymentId" }, { status: 400 });
    }

    const authHeader = request.headers.get("authorization");
    const headers = { "Content-Type": "application/json" };
    if (authHeader) headers["Authorization"] = authHeader;

    // Collect all possible ID keys to ensure thorough deletion
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

    // 1. Remove from server memory cache
    serverMemoryCache = serverMemoryCache.filter((item) => {
      const itemId = item.id || "";
      const itemPayId = item.paymentId || "";
      return !idsToDelete.some((target) => target === itemId || target === itemPayId || `pay_${itemPayId}` === target);
    });

    // 2. Delete all variant keys from Cloud Firestore REST API
    const firestorePromises = idsToDelete.map(async (targetId) => {
      try {
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents/${COLLECTION}/${encodeURIComponent(targetId)}?key=${firebaseConfig.apiKey}`;
        const res = await fetch(firestoreUrl, { method: "DELETE", headers });
        return res.ok;
      } catch (e) {
        return false;
      }
    });

    // 3. Delete all variant keys from Firebase Realtime Database
    const rtdbPromises = idsToDelete.flatMap((targetId) => [
      fetch(`https://${firebaseConfig.projectId}-default-rtdb.firebaseio.com/registrations/${encodeURIComponent(targetId)}.json`, { method: "DELETE" }).catch(() => null),
      fetch(`https://${firebaseConfig.projectId}.firebaseio.com/registrations/${encodeURIComponent(targetId)}.json`, { method: "DELETE" }).catch(() => null),
    ]);

    await Promise.allSettled([...firestorePromises, ...rtdbPromises]);

    return NextResponse.json({ success: true, deletedIds: idsToDelete });
  } catch (error) {
    console.error("API transactions DELETE error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
