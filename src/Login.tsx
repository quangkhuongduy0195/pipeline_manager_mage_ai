import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Layout, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { login } from './services/api';
import { saveToken, isTokenValid, saveUserInfo } from './services/tokenManager';
import { motion } from 'framer-motion';
import { useUser } from './contexts/UserContext';

const { Title, Text } = Typography;
const { Content } = Layout;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { setUserInfo } = useUser();

  useEffect(() => {
    if (isTokenValid()) {
      navigate('/pipelines');
    }
  }, [navigate]);

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    try {
      const response = await login(values.email, values.password);
      if (response.session && response.session.token && response.session.expires) {
        saveToken(response.session.token, response.session.expires);
        saveUserInfo(response.session.user);
        setUserInfo(response.session.user);
        message.success('Đăng nhập thành công!');
        navigate('/pipelines');
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      message.error('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #1890ff 0%, #722ed1 100%)' }}>
      <Content style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card 
            style={{ 
              width: 400, 
              boxShadow: '0 4px 8px rgba(0,0,0,0.1)', 
              borderRadius: '15px',
              background: 'rgba(255, 255, 255, 0.9)',
            }}
          >
            <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <LoginOutlined style={{ fontSize: '48px', color: '#1890ff' }} />
              </motion.div>
              <Title level={2} style={{ marginBottom: 0 }}>Đăng nhập</Title>
              <Text type="secondary">Chào mừng bạn đến với hệ thống quản lý Pipeline</Text>
              <Form
                name="normal_login"
                initialValues={{ remember: true }}
                onFinish={onFinish}
                style={{ textAlign: 'left' }}
              >
                <Form.Item
                  name="email"
                  rules={[
                    { required: true, message: 'Vui lòng nhập email!' },
                    { type: 'email', message: 'Email không hợp lệ!' }
                  ]}
                >
                  <Input prefix={<UserOutlined />} placeholder="Email" size="large" />
                </Form.Item>
                <Form.Item
                  name="password"
                  rules={[
                    { required: true, message: 'Vui lòng nhập mật khẩu!' },
                    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
                  ]}
                >
                  <Input.Password
                    prefix={<LockOutlined />}
                    placeholder="Mật khẩu"
                    size="large"
                  />
                </Form.Item>
                <Form.Item>
                  <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading} size="large">
                    Đăng nhập
                  </Button>
                </Form.Item>
              </Form>
            </Space>
          </Card>
        </motion.div>
      </Content>
    </Layout>
  );
};

export default Login;
