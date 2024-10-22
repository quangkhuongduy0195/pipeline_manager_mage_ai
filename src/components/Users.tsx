import React, { useState, useEffect } from 'react';
import { Table, Button, Space, Modal, Form, Input, Select, message, Avatar, Tag, Popconfirm, Spin, Card, Col, Row } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, UserOutlined, CalendarOutlined, MailOutlined, TagOutlined } from '@ant-design/icons';
import { fetchUsers, updateUser, createUser, deleteUser } from '../services/api';
import { useUser } from '../contexts/UserContext';

const { Option } = Select;

interface Permission {
  access: number;
  created_at: string;
  entity: string;
  entity_id: number | null;
  entity_name: string | null;
  entity_type: string | null;
  id: number;
  updated_at: string;
}

interface Role {
  created_at: string;
  id: number;
  name: string;
  permissions: Permission[];
  updated_at: string;
}

interface User {
  id: number;
  avatar: string | null;
  email: string;
  first_name: string | null;
  last_name: string;
  owner: boolean;
  roles_display: string;
  roles_new: Role[];
  username: string;
  created_at: string;
  updated_at: string;
}

interface UserData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  password_current?: string;
  role_ids?: number[];
}

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { userInfo } = useUser();
  const [viewMode, setViewMode] = useState<'table' | 'card'>('card');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchUsers();
      setUsers(data.users);
    } catch (error) {
      message.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrUpdate = async (values: any) => {
    setSubmitting(true);
    try {
      const userData: UserData = {
        first_name: values.first_name,
        last_name: values.last_name,
        username: values.username,
        email: values.email,
      };

      if (editingUserId) {
        // Khi cập nhật, thêm role_ids vào userData
        userData.role_ids = values.roles.map((role: string) => {
          switch (role) {
            case 'Admin': return 2;
            case 'Editor': return 3;
            case 'Viewer': return 4;
            case 'Owner': return 1;
            default: return 0;
          }
        });
        
        userData.password = values.password;
        userData.password_confirmation = values.confirmPassword;
        // Nếu đang chỉnh sửa user hiện tại và có nhập mật khẩu mới
        if (editingUserId === userInfo?.id && values.password) {
          userData.password_current = values.currentPassword;
        }
        
        await updateUser(editingUserId, userData);
        message.success('User updated successfully');
      } else {
        // Khi tạo mới
        userData.password = values.password;
        userData.password_confirmation = values.confirmPassword;
        await createUser(userData);
        message.success('User created successfully');
      }
      
      loadUsers(); // Reload the user list
    } catch (error) {
      console.error('Error creating/updating user:', error);
      message.error('Failed to create/update user');
    } finally {
      setSubmitting(false);
      setModalVisible(false);
      form.resetFields();
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser(id);
      message.success('User deleted successfully');
      loadUsers(); // Reload the user list
    } catch (error) {
      console.error('Error deleting user:', error);
      message.error('Failed to delete user');
    }
  };

  const getRoleColor = (roleName: string) => {
    switch (roleName) {
      case 'Owner':
        return 'gold';
      case 'Admin':
        return 'red';
      case 'Editor':
        return 'blue';
      case 'Viewer':
        return 'green';
      default:
        return 'default';
    }
  };

  const getRoleDisplay = (user: User) => {
    if (user.owner) {
      return <Tag color={getRoleColor('Owner')}>Owner</Tag>;
    }
    return user.roles_new.map(role => (
      <Tag color={getRoleColor(role.name)} key={role.id}>{role.name}</Tag>
    ));
  };

  const columns = [
    {
      title: 'Avatar',
      dataIndex: 'avatar',
      key: 'avatar',
      render: (avatar: string | null) => (
        <Avatar src={avatar} icon={<UserOutlined />} />
      ),
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Name',
      key: 'name',
      render: (_: string, record: User) => (
        `${record.first_name || ''} ${record.last_name || ''}`.trim() || 'N/A'
      ),
    },
    {
      title: 'Roles',
      key: 'roles',
      render: (_: string, record: User) => getRoleDisplay(record),
    },
    {
      title: 'Created At',
      dataIndex: 'created_at',
      key: 'created_at',
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: string, record: User) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => {
            setEditingUserId(record.id);
            form.setFieldsValue({
              ...record,
              roles: record.roles_new.map(role => role.name)
            });
            setModalVisible(true);
          }}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to delete this user?"
            onConfirm={() => handleDelete(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button icon={<DeleteOutlined />} danger>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card
      hoverable
      style={{ marginBottom: 16 }}
      actions={[
        <Button icon={<EditOutlined />} onClick={() => {
          setEditingUserId(user.id);
          form.setFieldsValue({
            ...user,
            roles: user.roles_new.map(role => role.name)
          });
          setModalVisible(true);
        }}>
          Edit
        </Button>,
        <Popconfirm
          title="Are you sure you want to delete this user?"
          onConfirm={() => handleDelete(user.id)}
          okText="Yes"
          cancelText="No"
        >
          <Button icon={<DeleteOutlined />} danger>
            Delete
          </Button>
        </Popconfirm>
      ]}
    >
      <Card.Meta
        avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
        title={user.username}
        description={
          <>
            <p><UserOutlined /> {`${user.first_name || ''} ${user.last_name || ''}`.trim() || 'N/A'}</p>
            <p><MailOutlined /> {user.email}</p>
            <p><CalendarOutlined /> Created at: {user.created_at}</p>
            <div><TagOutlined /> {getRoleDisplay(user)}</div>
          </>
        }
      />
    </Card>
  );

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingUserId(null);
            form.resetFields();
            setModalVisible(true);
          }}
        >
          Create User
        </Button>
        {/* <Button onClick={() => setViewMode(viewMode === 'table' ? 'card' : 'table')}>
          {viewMode === 'table' ? 'Xem dạng thẻ' : 'Xem dạng bảng'}
        </Button> */}
      </Space>

      {viewMode === 'table' ? (
        <Table columns={columns} dataSource={users} loading={loading} rowKey="id" />
      ) : (
        <Row gutter={[16, 16]}>
          {users.map(user => (
            <Col xs={24} sm={12} md={8} lg={6} key={user.id}>
              <UserCard user={user} />
            </Col>
          ))}
        </Row>
      )}

      <Modal
        title={editingUserId ? "Edit User" : "Create User"}
        open={modalVisible}
        onOk={form.submit}
        onCancel={() => setModalVisible(false)}
        confirmLoading={submitting}
      >
        <Spin spinning={submitting}>
          <Form form={form} onFinish={handleCreateOrUpdate} layout="vertical">
            <Form.Item name="username" label="Username" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
              <Input />
            </Form.Item>
            {editingUserId === userInfo?.id && (
              <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: false, message: 'Please input your current password if you want to change your password!' }]}
              >
                <Input.Password />
              </Form.Item>
            )}
            <Form.Item
              name="password"
              label={editingUserId ? "New Password (leave blank if no change)" : "Password"}
              rules={[
                { required: !editingUserId, message: 'Please input the password!' },
                { min: 6, message: 'Password must be at least 6 characters long' }
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item
              name="confirmPassword"
              label={editingUserId ? "Confirm New Password" : "Confirm Password"}
              dependencies={['password']}
              hasFeedback
              rules={[
                { required: !editingUserId, message: 'Please confirm the password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password />
            </Form.Item>
            <Form.Item name="first_name" label="First Name">
              <Input />
            </Form.Item>
            <Form.Item name="last_name" label="Last Name">
              <Input />
            </Form.Item>
            {editingUserId && (
              <Form.Item name="roles" label="Roles" rules={[{ required: true, type: 'array', min: 1, message: 'Please select at least one role' }]}>
                <Select mode="multiple" placeholder="Select roles">
                  <Option value="Viewer">Viewer</Option>
                  <Option value="Editor">Editor</Option>
                  <Option value="Admin">Admin</Option>
                  <Option value="Owner">Owner</Option>
                </Select>
              </Form.Item>
            )}
          </Form>
        </Spin>
      </Modal>
    </div>
  );
};

export default Users;
