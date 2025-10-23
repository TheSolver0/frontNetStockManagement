import React, { useState, useEffect, useMemo } from 'react';
import { createBrowserRouter, Outlet, RouterProvider, NavLink, useNavigation, useLocation, useNavigate } from "react-router-dom";
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
  MinusSquareFilled,
  PlusSquareOutlined,
  EditFilled,
  PlaySquareOutlined,
  TagsOutlined,
  LogoutOutlined,
  ShoppingOutlined,
  InboxOutlined,
  WarningOutlined,
  SwapOutlined
} from '@ant-design/icons';
import { CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import { Button, Layout, Menu, theme, Typography, Card, Col, Row, Flex, Spin, Avatar, Space, Form, Input, Checkbox, Popconfirm, message } from 'antd';
import DataTable from 'datatables.net-dt';
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
import PrivateRoute from './components/PrivateRoute';

import axiosInstance from './services/axiosInstance';


const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />
    },
    {
      path: '/',

      // element: <Root />,
      element: <Root />,
      // element: <PrivateRoute><Root /></PrivateRoute>,
      children: [
        {
          path: '/dashboard',
          element: <Dashboard />
        },

        {
          path: '/produits',
          element: <Produits />
        },
        {
          path: '/produit/:id',
          element: <EditProduit />
        },
        {
          path: '/clients',
          element: <Clients />
        },
        {
          path: '/client/:id',
          element: <EditClient />
        },
        {
          path: '/transactions',
          element: <Transactions />
        },
        {
          path: '/fournisseurs',
          element: <Fournisseurs />
        },
        {
          path: '/fournisseur/:id',
          element: <EditFournisseur />
        },
        {
          path: '/commandesfournisseurs',
          element: <CommandesFournisseurs />
        },
        {
          path: '/commandefournisseurs/:id',
          element: <EditCommandeFournisseur />
        },
        {
          path: '/commandesclients',
          element: <CommandesClients />
        },
        {
          path: '/commandeclients/:id',
          element: <EditCommandeClient />
        },
        {
          path: '/parametres',
          element: <Parametres />
        },
      ],
    }
  ])



