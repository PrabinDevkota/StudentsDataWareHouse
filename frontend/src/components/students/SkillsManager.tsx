import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi, studentSkillsApi, type Skill, type NewSkillData, type StudentSkillData, type StudentSkill } from '../../api/skills.api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Plus as PlusIcon, X as XMarkIcon, Search as MagnifyingGlassIcon } from 'lucide-react';

interface SkillsManagerProps {
  studentId: string;
  skills: StudentSkill[];
}

const SkillsManager: React.FC<SkillsManagerProps> = ({ studentId, skills }) => {
  const queryClient = useQueryClient();
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [proficiencyLevel, setProficiencyLevel] = useState<'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT'>('INTERMEDIATE');
  const [studentSkillDescription, setStudentSkillDescription] = useState('');
  
  // New skill form state
  const [newSkillName, setNewSkillName] = useState('');
  // Removed generic skill description (column dropped)
  const [newSkillCategory, setNewSkillCategory] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  // Search existing skills
  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['skills', 'search', searchQuery],
    queryFn: () => skillsApi.searchSkills(searchQuery),
    enabled: searchQuery.length > 2 && isAddingSkill && !isCreatingNew,
  });

  // Normalize backend response shape (supports {data} or {skills})
  const foundSkills = (searchResults?.data as Skill[] | undefined) || searchResults?.skills || [];

  // Add existing skill mutation
  const addExistingSkillMutation = useMutation({
    mutationFn: (skillData: StudentSkillData) =>
      studentSkillsApi.addSkillToStudent(studentId, skillData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'skills'] });
      setIsAddingSkill(false);
      setSelectedSkill(null);
      setSearchQuery('');
      setProficiencyLevel('INTERMEDIATE');
      setStudentSkillDescription('');
    },
  });

  // Add new skill mutation
  const addNewSkillMutation = useMutation({
    mutationFn: (skillData: NewSkillData) =>
      studentSkillsApi.addNewSkillToStudent(studentId, skillData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'skills'] });
      setIsAddingSkill(false);
      setIsCreatingNew(false);
      setNewSkillName('');
      // no generic description to reset
      setNewSkillCategory('');
      setProficiencyLevel('INTERMEDIATE');
      setNewSkillStudentDescription('');
    },
  });

  // Remove skill mutation
  const removeSkillMutation = useMutation({
    mutationFn: (skillId: string) =>
      studentSkillsApi.removeSkillFromStudent(studentId, skillId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'skills'] });
    },
  });

  const handleAddExistingSkill = () => {
    if (selectedSkill) {
      addExistingSkillMutation.mutate({
        skill_id: selectedSkill.skill_id,
        proficiency_level: proficiencyLevel,
        student_description: studentSkillDescription.trim() || undefined,
      });
    }
  };

  const handleAddNewSkill = () => {
    if (newSkillName.trim()) {
      addNewSkillMutation.mutate({
        name: newSkillName.trim(),
        category: newSkillCategory.trim() || undefined,
        proficiency_level: proficiencyLevel,
        student_description: newSkillStudentDescription.trim() || undefined,
      });
    }
  };

  const handleSkillSelect = (skill: Skill) => {
    setSelectedSkill(skill);
    setSearchQuery(skill.name);
  };

  // Student-specific description for new skill
  const [newSkillStudentDescription, setNewSkillStudentDescription] = useState('');

  const getProficiencyColor = (level: string) => {
    switch (level) {
      case 'BEGINNER': return 'bg-gray-100 text-gray-800';
      case 'INTERMEDIATE': return 'bg-blue-100 text-blue-800';
      case 'ADVANCED': return 'bg-green-100 text-green-800';
      case 'EXPERT': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Skills</h3>
        <Button
          onClick={() => setIsAddingSkill(true)}
          leftIcon={<PlusIcon className="h-4 w-4" />}
          size="sm"
        >
          Add Skill
        </Button>
      </div>

      {/* Current Skills */}
      <div className="space-y-3 mb-6">
        {skills.length === 0 ? (
          <p className="text-gray-500 text-sm">No skills added yet.</p>
        ) : (
          skills.map((skill) => (
            <div key={skill.skill_id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <h4 className="font-medium text-gray-900">{skill.name}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs ${getProficiencyColor(skill.proficiency_level)}`}>
                    {skill.proficiency_level}
                  </span>
                </div>
                {/* generic description removed */}
                {skill.student_description && (
                  <p className="text-sm text-blue-700 mt-1">Your notes: {skill.student_description}</p>
                )}
                {skill.category && (
                  <p className="text-xs text-gray-500 mt-1">Category: {skill.category}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSkillMutation.mutate(skill.skill_id)}
                disabled={removeSkillMutation.isPending}
                className="text-red-600 hover:text-red-800"
              >
                <XMarkIcon className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {/* Add Skill Form */}
      {isAddingSkill && (
        <div className="border-t pt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-medium text-gray-900">Add New Skill</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsAddingSkill(false);
                setIsCreatingNew(false);
                setSelectedSkill(null);
                setSearchQuery('');
                setNewSkillName('');
                setNewSkillCategory('');
              }}
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Toggle between existing and new skill */}
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
            /* Search existing skills */
            <div className="space-y-4">
              <div className="relative">
                <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for skills..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedSkill(null);
                  }}
                  className="pl-10"
                />
              </div>

              {/* Search Results */}
              {searchQuery.length > 2 && (
                <div className="max-h-40 overflow-y-auto border border-neutral-700 rounded-lg bg-neutral-900 text-white">
                  {isSearching ? (
                    <div className="p-3 text-center text-neutral-300">Searching...</div>
                  ) : foundSkills.length === 0 ? (
                    <div className="p-3 text-center text-neutral-300">
                      No skills found. Try creating a new one.
                    </div>
                  ) : (
                    foundSkills.map((skill) => (
                      <button
                        key={skill.skill_id}
                        onClick={() => handleSkillSelect(skill)}
                        className="w-full text-left p-3 hover:bg-neutral-800 border-b border-neutral-700 last:border-b-0"
                      >
                        <div className="font-medium">{skill.name}</div>
                        {/* generic description removed */}
                        {skill.category && (
                          <div className="text-xs text-neutral-400">Category: {skill.category}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}

              {selectedSkill && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="font-medium text-blue-900">Selected: {selectedSkill.name}</div>
                  {/* generic description removed */}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Proficiency Level
                </label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT')}
                  className="select-field text-sm"
                >
                  <option className="text-neutral-900" value="BEGINNER">Beginner</option>
                  <option className="text-neutral-900" value="INTERMEDIATE">Intermediate</option>
                  <option className="text-neutral-900" value="ADVANCED">Advanced</option>
                  <option className="text-neutral-900" value="EXPERT">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Description (optional)
                </label>
                <textarea
                  placeholder="Add notes about your experience with this skill"
                  value={studentSkillDescription}
                  onChange={(e) => setStudentSkillDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-500 shadow-sm"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddExistingSkill}
                disabled={!selectedSkill || addExistingSkillMutation.isPending}
                className="w-full"
              >
                {addExistingSkillMutation.isPending ? 'Adding...' : 'Add Skill'}
              </Button>
            </div>
          ) : (
            /* Create new skill */
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Skill Name *
                </label>
                <Input
                  type="text"
                  placeholder="Enter skill name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                />
              </div>

              {/* Removed generic skill description input */}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <Input
                  type="text"
                  placeholder="e.g., Programming, Design, Marketing"
                  value={newSkillCategory}
                  onChange={(e) => setNewSkillCategory(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Proficiency Level
                </label>
                <select
                  value={proficiencyLevel}
                  onChange={(e) => setProficiencyLevel(e.target.value as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT')}
                  className="select-field text-sm"
                >
                  <option className="text-neutral-900" value="BEGINNER">Beginner</option>
                  <option className="text-neutral-900" value="INTERMEDIATE">Intermediate</option>
                  <option className="text-neutral-900" value="ADVANCED">Advanced</option>
                  <option className="text-neutral-900" value="EXPERT">Expert</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Description (optional)
                </label>
                <textarea
                  placeholder="Add notes about your experience with this skill"
                  value={newSkillStudentDescription}
                  onChange={(e) => setNewSkillStudentDescription(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white text-neutral-900 placeholder-neutral-500 shadow-sm"
                  rows={3}
                />
              </div>

              <Button
                onClick={handleAddNewSkill}
                disabled={!newSkillName.trim() || addNewSkillMutation.isPending}
                className="w-full"
              >
                {addNewSkillMutation.isPending ? 'Creating...' : 'Create & Add Skill'}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SkillsManager;