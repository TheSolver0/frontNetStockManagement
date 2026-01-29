import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from "react-router-dom";
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Modal, 
  Select,
  Popconfirm, 
  message, 
  Space, 
  Typography, 
  Flex, 
  Grid, 
  Drawer, 
  Descriptions,
  Tag,
  Row,
  Col,
  Statistic,
  Badge
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined, 
  CaretUpOutlined, 
  CaretDownOutlined,
  ShoppingOutlined,
  ShopOutlined,
  AppstoreOutlined,
  NumberOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  WarningOutlined,
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
import { getCommandesFournisseur, getProduits, getFournisseurs, API_URL } from "../services/api";
import axiosInstance from '../services/axiosInstance';
import { useCommandesReducerF } from '../hooks/useCommandesReducerF.js';

// Modal pour ajouter une commande fournisseur
const AddSupplierOrderForm = ({ open, onCancel, onOrderAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState([]);
  const [fournisseurs, setFournisseurs] = useState([]);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    if (open) {
      Promise.all([getProduits(), getFournisseurs()])
        .then(([produitsData, fournisseursData]) => {
          setProduits(produitsData);
          setFournisseurs(fournisseursData);
        })
        .catch(error => console.error("Erreur lors du chargement des données :", error));
    }
  }, [open]);

  const handleSupplierChange = (supplierId) => {
    const supplier = fournisseurs.find(f => f.id === supplierId);
    setSelectedSupplier(supplier);
  };

  const handleFinish = async (values) => {
    const { productId, quantity, supplierId } = values;
    
    // Vérifier que le fournisseur fournit bien ce produit
    const supplier = fournisseurs.find(f => f.id === supplierId);
    const supplierProductList = supplier ? (supplier.products ?? supplier.produits ?? []) : [];
    const supplierProductIds = supplierProductList.map(p => (p && typeof p === 'object' ? p.id : p));
    const normalizedProductId = String(productId);
    const normalizedSupplierIds = supplierProductIds.map(id => String(id));

    if (!normalizedSupplierIds.includes(normalizedProductId)) {
      message.error("Ce fournisseur ne fournit pas ce produit !");
      return;
    }

    setLoading(true);
    try {
      const response = await axiosInstance.post(`${API_URL}Provides/`, {
        quantity: parseInt(quantity, 10),
        productId,
        supplierId,
      });
      message.success("Commande ajoutée avec succès !");
      form.resetFields();
      setSelectedSupplier(null);
      setTimeout(() => {
        onOrderAdded(response.data);
      }, 1000);
    } catch (error) {
      message.error("Erreur lors de l'ajout de la commande !");
      console.error('Erreur lors de l\'ajout', error);
    } finally {
      setLoading(false);
    }
  };

  // Filtrer les produits selon le fournisseur sélectionné
  const availableProducts = selectedSupplier 
    ? produits.filter(p => {
        const supplierProductList = selectedSupplier.products ?? selectedSupplier.produits ?? [];
        const supplierProductIds = supplierProductList.map(sp => (sp && typeof sp === 'object' ? sp.id : sp));
        return supplierProductIds.map(id => String(id)).includes(String(p.id));
      })
    : produits;

  return (
    <Modal
      title="Nouvelle commande fournisseur"
      open={open}
      onCancel={() => {
        onCancel();
        setSelectedSupplier(null);
        form.resetFields();
      }}
      footer={null}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} name="addSupplierOrderForm">
        <Form.Item 
          name="supplierId" 
          label="Fournisseur" 
          rules={[{ required: true, message: 'Veuillez sélectionner un fournisseur' }]}
        >
          <Select 
            placeholder="Sélectionnez un fournisseur"
            showSearch
            onChange={handleSupplierChange}
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {fournisseurs.map((fournisseur) => (
              <Select.Option key={fournisseur.id} value={fournisseur.id}>
                {fournisseur.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        {selectedSupplier && (
          <div style={{ 
            marginBottom: 16, 
            padding: 12, 
            background: '#f0f5ff', 
            borderRadius: 8,
            border: '1px solid #adc6ff'
          }}>
            <div style={{ fontSize: '12px', color: '#0958d9', marginBottom: 4 }}>
              <ClockCircleOutlined /> Délai de livraison : <strong>{selectedSupplier.delay} jours</strong>
            </div>
            <div style={{ fontSize: '11px', color: '#8c8c8c' }}>
              {availableProducts.length} produit(s) disponible(s)
            </div>
          </div>
        )}

        <Form.Item 
          name="productId" 
          label="Produit" 
          rules={[{ required: true, message: 'Veuillez sélectionner un produit' }]}
        >
          <Select 
            placeholder={selectedSupplier ? "Sélectionnez un produit" : "Sélectionnez d'abord un fournisseur"}
            disabled={!selectedSupplier}
            showSearch
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {availableProducts.map((produit) => (
              <Select.Option key={produit.id} value={produit.id}>
                {produit.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="quantity" 
          label="Quantité" 
          rules={[
            { required: true, message: 'Veuillez entrer la quantité' },
            { type: 'number', min: 1, message: 'La quantité doit être au moins 1' }
          ]}
        >
          <InputNumber 
            min={1} 
            style={{ width: '100%' }} 
            placeholder="Ex: 100"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Passer la commande
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export function CommandesFournisseurs() {
  const [commandes, setCommandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
  const previousLivreesRef = useRef([]);

  // Drawer pour mobile
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    setLoading(true);
    getCommandesFournisseur()
      .then(data => {
        setCommandes(data);
        // Vérifier les commandes en attente
        data.forEach(c => {
          if (c.status === 'EN_ATTENTE') {
            message.warning(`La commande #${c.id} est en attente de réception`, 3);
          }
        });
      })
      .catch(error => console.error("Erreur lors du chargement des commandes :", error))
      .finally(() => setLoading(false));
  }, []);

  useCommandesReducerF(commandes);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`${API_URL}Provides/${id}/`);
      message.success('Commande supprimée avec succès');
      setTimeout(() => {
        setCommandes(prev => prev.filter(c => c.id !== id));
      }, 1000);
    } catch (error) {
      message.error("Erreur lors de la suppression de la commande !");
      console.error('Erreur lors de la suppression', error);
    }
  };

  // Fonction pour calculer la date de livraison et vérifier le retard
  const calculateDeliveryDate = (createdAt, delay) => {
    if (!createdAt || delay == null) return null;

    const safeDateStr = typeof createdAt === 'string' ? createdAt.replace(/\.(\d{3})\d*Z$/, '.$1Z') : createdAt;
    const date = new Date(safeDateStr);
    if (isNaN(date)) return null;

    let jours = 0;
    try {
      if (typeof delay === 'string') {
        const joursMatch = delay.match(/^(\d+)\s/);
        if (joursMatch) jours = parseInt(joursMatch[1], 10);
        else {
          const m = delay.match(/(\d+)/);
          if (m) jours = parseInt(m[1], 10);
        }
      } else if (typeof delay === 'number') {
        jours = delay;
      }
    } catch (e) {
      console.warn('Erreur parse delay:', e, delay);
    }

    if (!Number.isFinite(jours) || isNaN(jours)) jours = 0;
    date.setDate(date.getDate() + jours);

    const now = new Date();
    const isLate = now >= date;

    return { date, isLate };
  };

  // Fonction pour obtenir la config du statut
  const getStatusConfig = (status) => {
    const configs = {
      'EN_ATTENTE': { color: 'orange', icon: <ClockCircleOutlined />, label: 'En attente' },
      'PREPAREE': { color: 'blue', icon: <SyncOutlined />, label: 'Préparée' },
      'EXPEDIEE': { color: 'cyan', icon: <SyncOutlined spin />, label: 'Expédiée' },
      'LIVREE': { color: 'green', icon: <CheckCircleOutlined />, label: 'Livrée' },
      'ANNULEE': { color: 'red', icon: <CloseCircleOutlined />, label: 'Annulée' }
    };
    return configs[status] || { color: 'default', icon: null, label: status };
  };

  // Calcul des statistiques
  const calculateStats = () => {
    const enAttente = commandes.filter(c => c.status === 'EN_ATTENTE').length;
    const livrees = commandes.filter(c => c.status === 'LIVREE').length;
    const enRetard = commandes.filter(c => {
      if (c.status === 'LIVREE') return false;
      const delivery = calculateDeliveryDate(c.createdAt, c.supplier?.delay);
      return delivery ? delivery.isLate : false;
    }).length;
    const totalMontant = commandes
      .filter(c => c.status === 'LIVREE')
      .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
    
    return {
      total: commandes.length,
      enAttente,
      livrees,
      enRetard,
      totalMontant
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
      header: 'Produit',
      accessorKey: 'product.name',
      cell: ({ row }) => (
        <span style={{ fontWeight: 600 }}>
          <AppstoreOutlined style={{ marginRight: 4, color: '#1677ff' }} />
          {row.original.product?.name || '-'}
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
      header: 'Fournisseur',
      accessorKey: 'supplier.name',
      cell: ({ row }) => (
        <span>
          <ShopOutlined style={{ marginRight: 4, color: '#fa8c16' }} />
          {row.original.supplier?.name || '-'}
        </span>
      )
    },
    { 
      header: 'Montant', 
      accessorKey: 'amount',
      cell: ({ row }) => (
        <span style={{ fontWeight: 700, color: '#cf1322', fontSize: '14px' }}>
          {parseFloat(row.original.amount || 0).toLocaleString('fr-FR')} XAF
        </span>
      )
    },
    {
      header: 'Livraison prévue',
      id: 'deliveryDate',
      cell: ({ row }) => {
        const delivery = calculateDeliveryDate(row.original.createdAt, row.original.supplier?.delay);
        if (!delivery) return '-';
        
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '13px' }}>
              {delivery.date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
              })}
            </span>
            {delivery.isLate && row.original.status !== 'LIVREE' && (
              <Tag color="red" icon={<WarningOutlined />}>Retard</Tag>
            )}
          </div>
        );
      }
    },
    {
      header: 'Statut',
      accessorKey: 'status',
      cell: ({ row }) => {
        const config = getStatusConfig(row.original.status);
        return (
          <Tag color={config.color} icon={config.icon} style={{ fontWeight: 600 }}>
            {config.label}
          </Tag>
        );
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Space size="middle">
          <NavLink to={`/commandefournisseurs/${row.original.id}`}>
            <Button type="primary" icon={<EditOutlined />} shape="circle" />
          </NavLink>
          <Popconfirm
            title="Confirmer la suppression"
            description="Êtes-vous sûr de vouloir supprimer cette commande ?"
            onConfirm={() => handleDelete(row.original.id)}
            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
            okText="Oui"
            cancelText="Non"
          >
            <Button type="danger" icon={<DeleteOutlined />} shape="circle" />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const filteredData = commandes.filter(item =>
    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.supplier?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const openOrder = (order) => {
    setSelectedOrder(order);
    setDrawerVisible(true);
  };

  const closeDrawer = () => setDrawerVisible(false);

  return (
    <>
      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            <ShoppingOutlined /> Commandes Fournisseurs
          </Typography.Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            onClick={() => setIsModalOpen(true)}
          >
            Nouvelle commande
          </Button>
        </Flex>

        {/* Statistiques */}
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #1677ff',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%)'
            }}>
              <Statistic 
                title="Total Commandes" 
                value={stats.total}
                prefix={<ShoppingOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #faad14',
              background: 'linear-gradient(135deg, #ffffff 0%, #fffbe6 100%)'
            }}>
              <Statistic 
                title="En Attente" 
                value={stats.enAttente}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #ff4d4f',
              background: 'linear-gradient(135deg, #ffffff 0%, #fff1f0 100%)'
            }}>
              <Statistic 
                title="En Retard" 
                value={stats.enRetard}
                prefix={<WarningOutlined />}
                valueStyle={{ color: '#ff4d4f' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" bordered={false} style={{ 
              borderLeft: '4px solid #52c41a',
              background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)'
            }}>
              <Statistic 
                title="Dépenses (Livrées)" 
                value={stats.totalMontant}
                suffix="XAF"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>

        <Input.Search
          placeholder="Rechercher par produit, fournisseur ou statut..."
          onSearch={setSearchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 500 }}
          allowClear
        />

        {screens.lg ? (
          // Vue Desktop - Table
          <div className="table-responsive">
            <table className="table table-hover responsive-table">
              <caption>Liste des commandes fournisseurs</caption>
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
                  Aucune commande trouvée
                </div>
              )}
              {filteredData.map(order => {
                const config = getStatusConfig(order.status);
                const delivery = calculateDeliveryDate(order.createdAt, order.supplier?.delay);
                const isLate = delivery && delivery.isLate && order.status !== 'LIVREE';
                
                return (
                  <Card
                    key={order.id}
                    className="mobile-card"
                    size="small"
                    bordered
                    hoverable
                    onClick={() => openOrder(order)}
                    style={{
                      borderLeft: `4px solid ${isLate ? '#ff4d4f' : 
                        config.color === 'orange' ? '#faad14' :
                        config.color === 'blue' ? '#1677ff' :
                        config.color === 'cyan' ? '#13c2c2' :
                        config.color === 'green' ? '#52c41a' :
                        config.color === 'red' ? '#ff4d4f' : '#d9d9d9'
                      }`
                    }}
                  >
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      marginBottom: 8 
                    }}>
                      <div>
                        <span style={{ fontSize: '12px', color: '#8c8c8c' }}>#{order.id}</span>
                        <Tag 
                          color={config.color} 
                          icon={config.icon} 
                          style={{ marginLeft: 8, fontWeight: 600 }}
                        >
                          {config.label}
                        </Tag>
                        {isLate && (
                          <Tag color="red" icon={<WarningOutlined />} style={{ marginLeft: 4 }}>
                            Retard
                          </Tag>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Popconfirm
                          title="Confirmer la suppression"
                          onConfirm={() => handleDelete(order.id)}
                          okText="Oui"
                          cancelText="Non"
                        >
                          <Button 
                            size="small" 
                            danger 
                            onClick={(e) => e.stopPropagation()}
                          >
                            <DeleteOutlined />
                          </Button>
                        </Popconfirm>

                        <NavLink to={`/commandefournisseurs/${order.id}`} onClick={(e) => e.stopPropagation()}>
                          <Button size="small" type="primary">
                            <EditOutlined />
                          </Button>
                        </NavLink>
                      </div>
                    </div>

                    <div className="card-row">
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        <AppstoreOutlined style={{ marginRight: 4 }} />
                        Produit
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {order.product?.name || '-'}
                      </div>
                    </div>

                    <div className="card-row">
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        <ShopOutlined style={{ marginRight: 4 }} />
                        Fournisseur
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        {order.supplier?.name || '-'}
                      </div>
                    </div>

                    <div className="card-row">
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        <NumberOutlined style={{ marginRight: 4 }} />
                        Quantité
                      </div>
                      <div style={{ fontWeight: 600 }}>
                        {order.quantity}
                      </div>
                    </div>

                    {delivery && (
                      <div className="card-row">
                        <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                          <CalendarOutlined style={{ marginRight: 4 }} />
                          Livraison
                        </div>
                        <div style={{ fontWeight: 500, color: isLate ? '#ff4d4f' : '#595959' }}>
                          {delivery.date.toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    )}

                    <div className="card-row" style={{ borderBottom: 'none' }}>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        Montant
                      </div>
                      <div style={{ fontWeight: 700, color: '#cf1322', fontSize: 15 }}>
                        {parseFloat(order.amount || 0).toLocaleString('fr-FR')} XAF
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Drawer pour les détails sur mobile */}
            <Drawer
              open={drawerVisible}
              onClose={closeDrawer}
              title={
                <Space>
                  <ShoppingOutlined />
                  Commande #{selectedOrder?.id}
                </Space>
              }
              width={Math.min(520, window.innerWidth - 40)}
            >
              {selectedOrder && (() => {
                const config = getStatusConfig(selectedOrder.status);
                const delivery = calculateDeliveryDate(selectedOrder.createdAt, selectedOrder.supplier?.delay);
                const isLate = delivery && delivery.isLate && selectedOrder.status !== 'LIVREE';
                
                return (
                  <>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Statut">
                        <Tag color={config.color} icon={config.icon} style={{ fontWeight: 600 }}>
                          {config.label}
                        </Tag>
                        {isLate && (
                          <Tag color="red" icon={<WarningOutlined />} style={{ marginLeft: 8 }}>
                            En retard
                          </Tag>
                        )}
                      </Descriptions.Item>

                      <Descriptions.Item label={<><AppstoreOutlined /> Produit</>}>
                        {selectedOrder.product?.name || '-'}
                      </Descriptions.Item>

                      <Descriptions.Item label={<><ShopOutlined /> Fournisseur</>}>
                        {selectedOrder.supplier?.name || '-'}
                      </Descriptions.Item>

                      <Descriptions.Item label={<><NumberOutlined /> Quantité</>}>
                        <Tag color="blue">{selectedOrder.quantity}</Tag>
                      </Descriptions.Item>

                      {delivery && (
                        <Descriptions.Item label={<><CalendarOutlined /> Livraison prévue</>}>
                          <div style={{ color: isLate ? '#ff4d4f' : '#595959', fontWeight: 600 }}>
                            {delivery.date.toLocaleDateString('fr-FR', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </Descriptions.Item>
                      )}

                      <Descriptions.Item label={<><DollarOutlined /> Montant Total</>}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#cf1322' }}>
                          {parseFloat(selectedOrder.amount || 0).toLocaleString('fr-FR')} XAF
                        </span>
                      </Descriptions.Item>
                    </Descriptions>

                    <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                      <Popconfirm
                        title="Confirmer la suppression"
                        onConfirm={() => {
                          handleDelete(selectedOrder.id);
                          closeDrawer();
                        }}
                        okText="Oui"
                        cancelText="Non"
                      >
                        <Button danger icon={<DeleteOutlined />}>
                          Supprimer
                        </Button>
                      </Popconfirm>

                      <NavLink to={`/commandefournisseurs/${selectedOrder.id}`} onClick={() => closeDrawer()}>
                        <Button type="primary" icon={<EditOutlined />}>
                          Éditer
                        </Button>
                      </NavLink>
                    </div>
                  </>
                );
              })()}
            </Drawer>
          </>
        )}
      </Card>

      <AddSupplierOrderForm
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onOrderAdded={(newOrder) => {
          setCommandes(prev => [...prev, newOrder]);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