function Root() {
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  useEffect(() => {

    setTimeout(() => setLoading(false), 2000)
  }, []);
  const location = useLocation()
  const currentPath = location.pathname;
  console.log({ currentPath });
  const pathToKey = {
    '/dashboard': '1',
    '/produits': '2',
    '/clients': '3',
    '/transactions': '4',
    '/fournisseurs': '5',
    '/commandesfournisseurs': '7',
    '/commandesclients': '8',
    '/parametres': '9',
  };

  const defaultKey = pathToKey[currentPath] || '1';

  const [current, setCurrent] = useState(defaultKey);
  const onClick = e => {
    setCurrent(e.key);
  };

  const { Content } = Layout;

  const [produits, setProduits] = useState([]);
  const [commandes, setCommandes] = useState([]);
  const [commandesF, setCommandesF] = useState([]);
  const [mouvements, setMouvements] = useState([]);
  useEffect(() => {
    getMouvements()
      .then(setMouvements)
      .catch(err => console.error("Erreur Mouvements", err));

    getProduits()
      .then(setProduits)
      .catch(err => console.error("Erreur Produits", err));

    getCommandesClient()
      .then(setCommandes)
      .catch(err => console.error("Erreur Commandes Client", err));

    getCommandesFournisseur()
      .then(setCommandesF)
      .catch(err => console.error("Erreur Commandes Fournisseur", err));
  }, []);


  // Calcul des statistiques
  const calculateStats = () => {
    if (!Array.isArray(commandes) || !Array.isArray(produits) || !Array.isArray(mouvements)) return {};

    const totalVentes = commandes
      .filter(c => c.status === 'LIVREE')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

    const produitsCritiques = produits
      .filter(p => p.quantity <= p.threshold)
      .length;

    const totalProduits = produits.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);

    // Fonction utilitaire : récupérer un objet Date depuis différentes formes de champs
    const parseMovementDate = (m) => {
      if (!m) return null;
      // prioriser plusieurs clés possibles
      const raw = m.created_at ?? m.createdAt ?? m.date ?? m.timestamp ?? null;
      if (!raw) return null;

      // si c'est un nombre (timestamp en secondes ou ms)
      if (typeof raw === 'number') {
        // si semble être en secondes (10 chiffres), convertir en ms
        const asNumber = raw;
        const maybeMs = asNumber > 1e12 ? asNumber : asNumber > 1e10 ? asNumber : asNumber * 1000;
        return new Date(maybeMs);
      }

      // si c'est une string numérique
      if (/^\d+$/.test(String(raw))) {
        const asNumber = Number(raw);
        const maybeMs = asNumber > 1e12 ? asNumber : asNumber > 1e10 ? asNumber : asNumber * 1000;
        return new Date(maybeMs);
      }

      // sinon tenter de parser une date ISO/locale
      const parsed = new Date(String(raw));
      if (!isNaN(parsed)) return parsed;
      return null;
    };

    const mouvementsMois = (Array.isArray(mouvements) ? mouvements : [])
      .filter(m => {
        const date = parseMovementDate(m);
        if (!date) return false;
        const maintenant = new Date();
        return date.getMonth() === maintenant.getMonth() && date.getFullYear() === maintenant.getFullYear();
      }).length;

    // DEBUG: si aucun mouvement trouvé, loguer un exemple pour inspecter le contenu
    if (mouvementsMois === 0 && mouvements && mouvements.length > 0) {
      // log uniquement le premier mouvement non null pour éviter le flood
      // eslint-disable-next-line no-console
      console.debug('Aucun mouvement détecté pour le mois courant. Exemple de mouvement:', mouvements[0]);
    }

    return {
      totalVentes,
      produitsCritiques,
      totalProduits,
      mouvementsMois
    };
  };

  const stats = calculateStats();


  const totalEntrees = useMemo(() => {
    return commandes
      .filter(c => c.status === 'LIVREE')
      .reduce((somme, c) => somme + parseFloat(c.amount) / 1, 0);
  }, [commandes]);

  const totalSorties = useMemo(() => {
    return commandesF
      .filter(c => c.status === 'LIVREE')
      .reduce((somme, c) => somme + parseFloat(c.amount) / 1, 0);
  }, [commandesF]);

  const totalGain = useMemo(() => {
    return totalEntrees - totalSorties;
  }, [totalEntrees, totalSorties]);


  const color = totalGain > 0 ? '#b7e4c7' : '#660708';
  // const gains = totalGain.toLocaleString('fr-FR', { style: 'currency', currency: 'XAF' }).replace('XAF', '').trim();
  // console.log('Gains', gains);

  // console.log('user', localStorage.getItem('user'));
  /*const user = JSON.parse(localStorage.getItem('user')); // ou via ton state global
  const isAdmin = user.is_superuser;
  const isAuth = user ? true : false;
  console.log('Is Admin', isAdmin);
  const confirm = async e => {
    console.log(e);
    const refreshToken = localStorage.getItem('refreshToken');
    try {
      const response = await axiosInstance.post('http://localhost:8000/auth/logout/', {
        refresh: refreshToken
      });
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      message.success("Déconnexion effectuée");
      setTimeout(() => {
        navigate('/login'); // ou '/'

      }, 1000);
    } catch (error) {
      message.error("Erreur lors de la déconnexion !");
      console.error('Erreur lors de la deconnexion', error);
    }
  };*/
  const cancel = e => {
    console.log(e);
    // message.error('Click on No');
  };

  const menuItems = [
    {
      key: '1',
      icon: <DashboardOutlined />,
      label: (
        <NavLink to="/dashboard" style={{ textDecoration: 'none' }}> Dashboard </NavLink>
      ),
    },
    {
      key: '2',
      icon: <TagsOutlined />,
      label: (
        <NavLink to="/produits" style={{ textDecoration: 'none' }}> Produits </NavLink>
      ),
    },
    {
      key: '3',
      icon: <UserOutlined />,
      label: (
        <NavLink to="/clients" style={{ textDecoration: 'none' }}> Clients </NavLink>
      ),
    },
    {
      key: '4',
      icon: <TransactionOutlined />,
      label: (
        <NavLink to="/transactions" style={{ textDecoration: 'none' }}> Transactions </NavLink>
      ),
    },
    {
      key: '5',
      icon: <UserSwitchOutlined />,
      label: (
        <NavLink to="/fournisseurs" style={{ textDecoration: 'none' }}> Fournisseurs </NavLink>
      ),
    },
    {
      key: '6',
      icon: <CopyOutlined />,
      label: (
        'Commandes'
      ),
      children: [
        {
          key: '7', label: (
            <NavLink to="/commandesfournisseurs" style={{ textDecoration: 'none', color: 'inherit' }}> Fournisseurs </NavLink>
          )
        },
        {
          key: '8', label: (
            <NavLink to="/commandesclients" style={{ textDecoration: 'none', color: 'inherit' }}> Clients </NavLink>
          )
        },

      ],
    },

    /* ...(isAdmin ? [{
       key: '9',
       label: <NavLink to="/parametres" style={{ textDecoration: 'none', color: 'inherit' }}>Paramètres</NavLink>,
       icon: <SettingOutlined />,
     }] : []),*/


    /*{
      //  key: '11',
      label: (
        <Popconfirm
          title="Déconnexion"
          description="Voulez vous vraiment vous déconnectez?"
          onConfirm={confirm}
          onCancel={cancel}
          okText="Oui"
          cancelText="Non"
        >
          <Button style={{ background: 'white', width: '100%' }} danger><LogoutOutlined /></Button>
        </Popconfirm>
      ),
      //  icon: <LogoutOutlined />,
    }*/
  ]

  const navigate = useNavigate();


  return (
    <>
      <Layout style={{ height: "100vh" }}>

        <Sider trigger={null} collapsible collapsed={collapsed} style={{ height: "100vh" }}>
          <div className="demo-logo-vertical" >
            <Space direction="horizontal" size={5} style={{ margin: 10 }}>

              <Avatar size={40} icon={<UserOutlined />} /> <h4>{'Admin'}
              </h4>

            </Space>
          </div>

          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className='buttonHeader'
          />

          <Menu
            theme="light"
            mode="inline"
            onClick={onClick}
            selectedKeys={[current]}
            items={menuItems}
            className='Menu'
          />

        </Sider>

        <Layout style={{ position: "relative" }} className="site-layout" >

          <Header className='Header'
          >

            <h1 style={{ textAlign: 'right' }}> Bienvenue, Luc! </h1>


          </Header>
          <Content style={{ padding: '0 48px' }}>

            <div
              style={{
                padding: 24,
                minHeight: 380,
                marginLeft: 150,
              }}
            >

              <Flex className='flexCardstat'>
                {/* <Row> */}
                {/* <Col span={5}> */}
                <Card style={{
                  background: '#e6f7ff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <Flex align="center" justify="space-between">
                    <div>
                      <Typography.Text type="secondary">Entrées (Ventes)</Typography.Text>
                      <Typography.Title level={4} style={{ margin: '5px 0', paddingRight: '2px' }}>
                        {totalEntrees?.toLocaleString()} XAF
                      </Typography.Title>
                    </div>
                    <div style={{
                      background: '#1890ff',
                      padding: '10px',
                      borderRadius: '50%',
                      color: 'white',
                      marginLeft: '5px',
                      marginRight: '5px',
                    }}>
                      <UploadOutlined style={{ fontSize: '18px' }} />
                    </div>
                  </Flex>
                </Card>
                {/* </Col>
                  <Col span={5}> */}
                <Card style={{
                  background: '#fff7e6',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <Flex align="center" justify="space-between">
                    <div>
                      <Typography.Text type="secondary">Sorties (Achats)</Typography.Text>
                      <Typography.Title level={4} style={{ margin: '5px 0' }}>
                        {totalSorties?.toLocaleString()} XAF
                      </Typography.Title>
                    </div>
                    <div style={{
                      background: '#fa8c16',
                      padding: '12px',
                      borderRadius: '50%',
                      color: 'white'
                    }}>
                      <DownloadOutlined style={{ fontSize: '24px' }} />
                    </div>
                  </Flex>
                </Card>
                {/* </Col> */}
                {/* <Col span={5}> */}
                <Card style={{
                  background: totalGain >= 0 ? '#f6ffed' : '#fff1f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <Flex align="center" justify="space-between">
                    <div>
                      <Typography.Text type="secondary">Gains Nets</Typography.Text>
                      <Typography.Title level={4} style={{ margin: '5px 0', color: totalGain >= 0 ? '#52c41a' : '#ff4d4f' }}>
                        {totalGain?.toLocaleString()} XAF
                      </Typography.Title>
                    </div>
                    <div style={{
                      background: totalGain >= 0 ? '#52c41a' : '#ff4d4f',
                      padding: '12px',
                      borderRadius: '50%',
                      color: 'white'
                    }}>
                      {totalGain >= 0 ? <CaretUpOutlined style={{ fontSize: '24px' }} /> : <CaretDownOutlined style={{ fontSize: '24px' }} />}
                    </div>
                  </Flex>
                </Card>
                {/* </Col> */}
                {/* <Col span={5}> */}
                <Card style={{
                  background: '#fdffedff',
                  // background: '#fff1f0',
                  // background: '#e6f7ff',
                  // padding: '20px',
                  // borderRadius: '8px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
                // style={{ background: "#57cc99", color: '#081c15' }}
                >
                  <Flex align="center" justify="space-between">
                    <div>
                      <Typography.Text type="secondary">Mouvements du Mois</Typography.Text>
                      <Typography.Title level={4} style={{ margin: '5px 0' }}>
                        {stats.mouvementsMois}
                      </Typography.Title>
                    </div>
                    <div style={{
                      background: '#52c41a',
                      padding: '12px',
                      borderRadius: '50%',
                      color: 'white'
                    }}>
                      <SwapOutlined style={{ fontSize: '24px' }} />
                    </div>
                  </Flex>

                </Card>
                {/* </Col> */}
                {/* <Col span={5}> */}
                <Card style={{
                  background: '#ffe6e6ff',
                  // width: '10px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}>
                  <Flex align="center" justify="space-between">
                    <div>
                      <Typography.Text type="secondary">Produits critiques</Typography.Text>
                      <Typography.Title level={4} style={{ margin: '5px 0' }}>
                        {stats.produitsCritiques?.toLocaleString()} 
                      </Typography.Title>
                    </div>
                    <div style={{
                      background: '#ff7418ff',
                      padding: '12px',
                      borderRadius: '50%',
                      color: 'white'
                    }}>
                      <WarningOutlined style={{ fontSize: '18px' }} />
                    </div>
                  </Flex>
                </Card>
                {/* </Col> */}
                {/* </Row> */}
              </Flex>


              {/* <Flex  gap="middle" align="space-evenly" vertical> */}
              {/* <Content
            style={{
              // margin: '24px 16px',
              // padding: 24,
              // minHeight: 280,
              // background: 'white',
              // borderRadius: borderRadiusLG,
              // boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08)',
              // height: "auto",
              // overflowY: 'scroll',
            }}
          > */}
              {loading ? <Spin size="large" style={{ display: 'flex', flexFlow: 'row', justifyContent: 'center' }} /> : <Outlet />}
            </div>

          </Content>
          {/* </Flex> */}
        </Layout>
      </Layout>
      {/* <Outlet /> */}

    </>
  )
}

const { Header, Sider } = Layout;

const logout = () => {
  localStorage.removeItem("accessToken");
  window.location.href = "/login";
};

const App = () => {


  return (
    <RouterProvider router={router} />
  );
};
export default App;
const onFinish = values => {
  console.log('Success:', values);
};
const onFinishFailed = errorInfo => {
  console.log('Failed:', errorInfo);
};
