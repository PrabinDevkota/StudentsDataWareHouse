import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  Home,
  Users,
  Briefcase,
  GraduationCap,
  User,
  Menu,
  X,
  LogOut,
} from 'lucide-react';
import { useUser, useLogout } from '../stores/auth.store';
import { clubsApi } from '../api/clubs.api';
import { invitationsApi } from '../api/invitations.api';
import { placementInvitationsApi } from '../api/placementInvitations.api';

const getNavigation = (userRole: string) => {
  const baseNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  switch (userRole) {
    case 'ADMIN':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Admin - Students', href: '/admin/students', icon: Users },
        { name: 'Admin - Faculty', href: '/admin/faculty', icon: GraduationCap },
        { name: 'Admin - Clubs', href: '/admin/clubs', icon: GraduationCap },
      ];
    case 'FACULTY':
      return [
        ...baseNavigation,
        { name: 'Students', href: '/students', icon: Users },
        // Removed Placements and Clubs from Faculty navigation
      ];
    case 'CIR':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Placements', href: '/placements', icon: Briefcase },
      ];
    case 'CLUB':
      return [
        { name: 'Dashboard', href: '/dashboard', icon: Home },
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Club-Student', href: '/club-student', icon: Users },
      ];
    case 'STUDENT':
      return [
        ...baseNavigation,
        { name: 'Placements', href: '/placements', icon: Briefcase },
        { name: 'Invitations', href: '/invitations', icon: GraduationCap },
        { name: 'Clubs', href: '/clubs', icon: GraduationCap },
      ];
    default:
      return baseNavigation;
  }
};

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUser();
  const logout = useLogout();

  const navigation = getNavigation(user?.role || '');

  // Fetch club details to show club name instead of club_id/email stub for CLUB users
  const { data: clubResp } = useQuery({
    queryKey: ['club', user?.profile_ref_id],
    queryFn: () => clubsApi.getClubById(String(user?.profile_ref_id)),
    enabled: user?.role === 'CLUB' && !!user?.profile_ref_id,
  });

  const displayName =
    user?.role === 'CLUB'
      ? clubResp?.data?.data?.name || user?.email?.split('@')[0]
      : user?.email?.split('@')[0];

  // New invitations indicator (Student only)
  const studentId = user?.profile_ref_id || '';
  const { data: invitesSummary } = useQuery({
    queryKey: ['studentInvitations', studentId, 'nav-indicator'],
    queryFn: async () => {
      const [club, placement] = await Promise.all([
        invitationsApi.getStudentInvitations(studentId),
        placementInvitationsApi.getStudentPlacementInvitations(studentId),
      ]);
      return { club, placement } as any;
    },
    enabled: user?.role === 'STUDENT' && !!studentId,
    staleTime: 30_000,
  });

  const lastSeenKey = studentId ? `sdw:lastSeenInvitations:${studentId}` : 'sdw:lastSeenInvitations';
  const lastSeen = Number(localStorage.getItem(lastSeenKey) || 0);
  const newInvitesCount = (() => {
    if (!invitesSummary) return 0;
    const club = (invitesSummary as any)?.club?.data || [];
    const placement = (invitesSummary as any)?.placement?.data || [];
    const all = [...club, ...placement];
    return all.filter((i: any) => new Date(i?.created_at).getTime() > lastSeen).length;
  })();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-screen flex overflow-hidden bg-gradient-to-br from-neutral-50 via-white to-primary-50/20">
      {/* Mobile sidebar */}
      <div className={clsx(
        'fixed inset-0 flex z-40 md:hidden transition-opacity duration-300',
        sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
      )}>
        <div className="fixed inset-0 bg-neutral-900/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white/95 backdrop-blur-xl shadow-2xl">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all duration-200"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-72">
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Top bar */}
        <div className="relative z-10 flex-shrink-0 flex h-20 bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 shadow-sm">
          <button
            className="px-6 border-r border-neutral-200/50 text-neutral-600 hover:text-primary-600 hover:bg-primary-50/50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden transition-all duration-200"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 px-6 flex justify-between items-center">
            <div className="flex-1 flex">
              <div className="w-full flex md:ml-0">
                <div className="relative w-full">
                  <h1 className="text-xl font-display font-bold bg-gradient-to-r from-primary-600 via-accent-600 to-secondary-600 bg-clip-text text-transparent">
                    Student Data Warehouse
                  </h1>
                  <p className="text-sm text-neutral-500 mt-1">Manage your academic journey</p>
                </div>
              </div>
            </div>
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-neutral-900">
                    {displayName}
                  </p>
                  <p className="text-xs text-neutral-500 capitalize">
                    {user?.role?.toLowerCase()}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-neutral-600 hover:text-error-600 hover:bg-error-50 rounded-lg transition-all duration-200 group"
                >
                  <LogOut className="h-4 w-4 mr-2 group-hover:translate-x-0.5 transition-transform duration-200" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <Outlet />
        </main>
      </div>
    </div>
  );

  function SidebarContent() {
    return (
      <div className="flex flex-col h-full bg-gradient-to-b from-primary-600 via-primary-700 to-primary-800 shadow-2xl">
        <div className="flex-1 flex flex-col pt-8 pb-4 overflow-y-auto">
          {/* Logo/Brand */}
          <div className="flex items-center flex-shrink-0 px-6 mb-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-display font-bold text-white">SDW</h1>
                <p className="text-xs text-primary-200">Data Warehouse</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-2">
            {navigation.map((item, index) => {
              const isActive = location.pathname === item.href;
              return (
                <button
                  key={item.name}
                  onClick={() => navigate(item.href)}
                  className={clsx(
                    'group flex items-center px-4 py-3 text-sm font-semibold rounded-xl w-full text-left transition-all duration-200 animate-slide-up',
                    isActive
                      ? 'bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm text-white shadow-lg border border-white/20'
                      : 'text-primary-100 hover:bg-white/10 hover:text-white hover:backdrop-blur-sm'
                  )}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className={clsx(
                    'p-2 rounded-lg mr-3 transition-all duration-200',
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-white/10 text-primary-200 group-hover:bg-white/20 group-hover:text-white'
                  )}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="flex-1 flex items-center justify-between">
                    <span>{item.name}</span>
                    {item.name === 'Invitations' && newInvitesCount > 0 && (
                      <span className={clsx(
                        'ml-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs',
                        isActive ? 'bg-white/30 text-white' : 'bg-accent-500 text-white'
                      )}>
                        {newInvitesCount}
                      </span>
                    )}
                  </span>
                  {isActive && (
                    <div className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User info at bottom */}
          <div className="px-4 py-4 border-t border-white/20">
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/10 backdrop-blur-sm">
              <div className="w-8 h-8 bg-accent-500 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-primary-200 capitalize">
                  {user?.role?.toLowerCase()}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default Layout;
