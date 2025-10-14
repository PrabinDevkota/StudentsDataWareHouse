import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../stores/auth.store';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { facultyApi } from '../api/faculty.api';
import { researchApi } from '../api/research.api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import {
  User as UserIcon,
  GraduationCap as AcademicCapIcon,
  Briefcase as BriefcaseIcon,
  FlaskConical as BeakerIcon,
  CalendarDays as CalendarIcon,
  Phone as PhoneIcon,
  Mail as EnvelopeIcon,
  Building2 as BuildingOfficeIcon,
  FileText as DocumentTextIcon,
} from 'lucide-react';

const FacultyProfilePage: React.FC = () => {
  const user = useUser();
  const facultyId = user?.profile_ref_id;
  const queryClient = useQueryClient();

  const { data: facultyResp, isLoading } = useQuery({
    queryKey: ['faculty', facultyId],
    enabled: !!facultyId && user?.role === 'FACULTY',
    queryFn: async () => (await facultyApi.getFacultyById(facultyId as string)).data,
  });

  // Participants per project (lazy loaded when toggled)
  const [participantsByProject, setParticipantsByProject] = useState<Record<string, { expanded: boolean; loading: boolean; loaded: boolean; error?: string; data?: any[] }>>({});

  const toggleParticipants = async (projectId: string) => {
    setParticipantsByProject(prev => {
      const current = prev[projectId] || { expanded: false, loading: false, loaded: false };
      return { ...prev, [projectId]: { ...current, expanded: !current.expanded } };
    });

    const state = participantsByProject[projectId];
    if (!state?.loaded) {
      try {
        setParticipantsByProject(prev => ({
          ...prev,
          [projectId]: { ...(prev[projectId] || { expanded: true }), loading: true, error: undefined }
        }));
        const resp = await researchApi.getProjectById(projectId);
        const participants = resp?.data?.participants || [];
        setParticipantsByProject(prev => ({
          ...prev,
          [projectId]: { ...(prev[projectId] || { expanded: true }), loading: false, loaded: true, data: participants }
        }));
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to load participants';
        setParticipantsByProject(prev => ({
          ...prev,
          [projectId]: { ...(prev[projectId] || { expanded: true }), loading: false, loaded: false, error: msg }
        }));
      }
    }
  };
  
  const faculty = facultyResp?.data;

  // Project creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const createProjectMutation = useMutation({
    mutationFn: async () => {
      if (!facultyId) throw new Error('Missing faculty ID');
      return researchApi.createProject({
        title: title.trim(),
        description: description.trim() || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        faculty_id: facultyId,
      });
    },
    onSuccess: (res: any) => {
      alert(res?.message || 'Research project created successfully');
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || err?.response?.data?.error || 'Failed to create project';
      alert(msg);
    },
  });

  // Participant form state per project
  const [participantForms, setParticipantForms] = useState<Record<string, { student_id: string; role: string; start_date: string; end_date: string }>>({});

  const updateParticipantForm = (projectId: string, field: string, value: string) => {
    setParticipantForms(prev => ({
      ...prev,
      [projectId]: {
        student_id: prev[projectId]?.student_id || '',
        role: prev[projectId]?.role || '',
        start_date: prev[projectId]?.start_date || '',
        end_date: prev[projectId]?.end_date || '',
        [field]: value,
      },
    }));
  };

  const addParticipantMutation = useMutation({
    mutationFn: async ({ projectId }: { projectId: string }) => {
      const form = participantForms[projectId] || { student_id: '', role: '', start_date: '', end_date: '' };
      return researchApi.addParticipant(projectId, {
        student_id: form.student_id.trim(),
        role: form.role.trim() || undefined,
        start_date: form.start_date || undefined,
        end_date: form.end_date || undefined,
      });
    },
    onSuccess: (res: any, variables: any) => {
      alert(res?.message || 'Participant added successfully');
      setParticipantForms(prev => ({ ...prev, [variables.projectId]: { student_id: '', role: '', start_date: '', end_date: '' } }));
      queryClient.invalidateQueries({ queryKey: ['faculty', facultyId] });
    },
    onError: (err: any) => {
      const resp = err?.response?.data;
      let msg = resp?.error || 'Failed to add participant';
      if (resp?.code === 'FOREIGN_KEY_VIOLATION') {
        msg = 'Invalid student_id: no such student exists.';
      } else if (resp?.code === 'VALIDATION_ERROR' && Array.isArray(resp?.details)) {
        msg = resp.details.map((d: any) => `${d.field}: ${d.message}`).join('\n');
      }
      alert(msg);
    },
  });

  if (isLoading) return <LoadingSpinner className="h-64" />;

  if (!faculty) {
    return (
      <div className="text-center py-12">
        <p className="text-neutral-300">Faculty profile not found.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="page-container">
      <div className="content-container space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">My Profile</h1>
        <p className="mt-1 text-sm text-neutral-300">Your comprehensive faculty information</p>
      </div>

      {/* Personal Information */}
      <div className="card-glass p-6">
        <div className="flex items-center mb-6">
          <UserIcon className="h-6 w-6 text-white mr-2" />
          <h2 className="text-lg font-semibold text-white">Personal Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Full Name</h3>
            <p className="mt-1 text-sm text-white">{faculty.first_name} {faculty.last_name}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Faculty ID</h3>
            <p className="mt-1 text-sm text-white">{faculty.faculty_id}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Email</h3>
            <p className="mt-1 text-sm text-white flex items-center">
              <EnvelopeIcon className="h-4 w-4 mr-1 text-white" />
              {faculty.email}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Phone</h3>
            <p className="mt-1 text-sm text-white flex items-center">
              <PhoneIcon className="h-4 w-4 mr-1 text-white" />
              {faculty.phone || 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Member Since</h3>
            <p className="mt-1 text-sm text-white flex items-center">
              <CalendarIcon className="h-4 w-4 mr-1 text-white" />
              {formatDate(faculty.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Professional Information */}
      <div className="card-glass p-6">
        <div className="flex items-center mb-6">
          <AcademicCapIcon className="h-6 w-6 text-white mr-2" />
          <h2 className="text-lg font-semibold text-white">Professional Information</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Department</h3>
            <p className="mt-1 text-sm text-white flex items-center">
              <BuildingOfficeIcon className="h-4 w-4 mr-1 text-white" />
              {faculty.department?.name || faculty.department_name}
            </p>
            {(faculty.department?.code || faculty.department_code) && (
              <p className="text-xs text-neutral-400">({faculty.department?.code || faculty.department_code})</p>
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Designation</h3>
            <p className="mt-1 text-sm text-white flex items-center">
              <BriefcaseIcon className="h-4 w-4 mr-1 text-white" />
              {faculty.designation || 'N/A'}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-400">Specialization</h3>
            <p className="mt-1 text-sm text-white flex items-center">
              <BeakerIcon className="h-4 w-4 mr-1 text-white" />
              {faculty.specialization || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      {/* Research Projects - Add new project */}
      <div className="card-glass p-6">
        <div className="flex items-center mb-6">
          <BeakerIcon className="h-6 w-6 text-white mr-2" />
          <h2 className="text-lg font-semibold text-white">Research Projects</h2>
        </div>

        {/* Create Project Form */}
        <div className="border border-neutral-700 rounded-lg p-4 mb-6 bg-neutral-900/60">
          <h3 className="text-sm font-medium text-white mb-3">Add Research Project</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              placeholder="Project Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="Start Date (YYYY-MM-DD)"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Input
              placeholder="End Date (YYYY-MM-DD)"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="mt-4">
            <Button
              onClick={() => {
                if (!title.trim()) {
                  alert('Please enter a project title');
                  return;
                }
                createProjectMutation.mutate();
              }}
              disabled={createProjectMutation.isPending}
            >
              {createProjectMutation.isPending ? 'Adding...' : 'Add Project'}
            </Button>
          </div>
        </div>

        {/* Existing Projects List */}
        {faculty.research_projects && faculty.research_projects.length > 0 ? (
          <div className="space-y-4">
            {faculty.research_projects.map((project: any, index: number) => (
              <div key={project.project_id || index} className="border border-neutral-700 rounded-lg p-4 bg-neutral-900/60">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-white">{project.title}</h3>
                    {project.description && (
                      <p className="mt-1 text-sm text-neutral-300">{project.description}</p>
                    )}
                    <div className="mt-2 flex items-center space-x-4 text-xs text-neutral-400">
                      {project.start_date && (
                        <span>Started: {formatDate(project.start_date)}</span>
                      )}
                      {project.end_date && (
                        <span>Ended: {formatDate(project.end_date)}</span>
                      )}
                      <span>Participants: {project.participant_count ?? 0}</span>
                    </div>
                  </div>
                  {project.status && (
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      project.status === 'ACTIVE'
                        ? 'bg-green-900/20 text-green-300 border border-green-700'
                        : project.status === 'COMPLETED'
                        ? 'bg-blue-900/20 text-blue-300 border border-blue-700'
                        : 'bg-neutral-800 text-neutral-200 border border-neutral-700'
                    }`}>
                      {project.status}
                    </span>
                  )}
                </div>

                {/* Add Participant Form */}
                {project.project_id && (
                  <div className="mt-4 border-t border-neutral-700 pt-4">
                    <h4 className="text-xs font-semibold text-white mb-2">Add Participant</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <Input
                        placeholder="Student ID (e.g., BL.SC.U4CSE24072)"
                        value={participantForms[project.project_id]?.student_id || ''}
                        onChange={(e) => updateParticipantForm(project.project_id, 'student_id', e.target.value)}
                      />
                      <Input
                        placeholder="Role (optional)"
                        value={participantForms[project.project_id]?.role || ''}
                        onChange={(e) => updateParticipantForm(project.project_id, 'role', e.target.value)}
                      />
                      <Input
                        placeholder="Start Date (YYYY-MM-DD)"
                        value={participantForms[project.project_id]?.start_date || ''}
                        onChange={(e) => updateParticipantForm(project.project_id, 'start_date', e.target.value)}
                      />
                      <Input
                        placeholder="End Date (YYYY-MM-DD)"
                        value={participantForms[project.project_id]?.end_date || ''}
                        onChange={(e) => updateParticipantForm(project.project_id, 'end_date', e.target.value)}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Button
                        onClick={() => {
                          const form = participantForms[project.project_id];
                          if (!form?.student_id?.trim()) {
                            alert('Please enter a valid student ID');
                            return;
                          }
                          addParticipantMutation.mutate({ projectId: project.project_id });
                        }}
                        disabled={addParticipantMutation.isPending}
                      >
                        {addParticipantMutation.isPending ? 'Adding...' : 'Add Participant'}
                      </Button>

                      <Button
                        variant="ghost"
                        onClick={() => toggleParticipants(project.project_id)}
                      >
                        {participantsByProject[project.project_id]?.expanded ? 'Hide Participants' : 'View Participants'}
                      </Button>
                    </div>
                    {participantsByProject[project.project_id]?.expanded && (
                      <div className="mt-4 border border-neutral-700 rounded-lg bg-neutral-900/60">
                        {participantsByProject[project.project_id]?.loading ? (
                          <div className="p-3 text-center text-neutral-300">Loading participants...</div>
                        ) : participantsByProject[project.project_id]?.error ? (
                          <div className="p-3 text-center text-red-300">{participantsByProject[project.project_id]?.error}</div>
                        ) : (
                          <div className="divide-y divide-neutral-700">
                            {(participantsByProject[project.project_id]?.data || []).length === 0 ? (
                              <div className="p-3 text-center text-neutral-300">No participants yet.</div>
                            ) : (
                              (participantsByProject[project.project_id]?.data || []).map((p: any) => (
                                <div key={`${p.student_id}-${p.start_date || ''}`} className="p-3 grid grid-cols-1 md:grid-cols-4 gap-3">
                                  <div>
                                    <div className="text-white text-sm font-medium">{p.first_name} {p.last_name}</div>
                                    <div className="text-xs text-neutral-400">{p.student_id}</div>
                                  </div>
                                  <div className="text-sm text-neutral-300">Role: {p.role || 'N/A'}</div>
                                  <div className="text-sm text-neutral-300">Start: {formatDate(p.start_date)}</div>
                                  <div className="text-sm text-neutral-300">End: {formatDate(p.end_date)}</div>
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-300">No research projects yet.</p>
        )}
      </div>

      {/* Department Information */}
      {faculty.department && (
        <div className="card-glass p-6">
          <div className="flex items-center mb-6">
            <BuildingOfficeIcon className="h-6 w-6 text-white mr-2" />
            <h2 className="text-lg font-semibold text-white">Department Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-neutral-400">Department Name</h3>
              <p className="mt-1 text-sm text-white">{faculty.department.name}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-neutral-400">Department Code</h3>
              <p className="mt-1 text-sm text-white">{faculty.department.code}</p>
            </div>
            {faculty.department.description && (
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium text-neutral-400">Description</h3>
                <p className="mt-1 text-sm text-neutral-300">{faculty.department.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Avatar Section */}
      {faculty.avatar_path && (
        <div className="card-glass p-6">
          <div className="flex items-center mb-6">
            <UserIcon className="h-6 w-6 text-white mr-2" />
            <h2 className="text-lg font-semibold text-white">Profile Picture</h2>
          </div>
          <div className="flex justify-center">
            <img
              src={faculty.avatar_path}
              alt={`${faculty.first_name} ${faculty.last_name}`}
              className="h-32 w-32 rounded-full object-cover border-4 border-neutral-700"
            />
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default FacultyProfilePage;