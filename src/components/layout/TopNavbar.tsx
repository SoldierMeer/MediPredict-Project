import React from 'react';
import { Bell } from 'lucide-react';
import { useUser } from '../../context/UserContext';
import { cn } from '../../utils/cn';

interface TopNavbarProps {
  title?: string;
  showAvatar?: boolean;
}

const TopNavbar: React.FC<TopNavbarProps> = ({ title = "MediPredict", showAvatar = true }) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm flex items-center justify-between px-6 py-4 h-16">
      <div className="flex items-center gap-3">
        {showAvatar && (
          <div className="w-8 h-8 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-primary/20">
            <img 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCgRG9xfhJWJo3QbRsy0Yl_Pm59Ra79DiOlsNuHoomF5EiuiIb42vcWhGTSJKlhf5TLJIOem3QSNVKOGK45oGsYbn4zO9cRPPkjyINvfBlCOzaa0tdN2b2RljgygdFj7v2VsTaZgnACTlwrM4gZGNEKocPjAkCNMQn_cEXsq8zdLEEvvD1fzValZywVmPEhyOFQ0eZwPmyMy80sh8BMfpj4wr_l8L6kO2NP_JDD82J8jZQh5KXhU98H9PA1IVu60K3VtR1xDRqF8Rw" 
              alt="Profile" 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        <h1 className="text-xl font-extrabold text-primary tracking-tight font-display antialiased">
          {title}
        </h1>
      </div>
      <button className="p-2 rounded-full hover:bg-gray-50 transition-all active:scale-95">
        <Bell className="w-6 h-6 text-gray-500" />
      </button>
    </header>
  );
};

export default TopNavbar;
