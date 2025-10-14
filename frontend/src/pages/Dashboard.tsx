import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users as UserGroupIcon, GraduationCap as AcademicCapIcon } from 'lucide-react';
import { useUser } from '../stores/auth.store';
import { studentsApi } from '../api/students.api';
import { clubsApi } from '../api/clubs.api';
import { facultyApi } from '../api/faculty.api';
import LoadingSpinner from '../components/ui/LoadingSpinner';

const Dashboard: React.FC = () => {
  const user = useUser();

  // Fetch totals: students, faculty, clubs
  const { data: studentsData, isLoading: studentsLoading } = useQuery({
    queryKey: ['students', 'dashboard-total'],
    queryFn: () => studentsApi.getStudents({ limit: 1 }),
  });

  const { data: facultyData, isLoading: facultyLoading } = useQuery({
    queryKey: ['faculty', 'dashboard-total'],
    queryFn: () => facultyApi.getFaculty({ limit: 1 }),
  });

  const { data: clubsData, isLoading: clubsLoading } = useQuery({
    queryKey: ['clubs', 'dashboard-total'],
    queryFn: () => clubsApi.getClubs(),
  });

  // Fetch current club details for CLUB users to show name instead of ID
  const { data: currentClubData } = useQuery({
    queryKey: ['club', user?.profile_ref_id],
    queryFn: () => clubsApi.getClubById(String(user?.profile_ref_id)),
    enabled: user?.role === 'CLUB' && !!user?.profile_ref_id,
  });

  const stats = [
    {
      name: 'Total Students',
      value: studentsData?.data?.data?.meta?.total || 0,
      icon: UserGroupIcon,
      color: 'from-primary-500 to-primary-600',
      bgColor: 'bg-primary-900/30',
      iconColor: 'text-primary-300',
    },
    {
      name: 'Total Faculty',
      // Support both shapes; after API type fix, meta is at root
      value: (facultyData as any)?.data?.meta?.total || (facultyData as any)?.data?.data?.meta?.total || 0,
      icon: AcademicCapIcon,
      color: 'from-secondary-500 to-secondary-600',
      bgColor: 'bg-secondary-900/30',
      iconColor: 'text-secondary-300',
    },
    {
      name: 'Total Clubs',
      value: (clubsData?.data?.data || [])?.length || 0,
      icon: UserGroupIcon,
      color: 'from-accent-500 to-accent-600',
      bgColor: 'bg-accent-900/30',
      iconColor: 'text-accent-300',
    },
  ];

  const isLoading = studentsLoading || facultyLoading || clubsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner className="h-16 w-16" />
      </div>
    );
  }

  const displayName =
    user?.role === 'CLUB'
      ? currentClubData?.data?.data?.name || user?.email?.split('@')[0]
      : user?.email?.split('@')[0];

  return (
    <div className="page-container">
      <div className="content-container space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center lg:text-left">
          <h1 className="text-display-lg font-display font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-600 bg-clip-text text-transparent animate-slide-up">
            Welcome back, {displayName}! 👋
          </h1>
          <p className="mt-3 text-lg text-neutral-600 font-medium animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Overview of totals across your data warehouse.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, index) => (
            <div 
              key={stat.name} 
              className="card-elevated group hover:shadow-xl transition-all duration-300 animate-slide-up"
              style={{ animationDelay: `${0.2 + index * 0.1}s` }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className={`inline-flex p-3 rounded-xl ${stat.bgColor} group-hover:scale-110 transition-transform duration-300`}>
                      <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-semibold text-neutral-300 uppercase tracking-wide">
                        {stat.name}
                      </p>
                      <p className="text-3xl font-display font-bold text-neutral-100 mt-1">
                        {stat.value}
                      </p>
                    </div>
                  </div>
                </div>
                <div className={`mt-4 h-1 bg-gradient-to-r ${stat.color} rounded-full opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
              </div>
            </div>
          ))}
        </div>

        {/* No extra sections — dashboard shows only the three totals */}
      </div>
    </div>
  );
};

export default Dashboard;
