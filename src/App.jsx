import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UploadOutlined,
  DashboardOutlined,
  UserOutlined,
  TransactionOutlined,
  CopyOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  DownloadOutlined,
  TagsOutlined,
  LogoutOutlined,
  WarningOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme, Typography, Card, Col, Row, Flex, Spin, Avatar, Space, Popconfirm, message, Drawer, Grid } from 'antd';
import { Produits } from './pages/Produits';
import { Clients } from './pages/Clients';
import { CommandesClients } from './pages/CommandesClients';
import { CommandesFournisseurs } from './pages/CommandesFournisseurs';
import { Fournisseurs } from './pages/Fournisseurs';
import { Transactions } from './pages/Transactions';
import { Dashboard } from './pages/Dashboard';
import { EditProduit } from './pages/EditProduit';
import { EditClient } from './pages/EditClient';
import { EditFournisseur } from './pages/EditFournisseur';
import { EditCommandeClient } from './pages/EditCommandeClient';
import { EditCommandeFournisseur } from './pages/EditCommandeFournisseur';
import { Parametres } from './pages/Parametres';
import { getMouvements, getCommandesClient, getCommandesFournisseur, getProduits } from "./services/api";
import Login from './pages/Login';
import axiosInstance from './services/axiosInstance';
import PrivateRoute from './components/PrivateRoute';


const { Header, Sider, Content } = Layout;

const App = () => (
  <RouterProvider router={createBrowserRouter([
    { path: '/login', element: <Login /> },
    {
      path: '/',
      element: <PrivateRoute><Root /></PrivateRoute>,
      children: [
        { path: '/dashboard', element: <Dashboard /> },
        { path: '/produits', element: <Produits /> },
        { path: '/produit/:id', element: <EditProduit /> },
        { path: '/clients', element: <Clients /> },
        { path: '/client/:id', element: <EditClient /> },
        { path: '/transactions', element: <Transactions /> },
        { path: '/fournisseurs', element: <Fournisseurs /> },
        { path: '/fournisseur/:id', element: <EditFournisseur /> },
        { path: '/commandesfournisseurs', element: <CommandesFournisseurs /> },
        { path: '/commandefournisseurs/:id', element: <EditCommandeFournisseur /> },
        { path: '/commandesclients', element: <CommandesClients /> },
        { path: '/commandeclients/:id', element: <EditCommandeClient /> },
        { path: '/parametres', element: <Parametres /> },
      ],
    }
  ])} />
);

function Root() {
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const [produits, setProduits] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [commandesF, setCommandesF] = useState([]);
  const [mouvements, setMouvements] = useState([]);

  const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1500);
    const fetchData = async () => {
      try {
        const [mouvementsData, produitsData, commandesClientData, commandesFournisseurData] = await Promise.all([
          getMouvements(),
          getProduits(),
          getCommandesClient(),
          getCommandesFournisseur(),
        ]);
        setMouvements(mouvementsData);
        setProduits(produitsData);
        setCommandes(commandesClientData);
        setCommandesF(commandesFournisseurData);
      } catch (error) {
        console.error("Failed to fetch initial data", error);
        message.error("Erreur lors de la récupération des données.");
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const totalVentes = commandes.filter(c => c.status === 'LIVREE').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    const produitsCritiques = produits.filter(p => p.quantity <= p.threshold).length;
    const mouvementsMois = mouvements.filter(m => new Date(m.created_at).getMonth() === new Date().getMonth()).length;
    return { totalVentes, produitsCritiques, mouvementsMois };
  }, [commandes, produits, mouvements]);

  const totalEntrees = useMemo(() => commandes.filter(c => c.status === 'LIVREE').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0), [commandes]);
  const totalSorties = useMemo(() => commandesF.filter(c => c.status === 'LIVREE').reduce((sum, c) => sum + parseFloat(c.amount || 0), 0), [commandesF]);
  const totalGain = useMemo(() => totalEntrees - totalSorties, [totalEntrees, totalSorties]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      await axiosInstance.post('/auth/logout/', { refresh: refreshToken });
      localStorage.clear();
      message.success("Déconnexion réussie !");
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
      message.error("La déconnexion a échoué.");
    }
  };
  
  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <NavLink to="/dashboard">Dashboard</NavLink> },
    { key: '/produits', icon: <TagsOutlined />, label: <NavLink to="/produits">Produits</NavLink> },
    { key: '/clients', icon: <UserOutlined />, label: <NavLink to="/clients">Clients</NavLink> },
    { key: '/transactions', icon: <TransactionOutlined />, label: <NavLink to="/transactions">Transactions</NavLink> },
    { key: '/fournisseurs', icon: <UserSwitchOutlined />, label: <NavLink to="/fournisseurs">Fournisseurs</NavLink> },
    {
      key: 'commandes', icon: <CopyOutlined />, label: 'Commandes',
      children: [
        { key: '/commandesfournisseurs', label: <NavLink to="/commandesfournisseurs">Fournisseurs</NavLink> },
        { key: '/commandesclients', label: <NavLink to="/commandesclients">Clients</NavLink> },
      ],
    },
    ...(user?.is_superuser ? [{ key: '/parametres', icon: <SettingOutlined />, label: <NavLink to="/parametres">Paramètres</NavLink> }] : []),
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {screens.lg ? (
        <Sider trigger={null} collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg" collapsedWidth="80">
          <div className="logo-container">
            <img src="/web-programming.png" alt="Logo" style={{ width: collapsed ? '40px' : '80px' }} />
          </div>
          <Menu theme="light" mode="inline" selectedKeys={[location.pathname]} items={menuItems} />
        </Sider>
      ) : null}
      <Layout>
        <Header style={{ padding: '0 16px', background: colorBgContainer, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
          <Button
            type="text"
            icon={screens.lg ? (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />) : <MenuFoldOutlined />}
            onClick={() => screens.lg ? setCollapsed(!collapsed) : setDrawerVisible(true)}
            style={{ fontSize: '18px', width: 56, height: 56 }}
            aria-label="Navigation"
          />
          <Space align="center">
            <Avatar size="large" icon={<UserOutlined />} />
            <Typography.Text className="username-text">Bonjour, {user?.username || 'Admin'}</Typography.Text>
            <Popconfirm title="Voulez-vous vraiment vous déconnecter ?" onConfirm={handleLogout} okText="Oui" cancelText="Non">
              <Button type="primary" danger icon={<LogoutOutlined />}>
                Déconnexion
              </Button>
            </Popconfirm>
          </Space>
        </Header>

        {/* Mobile Drawer navigation */}
        <Drawer
          open={drawerVisible}
          onClose={() => setDrawerVisible(false)}
          placement="left"
          bodyStyle={{ padding: 0 }}
          className="mobile-drawer"
        >
          <div className="logo-container" style={{ padding: '16px' }}>
            <img src="/web-programming.png" alt="Logo" style={{ width: '72px' }} />
          </div>
          <Menu theme="light" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={() => setDrawerVisible(false)} />
        </Drawer>

        <Content style={{ margin: '24px 16px', padding: 24, background: 'var(--body-bg-color)' }}>
          <div style={{ marginBottom: 24 }}>
            
            
          </div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '50px' }}><Spin size="large" /></div>
          ) : (
            <div className="main-container">
              <Outlet />
            </div>
          )}
        </Content>
      </Layout>
    </Layout>
  );
}

export default App;
