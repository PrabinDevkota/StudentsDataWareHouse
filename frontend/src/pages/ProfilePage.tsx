import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '../stores/auth.store';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import apiClient from '../api/axios';
import { studentsApi } from '../api/students.api';
import { studentSkillsApi, studentInterestsApi } from '../api/skills.api';
import SkillsManager from '../components/students/SkillsManager';
import InterestsManager from '../components/students/InterestsManager';
import CertificationsManager from '../components/students/CertificationsManager';
import AchievementsManager from '../components/students/AchievementsManager';
import {
  User as UserIcon,
  GraduationCap as AcademicCapIcon,
  Briefcase as BriefcaseIcon,
  Trophy as TrophyIcon,
  FileText as DocumentTextIcon,
  FlaskConical as BeakerIcon,
  CalendarDays as CalendarIcon,
  Phone as PhoneIcon,
  Mail as EnvelopeIcon,
  MapPin as MapPinIcon,
  BarChart3 as ChartBarIcon,
  Cog as CogIcon,
  Heart as HeartIcon,
} from 'lucide-react';

const ProfilePage: React.FC = () => {
  const user = useUser();
  const queryClient = useQueryClient();
  const studentId = user?.profile_ref_id;

  const { data: studentResp, isLoading } = useQuery({
    queryKey: ['student', studentId],
    enabled: !!studentId,
    queryFn: async () => (await apiClient.get(`/students/${studentId}`)).data,
    // Reduce unnecessary refetches to avoid hitting server rate limits
    staleTime: 5 * 60 * 1000, // cache as fresh for 5 minutes
    gcTime: 10 * 60 * 1000, // garbage collect after 10 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1, // minimal retries to avoid bursts if errors occur
  });
  const student = studentResp?.data;

  const { data: skillsResp } = useQuery({
    queryKey: ['student', studentId, 'skills'],
    enabled: !!studentId,
    queryFn: async () => studentSkillsApi.getStudentSkills(studentId as string),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  const { data: interestsResp } = useQuery({
    queryKey: ['student', studentId, 'interests'],
    enabled: !!studentId,
    queryFn: async () => studentInterestsApi.getStudentInterests(studentId as string),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  const skills = skillsResp?.data || [];
  const interests = interestsResp?.data || [];
  // Certifications are fetched in the manager; pass any preloaded ones from student
  const certifications = student?.certifications || [];
  // Achievements are fetched in the manager; pass preloaded ones from student
  const achievements = student?.achievements || [];



  if (isLoading) return (
    <div className="page-container flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner className="h-16 w-16 mb-4" />
        <p className="text-neutral-300 font-medium">Loading your profile...</p>
      </div>
    </div>
  );

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ACCEPTED': return 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300';
      case 'OFFERED': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300';
      case 'SHORTLISTED': return 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800 border border-warning-300';
      case 'APPLIED': return 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 border border-neutral-300';
      case 'REJECTED': return 'bg-gradient-to-r from-error-100 to-error-200 text-error-800 border border-error-300';
      case 'ACTIVE': return 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300';
      case 'COMPLETED': return 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 border border-primary-300';
      default: return 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 border border-neutral-300';
    }
  };

  return (
    <div className="page-container">
      <div className="content-container space-y-8 animate-fade-in">
        <div className="animate-slide-up">
          <h1 className="text-4xl font-display font-bold bg-gradient-to-r from-primary-600 via-secondary-600 to-accent-600 bg-clip-text text-transparent">
            My Profile
          </h1>
          <p className="mt-2 text-lg text-neutral-300 font-medium">Your comprehensive student information</p>
        </div>

        {/* Personal Information */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
              <UserIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Personal Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 mb-2 group-hover:text-primary-600 transition-colors">Full Name</h3>
              <p className="text-white font-medium">{student?.first_name} {student?.last_name}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 mb-2 group-hover:text-primary-600 transition-colors">Student ID</h3>
              <p className="text-white font-medium">{student?.student_id || 'N/A'}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 flex items-center mb-2 group-hover:text-primary-600 transition-colors">
                <EnvelopeIcon className="h-4 w-4 mr-2" />
                Email
              </h3>
              <p className="text-white font-medium">{user?.email}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 flex items-center mb-2 group-hover:text-primary-600 transition-colors">
                <PhoneIcon className="h-4 w-4 mr-2" />
                Phone
              </h3>
              <p className="text-white font-medium">{student?.phone || 'N/A'}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 flex items-center mb-2 group-hover:text-primary-600 transition-colors">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Date of Birth
              </h3>
              <p className="text-white font-medium">{formatDate(student?.dob)}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 mb-2 group-hover:text-primary-600 transition-colors">Gender</h3>
              <p className="text-white font-medium">{student?.gender || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mr-3">
              <AcademicCapIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Academic Information</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 mb-2 group-hover:text-accent-600 transition-colors">Department</h3>
              <p className="text-white font-medium">{student?.department_name}</p>
              <p className="text-sm text-neutral-500 font-medium">({student?.department_code})</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 mb-2 group-hover:text-accent-600 transition-colors">Current Semester</h3>
              <p className="text-white font-medium">{student?.semester || 'N/A'}</p>
            </div>
            <div className="group">
              <h3 className="text-sm font-semibold text-neutral-600 flex items-center mb-2 group-hover:text-accent-600 transition-colors">
                <ChartBarIcon className="h-4 w-4 mr-2" />
                CGPA
              </h3>
              <p className="text-white font-medium">{student?.cgpa ? `${student.cgpa}/10.0` : 'N/A'}</p>
            </div>
            {/* Attendance removed */}
            <div className="md:col-span-2 lg:col-span-4 group">
              <h3 className="text-sm font-semibold text-neutral-600 flex items-center mb-2 group-hover:text-accent-600 transition-colors">
                <BeakerIcon className="h-4 w-4 mr-2" />
                Research Experience
              </h3>
              <p className="text-white font-medium">{student?.research_experience ? 'Yes - Has research experience' : 'No research experience yet'}</p>
            </div>
          </div>
        </div>

        {/* Research Projects */}
        {student?.research_projects && student.research_projects.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-accent-500 flex items-center justify-center mr-3">
                <BeakerIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Research Projects</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {student.research_projects.map((project: any, index: number) => (
                <div key={index} className="border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-neutral-50">
                  <h4 className="font-semibold text-neutral-800 text-lg mb-2">{project.title}</h4>
                  <p className="text-neutral-600 mb-4">{project.description}</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-neutral-500">Faculty: {project.faculty_name}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(project.status)}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 mt-3 text-xs text-neutral-500">
                    <span>Start: {formatDate(project.start_date)}</span>
                    {project.end_date && <span>End: {formatDate(project.end_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Skills Management */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center mr-3">
              <CogIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Skills</h2>
          </div>
          <SkillsManager studentId={studentId!} skills={skills} />
        </div>

        {/* Interests Management */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success-500 to-accent-500 flex items-center justify-center mr-3">
              <HeartIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Interests</h2>
          </div>
          <InterestsManager studentId={studentId!} interests={interests} />
        </div>

        {/* Certifications Management */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.55s' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex items-center justify-center mr-3">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Certifications</h2>
          </div>
          <CertificationsManager studentId={studentId!} certifications={certifications} />
        </div>

        {/* Achievements Management */}
        <div className="card-glass animate-slide-up" style={{ animationDelay: '0.575s' }}>
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-primary-500 flex items-center justify-center mr-3">
              <TrophyIcon className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-2xl font-semibold text-white">Achievements</h2>
          </div>
          <AchievementsManager studentId={studentId!} achievements={achievements} />
        </div>

        {/* Internships */}
        {student?.internships && student.internships.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-warning-500 to-accent-500 flex items-center justify-center mr-3">
                <BriefcaseIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Internships</h2>
            </div>
            <div className="space-y-4">
              {student.internships.map((internship: any, index: number) => (
                <div key={index} className="border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-neutral-50">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-semibold text-neutral-800 text-lg">{internship.company_name}</h4>
                      <p className="text-neutral-600">{internship.role}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(internship.status)}`}>
                      {internship.status}
                    </span>
                  </div>
                  <p className="text-neutral-600 mb-3">{internship.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-neutral-500">
                    <span>Duration: {internship.duration_months} months</span>
                    <span>Start: {formatDate(internship.start_date)}</span>
                    {internship.end_date && <span>End: {formatDate(internship.end_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Publications */}
        {student?.publications && student.publications.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.7s' }}>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-500 to-secondary-500 flex items-center justify-center mr-3">
                <DocumentTextIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Publications</h2>
            </div>
            <div className="space-y-4">
              {student.publications.map((pub: any, index: number) => (
                <div key={index} className="border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-neutral-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-neutral-800 text-lg mb-1">{pub.title}</h4>
                      <p className="text-neutral-600 mb-2">{pub.journal_name}</p>
                      <p className="text-sm text-neutral-500">Published: {formatDate(pub.publication_date)}</p>
                    </div>
                    {pub.is_verified && (
                      <span className="px-3 py-1 rounded-full bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300 text-xs font-medium">
                        Verified
                      </span>
                    )}
                  </div>
                  {pub.url && (
                    <a 
                      href={pub.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium inline-flex items-center mt-2 hover:underline"
                    >
                      View Publication →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Club Memberships */}
        {student?.club_memberships && student.club_memberships.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.8s' }}>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center mr-3">
                <AcademicCapIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Club Memberships</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {student.club_memberships.map((membership: any, index: number) => (
                <div key={index} className="border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-neutral-50">
                  <h4 className="font-semibold text-neutral-800 text-lg mb-2">{membership.club_name}</h4>
                  <p className="text-neutral-600 mb-3">Role: {membership.role || 'Member'}</p>
                  <div className="flex items-center justify-between text-sm">
                    <div className="space-y-1">
                      <p className="text-neutral-500">Joined: {formatDate(membership.start_date)}</p>
                      {membership.end_date && <p className="text-neutral-500">Left: {formatDate(membership.end_date)}</p>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${membership.is_active ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300' : 'bg-gradient-to-r from-neutral-100 to-neutral-200 text-neutral-800 border border-neutral-300'}`}>
                      {membership.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Placement Status */}
        {student?.placements && student.placements.length > 0 && (
          <div className="card-glass animate-slide-up" style={{ animationDelay: '0.9s' }}>
            <div className="flex items-center mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success-500 to-primary-500 flex items-center justify-center mr-3">
                <BriefcaseIcon className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-2xl font-semibold text-white">Placement Status</h2>
            </div>
            <div className="space-y-4">
              {student.placements.map((placement: any, index: number) => (
                <div key={index} className="border border-neutral-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200 bg-gradient-to-br from-white to-neutral-50">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-semibold text-neutral-800 text-lg">{placement.company_name}</h4>
                      <p className="text-neutral-600">{placement.job_title}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(placement.status)}`}>
                      {placement.status}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-600">
                    <div>
                      <span className="font-medium">Package:</span> {placement.package_lpa ? `₹${placement.package_lpa} LPA` : 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Location:</span> {placement.job_location || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Applied:</span> {formatDate(placement.application_date)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
