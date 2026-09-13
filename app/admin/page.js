"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  signInAdmin,
  signOutAdmin,
  getCurrentAdminUser,
  sendAdminPasswordReset,
} from "@/lib/firebase";
import { subscribeToTransactions, getTransactionsList } from "@/lib/transactionService";
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
  ArrowUpDown,
  Filter,
} from "lucide-react";
import Link from "next/link";

export default function AdminPage() {
  // Auth state
  const [currentUser, setCurrentUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginSubmitting, setLoginSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter & Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // 'all', 'today', 'last7days', 'custom'
  const [customDate, setCustomDate] = useState("");
  const [sortOrder, setSortOrder] = useState("desc"); // 'desc' (newest first) or 'asc'

  // Selected Transaction Modal
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // 1. Check existing session on mount
  useEffect(() => {
    const user = getCurrentAdminUser();
    setCurrentUser(user);
    setAuthLoading(false);
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
        setTransactions(list);
        setDataLoading(false);
      },
      (err) => {
        console.warn("Real-time listener error:", err);
        getTransactionsList().then((list) => {
          setTransactions(list);
          setDataLoading(false);
        });
      }
    );

    return () => unsubscribe && unsubscribe();
  }, [currentUser]);

  // Handle Login via Firebase Auth REST API
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginSubmitting(true);

    try {
      const user = await signInAdmin(email.trim(), password);
      setCurrentUser(user);
    } catch (err) {
      console.error("Login Error:", err);
      setLoginError(err.message || "Failed to sign in. Please verify credentials.");
    } finally {
      setLoginSubmitting(false);
    }
  };

  // Handle Password Reset
  const handleForgotPassword = async () => {
    if (!email) {
      setLoginError("Please enter your admin email address first.");
      return;
    }
    try {
      await sendAdminPasswordReset(email.trim());
      setResetSent(true);
      setLoginError("");
      setTimeout(() => setResetSent(false), 6000);
    } catch (err) {
      setLoginError(err.message || "Could not send password reset email.");
    }
  };

  // Handle Logout
  const handleLogout = () => {
    signOutAdmin();
    setCurrentUser(null);
  };

  // Manual Refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const list = await getTransactionsList();
      setTransactions(list);
    } catch (err) {
      console.error("Refresh error:", err);
    } finally {
      setRefreshing(false);
    }
  };

  // Copy helper
  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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

  // Export to CSV
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

    const rows = filteredTransactions.map((tx, idx) => [
      idx + 1,
      `"${tx.dateString || ""}"`,
      `"${tx.timeString || ""}"`,
      `"${(tx.fullName || "").replace(/"/g, '""')}"`,
      `"${(tx.email || "").replace(/"/g, '""')}"`,
      `"${tx.countryCode || "+91"}"`,
      `"${tx.whatsappNumber || ""}"`,
      `"${(tx.workshop || "").replace(/"/g, '""')}"`,
      tx.amount || 1,
      `"${tx.paymentId || ""}"`,
      `"${tx.orderId || ""}"`,
      `"${tx.status || "SUCCESS"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Workshop_Transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-wellness-bg flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-wellness-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-wellness-dark">
            Loading Admin Portal...
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // 1. LOGIN SCREEN (If not authenticated)
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-wellness-bg relative overflow-hidden flex items-center justify-center p-4">
        {/* Background Ambient Elements */}
        <div className="absolute inset-0 bg-ambient-pattern pointer-events-none z-0" />
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-wellness-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/2 -right-32 w-80 h-80 bg-wellness-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-wellness-primaryDark via-wellness-primary to-wellness-primaryLight p-6 text-center text-white">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center mx-auto mb-3 border border-white/20">
              <Lock className="w-6 h-6 text-emerald-200" />
            </div>
            <h1 className="text-2xl font-bold font-serif">Admin Portal</h1>
            <p className="text-xs text-gray-200 mt-1">
              Bandhas & Nauli Kriya Workshop Transactions
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 sm:p-8 space-y-5">
            {loginError && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{loginError}</span>
              </div>
            )}

            {resetSent && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-start gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                <span>Password reset link sent to your email. Check your inbox!</span>
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
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-wellness-border bg-wellness-surface/50 text-wellness-dark text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-wellness-dark uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-wellness-primary hover:underline font-semibold"
                >
                  Forgot?
                </button>
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
                  className="w-full pl-10 pr-10 py-3 rounded-xl border border-wellness-border bg-wellness-surface/50 text-wellness-dark text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
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

            <button
              type="submit"
              disabled={loginSubmitting}
              className="w-full py-3.5 px-4 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {loginSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Signing In with Firebase...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <Lock className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-wellness-muted hover:text-wellness-primary transition-colors inline-flex items-center gap-1 font-medium"
              >
                ← Back to Registration Page
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
      <header className="bg-white border-b border-wellness-border/80 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo1.png"
              alt="Logo"
              className="h-10 sm:h-12 w-auto object-contain"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-bold text-wellness-dark font-serif leading-tight">
                  Admin Dashboard
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-wellness-gold/20 text-wellness-goldDark text-[11px] font-bold uppercase tracking-wider">
                  Live Firestore
                </span>
              </div>
              <p className="text-xs text-wellness-muted hidden sm:block">
                Real-time Transaction Records & Attendee Directory
              </p>
            </div>
          </div>

          {/* Admin User Info & Actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-wellness-border bg-wellness-surface hover:bg-wellness-border/50 text-xs font-semibold text-wellness-dark transition-colors"
            >
              <span>Live Form</span>
              <ExternalLink className="w-3.5 h-3.5 text-wellness-primary" />
            </Link>

            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="Refresh Data"
              className="p-2 rounded-xl border border-wellness-border bg-white hover:bg-wellness-surface text-wellness-dark transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-wellness-primary" : ""}`} />
            </button>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-wellness-surface border border-wellness-border text-xs text-wellness-dark">
              <User className="w-3.5 h-3.5 text-wellness-primary" />
              <span className="font-medium truncate max-w-[160px]">
                {currentUser.email}
              </span>
            </div>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Dashboard Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Registrations */}
          <div className="bg-white p-5 rounded-2xl border border-wellness-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-wellness-muted uppercase tracking-wider">
                Total Registrations
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-wellness-dark mt-1 font-mono">
                {metrics.totalCount}
              </h3>
              <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Verified & Confirmed
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
              <Users className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-wellness-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-wellness-muted uppercase tracking-wider">
                Total Revenue
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-wellness-primary mt-1 font-mono">
                ₹{metrics.totalRevenue}
              </h3>
              <p className="text-[11px] text-wellness-muted font-medium mt-1">
                ₹1 Token Fee per attendee
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700">
              <IndianRupee className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Today's Registrations */}
          <div className="bg-white p-5 rounded-2xl border border-wellness-border shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-wellness-muted uppercase tracking-wider">
                Today&apos;s Bookings
              </p>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-wellness-dark mt-1 font-mono">
                {metrics.todayCount}
              </h3>
              <p className="text-[11px] text-wellness-muted font-medium mt-1">
                Registered in last 24h
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
              <Calendar className="w-6 h-6" />
            </div>
          </div>

          {/* Card 4: Workshop Schedule */}
          <div className="bg-gradient-to-br from-wellness-primaryDark to-wellness-primary p-5 rounded-2xl text-white shadow-sm flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-wellness-goldLight uppercase tracking-wider">
                Next Masterclass
              </p>
              <h3 className="text-base sm:text-lg font-bold font-serif mt-1">
                Sat, 19 Sept
              </h3>
              <p className="text-[11px] text-gray-200 mt-0.5 flex items-center gap-1">
                <Clock className="w-3 h-3 text-wellness-goldLight" />
                8:00 AM IST • 90 Min Live
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center text-wellness-goldLight">
              <Sparkles className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Filter, Search & Export Bar */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-wellness-border shadow-sm flex flex-col md:flex-row gap-3.5 items-stretch md:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px]">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-wellness-muted">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, payment ID..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/40 text-wellness-dark text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 focus:border-wellness-primary transition-all"
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

          {/* Date Filter & Sort */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/60 text-xs font-semibold text-wellness-dark focus:outline-none focus:ring-2 focus:ring-wellness-primary/20 cursor-pointer"
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
                className="px-3 py-2 rounded-xl border border-wellness-border bg-wellness-surface/60 text-xs font-semibold text-wellness-dark focus:outline-none"
              />
            )}

            <button
              onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-wellness-border bg-wellness-surface/60 hover:bg-wellness-border/50 text-xs font-semibold text-wellness-dark transition-colors"
              title="Toggle Sort Order"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-wellness-primary" />
              <span>{sortOrder === "desc" ? "Newest First" : "Oldest First"}</span>
            </button>

            {/* CSV Export Button */}
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-wellness-primary hover:bg-wellness-primaryDark text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="bg-white rounded-2xl border border-wellness-border shadow-sm overflow-hidden">
          <div className="p-4 sm:px-6 border-b border-wellness-border/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-wellness-primary" />
              <h2 className="text-sm sm:text-base font-bold text-wellness-dark">
                Date-Wise Transaction Records
              </h2>
            </div>
            <span className="text-xs font-medium text-wellness-muted">
              Showing <strong className="text-wellness-dark">{filteredTransactions.length}</strong> of{" "}
              {transactions.length} records
            </span>
          </div>

          {dataLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-wellness-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-wellness-muted">
                Connecting to Firebase Firestore...
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-wellness-surface flex items-center justify-center mx-auto text-wellness-muted">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-wellness-dark">
                No Transactions Found
              </p>
              <p className="text-xs text-wellness-muted max-w-sm mx-auto">
                {searchQuery || dateFilter !== "all"
                  ? "Try clearing your search query or date filters."
                  : "Successful workshop payment transactions will automatically appear here date-wise in real time."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-wellness-surface/80 border-b border-wellness-border text-[11px] font-bold text-wellness-dark uppercase tracking-wider">
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Date & Time</th>
                    <th className="py-3 px-4">Attendee</th>
                    <th className="py-3 px-4">WhatsApp / Phone</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment ID</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-wellness-border/60 text-xs">
                  {filteredTransactions.map((tx, idx) => {
                    const attendeeNumber = (tx.whatsappNumber || "").replace(/\D/g, "");
                    const fullContactNumber = `${(tx.countryCode || "+91").replace(/\D/g, "")}${attendeeNumber}`;
                    const whatsappDirectUrl = `https://wa.me/${fullContactNumber}?text=${encodeURIComponent(
                      `Hello ${tx.fullName},\nYour registration for the Bandhas & Nauli Kriya Workshop is confirmed! (Payment ID: ${tx.paymentId})`
                    )}`;

                    return (
                      <tr
                        key={tx.id || idx}
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
                              {tx.countryCode || "+91"} {tx.whatsappNumber || "N/A"}
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
                              onClick={() => handleCopy(tx.paymentId, tx.id)}
                              className="text-wellness-muted hover:text-wellness-primary p-1"
                              title="Copy Payment ID"
                            >
                              {copiedId === tx.id ? (
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
                            {/* Direct WhatsApp Chat */}
                            <a
                              href={whatsappDirectUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>

                            {/* View Full Modal */}
                            <button
                              onClick={() => setSelectedTx(tx)}
                              className="px-2.5 py-1.5 rounded-lg bg-wellness-surface hover:bg-wellness-border/60 text-wellness-dark border border-wellness-border text-[11px] font-semibold transition-colors"
                            >
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* ------------------------------------------------------------- */}
      {/* 3. TRANSACTION DETAILS MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-wellness-dark/75 backdrop-blur-sm animate-fade-in">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-wellness-border overflow-hidden animate-fade-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-wellness-primaryDark to-wellness-primary p-5 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase tracking-wider text-wellness-goldLight font-bold">
                  Transaction Receipt
                </span>
                <h3 className="text-lg font-bold font-serif leading-tight">
                  Registration #{selectedTx.id?.slice(0, 8)}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTx(null)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              <div className="bg-wellness-surface/75 rounded-2xl p-4 border border-wellness-border space-y-2.5">
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Attendee Name:</span>
                  <span className="text-wellness-dark font-bold">{selectedTx.fullName}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Email Address:</span>
                  <span className="text-wellness-dark font-bold break-all">{selectedTx.email}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">WhatsApp:</span>
                  <span className="text-wellness-dark font-bold font-mono">
                    {selectedTx.countryCode} {selectedTx.whatsappNumber}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Amount Paid:</span>
                  <span className="text-wellness-primary font-extrabold font-mono text-base">
                    ₹{selectedTx.amount || 1}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Payment Date:</span>
                  <span className="text-wellness-dark font-semibold">
                    {selectedTx.dateString} at {selectedTx.timeString}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Payment ID:</span>
                  <span className="text-wellness-dark font-mono text-xs break-all">
                    {selectedTx.paymentId}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-wellness-border/50">
                  <span className="text-wellness-muted font-medium">Order ID:</span>
                  <span className="text-wellness-dark font-mono text-xs break-all">
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
                <a
                  href={`https://wa.me/${(selectedTx.countryCode || "+91").replace(/\D/g, "")}${(selectedTx.whatsappNumber || "").replace(/\D/g, "")}?text=${encodeURIComponent(
                    `Hello ${selectedTx.fullName},\nThis is the Coordinator confirming your registration for the Bandhas & Nauli Kriya Workshop on Saturday, 19 Sept at 8:00 AM IST.\nPayment ID: ${selectedTx.paymentId}`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm shadow transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Message Attendee on WhatsApp</span>
                </a>

                <button
                  onClick={() => setSelectedTx(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
