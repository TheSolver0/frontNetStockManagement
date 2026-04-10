﻿import React from 'react';
import { Button, Card, Checkbox, Col, Form, Input, message, Row, Typography } from 'antd';
import axios from 'axios';
import { API_URL } from '../services/api';
import axiosInstance from '../services/axiosInstance';

const loginUrl = `${API_URL}auth/login`;

const onFinish = async (values) => {
  const { email, password } = values;

  try {
    const response = await axiosInstance.post('auth/login', { email, password });
    
    console.log('Réponse complète:', response.data); //  debug

    const { success, token, refresh, user, message: msg } = response.data;

    if (!success || !token) {
      message.error(msg || 'Connexion échouée.');
      return;
    }

    localStorage.setItem('accessToken', token);
    if (refresh) localStorage.setItem('refreshToken', refresh);
    if (user) localStorage.setItem('user', JSON.stringify(user));

    message.success(msg || 'Connexion réussie !');
    window.location.href = '/dashboard';

  } catch (error) {
    const msg = error.response?.data?.message || 'Erreur de connexion.';
    message.error(msg);
    console.error('Erreur:', error.response?.data);
  }
};

const onFinishFailed = (errorInfo) => {
  console.log('Failed:', errorInfo);
};

const Login = () => {
  const pageStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
  };

  const cardStyle = {
    width: '100%',
    maxWidth: 440,
    borderRadius: 24,
    boxShadow: '0 20px 60px rgba(15, 23, 42, 0.25)',
  };

  return (
    <div style={pageStyle}>
      <Card style={cardStyle} bodyStyle={{ padding: '40px 32px' }}>
        <Row justify="center" style={{ marginBottom: 24 }}>
          <Col span={24} style={{ textAlign: 'center' }}>
            <Typography.Title level={2} style={{ margin: 0 }}>
              Connexion
            </Typography.Title>
            <Typography.Text type="secondary">
              Accédez à votre espace de gestion de stock.
            </Typography.Text>
          </Col>
        </Row>

        <Form
          name="login"
          layout="vertical"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          onFinishFailed={onFinishFailed}
          autoComplete="off"
        >
          <Form.Item
            label="Email"
            name="email"
            rules={[{ required: true, message: 'Veuillez entrer votre email !' }]}
          >
            <Input size="large" />
          </Form.Item>

          <Form.Item
            label="Mot de passe"
            name="password"
            rules={[{ required: true, message: 'Veuillez entrer votre mot de passe !' }]}
          >
            <Input.Password size="large" />
          </Form.Item>

          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>Se souvenir de moi</Checkbox>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" size="large" block>
              Accéder à la plateforme
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
