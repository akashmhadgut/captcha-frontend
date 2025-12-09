import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api/axios';
import { AuthContext } from '../context/AuthContext';

const Planselection = () => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectingDemo, setSelectingDemo] = useState(false);
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Load Razorpay script once
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // optional cleanup
    };
  }, []);

  useEffect(() => {
    // If user already has a plan, go to dashboard
    if (user && user.plan) {
      navigate('/dashboard');
      return;
    }

    fetchPlans();
  }, [user, navigate]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/plans');
      const allPlans = data.data || [];
      // keep demo separate
      // const paid = allPlans.filter((p) => p.name !== 'Demo');
      // setPlans(paid);
      setPlans(allPlans);
    } catch (err) {
      console.error(err);
      toast.error('Unable to load plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDemo = async () => {
    try {
      setSelectingDemo(true);
      const { data } = await API.post('/plans/select-demo');
      if (data.success) {
        toast.success('Demo plan activated — earnings disabled');
        // small delay so toast shows, then navigate to captcha
        setTimeout(() => navigate('/captcha'), 1000);
      } else {
        toast.error(data.message || 'Failed to activate demo');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Activation failed');
    } finally {
      setSelectingDemo(false);
    }
  };

  const handlePayment = async (planId) => {
    try {
      const { data } = await API.post('/plans/payment/initialize', { planId });
      if (!data.success) {
        toast.error('Failed to initialize payment');
        return;
      }

      const { orderId, amount, currency, keyId } = data.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: 'Captcha Earning',
        description: `Purchase Plan - ₹${amount / 100}`,
        order_id: orderId,
        handler: async (response) => {
          try {
            const verifyRes = await API.post('/plans/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              planId,
            });

            if (verifyRes.data.success) {
              toast.success('Plan purchased — activated');
              setTimeout(() => navigate('/captcha'), 1000);
            } else {
              toast.error('Payment verification failed');
            }
          } catch (err) {
            console.error(err);
            toast.error('Payment verification failed');
          }
        },
        prefill: { email: user?.email },
        theme: { color: '#3399cc' },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Payment init failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#063A2E] px-6 py-12">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">
            Choose Your Plan
          </h1>
          <p className="mt-3 text-gray-200">
            Start with demo or buy a plan to unlock full earning features.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan._id}
              className={`rounded-lg shadow-lg overflow-hidden transition transform hover:scale-105 ${
                plan.name === 'Demo'
                  ? 'bg-yellow-100 border-4 border-yellow-400'
                  : plan.name.includes('Premium') || plan.name.includes('Gold')
                  ? 'bg-gradient-to-br from-purple-50 to-white ring-2 ring-purple-600'
                  : 'bg-white'
              }`}
            >
              <div className="p-8 flex flex-col h-full">
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

                <ul className="space-y-3 mb-8 flex-grow">
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
                    Instant withdrawals
                  </li>
                </ul>

                {plan.name === 'Demo' ? (
                  <button
                    onClick={handleSelectDemo}
                    disabled={selectingDemo}
                    className="w-full py-3 rounded-lg bg-yellow-500 text-[#083026] font-bold shadow-lg hover:bg-yellow-400 transition"
                  >
                    {selectingDemo ? "Activating..." : "Start Demo Work"}
                  </button>
                ) : (
                  <button
                    onClick={() => handlePayment(plan._id)}
                    className="w-full py-3 rounded-lg bg-[#063A2E] text-white font-medium shadow hover:opacity-90 transition"
                  >
                    Buy Plan
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Planselection;
