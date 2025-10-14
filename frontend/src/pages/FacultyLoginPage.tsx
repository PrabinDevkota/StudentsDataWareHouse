import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

import { authApi } from '../api/auth.api';
import { useSetAuth, useIsLoading } from '../stores/auth.store';

const facultyLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type FacultyLoginFormData = z.infer<typeof facultyLoginSchema>;

const FacultyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useSetAuth();
  const isLoading = useIsLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FacultyLoginFormData>({
    resolver: zodResolver(facultyLoginSchema),
  });

  const facultyLoginMutation = useMutation({
    mutationFn: authApi.facultyLogin,
    onSuccess: (response) => {
      console.log('🎓 Faculty login successful:', response.data);
      setAuth(response.data.data);
      console.log('🎓 Auth state set, navigating to dashboard');
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Faculty login failed. Please try again.';
      setError('root', { message });
    },
  });

  const onSubmit = (data: FacultyLoginFormData) => {
    facultyLoginMutation.mutate(data);
  };

  return (
    <div className="page-container">
      <main className="flex-1 flex items-start justify-center">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-accent-500 to-primary-500 rounded-2xl flex items-center justify-center shadow-glow animate-bounce-subtle">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-accent-600 to-primary-600 bg-clip-text text-transparent mb-2">
            Faculty Portal
          </h1>
          <p className="text-lg text-neutral-300 font-medium">
            Manage Your Academic Excellence
          </p>
          <p className="text-sm text-neutral-400 mt-2">
            Sign in with your email and name
          </p>
        </div>

        {/* Login Form */}
        <div className="card-elevated animate-scale-in">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                <input
                  {...register('email')}
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
                />
                {errors.email?.message && (
                  <p className="mt-1 text-sm text-error-600">{errors.email.message}</p>
                )}
              </div>

              <div className="form-group">
                <label className="block text-sm font-medium text-neutral-300 mb-1">Full Name</label>
                <input
                  {...register('name')}
                  type="text"
                  autoComplete="name"
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
                />
                {errors.name?.message && (
                  <p className="mt-1 text-sm text-error-600">{errors.name.message}</p>
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
                className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white py-2.5 px-4 shadow-medium hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                disabled={facultyLoginMutation.isPending || isLoading}
              >
                {facultyLoginMutation.isPending ? (
                  <div className="flex items-center">
                    <div className="spinner h-5 w-5 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Access Faculty Portal'
                )}
              </button>
            </div>

            <div className="bg-accent-50 border border-accent-200 rounded-xl p-4">
              <p className="text-sm font-medium text-accent-700 mb-2">
                🎓 Faculty Access
              </p>
              <p className="text-sm text-accent-600">
                Enter your credentials to access faculty dashboard and student management tools.
              </p>
            </div>

            <div className="text-center pt-4 border-t border-neutral-200">
              <Link
                to="/login"
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                ← Back to Student Login
              </Link>
            </div>
          </form>
        </div>
      </div>
      </main>
      {/* Footer */}
      <footer className="mt-auto py-6 text-center text-xs text-neutral-500">
        © 2025 Student Data Warehouse • Designed by Team Prabin
      </footer>
    </div>
  );
};

export default FacultyLoginPage;