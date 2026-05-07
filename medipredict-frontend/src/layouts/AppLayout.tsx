import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNavbar from '../components/layout/TopNavbar';
import BottomNavbar from '../components/layout/BottomNavbar';

interface AppLayoutProps {
  title?: string;
}

const AppLayout: React.FC<AppLayoutProps> = ({ title }) => {
  return (
    <div className="min-h-screen pb-32">
      <TopNavbar title={title} />
      <main className="pt-20 px-6 max-w-5xl mx-auto">
        <Outlet />
      </main>
      <BottomNavbar />
    </div>
  );
};

export default AppLayout;
