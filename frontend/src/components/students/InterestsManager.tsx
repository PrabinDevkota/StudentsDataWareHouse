import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interestsApi, studentInterestsApi, type Interest, type NewInterestData, type StudentInterestData } from '../../api/skills.api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus as PlusIcon, X as XMarkIcon, Search as MagnifyingGlassIcon } from 'lucide-react';

interface InterestsManagerProps {
  studentId: string;
  interests: Interest[];
}

const InterestsManager: React.FC<InterestsManagerProps> = ({ studentId, interests }) => {
  const queryClient = useQueryClient();
  const [isAddingInterest, setIsAddingInterest] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInterest, setSelectedInterest] = useState<Interest | null>(null);
  const [studentInterestDescription, setStudentInterestDescription] = useState('');
  
  // New interest form state
  const [newInterestName, setNewInterestName] = useState('');
  // Removed generic interest description (column dropped)
  const [newInterestCategory, setNewInterestCategory] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Search existing interests
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['interests', 'search', searchQuery],
    queryFn: () => interestsApi.searchInterests(searchQuery),
    enabled: searchQuery.length > 2 && isAddingInterest && !isCreatingNew,
  });

  // Normalize backend response shape (supports {data} or {interests})
  const foundInterests = (searchResults?.data as Interest[] | undefined) || searchResults?.interests || [];

  // Add existing interest mutation
  const addExistingInterestMutation = useMutation({
    mutationFn: (interestData: StudentInterestData) =>
      studentInterestsApi.addInterestToStudent(studentId, interestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'interests'] });
      setIsAddingInterest(false);
      setSelectedInterest(null);
      setSearchQuery('');
      setStudentInterestDescription('');
    },
  });

  // Add new interest mutation
  const addNewInterestMutation = useMutation({
    mutationFn: (interestData: NewInterestData) =>
      studentInterestsApi.addNewInterestToStudent(studentId, interestData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'interests'] });
      setIsAddingInterest(false);
      setIsCreatingNew(false);
      setNewInterestName('');
      setNewInterestCategory('');
      setNewInterestStudentDescription('');
    },
  });

  // Remove interest mutation
  const removeInterestMutation = useMutation({
    mutationFn: (interestId: string) =>
      studentInterestsApi.removeInterestFromStudent(studentId, interestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'interests'] });
    },
  });

  const handleAddExistingInterest = () => {
    if (selectedInterest) {
      addExistingInterestMutation.mutate({
        interest_id: selectedInterest.interest_id,
        student_description: studentInterestDescription.trim() || undefined,
      });
    }
  };

  const handleAddNewInterest = () => {
    if (newInterestName.trim()) {
      addNewInterestMutation.mutate({
        name: newInterestName.trim(),
        category: newInterestCategory.trim() || undefined,
        student_description: newInterestStudentDescription.trim() || undefined,
      });
    }
  };

  const handleInterestSelect = (interest: Interest) => {
    setSelectedInterest(interest);
    setSearchQuery(interest.name);
  };

  const [newInterestStudentDescription, setNewInterestStudentDescription] = useState('');

  const getCategoryColor = (category?: string) => {
    if (!category) return 'bg-gray-100 text-gray-800';
    
    const colors = {
      'Technology': 'bg-blue-100 text-blue-800',
      'Sports': 'bg-green-100 text-green-800',
      'Arts': 'bg-purple-100 text-purple-800',
      'Music': 'bg-pink-100 text-pink-800',
      'Science': 'bg-indigo-100 text-indigo-800',
      'Literature': 'bg-yellow-100 text-yellow-800',
      'Business': 'bg-orange-100 text-orange-800',
    };
    
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Interests</h3>
        <Button
          onClick={() => setIsAddingInterest(true)}
          leftIcon={<PlusIcon className="h-4 w-4" />}
          size="sm"
        >
          Add Interest
        </Button>
      </div>

      {/* Current Interests */}
      <div className="space-y-3 mb-6">
        {interests.length === 0 ? (
          <p className="text-gray-500 text-sm">No interests added yet.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => (
              <div key={interest.interest_id} className="flex items-center space-x-2 p-3 border rounded-lg bg-gray-50">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{interest.name}</h4>
                    {interest.category && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(interest.category)}`}>
                        {interest.category}
                      </span>
                    )}
                  </div>
                  {/* generic description removed */}
                  {(interest as any).student_description && (
                    <p className="text-sm text-blue-700 mt-1">Your notes: {(interest as any).student_description}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeInterestMutation.mutate(interest.interest_id)}
                  disabled={removeInterestMutation.isPending}
                  className="text-red-600 hover:text-red-800"
                >
                  <XMarkIcon className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Interest Form */}
      {isAddingInterest && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Add New Interest</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingInterest(false);
                setIsCreatingNew(false);
                setSelectedInterest(null);
                setSearchQuery('');
                setNewInterestName('');
                setNewInterestCategory('');
              }}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Toggle between existing and new interest */}
          <div className="flex space-x-2 mb-4">
            <Button
              variant={!isCreatingNew ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsCreatingNew(false)}
            >
              Search Existing
            </Button>
            <Button
              variant={isCreatingNew ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setIsCreatingNew(true)}
            >
              Create New
            </Button>
          </div>

          {!isCreatingNew ? (
            /* Search existing interests */
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for interests..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedInterest(null);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length > 2 && (
                <div className="max-h-40 overflow-y-auto border border-neutral-700 rounded-lg bg-neutral-900 text-white">
                  {isSearching ? (
                    <div className="p-3 text-center text-neutral-300">Searching...</div>
                  ) : foundInterests.length === 0 ? (
                    <div className="p-3 text-center text-neutral-300">
                      No interests found. Try creating a new one.
                    </div>
                  ) : (
                    foundInterests.map((interest) => (
                      <button
                        key={interest.interest_id}
                        onClick={() => handleInterestSelect(interest)}
                        className="w-full text-left p-3 hover:bg-neutral-800 border-b border-neutral-700 last:border-b-0"
                      >
                        <div className="flex items-center space-x-2">
                          <div className="font-medium">{interest.name}</div>
                          {interest.category && (
                            <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(interest.category)}`}>
                              {interest.category}
                            </span>
                          )}
                        </div>
                        {/* generic description removed */}
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedInterest && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <div className="font-medium text-blue-900">Selected: {selectedInterest.name}</div>
                    {selectedInterest.category && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(selectedInterest.category)}`}>
                        {selectedInterest.category}
                      </span>
                    )}
                  </div>
                  {/* generic description removed */}
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Your Description (optional)
                    </label>
                    <textarea
                      placeholder="Add notes about this interest"
                      value={studentInterestDescription}
                      onChange={(e) => setStudentInterestDescription(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-500 shadow-sm"
                      rows={3}
                    />
                  </div>
                </div>
              )}

              <Button
                onClick={handleAddExistingInterest}
                disabled={!selectedInterest || addExistingInterestMutation.isPending}
                className="w-full"
              >
                {addExistingInterestMutation.isPending ? 'Adding...' : 'Add Interest'}
              </Button>
            </div>
          ) : (
            /* Create new interest */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Interest Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter interest name"
                  value={newInterestName}
                  onChange={(e) => setNewInterestName(e.target.value)}
                />
              </div>

              {/* Removed generic interest description input */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newInterestCategory}
                  onChange={(e) => setNewInterestCategory(e.target.value)}
                  className="select-field text-sm"
                >
                  <option value="">Select a category (optional)</option>
                  <option value="Technology">Technology</option>
                  <option value="Sports">Sports</option>
                  <option value="Arts">Arts</option>
                  <option value="Music">Music</option>
                  <option value="Science">Science</option>
                  <option value="Literature">Literature</option>
                  <option value="Business">Business</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Description (optional)
                </label>
                <textarea
                  placeholder="Add notes about your interest"
                  value={newInterestStudentDescription}
                  onChange={(e) => setNewInterestStudentDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-500 shadow-sm"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddNewInterest}
                disabled={!newInterestName.trim() || addNewInterestMutation.isPending}
                className="w-full"
              >
                {addNewInterestMutation.isPending ? 'Creating...' : 'Create & Add Interest'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InterestsManager;