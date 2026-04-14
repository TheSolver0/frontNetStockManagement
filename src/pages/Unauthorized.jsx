import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Result } from 'antd';
import { useAuth } from '../contexts/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0f172a 0%, #2563eb 100%)',
      }}
    >
      <Result
        status="403"
        title="403"
        subTitle="Vous n'avez pas les droits nécessaires pour accéder à cette page."
        style={{ background: '#fff', borderRadius: 16, padding: '40px 48px' }}
        extra={
          <Button
            type="primary"
            onClick={() => navigate(isAuthenticated() ? '/dashboard' : '/login')}
          >
            {isAuthenticated() ? 'Retour au tableau de bord' : 'Se connecter'}
          </Button>
        }
      />
    </div>
  );
}
