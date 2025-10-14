import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus as PlusIcon, Pencil as PencilIcon, Trash as TrashIcon, Search as MagnifyingGlassIcon, Funnel as FunnelIcon, Upload as ArrowUpTrayIcon } from 'lucide-react';

import { studentsApi } from '../api/students.api';
import { departmentsApi } from '../api/departments.api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import StudentFiltersPanel from '../components/students/StudentFiltersPanel';
import type { StudentFilters } from '../types/student.types';

// Validation schema for student form
const studentSchema = z.object({
  // Accept any non-empty ID so records imported via Excel (e.g., "1") don't error
  student_id: z.string().min(1, 'Student ID is required'),
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(['Male', 'Female', 'Other']).optional(),
  department_id: z.string().min(1, 'Department is required'),
  semester: z.number().min(1).max(8),
  cgpa: z.number().min(0).max(10).optional(),
  research_experience: z.boolean().optional(),
});

type StudentFormData = z.infer<typeof studentSchema>;

const AdminStudentManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<StudentFilters>({
    page: 1,
    limit: 10,
    sort: 'created_at',
    order: 'DESC',
  });

  const queryClient = useQueryClient();

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

  // Fetch students
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'admin', filters],
    queryFn: () => studentsApi.getStudents(filters),
    placeholderData: keepPreviousData,
  });

  // Fetch departments (real data)
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: studentsApi.createStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsModalOpen(false);
      reset();
    },
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      studentsApi.updateStudent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsModalOpen(false);
      setEditingStudent(null);
      reset();
    },
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: studentsApi.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });

  // Import students mutation
  const importStudentsMutation = useMutation({
    mutationFn: (file: File) => studentsApi.importStudents(file),
    onSuccess: (resp) => {
      const res = (resp as any)?.data?.data || (resp as any)?.data;
      const summary = res
        ? `Processed ${res.processed}, Inserted ${res.inserted}, Skipped duplicates ${res.skipped_duplicate}, Skipped invalid ${res.skipped_invalid}`
        : 'Import completed';
      alert(summary);
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setIsImportModalOpen(false);
      setImportFile(null);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to import students';
      alert(message);
    },
  });

  // Form setup
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      research_experience: false,
    },
  });

  // Handle form submission
  const onSubmit = (data: StudentFormData) => {
    // Common normalized fields
    const base = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
      // Always send ISO date (yyyy-mm-dd) when provided
      dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : undefined,
      gender: data.gender || undefined,
      department_id: data.department_id,
      semester: Number(data.semester),
      cgpa: Number.isFinite(data.cgpa as unknown as number)
        ? Number(Number(data.cgpa).toFixed(2))
        : null,
      research_experience: !!data.research_experience,
    } as const;

    if (editingStudent) {
      // Update payload must exclude immutable fields like student_id
      const updatePayload = { ...base };

      updateStudentMutation.mutate(
        { id: editingStudent.student_id, data: updatePayload },
        {
          onSuccess: () => {
            alert('Student updated successfully');
          },
          onError: (err: any) => {
            const message =
              err?.response?.data?.message ||
              err?.response?.data?.error ||
              (Array.isArray(err?.response?.data?.details)
                ? err.response.data.details.map((d: any) => d.message).join('\n')
                : 'Failed to update student');
            alert(message);
          },
        }
      );
    } else {
      // Create payload must include student_id
      const createPayload = {
        student_id: data.student_id.trim(),
        ...base,
      };

      createStudentMutation.mutate(createPayload, {
        onSuccess: () => {
          alert('Student created successfully');
        },
        onError: (err: any) => {
          const message =
            err?.response?.data?.message ||
            err?.response?.data?.error ||
            (Array.isArray(err?.response?.data?.details)
              ? err.response.data.details.map((d: any) => d.message).join('\n')
              : 'Failed to create student');
          alert(message);
        },
      });
    }
  };

  // Handle edit student
  const handleEditStudent = (student: any) => {
    const prefill = (s: any) => {
      setValue('student_id', s.student_id);
      setValue('first_name', s.first_name);
      setValue('last_name', s.last_name);
      setValue('email', s.email);
      setValue('phone', s.phone || '');
      // Support both DATE and ISO timestamp strings
      const dobStr = s.dob ? (typeof s.dob === 'string' ? s.dob : '') : '';
      setValue('dob', dobStr ? dobStr.split('T')[0] : '');
      setValue('gender', s.gender || '');
      setValue('department_id', s.department_id);
      setValue('semester', s.semester);
      setValue('cgpa', s.cgpa);
      setValue('research_experience', s.research_experience);
    };

    // Set immediate values from list (may miss phone/gender), then fetch full details
    setEditingStudent(student);
    prefill(student);
    setIsModalOpen(true);

    // Fetch full student details to ensure phone/gender/dob are populated
    studentsApi.getStudentById(student.student_id)
      .then((resp) => {
        const detailed = (resp as any)?.data?.data || (resp as any)?.data;
        if (detailed) {
          prefill(detailed);
        }
      })
      .catch((err) => {
        console.error('Failed to load full student details for edit', err);
      });
  };

  // Handle delete student
  const handleDeleteStudent = (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      deleteStudentMutation.mutate(studentId, {
        onSuccess: () => {
          alert('Student deleted successfully');
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete student';
          alert(message);
        },
      });
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingStudent(null);
    reset();
  };

  // Handle filter changes
  const handleFilterChange = (newFilters: Partial<StudentFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  // Normalize students and pagination meta from standard ApiResponse<PaginatedResponse<Student>>
  const students = (studentsData as any)?.data?.data?.students || [];
  const meta = (studentsData as any)?.data?.data?.meta;
  const departments = departmentsData?.data || [];

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Student Management</h1>
          <p className="mt-1 text-sm text-neutral-300">
            Manage and view student information
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="secondary"
            onClick={() => setShowFilters(!showFilters)}
            leftIcon={<FunnelIcon className="h-4 w-4" />}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="secondary"
            onClick={() => setIsImportModalOpen(true)}
            leftIcon={<ArrowUpTrayIcon className="h-5 w-5" />}
          >
            Import Students
          </Button>
          <Button
            onClick={() => setIsModalOpen(true)}
            leftIcon={<PlusIcon className="h-5 w-5" />}
          >
            Add Student
          </Button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
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
        <StudentFiltersPanel
          filters={filters}
          onFiltersChange={handleFilterChange}
          onClose={() => setShowFilters(false)}
        />
      )}

      {/* Students Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-lg shadow-lg overflow-hidden">
        {studentsLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200/50">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Semester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    CGPA
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/80 divide-y divide-neutral-200/50">
                {Array.isArray(students) && students.length > 0 ? (
                  students.map((student: any) => (
                    <tr key={student.student_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {student.avatar_path ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={student.avatar_path}
                                alt=""
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {student.first_name[0]}{student.last_name[0]}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {student.first_name} {student.last_name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.student_id}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.department_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.semester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.cgpa || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditStudent(student)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStudent(student.student_id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      {studentsLoading ? 'Loading students...' : 'No students found. Add a new student to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {meta && (
          <div className="bg-white/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-t border-neutral-200/50 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handlePageChange((filters.page || 1) - 1)}
                disabled={!meta.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-neutral-300/60 text-sm font-medium rounded-md text-neutral-700 bg-white/70 hover:bg-white/80 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handlePageChange((filters.page || 1) + 1)}
                disabled={!meta.hasNext}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-neutral-300/60 text-sm font-medium rounded-md text-neutral-700 bg-white/70 hover:bg-white/80 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing{' '}
                  <span className="font-medium">
                    {(meta.page - 1) * meta.limit + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(meta.page * meta.limit, meta.total)}
                  </span>{' '}
                  of <span className="font-medium">{meta.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handlePageChange((filters.page || 1) - 1)}
                    disabled={!meta.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-neutral-300/60 bg-white/70 text-sm font-medium text-neutral-600 hover:bg-white/80 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => handlePageChange((filters.page || 1) + 1)}
                    disabled={!meta.hasNext}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Student Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingStudent ? 'Edit Student' : 'Add New Student'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Student ID *
              </label>
              <Input
                {...register('student_id')}
                disabled={!!editingStudent}
                className="mt-1"
                placeholder="S123456"
              />
              {errors.student_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.student_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <Input
                {...register('email')}
                type="email"
                className="mt-1"
                placeholder="student@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <Input
                {...register('first_name')}
                className="mt-1"
                placeholder="John"
              />
              {errors.first_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.first_name.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <Input
                {...register('last_name')}
                className="mt-1"
                placeholder="Doe"
              />
              {errors.last_name && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.last_name.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <Input
                {...register('phone')}
                className="mt-1"
                placeholder="+1234567890"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <Input
                {...register('dob')}
                type="date"
                className="mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Gender
              </label>
              <select
                {...register('gender')}
                className="mt-1 select-field"
              >
                <option className="text-neutral-900" value="">Select Gender</option>
                <option className="text-neutral-900" value="Male">Male</option>
                <option className="text-neutral-900" value="Female">Female</option>
                <option className="text-neutral-900" value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Department *
              </label>
              <select
                {...register('department_id')}
                className="mt-1 select-field"
              >
                <option className="text-neutral-900" value="">Select Department</option>
                {departments.map((dept: any) => (
                  <option className="text-neutral-900" key={dept.department_id} value={dept.department_id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.department_id && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.department_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Semester *
              </label>
              <Input
                {...register('semester', { valueAsNumber: true })}
                type="number"
                min="1"
                max="8"
                className="mt-1"
                placeholder="5"
              />
              {errors.semester && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.semester.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                CGPA
              </label>
              <Input
                {...register('cgpa', { valueAsNumber: true })}
                type="number"
                step="0.01"
                min="0"
                max="10"
                className="mt-1"
                placeholder="8.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center">
              <input
                {...register('research_experience')}
                type="checkbox"
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Research Experience
              </label>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleModalClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
            >
              {editingStudent ? 'Update Student' : 'Create Student'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Import Students Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
        }}
        title="Import Students via Excel"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload an Excel or CSV file. Column headings should match the students table; unknown columns are ignored. Duplicate primary keys are skipped.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700">Select file</label>
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="mt-1 block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer focus:outline-none"
              onChange={(e) => setImportFile(e.target.files?.[0] || null)}
            />
            {importFile && (
              <p className="mt-2 text-sm text-gray-500">Selected: {importFile.name} ({Math.round(importFile.size / 1024)} KB)</p>
            )}
          </div>
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsImportModalOpen(false);
                setImportFile(null);
              }}
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={!importFile || importStudentsMutation.isPending}
              onClick={() => {
                if (importFile) {
                  importStudentsMutation.mutate(importFile);
                }
              }}
            >
              {importStudentsMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
    </div>
  );
};

export default AdminStudentManagement;
