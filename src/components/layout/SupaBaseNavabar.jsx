import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Activity, Users, BarChart3, BookOpen, Settings, LogOut, Menu as MenuIcon, X } from 'lucide-react'
import { useRoleBasedAccess } from '../../hooks/useROleBasedAccess'
import { signOutAction } from '../../store/user/userThunk'
import { useState } from 'react'

const SupaBaseNavbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const userDetails = useSelector((state) => state.user.userDetails)
  const { getNavigationItems } = useRoleBasedAccess()
  const navItems = getNavigationItems()

  const handleSignOut = () => {
    dispatch(signOutAction())
    navigate('/sign-in')
  }

  const getIconForPath = (path) => {
    switch (path) {
      case '/dashboard': return <BarChart3 size={18} />
      case '/audit': return <Activity size={18} />
      case '/reports': return <BarChart3 size={18} />
      case '/education': return <BookOpen size={18} />
      case '/users': return <Users size={18} />
      case '/settings': return <Settings size={18} />
      default: return <Activity size={18} />
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Activity className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="text-lg font-bold">NICU Audit</div>
            <div className="text-xs text-gray-500">Powered by Supabase</div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex gap-6">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1 text-sm font-medium ${
                location.pathname === item.path ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {getIconForPath(item.path)}
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center gap-4 relative">
          {/* User Dropdown */}
          <div
            className="cursor-pointer flex items-center gap-2 relative"
            onClick={() => setDropdownOpen((prev) => !prev)}
            onMouseEnter={() => setDropdownOpen(true)}
          >
            <div className="hidden md:block text-sm text-right">
              <div className="font-medium text-gray-900">{userDetails?.name}</div>
            </div>
            <div
              className={`h-8 w-8 flex items-center justify-center rounded-full text-white ${
                userDetails?.role === 'super_admin'
                  ? 'bg-red-600'
                  : userDetails?.role === 'admin'
                  ? 'bg-blue-600'
                  : userDetails?.role === 'auditor'
                  ? 'bg-green-600'
                  : 'bg-gray-500'
              }`}
            >
              {userDetails?.name?.charAt(0).toUpperCase()}
            </div>

            {dropdownOpen && (
              <div className="absolute right-0 top-12 w-40 bg-white border rounded shadow-md z-50">
                <div className="px-4 py-2 text-sm capitalize border-b">
                  {userDetails?.role?.replace('_', ' ')}
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <LogOut size={14} className="mr-2" /> Logout
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={24} /> : <MenuIcon size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white px-4 py-2 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block text-sm font-medium ${
                location.pathname === item.path ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setMenuOpen(false)}
            >
              <div className="flex items-center gap-2">
                {getIconForPath(item.path)}
                <span>{item.label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </header>
  )
}

export default SupaBaseNavbar
