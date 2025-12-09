import React, { useEffect, useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import API from "../api/axios";
import { AuthContext } from "../context/AuthContext";

const HomePage = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ✅ Load Razorpay script properly
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await API.get("/plans");
      setPlans(data.data || []);
    } catch (error) {
      toast.error("Failed to fetch plans");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = async (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }

    // If plan is free (demo), call select-demo endpoint instead of payment
    const price = Number(plan.price);
    if (!price || price <= 0) {
      try {
        const { data } = await API.post('/plans/select-demo');
        if (data.success) {
          toast.success('Demo plan activated — earnings disabled');
          setTimeout(() => navigate('/captcha'), 800);
          return;
        } else {
          toast.error(data.message || 'Failed to activate demo plan');
          return;
        }
      } catch (err) {
        console.error('Demo activation error', err);
        toast.error(err.response?.data?.message || 'Failed to activate demo');
        return;
      }
    }

    // Paid plan -> initialize payment
    handlePayment(plan._id);
  };

 const handlePayment = async (planId) => {
  try {
    // Initialize Razorpay payment
    const { data } = await API.post("/plans/payment/initialize", { planId });
    console.log("🧾 Payment init response:", data);

    if (data.success && data.data) {
      const { orderId, amount, currency, keyId } = data.data;

      const options = {
        key: keyId, // ✅ from backend
        amount,
        currency,
        name: "Captcha Earning",
        description: `Purchase Plan - ₹${amount / 100}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await API.post("/plans/payment/verify", {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
            });

            if (verifyRes.data.success) {
              toast.success("✅ Plan purchased successfully!");
              setTimeout(() => navigate("/dashboard"), 2000);
            } else {
              toast.error("Payment verification failed");
            }
          } catch (error) {
            toast.error("Payment verification failed");
            console.error(error);
          }
        },
        prefill: {
          email: user?.email,
        },
        theme: {
          color: "#3399cc",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      toast.error("Failed to initialize payment");
    }
  } catch (error) {
    console.error("💥 Payment init error:", error);
    toast.error(error.response?.data?.message || "Payment initialization failed");
  }
};


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Navigation Bar */}
       

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-16 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Earn Money by Solving Captchas
          </h2>
          <p className="text-lg md:text-xl text-purple-100 mb-8 max-w-2xl mx-auto">
            Get paid instantly for each captcha you solve. Simple, fast, and reliable.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            {!user ? (
              <>
                <button
                  onClick={() => navigate("/register")}
                  className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
                >
                  Get Started
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-purple-600 transition"
                >
                  Login
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate("/captcha")}
                className="bg-white text-purple-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
              >
                Start Solving
              </button>
            )}
          </div>
        </div>
      </div>

       

      {/* Plans Section */}
      <div className="py-16 px-6 bg-white">
        <div className="max-w-7xl mx-auto">
          <h3 className="text-3xl font-bold text-center mb-12">Choose Your Plan</h3>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin">
                <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full"></div>
              </div>
            </div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-gray-600">
              <p>No plans available at the moment</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div
                  key={plan._id}
                  className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                    plan.name.includes("Premium")
                      ? "ring-2 ring-purple-600 bg-gradient-to-br from-purple-50 to-white"
                      : "bg-white"
                  }`}
                >
                  {plan.name.includes("Premium") && (
                    <div className="bg-purple-600 text-white py-2 text-center font-semibold">
                      ⭐ Most Popular
                    </div>
                  )}
                  <div className="p-8">
                    <h4 className="text-2xl font-bold mb-2 text-gray-800">{plan.name}</h4>
                    <p className="text-gray-600 text-sm mb-4">{plan.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-purple-600">
                        ₹{plan.price}
                      </span>
                      <p className="text-gray-600 text-sm mt-1">
                        Valid for {plan.validityDays} days
                      </p>
                    </div>

                    <ul className="space-y-3 mb-8">
                      <li className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-600">✓</span>
                        Solve {plan.captchaLimit} captchas/day
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-600">✓</span>
                        ₹{plan.earningsPerCaptcha}/captcha
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-600">✓</span>
                        {Math.max(
                          0,
                          plan.captchaLimit * plan.earningsPerCaptcha * plan.validityDays
                        )}
                        ₹ max earning potential
                      </li>
                      <li className="flex items-center gap-2 text-gray-700">
                        <span className="text-green-600">✓</span>
                        Instant withdrawals
                      </li>
                    </ul>

                    <button
                      onClick={() => handlePlanClick(plan)}
                      className={`w-full py-3 rounded-lg font-semibold transition ${
                        plan.name.includes("Premium")
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                      }`}
                    >
                      {user ? "Purchase Now" : "Login to Purchase"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <footer className="bg-gray-800 text-gray-300 py-8 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p>&copy; 2024 Captcha Earning Platform. All rights reserved.</p>
          <p className="text-sm mt-2">Made with ❤️ for earning enthusiasts</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
