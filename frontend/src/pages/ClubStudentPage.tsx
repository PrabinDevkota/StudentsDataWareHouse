import React, { useEffect, useMemo, useState } from 'react';
import { useUser } from '../stores/auth.store';
import { invitationsApi, type Invitation } from '../api/invitations.api';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';
import { clubsApi } from '../api/clubs.api';
import type { Club, ClubMember } from '../types/api';
import { studentsApi } from '../api/students.api';
import StudentFiltersPanel from '../components/students/StudentFiltersPanel';
import type { StudentFilters } from '../types/student.types';

const ClubStudentPage: React.FC = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const [studentId, setStudentId] = useState('');
  const [role, setRole] = useState('');
  // Bulk invite UI state
  const [bulkRole, setBulkRole] = useState('');
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState<StudentFilters>({ q: '', page: 1, limit: 25, sort: 'first_name', order: 'ASC' });
  const [hasSearched, setHasSearched] = useState(false);
  // Inline message box
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const showNotice = (type: 'success' | 'error' | 'info', text: string) => {
    setNotice({ type, text });
    // Auto-dismiss after 5s
    setTimeout(() => setNotice(null), 5000);
  };

  // Ensure only CLUB users access
  if (user?.role !== 'CLUB') {
    return <Navigate to="/dashboard" replace />;
  }

  const clubId = user?.profile_ref_id || '';

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['clubInvitations', clubId],
    queryFn: () => invitationsApi.getClubInvitations(clubId),
    enabled: !!clubId,
    // Periodically refresh to reflect student responses without manual reload
    refetchInterval: 5000,
  });

  // Fetch club details including members
  const { data: clubResp } = useQuery({
    queryKey: ['clubWithMembers', clubId],
    queryFn: () => clubsApi.getClubById(clubId).then(res => res.data.data as Club),
    enabled: !!clubId,
  });

  const createMutation = useMutation({
    mutationFn: () => invitationsApi.createInvitation(clubId, studentId.trim(), role.trim() || undefined),
    onSuccess: () => {
      setStudentId('');
      setRole('');
      queryClient.invalidateQueries({ queryKey: ['clubInvitations', clubId] });
      refetch();
      showNotice('success', 'Invitation sent successfully.');
    },
    onError: (err: any) => {
      const code = err?.response?.data?.code || '';
      const status = err?.response?.status;
      const friendly =
        code === 'ROUTE_NOT_FOUND'
          ? 'API endpoint not found (route misconfigured)'
          : status === 404
          ? 'Student not found'
          : status === 409
          ? 'Duplicate invitation already exists'
          : status === 400
          ? 'Invalid request: please check student_id and role'
          : undefined;
      const msg = friendly || err?.response?.data?.message || err?.response?.data?.error || 'Failed to create invitation';
      showNotice('error', msg);
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: ({ student_id }: { student_id: string }) => clubsApi.removeMember(clubId, student_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clubWithMembers', clubId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to remove member';
      alert(msg);
    },
  });

  const invitations: Invitation[] = data?.data || [];

  const members: ClubMember[] = (clubResp as any)?.members || [];

  const isExistingMember = useMemo(() => {
    const sid = studentId.trim();
    if (!sid) return false;
    return members.some(m => String(m.student_id) === sid && m.is_active);
  }, [studentId, members]);

  // Resolve student names for invitations
  const invitedStudentIds = useMemo(() => {
    const ids = invitations.map((inv) => inv.student_id).filter(Boolean);
    return Array.from(new Set(ids));
  }, [invitations]);

  const studentResults = useQueries({
    queries: invitedStudentIds.map((sid) => ({
      queryKey: ['studentDetailBasic', sid],
      queryFn: () => studentsApi.getStudentById(sid).then((res) => res.data.data),
      enabled: !!sid,
    })),
  });

  const studentNameById = useMemo(() => {
    const map: Record<string, string> = {};
    studentResults.forEach((q) => {
      const s = q.data as any;
      if (s?.student_id) {
        map[s.student_id] = `${s.first_name} ${s.last_name}`.trim();
      }
    });
    return map;
  }, [studentResults]);

  // Align client-side validation with backend: allow letters, numbers, dots, hyphens, underscores (4-100 chars)
  const isValidStudentId = (s: string) => {
    return /^[A-Za-z0-9._-]{4,100}$/.test(s);
  };

  const onInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const sid = studentId.trim();
    if (!sid) return;
    if (!isValidStudentId(sid)) {
      showNotice('error', 'Enter a valid student_id (letters, numbers, dot, hyphen, underscore)');
      return;
    }
    if (isExistingMember) return;
    createMutation.mutate();
  };

  // Determine if filters are meaningful to avoid loading all students by default
  const hasActiveFilters = useMemo(() => {
    const f = filters;
    return !!(
      f.q?.trim() ||
      (f as any).student_id ||
      f.skills ||
      f.interests ||
      f.min_cgpa !== undefined ||
      f.max_cgpa !== undefined ||
      f.semester !== undefined ||
      f.department_id ||
      f.research_experience !== undefined
    );
  }, [filters]);

  // Fetch students for bulk selection based on filters (only when searched)
  const { data: studentsResp, isFetching: isStudentsLoading, refetch: refetchStudents } = useQuery({
    queryKey: ['studentsForClubBulk', filters],
    queryFn: () => studentsApi.getStudents(filters).then((res) => res.data),
    enabled: false, // manual refetch to avoid loading all by default
  });

  const studentsForBulk = (studentsResp?.data?.students || []) as any[];

  const toggleSelect = (sid: string) => {
    setSelectedIds((prev) => ({ ...prev, [sid]: !prev[sid] }));
  };

  const selectAllVisible = () => {
    const next: Record<string, boolean> = { ...selectedIds };
    studentsForBulk.forEach((s: any) => {
      next[s.student_id] = true;
    });
    setSelectedIds(next);
  };

  const clearSelection = () => {
    setSelectedIds({});
  };

  // Bulk invite per-student with summary
  const bulkInviteMutation = useMutation({
    mutationFn: async () => {
      const ids = Object.keys(selectedIds).filter((k) => selectedIds[k]);
      const normalizedIds = ids
        .map((id) => id.trim())
        .filter((id) => isValidStudentId(id));

      let successCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;
      let errorCount = 0;

      for (const sid of normalizedIds) {
        try {
          await invitationsApi.createInvitation(clubId, sid, bulkRole.trim() || undefined);
          successCount += 1;
        } catch (err: any) {
          const status = err?.response?.status;
          const code = err?.response?.data?.code;
          if (status === 409 || code === 'DUPLICATE_INVITE') duplicateCount += 1;
          else if (status === 400 || code === 'VALIDATION_ERROR') invalidCount += 1;
          else if (status === 404 || code === 'NOT_FOUND') invalidCount += 1; // treat not found as invalid target
          else errorCount += 1;
        }
      }

      return { processed: normalizedIds.length, successCount, duplicateCount, invalidCount, errorCount };
    },
    onSuccess: (res) => {
      clearSelection();
      setBulkRole('');
      queryClient.invalidateQueries({ queryKey: ['clubInvitations', clubId] });
      const { processed, successCount, duplicateCount, invalidCount, errorCount } = res as any;
      showNotice(
        'success',
        `Processed ${processed}. Inserted ${successCount}. Duplicates ${duplicateCount}. Invalid ${invalidCount}. Other errors ${errorCount}.`
      );
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Bulk invite failed';
      showNotice('error', msg);
    },
  });

  return (
    <div className="page-container">
      <div className="content-container">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-neutral-100">Club-Student</h2>
        <p className="text-sm text-neutral-300">Invite students to your club and view invitation status.</p>
      </div>

      <form onSubmit={onInvite} className="flex items-center gap-3 mb-6">
        <input
          type="text"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          placeholder="Enter student_id (e.g., BL.SC.U4CSE24072)"
          className="flex-1 border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 placeholder:text-neutral-500 shadow-sm"
        />
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Assign role (e.g., Member)"
          className="w-56 border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 placeholder:text-neutral-500 shadow-sm"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
          disabled={createMutation.isPending || isExistingMember || !studentId.trim()}
        >
          {isExistingMember ? 'Already a member' : createMutation.isPending ? 'Inviting...' : 'Invite'}
        </button>
      </form>

      {/* Notice / Message Box */}
      {notice && (
        <div
          className={`mb-4 p-3 rounded-md border text-sm ${
            notice.type === 'success'
              ? 'bg-green-50 border-green-200 text-green-800'
              : notice.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Bulk Invite Section */}
      <div className="card-glass mb-6">
        <div className="p-4 border-b border-neutral-700">
          <h3 className="text-lg font-semibold text-white">Bulk Invite Students</h3>
          <p className="text-sm text-neutral-300">Filter students, select multiple, and send invitations in bulk.</p>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={filters.q || ''}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
              placeholder="Search name, email, or student_id"
              className="flex-1 border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 placeholder:text-neutral-500 shadow-sm"
            />
            <input
              type="text"
              value={bulkRole}
              onChange={(e) => setBulkRole(e.target.value)}
              placeholder="Assign role (optional)"
              className="w-56 border border-neutral-300 rounded-md px-3 py-2 bg-white text-neutral-900 placeholder:text-neutral-500 shadow-sm"
            />
            <button
              type="button"
              className="px-3 py-2 rounded-md bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700"
              onClick={() => setShowAdvanced((s) => !s)}
            >
              {showAdvanced ? 'Hide Advanced' : 'Advanced Filters'}
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700 border border-primary-700"
              onClick={() => {
                if (!hasActiveFilters && !(filters.q || '').trim()) {
                  showNotice('info', 'Add a search term or set filters to find students.');
                  return;
                }
                setHasSearched(true);
                refetchStudents();
              }}
            >
              Search Students
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-md bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700"
              onClick={selectAllVisible}
              disabled={isStudentsLoading || studentsForBulk.length === 0}
            >
              Select All Visible
            </button>
            <button
              type="button"
              className="px-3 py-2 rounded-md bg-neutral-800 text-neutral-100 hover:bg-neutral-700 border border-neutral-700"
              onClick={clearSelection}
            >
              Clear Selection
            </button>
          </div>

          {showAdvanced && (
            <StudentFiltersPanel
              filters={filters}
              onFiltersChange={(partial) => {
                // Apply incoming filters and immediately fetch results
                setFilters((f) => ({ ...f, ...partial, page: 1 }));
                // Mark as searched to show results list
                setHasSearched(true);
                // Trigger refetch with the latest filters
                setTimeout(() => refetchStudents(), 0);
              }}
              onClose={() => setShowAdvanced(false)}
            />
          )}

          <div className="border border-neutral-700 rounded-md bg-neutral-900/60">
            {!hasSearched && (
              <div className="p-3 text-neutral-300">Use search and filters above to load students.</div>
            )}
            {isStudentsLoading && <div className="p-3">Loading students...</div>}
            {!isStudentsLoading && hasSearched && studentsForBulk.length === 0 && (
              <div className="p-3 text-neutral-300">No students match the filters.</div>
            )}
            {!isStudentsLoading && studentsForBulk.length > 0 && (
              <ul>
                {studentsForBulk.map((s: any) => (
                  <li key={s.student_id} className="p-3 border-t border-neutral-700 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={!!selectedIds[s.student_id]}
                        onChange={() => toggleSelect(s.student_id)}
                      />
                      <div>
                        <p className="font-medium text-white">{s.first_name} {s.last_name} ({s.student_id})</p>
                        <p className="text-sm text-neutral-300">{s.email} • Dept: {s.department_code} • Sem: {s.semester} • CGPA: {s.cgpa ?? '-'}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-300">Selected: {Object.keys(selectedIds).filter((k) => selectedIds[k]).length}</div>
            <button
              type="button"
              className="px-4 py-2 rounded-md bg-primary-600 text-white hover:bg-primary-700"
              disabled={bulkInviteMutation.isPending || Object.keys(selectedIds).filter((k) => selectedIds[k]).length === 0}
              onClick={() => bulkInviteMutation.mutate()}
            >
              {bulkInviteMutation.isPending ? 'Inviting...' : 'Invite Selected'}
            </button>
          </div>
        </div>
      </div>

      <div className="card-glass">
        <div className="p-4 border-b border-neutral-700">
          <h3 className="text-lg font-semibold text-white">Invitations</h3>
        </div>
        {isLoading && <div className="p-4">Loading...</div>}
        {isError && <div className="p-4 text-error-600">Failed to load invitations</div>}
        {!isLoading && invitations.length === 0 && (
          <div className="p-4 text-neutral-300">No invitations yet.</div>
        )}
        <ul>
          {invitations.map((inv) => (
            <li key={inv.id} className="p-4 border-t border-neutral-700 flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Student: {studentNameById[inv.student_id] || inv.student_id}</p>
                <p className="text-sm text-neutral-300">Status: {inv.status}</p>
                {inv.role && (
                  <p className="text-sm text-neutral-300">Role: {inv.role}</p>
                )}
              </div>
              <div className="text-xs text-neutral-400">Created: {new Date(inv.created_at).toLocaleString()}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Members Section */}
      <div className="card-glass mt-6">
        <div className="p-4 border-b border-neutral-700">
          <h3 className="text-lg font-semibold text-white">Current Members</h3>
          <p className="text-sm text-neutral-300">Active club members with role and contact.</p>
        </div>
        {!clubResp && <div className="p-4">Loading members...</div>}
        {clubResp && members.length === 0 && (
          <div className="p-4 text-neutral-300">No active members yet.</div>
        )}
        {clubResp && members.length > 0 && (
          <ul>
            {members.filter(m => m.is_active).map((m) => (
              <li key={m.student_id} className="p-4 border-t border-neutral-700 flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{m.first_name} {m.last_name} ({m.student_id})</p>
                  <p className="text-sm text-neutral-300">Email: {m.email}</p>
                  <p className="text-sm text-neutral-300">Role: {m.role || 'Member'}</p>
                  <p className="text-xs text-neutral-400">Joined: {new Date(m.start_date).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-xs text-neutral-500">ID: {m.student_id}</div>
                  <button
                    className="px-3 py-1 rounded-md bg-error-600 text-white hover:bg-error-700 text-sm"
                    disabled={removeMemberMutation.isPending}
                    onClick={() => {
                      if (confirm(`Remove ${m.first_name} ${m.last_name} from the club?`)) {
                        removeMemberMutation.mutate({ student_id: String(m.student_id) });
                      }
                    }}
                  >
                    {removeMemberMutation.isPending ? 'Removing...' : 'Remove'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
    </div>
  );
};

export default ClubStudentPage;