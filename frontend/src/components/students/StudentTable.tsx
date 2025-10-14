import React from 'react';
import { clsx } from 'clsx';
import { Eye as EyeIcon, UserCircle as UserCircleIcon } from 'lucide-react';
// Define types locally to avoid import issues
interface Student {
  student_id: string;
  first_name: string;
  last_name: string;
  email: string;
  department_id: string;
  department_name: string;
  department_code: string;
  semester: number;
  cgpa: string | null; // Changed from number to string to match backend response
  research_experience: boolean;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
  skills?: any[];
  interests?: any[];
}
import Button from '../ui/Button';

interface StudentTableProps {
  students: Student[];
  onViewStudent: (studentId: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
}

const StudentTable: React.FC<StudentTableProps> = ({
  students,
  onViewStudent,
  pagination,
}) => {
  const formatCGPA = (cgpa: string | null) => {
    return cgpa ? parseFloat(cgpa).toFixed(2) : 'N/A';
  };

  // Attendance removed

  return (
    <div className="overflow-hidden bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-lg shadow-lg">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200/50">
          <thead className="bg-white/60">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Semester
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                CGPA
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Research
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white/80 divide-y divide-neutral-200/50">
            {students.map((student) => (
              <tr key={student.student_id} className="hover:bg-white/70">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10">
                      {student.avatar_path ? (
                        <img
                          className="h-10 w-10 rounded-full"
                          src={`http://localhost:4001${student.avatar_path}`}
                          alt={`${student.first_name} ${student.last_name}`}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <UserCircleIcon className="h-6 w-6 text-gray-600" />
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
                      <div className="text-sm text-gray-500">
                        {student.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{student.department_name}</div>
                  <div className="text-sm text-gray-500">{student.department_code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {student.semester}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCGPA(student.cgpa)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={clsx(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                    student.research_experience
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  )}>
                    {student.research_experience ? 'Yes' : 'No'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewStudent(student.student_id)}
                    leftIcon={<EyeIcon className="h-4 w-4" />}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-4 p-4">
        {students.map((student) => (
          <div key={student.student_id} className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-lg p-4 shadow">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0 h-12 w-12">
                  {student.avatar_path ? (
                    <img
                      className="h-12 w-12 rounded-full"
                      src={`http://localhost:4001${student.avatar_path}`}
                      alt={`${student.first_name} ${student.last_name}`}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center">
                      <UserCircleIcon className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                </div>
                <div className="ml-4">
                  <div className="text-lg font-medium text-gray-900">
                    {student.first_name} {student.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {student.student_id} • {student.department_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {student.email}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onViewStudent(student.student_id)}
                leftIcon={<EyeIcon className="h-4 w-4" />}
              >
                View
              </Button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Semester:</span>
                <span className="ml-1 font-medium">{student.semester}</span>
              </div>
              <div>
                <span className="text-gray-500">CGPA:</span>
                <span className="ml-1 font-medium">{formatCGPA(student.cgpa)}</span>
              </div>
              <div>
                {/* Attendance removed */}
              </div>
              <div>
                <span className="text-gray-500">Research:</span>
                <span className={clsx(
                  'ml-1 font-medium',
                  student.research_experience ? 'text-green-600' : 'text-gray-600'
                )}>
                  {student.research_experience ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="bg-white/80 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-t border-neutral-200/50 sm:px-6 rounded-b-lg">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {((pagination.currentPage - 1) * 20) + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.currentPage * 20, pagination.totalItems)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.totalItems}</span>{' '}
                results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                >
                  Previous
                </Button>
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={page === pagination.currentPage ? 'primary' : 'ghost'}
                      size="sm"
                      onClick={() => pagination.onPageChange(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                  disabled={pagination.currentPage === pagination.totalPages}
                >
                  Next
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentTable;
