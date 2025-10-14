import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X as XMarkIcon, ChevronDown as ChevronDownIcon } from 'lucide-react';
import type { StudentFilters } from '../../types/student.types';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { skillsApi, interestsApi } from '../../api/skills.api';
import { departmentsApi } from '../../api/departments.api';

interface StudentFiltersPanelProps {
  filters: StudentFilters;
  onFiltersChange: (filters: Partial<StudentFilters>) => void;
  onClose: () => void;
}

const StudentFiltersPanel: React.FC<StudentFiltersPanelProps> = ({
  filters,
  onFiltersChange,
  onClose,
}) => {
  const [localFilters, setLocalFilters] = useState<Partial<StudentFilters>>({
    min_cgpa: filters.min_cgpa,
    max_cgpa: filters.max_cgpa,
    semester: filters.semester,
    department_id: filters.department_id,
    research_experience: filters.research_experience,
    student_id: (filters as any).student_id,
    skills: filters.skills,
    interests: filters.interests,
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    filters.skills ? filters.skills.split(',').map(s => s.trim()) : []
  );
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    filters.interests ? filters.interests.split(',').map(s => s.trim()) : []
  );

  // Fetch skills, interests, and departments
  const { data: skillsData } = useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsApi.getSkills({ limit: 100 }),
  });

  const { data: interestsData } = useQuery({
    queryKey: ['interests'],
    queryFn: () => interestsApi.getInterests({ limit: 100 }),
  });

  const { data: departmentsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => departmentsApi.getDepartments(),
  });

  // Fix data access - backend returns data in 'data' property, not 'skills'/'interests'
  const skills = skillsData?.data || skillsData?.skills || [];
  const interests = interestsData?.data || interestsData?.interests || [];
  const departments = departmentsData?.data || [];

  const handleFilterChange = (key: keyof StudentFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleSkillToggle = (skillName: string) => {
    const newSelectedSkills = selectedSkills.includes(skillName)
      ? selectedSkills.filter(s => s !== skillName)
      : [...selectedSkills, skillName];
    
    setSelectedSkills(newSelectedSkills);
    handleFilterChange('skills', newSelectedSkills.length > 0 ? newSelectedSkills.join(',') : undefined);
  };

  const handleInterestToggle = (interestName: string) => {
    const newSelectedInterests = selectedInterests.includes(interestName)
      ? selectedInterests.filter(i => i !== interestName)
      : [...selectedInterests, interestName];
    
    setSelectedInterests(newSelectedInterests);
    handleFilterChange('interests', newSelectedInterests.length > 0 ? newSelectedInterests.join(',') : undefined);
  };

  const handleApplyFilters = () => {
    console.log('Apply Filters Debug:', {
      localFilters: JSON.stringify(localFilters, null, 2),
      selectedSkills,
      selectedInterests,
      originalFilters: JSON.stringify(filters, null, 2)
    });
    onFiltersChange(localFilters);
  };

  const handleClearFilters = () => {
    const clearedFilters = {
      min_cgpa: undefined,
      max_cgpa: undefined,
      semester: undefined,
      department_id: undefined,
      research_experience: undefined,
      student_id: undefined,
      skills: undefined,
      interests: undefined,
    };
    setLocalFilters(clearedFilters);
    setSelectedSkills([]);
    setSelectedInterests([]);
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-neutral-200/50 rounded-lg p-6 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Student ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Student ID
          </label>
          <Input
            type="text"
            placeholder="e.g., BL.SC.U4CSE24072"
            value={(localFilters as any).student_id || ''}
            onChange={(e) => handleFilterChange('student_id' as any, e.target.value || undefined)}
          />
          <p className="mt-1 text-xs text-gray-500">Exact match on student number</p>
        </div>
        {/* CGPA Range */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CGPA Range
          </label>
          <div className="flex space-x-2">
            <Input
              type="number"
              placeholder="Min"
              value={localFilters.min_cgpa || ''}
              onChange={(e) => handleFilterChange('min_cgpa', e.target.value ? parseFloat(e.target.value) : undefined)}
              min="0"
              max="10"
              step="0.1"
            />
            <Input
              type="number"
              placeholder="Max"
              value={localFilters.max_cgpa || ''}
              onChange={(e) => handleFilterChange('max_cgpa', e.target.value ? parseFloat(e.target.value) : undefined)}
              min="0"
              max="10"
              step="0.1"
            />
          </div>
        </div>

        {/* Attendance removed */}

        {/* Semester */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Semester
          </label>
          <select
            className="select-field"
            value={localFilters.semester || ''}
            onChange={(e) => handleFilterChange('semester', e.target.value ? parseInt(e.target.value) : undefined)}
          >
            <option value="" className="text-neutral-900">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <option key={sem} value={sem} className="text-neutral-900">
                Semester {sem}
              </option>
            ))}
          </select>
        </div>

        {/* Department */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Department
          </label>
          <select
            className="select-field"
            value={localFilters.department_id || ''}
            onChange={(e) => handleFilterChange('department_id', e.target.value || undefined)}
          >
            <option value="" className="text-neutral-900">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.department_id} value={dept.department_id} className="text-neutral-900">
                {dept.name} ({dept.code})
              </option>
            ))}
          </select>
        </div>

        {/* Research Experience */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Research Experience
          </label>
          <select
            className="select-field"
            value={localFilters.research_experience === undefined ? '' : localFilters.research_experience.toString()}
            onChange={(e) => handleFilterChange('research_experience', e.target.value === '' ? undefined : e.target.value === 'true')}
          >
            <option value="" className="text-neutral-900">All Students</option>
            <option value="true" className="text-neutral-900">With Research Experience</option>
            <option value="false" className="text-neutral-900">Without Research Experience</option>
          </select>
        </div>

        {/* Sort Options */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            className="select-field"
            value={`${filters.sort}:${filters.order}`}
            onChange={(e) => {
              const [sort, order] = e.target.value.split(':');
              onFiltersChange({ sort, order: order as 'ASC' | 'DESC' });
            }}
          >
            <option value="created_at:DESC" className="text-neutral-900">Newest First</option>
            <option value="created_at:ASC" className="text-neutral-900">Oldest First</option>
            <option value="cgpa:DESC" className="text-neutral-900">CGPA (High to Low)</option>
            <option value="cgpa:ASC" className="text-neutral-900">CGPA (Low to High)</option>
            <option value="first_name:ASC" className="text-neutral-900">Name (A to Z)</option>
            <option value="first_name:DESC" className="text-neutral-900">Name (Z to A)</option>
          </select>
        </div>
      </div>

      {/* Skills Filter */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Skills ({selectedSkills.length} selected)
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {skills.map((skill) => (
              <label key={skill.skill_id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedSkills.includes(skill.name)}
                  onChange={() => handleSkillToggle(skill.name)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 truncate" title={skill.name}>
                  {skill.name}
                </span>
              </label>
            ))}
          </div>
          {skills.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">No skills available</p>
          )}
        </div>
      </div>

      {/* Interests Filter */}
      <div className="mt-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Interests ({selectedInterests.length} selected)
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {interests.map((interest) => (
              <label key={interest.interest_id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedInterests.includes(interest.name)}
                  onChange={() => handleInterestToggle(interest.name)}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-700 truncate" title={interest.name}>
                  {interest.name}
                </span>
              </label>
            ))}
          </div>
          {interests.length === 0 && (
            <p className="text-sm text-gray-500 text-center py-2">No interests available</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 mt-6">
        <Button variant="secondary" onClick={handleClearFilters}>
          Clear All
        </Button>
        <Button onClick={handleApplyFilters}>
          Apply Filters
        </Button>
      </div>
    </div>
  );
};

export default StudentFiltersPanel;
