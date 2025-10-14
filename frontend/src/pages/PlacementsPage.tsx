import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { placementsApi } from '../api/placements.api';
import { queryKeys } from '../lib/react-query';
import { studentsApi } from '../api/students.api';
import { useUser } from '../stores/auth.store';
import StudentFiltersPanel from '../components/students/StudentFiltersPanel';
import type { StudentFilters } from '../types/student.types';

interface CompanyFormState {
  name: string;
  description?: string;
  website?: string;
  industry?: string;
  size?: string;
  location?: string;
}

interface JobRoleFormState {
  title: string;
  role_type?: 'FULL_TIME' | 'INTERNSHIP';
  description?: string;
  requirements?: string;
  salary_range?: string;
  location?: string;
  is_active?: boolean;
}

const PlacementsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const currentUser = useUser();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [companyForm, setCompanyForm] = useState<CompanyFormState>({ name: '' });
  const [editingCompanyId, setEditingCompanyId] = useState<string | null>(null);
  const [jobRoleForm, setJobRoleForm] = useState<JobRoleFormState>({ title: '', is_active: true });
  const [editingJobRoleId, setEditingJobRoleId] = useState<string | null>(null);
  const [offerInputs, setOfferInputs] = useState<Record<string, { studentId: string; offerType: '' | 'FULL_TIME' | 'INTERNSHIP' | 'SUGGEST' }>>({});
  const [studentSearch, setStudentSearch] = useState<Record<string, { q: string; results: any[]; loading?: boolean; error?: string }>>({});
  const [newRoleTitle, setNewRoleTitle] = useState<string>('');
  const [newRoleType, setNewRoleType] = useState<'' | 'FULL_TIME' | 'INTERNSHIP'>('');

  // Bulk Suggestions state
  const [bulkFilters, setBulkFilters] = useState<StudentFilters>({ q: '', page: 1, limit: 10, sort: 'first_name', order: 'ASC' });
  const [bulkShowAdvanced, setBulkShowAdvanced] = useState<boolean>(false);
  const [bulkResults, setBulkResults] = useState<any[]>([]);
  const [bulkMeta, setBulkMeta] = useState<any>(null);
  const [bulkSelected, setBulkSelected] = useState<Record<string, boolean>>({});
  const [bulkJobRoleId, setBulkJobRoleId] = useState<string>('');
  // Note field removed

  // Companies list
  const { data: companiesResp, isLoading: companiesLoading } = useQuery({
    queryKey: queryKeys.companies.lists(),
    queryFn: () => placementsApi.getCompanies(),
  });

  const companies = useMemo(() => {
    // Backend shape: { success, data: { companies: Company[], meta } }
    return companiesResp?.data?.data?.companies ?? [];
  }, [companiesResp]);

  // Job roles for selected company
  const { data: jobRolesResp, isLoading: jobRolesLoading } = useQuery({
    queryKey: queryKeys.companies.detail(selectedCompanyId || 'none'),
    queryFn: () => (selectedCompanyId ? placementsApi.getCompanyById(selectedCompanyId) : Promise.resolve({ data: { data: { job_roles: [] } } } as any)),
    enabled: !!selectedCompanyId,
  });

  const jobRoles = useMemo(() => jobRolesResp?.data?.data?.job_roles ?? [], [jobRolesResp]);

  // Mutations: Companies
  const createCompany = useMutation({
    mutationFn: () => {
      const raw = { ...companyForm } as any;
      const payload: any = {};
      Object.entries(raw).forEach(([k, v]) => {
        if (typeof v === 'string') {
          const t = v.trim();
          if (t && t !== '-') payload[k] = t;
        } else if (v !== undefined && v !== null) {
          payload[k] = v;
        }
      });
      return placementsApi.createCompany(payload);
    },
    onSuccess: () => {
      alert('Company created');
      setCompanyForm({ name: '' });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create company');
    },
  });

  const updateCompany = useMutation({
    mutationFn: () => {
      const raw = { ...companyForm } as any;
      const payload: any = {};
      Object.entries(raw).forEach(([k, v]) => {
        if (typeof v === 'string') {
          const t = v.trim();
          if (t && t !== '-') payload[k] = t;
        } else if (v !== undefined && v !== null) {
          payload[k] = v;
        }
      });
      return placementsApi.updateCompany(String(editingCompanyId), payload);
    },
    onSuccess: () => {
      alert('Company updated');
      setEditingCompanyId(null);
      setCompanyForm({ name: '' });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      if (selectedCompanyId) queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(selectedCompanyId) });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update company');
    },
  });

  const deleteCompany = useMutation({
    mutationFn: (id: string) => placementsApi.deleteCompany(id),
    onSuccess: () => {
      alert('Company deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.lists() });
      if (selectedCompanyId) {
        setSelectedCompanyId('');
      }
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete company');
    },
  });

  // Mutations: Job Roles
  const createJobRole = useMutation({
    mutationFn: () => placementsApi.createJobRole(String(selectedCompanyId), jobRoleForm),
    onSuccess: () => {
      alert('Job role created');
      setJobRoleForm({ title: '', is_active: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(String(selectedCompanyId)) });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to create job role');
    },
  });

  const updateJobRole = useMutation({
    mutationFn: () => placementsApi.updateJobRole(String(selectedCompanyId), String(editingJobRoleId), jobRoleForm),
    onSuccess: () => {
      alert('Job role updated');
      setEditingJobRoleId(null);
      setJobRoleForm({ title: '', is_active: true });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(String(selectedCompanyId)) });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to update job role');
    },
  });

  const deleteJobRole = useMutation({
    mutationFn: (jobRoleId: string) => placementsApi.deleteJobRole(String(selectedCompanyId), jobRoleId),
    onSuccess: () => {
      alert('Job role deleted');
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(String(selectedCompanyId)) });
    },
    onError: (err: any) => {
      alert(err?.response?.data?.message || err?.response?.data?.error || 'Failed to delete job role');
    },
  });

  // Mutation: Set offer type for a student on a job role
  const setOfferForStudent = useMutation({
    mutationFn: async ({ jobRoleId, studentId, offerType }: { jobRoleId: string; studentId: string; offerType: 'FULL_TIME' | 'INTERNSHIP' | 'SUGGEST' }) => {
      if (!selectedCompanyId) throw new Error('Select a company first');
      const isValidUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
      const isValidStudentId = (v: string) => /^[A-Za-z0-9._-]{4,100}$/.test(v);
      const today = new Date().toISOString().slice(0, 10);
      if (offerType === 'SUGGEST') {
        // Create placement invitation instead of setting an offer
        if (!isValidStudentId(studentId)) {
          throw new Error('Invalid student ID format. Use letters, numbers, dot, hyphen, underscore (e.g., BL.SC.U4CSE24072).');
        }
        if (jobRoleId && !isValidUuid(jobRoleId)) {
          throw new Error('Invalid job role ID format. Expecting a UUID.');
        }
        const { placementInvitationsApi } = await import('../api/placementInvitations.api');
        await placementInvitationsApi.createInvitation(selectedCompanyId, studentId, jobRoleId);
        return;
      }

      // Check for existing placement for this student and job role
      const resp = await placementsApi.getPlacements({ student_id: studentId, company_id: selectedCompanyId, job_role_id: jobRoleId });
      const existing = (resp as any)?.data?.data?.placements?.[0];

      if (existing?.placement_id) {
        await placementsApi.updatePlacementStatus(existing.placement_id, 'OFFERED', { offerType: offerType as any, offeredDate: today });
      } else {
        await placementsApi.createPlacement({
          company_id: selectedCompanyId,
          job_role_id: jobRoleId,
          student_id: studentId,
          status: 'OFFERED',
          offered_date: today,
          offer_type: offerType as any,
        });
      }
    },
    onSuccess: () => {
      alert('Action completed');
      // Invalidate any relevant queries if needed
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to set offer';
      console.error('Set Offer error:', { status, data, err });
      try {
        alert(`${message}\n\nStatus: ${status ?? 'n/a'}\nDetails: ${data ? JSON.stringify(data) : 'n/a'}`);
      } catch (_) {
        alert(message);
      }
    },
  });

  // Search students by query per job role
  const searchStudents = useMutation({
    mutationFn: async ({ jobRoleId }: { jobRoleId: string }) => {
      const q = studentSearch[jobRoleId]?.q || '';
      setStudentSearch((s) => ({
        ...s,
        [jobRoleId]: { ...(s[jobRoleId] || { q: '' }), results: [], loading: true, error: '' },
      }));
      const resp = await studentsApi.getStudents({ q, limit: 10 });
      return { jobRoleId, resp };
    },
    onSuccess: ({ jobRoleId, resp }: any) => {
      const results = resp?.data?.data?.students || [];
      setStudentSearch((s) => ({
        ...s,
        [jobRoleId]: { ...(s[jobRoleId] || { q: '' }), results, loading: false, error: '' },
      }));
    },
    onError: (error: any, { jobRoleId }: any) => {
      const message = error?.response?.data?.error || error?.message || 'Search failed';
      setStudentSearch((s) => ({
        ...s,
        [jobRoleId]: { ...(s[jobRoleId] || { q: '' }), results: [], loading: false, error: message },
      }));
    },
  });

  // Bulk search using filters
  const bulkSearch = useMutation({
    mutationFn: async (overrideFilters?: StudentFilters) => {
      const filtersToUse = overrideFilters || bulkFilters;
      const resp = await studentsApi.getStudents(filtersToUse);
      return resp;
    },
    onSuccess: (resp: any) => {
      const data = resp?.data?.data || {};
      const list = data.students || [];
      setBulkResults(list);
      setBulkMeta(data.meta || null);
    },
    onError: (error: any) => {
      const message = error?.response?.data?.error || error?.message || 'Search failed';
      alert(message);
    },
  });

  const bulkSuggest = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId) throw new Error('Select a company first');
      // Sanitize selected IDs (trim, remove empties, normalize casing)
      const ids = Object.keys(bulkSelected)
        .filter(id => bulkSelected[id])
        .map(id => id.trim())
        .filter(id => id.length >= 4);
      if (ids.length === 0) throw new Error('Select at least one student');
      const payload: any = { student_ids: ids };
      if (bulkJobRoleId) payload.job_role_id = bulkJobRoleId;
      // note removed
      try {
        const resp = await placementsApi.bulkSuggestStudents(selectedCompanyId, payload);
        // If backend reports zero successes, attempt per-student fallback to ensure delivery
        const result: any = resp?.data?.data || {};
        const successCount = result.successCount || 0;
        const errorCount = result.errorCount || 0;
        if (successCount === 0 && errorCount >= ids.length) {
          let sc = 0;
          let ec = 0;
          const results: any[] = [];
          for (const studentId of ids) {
            try {
              await placementsApi.suggestStudent(selectedCompanyId, {
                student_id: studentId,
                job_role_id: bulkJobRoleId || undefined,
              });
              sc += 1;
              results.push({ student_id: studentId, success: true });
            } catch (e: any) {
              ec += 1;
              const emsg = e?.response?.data?.error || e?.message || 'Failed';
              results.push({ student_id: studentId, success: false, error: emsg });
            }
          }
          return { data: { data: { successCount: sc, errorCount: ec, results, fallback: true } } } as any;
        }
        return resp;
      } catch (err: any) {
        const status = err?.response?.status;
        const code = err?.response?.data?.code;
        if (status === 404 && code === 'ENDPOINT_NOT_FOUND') {
          let successCount = 0;
          let errorCount = 0;
          const results: any[] = [];
          for (const studentId of ids) {
            try {
              await placementsApi.suggestStudent(selectedCompanyId, {
                student_id: studentId,
                job_role_id: bulkJobRoleId || undefined,
                // note removed
              });
              successCount += 1;
              results.push({ student_id: studentId, success: true });
            } catch (e: any) {
              errorCount += 1;
              const emsg = e?.response?.data?.error || e?.message || 'Failed';
              results.push({ student_id: studentId, success: false, error: emsg });
            }
          }
          return { data: { data: { successCount, errorCount, results, fallback: true } } } as any;
        }
        throw err;
      }
    },
    onSuccess: (resp: any) => {
      const result: any = resp?.data?.data || {};
      const successCount = result.successCount || 0;
      const errorCount = result.errorCount || 0;
      const usedFallback = !!result.fallback;
      if (usedFallback) {
        alert(`Sent individually and success: ${successCount}`);
      } else {
        alert(`Success: ${successCount}, Errors: ${errorCount}`);
      }
      setBulkSelected({});
    },
    onError: (err: any) => {
      const status = err?.response?.status;
      const data = err?.response?.data;
      const message = err?.response?.data?.message || err?.response?.data?.error || err?.message || 'Failed to send suggestions';
      console.error('Bulk Suggest error:', { status, data, err });
      try {
        alert(`${message}\n\nStatus: ${status ?? 'n/a'}\nDetails: ${data ? JSON.stringify(data) : 'n/a'}`);
      } catch (_) {
        alert(message);
      }
    },
  });

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Placements</h1>
          <p className="mt-1 text-sm text-neutral-300">Manage companies</p>
        </div>
        </div>

      {/* Companies Management */}
      <div className="card-glass p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Companies</h2>
          {(currentUser?.role === 'CIR' || currentUser?.role === 'ADMIN') && (
            <div className="flex items-center space-x-2">
              <input
                className="border rounded px-3 py-2 text-sm text-black placeholder-neutral-500 bg-white"
                placeholder="Company name"
                value={companyForm.name}
                onChange={(e) => setCompanyForm((f) => ({ ...f, name: e.target.value }))}
              />
              <input
                className="border rounded px-3 py-2 text-sm text-black placeholder-neutral-500 bg-white"
                placeholder="Website"
                value={companyForm.website || ''}
                onChange={(e) => setCompanyForm((f) => ({ ...f, website: e.target.value }))}
              />
              <input
                className="border rounded px-3 py-2 text-sm text-black placeholder-neutral-500 bg-white"
                placeholder="Industry"
                value={companyForm.industry || ''}
                onChange={(e) => setCompanyForm((f) => ({ ...f, industry: e.target.value }))}
              />
              {editingCompanyId ? (
                <button
                  className="px-3 py-2 text-sm bg-primary-600 text-white rounded"
                  onClick={() => updateCompany.mutate()}
                  disabled={!companyForm.name}
                >
                  Save
                </button>
              ) : (
                <button
                  className="px-3 py-2 text-sm bg-primary-600 text-white rounded"
                  onClick={() => createCompany.mutate()}
                  disabled={!companyForm.name}
                >
                  Add Company
                </button>
              )}
            </div>
          )}
        </div>

        {(currentUser?.role === 'CIR' || currentUser?.role === 'ADMIN') && editingCompanyId && selectedCompanyId === editingCompanyId && (
          <div className="mt-4 border-t pt-4">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-6">
                <h3 className="text-md font-semibold text-white mb-2">Job Roles</h3>
                {jobRolesLoading ? (
                  <p className="text-sm text-neutral-300">Loading job roles...</p>
                ) : jobRoles && jobRoles.length > 0 ? (
                  <div className="space-y-2">
                    {jobRoles.map((jr: any) => (
                      <div key={jr.job_role_id} className="flex items-center justify-between border border-neutral-700 rounded px-2 py-1 bg-neutral-900/60">
                        <div>
                          <div className="text-sm font-medium text-white">{jr.title}</div>
                          <div className="text-xs text-neutral-400">{jr.role_type || 'ROLE'}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            className="px-2 py-1 text-xs bg-error-600/20 text-error-400 rounded"
                            onClick={() => deleteJobRole.mutate(jr.job_role_id)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-neutral-300">No job roles yet.</p>
                )}

                <div className="mt-3 flex items-center space-x-2">
                  <input
                    className="border rounded px-3 py-2 text-sm text-black bg-white placeholder-neutral-500"
                    placeholder="New role title"
                    value={newRoleTitle}
                    onChange={(e) => setNewRoleTitle(e.target.value)}
                  />
                  <select
                    className="border rounded px-2 py-2 text-sm text-black bg-white"
                    value={newRoleType}
                    onChange={(e) => setNewRoleType(e.target.value as any)}
                  >
                    <option className="text-black" value="">Type</option>
                    <option className="text-black" value="FULL_TIME">Full-time</option>
                    <option className="text-black" value="INTERNSHIP">Internship</option>
                  </select>
                  <button
                    className="px-3 py-2 text-sm bg-black text-white rounded"
                    onClick={async () => {
                      const title = newRoleTitle.trim();
                      const role_type = newRoleType || undefined;
                      if (!title) return alert('Enter role title');
                      await placementsApi.createJobRole(String(editingCompanyId || selectedCompanyId), { title, role_type } as any);
                      queryClient.invalidateQueries({ queryKey: queryKeys.companies.detail(String(selectedCompanyId)) });
                      setNewRoleTitle('');
                      setNewRoleType('');
                    }}
                  >
                    Add Role
                  </button>
                </div>
              </div>

              <div className="w-64">
                <h3 className="text-md font-semibold text-white mb-2">Placements Offered</h3>
                {jobRolesLoading ? (
                  <p className="text-sm text-neutral-300">Loading...</p>
                ) : (
                  (() => {
                    const companyDetails: any = jobRolesResp?.data?.data || {};
                    return (
                      <div className="space-y-2">
                        <div className="text-sm">
                          <div className="text-neutral-400">Total placements</div>
                          <div className="text-xl font-semibold text-white">{companyDetails.total_placements ?? 0}</div>
                        </div>
                        <div className="text-sm">
                          <div className="text-neutral-400">Accepted placements</div>
                          <div className="text-xl font-semibold text-white">{companyDetails.accepted_placements ?? 0}</div>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </div>
        )}

        {companiesLoading ? (
          <p className="text-neutral-300">Loading companies...</p>
        ) : (
          <table className="min-w-full divide-y divide-neutral-700">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Website</th>
                <th className="px-3 py-2" />
              </tr>
            </thead>
            <tbody className="bg-neutral-900/60 divide-y divide-neutral-700">
              {companies.map((c: any) => (
                <tr key={c.company_id} className={selectedCompanyId === c.company_id ? 'bg-primary-900/20' : ''}>
                  <td className="px-3 py-2 text-sm text-white cursor-pointer" onClick={() => setSelectedCompanyId(c.company_id)}>
                    {c.name}
                  </td>
                  <td className="px-3 py-2 text-sm text-primary-300">
                    {c.website || '-'}
                  </td>
                  <td className="px-3 py-2 text-right space-x-2">
                    {(currentUser?.role === 'CIR' || currentUser?.role === 'ADMIN') && (
                      <>
                    <button
                          className="px-2 py-1 text-xs bg-neutral-800 text-neutral-100 rounded"
                          onClick={() => {
                            setEditingCompanyId(c.company_id);
                            setSelectedCompanyId(c.company_id);
                            setCompanyForm({
                              name: c.name,
                              description: c.description,
                              website: c.website,
                              industry: c.industry,
                              size: c.size,
                              location: c.location,
                            });
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="px-2 py-1 text-xs bg-error-600/20 text-error-400 rounded"
                          onClick={() => deleteCompany.mutate(c.company_id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Company Details */}
      {selectedCompanyId && (
        <div className="card-glass p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Company Details</h2>
          {jobRolesLoading ? (
            <p className="text-neutral-300">Loading details...</p>
          ) : (
            (() => {
              const companyDetails: any = jobRolesResp?.data?.data || {};
              return (
                <div className="space-y-3">
                  <div className="text-sm text-neutral-300">
                    <span className="font-medium text-white">Name:</span> {companyDetails.name || '-'}
                  </div>
                  <div className="text-sm text-neutral-300">
                    <span className="font-medium text-white">Website:</span> {companyDetails.website || '-'}
                  </div>
                  <div className="text-sm text-neutral-300">
                    <span className="font-medium text-white">Industry:</span> {companyDetails.industry || '-'}
                  </div>
                  <div className="flex items-center space-x-6 pt-2">
                    <div className="text-sm">
                      <div className="text-neutral-400">Total placements</div>
                      <div className="text-xl font-semibold text-white">{companyDetails.total_placements ?? 0}</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-neutral-400">Accepted placements</div>
                      <div className="text-xl font-semibold text-white">{companyDetails.accepted_placements ?? 0}</div>
                    </div>
                  </div>

                  {(currentUser?.role === 'CIR' || currentUser?.role === 'ADMIN') && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-md font-semibold text-white mb-2">Offer Management</h3>
                      {jobRoles && jobRoles.length > 0 ? (
                        <div className="space-y-4">
                          {jobRoles.map((jr: any) => {
                            const oi = offerInputs[jr.job_role_id] || { studentId: '', offerType: '' };
                            const ss = studentSearch[jr.job_role_id] || { q: '', results: [], loading: false, error: '' };
                            return (
                              <div key={jr.job_role_id} className="border border-neutral-700 rounded-md p-3 bg-neutral-900/60">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-white">{jr.title}</div>
                                    {jr.role_type && (
                                      <div className="text-xs text-neutral-400">Role type: {jr.role_type}</div>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <select
                                      className="select-field text-sm"
                                      value={oi.offerType}
                                      onChange={(e) => setOfferInputs((s) => ({
                                        ...s,
                                        [jr.job_role_id]: { ...(s[jr.job_role_id] || { studentId: '' }), offerType: e.target.value as any },
                                      }))}
                                    >
                                      <option className="text-neutral-900" value="">Select offer type</option>
                                      <option className="text-neutral-900" value="FULL_TIME">Full-time</option>
                                      <option className="text-neutral-900" value="INTERNSHIP">Internship</option>
                                      <option className="text-neutral-900" value="SUGGEST">Suggest</option>
                                    </select>
                                    <button
                                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded"
                                      onClick={() => {
                                        const input = offerInputs[jr.job_role_id];
                                        if (!input?.studentId || !input?.offerType) {
                                          alert('Select student and offer type');
                                          return;
                                        }
                                        setOfferForStudent.mutate({ jobRoleId: jr.job_role_id, studentId: input.studentId, offerType: input.offerType as any });
                                      }}
                                      disabled={!oi.studentId || !oi.offerType || setOfferForStudent.isPending}
                                    >
                                      {setOfferForStudent.isPending ? 'Submitting...' : (oi.offerType === 'SUGGEST' ? 'Suggest' : 'Set Offer')}
                                    </button>
                                  </div>
                                </div>

                                <div className="mt-3 space-y-2">
                                  <div className="flex items-center space-x-2">
                                    <input
                                      className="border border-neutral-300 rounded px-2 py-1 text-sm flex-1 bg-white text-neutral-900 placeholder-neutral-500 shadow-sm"
                                      placeholder="Search student by name, ID or email"
                                      value={ss.q}
                                      onChange={(e) => setStudentSearch((s) => ({ ...s, [jr.job_role_id]: { ...(s[jr.job_role_id] || { results: [] }), q: e.target.value } }))}
                                    />
                                    <button
                                      className="px-3 py-1 text-sm bg-neutral-800 text-neutral-100 rounded"
                                      onClick={() => searchStudents.mutate({ jobRoleId: jr.job_role_id })}
                                    >
                                      {ss.loading ? 'Searching...' : 'Search'}
                                    </button>
                                  </div>
                                  {ss.error && <div className="text-xs text-error-600">{ss.error}</div>}
                                  {ss.results && ss.results.length > 0 && (
                                    <div className="max-h-40 overflow-auto border border-neutral-700 rounded bg-neutral-900/60">
                                      {ss.results.map((st: any) => (
                                        <div
                                          key={st.student_id}
                                          className={`px-2 py-1 text-sm cursor-pointer ${oi.studentId === st.student_id ? 'bg-primary-900/20' : ''}`}
                                          onClick={() => setOfferInputs((s) => ({ ...s, [jr.job_role_id]: { ...(s[jr.job_role_id] || { offerType: '' }), studentId: st.student_id } }))}
                                          title={`${st.first_name} ${st.last_name} — ${st.student_id}`}
                                        >
                                          <span className="text-white font-medium">{st.first_name} {st.last_name}</span>
                                          <span className="ml-2 text-neutral-400">({st.student_id})</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                  {oi.studentId && (
                                    <div className="text-xs text-neutral-400">Selected student: {oi.studentId}</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-sm text-neutral-300">No job roles found for this company.</p>
                      )}
                    </div>
                  )}
                  {(currentUser?.role === 'CIR' || currentUser?.role === 'ADMIN') && (
                    <div className="mt-6 border-t pt-4">
                      <h3 className="text-md font-semibold text-white mb-2">Bulk Suggestions</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <select
                            className="select-field text-sm"
                            value={bulkJobRoleId}
                            onChange={(e) => setBulkJobRoleId(e.target.value)}
                          >
                            <option className="text-neutral-900" value="">Select role (optional)</option>
                            {(jobRoles || []).map((jr: any) => (
                              <option className="text-neutral-900" key={jr.job_role_id} value={jr.job_role_id}>
                                {jr.title} {jr.role_type ? `(${jr.role_type})` : ''}
                              </option>
                            ))}
                          </select>
                          <button
                            className="px-3 py-1 text-sm bg-neutral-800 text-neutral-100 rounded"
                            onClick={() => setBulkShowAdvanced((v) => !v)}
                          >
                            {bulkShowAdvanced ? 'Hide Filters' : 'Advanced Filters'}
                          </button>
                        </div>

                        {bulkShowAdvanced && (
                          <StudentFiltersPanel
                            filters={bulkFilters}
                            onFiltersChange={(f) => {
                              const next = { ...bulkFilters, ...f, page: 1 } as StudentFilters;
                              setBulkFilters(next);
                              // Immediately fetch results with applied filters
                              bulkSearch.mutate(next);
                            }}
                            onClose={() => setBulkShowAdvanced(false)}
                          />
                        )}

                        <div className="flex items-center space-x-2">
                          <input
                            className="border border-neutral-700 rounded px-2 py-1 text-sm flex-1 bg-neutral-900/60 text-white placeholder-neutral-400"
                            placeholder="Search student by name, ID or email"
                            value={bulkFilters.q || ''}
                            onChange={(e) => setBulkFilters((f) => ({ ...f, q: e.target.value }))}
                          />
                          <button
                            className="px-3 py-1 text-sm bg-neutral-800 text-neutral-100 rounded"
                            onClick={() => bulkSearch.mutate(bulkFilters)}
                          >
                            {bulkSearch.isPending ? 'Searching...' : 'Search'}
                          </button>
                        </div>

                        {/* Results */}
                        {bulkResults && bulkResults.length > 0 ? (
                          <div className="border border-neutral-700 rounded bg-neutral-900/60">
                            <table className="min-w-full divide-y divide-neutral-700">
                              <thead>
                                <tr>
                                  <th className="px-3 py-2">
                                    <input
                                      type="checkbox"
                                      checked={bulkResults.every((st: any) => bulkSelected[st.student_id])}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        const next: Record<string, boolean> = { ...bulkSelected };
                                        bulkResults.forEach((st: any) => { next[st.student_id] = checked; });
                                        setBulkSelected(next);
                                      }}
                                    />
                                  </th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Name</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Student ID</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-neutral-400 uppercase tracking-wider">Department</th>
                                </tr>
                              </thead>
                              <tbody className="bg-neutral-900/60 divide-y divide-neutral-700">
                                {bulkResults.map((st: any) => (
                                  <tr key={st.student_id}>
                                    <td className="px-3 py-2">
                                      <input
                                        type="checkbox"
                                        checked={!!bulkSelected[st.student_id]}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          setBulkSelected((s) => ({ ...s, [st.student_id]: checked }));
                                        }}
                                      />
                                    </td>
                                    <td className="px-3 py-2 text-sm text-white">{st.first_name} {st.last_name}</td>
                                    <td className="px-3 py-2 text-sm text-white">{st.student_id}</td>
                                    <td className="px-3 py-2 text-sm text-white">{st.department_name || st.department_code || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <p className="text-sm text-neutral-300">No students found. Use search/filters to fetch.</p>
                        )}

                        {/* Suggestion message removed */}

                        <div className="flex items-center justify-between">
                          <div className="text-sm text-neutral-400">
                            Selected: {Object.keys(bulkSelected).filter(id => bulkSelected[id]).length}
                          </div>
                          <button
                            className="px-3 py-2 text-sm bg-primary-600 text-white rounded"
                            onClick={() => bulkSuggest.mutate()}
                            disabled={bulkSuggest.isPending || Object.keys(bulkSelected).filter(id => bulkSelected[id]).length === 0}
                          >
                            {bulkSuggest.isPending ? 'Sending...' : 'Send Suggestions'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                  </div>
                );
            })()
          )}
        </div>
      )}

    </div>
  );
};

export default PlacementsPage;
