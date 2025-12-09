import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

// Route wrapper that requires user authentication and an active plan
const PlanRequiredRoute = ({ children }) => {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;

  // If the user object explicitly indicates no plan (null) or an empty value, send to plans
  // If the backend doesn't include plan on user object, we allow access (fallback) —
  // the Captcha page will re-check server-side and redirect if necessary.
  if (user.plan === null || user.plan === undefined ? false : !user.plan) {
    return <Navigate to="/plans" />;
  }

  return children;
};

export default PlanRequiredRoute;
