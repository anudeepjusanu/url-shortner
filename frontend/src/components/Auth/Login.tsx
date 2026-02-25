import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LinkIcon, Phone } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../UI/Button';
import Input from '../UI/Input';
import OTPDialog from './OTPDialog';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otpData, setOtpData] = useState<{ phone?: string; email: string } | null>(null);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await login(email, password, undefined, phone);
      console.log('Login result:', result);

      if (result.otpRequired && result.otpData) {
        // Show OTP dialog
        console.log('OTP required, showing dialog with data:', result.otpData);
        setOtpData(result.otpData);
        setShowOTPDialog(true);
      } else {
        // Login successful
        console.log('Login successful, navigating to dashboard');
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, otp, phone);

      if (!result.otpRequired) {
        // Login successful
        setShowOTPDialog(false);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setLoading(false);
      throw err; // Let OTPDialog handle the error display
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password, undefined, phone);

      if (result.otpRequired && result.otpData) {
        setOtpData(result.otpData);
      }
    } catch (err: any) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center">
            <div className="mx-auto h-12 w-12 bg-primary-600 rounded-xl flex items-center justify-center">
              <LinkIcon className="h-6 w-6 text-white" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-gray-900">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Sign in to your account to continue
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="text-sm text-red-600">{error}</div>
              </div>
            )}
            
            <div className="space-y-4">
              <Input
                id="email"
                type="email"
                required
                label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                icon={<Mail className="h-5 w-5" />}
                placeholder="Enter your email"
              />

              <Input
                id="phone"
                type="tel"
                label="Phone number (optional)"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                icon={<Phone className="h-5 w-5" />}
                placeholder="+966 5X XXX XXXX"
              />

              <Input
                id="password"
                type="password"
                required
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={<Lock className="h-5 w-5" />}
                placeholder="Enter your password"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                  Forgot your password?
                </a>
              </div>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign in
            </Button>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">New to our platform?</span>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link
                to="/register"
                className="font-medium text-primary-600 hover:text-primary-500"
              >
                Create your account
              </Link>
            </div>
          </div>
        </div>
      </div>

      <OTPDialog
        isOpen={showOTPDialog}
        onClose={() => setShowOTPDialog(false)}
        onVerify={handleVerifyOTP}
        onResend={handleResendOTP}
        email={otpData?.email || email}
        phone={otpData?.phone}
        loading={loading}
      />
    </div>
  );
};

export default Login;