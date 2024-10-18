import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, theme, Button, Typography, Space, Avatar, Divider, Drawer } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  AccountBookOutlined,
  ScheduleOutlined,
  SettingOutlined,
  LogoutOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';
import { useUser } from '../contexts/UserContext';
import { clearUserData } from '../services/tokenManager';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { title, showBackButton } = useHeader();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { userInfo } = useUser();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      const smallScreen = window.innerWidth <= 768;
      setIsSmallScreen(smallScreen);
      if (smallScreen) {
        setCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    { key: '/pipelines', icon: <AccountBookOutlined />, label: 'Pipelines' },
    { key: '/schedules', icon: <ScheduleOutlined />, label: 'Schedules' },
    { key: '/settings', icon: <SettingOutlined />, label: 'Settings' },
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    clearUserData();
    navigate('/login');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const renderMenu = () => (
    <>
      <div style={{ 
        padding: '16px', 
        textAlign: 'center', 
        transition: 'all 0.3s',
        height: 'auto',
        minHeight: collapsed ? '80px' : '140px',
        overflow: 'hidden'
      }}>
        <Avatar 
          size={collapsed ? 48 : 64} 
          icon={<UserOutlined />} 
          src={userInfo?.avatar} 
          style={{ marginBottom: '8px' }}
        />
        {(!collapsed || drawerOpen) && (
          <>
            <Text strong style={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {userInfo?.username}
            </Text>
            <Text type="secondary" style={{ fontSize: '12px' }}>{userInfo?.roles_display}</Text>
          </>
        )}
      </div>
      <Divider style={{ margin: '0 0 8px 0' }} />
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems}
        onClick={({ key }) => {
          navigate(key);
          if (isSmallScreen) {
            setDrawerOpen(false);
          }
        }}
        style={{ borderRight: 0 }}
      />
      <Divider style={{ margin: '8px 0' }} />
      <Menu
        theme="light"
        mode="inline"
        selectable={false}
        style={{ borderRight: 0 }}
        items={[
          {
            key: 'logout',
            icon: <LogoutOutlined />,
            label: 'Logout',
            onClick: handleLogout,
          },
        ]}
      />
    </>
  );

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      {isSmallScreen ? (
        <Drawer
          placement="left"
          closable={false}
          onClose={toggleDrawer}
          open={drawerOpen}
          styles={{ body: { padding: 0 } }}
          width={200}
        >
          {renderMenu()}
        </Drawer>
      ) : (
        <Sider 
          trigger={null} 
          collapsible 
          collapsed={collapsed}
          style={{
            overflow: 'auto',
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            bottom: 0,
            zIndex: 1001,
            boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)',
          }}
          theme="light"
        >
          {renderMenu()}
        </Sider>
      )}
      <AntLayout style={{ marginLeft: isSmallScreen ? 0 : (collapsed ? 80 : 200), transition: 'all 0.2s' }}>
        <Header 
          style={{ 
            padding: '0 0px', 
            background: colorBgContainer, 
            position: 'fixed', 
            top: 0, 
            zIndex: 1000, 
            width: '100%',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,21,41,.08)',
          }}
        >
          <Space>
            <Button
              type="text"
              icon={isSmallScreen ? <MenuUnfoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
              onClick={isSmallScreen ? toggleDrawer : () => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
                borderRadius: '0%',
              }}
            />
            {showBackButton && (
              <Button onClick={handleBack}>
                Back
              </Button>
            )}
            <Text strong>{title}</Text>
          </Space>
        </Header>
        <Content
          style={{
            margin: '88px 16px 24px',
            padding: 24,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
            minHeight: 280,
          }}
        >
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
