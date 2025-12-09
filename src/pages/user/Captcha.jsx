import React, { useState, useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

const Captcha = () => {
  const [captcha, setCaptcha] = useState(null);
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState(0);
  const [balance, setBalance] = useState(0);
  const [stats, setStats] = useState({ solved: 0, totalEarnings: 0, failed: 0, skipped: 0 });
  const [userPlan, setUserPlan] = useState(undefined); // IMPORTANT: undefined = not loaded yet
  const [timer, setTimer] = useState(24);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Fetch user plan + stats first (NO captcha request here)
  const fetchUserStats = useCallback(async () => {
    try {
      const { data } = await API.get("/auth/me");

      setUserPlan(data.data?.plan || null); // null = no plan
      setStats((prev) => ({
        ...prev,
        solved: data.data?.totalCaptchasSolved || 0,
        totalEarnings: data.data?.totalEarnings || 0,
      }));
    } catch (err) {
      console.error("Stats error:", err);
    }
  }, []);

  const fetchBalance = async () => {
    try {
      const { data } = await API.get("/wallet/balance");
      setBalance(data.balance || 0);
    } catch (err) {
      console.error("Balance error:", err);
    }
  };

  // Captcha API (only called when userPlan exists)
  const fetchCaptcha = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/captchas/random");
      setCaptcha(data.data);
      setAnswer("");
      setEarnings(0);
      // reset timer
      setTimer(24);
      // reset like state based on localStorage for this captcha
      try {
        const key = data.data?.image?.slice(0, 80) || null;
        const stored = JSON.parse(localStorage.getItem("likedCaptchas")) || [];
        const liked = key && stored.includes(key);
        setIsLiked(!!liked);
        // likesCount is local only; if stored mapping exists, use it
        const counts = JSON.parse(localStorage.getItem("captchaLikeCounts") || "{}");
        setLikesCount(counts[key] || 0);
      } catch (e) {
        setIsLiked(false);
        setLikesCount(0);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Captcha error";
      toast.error(msg);

      if (msg.toLowerCase().includes("plan")) {
        navigate("/plans");
      }
    } finally {
      setLoading(false);
    }
  };

  // Load stats + wallet first
  useEffect(() => {
    if (user) {
      fetchUserStats();
      fetchBalance();
    }
  }, [user]);

  // As soon as we know userPlan → decide redirect OR load captcha
  useEffect(() => {
    // Not loaded yet → do nothing (prevents early 403)
    if (userPlan === undefined) return;

    // No plan → redirect
    if (userPlan === null) {
      toast.error("Please purchase a plan first");
      navigate("/plans");
      return;
    }

    // Has plan → load captcha
    fetchCaptcha();
  }, [userPlan]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!answer.trim()) {
      toast.warn("Enter captcha answer");
      return;
    }

    try {
      setLoading(true);
      const payload = { answer, captchaId: captcha?.captchaId };
      console.log("Sending Payload to Server:", payload);
      
      const { data } = await API.post("/captchas/submit", payload);

      if (data.success) {
        setEarnings(data.earned || 0);
        setBalance(data.totalBalance || 0);
        setStats((p) => ({
          ...p,
          solved: p.solved + 1,
          totalEarnings: p.totalEarnings + (data.earned || 0),
        }));

        toast.success(`Correct! Earned ₹${(data.earned || 0).toFixed(2)}`);

        setTimeout(fetchCaptcha, 1200);
      } else {
        setStats((p) => ({ ...p, failed: p.failed + 1 }));
        toast.error("Incorrect! Try again");
      }
    } catch (err) {
      console.error("Submit Error:", err);
      const serverMsg = err.response?.data?.message || err.message;
      const debugIdStatus = captcha?.captchaId ? "PRESENT" : "MISSING";
      
      // FALLBACK DEBUGGING: Alert the user directly
      window.alert(`⚠️ SUBMIT ERROR ⚠️\n\nServer Message: "${serverMsg}"\nCaptcha ID Sent: ${debugIdStatus}`);
    } finally {
      setLoading(false);
    }
  };

  // Timer effect: countdown when captcha changes
  useEffect(() => {
    if (!captcha) return;

    setTimer((t) => (t > 0 ? t : 24));
    const iv = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          // time up: auto-skip
          clearInterval(iv);
          setStats((p) => ({ ...p, skipped: p.skipped + 1 }));
          toast.info('Time up — captcha skipped');
          fetchCaptcha();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captcha]);

  const handleSkip = async () => {
    if (loading) return;
    setStats((p) => ({ ...p, skipped: p.skipped + 1 }));
    toast.info('Captcha skipped');
    fetchCaptcha();
  };

  const toggleLike = () => {
    if (!captcha) return;
    try {
      const key = captcha.image.slice(0, 80);
      const liked = !isLiked;
      setIsLiked(liked);
      setLikesCount((c) => (liked ? c + 1 : Math.max(0, c - 1)));

      // persist liked keys
      const stored = JSON.parse(localStorage.getItem('likedCaptchas') || '[]');
      let next = stored.filter(Boolean);
      if (liked) next = Array.from(new Set([...next, key]));
      else next = next.filter((k) => k !== key);
      localStorage.setItem('likedCaptchas', JSON.stringify(next));

      // persist counts map
      const counts = JSON.parse(localStorage.getItem('captchaLikeCounts') || '{}');
      counts[key] = (counts[key] || 0) + (liked ? 1 : -1);
      if (counts[key] < 0) counts[key] = 0;
      localStorage.setItem('captchaLikeCounts', JSON.stringify(counts));
    } catch (e) {
      console.warn('Like persist error', e);
    }
  };

  // Loading while plan is being fetched
  if (userPlan === undefined) {
    return (
      <div className="flex items-center justify-center h-screen text-white text-xl">
        Loading...
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
              Solve Captchas & Earn 💰
            </h1>
            <p className="text-slate-400 mt-2">Each correct answer earns you money instantly</p>
          </div>
         
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Current Balance */}
          <div className="rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-6 hover:border-green-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-2">Current Balance</p>
            <p className="text-4xl font-bold text-green-400">₹{balance.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-2">Available to withdraw</p>
          </div>

          {/* Last Earning */}
          <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-6 hover:border-blue-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-2">Last Earned</p>
            <p className="text-4xl font-bold text-blue-400">₹{earnings.toFixed(2)}</p>
            <p className="text-xs text-slate-500 mt-2">From this captcha</p>
          </div>

          {/* Total Solved */}
          <div className="rounded-2xl bg-gradient-to-br from-purple-500/10 to-violet-500/10 border border-purple-500/20 p-6 hover:border-purple-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-2">Total Solved</p>
            <p className="text-4xl font-bold text-purple-400">{stats.solved}</p>
            <p className="text-xs text-slate-500 mt-2">Captchas completed</p>
          </div>

          {/* Plan Rate */}
          <div className="rounded-2xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 p-6 hover:border-yellow-500/50 transition">
            <p className="text-slate-400 text-sm font-semibold mb-2">Your Rate</p>
            <p className="text-4xl font-bold text-yellow-400">₹{userPlan?.earningsPerCaptcha?.toFixed(2) || "0.50"}</p>
            <p className="text-xs text-slate-500 mt-2">Per captcha solved</p>
          </div>
        </div>

        {/* Main Captcha Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Captcha Section */}
          <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-8">
            <h2 className="text-2xl font-bold text-white mb-6">🔐 Solve the Captcha</h2>
            {captcha ? (
              <>
              <div>
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 text-purple-300 text-sm font-semibold rounded-lg">
                      Difficulty: {captcha.difficulty}
                    </span>
                  </div>
                  <div className="w-full min-h-64 bg-slate-700 border-2 border-slate-600 rounded-2xl flex items-center justify-center overflow-hidden">
                    <div className="relative w-full flex items-center justify-center">
                      <div className="absolute top-4 right-4 bg-emerald-800 text-emerald-100 px-3 py-1 rounded-full text-sm font-semibold">{timer} s</div>
                      <div dangerouslySetInnerHTML={{ __html: captcha.image }}></div>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-white mb-3">
                      Enter what you see in the image:
                    </label>
                    <input
                      type="text"
                      value={answer}
                      onChange={(e) => setAnswer(e.target.value)}
                      placeholder="Type your answer here..."
                      className="w-full px-4 py-3 bg-slate-700 border-2 border-slate-600 text-white placeholder-slate-500 rounded-lg focus:outline-none focus:border-purple-500 transition text-lg font-semibold"
                      disabled={loading}
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !answer}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg transform hover:scale-105 active:scale-95"
                  >
                    {loading ? "⏳ Checking Answer..." : "✓ Submit Answer"}
                  </button>
                  <div className="mt-3 flex gap-3">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={loading}
                      className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-lg transition font-semibold"
                    >
                      ⏭ Skip
                    </button>

                    <button
                      type="button"
                      onClick={toggleLike}
                      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition ${isLiked ? 'bg-pink-600 text-white' : 'bg-slate-700 text-white hover:bg-slate-600'}`}>
                      {isLiked ? '♥ Liked' : '♡ Like'}
                      <span className="text-sm text-slate-300">{likesCount}</span>
                    </button>
                  </div>
                </form>
              </div>
              <div>
                 {/* DEBUG INFO - REMOVE LATER */}
                 <div className="mt-4 p-2 bg-black/50 rounded text-xs text-slate-400 font-mono">
                    <p>Debug Info:</p>
                    <p>Captcha ID: {captcha.captchaId ? (captcha.captchaId.slice(0, 10) + '...') : <span className="text-red-500">MISSING (Backend not updated)</span>}</p>
                 </div>
              </div>
              </>
            ) : null}
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-4">
            {/* Plan Info */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">📋 Your Plan</h3>
              {userPlan ? (
                <div className="space-y-3">
                  <div>
                    <p className="text-slate-400 text-xs">Plan Name</p>
                    <p className="text-white font-bold text-sm">{userPlan.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Daily Limit</p>
                    <p className="text-white font-bold text-sm">{userPlan.captchaLimit} captchas</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs">Rate</p>
                    <p className="text-green-400 font-bold text-sm">₹{userPlan.earningsPerCaptcha?.toFixed(2)} each</p>
                  </div>
                </div>
              ) : (
                <p className="text-slate-400">No active plan</p>
              )}
            </div>

            {/* Performance Stats */}
            <div className="rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 p-6">
              <h3 className="text-lg font-bold text-white mb-4">📊 Session Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Solved:</span>
                  <span className="text-white font-bold">{stats.solved}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Failed:</span>
                  <span className="text-red-400 font-bold">{stats.failed}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 text-sm">Skipped:</span>
                  <span className="text-yellow-400 font-bold">{stats.skipped}</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-slate-600">
                  <span className="text-slate-400 text-sm">Total Earned:</span>
                  <span className="text-green-400 font-bold">₹{stats.totalEarnings.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-6">
              <h3 className="text-lg font-bold text-white mb-4">💡 Tips</h3>
              <ul className="text-sm text-slate-400 space-y-2">
                <li>✓ Read carefully</li>
                <li>✓ Be precise</li>
                <li>✓ Solve quickly</li>
                <li>✓ Earn faster</li>
              </ul>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <button
                onClick={() => navigate("/wallet")}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-bold py-3 rounded-lg transition"
              >
                💳 Check Wallet
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-600 hover:to-slate-700 text-white font-bold py-3 rounded-lg transition"
              >
                📊 Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Captcha;