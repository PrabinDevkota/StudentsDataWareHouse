import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus as PlusIcon, Pencil as PencilIcon, Trash as TrashIcon, Upload as ArrowUpTrayIcon } from 'lucide-react';
import { facultyApi } from '../api/faculty.api';
import { departmentsApi } from '../api/departments.api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import LoadingSpinner from '../components/ui/LoadingSpinner';

// Validation schema for faculty form
const facultySchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  department_id: z.string().min(1, 'Department is required'),
  designation: z.string().optional(),
  specialization: z.string().optional(),
});

type FacultyFormData = z.infer<typeof facultySchema>;

const AdminFacultyManagement: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFaculty, setEditingFaculty] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const queryClient = useQueryClient();

  // Fetch faculty
  const { data: facultyData, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty', 'admin', page, searchTerm],
    queryFn: () => facultyApi.getFaculty({ 
      page, 
      limit: 10, 
      q: searchTerm 
    }),
  });

  // Fetch departments
  const { data: departmentsData, isLoading: departmentsLoading } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });

  // Create faculty mutation
  const createFacultyMutation = useMutation({
    mutationFn: facultyApi.createFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setIsModalOpen(false);
      reset();
    },
  });

  // Update faculty mutation
  const updateFacultyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      facultyApi.updateFaculty(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setIsModalOpen(false);
      setEditingFaculty(null);
      reset();
    },
  });

  // Delete faculty mutation
  const deleteFacultyMutation = useMutation({
    mutationFn: facultyApi.deleteFaculty,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
    },
  });

  // Import faculty mutation
  const importFacultyMutation = useMutation({
    mutationFn: (file: File) => facultyApi.importFaculty(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      setIsImportModalOpen(false);
      setImportFile(null);
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to import faculty';
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
  } = useForm<FacultyFormData>({
    resolver: zodResolver(facultySchema),
  });

  // Handle form submission
  const onSubmit = (data: FacultyFormData) => {
    // Normalize payload to match backend validation schema
    const payload = {
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      email: data.email.trim(),
      phone: data.phone?.trim() || undefined,
      department_id: data.department_id, // must be UUID
      designation: data.designation?.trim() || undefined,
      specialization: data.specialization?.trim() || undefined,
    } as const;

    if (editingFaculty) {
      updateFacultyMutation.mutate(
        { id: editingFaculty.faculty_id, data: payload },
        {
          onSuccess: () => {
            alert('Faculty updated successfully');
          },
          onError: (err: any) => {
            const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to update faculty';
            alert(message);
          },
        }
      );
    } else {
      createFacultyMutation.mutate(payload, {
        onSuccess: () => {
          alert('Faculty created successfully');
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create faculty';
          alert(message);
        },
      });
    }
  };

  // Handle edit faculty
  const handleEditFaculty = (fac: any) => {
    const prefill = (f: any) => {
      setValue('first_name', f.first_name);
      setValue('last_name', f.last_name);
      setValue('email', f.email);
      setValue('phone', f.phone || '');
      setValue('department_id', f.department_id);
      setValue('designation', f.designation || '');
      setValue('specialization', f.specialization || '');
    };

    setEditingFaculty(fac);
    prefill(fac);
    setIsModalOpen(true);

    facultyApi.getFacultyById(fac.faculty_id)
      .then((resp) => {
        const detailed = (resp as any)?.data?.data || (resp as any)?.data;
        if (detailed) {
          prefill(detailed);
        }
      })
      .catch((err) => {
        console.error('Failed to load full faculty details for edit', err);
      });
  };

  // Handle delete faculty
  const handleDeleteFaculty = (facultyId: string) => {
    if (window.confirm('Are you sure you want to delete this faculty member?')) {
      deleteFacultyMutation.mutate(facultyId, {
        onSuccess: () => {
          alert('Faculty deleted successfully');
        },
        onError: (err: any) => {
          const message = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete faculty';
          alert(message);
        },
      });
    }
  };

  // Handle modal close
  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingFaculty(null);
    reset();
  };

  const faculty = (facultyData?.data as any)?.faculty || (facultyData?.data as any)?.data || [];
  const departments = departmentsData?.data || [];

  return (
    <div className="page-container">
      <div className="content-container mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-neutral-100">Faculty Management</h1>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2"
              variant="secondary"
            >
              <ArrowUpTrayIcon className="h-5 w-5" />
              Import Faculty
            </Button>
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              Add Faculty
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="mb-4">
          <Input
            type="text"
            placeholder="Search faculty..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md input-glass"
          />
        </div>
      </div>

      {/* Faculty Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-lg shadow-lg overflow-hidden">
        {facultyLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200/50">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Designation
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Specialization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white/80 divide-y divide-neutral-200/50">
                {faculty && faculty.length > 0 ? (
                  faculty.map((facultyMember: any) => (
                    <tr key={facultyMember.faculty_id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {facultyMember.first_name?.[0]}{facultyMember.last_name?.[0]}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {facultyMember.first_name} {facultyMember.last_name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {facultyMember.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {facultyMember.department_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {facultyMember.designation || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {facultyMember.specialization || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditFaculty(facultyMember)}
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteFaculty(facultyMember.faculty_id)}
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
                      {facultyLoading ? 'Loading faculty...' : 'No faculty found. Add a new faculty member to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {(facultyData?.data as any)?.meta && (
          <div className="bg-white/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-t border-neutral-200/50 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPage(page - 1)}
                disabled={!(facultyData?.data as any).meta.hasPrev}
                className="relative inline-flex items-center px-4 py-2 border border-neutral-300/60 text-sm font-medium rounded-md text-neutral-700 bg-white/70 hover:bg-white/80 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={!(facultyData?.data as any).meta.hasNext}
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
                    {(page - 1) * 10 + 1}
                  </span>{' '}
                  to{' '}
                  <span className="font-medium">
                    {Math.min(page * 10, (facultyData?.data as any).meta.total)}
                  </span>{' '}
                  of{' '}
                  <span className="font-medium">{(facultyData?.data as any).meta.total}</span>{' '}
                  results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={!(facultyData?.data as any).meta.hasPrev}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={!(facultyData?.data as any).meta.hasNext}
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

      {/* Import Faculty Modal */}
      <Modal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setImportFile(null);
        }}
        title="Import Faculty via Excel"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Upload an Excel or CSV file. Column headings should match the faculty table; unknown columns are ignored. Duplicate primary keys or emails are skipped.
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
              disabled={!importFile || importFacultyMutation.isPending}
              onClick={() => {
                if (importFile) {
                  importFacultyMutation.mutate(importFile);
                }
              }}
            >
              {importFacultyMutation.isPending ? 'Importing...' : 'Import'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Faculty Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        title={editingFaculty ? 'Edit Faculty' : 'Add New Faculty'}
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <Input
                {...register('first_name')}
                type="text"
                className="mt-1"
                placeholder="John"
                error={errors.first_name?.message}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <Input
                {...register('last_name')}
                type="text"
                className="mt-1"
                placeholder="Doe"
                error={errors.last_name?.message}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email *
            </label>
            <Input
              {...register('email')}
              type="email"
              className="mt-1"
              placeholder="john.doe@university.edu"
              error={errors.email?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Phone
            </label>
            <Input
              {...register('phone')}
              type="tel"
              className="mt-1"
              placeholder="+1234567890"
              error={errors.phone?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Department *
            </label>
            <select
              {...register('department_id')}
              className="mt-1 select-field sm:text-sm"
            >
              <option className="text-neutral-900" value="">Select Department</option>
              {departments.map((dept: any) => (
                <option className="text-neutral-900" key={dept.department_id} value={dept.department_id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            {errors.department_id && (
              <p className="mt-1 text-sm text-red-600">{errors.department_id.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Designation
            </label>
            <Input
              {...register('designation')}
              type="text"
              className="mt-1"
              placeholder="Professor, Associate Professor, Assistant Professor"
              error={errors.designation?.message}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Specialization
            </label>
            <Input
              {...register('specialization')}
              type="text"
              className="mt-1"
              placeholder="Machine Learning, Database Systems, etc."
              error={errors.specialization?.message}
            />
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
              disabled={createFacultyMutation.isPending || updateFacultyMutation.isPending}
            >
              {editingFaculty ? 'Update Faculty' : 'Create Faculty'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default AdminFacultyManagement;