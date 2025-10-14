import React from 'react';
import { useUser } from '../stores/auth.store';
import ProfilePage from './ProfilePage';
import FacultyProfilePage from './FacultyProfilePage';

const ProfilePageWrapper: React.FC = () => {
  const user = useUser();

  if (user?.role === 'FACULTY') {
    return <FacultyProfilePage />;
  }

  // Default to student profile for STUDENT role or other cases
  return <ProfilePage />;
};

export default ProfilePageWrapper;