# Quick Start Guide - Captcha Earning Web App

## 🚀 Quick Setup & Run

### Backend Setup
```bash
# Navigate to backend directory
cd ../backend

# Install dependencies
npm install

# Create .env file
# Add your configuration:
MONGO_URI=mongodb://localhost:27017/captcha-app
JWT_SECRET=your_secret_key_here
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET=your_razorpay_secret
PORT=5000

# Start backend
npm start

# Backend will run on http://localhost:5000
# API docs available at http://localhost:5000/api-docs
```

### Frontend Setup
```bash
# Navigate to frontend directory
cd ./captcha-frontend

# Install dependencies
npm install

# Start frontend
npm start

# Frontend will open at http://localhost:3000
```

## 📋 Test Credentials

**For Testing:**
- Email: `test@example.com`
- Password: `Test@123`

Or create a new account via the registration page.

## 🎯 User Flow

1. **Visit Home Page** → http://localhost:3000
2. **Register/Login** → Create account or use existing credentials
3. **Browse Plans** → See available plans on homepage
4. **Purchase Plan** → Click purchase (Razorpay integration ready)
5. **Solve Captchas** → Navigate to Dashboard → Click "Solve Captcha"
6. **Check Wallet** → View balance and transaction history
7. **Request Withdrawal** → Request withdrawal with bank details

## 📁 Frontend Project Structure

```
src/
├── api/
│   └── axios.js                 # API client configuration
├── components/
│   └── ProtectedRoute.jsx       # Route guard component
├── context/
│   └── AuthContext.jsx          # Auth state management
├── pages/
│   ├── HomePage.jsx             # Landing page with plans
│   ├── auth/
│   │   ├── Login.jsx            # Login page
│   │   └── Register.jsx         # Registration page
│   └── user/
│       ├── Dashboard.jsx        # User dashboard with stats
│       ├── Captcha.jsx          # Captcha solving page
│       ├── Wallet.jsx           # Wallet & transactions
│       └── Withdraw.jsx         # Withdrawal request
├── App.js                       # Main app with routing
├── index.js                     # React entry point
├── App.css                      # Global styles
└── index.css                    # CSS resets
```

## 🔌 API Configuration

**Base URL**: `http://localhost:5000/api`

All requests automatically include:
- `Authorization: Bearer <JWT_TOKEN>`
- Token is read from localStorage

## 📦 Key Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "axios": "^1.5.0",
  "react-toastify": "^9.x",
  "jwt-decode": "^3.x",
  "tailwindcss": "^3.x"
}
```

## 🔐 Authentication Flow

1. User registers with email/password
2. Backend hashes password with bcrypt
3. User logs in, receives JWT token
4. Token stored in localStorage
5. Axios interceptor adds token to all requests
6. AuthContext manages user state globally
7. Protected routes check authentication

## 💳 Payment Flow (Razorpay)

1. User clicks "Purchase Plan"
2. Frontend requests order creation
3. Razorpay popup opens
4. User completes payment
5. Frontend verifies signature
6. Plan activated in database
7. User can now solve captchas

## 💰 Earning Flow

1. User solves captcha correctly
2. Backend verifies answer
3. Credits added to wallet instantly
4. User sees updated balance
5. Minimum ₹200 to withdraw
6. Withdrawal approved by admin
7. Funds transferred to bank

## 🐛 Common Issues & Fixes

### CORS Error
**Fix**: Backend has CORS enabled for http://localhost:3000

### Token Not Working
**Fix**: Check localStorage has "token" key
```javascript
// In browser console
localStorage.getItem("token")
```

### Images Not Loading
**Fix**: Ensure backend is running and serving files
- Images should be at: `http://localhost:5000/uploads/captchas/`

### API Calls Failing
**Fix**: Verify backend is running on port 5000
```bash
netstat -an | findstr "5000"
```

## 📊 API Endpoints Quick Reference

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

### Captcha
- `GET /captchas/random` - Get random captcha (requires plan)
- `POST /captchas/submit` - Submit captcha answer

### Wallet
- `GET /wallet` - Get wallet details
- `GET /wallet/balance` - Get current balance
- `GET /wallet/transactions` - Get transactions (paginated)

### Plans
- `GET /plans` - List all plans
- `POST /plans/initialize-payment` - Start Razorpay payment
- `POST /plans/verify-payment` - Verify payment & activate plan

### Withdrawals
- `POST /withdrawal/request` - Request withdrawal
- `GET /withdrawal/my` - Get user's withdrawals

## 🎨 UI Components

### Page Colors
- **Homepage**: Purple/Gray gradient
- **Dashboard**: Indigo/Purple gradient
- **Captcha**: Purple theme
- **Wallet**: Blue theme
- **Withdraw**: Green theme

### Common Patterns
- Gradient backgrounds
- Shadow effects on cards
- Hover animations
- Responsive grid layouts
- Loading spinners
- Toast notifications

## ✅ Checklist Before Deployment

- [ ] Backend running on port 5000
- [ ] MongoDB connected
- [ ] Razorpay keys configured
- [ ] Frontend running on port 3000
- [ ] Can register and login
- [ ] Can view plans
- [ ] Can solve captchas
- [ ] Can check wallet
- [ ] Can request withdrawal
- [ ] No console errors

## 📞 Support

For issues:
1. Check browser console for errors
2. Check backend console for API errors
3. Verify all services are running
4. Check MongoDB connection
5. Verify environment variables

## 🎓 Learning Resources

- [React Router](https://reactrouter.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Axios Documentation](https://axios-http.com/)
- [Razorpay Integration](https://razorpay.com/developers/)
- [JWT Authentication](https://jwt.io/)

---

**Happy Earning! 💰**
