import { Outlet } from 'react-router-dom';
import SupaBaseNavbar from './SupaBasenavabar';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-50 pt-0">
      <SupaBaseNavbar />
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 mt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;