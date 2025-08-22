import React from 'react';
import { IntranetGuard } from '../../components/guards/IntranetGuard';
import { AdminLayout } from '../../features/admin/components/AdminLayout';

export const AdminLayoutWrapper: React.FC = () => {
  return (
    <IntranetGuard>
      <AdminLayout />
    </IntranetGuard>
  );
}; 