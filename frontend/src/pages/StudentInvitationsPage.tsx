import React from 'react';
import { clsx } from 'clsx';
import { useUser } from '../stores/auth.store';
import { invitationsApi, type Invitation } from '../api/invitations.api';
import { placementInvitationsApi, type PlacementInvitation } from '../api/placementInvitations.api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Navigate } from 'react-router-dom';

const StudentInvitationsPage: React.FC = () => {
  const user = useUser();
  const queryClient = useQueryClient();

  // Only for STUDENT role
  if (user?.role !== 'STUDENT') {
    return <Navigate to="/dashboard" replace />;
  }

  const studentId = user?.profile_ref_id || '';

  // Track last seen timestamp for invitations (per-student)
  const storageKey = `sdw:lastSeenInvitations:${studentId}`;
  const [lastSeen, setLastSeen] = React.useState<number>(() => {
    const v = Number(localStorage.getItem(storageKey) || 0);
    return Number.isFinite(v) ? v : 0;
  });
  React.useEffect(() => {
    // Mark as visited now (after initial render)
    localStorage.setItem(storageKey, String(Date.now()));
    setLastSeen((prev) => prev); // keep current render's lastSeen for highlighting
  }, [storageKey]);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['studentInvitations', studentId],
    queryFn: async () => {
      const [club, placement] = await Promise.all([
        invitationsApi.getStudentInvitations(studentId),
        placementInvitationsApi.getStudentPlacementInvitations(studentId),
      ]);
      return { club, placement };
    },
    enabled: !!studentId,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ id, action, type }: { id: string; action: 'ACCEPT' | 'DECLINE'; type: 'CLUB' | 'PLACEMENT' }) => {
      if (type === 'PLACEMENT') {
        return placementInvitationsApi.respondInvitation(id, action);
      }
      return invitationsApi.respondInvitation(id, action);
    },
    onSuccess: (resp) => {
      // Refresh student's invitations
      queryClient.invalidateQueries({ queryKey: ['studentInvitations', studentId] });
      refetch();

      // Also refresh club-side invitations and members views
      const updatedInvite = (resp as any)?.data?.invite as Invitation | undefined;
      const clubId = updatedInvite?.club_id;
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: ['clubInvitations', clubId] });
        queryClient.invalidateQueries({ queryKey: ['clubWithMembers', clubId] });
      }
    },
  });

  // Delete club invitation (student/admin)
  const deleteClubMutation = useMutation({
    mutationFn: async ({ id }: { id: string; clubId?: string }) => {
      return invitationsApi.deleteInvitation(id);
    },
    onSuccess: (_resp, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentInvitations', studentId] });
      refetch();
      const clubId = (variables as any)?.clubId;
      if (clubId) {
        queryClient.invalidateQueries({ queryKey: ['clubInvitations', clubId] });
        queryClient.invalidateQueries({ queryKey: ['clubWithMembers', clubId] });
      }
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete invitation';
      alert(msg);
    },
  });

  // Delete placement suggestion (student/admin)
  const deletePlacementMutation = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return placementInvitationsApi.deleteInvitation(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studentInvitations', studentId] });
      refetch();
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete suggestion';
      alert(msg);
    },
  });

  type UnifiedInvite = (
    (Invitation & { type: 'CLUB' }) |
    (PlacementInvitation & { type: 'PLACEMENT' })
  );

  // Deduplicate placement invitations by id to avoid duplicate React keys
  const placementInvites: PlacementInvitation[] = React.useMemo(() => {
    const arr: PlacementInvitation[] = ((data as any)?.placement?.data) || [];
    const byId = new Map<string, PlacementInvitation>();
    // Let latest occurrence win to reflect most recent updates
    for (const inv of arr) {
      byId.set(inv.id, inv);
    }
    // Sort by updated_at (fallback to created_at) desc
    return Array.from(byId.values()).sort((a, b) => {
      const ta = new Date((a as any).updated_at || a.created_at).getTime();
      const tb = new Date((b as any).updated_at || b.created_at).getTime();
      return tb - ta;
    });
  }, [data]);

  // Deduplicate club invitations by id to avoid duplicate React keys
  const clubInvites: Invitation[] = React.useMemo(() => {
    const arr: Invitation[] = ((data as any)?.club?.data) || [];
    const byId = new Map<string, Invitation>();
    // Let latest occurrence win to reflect most recent updates
    for (const inv of arr) {
      byId.set(inv.id, inv);
    }
    // Sort by updated_at (fallback to created_at) desc
    return Array.from(byId.values()).sort((a, b) => {
      const ta = new Date((a as any).updated_at || a.created_at).getTime();
      const tb = new Date((b as any).updated_at || b.created_at).getTime();
      return tb - ta;
    });
  }, [data]);

  return (
    <div className="page-container">
      <div className="content-container">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-white">Student Invitations</h2>
        <p className="text-sm text-neutral-300">Review invitations (clubs and placement suggestions) and respond.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CIR Suggestions Column */}
        <div className="card-glass">
          <div className="p-4 border-b border-neutral-700">
            <h3 className="text-lg font-semibold text-white">CIR Suggestions</h3>
          </div>
          {isLoading && <div className="p-4 text-neutral-300">Loading suggestions...</div>}
          {isError && <div className="p-4 text-error-600">Failed to load suggestions</div>}
          {!isLoading && placementInvites.length === 0 && (
            <div className="p-4 text-neutral-300">No suggestions found.</div>
          )}
          <ul>
            {placementInvites.map((inv) => {
              const changedAt = new Date((inv as any).updated_at || inv.created_at).getTime();
              const isNew = changedAt > lastSeen;
              return (
              <li key={inv.id} className={clsx("p-4 border-t flex items-center justify-between", isNew ? "bg-accent-900/20" : "")}>
                <div>
                  <p className="font-medium text-white">Company: {(inv as any).company_name || (inv as any).company_id}</p>
                  {(inv as any).job_role_title && (
                    <p className="text-xs text-neutral-400">Role: {(inv as any).job_role_title}</p>
                  )}
                  <p className="text-sm text-neutral-400">Status: {inv.status}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400">
                    CIR suggested to look out for {(inv as any).company_name || (inv as any).company_id}
                    {(inv as any).job_role_title ? ` as  ${(inv as any).job_role_title}` : ''} because it aligns your interests, skills, achievements, and preferences.
                  </span>
                  {isNew && (
                    <span className="inline-flex items-center rounded-full bg-accent-500 text-white text-xs px-2 py-0.5">New</span>
                  )}
                  <span className="text-xs text-neutral-400">Updated: {new Date((inv as any).updated_at || inv.created_at).toLocaleString()}</span>
                  <button
                    className="ml-2 px-3 py-2 rounded-md bg-error-600 text-white hover:bg-error-700 text-xs"
                    disabled={deletePlacementMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this suggestion?')) {
                        deletePlacementMutation.mutate({ id: inv.id });
                      }
                    }}
                  >
                    {deletePlacementMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            );})}
          </ul>
        </div>

        {/* Club Invitations Column */}
        <div className="card-glass">
          <div className="p-4 border-b border-neutral-700">
            <h3 className="text-lg font-semibold text-white">Club Invitations</h3>
          </div>
          {!isLoading && clubInvites.length === 0 && (
            <div className="p-4 text-neutral-300">No club invitations found.</div>
          )}
          <ul>
            {clubInvites.map((inv) => {
              const changedAt = new Date((inv as any).updated_at || inv.created_at).getTime();
              const isNew = changedAt > lastSeen;
              return (
              <li key={inv.id} className={clsx("p-4 border-t flex items-center justify-between", isNew ? "bg-accent-900/20" : "")}>
                <div>
                  <p className="font-medium text-white">Club: {(inv as any).club_name || (inv as any).club_id}</p>
                  {(inv as any).club_category && (
                    <p className="text-xs text-neutral-400">Category: {(inv as any).club_category}</p>
                  )}
                  {(inv as any).club_description && (
                    <p className="text-xs text-neutral-400 mt-1">{(inv as any).club_description}</p>
                  )}
                  <p className="text-sm text-neutral-400">Status: {inv.status}</p>
                  {(inv as any).role && (
                    <p className="text-sm text-neutral-400">Role: {(inv as any).role}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {inv.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => respondMutation.mutate({ id: inv.id, action: 'ACCEPT', type: 'CLUB' })}
                        className="px-3 py-2 rounded-md bg-success-600 text-white hover:bg-success-700"
                        disabled={respondMutation.isPending}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondMutation.mutate({ id: inv.id, action: 'DECLINE', type: 'CLUB' })}
                        className="px-3 py-2 rounded-md bg-error-600 text-white hover:bg-error-700"
                        disabled={respondMutation.isPending}
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {isNew && (
                    <span className="inline-flex items-center rounded-full bg-accent-500 text-white text-xs px-2 py-0.5">New</span>
                  )}
                  <span className="text-xs text-neutral-400">Updated: {new Date((inv as any).updated_at || inv.created_at).toLocaleString()}</span>
                  <button
                    className="ml-2 px-3 py-2 rounded-md bg-error-600 text-white hover:bg-error-700 text-xs"
                    disabled={deleteClubMutation.isPending}
                    onClick={() => {
                      if (confirm('Delete this invitation?')) {
                        deleteClubMutation.mutate({ id: inv.id, clubId: (inv as any).club_id });
                      }
                    }}
                  >
                    {deleteClubMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </li>
            );})}
          </ul>
        </div>
      </div>
      </div>
    </div>
  );
};

export default StudentInvitationsPage;