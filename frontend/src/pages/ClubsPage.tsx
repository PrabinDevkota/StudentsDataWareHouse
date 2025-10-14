import React from 'react';
import { useUser } from '../stores/auth.store';
import { useQuery } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { studentsApi } from '../api/students.api';
import { Users as UserGroupIcon } from 'lucide-react';

const formatDate = (date?: string | null) => {
  if (!date) return '—';
  const d = new Date(date);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
};

const ClubsPage: React.FC = () => {
  const user = useUser();

  // Only for STUDENT role
  if (user?.role !== 'STUDENT') {
    return <Navigate to="/dashboard" replace />;
  }

  const studentId = user?.profile_ref_id || '';

  const { data: student, isLoading, isError } = useQuery({
    queryKey: ['studentClubs', studentId],
    queryFn: () => studentsApi.getStudentById(studentId).then(res => res.data.data),
    enabled: !!studentId,
  });

  const memberships = (student as any)?.club_memberships || [];

  return (
    <div className="page-container">
      <div className="content-container">
      <div className="mb-6 flex items-center">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
          <UserGroupIcon className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-neutral-100">Your Clubs</h1>
          <p className="text-sm text-neutral-300">Clubs you are a member of</p>
        </div>
      </div>
      </div>

      <div className="card-glass p-6">
        {isLoading && <div>Loading your club memberships...</div>}
        {isError && <div className="text-error-600">Failed to load clubs</div>}
        {!isLoading && memberships.length === 0 && (
          <div className="text-neutral-300">You are not a member of any club yet.</div>
        )}
        {!isLoading && memberships.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {memberships.map((m: any, idx: number) => (
              <div key={m.club_id || idx} className="border border-neutral-200 rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-white text-lg">{m.club_name}</h3>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${m.is_active ? 'bg-success-100 text-success-800 border border-success-300' : 'bg-neutral-100 text-neutral-800 border border-neutral-300'}`}>
                    {m.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-neutral-500 mb-3">Role: {m.role || 'Member'}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-neutral-400">Joined: {formatDate(m.start_date)}</p>
                    {m.end_date && <p className="text-neutral-400">Left: {formatDate(m.end_date)}</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClubsPage;
