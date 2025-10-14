import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { studentAchievementsApi, type Achievement, type NewAchievementData } from '../../api/achievements.api';
import { Plus as PlusIcon, X as XMarkIcon } from 'lucide-react';

interface AchievementsManagerProps {
  studentId: string;
  achievements: Achievement[];
}

const AchievementsManager: React.FC<AchievementsManagerProps> = ({ studentId, achievements }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  const { data: achievementsResp } = useQuery({
    queryKey: ['student', studentId, 'achievements'],
    enabled: !!studentId,
    queryFn: async () => studentAchievementsApi.getStudentAchievements(studentId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  const items: Achievement[] = achievementsResp?.data || achievements || [];

  const addMutation = useMutation({
    mutationFn: (data: NewAchievementData) => studentAchievementsApi.addAchievementToStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'achievements'] });
      setIsAdding(false);
      setTitle('');
      setCategory('');
      setDate('');
      setDescription('');
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to add achievement';
      alert(message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (achievementId: string) => studentAchievementsApi.removeAchievementFromStudent(studentId, achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'achievements'] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to remove achievement';
      alert(message);
    },
  });

  const handleAdd = () => {
    if (!title.trim()) return;
    const payload: NewAchievementData = {
      title: title.trim(),
      category: category?.trim() || undefined,
      achievement_date: date?.trim() || undefined,
      description: description?.trim() || undefined,
    };
    addMutation.mutate(payload);
  };

  return (
    <div>
      {/* List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {items.map((ach) => (
          <div key={ach.achievement_id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neutral-100 text-neutral-800 border border-neutral-200">
            <span className="font-medium mr-2">{ach.title}</span>
            {ach.category && (
              <span className="text-neutral-600">{ach.category}</span>
            )}
            {ach.achievement_date && (
              <span className="ml-2 text-neutral-500">{new Date(ach.achievement_date).toLocaleDateString()}</span>
            )}
            <button
              className="ml-2 hover:text-error-600"
              onClick={() => removeMutation.mutate(ach.achievement_id)}
              title="Remove"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-neutral-600">No achievements added yet.</p>
        )}
      </div>

      {/* Add */}
      {isAdding ? (
        <div className="space-y-3 p-4 border border-neutral-200 rounded-lg bg-white">
          <Input
            placeholder="Title (e.g., Hackathon Winner)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Input
            placeholder="Category (e.g., Competition, Award)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <Input
            placeholder="Date (YYYY-MM-DD)"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <Input
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={addMutation.isPending || !title} className="btn-primary">
              {addMutation.isPending ? 'Adding...' : 'Add Achievement'}
            </Button>
            <Button variant="ghost" onClick={() => { setIsAdding(false); setTitle(''); setCategory(''); setDate(''); setDescription(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAdding(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>Add Achievement</Button>
      )}
    </div>
  );
};

export default AchievementsManager;