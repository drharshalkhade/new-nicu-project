import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { Activity, Users, BarChart3, BookOpen, Settings, } from 'lucide-react'
import { useRoleBasedAccess } from '../../hooks/useRoleBasedAccess'
import { signOutAction } from '../../store/user/userThunk'
import { useState } from 'react'
import { Layout, Menu, Dropdown, Avatar, Button, Space, Typography } from 'antd'
import { LogoutOutlined, MenuOutlined, CloseOutlined } from '@ant-design/icons'

const SupaBaseNavbar = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const [menuOpen, setMenuOpen] = useState(false)

  // Add custom styles for navbar components
  React.useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      /* Override Ant Design Header default line-height */
      .ant-layout-header {
        line-height: normal !important;
        height: auto !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
      }
      
      /* Specific override for the problematic class */
      :where(.css-dev-only-do-not-override-7t2xvq).ant-layout-header {
        line-height: normal !important;
        height: auto !important;
        padding: 0 !important;
        display: flex !important;
        align-items: center !important;
      }
      
      /* Additional overrides for any other Ant Design Header classes */
      .ant-layout-header,
      .ant-layout-header * {
        line-height: normal !important;
      }
      
      .ant-menu-horizontal {
        border-bottom: none !important;
        line-height: 1 !important;
      }
      
      .ant-menu-horizontal > .ant-menu-item,
      .ant-menu-horizontal > .ant-menu-submenu {
        padding: 0 12px !important;
        margin: 0 4px !important;
      }
      
      .ant-menu-horizontal > .ant-menu-item > a,
      .ant-menu-horizontal > .ant-menu-submenu > a {
        color: rgba(255, 255, 255, 0.85) !important;
      }
      
      .ant-menu-horizontal > .ant-menu-item-selected > a,
      .ant-menu-horizontal > .ant-menu-submenu-selected > a {
        color: #ffffff !important;
      }
      
      .ant-menu-horizontal > .ant-menu-item:hover > a,
      .ant-menu-horizontal > .ant-menu-submenu:hover > a {
        color: #ffffff !important;
      }
      
      .user-dropdown .ant-dropdown-menu {
        min-width: 160px;
      }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

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

  const { Header } = Layout;
  const { Text, Title } = Typography;

  // User dropdown menu items
  const userMenuItems = [
    {
      key: 'profile',
      label: (
        <div className="px-2 py-1">
          <div className="font-medium text-gray-900">{userDetails?.name}</div>
          <div className="text-xs text-gray-500 capitalize">
            {userDetails?.role === 'hospital_admin' ? 'Admin' : userDetails?.role?.replace('_', ' ')}
          </div>
        </div>
      ),
      disabled: true,
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: (
        <Space>
          <LogoutOutlined />
          <span>Logout</span>
        </Space>
      ),
      onClick: handleSignOut,
      danger: true,
    },
  ];

  // Navigation menu items
  const navigationItems = navItems.map((item) => ({
    key: item.path,
    label: (
      <Link to={item.path} className="flex items-center gap-2">
        {getIconForPath(item.path)}
        <span>{item.label}</span>
      </Link>
    ),
    className: location.pathname === item.path ? 'ant-menu-item-selected' : '',
  }));

  return (
    <Header className="bg-blue-800 border-b border-blue-700 shadow-sm sticky top-0 z-50 px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between overflow-hidden">

      {/* Logo Section - Fixed width */}
      <div className="flex-shrink-0">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg flex-shrink-0">
            <Activity className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
          </div>
          <div className="hidden sm:block min-w-0">
            <Title level={4} className="!mb-0 !text-base sm:!text-lg !text-white truncate">NICU Audit</Title>
            <Text className="!text-blue-200 !text-xs truncate">Powered by Supabase</Text>
          </div>
          <div className="sm:hidden">
            <Title level={5} className="!mb-0 !text-sm !text-white">NICU</Title>
          </div>
        </Link>
      </div>

      {/* Desktop Navigation - Flexible but constrained */}
      <div className="hidden sm:block flex-1 mx-4 lg:mx-8 min-w-0">
        <Menu
          mode="horizontal"
          selectedKeys={[location.pathname]}
          items={navigationItems}
          className="border-0 justify-center bg-transparent"
          theme="dark"
        />
      </div>

      {/* Right Section - Fixed width */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* User Dropdown */}
        <Dropdown
          menu={{ items: userMenuItems }}
          placement="bottomRight"
          trigger={['click']}
          overlayClassName="user-dropdown"
        >
          <div className="cursor-pointer flex items-center gap-2">
            <div className="hidden sm:block text-right min-w-0">
              <div className="font-medium text-white truncate max-w-32 lg:max-w-40">{userDetails?.name}</div>
            </div>
            <Avatar
              size={{ xs: 28, sm: 32 }}
              style={{
                backgroundColor: userDetails?.role === 'super_admin'
                  ? '#dc2626'
                  : userDetails?.role === 'hospital_admin'
                    ? '#2563eb'
                    : userDetails?.role === 'auditor'
                      ? '#16a34a'
                      : '#6b7280'
              }}
            >
              {userDetails?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </div>
        </Dropdown>

        {/* Mobile Menu Toggle */}
        <Button
          type="text"
          icon={menuOpen ? <CloseOutlined /> : <MenuOutlined />}
          onClick={() => setMenuOpen(!menuOpen)}
          className="sm:hidden text-white hover:text-blue-200 flex-shrink-0"
        />
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="absolute top-full left-0 right-0 bg-blue-800 border-t border-blue-700 shadow-lg sm:hidden z-40">
          <Menu
            mode="vertical"
            selectedKeys={[location.pathname]}
            items={navigationItems}
            onClick={() => setMenuOpen(false)}
            className="border-0 bg-transparent"
            theme="dark"
          />
        </div>
      )}
    </Header>
  )
}

export default SupaBaseNavbar;
