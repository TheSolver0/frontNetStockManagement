import React from 'react';
import { Button, Card, Checkbox, Col, Form, Input, message, Row, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const onFinish = async (values) => {
    const { email, password } = values;
    try {
      const loggedInUser = await login(email, password);
      message.success('Connexion réussie !');

      // Redirection dynamique selon le rôle
      if (loggedInUser?.role === 'Employe') {
        navigate('/produits');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Erreur de connexion.';
      message.error(msg);
      console.error('Erreur login :', error);
    }
  };

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
