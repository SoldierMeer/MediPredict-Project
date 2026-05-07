import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Pill, BarChart3, Users, Settings, History } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { cn } from '../../utils/cn';

const BottomNavbar: React.FC = () => {
  const { role } = useUser();

  // ✅ Updated: Added History and reorganized for better flow
  const patientTabs = [
    { name: 'Home', path: '/patient/home', icon: Home },
    { name: 'Meds', path: '/patient/medications', icon: Pill },
    { name: 'History', path: '/patient/history', icon: History }, // Added History
    { name: 'Insights', path: '/patient/insights', icon: BarChart3 },
    { name: 'Caregiver', path: '/patient/caregiver', icon: Users },
    { name: 'Settings', path: '/patient/settings', icon: Settings },
  ];

  const caregiverTabs = [
    { name: 'Dashboard', path: '/caregiver/dashboard', icon: Home },
    { name: 'Meds', path: '/caregiver/medications', icon: Pill },
    { name: 'History', path: '/caregiver/history', icon: History },
    { name: 'Insights', path: '/caregiver/insights', icon: BarChart3 },
    { name: 'Settings', path: '/caregiver/settings', icon: Settings },
  ];

  const tabs = role === 'patient' ? patientTabs : caregiverTabs;

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white/98 backdrop-blur-lg border-t border-gray-100 rounded-t-3xl shadow-[0_-4px_20px_rgba(37,99,235,0.08)]">
      {/* 💡 Note: Using h-20 and px-2 to accommodate 6 items for patients */}
      <div className="flex justify-around items-center w-full h-20 pb-safe px-2 max-w-5xl mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            className={({ isActive }) => cn(
              "flex flex-col items-center justify-center transition-all duration-200 ease-out active:scale-90 flex-1",
              isActive ? "text-primary font-semibold" : "text-gray-400 hover:text-primary/70"
            )}
          >
            {({ isActive }) => (
              <>
                <tab.icon className={cn("w-5 h-5 sm:w-6 sm:h-6", isActive && "fill-current")} />
                <span className="text-[10px] sm:text-[11px] mt-1 font-medium text-center truncate w-full px-1">
                  {tab.name}
                </span>
                {isActive && (
                   <span className="w-1 h-1 bg-primary rounded-full mt-0.5" />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavbar;