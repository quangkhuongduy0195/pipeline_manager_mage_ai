import React, { useState, useEffect } from 'react';
import { Layout as AntLayout, Menu, theme, Button, Typography, Space, Avatar, Divider, Drawer, Form, Input, message, Card, Tag } from 'antd';
import {
  MenuUnfoldOutlined,
  MenuFoldOutlined,
  DashboardOutlined,
  AccountBookOutlined,
  LogoutOutlined,
  UserOutlined,
  TeamOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useHeader } from '../contexts/HeaderContext';
import { useUser } from '../contexts/UserContext';
import { clearUserData } from '../services/tokenManager';
import { updateUser } from '../services/api';
import PipelineHistories from './pipeline-histories';

const { Header, Sider, Content } = AntLayout;
const { Text } = Typography;

const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(true);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [form] = Form.useForm();
  // const [collapsed, setCollapsed] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { title, showBackButton } = useHeader();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const { userInfo } = useUser();
  const [isSmallScreen, setIsSmallScreen] = useState(window.innerWidth <= 768);
  const [isLoading, setIsLoading] = useState(false);

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
    { key: '/users', icon: <TeamOutlined />, label: 'Users' },
    {
      key: '/pipeline-histories',
      icon: <HistoryOutlined />,
      label: 'Pipeline Histories',
    },
  ];

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    clearUserData();
    navigate('/login');
  };

  const onCloseDrawer = () => {
    setDrawerVisible(false);
  };

  const onFinish = async (values: any) => {
    setIsLoading(true);
    try {
      await updateUser(userInfo!.id, {
        password: values.newPassword,
        password_confirmation: values.confirmPassword,
        password_current: values.currentPassword,
        email: userInfo!.email,
        username: userInfo!.username,
        first_name: userInfo!.first_name,
        last_name: userInfo!.last_name,
        avatar: userInfo!.avatar,
      });
      message.success('Password updated successfully');
      form.resetFields();
      setDrawerVisible(false);
    } catch (error) {
      message.error('Failed to update password');
    } finally {
      setIsLoading(false);
    }
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
        overflow: 'hidden',
        cursor: 'pointer',
      }}
      onClick={() => setDrawerVisible(!drawerVisible)}
    >
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
            <Text type="secondary" style={{ fontSize: '12px' }}>{userInfo?.first_name} {userInfo?.last_name}</Text>
          </>
        )}
      </div>
      <Divider style={{ margin: '0 0 8px 0' }} />
      <Menu
        theme="light"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems.filter(item => !(item.key === '/users' && userInfo?.owner === false))}
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
            {!isSmallScreen && <Text strong>{title}</Text>}
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
          {location.pathname === '/pipeline-histories' ? <PipelineHistories /> : <Outlet />}
        </Content>
      </AntLayout>
      <Drawer
        title={null}
        placement="right"
        onClose={onCloseDrawer}
        open={drawerVisible}
        width={400}
        styles={{
          body: { padding: 0, background: '#f0f2f5' }
        }}
      >
        <div style={{ 
          background: 'white', 
          padding: '32px 24px',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space>
              <Avatar size={64} src={userInfo?.avatar} icon={<UserOutlined />} />
              <div>
                <Typography.Title level={4} style={{ margin: 0 }}>
                  {`${userInfo?.first_name || ''} ${userInfo?.last_name || ''}`}
                </Typography.Title>
                <Typography.Text type="secondary">
                  @{userInfo?.username}
                </Typography.Text>
              </div>
            </Space>
          </Space>
        </div>

        <div style={{ padding: '24px' }}>
          <Card title="Roles" style={{ marginBottom: '24px' }}>
            {userInfo?.roles_new.map(role => {
              let color;
              switch (role.name.toLowerCase()) {
                case 'editor':
                  color = 'blue';
                  break;
                case 'viewer':
                  color = 'green';
                  break;
                case 'admin':
                  color = 'red';
                  break;
                case 'owner':
                  color = 'yellow';
                  break;
                default:
                  color = 'default';
              }
              return (
                <Tag color={color} key={role.name} style={{ margin: '4px' }}>
                  {role.name}
                </Tag>
              );
            })}
          </Card>

          <Card title="Change Password">
            <Form form={form} onFinish={onFinish} layout="vertical">
              <Form.Item
                name="currentPassword"
                rules={[{ required: true, message: 'Please input your current password!' }]}
              >
                <Input.Password placeholder="Current Password" />
              </Form.Item>
              <Form.Item
                name="newPassword"
                rules={[
                  { required: true, message: 'Please input your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters long' }
                ]}
              >
                <Input.Password placeholder="New Password" />
              </Form.Item>
              <Form.Item
                name="confirmPassword"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                  { required: true, message: 'Please confirm your new password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('The two passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password placeholder="Confirm New Password" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" block loading={isLoading}>
                  Update Password
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </div>
      </Drawer>
    </AntLayout>
  );
};

export default Layout;
