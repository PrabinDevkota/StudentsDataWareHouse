import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, GraduationCap, User, ShieldCheck, Briefcase } from 'lucide-react';

import { authApi } from '../api/auth.api';
import { useSetAuth, useIsLoading } from '../stores/auth.store';

// Login types
type LoginType = 'admin' | 'student' | 'faculty' | 'club' | 'cir';

// Validation schemas
const adminLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// CIR login schema (same as admin)
const cirLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const studentLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
});

const facultyLoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const clubLoginSchema = z.object({
  club_id: z.string().min(5, 'Club ID must be at least 5 characters'),
});

type AdminLoginFormData = z.infer<typeof adminLoginSchema>;
type StudentLoginFormData = z.infer<typeof studentLoginSchema>;
type FacultyLoginFormData = z.infer<typeof facultyLoginSchema>;
type CIRLoginFormData = z.infer<typeof cirLoginSchema>;

const UnifiedLoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<LoginType>('admin');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const setAuth = useSetAuth();
  const isAuthLoading = useIsLoading();

  // Admin form
  const adminForm = useForm<AdminLoginFormData>({
    resolver: zodResolver(adminLoginSchema),
  });

  // Student form
  const studentForm = useForm<StudentLoginFormData>({
    resolver: zodResolver(studentLoginSchema),
  });

  // Faculty form
  const facultyForm = useForm<FacultyLoginFormData>({
    resolver: zodResolver(facultyLoginSchema),
  });

  // Club form
  const clubForm = useForm<z.infer<typeof clubLoginSchema>>({
    resolver: zodResolver(clubLoginSchema),
  });

  // CIR form with demo credentials
  const cirForm = useForm<CIRLoginFormData>({
    resolver: zodResolver(cirLoginSchema),
    defaultValues: {
      email: 'cir@gmail.com',
      password: 'cir123',
    },
  });

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      console.log('🔐 Admin login successful:', response.data);
      setAuth(response.data.data);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      adminForm.setError('root', { message });
    },
  });

  // Student login mutation
  const studentLoginMutation = useMutation({
    mutationFn: authApi.studentLogin,
    onSuccess: (response) => {
      console.log('🎓 Student login successful:', response.data);
      setAuth(response.data.data);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Student login failed. Please try again.';
      studentForm.setError('root', { message });
    },
  });

  // Faculty login mutation
  const facultyLoginMutation = useMutation({
    mutationFn: authApi.facultyLogin,
    onSuccess: (response) => {
      console.log('🎓 Faculty login successful:', response.data);
      setAuth(response.data.data);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || error.response?.data?.message || 'Faculty login failed. Please try again.';
      facultyForm.setError('root', { message });
    },
  });

  // Club login mutation
  const clubLoginMutation = useMutation({
    mutationFn: authApi.clubLogin,
    onSuccess: (response) => {
      console.log('🏛️ Club login successful:', response.data);
      setAuth(response.data.data);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      clubForm.setError('root', { message });
    },
  });

  // CIR login mutation uses generic /auth/login
  const cirLoginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (response) => {
      console.log('💼 CIR login successful:', response.data);
      setAuth(response.data.data);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      const message = error.response?.data?.error || 'Login failed. Please try again.';
      cirForm.setError('root', { message });
    },
  });

  const onAdminSubmit = (data: AdminLoginFormData) => {
    adminLoginMutation.mutate(data);
  };

  const onStudentSubmit = (data: StudentLoginFormData) => {
    studentLoginMutation.mutate(data);
  };

  const onFacultySubmit = (data: FacultyLoginFormData) => {
    facultyLoginMutation.mutate(data);
  };

  const onClubSubmit = (data: z.infer<typeof clubLoginSchema>) => {
    clubLoginMutation.mutate(data);
  };

  const onCIRSubmit = (data: CIRLoginFormData) => {
    cirLoginMutation.mutate(data);
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

  const tabs = [
    { id: 'admin', label: 'Admin', icon: ShieldCheck },
    { id: 'student', label: 'Student', icon: User },
    { id: 'faculty', label: 'Faculty', icon: GraduationCap },
    { id: 'cir', label: 'CIR', icon: Briefcase },
    { id: 'club', label: 'Club', icon: Eye },
  ];

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
            Choose your role and sign in
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-neutral-900/60 backdrop-blur-sm rounded-2xl p-2 shadow-soft border border-neutral-700 animate-slide-up overflow-hidden">
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as LoginType)}
                  className={`flex-1 min-w-0 flex items-center justify-center space-x-2 rounded-xl py-3 px-4 text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-medium transform scale-105'
                      : 'text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800/40'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Login Forms Container */}
        <div className="card-elevated animate-scale-in">
          {/* Admin Login Form */}
          {activeTab === 'admin' && (
            <form className="space-y-6" onSubmit={adminForm.handleSubmit(onAdminSubmit)}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                  <input
                    {...adminForm.register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                  {adminForm.formState.errors.email?.message && (
                    <p className="mt-1 text-sm text-error-600">{adminForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      {...adminForm.register('password')}
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
                  {adminForm.formState.errors.password?.message && (
                    <p className="mt-1 text-sm text-error-600">{adminForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              {adminForm.formState.errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-error-700">{adminForm.formState.errors.root.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 px-4 shadow-medium hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={adminLoginMutation.isPending}
                >
                  {adminLoginMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="spinner h-5 w-5 mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as Admin'
                  )}
                </button>
              </div>

              <div className="bg-primary-950/30 border border-primary-800 rounded-xl p-4">
                <p className="text-sm font-medium text-primary-200 mb-2">
                  🚀 Demo Credentials
                </p>
                <div className="bg-neutral-900/60 rounded-lg p-3 border border-primary-900/20">
                  <p className="text-sm font-mono text-neutral-200">
                    admin@example.com
                  </p>
                  <p className="text-sm font-mono text-neutral-200">
                    admin123*
                  </p>
                </div>
              </div>
            </form>
          )}

          {/* Student Login Form */}
          {activeTab === 'student' && (
            <form className="space-y-6" onSubmit={studentForm.handleSubmit(onStudentSubmit)}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                  <input
                    {...studentForm.register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition"
                  />
                  {studentForm.formState.errors.email?.message && (
                    <p className="mt-1 text-sm text-error-600">{studentForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                  <input
                    {...studentForm.register('name')}
                    type="text"
                    autoComplete="name"
                    placeholder="Your name (first name or full name)"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:border-secondary-500 transition"
                  />
                  {studentForm.formState.errors.name?.message && (
                    <p className="mt-1 text-sm text-error-600">{studentForm.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              {studentForm.formState.errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-error-700">{studentForm.formState.errors.root.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-secondary-500 to-secondary-600 text-white py-2.5 px-4 shadow-medium hover:from-secondary-600 hover:to-secondary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={studentLoginMutation.isPending}
                >
                  {studentLoginMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="spinner h-5 w-5 mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as Student'
                  )}
                </button>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4">
                <p className="text-sm font-medium text-neutral-200 mb-2">
                  📚 Student Access
                </p>
                <p className="text-sm text-neutral-300">
                  Enter your email and name to access your student profile and academic information.
                </p>
              </div>
            </form>
          )}

          {/* Faculty Login Form */}
          {activeTab === 'faculty' && (
            <form className="space-y-6" onSubmit={facultyForm.handleSubmit(onFacultySubmit)}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                  <input
                    {...facultyForm.register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
                  />
                  {facultyForm.formState.errors.email?.message && (
                    <p className="mt-1 text-sm text-error-600">{facultyForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Name</label>
                  <input
                    {...facultyForm.register('name')}
                    type="text"
                    autoComplete="name"
                    placeholder="Your full name"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition"
                  />
                  {facultyForm.formState.errors.name?.message && (
                    <p className="mt-1 text-sm text-error-600">{facultyForm.formState.errors.name.message}</p>
                  )}
                </div>
              </div>

              {facultyForm.formState.errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-error-700">{facultyForm.formState.errors.root.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-accent-500 to-accent-600 text-white py-2.5 px-4 shadow-medium hover:from-accent-600 hover:to-accent-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={facultyLoginMutation.isPending}
                >
                  {facultyLoginMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="spinner h-5 w-5 mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as Faculty'
                  )}
                </button>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4">
                <p className="text-sm font-medium text-neutral-200 mb-2">
                  🎓 Faculty Access
                </p>
                <p className="text-sm text-neutral-300">
                  Enter your email and name to access faculty dashboard and student management tools.
                </p>
              </div>
            </form>
          )}

          {/* Club Login Form */}
          {activeTab === 'club' && (
            <form className="space-y-6" onSubmit={clubForm.handleSubmit(onClubSubmit)}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Club ID</label>
                  <input
                    {...clubForm.register('club_id')}
                    type="text"
                    autoComplete="off"
                    placeholder="Enter club ID"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                  {clubForm.formState.errors.club_id?.message && (
                    <p className="mt-1 text-sm text-error-600">{clubForm.formState.errors.club_id.message}</p>
                  )}
                </div>
              </div>

              {clubForm.formState.errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-error-700">{clubForm.formState.errors.root.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 px-4 shadow-medium hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={clubLoginMutation.isPending}
                >
                  {clubLoginMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="spinner h-5 w-5 mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as Club'
                  )}
                </button>
              </div>

              <div className="bg-neutral-900/60 border border-neutral-700 rounded-xl p-4">
                <p className="text-sm font-medium text-neutral-200 mb-2">
                  🏛️ Club Access
                </p>
                <p className="text-sm text-neutral-300">
                  Use your club credentials to access club management and member tools.
                </p>
              </div>
            </form>
          )}

          {/* CIR Login Form */}
          {activeTab === 'cir' && (
            <form className="space-y-6" onSubmit={cirForm.handleSubmit(onCIRSubmit)}>
              <div className="space-y-5">
                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Email address</label>
                  <input
                    {...cirForm.register('email')}
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email address"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/70 backdrop-blur-sm px-4 py-2.5 text-neutral-200 placeholder-neutral-400 shadow-soft focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                  />
                  {cirForm.formState.errors.email?.message && (
                    <p className="mt-1 text-sm text-error-600">{cirForm.formState.errors.email.message}</p>
                  )}
                </div>

                <div className="form-group">
                  <label className="block text-sm font-medium text-neutral-300 mb-1">Password</label>
                  <div className="relative">
                    <input
                      {...cirForm.register('password')}
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
                  {cirForm.formState.errors.password?.message && (
                    <p className="mt-1 text-sm text-error-600">{cirForm.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              {cirForm.formState.errors.root && (
                <div className="bg-error-50 border border-error-200 rounded-xl p-4 animate-slide-down">
                  <div className="flex items-center">
                    <svg className="h-5 w-5 text-error-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm font-medium text-error-700">{cirForm.formState.errors.root.message}</p>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white py-2.5 px-4 shadow-medium hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  disabled={cirLoginMutation.isPending}
                >
                  {cirLoginMutation.isPending ? (
                    <div className="flex items-center">
                      <div className="spinner h-5 w-5 mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    'Sign in as CIR'
                  )}
                </button>
              </div>

              <div className="bg-primary-950/30 border border-primary-800 rounded-xl p-4">
                <p className="text-sm font-medium text-primary-200 mb-2">
                  💼 Demo Credentials
                </p>
                <div className="bg-neutral-900/60 rounded-lg p-3 border border-primary-900/20">
                  <p className="text-sm font-mono text-neutral-200">
                    cir@gmail.com
                  </p>
                  <p className="text-sm font-mono text-neutral-200">
                    cir123
                  </p>
                </div>
              </div>
            </form>
          )}
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

export default UnifiedLoginPage;