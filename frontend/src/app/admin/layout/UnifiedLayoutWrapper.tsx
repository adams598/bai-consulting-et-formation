import React from 'react';
import { UnifiedLayout } from '../../../features/admin/components/UnifiedLayout';
import { RoleBasedRouter } from '../../../components/routing/RoleBasedRouter';

export const UnifiedLayoutWrapper: React.FC = () => {
  return (
    <RoleBasedRouter>
      <UnifiedLayout />
    </RoleBasedRouter>
  );
};
