import React, { useState } from 'react';
import { Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (values: any) => {
    setLoading(true);
    try {
      // In a real app, you would call an API here
      console.log('Login values:', values);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      message.success('登录成功');
      navigate('/landmarks');
    } catch (error) {
      message.error('登录失败，请稍后再试');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="login-container">
        <div className="login-header">
          <h2>都市客厅研学助手</h2>
          <p style={{ color: '#666' }}>虹口区中小学研学项目智能辅助平台</p>
        </div>
        
        <Form form={form} onFinish={handleSubmit}>
          <Form.Item 
            name="username" 
            rules={[{ required: true, message: '请输入用户名' }]}
            className="login-form-item"
          >
            <Input placeholder="用户名" className="login-input" />
          </Form.Item>
          
          <Form.Item 
            name="password" 
            rules={[{ required: true, message: '请输入密码' }]}
            className="login-form-item"
          >
            <Input.Password placeholder="密码" className="login-input" />
          </Form.Item>
          
          <Form.Item className="login-form-item">
            <Button 
              type="primary" 
              htmlType="submit" 
              className="button login-button"
              loading={loading}
            >
              登录
            </Button>
          </Form.Item>
        </Form>
        
        <div className="login-links">
          <a href="#">注册新账户</a>
          <span>|</span>
          <a href="#">忘记密码</a>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 