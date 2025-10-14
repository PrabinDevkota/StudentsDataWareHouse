import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus as PlusIcon, Trash as TrashIcon } from 'lucide-react';
import { clubsApi, type CreateClubRequest } from '../api/clubs.api';
import { queryKeys } from '../lib/react-query';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';

const AdminClubsManagement: React.FC = () => {
  const queryClient = useQueryClient();

  // Fetch clubs
  const { data: clubsData, isLoading } = useQuery({
    queryKey: queryKeys.clubs.lists(),
    queryFn: () => clubsApi.getClubs().then(res => res.data.data),
  });

  // Create club state and mutation
  const [newClub, setNewClub] = useState<CreateClubRequest>({
    name: '',
    description: '',
    category: '',
    established_date: '',
  });

  const createClubMutation = useMutation({
    mutationFn: (payload: CreateClubRequest) => clubsApi.createClub(payload).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.lists() });
      setNewClub({ name: '', description: '', category: '', established_date: '' });
    },
  });

  // Delete club mutation
  const deleteClubMutation = useMutation({
    mutationFn: (clubId: string) => clubsApi.deleteClub(clubId).then(res => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clubs.lists() });
    },
  });

  const handleCreateClub = () => {
    if (!newClub.name.trim()) return;
    createClubMutation.mutate({
      name: newClub.name.trim(),
      description: newClub.description?.trim() || undefined,
      category: newClub.category?.trim() || undefined,
      established_date: newClub.established_date || undefined,
    });
  };

  const handleDeleteClub = (clubId: string) => {
    deleteClubMutation.mutate(clubId);
  };

  const clubs = clubsData || [];

  return (
    <div className="page-container">
      <div className="content-container space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-neutral-100">Clubs Management</h1>
          <p className="mt-1 text-sm text-neutral-300">Add new clubs and manage existing ones</p>
        </div>
      </div>

      {/* Create Club Form */}
      <div className="bg-white/90 backdrop-blur-sm border border-neutral-200/60 rounded-lg shadow-lg p-6">
        <h2 className="text-lg font-semibold text-neutral-800 mb-4">Add New Club</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Name *"
            value={newClub.name}
            onChange={(e) => setNewClub(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Robotics Club"
          />
          <Input
            label="Category"
            value={newClub.category || ''}
            onChange={(e) => setNewClub(prev => ({ ...prev, category: e.target.value }))}
            placeholder="e.g., Technical, Cultural"
          />
          <Input
            label="Established Date"
            type="date"
            value={newClub.established_date || ''}
            onChange={(e) => setNewClub(prev => ({ ...prev, established_date: e.target.value }))}
          />
          <Input
            label="Description"
            value={newClub.description || ''}
            onChange={(e) => setNewClub(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Short description"
          />
        </div>
        <div className="mt-4">
          <Button
            onClick={handleCreateClub}
            leftIcon={<PlusIcon className="h-5 w-5" />}
            disabled={createClubMutation.isPending || !newClub.name.trim()}
            isLoading={createClubMutation.isPending}
          >
            Create Club
          </Button>
        </div>
      </div>

      {/* Clubs Table */}
      <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-lg shadow-lg overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-200/50">
              <thead className="bg-white/60">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Established</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Members</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/80 divide-y divide-neutral-200/50">
                {clubs.length > 0 ? (
                  clubs.map((club: any) => (
                    <tr key={club.club_id}>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{club.club_id}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{club.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{club.category || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">{club.established_date || '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{club.active_member_count ?? club.member_count ?? 0}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDeleteClub(club.club_id)}
                            className="text-red-600 hover:text-red-900"
                            disabled={deleteClubMutation.isPending}
                            title="Delete club"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                      No clubs found. Create the first club above.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};

export default AdminClubsManagement;