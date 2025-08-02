import React from 'react';
import { Outlet } from 'react-router-dom';
import { IntranetGuard } from '../../components/guards/IntranetGuard';

export const AdminLayoutWrapper: React.FC = () => {
  return (
    <IntranetGuard>
      <Outlet />
    </IntranetGuard>
  );
}; 