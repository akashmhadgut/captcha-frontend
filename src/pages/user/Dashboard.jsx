import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayEarnings, setTodayEarnings] = useState(0);
  const [weekEarnings, setWeekEarnings] = useState(0);
  const [monthEarnings, setMonthEarnings] = useState(0);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const refreshIntervalRef = useRef(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
      // Auto-refresh every 10 seconds
      refreshIntervalRef.current = setInterval(() => {
        fetchStats();
        fetchWallet();
        fetchEarningsStats();
      }, 10000);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [user]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      await Promise.all([fetchStats(), fetchWallet(), fetchEarningsStats()]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await API.get("/auth/me");
      setStats(data.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchWallet = async () => {
    try {
      const { data } = await API.get("/wallet");
      setWallet(data.data);
    } catch (error) {
      console.error("Error fetching wallet:", error);
    }
  };

  const fetchEarningsStats = async () => {
    try {
      // Calculate earnings for today, this week, this month
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1);

      const { data } = await API.get("/wallet/transactions?limit=100");
      const transactions = data.transactions || [];

      let today_earnings = 0,
        week_earnings = 0,
        month_earnings = 0;

      transactions.forEach((tx) => {
        const txDate = new Date(tx.createdAt);
        const amount = tx.type === "credit" ? tx.amount : 0;

        if (txDate >= today) today_earnings += amount;
        if (txDate >= weekAgo) week_earnings += amount;
        if (txDate >= monthAgo) month_earnings += amount;
      });

      setTodayEarnings(today_earnings);
      setWeekEarnings(week_earnings);
      setMonthEarnings(month_earnings);
    } catch (error) {
      console.error("Error fetching earnings stats:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  const planDaysLeft =
    stats && stats.planExpiry
      ? Math.max(0, Math.ceil((new Date(stats.planExpiry) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;

  const maxEarnings = Math.max(todayEarnings, weekEarnings, monthEarnings) || 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Welcome */}
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
                Welcome back, {stats?.name}! 🎯
              </h1>
              <p className="text-slate-400 text-sm mt-2">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-400 text-sm">Your Balance</p>
              <p className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400">
                ₹{wallet?.balance.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Lifetime Earnings */}
          <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6 hover:border-green-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-400 text-sm font-semibold">Total Lifetime</h3>
                <span className="text-3xl">💰</span>
              </div>
              <p className="text-4xl font-bold text-green-400">
                ₹{wallet?.totalEarned.toFixed(2) || "0.00"}
              </p>
              <p className="text-xs text-slate-500 mt-2">All-time earnings</p>
            </div>
          </div>

          {/* Captchas Solved */}
          <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-6 hover:border-blue-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-400 text-sm font-semibold">Solved</h3>
                <span className="text-3xl">✅</span>
              </div>
              <p className="text-4xl font-bold text-blue-400">
                {stats?.totalCaptchasSolved || 0}
              </p>
              <p className="text-xs text-slate-500 mt-2">Captchas completed</p>
            </div>
          </div>

          {/* Plan Days Left */}
          <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-6 hover:border-purple-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-400 text-sm font-semibold">Plan Valid</h3>
                <span className="text-3xl">📅</span>
              </div>
              <p className="text-4xl font-bold text-purple-400">{planDaysLeft}</p>
              <p className="text-xs text-slate-500 mt-2">Days remaining</p>
            </div>
          </div>

          {/* Account Status */}
          <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500/10 to-rose-500/10 border border-pink-500/20 p-6 hover:border-pink-500/50 transition">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-500/10 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition duration-500"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-slate-400 text-sm font-semibold">Status</h3>
                <span className="text-3xl">{stats?.isBlocked ? "🔴" : "🟢"}</span>
              </div>
              <p className={`text-3xl font-bold ${stats?.isBlocked ? "text-red-400" : "text-green-400"}`}>
                {stats?.isBlocked ? "Blocked" : "Active"}
              </p>
              <p className="text-xs text-slate-500 mt-2">Account status</p>
            </div>
          </div>
        </div>

        {/* Earnings Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Today */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 hover:border-purple-500/50 transition">
            <h3 className="text-slate-400 text-sm font-semibold mb-4">Today's Earnings</h3>
            <p className="text-3xl font-bold text-green-400 mb-3">₹{todayEarnings.toFixed(2)}</p>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((todayEarnings / maxEarnings) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Last 24 hours</p>
          </div>

          {/* This Week */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 hover:border-blue-500/50 transition">
            <h3 className="text-slate-400 text-sm font-semibold mb-4">This Week</h3>
            <p className="text-3xl font-bold text-blue-400 mb-3">₹{weekEarnings.toFixed(2)}</p>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((weekEarnings / maxEarnings) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">Last 7 days</p>
          </div>

          {/* This Month */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6 hover:border-purple-500/50 transition">
            <h3 className="text-slate-400 text-sm font-semibold mb-4">This Month</h3>
            <p className="text-3xl font-bold text-purple-400 mb-3">₹{monthEarnings.toFixed(2)}</p>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-purple-500 to-violet-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((monthEarnings / maxEarnings) * 100, 100)}%` }}
              ></div>
            </div>
            <p className="text-xs text-slate-500 mt-2">This calendar month</p>
          </div>
        </div>

        {/* Plan & Actions Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Current Plan Details */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📋 Your Active Plan</h2>
            {stats?.plan ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                  <span className="text-slate-300 font-semibold">Plan Name</span>
                  <span className="text-xl font-bold text-purple-400">{stats.plan.name}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                  <span className="text-slate-300 font-semibold">Daily Limit</span>
                  <span className="text-xl font-bold text-blue-400">{stats.plan.captchaLimit} captchas</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                  <span className="text-slate-300 font-semibold">Rate Per Captcha</span>
                  <span className="text-xl font-bold text-green-400">₹{stats.plan.earningsPerCaptcha?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition">
                  <span className="text-slate-300 font-semibold">Expires On</span>
                  <span className="text-xl font-bold text-yellow-400">
                    {new Date(stats.planExpiry).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-4 border-t border-slate-700 flex gap-3">
                  <button
                    onClick={() => navigate("/captcha")}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105"
                  >
                    🎯 Start Solving
                  </button>
                  <button
                    onClick={() => navigate("/plans")}
                    className="flex-1 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-700 hover:to-purple-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105"
                  >
                    ⬆️ Upgrade Plan
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg mb-6">No active plan</p>
                <button
                  onClick={() => navigate("/")}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold px-8 py-3 rounded-lg transition transform hover:scale-105"
                >
                  🛍️ Browse Plans
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">⚡ Quick Actions</h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate("/captcha")}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 text-sm"
              >
                🎯 Solve Captcha
              </button>
              <button
                onClick={() => navigate("/wallet")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 text-sm"
              >
                💳 View Wallet
              </button>
              <button
                onClick={() => navigate("/withdraw")}
                disabled={!wallet || wallet.balance < 200}
                className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700 text-white font-bold py-3 rounded-lg transition transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                💸 Withdraw (Min ₹200)
              </button>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* How It Works */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">📚 How It Works</h2>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-purple-400">1</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Purchase a Plan</p>
                  <p className="text-sm text-slate-400">Choose a plan that suits your needs</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-blue-400">2</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Solve Captchas</p>
                  <p className="text-sm text-slate-400">Answer captchas and earn instantly</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-green-500/20 border border-green-500/50 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-green-400">3</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Accumulate Earnings</p>
                  <p className="text-sm text-slate-400">Balance updates after each captcha</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-yellow-500/20 border border-yellow-500/50 flex items-center justify-center flex-shrink-0">
                  <span className="font-bold text-yellow-400">4</span>
                </div>
                <div>
                  <p className="font-semibold text-white">Withdraw Funds</p>
                  <p className="text-sm text-slate-400">Minimum ₹200, processed in 2-3 days</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tips & Tricks */}
          <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">💡 Tips to Maximize Earnings</h2>
            <div className="space-y-4">
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-purple-500/50 transition">
                <p className="font-semibold text-white mb-1">⚡ Speed Matters</p>
                <p className="text-sm text-slate-400">Solve captchas faster to complete more</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-blue-500/50 transition">
                <p className="font-semibold text-white mb-1">🎯 Accuracy</p>
                <p className="text-sm text-slate-400">Only correct answers earn money</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-green-500/50 transition">
                <p className="font-semibold text-white mb-1">📈 Higher Plans</p>
                <p className="text-sm text-slate-400">Premium plans offer better rates</p>
              </div>
              <div className="p-4 bg-slate-700/50 rounded-lg border border-slate-600/50 hover:border-pink-500/50 transition">
                <p className="font-semibold text-white mb-1">⏰ Regular Hours</p>
                <p className="text-sm text-slate-400">Earn consistent daily amounts</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
            