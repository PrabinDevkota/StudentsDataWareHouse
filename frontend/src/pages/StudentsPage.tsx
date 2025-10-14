import React, { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search as MagnifyingGlassIcon, Funnel as FunnelIcon } from 'lucide-react';

import { studentsApi } from '../api/students.api';
import { queryKeys } from '../lib/react-query';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import StudentTable from '../components/students/StudentTable';
import StudentFiltersPanel from '../components/students/StudentFiltersPanel';
import type { Student, StudentFilters, PaginatedResponse } from '../types/student.types';

const StudentsPage: React.FC = () => {
  const navigate = useNavigate();
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({
    page: 1,
    limit: 20,
    sort: 'created_at',
    order: 'DESC',
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => {
        const newFilters = {
          ...prev,
          q: searchQuery.trim() || undefined,
          page: 1, // Reset to first page when search changes
        };
        // Only update if the query actually changed
        if (prev.q !== newFilters.q) {
          return newFilters;
        }
        return prev;
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.students.list(filters),
    queryFn: () => studentsApi.getStudents(filters),
    placeholderData: keepPreviousData,
  });

  const handleFilterChange = (newFilters: Partial<StudentFilters>) => {
    console.log('StudentsPage Filter Change Debug:', {
      newFilters: JSON.stringify(newFilters, null, 2),
      currentFilters: JSON.stringify(filters, null, 2),
      mergedFilters: JSON.stringify({ ...filters, ...newFilters, page: 1 }, null, 2)
    });
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleViewStudent = (studentId: string) => {
    navigate(`/students/${studentId}`);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  if (error) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center py-12 bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-700 p-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-error-400 to-error-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-error-300 font-medium mb-4">Error loading students. Please try again.</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="btn-primary"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const students = data?.data?.data?.students || [];
  const meta = data?.data?.data?.meta;

  return (
    <div className="page-container">
      <div className="content-container space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="animate-slide-up">
            <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
              Students
            </h1>
            <p className="mt-2 text-lg text-neutral-300 font-medium">
              Manage and view student information
            </p>
          </div>
          <div className="flex space-x-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <Button
              variant="secondary"
              onClick={() => setShowFilters(!showFilters)}
              leftIcon={<FunnelIcon className="h-4 w-4" />}
              className="btn-glass hover:scale-105 transition-all duration-200"
            >
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="max-w-md animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Input
            placeholder="Search students by name, email, or student number..."
            leftIcon={<MagnifyingGlassIcon className="h-5 w-5" />}
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-glass"
          />
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="animate-slide-down">
            <StudentFiltersPanel
              filters={filters}
              onFiltersChange={handleFilterChange}
              onClose={() => setShowFilters(false)}
            />
          </div>
        )}

        {/* Students Table */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {isLoading ? (
            <div className="flex justify-center py-16">
              <div className="text-center">
                <LoadingSpinner size="lg" className="mb-4" />
                <p className="text-neutral-600 font-medium">Loading students...</p>
              </div>
            </div>
          ) : students.length > 0 ? (
            <StudentTable
              students={students}
              onViewStudent={handleViewStudent}
              pagination={meta ? {
                currentPage: meta.page,
                totalPages: meta.totalPages,
                totalItems: meta.total,
                onPageChange: handlePageChange,
              } : undefined}
            />
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-neutral-200 to-neutral-300 rounded-full flex items-center justify-center">
                <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">No students found</h3>
              <p className="text-neutral-500">No students match your current search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentsPage;