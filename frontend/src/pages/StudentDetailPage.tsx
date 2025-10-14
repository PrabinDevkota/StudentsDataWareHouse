import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft as ArrowLeftIcon,
  UserCircle as UserCircleIcon,
  Phone as PhoneIcon,
  Mail as EnvelopeIcon,
  CalendarDays as CalendarIcon,
  GraduationCap as AcademicCapIcon,
  Cog as CogIcon,
  Heart as HeartIcon,
  FileText as DocumentTextIcon,
  Trophy as TrophyIcon,
  Users as UserGroupIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { studentsApi } from '../api/students.api';
import { queryKeys } from '../lib/react-query';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

const StudentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: student, isLoading, error } = useQuery({
    queryKey: queryKeys.students.detail(id!),
    queryFn: () => studentsApi.getStudentById(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return <LoadingSpinner className="h-64" />;
  }

  if (error || !student) {
    return (
      <div className="page-container flex items-center justify-center">
        <div className="text-center py-12 bg-neutral-900/60 backdrop-blur-sm rounded-2xl shadow-xl border border-neutral-700 p-8 animate-fade-in">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-error-400 to-error-600 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <p className="text-error-300 font-medium mb-4">Student not found.</p>
          <Button onClick={() => navigate('/students')} className="btn-primary">
            Back to Students
          </Button>
        </div>
      </div>
    );
  }

  const studentData = student.data.data;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatCGPA = (cgpa: number | string | null) => {
    if (!cgpa) return 'N/A';
    const numericCgpa = typeof cgpa === 'string' ? parseFloat(cgpa) : cgpa;
    return isNaN(numericCgpa) ? 'N/A' : numericCgpa.toFixed(2);
  };
  // Attendance removed

  return (
    <div className="page-container">
      <div className="content-container space-y-8 animate-fade-in">
        {/* Header */}
        <div className="flex items-center space-x-6 animate-slide-up">
          <Button
            variant="ghost"
            onClick={() => navigate('/students')}
            leftIcon={<ArrowLeftIcon className="h-4 w-4" />}
            className="btn-glass hover:scale-105 transition-all duration-200"
          >
            Back
          </Button>
          <div className="flex items-center space-x-6">
            <div className="flex-shrink-0 h-20 w-20 animate-scale-in">
              {studentData.avatar_path ? (
                <img
                  className="h-20 w-20 rounded-full ring-4 ring-white/50 shadow-lg"
                  src={`http://localhost:4001${studentData.avatar_path}`}
                  alt={`${studentData.first_name} ${studentData.last_name}`}
                />
              ) : (
                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 flex items-center justify-center ring-4 ring-white/50 shadow-lg">
                  <UserCircleIcon className="h-12 w-12 text-white" />
                </div>
              )}
            </div>
            <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
                {studentData.first_name} {studentData.last_name}
              </h1>
              <p className="text-xl text-white font-medium mt-1">{studentData.student_id}</p>
              <p className="text-sm text-white mt-1">ID: {studentData.student_id}</p>
              <p className="text-lg text-white mt-1">{studentData.department_name} ({studentData.department_code})</p>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
              <UserCircleIcon className="h-5 w-5 text-white" />
            </div>
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-300 flex items-center mb-2 group-hover:text-primary-400 transition-colors">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Email
              </h3>
              <p className="text-neutral-300 font-medium">{studentData.email}</p>
            </div>
            {studentData.phone && (
              <div className="group">
                <h3 className="text-sm font-semibold text-neutral-300 flex items-center mb-2 group-hover:text-primary-400 transition-colors">
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Phone
                </h3>
                <p className="text-neutral-300 font-medium">{studentData.phone}</p>
              </div>
            )}
            {studentData.dob && (
              <div className="group">
                <h3 className="text-sm font-semibold text-neutral-300 flex items-center mb-2 group-hover:text-primary-400 transition-colors">
                  <CalendarIcon className="h-4 w-4 mr-2" />
                  Date of Birth
                </h3>
                <p className="text-neutral-300 font-medium">{formatDate(studentData.dob)}</p>
              </div>
            )}
            {studentData.gender && (
              <div className="group">
                <h3 className="text-sm font-semibold text-neutral-300 mb-2 group-hover:text-primary-400 transition-colors">Gender</h3>
                <p className="text-neutral-300 font-medium">{studentData.gender}</p>
              </div>
            )}
          </div>
        </div>

        {/* Academic Information */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mr-3">
              <AcademicCapIcon className="h-5 w-5 text-white" />
            </div>
            Academic Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-300 mb-2 group-hover:text-accent-400 transition-colors">Department</h3>
              <p className="text-neutral-300 font-medium">{studentData.department_name}</p>
              <p className="text-sm text-neutral-400 font-medium">({studentData.department_code})</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-300 mb-2 group-hover:text-accent-400 transition-colors">Semester</h3>
              <p className="text-neutral-300 font-medium">{studentData.semester}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-300 mb-2 group-hover:text-accent-400 transition-colors">CGPA</h3>
              <p className="text-neutral-300 font-medium">{formatCGPA(studentData.cgpa)}</p>
            </div>
            <div className="group">
              {/* Attendance removed */}
            </div>
            <div className="md:col-span-2 lg:col-span-4 group">
              <h3 className="text-sm font-semibold text-neutral-300 mb-2 group-hover:text-accent-400 transition-colors">Research Experience</h3>
              <p className="text-neutral-300 font-medium flex items-center">
                <CogIcon className="h-4 w-4 mr-2 text-neutral-400" />
                {studentData.research_experience ? 'Yes - Has research experience' : 'No research experience yet'}
              </p>
            </div>
          </div>
        </div>

        {/* Skills */}
        {studentData.skills && studentData.skills.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-accent-500 flex items-center justify-center mr-3">
                <CogIcon className="h-5 w-5 text-white" />
              </div>
              Skills
            </h2>
            <div className="flex flex-wrap gap-3">
              {studentData.skills.map((skill: any, index: number) => (
                <span
                  key={skill.skill_id || index}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-800 border border-primary-200 hover:scale-105 transition-all duration-200 cursor-default"
                  title={`${skill.category} - ${skill.proficiency_level || 'N/A'}${skill.student_description ? ' — ' + skill.student_description : ''}`}
                >
                  {skill.name}
                </span>
              ))}
            </div>
            {/* Inline details for faculty visibility */}
            <div className="mt-6 space-y-4">
              {studentData.skills.map((skill: any, index: number) => (
                <div
                  key={`detail-${skill.skill_id || index}`}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{skill.name}</span>
                      {skill.category && (
                        <span className="text-xs text-neutral-400">({skill.category})</span>
                      )}
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                      {skill.proficiency_level || 'N/A'}
                    </span>
                  </div>
                  {skill.student_description && (
                    <p className="mt-2 text-sm text-neutral-300">
                      {skill.student_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interests */}
        {studentData.interests && studentData.interests.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success-500 to-accent-500 flex items-center justify-center mr-3">
                <HeartIcon className="h-5 w-5 text-white" />
              </div>
              Interests
            </h2>
            <div className="flex flex-wrap gap-3">
              {studentData.interests.map((interest: any, index: number) => (
                <span
                  key={interest.interest_id || index}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-success-100 to-accent-100 text-success-800 border border-success-200 hover:scale-105 transition-all duration-200 cursor-default"
                  title={`${interest.category || ''}${interest.student_description ? (interest.category ? ' — ' : '') + interest.student_description : ''}`}
                >
                  {interest.name}
                </span>
              ))}
            </div>
            {/* Inline details for faculty visibility */}
            <div className="mt-6 space-y-4">
              {studentData.interests.map((interest: any, index: number) => (
                <div
                  key={`detail-${interest.interest_id || index}`}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-white font-semibold">{interest.name}</span>
                    {interest.category && (
                      <span className="text-xs text-neutral-400">({interest.category})</span>
                    )}
                  </div>
                  {interest.student_description && (
                    <p className="mt-2 text-sm text-neutral-300">
                      {interest.student_description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Club Memberships */}
        {studentData.club_memberships && studentData.club_memberships.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.51s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
                <UserGroupIcon className="h-5 w-5 text-white" />
              </div>
              Club Memberships
            </h2>
            <div className="flex flex-wrap gap-3">
              {studentData.club_memberships.map((cm: any, index: number) => (
                <span
                  key={cm.club_id || index}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-primary-100 to-secondary-100 text-primary-800 border border-primary-200 hover:scale-105 transition-all duration-200 cursor-default"
                  title={`${cm.role ? cm.role + ' — ' : ''}${cm.is_active ? 'Active' : 'Inactive'}`}
                >
                  {cm.club_name}
                </span>
              ))}
            </div>
            {/* Inline details for admin/faculty/club visibility */}
            <div className="mt-6 space-y-4">
              {studentData.club_memberships.map((cm: any, index: number) => (
                <div
                  key={`club-detail-${cm.club_id || index}`}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{cm.club_name}</h3>
                      <div className="mt-1 text-sm text-neutral-300">
                        <span className="font-medium">Role:</span> {cm.role || 'Member'}
                      </div>
                      <div className="mt-2 text-xs text-neutral-400 space-x-3">
                        {cm.start_date && <span>Joined: {new Date(cm.start_date).toLocaleDateString()}</span>}
                        {cm.end_date && <span>Left: {new Date(cm.end_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${cm.is_active ? 'bg-success-50 text-success-700 border-success-200' : 'bg-neutral-800 text-neutral-300 border-neutral-600'}`}>
                        {cm.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Research Projects */}
        {studentData.research_projects && studentData.research_projects.length > 0 && (
          <div id="research" className="card-glass animate-slide-up" style={{ animationDelay: '0.52s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mr-3">
                <CogIcon className="h-5 w-5 text-white" />
              </div>
              Research Projects
            </h2>
            <div className="space-y-4">
              {studentData.research_projects.map((rp: any, index: number) => (
                <div
                  key={rp.project_id || index}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">{rp.title}</h3>
                      {rp.description && (
                        <p className="mt-1 text-sm text-neutral-300">{rp.description}</p>
                      )}
                      <div className="mt-2 text-xs text-neutral-400 space-x-3">
                        {rp.start_date && <span>Project start: {new Date(rp.start_date).toLocaleDateString()}</span>}
                        {rp.end_date && <span>Project end: {new Date(rp.end_date).toLocaleDateString()}</span>}
                        {rp.status && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                            {rp.status}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-neutral-300">
                      <div className="font-medium">Role: {rp.role || 'Participant'}</div>
                      <div className="mt-1 text-xs text-neutral-400">
                        {rp.participation_start_date && (
                          <span>Joined: {new Date(rp.participation_start_date).toLocaleDateString()}</span>
                        )}
                        {rp.participation_end_date && (
                          <span className="ml-3">Left: {new Date(rp.participation_end_date).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 1. cations */}
        {studentData.certifications && studentData.certifications.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.55s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center mr-3">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              Certifications
            </h2>
            <div className="flex flex-wrap gap-3">
              {studentData.certifications.map((cert: any, index: number) => (
                <span
                  key={cert.certification_id || index}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 border border-neutral-200 hover:scale-105 transition-all duration-200 cursor-default"
                  title={`${cert.issuing_organization || ''}${cert.issue_date ? ' — Issued: ' + new Date(cert.issue_date).toLocaleDateString() : ''}`}
                >
                  {cert.name}
                </span>
              ))}
            </div>
            {/* Inline details for visibility */}
            <div className="mt-6 space-y-4">
              {studentData.certifications.map((cert: any, index: number) => (
                <div
                  key={`cert-detail-${cert.certification_id || index}`}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{cert.name}</span>
                      {cert.issuing_organization && (
                        <span className="text-xs text-neutral-400">({cert.issuing_organization})</span>
                      )}
                    </div>
                    {Boolean(cert.is_verified) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-neutral-300 space-x-4">
                    {cert.issue_date && <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>}
                    {cert.expiry_date && <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>}
                    {cert.credential_id && <span>ID: {cert.credential_id}</span>}
                    {cert.credential_url && (
                      <a href={cert.credential_url} target="_blank" rel="noopener noreferrer" className="text-primary-400 hover:underline">
                        View Credential →
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Achievements */}
        {studentData.achievements && studentData.achievements.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.575s' }}>
              <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mr-3">
                  <TrophyIcon className="h-5 w-5 text-white" />
                </div>
                Achievements
              </h2>
            <div className="flex flex-wrap gap-3">
              {studentData.achievements.map((ach: any, index: number) => (
                <span
                  key={ach.achievement_id || index}
                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 border border-neutral-200 hover:scale-105 transition-all duration-200 cursor-default"
                  title={`${ach.category || ''}${ach.achievement_date ? ' — Date: ' + new Date(ach.achievement_date).toLocaleDateString() : ''}`}
                >
                  {ach.title}
                </span>
              ))}
            </div>
            {/* Inline details for visibility */}
            <div className="mt-6 space-y-4">
              {studentData.achievements.map((ach: any, index: number) => (
                <div
                  key={`ach-detail-${ach.achievement_id || index}`}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-semibold">{ach.title}</span>
                      {ach.category && (
                        <span className="text-xs text-neutral-400">({ach.category})</span>
                      )}
                    </div>
                    {Boolean(ach.is_verified) && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200">
                        Verified
                      </span>
                    )}
                  </div>
                  <div className="mt-2 text-sm text-neutral-300 space-x-4">
                    {ach.achievement_date && <span>Date: {new Date(ach.achievement_date).toLocaleDateString()}</span>}
                  </div>
                  {ach.description && (
                    <p className="mt-2 text-sm text-neutral-300">{ach.description}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placements */}
        {studentData.placements && studentData.placements.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.59s' }}>
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center mr-3">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              Placements
            </h2>
            <div className="space-y-4">
              {studentData.placements.map((pl: any, index: number) => (
                <div
                  key={pl.placement_id || index}
                  className="rounded-xl border border-neutral-700 bg-neutral-900/60 backdrop-blur-sm p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-white">
                        {pl.company_name || pl.company_id}
                      </h3>
                      <div className="mt-1 text-sm text-neutral-300">
                        <span className="font-medium">Role:</span> {pl.job_title || pl.job_role_id}
                      </div>
                      <div className="mt-2 text-xs text-neutral-400 space-x-3">
                        {pl.applied_date && <span>Applied: {new Date(pl.applied_date).toLocaleDateString()}</span>}
                        {pl.offered_date && <span>Offered: {new Date(pl.offered_date).toLocaleDateString()}</span>}
                        {pl.accepted_date && <span>Accepted: {new Date(pl.accepted_date).toLocaleDateString()}</span>}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${pl.status === 'ACCEPTED' ? 'bg-success-50 text-success-700 border-success-200' : pl.status === 'OFFERED' ? 'bg-accent-50 text-accent-700 border-accent-200' : 'bg-neutral-800 text-neutral-300 border-neutral-600'}`}>
                        {pl.status}
                      </span>
                      {pl.offer_type && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                          {pl.offer_type === 'FULL_TIME' ? 'Full-time Offer' : 'Internship Offer'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TODO: Add these sections later when functionality is implemented
        - Internships
        - Publications
        */}
      </div>
    </div>
  );
};

export default StudentDetailPage;
