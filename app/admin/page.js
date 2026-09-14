"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  signInAdmin,
  signUpAdmin,
  signOutAdmin,
  getCurrentAdminUser,
  validateAdminSession,
  sendAdminPasswordReset,
  firebaseConfig,
} from "@/lib/firebase";
import {
  subscribeToTransactions,
  getTransactionsList,
  saveTransaction,
  deleteTransaction,
  syncRazorpayToFirestore,
} from "@/lib/transactionService";
import { sendRegistrationEmail } from "@/lib/emailService";
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  LogOut,
  Search,
  Download,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle2,
  Phone,
  MessageCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  AlertCircle,
  X,
  FileText,
  User,
  UserPlus,
  ArrowUpDown,
  Filter,
  Flame,
  Trash2,
  Database,
  Info,
  HelpCircle,
  Send,
  Zap,
  Settings,
  CheckCheck,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login & Register form state
  const [authMode, setAuthMode] = useState("login"); // 'login', 'register', 'forgot'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSuccess, setLoginSuccess] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncingRazorpay, setSyncingRazorpay] = useState(false);
  const [creatingTest, setCreatingTest] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'last7days', 'custom'
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' (newest first) or 'asc'

  // Selected Transaction Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedId, setCopiedId] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);

  // 1. Check & validate existing session with Firebase Auth on mount
  useEffect(() => {
    let isMounted = true;
    async function checkAuth() {
      const cached = getCurrentAdminUser();
      if (cached && isMounted) {
        setCurrentUser(cached);
      }
      
      try {
        const validated = await validateAdminSession();
        if (isMounted) {
          setCurrentUser(validated);
        }
      } catch (e) {
        console.warn("Session validation check:", e);
      } finally {
        if (isMounted) {
          setAuthLoading(false);
        }
      }
    }

    checkAuth();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Subscribe to transactions when logged in
  useEffect(() => {
    if (!currentUser) {
      setTransactions([]);
      setDataLoading(false);
      return;
    }

    setDataLoading(true);

    const unsubscribe = subscribeToTransactions(
      (list) => {
        setTransactions(list || []);
        setDataLoading(false);
      },
      (err) => {
        console.warn("Real-time listener warning:", err);
      }
    );

    return () => unsubscribe && unsubscribe();
  }, [currentUser]);

  // Handle Form Submit (Sign In or Register in Firebase)
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSuccess("");
    setLoginSubmitting(true);

    try {
      if (authMode === "register") {
        if (password.length < 6) {
          throw new Error("Password must be at least 6 characters long.");
        }
        if (password !== confirmPassword) {
          throw new Error("Passwords do not match. Please re-type your password.");
        }
        const user = await signUpAdmin(email.trim(), password);
        setCurrentUser(user);
      } else if (authMode === "login") {
        const user = await signInAdmin(email.trim(), password);
        setCurrentUser(user);
      }
    } catch (err) {
      console.error("Authentication Error:", err);
      setLoginError(err.message || "Authentication failed. Please check credentials.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Handle Password Reset via Firebase
  const handleForgotPassword = async (e) => {
    if (e) e.preventDefault();
    if (!email) {
      setLoginError("Please enter your admin email address first.");
      return;
    }
    setLoginSubmitting(true);
    setLoginError("");
    try {
      await sendAdminPasswordReset(email.trim());
      setResetSent(true);
      setLoginSuccess(`Password reset email sent to ${email.trim()}! Please check your inbox.`);
      setTimeout(() => setResetSent(false), 8000);
    } catch (err) {
      setLoginError(err.message || "Could not send password reset email.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Handle Logout
  const handleLogout = () => {
    signOutAdmin();
    setCurrentUser(null);
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setLoginError("");
    setLoginSuccess("");
  };

  // Manual Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await getTransactionsList();
      setTransactions(res.data || []);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Sync with Razorpay API directly and persist to Cloud Firestore
  const handleSyncRazorpay = async () => {
    setSyncingRazorpay(true);
    setStatusMessage(null);
    try {
      const res = await syncRazorpayToFirestore();
      const updated = await getTransactionsList();
      if (updated.data) {
        setTransactions(updated.data);
      }
      setStatusMessage({
        type: "success",
        text: res.success
          ? `Synced ${res.count} transactions from Razorpay into Firestore!`
          : `Sync completed. Current records: ${updated.data?.length || 0}`,
      });
      setTimeout(() => setStatusMessage(null), 6000);
    } catch (err) {
      console.error("Sync error:", err);
      setStatusMessage({
        type: "error",
        text: `Sync error: ${err.message || "Failed to connect to Razorpay"}`,
      });
      setTimeout(() => setStatusMessage(null), 6000);
    } finally {
      setSyncingRazorpay(false);
    }
  };

  // Create Sample / Test Transaction
  const handleCreateTestTx = async () => {
    setCreatingTest(true);
    setStatusMessage(null);
    try {
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      const testRegData = {
        fullName: `Demo Attendee ${randomSuffix}`,
        email: `attendee_${randomSuffix}@example.com`,
        countryCode: "+91",
        whatsappNumber: `98765${randomSuffix}`,
      };
      const testPayData = {
        razorpay_payment_id: `pay_test_${Date.now().toString(36)}_${randomSuffix}`,
        razorpay_order_id: `order_test_${Date.now().toString(36)}`,
      };

      const result = await saveTransaction(testRegData, testPayData);
      if (result.success) {
        setStatusMessage({
          type: "success",
          text: `Test transaction saved successfully! (ID: ${result.id})`,
        });
        const refreshed = await getTransactionsList();
        setTransactions(refreshed.data || []);
      } else {
        setStatusMessage({
          type: "error",
          text: `Firestore Error: ${result.error || "Could not write record"}`,
        });
      }
    } catch (e) {
      setStatusMessage({ type: "error", text: e.message });
    } finally {
      setCreatingTest(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  // Delete a transaction permanently from Firebase
  const handleDelete = async (tx) => {
    if (!window.confirm(`Are you sure you want to permanently delete the registration record for "${tx.fullName}" from Firebase?`)) {
      return;
    }

    try {
      setStatusMessage({ type: "info", text: `Deleting record for ${tx.fullName} from Firebase...` });
      
      const res = await deleteTransaction(tx);
      
      if (res.success) {
        setTransactions((prev) =>
          prev.filter((item) => (item.id || item.paymentId) !== (tx.id || tx.paymentId))
        );
        if (selectedTx && (selectedTx.id === tx.id || selectedTx.paymentId === tx.paymentId)) {
          setSelectedTx(null);
        }
        setStatusMessage({ type: "success", text: `Registration permanently deleted from Firebase.` });
        
        // Refresh database query to confirm
        const refreshed = await getTransactionsList();
        setTransactions(refreshed.data || []);
      } else {
        setStatusMessage({ type: "error", text: `Failed to delete: ${res.error || "Unknown error"}` });
      }
    } catch (err) {
      setStatusMessage({ type: "error", text: "Delete error: " + err.message });
    } finally {
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Send / Resend Email Confirmation via EmailJS
  const handleSendConfirmationEmail = async (tx) => {
    if (!tx) return;
    const txId = tx.id || tx.paymentId;
    setSendingEmailId(txId);
    setStatusMessage(null);

    try {
      const regData = {
        fullName: tx.fullName,
        email: tx.email,
        countryCode: tx.countryCode || "+91",
        whatsappNumber: tx.whatsappNumber || tx.phone,
        phone: tx.phone || tx.whatsappNumber,
      };
      const payData = {
        razorpay_payment_id: tx.paymentId,
        razorpay_order_id: tx.orderId,
        amount: tx.amount || 1,
      };

      const res = await sendRegistrationEmail(regData, payData);
      if (res.success) {
        setStatusMessage({
          type: "success",
          text: `Confirmation email dispatched to ${tx.email || "attendee"}!`,
        });
      } else {
        setStatusMessage({
          type: "info",
          text: `Email processed: ${res.error || "Dispatched"}`,
        });
      }
    } catch (e) {
      setStatusMessage({
        type: "error",
        text: `Email error: ${e.message || "Could not deliver email"}`,
      });
    } finally {
      setSendingEmailId(null);
      setTimeout(() => setStatusMessage(null), 5000);
    }
  };

  // Helper to generate clean plain text Event & Transaction confirmation message
  const getAdminEmailMessage = (tx) => {
    if (!tx) return "";
    const dateFormatted = tx.dateString || "Saturday, 19 Sept";
    const timeFormatted = tx.timeString ? ` at ${tx.timeString}` : "";
    
    return `WORKSHOP REGISTRATION CONFIRMATION AND ADMISSION PASS
Yogaregime Live Masterclass

Hello ${tx.fullName || "Attendee"},
Your registration for the upcoming live online masterclass is confirmed. Below are your event admission and transaction details:

EVENT AND WORKSHOP DETAILS:
- Workshop: Lock Your Energies, Unlock Your Strength
- Topic: Bandhas and Nauli Kriya Masterclass
- Date: Saturday, 19 September
- Time: 8:00 AM IST (90 Minutes Live Interactive)
- Mode: Online Live Session
- Organizer Support: support@yogaregime.com

ATTENDEE DETAILS:
- Name: ${tx.fullName || "N/A"}
- Email: ${tx.email || "N/A"}
- Contact: ${tx.countryCode || "+91"} ${tx.whatsappNumber || tx.phone || "N/A"}

TRANSACTION AND PAYMENT DETAILS:
- Amount Paid: Rs. ${tx.amount || 1} INR
- Payment Status: Verified and Confirmed (${tx.status || "SUCCESS"})
- Razorpay Payment ID: ${tx.paymentId || "N/A"}
- Razorpay Order ID: ${tx.orderId || "N/A"}
- Registration Date: ${dateFormatted}${timeFormatted}

SESSION GUIDELINES:
1. Practice on an empty stomach for Bandhas and Nauli.
2. Wear comfortable yoga attire and keep a yoga mat ready.
3. Join 5-10 minutes prior to 8:00 AM IST.

The live meeting joining link will be shared to your registered email prior to the session start.

Yogaregime Team`;
  };

  // Copy helper
  const handleCopy = (text, id) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  // Filtered & Sorted Transactions
  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        // Search query matching
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          (tx.fullName && tx.fullName.toLowerCase().includes(q)) ||
          (tx.email && tx.email.toLowerCase().includes(q)) ||
          (tx.whatsappNumber && tx.whatsappNumber.includes(q)) ||
          (tx.phoneFull && tx.phoneFull.includes(q)) ||
          (tx.paymentId && tx.paymentId.toLowerCase().includes(q)) ||
          (tx.orderId && tx.orderId.toLowerCase().includes(q));

        if (!matchesSearch) return false;

        // Date Filtering
        if (dateFilter === "all") return true;

        const txDate = tx.isoDate ? new Date(tx.isoDate) : new Date(tx.clientTimestamp || Date.now());
        const today = new Date();

        if (dateFilter === "today") {
          return (
            txDate.getDate() === today.getDate() &&
            txDate.getMonth() === today.getMonth() &&
            txDate.getFullYear() === today.getFullYear()
          );
        }

        if (dateFilter === "last7days") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(today.getDate() - 7);
          return txDate >= sevenDaysAgo;
        }

        if (dateFilter === "custom" && customDate) {
          const selected = new Date(customDate);
          return (
            txDate.getDate() === selected.getDate() &&
            txDate.getMonth() === selected.getMonth() &&
            txDate.getFullYear() === selected.getFullYear()
          );
        }

        return true;
      })
      .sort((a, b) => {
        const timeA = a.clientTimestamp || (a.isoDate ? new Date(a.isoDate).getTime() : 0);
        const timeB = b.clientTimestamp || (b.isoDate ? new Date(b.isoDate).getTime() : 0);
        return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
      });
  }, [transactions, searchQuery, dateFilter, customDate, sortOrder]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const totalCount = transactions.length;
    const totalRevenue = transactions.reduce((sum, tx) => sum + (Number(tx.amount) || 1), 0);

    const today = new Date();
    const todayCount = transactions.filter((tx) => {
      const txDate = tx.isoDate ? new Date(tx.isoDate) : new Date(tx.clientTimestamp || Date.now());
      return (
        txDate.getDate() === today.getDate() &&
        txDate.getMonth() === today.getMonth() &&
        txDate.getFullYear() === today.getFullYear()
      );
    }).length;

    return { totalCount, totalRevenue, todayCount };
  }, [transactions]);

  // Export to CSV formatted perfectly for Excel
  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      "S.No",
      "Date",
      "Time",
      "Attendee Name",
      "Email",
      "Country Code",
      "WhatsApp Number",
      "Workshop",
      "Amount (INR)",
      "Razorpay Payment ID",
      "Razorpay Order ID",
      "Status",
    ];

    const escapeCSV = (str) => `"${String(str ?? "").replace(/"/g, '""')}"`;
    const formatAsTextCell = (str) => `="\t${String(str ?? "").replace(/"/g, '""')}"`;

    const rows = filteredTransactions.map((tx, idx) => {
      let dateVal = tx.dateString || "";
      let timeVal = tx.timeString || "";

      if (!dateVal && (tx.isoDate || tx.clientTimestamp)) {
        try {
          const d = new Date(tx.isoDate || tx.clientTimestamp);
          dateVal = d.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        } catch (e) {}
      }

      if (!timeVal && (tx.isoDate || tx.clientTimestamp)) {
        try {
          const d = new Date(tx.isoDate || tx.clientTimestamp);
          timeVal = d.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          });
        } catch (e) {}
      }

      return [
        idx + 1,
        escapeCSV(dateVal || "N/A"),
        escapeCSV(timeVal || "N/A"),
        escapeCSV(tx.fullName || "N/A"),
        escapeCSV(tx.email || "N/A"),
        formatAsTextCell(tx.countryCode || "+91"),
        formatAsTextCell(tx.whatsappNumber || ""),
        escapeCSV(tx.workshop || "Bandhas & Nauli Kriya Workshop"),
        tx.amount || 1,
        formatAsTextCell(tx.paymentId || ""),
        formatAsTextCell(tx.orderId || ""),
        escapeCSV(tx.status || "SUCCESS"),
      ];
    });

    const csvContent = [headers.join(","), ...rows.map((e) => e.join(","))].join("\r\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `Workshop_Transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-wellness-bg flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-wellness-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-wellness-dark">
            Connecting to Firebase Authentication...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 1. LOGIN & AUTHENTICATION SCREEN
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-wellness-bg relative overflow-hidden flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-ambient-pattern pointer-events-none z-0" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-wellness-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-wellness-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-primaryLight p-6 text-center text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
              <ShieldCheck className="w-6 h-6 text-emerald-200" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Admin Portal</h1>
            <p className="text-xs text-gray-200 mt-1">
              Bandhas & Nauli Kriya Workshop Dashboard
            </p>
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/40 text-[10px] text-emerald-200 border border-emerald-400/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Firebase Project: {firebaseConfig.projectId}</span>
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div className="flex border-b border-wellness-border bg-wellness-surface/60">
            <button
              type="button"
              onClick={() => {
                setAuthMode("login");
                setLoginError("");
                setLoginSuccess("");
              }}
              className={`flex-1 py-3 text-xs font-bold text-center transition-all ${
                authMode === "login"
                  ? "bg-white text-wellness-primary border-b-2 border-wellness-primary"
                  : "text-wellness-muted hover:text-wellness-dark"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode("register");
                setLoginError("");
                setLoginSuccess("");
              }}
              className={`flex-1 py-3 text-xs font-bold text-center transition-all ${
                authMode === "register"
                  ? "bg-white text-wellness-primary border-b-2 border-wellness-primary"
                  : "text-wellness-muted hover:text-wellness-dark"
              }`}
            >
              Register Admin
            </button>
          </div>

          {/* Auth Form */}
          <form onSubmit={authMode === "forgot" ? handleForgotPassword : handleAuthSubmit} className="p-6 sm:p-8 space-y-4">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <div className="space-y-1">
                  <span>{loginError}</span>
                  {authMode === "login" && (
                    <p className="text-[11px] text-red-600 font-normal">
                      Need to create this admin account in Firebase? Switch to{" "}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode("register");
                          setLoginError("");
                        }}
                        className="underline font-bold hover:text-red-900 cursor-pointer"
                      >
                        Register Admin
                      </button>
                    </p>
                  )}
                </div>
              </div>
            )}

            {loginSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>{loginSuccess}</span>
              </div>
            )}

            {authMode === "register" && (
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Enter your email and password (min 6 chars) to register and validate with Firebase.</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-wellness-dark uppercase tracking-wider">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@example.com"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/50 text-wellness-dark text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
                />
              </div>
            </div>

            {authMode !== "forgot" && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-bold text-wellness-dark uppercase tracking-wider">
                    Password
                  </label>
                  {authMode === "login" && (
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-xs text-wellness-primary hover:underline font-semibold"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/50 text-wellness-dark text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-wellness-muted hover:text-wellness-dark"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            {authMode === "register" && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-wellness-dark uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/50 text-wellness-dark text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3 px-4 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 cursor-pointer"
            >
              {loginSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validating with Firebase...</span>
                </>
              ) : authMode === "register" ? (
                <>
                  <span>Create Admin & Log In</span>
                  <UserPlus className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In & Authenticate</span>
                  <Lock className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-wellness-muted hover:text-wellness-primary transition-colors inline-flex items-center gap-1 font-medium"
              >
                ← Back to Workshop Registration
              </Link>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 2. AUTHENTICATED ADMIN DASHBOARD
  // -------------------------------------------------------------
  return (
    <div className="min-h-screen bg-wellness-bg flex flex-col">
      {/* Top Navbar */}
      <header className="bg-white border-b border-wellness-border/80 sticky top-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <img
              src="/logo1.png"
              alt="Logo"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain shrink-0"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-sm sm:text-base md:text-lg font-bold text-wellness-dark font-serif leading-tight truncate">
                  Admin Dashboard
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider border border-emerald-200 shrink-0">
                  Firebase Live
                </span>
              </div>
              <p className="text-[11px] text-wellness-muted hidden md:block truncate">
                Real-time Transaction Records & Attendee Directory
              </p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-wellness-border bg-wellness-surface hover:bg-wellness-border/50 text-xs font-semibold text-wellness-dark transition-colors"
            >
              <span>Live Form</span>
              <ExternalLink className="w-3.5 h-3.5 text-wellness-primary" />
            </Link>

            <button
              onClick={handleCreateTestTx}
              disabled={creatingTest}
              title="Add a sample booking to test Firestore"
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-wellness-primary/30 bg-wellness-emeraldBg hover:bg-wellness-primary/10 text-xs font-bold text-wellness-primary transition-all cursor-pointer"
            >
              {creatingTest ? (
                <div className="w-3.5 h-3.5 border-2 border-wellness-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <Database className="w-3.5 h-3.5" />
              )}
              <span>{creatingTest ? "Saving..." : "Test Record"}</span>
            </button>

            {/* Sync Razorpay Button */}
            <button
              onClick={handleSyncRazorpay}
              disabled={syncingRazorpay}
              title="Fetch all transactions directly from Razorpay & save to Cloud Firestore"
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-500/30 bg-blue-50 hover:bg-blue-100 text-[11px] sm:text-xs font-bold text-blue-800 transition-all cursor-pointer shadow-xs"
            >
              {syncingRazorpay ? (
                <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
              )}
              <span className="hidden sm:inline">{syncingRazorpay ? "Syncing..." : "Sync Razorpay"}</span>
              <span className="sm:hidden">{syncingRazorpay ? "..." : "Sync"}</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Data"
              className="p-1.5 sm:p-2 rounded-xl border border-wellness-border bg-white hover:bg-wellness-surface text-wellness-dark transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? "animate-spin text-wellness-primary" : ""}`} />
            </button>

            {/* Admin User Info */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-wellness-surface border border-wellness-border text-xs text-wellness-dark">
              <User className="w-3.5 h-3.5 text-wellness-primary" />
              <span className="font-medium truncate max-w-[140px]">
                {currentUser.email}
              </span>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-[11px] sm:text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-4 sm:space-y-6">
        
        {/* Status Toast Notification */}
        {statusMessage && (
          <div
            className={`p-3.5 sm:p-4 rounded-2xl border flex items-start gap-2.5 sm:gap-3 shadow-md animate-fade-in ${
              statusMessage.type === "success"
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-red-50 border-red-300 text-red-900"
            }`}
          >
            {statusMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 text-xs sm:text-sm font-medium">
              {statusMessage.text}
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Metric Summary Cards (2 cols on mobile, 4 cols on desktop) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Card 1: Total Registrations */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-wellness-border shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-wellness-muted uppercase tracking-wider">
                Registrations
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-wellness-dark mt-0.5 sm:mt-1 font-mono">
                {metrics.totalCount}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 font-medium mt-0.5 sm:mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>Firestore Live</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <Users className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-wellness-border shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-wellness-muted uppercase tracking-wider">
                Revenue
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-wellness-primary mt-0.5 sm:mt-1 font-mono">
                ₹{metrics.totalRevenue}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-wellness-muted font-medium mt-0.5 sm:mt-1 truncate">
                ₹1 token fee
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 shrink-0">
              <IndianRupee className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 3: Today's Registrations */}
          <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-wellness-border shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs font-bold text-wellness-muted uppercase tracking-wider">
                Today&apos;s Bookings
              </p>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-wellness-dark mt-0.5 sm:mt-1 font-mono">
                {metrics.todayCount}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-wellness-muted font-medium mt-0.5 sm:mt-1 truncate">
                Last 24 hours
              </p>
            </div>
            <div className="w-9 h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700 shrink-0">
              <Calendar className="w-4 h-4 sm:w-6 sm:h-6" />
            </div>
          </div>

          {/* Card 4: Workshop Schedule */}
          <div className="bg-gradient-to-br from-wellness-primaryDark to-wellness-primary p-3.5 sm:p-5 rounded-2xl text-white shadow-xs flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-[10px] sm:text-xs font-bold text-wellness-goldLight uppercase tracking-wider truncate">
                Masterclass
              </p>
              <h3 className="text-sm sm:text-base lg:text-lg font-bold font-serif mt-0.5 sm:mt-1 truncate">
                Sat, 19 Sept
              </h3>
              <p className="text-[10px] sm:text-[11px] text-gray-200 mt-0.5 flex items-center gap-1 truncate">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-wellness-goldLight shrink-0" />
                <span>8:00 AM IST</span>
              </p>
            </div>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-wellness-goldLight shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* Filter, Search & Export Bar */}
        <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-wellness-border shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search attendee, email, phone, ID..."
              className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/40 text-wellness-dark text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-wellness-muted hover:text-wellness-dark"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Date Filter & Sort & Export */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/60 text-xs font-semibold text-wellness-dark focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 cursor-pointer"
            >
              <option value="all">All Dates</option>
              <option value="today">Today Only</option>
              <option value="last7days">Last 7 Days</option>
              <option value="custom">Specific Date</option>
            </select>

            {dateFilter === "custom" && (
              <input
                type="date"
                value={customDate}
                onChange={(e) => setCustomDate(e.target.value)}
                className="px-2 sm:px-3 py-2 rounded-xl border border-wellness-border bg-wellness-surface/60 text-xs font-semibold text-wellness-dark focus:outline-none col-span-2 sm:col-span-1"
              />
            )}

            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/60 hover:bg-wellness-border/50 text-xs font-semibold text-wellness-dark transition-colors cursor-pointer"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-wellness-primary" />
              <span>{sortOrder === "desc" ? "Newest" : "Oldest"}</span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="col-span-2 sm:col-span-1 inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>

        {/* Transactions Table & Mobile Cards */}
        <div className="bg-white rounded-2xl border border-wellness-border shadow-xs overflow-hidden">
          <div className="p-3.5 sm:px-6 border-b border-wellness-border/80 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-wellness-primary shrink-0" />
              <h2 className="text-xs sm:text-base font-bold text-wellness-dark truncate">
                Transaction Directory
              </h2>
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-wellness-muted shrink-0">
              Showing <strong className="text-wellness-dark">{filteredTransactions.length}</strong> of{" "}
              {transactions.length}
            </span>
          </div>

          {dataLoading ? (
            <div className="p-10 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-wellness-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-wellness-muted">
                Connecting to Firebase Firestore...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-8 sm:p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-wellness-surface flex items-center justify-center mx-auto text-wellness-muted">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-wellness-dark">
                No Transactions Found
              </p>
              <p className="text-xs text-wellness-muted max-w-sm mx-auto">
                {searchQuery || dateFilter !== "all"
                  ? "Try clearing your search query or date filters."
                  : "Successful workshop payment transactions will automatically appear here in real time."}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleCreateTestTx}
                  disabled={creatingTest}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  <Database className="w-4 h-4" />
                  <span>{creatingTest ? "Creating Test..." : "Generate Test Booking"}</span>
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* 1. MOBILE VIEW: Responsive Cards for Phones & Small Screens (< md) */}
              <div className="block md:hidden divide-y divide-wellness-border/60">
                {filteredTransactions.map((tx, idx) => {
                  const attendeeNumber = (tx.whatsappNumber || tx.phone || "").replace(/\D/g, "");
                  const isSendingThis = sendingEmailId === (tx.id || tx.paymentId);

                  return (
                    <div
                      key={tx.id || tx.paymentId || idx}
                      className="p-3.5 space-y-2.5 hover:bg-wellness-cream/20 transition-colors"
                    >
                      {/* Top Row: Attendee Name + Status Badge */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono font-bold text-wellness-muted">
                              #{idx + 1}
                            </span>
                            <h3 className="font-bold text-wellness-dark text-sm truncate">
                              {tx.fullName || "N/A"}
                            </h3>
                          </div>
                          <p className="text-[11px] text-wellness-muted truncate break-all">
                            {tx.email || "No email"}
                          </p>
                        </div>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          {tx.status || "PAID"}
                        </span>
                      </div>

                      {/* Middle Grid: Date, Phone, Amount */}
                      <div className="grid grid-cols-2 gap-2 bg-wellness-surface/60 rounded-xl p-2.5 text-xs border border-wellness-border/50">
                        <div>
                          <span className="text-[9px] uppercase font-bold text-wellness-muted block tracking-wider">
                            Date & Time
                          </span>
                          <span className="font-semibold text-wellness-dark text-[11px] block truncate">
                            {tx.dateString || "N/A"}
                          </span>
                          <span className="text-[10px] text-wellness-muted block font-mono">
                            {tx.timeString || ""}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] uppercase font-bold text-wellness-muted block tracking-wider">
                            Amount Paid
                          </span>
                          <span className="font-extrabold text-wellness-primary font-mono text-sm">
                            ₹{tx.amount || 1}
                          </span>
                          <span className="text-[10px] text-emerald-700 block font-medium">
                            {tx.countryCode || "+91"} {attendeeNumber}
                          </span>
                        </div>
                      </div>

                      {/* Payment ID with copy */}
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] bg-gray-50/80 rounded-lg px-2.5 py-1.5 border border-gray-200/80">
                        <span className="text-wellness-muted font-mono truncate max-w-[200px]">
                          {tx.paymentId}
                        </span>
                        <button
                          onClick={() => handleCopy(tx.paymentId, tx.id || tx.paymentId)}
                          className="text-wellness-primary font-bold hover:underline flex items-center gap-1 shrink-0 ml-2 cursor-pointer"
                        >
                          {copiedId === (tx.id || tx.paymentId) ? (
                            <span className="text-emerald-600 flex items-center gap-0.5">
                              <Check className="w-3 h-3" /> Copied
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5">
                              <Copy className="w-3 h-3" /> Copy ID
                            </span>
                          )}
                        </button>
                      </div>

                      {/* Mobile Card Action Buttons */}
                      <div className="flex items-center gap-2 pt-0.5">
                        <button
                          type="button"
                          onClick={() => handleSendConfirmationEmail(tx)}
                          disabled={isSendingThis}
                          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                          title="Send Email Confirmation via EmailJS"
                        >
                          {isSendingThis ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          <span>{isSendingThis ? "Sending..." : "Email Pass"}</span>
                        </button>

                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="px-3.5 py-2 rounded-xl bg-wellness-surface hover:bg-wellness-border/50 text-wellness-dark border border-wellness-border text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Details
                        </button>

                        <button
                          onClick={() => handleDelete(tx)}
                          className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 2. DESKTOP & TABLET VIEW: High-Density Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-wellness-surface/80 border-b border-wellness-border text-[11px] font-bold text-wellness-dark uppercase tracking-wider">
                      <th className="py-3 px-4">#</th>
                      <th className="py-3 px-4">Date & Time</th>
                      <th className="py-3 px-4">Attendee</th>
                      <th className="py-3 px-4">Contact / Phone</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Payment ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-wellness-border/60 text-xs">
                    {filteredTransactions.map((tx, idx) => {
                      const attendeeNumber = (tx.whatsappNumber || tx.phone || "").replace(/\D/g, "");
                      const isSendingThis = sendingEmailId === (tx.id || tx.paymentId);

                      return (
                        <tr
                          key={tx.id || tx.paymentId || idx}
                          className="hover:bg-wellness-cream/40 transition-colors"
                        >
                          <td className="py-3.5 px-4 font-mono text-wellness-muted text-[11px]">
                            {idx + 1}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-wellness-dark">
                              {tx.dateString || "N/A"}
                            </div>
                            <div className="text-[11px] text-wellness-muted font-mono">
                              {tx.timeString || ""}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-wellness-dark">
                              {tx.fullName || "N/A"}
                            </div>
                            <div className="text-[11px] text-wellness-muted break-all">
                              {tx.email || "N/A"}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-medium text-wellness-dark">
                                {tx.countryCode || "+91"} {attendeeNumber || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-extrabold text-wellness-primary font-mono text-sm">
                              ₹{tx.amount || 1}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1">
                              <span className="font-mono text-[11px] text-wellness-dark max-w-[120px] truncate">
                                {tx.paymentId}
                              </span>
                              <button
                                onClick={() => handleCopy(tx.paymentId, tx.id || tx.paymentId)}
                                className="text-wellness-muted hover:text-wellness-primary p-1 cursor-pointer"
                                title="Copy Payment ID"
                              >
                                {copiedId === (tx.id || tx.paymentId) ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300/60">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {tx.status || "SUCCESS"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Send / Resend Email Confirmation Button */}
                              <button
                                type="button"
                                onClick={() => handleSendConfirmationEmail(tx)}
                                disabled={isSendingThis}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold transition-colors cursor-pointer"
                                title="Send Email Confirmation via EmailJS"
                              >
                                {isSendingThis ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                ) : (
                                  <Mail className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                                <span>{isSendingThis ? "Sending..." : "Email Pass"}</span>
                              </button>

                              {/* View Full Modal */}
                              <button
                                onClick={() => setSelectedTx(tx)}
                                className="px-2.5 py-1.5 rounded-lg bg-wellness-surface hover:bg-wellness-border/60 text-wellness-dark border border-wellness-border text-[11px] font-semibold transition-colors cursor-pointer"
                              >
                                Details
                              </button>

                              {/* Delete Option */}
                              <button
                                onClick={() => handleDelete(tx)}
                                className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
                                title="Delete transaction"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. TRANSACTION DETAILS MODAL (Fully Mobile Responsive) */}
      {/* ------------------------------------------------------------- */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-wellness-dark/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="relative w-full max-w-md my-auto bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-wellness-primaryDark to-wellness-primary p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] sm:text-xs uppercase tracking-wider text-wellness-goldLight font-bold">
                  Transaction Receipt
                </span>
                <h3 className="text-base sm:text-lg font-bold font-serif leading-tight truncate">
                  Registration #{selectedTx.id?.slice(0, 8) || selectedTx.paymentId?.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable on small screens) */}
            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4 text-xs sm:text-sm overflow-y-auto flex-1">
              <div className="bg-wellness-surface/75 rounded-2xl p-3.5 sm:p-4 border border-wellness-border space-y-2">
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Attendee:</span>
                  <span className="text-wellness-dark font-bold text-right">{selectedTx.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Email:</span>
                  <span className="text-wellness-dark font-bold break-all text-right max-w-[200px]">{selectedTx.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Contact:</span>
                  <span className="text-wellness-dark font-bold font-mono text-right">
                    {selectedTx.countryCode} {selectedTx.whatsappNumber || selectedTx.phone}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Amount:</span>
                  <span className="text-wellness-primary font-extrabold font-mono text-base">
                    ₹{selectedTx.amount || 1}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Payment Date:</span>
                  <span className="text-wellness-dark font-semibold text-right">
                    {selectedTx.dateString} {selectedTx.timeString ? `at ${selectedTx.timeString}` : ""}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Payment ID:</span>
                  <span className="text-wellness-dark font-mono text-[11px] break-all text-right max-w-[180px]">
                    {selectedTx.paymentId}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Order ID:</span>
                  <span className="text-wellness-dark font-mono text-[11px] break-all text-right max-w-[180px]">
                    {selectedTx.orderId}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-wellness-muted font-medium">Status:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified & Paid
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {/* Send Email Confirmation Button via EmailJS */}
                <button
                  type="button"
                  onClick={() => handleSendConfirmationEmail(selectedTx)}
                  disabled={sendingEmailId === (selectedTx.id || selectedTx.paymentId)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white font-bold text-xs sm:text-sm shadow-md transition-all text-center cursor-pointer"
                >
                  {sendingEmailId === (selectedTx.id || selectedTx.paymentId) ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Mail className="w-4 h-4" />
                  )}
                  <span>
                    {sendingEmailId === (selectedTx.id || selectedTx.paymentId)
                      ? "Sending Confirmation Email..."
                      : "Send Email Confirmation (EmailJS)"}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(getAdminEmailMessage(selectedTx), "modal_msg")}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-wellness-surface hover:bg-wellness-border/60 text-wellness-dark text-xs font-semibold border border-wellness-border transition-colors cursor-pointer"
                >
                  {copiedId === "modal_msg" ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Email Text Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-wellness-muted" />
                      <span>Copy Email Confirmation Text</span>
                    </>
                  )}
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleDelete(selectedTx)}
                    className="flex-1 py-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-xs border border-red-200 transition-colors cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Record</span>
                  </button>

                  <button
                    onClick={() => setSelectedTx(null)}
                    className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
