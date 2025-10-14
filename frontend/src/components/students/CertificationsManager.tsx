import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { studentCertificationsApi, type Certification, type NewCertificationData } from '../../api/certifications.api';
import { Plus as PlusIcon, X as XMarkIcon } from 'lucide-react';

interface CertificationsManagerProps {
  studentId: string;
  certifications: Certification[];
}

const CertificationsManager: React.FC<CertificationsManagerProps> = ({ studentId, certifications }) => {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [org, setOrg] = useState('');

  const { data: certsResp } = useQuery({
    queryKey: ['student', studentId, 'certifications'],
    enabled: !!studentId,
    queryFn: async () => studentCertificationsApi.getStudentCertifications(studentId),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });
  const certs = certsResp?.data || certifications || [];

  const addMutation = useMutation({
    mutationFn: (data: NewCertificationData) => studentCertificationsApi.addCertificationToStudent(studentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'certifications'] });
      setIsAdding(false);
      setName('');
      setOrg('');
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to add certification';
      alert(message);
    },
  });

  const removeMutation = useMutation({
    mutationFn: (certId: string) => studentCertificationsApi.removeCertificationFromStudent(studentId, certId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId, 'certifications'] });
    },
    onError: (err: any) => {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Failed to remove certification';
      alert(message);
    },
  });

  const handleAdd = () => {
    if (!name.trim() || !org.trim()) return;
    addMutation.mutate({ name: name.trim(), issuing_organization: org.trim() });
  };

  return (
    <div>
      {/* List */}
      <div className="flex flex-wrap gap-2 mb-4">
        {certs.map((cert: any) => (
          <div key={cert.certification_id} className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-neutral-100 text-neutral-800 border border-neutral-200">
            <span className="font-medium mr-2">{cert.name}</span>
            <span className="text-neutral-600">{cert.issuing_organization}</span>
            <button
              className="ml-2 hover:text-error-600"
              onClick={() => removeMutation.mutate(cert.certification_id)}
              title="Remove"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>
        ))}
        {certs.length === 0 && (
          <p className="text-sm text-neutral-600">No certifications added yet.</p>
        )}
      </div>

      {/* Add */}
      {isAdding ? (
        <div className="space-y-3 p-4 border border-neutral-200 rounded-lg bg-white">
          <Input
            placeholder="Certification name (e.g., AWS Certified Cloud Practitioner)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder="Issuing organization (e.g., Amazon Web Services)"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
          />
          <div className="flex gap-2">
            <Button onClick={handleAdd} disabled={addMutation.isPending || !name || !org} className="btn-primary">
              {addMutation.isPending ? 'Adding...' : 'Add Certification'}
            </Button>
            <Button variant="ghost" onClick={() => { setIsAdding(false); setName(''); setOrg(''); }}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <Button onClick={() => setIsAdding(true)} leftIcon={<PlusIcon className="h-4 w-4" />}>Add Certification</Button>
      )}
    </div>
  );
};

export default CertificationsManager;