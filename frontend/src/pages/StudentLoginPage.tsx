import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSetAuth, useIsLoading } from '../stores/auth.store';
import { authApi } from '../api/auth.api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Validation schema for student login
const studentLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
});

type StudentLoginFormData = z.infer<typeof studentLoginSchema>;

const StudentLoginPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const setAuth = useSetAuth();
  const isAuthLoading = useIsLoading();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
  });

  const onSubmit = async (data: StudentLoginFormData) => {
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.studentLogin(data);
      console.log('🎓 Student login successful:', response);
      
      // Set auth state - response.data contains the ApiResponse, response.data.data contains the AuthResponse
      setAuth(response.data.data);
      console.log('🎓 Auth state set, navigating to dashboard');
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('🎓 Student login failed:', err);
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="spinner h-12 w-12"></div>
          <p className="text-neutral-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="text-center">
          <div className="mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-br from-secondary-500 to-accent-500 rounded-2xl flex items-center justify-center shadow-glow animate-bounce-subtle">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-secondary-600 to-accent-600 bg-clip-text text-transparent mb-2">
            Student Portal
          </h1>
          <p className="text-lg text-neutral-600 font-medium">
            Access Your Academic Journey
          </p>
          <p className="text-sm text-neutral-500 mt-2">
            Sign in with your email and name
          </p>
        </div>

        {/* Login Form */}
        <div className="card-elevated animate-scale-in">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-5">
              <div className="form-group">
                <Input
                  {...register('email')}
                  label="Email address"
                  type="email"
                  autoComplete="email"
                  error={errors.email?.message}
                  placeholder="Enter your email address"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <Input
                  {...register('name')}
                  label="Name"
                  type="text"
                  autoComplete="name"
                  error={errors.name?.message}
                  placeholder="Your name (first name or full name)"
                  className="input-field"
                />
              </div>
            </div>

            {error && (
              <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm font-medium text-error-700">{error}</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <Button
                type="submit"
                className="btn btn-secondary btn-lg w-full"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="spinner h-5 w-5 mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  'Access Student Portal'
                )}
              </Button>
            </div>

            <div className="bg-secondary-50 border border-secondary-200 rounded-xl p-4">
              <p className="text-sm font-medium text-secondary-700 mb-2">
                📚 Student Information
              </p>
              <p className="text-sm text-secondary-600">
                Don't have an account? Contact your administrator to get registered and access your academic information.
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentLoginPage;
