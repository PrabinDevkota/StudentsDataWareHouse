import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';

import { authApi } from '../api/auth.api';
import { useSetAuth, useIsLoading } from '../stores/auth.store';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useSetAuth();
  const isLoading = useIsLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      console.log('🔐 Login successful:', response.data);
      setAuth(response.data.data);
      console.log('🔐 Auth state set, navigating to dashboard');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      setError('root', { message });
    },
  });

  const onSubmit = (data: LoginFormData) => {
    loginMutation.mutate(data);
  };

  return (
    <div className="page-container">
      <main className="flex-1 flex items-start justify-center">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center shadow-glow animate-bounce-subtle">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-2">
            Welcome Back
          </h1>
          <p className="text-lg text-neutral-300 font-medium">
            Student Data Warehouse
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Login Form */}
        <div className="card-elevated animate-slide-up">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                />
                {errors.email?.message && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition pr-12"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-neutral-400 hover:text-neutral-200 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password?.message && (
                  <p className="mt-1 text-sm text-error-600">{errors.password.message}</p>
                )}
              </div>
            </div>

            {errors.root && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-error-700">{errors.root.message}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 px-4 shadow-medium hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="spinner h-5 w-5 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Demo Credentials & Links */}
        <div className="text-center space-y-4 animate-fade-in">
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-sm font-medium text-primary-700 mb-2">
              🚀 Demo Credentials
            </p>
            <div className="bg-white rounded-lg p-3 border border-primary-100">
              <p className="text-sm font-mono text-primary-800">
                admin@example.com
              </p>
              <p className="text-sm font-mono text-primary-800">
                admin123
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm">
            <span className="text-neutral-600">Are you a student?</span>
            <a
              href="/student-login"
              className="font-semibold text-primary-600 hover:text-primary-700 transition-colors duration-200 hover:underline"
            >
              Student Login →
            </a>
          </div>
        </div>
      </div>
      </main>
      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-neutral-500">
        © 2025 Student Data Warehouse
      </footer>
    </div>
  );
};

export default LoginPage;
