import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import { 
  Button, 
  Card, 
  Typography, 
  Flex, 
  Grid, 
  Drawer, 
  Descriptions,
  Tag,
  Input,
  Space,
  Statistic,
  Row,
  Col
} from 'antd';
import {
  CaretUpOutlined,
  CaretDownOutlined,
  SwapOutlined,
  UserOutlined,
  ShopOutlined,
  AppstoreOutlined,
  DollarOutlined,
  NumberOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { getMouvements, getProduits, getClients, getFournisseurs } from "../services/api";

export function Transactions() {
  const [mouvements, setMouvements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);

  // Drawer pour mobile
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getMouvements(),
      getProduits(),
      getClients(),
      getFournisseurs()
    ])
      .then(([mouvementsData, produitsData, clientsData, fournisseursData]) => {
        setMouvements(mouvementsData);
        setProduits(produitsData);
        setClients(clientsData);
        setFournisseurs(fournisseursData);
      })
      .catch(error => console.error("Erreur lors du chargement des données:", error))
      .finally(() => setLoading(false));
  }, []);

  // Helpers pour trouver les entités liées
  const getProductName = (productId) => {
    const product = produits.find(p => p.id === productId);
    return product ? product.name : 'Produit non trouvé';
  };

  const getActorName = (mouvement) => {
    if (mouvement.customerId) {
      const client = clients.find(c => c.id === mouvement.customerId);
      return client ? client.name : 'Client non trouvé';
    }
    if (mouvement.supplierId) {
      const fournisseur = fournisseurs.find(f => f.id === mouvement.supplierId);
      return fournisseur ? fournisseur.name : 'Fournisseur non trouvé';
    }
    return '-';
  };

  const getActorType = (mouvement) => {
    if (mouvement.customerId) return 'Client';
    if (mouvement.supplierId) return 'Fournisseur';
    return '-';
  };

  // Statistiques
  const calculateStats = () => {
    const entrees = mouvements.filter(m => m.type === 'Entrée');
    const sorties = mouvements.filter(m => m.type === 'Sortie');
    
    const totalEntrees = entrees.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
    const totalSorties = sorties.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0);
    
    return {
      totalEntrees,
      totalSorties,
      solde: totalSorties - totalEntrees,
      nombreEntrees: entrees.length,
      nombreSorties: sorties.length
    };
  };

  const stats = calculateStats();

  // Colonnes pour React Table
  const columnsRT = [
    { 
      header: 'ID', 
      accessorKey: 'id',
      cell: ({ row }) => (
        <span style={{ fontWeight: 600, color: '#8c8c8c' }}>#{row.original.id}</span>
      )
    },
    {
      header: 'Type',
      accessorKey: 'type',
      cell: ({ row }) => (
        <Tag 
          color={row.original.type === 'Entrée' ? 'red' : 'green'}
          icon={row.original.type === 'Entrée' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
          style={{ fontWeight: 600 }}
        >
          {row.original.type}
        </Tag>
      )
    },
    {
      header: 'Acteur',
      id: 'acteur',
      cell: ({ row }) => {
        const actorName = getActorName(row.original);
        const actorType = getActorType(row.original);
        const icon = actorType === 'Client' ? <UserOutlined /> : <ShopOutlined />;
        return (
          <div>
            <div style={{ fontWeight: 600 }}>
              {icon} {actorName}
            </div>
            <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
              {actorType}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Produit',
      id: 'produit',
      cell: ({ row }) => (
        <span style={{ fontWeight: 500 }}>
          <AppstoreOutlined style={{ marginRight: 4, color: '#1677ff' }} />
          {getProductName(row.original.productId)}
        </span>
      )
    },
    { 
      header: 'Quantité', 
      accessorKey: 'quantity',
      cell: ({ row }) => (
        <Tag color="blue">
          <NumberOutlined /> {row.original.quantity}
        </Tag>
      )
    },
    {
      header: 'Montant',
      accessorKey: 'amount',
      cell: ({ row }) => (
        <span style={{
          fontWeight: 700,
          fontSize: '14px',
          color: row.original.type === 'Entrée' ? '#cf1322' : '#52c41a'
        }}>
          {row.original.type === 'Entrée' ? '-' : '+'}{' '}
          {parseFloat(row.original.amount || 0).toLocaleString('fr-FR')} XAF
        </span>
      )
    }
  ];

  const filteredData = mouvements.filter(item => {
    const actorName = getActorName(item).toLowerCase();
    const productName = getProductName(item.productId).toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return actorName.includes(search) || 
           productName.includes(search) ||
           item.type?.toLowerCase().includes(search);
  });

  const table = useReactTable({
    data: filteredData,
    columns: columnsRT,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: 10 } },
  });

  const screens = Grid.useBreakpoint();

  const openTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setDrawerVisible(true);
  };

  const closeDrawer = () => setDrawerVisible(false);

  return (
    <>
      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            <SwapOutlined /> Historique des Transactions
          </Typography.Title>
        </Flex>

        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #cf1322',
              background: 'linear-gradient(135deg, #ffffff 0%, #fff1f0 100%)'
            }}>
              <Statistic 
                title="Total Entrées" 
                value={stats.totalEntrees} 
                suffix="XAF"
                valueStyle={{ color: '#cf1322' }}
                prefix={<ArrowDownOutlined />}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
                {stats.nombreEntrees} transactions
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #52c41a',
              background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)'
            }}>
              <Statistic 
                title="Total Sorties" 
                value={stats.totalSorties} 
                suffix="XAF"
                valueStyle={{ color: '#52c41a' }}
                prefix={<ArrowUpOutlined />}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
                {stats.nombreSorties} transactions
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #1677ff',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%)'
            }}>
              <Statistic 
                title="Solde Net" 
                value={Math.abs(stats.solde)} 
                suffix="XAF"
                valueStyle={{ color: stats.solde >= 0 ? '#52c41a' : '#cf1322' }}
                prefix={stats.solde >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
                {stats.solde >= 0 ? 'Bénéfice' : 'Déficit'}
              </div>
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #722ed1',
              background: 'linear-gradient(135deg, #ffffff 0%, #f9f0ff 100%)'
            }}>
              <Statistic 
                title="Total Transactions" 
                value={mouvements.length}
                prefix={<SwapOutlined />}
              />
              <div style={{ fontSize: '12px', color: '#8c8c8c', marginTop: 8 }}>
                Toutes périodes
              </div>
            </Card>
          </Col>
        </Row>

        <Input.Search
          placeholder="Rechercher par acteur, produit ou type..."
          onSearch={setSearchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 500 }}
          allowClear
        />

        {screens.lg ? (
          // Vue Desktop - Table
          <div className="table-responsive">
            <table className="table table-hover responsive-table">
              <caption>Liste des transactions</caption>
              <thead className="table-light">
                {table.getHeaderGroups().map(hg => (
                  <tr key={hg.id}>
                    {hg.headers.map(header => (
                      <th 
                        key={header.id} 
                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }} 
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {{ asc: <CaretUpOutlined />, desc: <CaretDownOutlined /> }[header.column.getIsSorted()] ?? null}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map(row => (
                  <tr key={row.id}>
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
              <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
                Précédent
              </Button>
              <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
                Suivant
              </Button>
              <span>
                Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
              </span>
            </div>
          </div>
        ) : (
          // Vue Mobile - Cards
          <>
            <div className="responsive-cards">
              {filteredData.length === 0 && (
                <div style={{ padding: 20, textAlign: 'center', color: '#8c8c8c' }}>
                  Aucune transaction trouvée
                </div>
              )}
              {filteredData.map(transaction => (
                <Card
                  key={transaction.id}
                  className="mobile-card"
                  size="small"
                  bordered
                  hoverable
                  onClick={() => openTransaction(transaction)}
                  style={{
                    borderLeft: `4px solid ${transaction.type === 'Entrée' ? '#cf1322' : '#52c41a'}`
                  }}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 8 
                  }}>
                    <div>
                      <Tag 
                        color={transaction.type === 'Entrée' ? 'red' : 'green'}
                        icon={transaction.type === 'Entrée' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                      >
                        {transaction.type}
                      </Tag>
                      <span style={{ fontSize: '12px', color: '#8c8c8c', marginLeft: 8 }}>
                        #{transaction.id}
                      </span>
                    </div>
                    <div style={{ 
                      fontWeight: 700, 
                      fontSize: 16,
                      color: transaction.type === 'Entrée' ? '#cf1322' : '#52c41a'
                    }}>
                      {transaction.type === 'Entrée' ? '-' : '+'}{' '}
                      {parseFloat(transaction.amount || 0).toLocaleString('fr-FR')} XAF
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      {getActorType(transaction) === 'Client' ? <UserOutlined /> : <ShopOutlined />}
                      {' '}{getActorType(transaction)}
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {getActorName(transaction)}
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <AppstoreOutlined style={{ marginRight: 4 }} />
                      Produit
                    </div>
                    <div style={{ fontWeight: 500 }}>
                      {getProductName(transaction.productId)}
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <NumberOutlined style={{ marginRight: 4 }} />
                      Quantité
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {transaction.quantity}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Drawer pour les détails sur mobile */}
            <Drawer
              open={drawerVisible}
              onClose={closeDrawer}
              title={
                <Space>
                  <SwapOutlined />
                  Transaction #{selectedTransaction?.id}
                </Space>
              }
              width={Math.min(520, window.innerWidth - 40)}
            >
              {selectedTransaction && (
                <>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Type">
                      <Tag 
                        color={selectedTransaction.type === 'Entrée' ? 'red' : 'green'}
                        icon={selectedTransaction.type === 'Entrée' ? <ArrowDownOutlined /> : <ArrowUpOutlined />}
                        style={{ fontWeight: 600 }}
                      >
                        {selectedTransaction.type}
                      </Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label="Acteur">
                      <div>
                        <div style={{ fontWeight: 600 }}>
                          {getActorType(selectedTransaction) === 'Client' ? 
                            <UserOutlined /> : <ShopOutlined />}
                          {' '}{getActorName(selectedTransaction)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                          {getActorType(selectedTransaction)}
                        </div>
                      </div>
                    </Descriptions.Item>

                    <Descriptions.Item label={<><AppstoreOutlined /> Produit</>}>
                      {getProductName(selectedTransaction.productId)}
                    </Descriptions.Item>

                    <Descriptions.Item label={<><NumberOutlined /> Quantité</>}>
                      <Tag color="blue">{selectedTransaction.quantity}</Tag>
                    </Descriptions.Item>

                    <Descriptions.Item label={<><DollarOutlined /> Montant</>}>
                      <span style={{
                        fontWeight: 700,
                        fontSize: '16px',
                        color: selectedTransaction.type === 'Entrée' ? '#cf1322' : '#52c41a'
                      }}>
                        {selectedTransaction.type === 'Entrée' ? '-' : '+'}{' '}
                        {parseFloat(selectedTransaction.amount || 0).toLocaleString('fr-FR')} XAF
                      </span>
                    </Descriptions.Item>
                  </Descriptions>

                  {selectedTransaction.date && (
                    <div style={{ 
                      marginTop: 16, 
                      padding: 12, 
                      background: '#f5f5f5', 
                      borderRadius: 8 
                    }}>
                      <div style={{ fontSize: '12px', color: '#8c8c8c' }}>
                        <CalendarOutlined /> Date de transaction
                      </div>
                      <div style={{ fontWeight: 600, marginTop: 4 }}>
                        {new Date(selectedTransaction.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </Drawer>
          </>
        )}
      </Card>
    </>
  );
}
