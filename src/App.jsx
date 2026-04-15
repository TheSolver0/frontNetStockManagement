import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  DashboardOutlined,
  UserOutlined,
  TransactionOutlined,
  CopyOutlined,
  UserSwitchOutlined,
  SettingOutlined,
  TagsOutlined,
  LogoutOutlined,
  SwapOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme, Typography, Spin, Avatar, Space, Popconfirm, message, Drawer, Grid } from 'antd';
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
import { getMouvements, getCommandesClient, getCommandesFournisseur, getProduits } from "./services/api.js";
import Login from './pages/Login';
import Unauthorized from './pages/Unauthorized';
import PrivateRoute from './components/PrivateRoute';
import CreateInventory from './pages/CreateInventory';
import InventoryList from './pages/InventoryList';
import InventoryCount from './pages/InventoryCount';
import InventoryDetails from './pages/InventoryDetails';
import { EditCategorie } from './pages/EditCategorie';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const { Header, Sider, Content } = Layout;

// ─── Router (défini hors du composant pour ne pas être recréé) ───────────────
const router = createBrowserRouter([
  { path: '/login', element: <Login /> },
  { path: '/unauthorized', element: <Unauthorized /> },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <Root />
      </PrivateRoute>
    ),
    children: [
      { path: '/dashboard', element: <Dashboard /> },

      // ── Accessible à tous les rôles authentifiés ──
      { path: '/produits', element: <Produits /> },
      { path: '/produit/:id', element: <EditProduit /> },
      {
        path: '/commandesclients',
        element: <CommandesClients />,
      },
      {
        path: '/commandeclients/:id',
        element: <EditCommandeClient />,
      },
      { path: '/inventory', element: <InventoryList /> },
      { path: '/inventory/new', element: <CreateInventory /> },
      { path: '/inventory/:sessionId/count', element: <InventoryCount /> },
      { path: '/inventory/:sessionId/details', element: <InventoryDetails /> },
      { path: '/parametres', element: <Parametres /> },
      { path: '/categories/:id', element: <EditCategorie /> },

      // ── Admin + Gérant uniquement ──
      {
        path: '/clients',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><Clients /></PrivateRoute>,
      },
      {
        path: '/client/:id',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><EditClient /></PrivateRoute>,
      },
      {
        path: '/transactions',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><Transactions /></PrivateRoute>,
      },
      {
        path: '/fournisseurs',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><Fournisseurs /></PrivateRoute>,
      },
      {
        path: '/fournisseur/:id',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><EditFournisseur /></PrivateRoute>,
      },
      {
        path: '/commandesfournisseurs',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><CommandesFournisseurs /></PrivateRoute>,
      },
      {
        path: '/commandefournisseurs/:id',
        element: <PrivateRoute roles={['Admin', 'Gerant']}><EditCommandeFournisseur /></PrivateRoute>,
      },
    ],
  },
]);

// ─── App ─────────────────────────────────────────────────────────────────────
const App = () => (
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);

// ─── Layout racine ────────────────────────────────────────────────────────────
function Root() {
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const { token: { colorBgContainer } } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const [drawerVisible, setDrawerVisible] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  const { user, logout, hasRole } = useAuth();

  const [produits, setProduits] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [commandesF, setCommandesF] = useState([]);
  const [mouvements, setMouvements] = useState([]);

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
    try {
      await logout();
      message.success("Déconnexion réussie !");
    } catch {
      // logout vide quoi qu'il arrive
    } finally {
      navigate('/login');
    }
  };

  // ── Items du menu selon le rôle ──────────────────────────────────────────
  const menuItems = useMemo(() => {
    const isAdminOrGerant = hasRole(['Admin', 'Gerant']);
    const isAdmin = hasRole(['Admin']);
    const items = [];

    if (isAdminOrGerant) {
    items.push(
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: <NavLink to="/dashboard">Dashboard</NavLink>,
      },);
  }
  
  items.push({
        key: '/produits',
        icon: <TagsOutlined />,
        label: <NavLink to="/produits">Produits</NavLink>,
      },);

    // Clients, Transactions, Fournisseurs → Admin + Gérant
    if (isAdminOrGerant) {
      items.push(
        {
          key: '/clients',
          icon: <UserOutlined />,
          label: <NavLink to="/clients">Clients</NavLink>,
        },
        {
          key: '/transactions',
          icon: <TransactionOutlined />,
          label: <NavLink to="/transactions">Transactions</NavLink>,
        },
        {
          key: '/fournisseurs',
          icon: <UserSwitchOutlined />,
          label: <NavLink to="/fournisseurs">Fournisseurs</NavLink>,
        },
      );
    }

    // Commandes — Fournisseurs (Admin+Gérant) / Clients (tous)
    const commandeChildren = [];
    if (isAdminOrGerant) {
      commandeChildren.push({
        key: '/commandesfournisseurs',
        label: <NavLink to="/commandesfournisseurs">Fournisseurs</NavLink>,
      });
    }
    commandeChildren.push({
      key: '/commandesclients',
      label: <NavLink to="/commandesclients">Clients</NavLink>,
    });

    items.push({
      key: 'commandes',
      icon: <CopyOutlined />,
      label: 'Commandes',
      children: commandeChildren,
    });

    // Inventaires → tous
    items.push({
      key: '/inventory',
      icon: <SwapOutlined />,
      label: <NavLink to="/inventory">Inventaires</NavLink>,
    });

    // Paramètres → tous (contenu filtré par rôle à l'intérieur)
    items.push({
      key: '/parametres',
      icon: <SettingOutlined />,
      label: <NavLink to="/parametres">Paramètres</NavLink>,
    });

    return items;
  }, [hasRole]);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {screens.lg ? (
        <Sider trigger={null} collapsible collapsed={collapsed} onCollapse={setCollapsed} breakpoint="lg" collapsedWidth="80">
          <div className="logo-container">
            <img src="/logo.jpg" alt="Logo" style={{ width: collapsed ? '40px' : '80px' }} />
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
            <Typography.Text className="username-text">
              Bonjour, {user?.username || 'Utilisateur'}
            </Typography.Text>
            {user?.role && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                ({user.role})
              </Typography.Text>
            )}
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
          styles={{ padding: 0 }}
          className="mobile-drawer"
        >
          <div className="logo-container" style={{ padding: '16px' }}>
            <img src="/web-programming.png" alt="Logo" style={{ width: '72px' }} />
          </div>
          <Menu theme="light" mode="inline" selectedKeys={[location.pathname]} items={menuItems} onClick={() => setDrawerVisible(false)} />
        </Drawer>

        <Content style={{ margin: '24px 16px', padding: 24, background: 'var(--body-bg-color)' }}>
          <div style={{ marginBottom: 24 }} />
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
