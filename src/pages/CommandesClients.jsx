import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
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
  
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined, 
  CaretUpOutlined, 
  CaretDownOutlined,
  ShoppingCartOutlined,
  UserOutlined,
  AppstoreOutlined,
  NumberOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  SyncOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { getCommandesClient, getProduits, getClients, API_URL } from "../services/api.js";
import axiosInstance from '../services/axiosInstance';
import { useCommandesReducer } from '../hooks/useCommandesReducer.js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoUrl from '../assets/images/logoKFTech.jpg'; 

// Modal pour ajouter une commande
const AddOrderForm = ({ open, onCancel, onOrderAdded }) => {
   const [form] = Form.useForm();
  const [clientForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState([]);
  const [clients, setClients] = useState([]);
  const [addClientVisible, setAddClientVisible] = useState(false);
  const [addingClient, setAddingClient] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (open) {
      Promise.all([getProduits(), getClients()])
        .then(([produitsData, clientsData]) => {
          setProduits(produitsData);
          setClients(clientsData);
        });
    }
  }, [open]);
  const handleAddClient = async (values) => {
    setAddingClient(true);
    try {
      const response = await axiosInstance.post(`${API_URL}Customers/`, {
        ...values,
        telephone: parseInt(values.telephone, 10),
      });
      const newClient = response.data;
      setClients(prev => [...prev, newClient]);
      form.setFieldsValue({ customerId: newClient.id });
      message.success(`Client "${newClient.name}" créé et sélectionné !`);
      setAddClientVisible(false);
      clientForm.resetFields();
    } catch (error) {
      message.error("Erreur lors de la création du client !");
    } finally {
      setAddingClient(false);
    }
  };

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${API_URL}Orders/`, {
        id: 0,                                // valeur par défaut pour la création
        quantity: parseInt(values.quantity, 10),
        amount: parseInt(values.quantity, 10) * (selectedProduct?.price ?? 0),                           
        status: 0,                    // statut initial d'une nouvelle commande
        productId: values.productId,
        customerId: values.customerId,
      });
      message.success("Commande ajoutée avec succès !");
      form.resetFields();
      setSelectedProduct(null);
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

 return (
    <>
      <Modal title="Ajouter une nouvelle commande" open={open} onCancel={onCancel} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleFinish}>

          <Form.Item name="productId" label="Produit" rules={[{ required: true }]}>
  <Select
    placeholder="Sélectionnez un produit"
    showSearch
    filterOption={(input, option) =>
      (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
    }
    onChange={(value) => {
      const product = produits.find(p => p.id === value);
      setSelectedProduct(product);
    }}
  >
    {produits.map(p => (
      <Select.Option key={p.id} value={p.id}>
        {p.name} - {p.price?.toLocaleString('fr-FR')} XAF
      </Select.Option>
    ))}
  </Select>
</Form.Item>

          <Form.Item name="quantity" label="Quantité" rules={[{ required: true, type: 'number', min: 1 }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Client">
            <Input.Group compact>
              <Form.Item name="customerId" noStyle rules={[{ required: true, message: 'Sélectionnez un client' }]}>
                <Select placeholder="Sélectionnez un client" showSearch style={{ width: 'calc(100% - 120px)' }}
                  filterOption={(input, option) =>
                    (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                >
                  {clients.map(c => (
                    <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Button 
                icon={<PlusOutlined />} 
                onClick={() => setAddClientVisible(true)}
                style={{ width: 120 }}
              >
                Nouveau
              </Button>
            </Input.Group>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              Ajouter la commande
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal création client rapide */}
      <Modal
        title="Nouveau client"
        open={addClientVisible}
        onCancel={() => { setAddClientVisible(false); clientForm.resetFields(); }}
        footer={null}
        width={400}
      >
        <Form form={clientForm} layout="vertical" onFinish={handleAddClient}>
          <Form.Item name="name" label="Nom complet" rules={[{ required: true }]}>
            <Input placeholder="Jean Dupont" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="jean@email.com" />
          </Form.Item>
          <Form.Item name="address" label="Adresse" rules={[{ required: true }]}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="telephone" label="Téléphone" rules={[{ required: true, type: 'number', min: 0 }]}>
            <InputNumber style={{ width: '100%' }} placeholder="237699123456" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={addingClient} block>
              Créer et sélectionner
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};




export function CommandesClients() {
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
    getCommandesClient()
      .then(data => {
        setCommandes(data);
        // Vérifier les commandes en attente
        data.forEach(c => {
          if (c.status === 'EN_ATTENTE') {
            message.warning(`La commande #${c.id} est en attente de validation`, 3);
          }
        });
      })
      .catch(error => console.error("Erreur lors du chargement des commandes :", error))
      .finally(() => setLoading(false));
  }, []);

  useCommandesReducer(commandes);

  const handleDelete = useCallback(async (id) => {
  try {
    await axiosInstance.delete(`${API_URL}Orders/${id}/`);
    message.success('Commande supprimée avec succès');
    setTimeout(() => {
      setCommandes(prev => prev.filter(c => c.id !== id));
    }, 1000);
  } catch (error) {
    message.error("Erreur lors de la suppression de la commande !");
  }
}, []);


  // Fonction pour obtenir la config du statut
  const getStatusConfig = useCallback((status) => {
  const configs = {
    'EN_ATTENTE': { color: 'orange', icon: <ClockCircleOutlined />, label: 'En attente' },
    'PREPAREE':   { color: 'blue',   icon: <SyncOutlined />,        label: 'Préparée' },
    'EXPEDIEE':   { color: 'cyan',   icon: <SyncOutlined spin />,   label: 'Expédiée' },
    'LIVREE':     { color: 'green',  icon: <CheckCircleOutlined />, label: 'Livrée' },
    'ANNULEE':    { color: 'red',    icon: <CloseCircleOutlined />, label: 'Annulée' }
  };
  return configs[status] || { color: 'default', icon: null, label: status };
}, []);

  // Calcul des statistiques
  const stats = useMemo(() => {
  const enAttente   = commandes.filter(c => c.status === 'EN_ATTENTE').length;
  const livrees     = commandes.filter(c => c.status === 'LIVREE').length;
  const totalMontant = commandes
    .filter(c => c.status === 'LIVREE')
    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);
  return { total: commandes.length, enAttente, livrees, totalMontant };
}, [commandes]);

const fmtXAF = (value) =>
  parseFloat(value || 0)
    .toFixed(2)
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ') // espace simple comme séparateur milliers
    .replace('.', ',')                        // virgule décimale à la française
    + ' XAF';

const downloadInvoicePDF = useCallback(async (order) => {
  const doc = new jsPDF();
  const config = getStatusConfig(order.status);
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  let logoData = null;
  try {
    const res = await fetch('/assets/images/logoKFTech.jpg');
    const blob = await res.blob();
    logoData = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (_) {
    console.warn('Logo non trouvé');
  }

  const C = {
  navy:      [180, 70,  0],    // orange foncé (remplace navy)
  blue:      [230, 100, 20],   // orange moyen (remplace blue)
  blueLight: [255, 240, 225],  // orange très clair (remplace blueLight)
  gold:      [255, 200, 80],   // jaune doré (reste accent)
  dark:      [25,  25,  35],
  mid:       [100, 105, 120],
  light:     [255, 248, 240],  // fond chaud (remplace light)
  border:    [235, 210, 190],  // bordure orangée
  white:     [255, 255, 255],
};

  const W = 210;   // largeur page mm
  const MARGIN = 14;

  // ── 1. Fond header dégradé simulé ──────────────────────────────────────────
  // Bande principale
  doc.setFillColor(...C.navy);
  doc.rect(0, 0, W, 42, 'F');

  // Accent doré (bande fine en bas du header)
  doc.setFillColor(...C.gold);
  doc.rect(0, 42, W, 2, 'F');

  // Carré décoratif (cercle tronqué coin droit) — effet géométrique
  doc.setFillColor(150, 55, 0); 
  doc.circle(W - 10, -5, 38, 'F');

  // ── 2. Logo + nom entreprise ───────────────────────────────────────────────
  try {
   if (logoData) {
    doc.addImage(logoData, 'JPEG', MARGIN, 7, 24, 24);
  }
  } catch (_) {
    // fallback : carré placeholder si logo absent
    doc.setFillColor(...C.gold);
    doc.roundedRect(MARGIN, 7, 24, 24, 3, 3, 'F');
    doc.setTextColor(...C.navy);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('LOGO', MARGIN + 12, 22, { align: 'center' });
  }

  doc.setTextColor(...C.white);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('KF TECH', MARGIN + 28, 18);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 205, 235);
  doc.text('Solutions Informatiques & Gestion', MARGIN + 28, 24);

  // ── 3. Titre FACTURE + numéro (aligné à droite) ───────────────────────────
  doc.setTextColor(...C.white);
  doc.setFontSize(26);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURE', W - MARGIN, 19, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(190, 205, 235);
  doc.text(`N° ${order.id}`, W - MARGIN, 27, { align: 'right' });
  doc.text(`Émise le ${dateStr}`, W - MARGIN, 33, { align: 'right' });

  // ── 4. Bandeau statut ────────────────────────────────────────────────────
const statusColors = {
  paid:      [0,  150, 100],
  pending:   [180, 70,   0],   // orange = votre couleur principale
  cancelled: [180,  40,  40],
};
  const sCx = statusColors[order.status] ?? [80, 80, 80];
  doc.setFillColor(...sCx);
  doc.roundedRect(MARGIN, 50, 55, 10, 2, 2, 'F');
  doc.setTextColor(...C.white);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.text(`● ${config.label.toUpperCase()}`, MARGIN + 4, 56.5);

  // ── 5. Deux colonnes : Facturé à / Détails commande ──────────────────────
  const colA = MARGIN;
  const colB = 115;
  const rowStart = 68;

  // Carte Facturé à
  doc.setFillColor(...C.blueLight);
  doc.roundedRect(colA, rowStart, 90, 42, 3, 3, 'F');
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(colA, rowStart, 90, 42, 3, 3, 'S');

  doc.setFillColor(...C.blue);
  doc.roundedRect(colA, rowStart, 90, 8, 3, 3, 'F');
  doc.rect(colA, rowStart + 4, 90, 4, 'F'); // coin bas carré

  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('FACTURÉ À', colA + 5, rowStart + 5.5);

  doc.setTextColor(...C.dark);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(order.customer?.name || '-', colA + 5, rowStart + 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...C.mid);
  let cy = rowStart + 22;
  if (order.customer?.email) {
    doc.text(`✉  ${order.customer.email}`, colA + 5, cy); cy += 6;
  }
  if (order.customer?.telephone) {
    doc.text(`✆  ${order.customer.telephone}`, colA + 5, cy); cy += 6;
  }
  if (order.customer?.address) {
    const lines = doc.splitTextToSize(order.customer.address, 78);
    doc.text(lines, colA + 5, cy);
  }

  // Carte Détails commande
  doc.setFillColor(...C.light);
  doc.roundedRect(colB, rowStart, 81, 42, 3, 3, 'F');
  doc.setDrawColor(...C.border);
  doc.roundedRect(colB, rowStart, 81, 42, 3, 3, 'S');

  doc.setFillColor(...C.navy);
  doc.roundedRect(colB, rowStart, 81, 8, 3, 3, 'F');
  doc.rect(colB, rowStart + 4, 81, 4, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('DÉTAILS COMMANDE', colB + 5, rowStart + 5.5);

  const details = [
    ['N° Commande',  `#${order.id}`],
    ['Date',          dateStr],
    ['Produit',       order.product?.name || '-'],
    ['Quantité',      String(order.quantity ?? '-')],
  ];
  details.forEach(([label, value], i) => {
    const y = rowStart + 15 + i * 7;
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...C.mid);
    doc.text(label, colB + 5, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...C.dark);
    doc.text(value, colB + 76, y, { align: 'right' });
}, [getStatusConfig]);

  // ── 6. Tableau articles ───────────────────────────────────────────────────
  autoTable(doc, {
    startY: 118,
    head: [['#', 'Désignation', 'Qté', 'Prix unitaire (XAF)', 'Total (XAF)']],
    body: [[
      '01',
      order.product?.name || '-',
      order.quantity,
      fmtXAF(order.product?.price),
      fmtXAF(order.amount)
    ]],
    headStyles: {
      fillColor: C.navy,
      textColor: C.white,
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 10,
      cellPadding: 5,
      textColor: C.dark,
    },
    alternateRowStyles: { fillColor: C.blueLight },
    columnStyles: {
  0: { cellWidth: 12, halign: 'center', textColor: C.mid },
  1: { cellWidth: 68 },                          // ← réduit
  2: { cellWidth: 16, halign: 'center' },        // ← réduit
  3: { cellWidth: 44, halign: 'right' },
  4: { cellWidth: 44, halign: 'right', fontStyle: 'bold' },
},
    margin: { left: MARGIN, right: MARGIN },
    tableLineColor: C.border,
    tableLineWidth: 0.2,
  });

  // ── 7. Récapitulatif total ────────────────────────────────────────────────
  const finalY = doc.lastAutoTable.finalY;

  // Sous-total
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...C.mid);
  doc.text('Sous-total HT', 140, finalY + 10);
  doc.text(fmtXAF(order.amount), W - MARGIN, finalY + 10, { align: 'right' });

  // Taxes (exemple 0%)
  doc.text('Taxes (0%)', 140, finalY + 17);
  doc.text('0 XAF', W - MARGIN, finalY + 17, { align: 'right' });

  // Séparateur
  doc.setDrawColor(...C.gold);
  doc.setLineWidth(0.8);
  doc.line(135, finalY + 21, W - MARGIN, finalY + 21);

  // Bloc TOTAL
  doc.setFillColor(...C.navy);
  doc.roundedRect(120, finalY + 24, W - MARGIN - 120, 14, 2, 2, 'F');

  doc.setTextColor(...C.white);
  doc.setFontSize(10);                                                  
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TTC', 126, finalY + 33);
  doc.setTextColor(...C.gold);
  doc.text(fmtXAF(order.amount), W - MARGIN, finalY + 33, { align: 'right' });

  // ── 8. Note de bas de page ────────────────────────────────────────────────
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, 272, W - MARGIN, 272);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...C.mid);
  doc.text('Merci pour votre confiance. Pour toute question, contactez-nous à support@kftech237.com', 105, 277, { align: 'center' });

  // Bande finale décorative
  doc.setFillColor(...C.navy);
  doc.rect(0, 285, W, 12, 'F');
  doc.setFillColor(...C.gold);
  doc.rect(0, 285, W, 1.5, 'F');
  doc.setTextColor(190, 205, 235);
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('KF TECH  •  Solutions Informatiques  •  Douala, Cameroun  •  www.kftech237.com', 105, 291, { align: 'center' });

  doc.save(`facture-${order.id}.pdf`);
}, [getStatusConfig]);

  // Colonnes pour React Table
  const columnsRT = useMemo(() => [
  { 
    header: 'ID', accessorKey: 'id',
    cell: ({ row }) => <span style={{ fontWeight: 600, color: '#8c8c8c' }}>#{row.original.id}</span>
  },
  {
    header: 'Produit', accessorKey: 'product.name',
    cell: ({ row }) => (
      <span style={{ fontWeight: 600 }}>
        <AppstoreOutlined style={{ marginRight: 4, color: '#1677ff' }} />
        {row.original.product?.name || '-'}
      </span>
    )
  },
  {
    header: 'Quantité', accessorKey: 'quantity',
    cell: ({ row }) => <Tag color="blue"><NumberOutlined /> {row.original.quantity}</Tag>
  },
  {
    header: 'Client', accessorKey: 'customer.name',
    cell: ({ row }) => (
      <span>
        <UserOutlined style={{ marginRight: 4, color: '#52c41a' }} />
        {row.original.customer?.name || '-'}
      </span>
    )
  },
  {
    header: 'Prix Unitaire', accessorKey: 'product.price',
    cell: ({ row }) => (
      <span style={{ fontWeight: 500 }}>
        {row.original.product?.price?.toLocaleString('fr-FR')} XAF
      </span>
    )
  },
  {
    header: 'Montant Total', accessorKey: 'amount',
    cell: ({ row }) => (
      <span style={{ fontWeight: 700, color: '#1677ff', fontSize: '14px' }}>
        {parseFloat(row.original.amount || 0).toLocaleString('fr-FR')} XAF
      </span>
    )
  },
  {
    header: 'Statut', accessorKey: 'status',
    cell: ({ row }) => {
      const config = getStatusConfig(row.original.status);
      return <Tag color={config.color} icon={config.icon} style={{ fontWeight: 600 }}>{config.label}</Tag>;
    }
  },
  {
    header: 'Actions', id: 'actions',
    cell: ({ row }) => (
      <Space size="middle">
        <NavLink to={`/commandeclients/${row.original.id}`}>
          <Button type="primary" icon={<EditOutlined />} shape="circle" />
        </NavLink>
       <Button 
  icon={<DownloadOutlined />} 
  shape="circle" 
  title="Télécharger la facture"
  onClick={() => downloadInvoicePDF(row.original)} 
/>
        <Popconfirm
          title="Confirmer la suppression"
          onConfirm={() => handleDelete(row.original.id)}
          icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
          okText="Oui" cancelText="Non"
        >
          <Button danger icon={<DeleteOutlined />} shape="circle" />
        </Popconfirm>
      </Space>
    ),
  },
], [handleDelete, getStatusConfig]);


  const filteredData = useMemo(() =>
  commandes.filter(item =>
    item.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.status?.toLowerCase().includes(searchTerm.toLowerCase())
  ),
[commandes, searchTerm]);
  const table = useReactTable({
    data: filteredData,
    columns: columnsRT,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: false, 
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
            <ShoppingCartOutlined /> Commandes Clients
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
            <Card className="dashboard-card" variant="outlined" style={{ 
              borderTop: '1px solid #1677ff',
              background: 'linear-gradient(135deg, #ffffff 0%, #f0f5ff 100%)'
            }}>
              <Statistic 
                title="Total Commandes" 
                value={stats.total}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" variant="outlined" style={{ 
              borderTop: '1px solid #faad14',
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
            <Card className="dashboard-card" variant="outlined" style={{ 
              borderTop: '1px solid #52c41a',
              background: 'linear-gradient(135deg, #ffffff 0%, #f6ffed 100%)'
            }}>
              <Statistic 
                title="Livrées" 
                value={stats.livrees}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Card className="dashboard-card" variant="outlined" style={{ 
              borderTop: '1px solid #722ed1',
              background: 'linear-gradient(135deg, #ffffff 0%, #f9f0ff 100%)'
            }}>
              <Statistic 
                title="Revenus (Livrées)" 
                value={stats.totalMontant}
                suffix="XAF"
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#722ed1' }}
              />
            </Card>
          </Col>
        </Row>

        <Input.Search
          placeholder="Rechercher par produit, client ou statut..."
          onSearch={setSearchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 500 }}
          allowClear
        />

        {screens.lg ? (
          // Vue Desktop - Table
          <div className="table-responsive">
            <table className="table table-hover responsive-table">
              <caption>Liste des commandes clients</caption>
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
  {header.column.getCanSort() && (
    header.column.getIsSorted() === 'asc' 
      ? <CaretUpOutlined /> 
      : header.column.getIsSorted() === 'desc' 
        ? <CaretDownOutlined /> 
        : null
  )}
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
                return (
                  <Card
                    key={order.id}
                    className="mobile-card"
                    size="small"
                   variant="outlined"
                    hoverable
                    onClick={() => openOrder(order)}
                    style={{
                      borderLeft: `4px solid ${
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

                        <NavLink to={`/commandeclients/${order.id}`} onClick={(e) => e.stopPropagation()}>
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
                        <UserOutlined style={{ marginRight: 4 }} />
                        Client
                      </div>
                      <div style={{ fontWeight: 500 }}>
                        {order.customer?.name || '-'}
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

                    <div className="card-row" style={{ borderBottom: 'none' }}>
                      <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                        <DollarOutlined style={{ marginRight: 4 }} />
                        Montant
                      </div>
                      <div style={{ fontWeight: 700, color: '#1677ff', fontSize: 15 }}>
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
                  <ShoppingCartOutlined />
                  Commande #{selectedOrder?.id}
                </Space>
              }
              width={Math.min(520, window.innerWidth - 40)}
            >
              {selectedOrder && (() => {
                const config = getStatusConfig(selectedOrder.status);
                return (
                  <>
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label="Statut">
                        <Tag color={config.color} icon={config.icon} style={{ fontWeight: 600 }}>
                          {config.label}
                        </Tag>
                      </Descriptions.Item>

                      <Descriptions.Item label={<><AppstoreOutlined /> Produit</>}>
                        {selectedOrder.product?.name || '-'}
                      </Descriptions.Item>

                      <Descriptions.Item label={<><UserOutlined /> Client</>}>
                        {selectedOrder.customer?.name || '-'}
                      </Descriptions.Item>

                      <Descriptions.Item label={<><NumberOutlined /> Quantité</>}>
                        <Tag color="blue">{selectedOrder.quantity}</Tag>
                      </Descriptions.Item>

                      <Descriptions.Item label="Prix Unitaire">
                        {selectedOrder.product?.price?.toLocaleString('fr-FR')} XAF
                      </Descriptions.Item>

                      <Descriptions.Item label={<><DollarOutlined /> Montant Total</>}>
                        <span style={{ fontWeight: 700, fontSize: '16px', color: '#1677ff' }}>
                          {parseFloat(selectedOrder.amount || 0).toLocaleString('fr-FR')} XAF
                        </span>
                      </Descriptions.Item>
                    </Descriptions>

                
<div style={{ marginTop: 20, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
  <Button 
    icon={<DownloadOutlined />} 
    onClick={() => downloadInvoicePDF(selectedOrder)}
    style={{ borderColor: '#1677ff', color: '#1677ff' }}
  >
    Facture PDF
  </Button>

  <Popconfirm
    title="Confirmer la suppression"
    onConfirm={() => { handleDelete(selectedOrder.id); closeDrawer(); }}
    okText="Oui" cancelText="Non"
  >
    <Button danger icon={<DeleteOutlined />}>Supprimer</Button>
  </Popconfirm>

  <NavLink to={`/commandeclients/${selectedOrder.id}`} onClick={() => closeDrawer()}>
    <Button type="primary" icon={<EditOutlined />}>Éditer</Button>
  </NavLink>
</div>
                  </>
                );
              })()}
            </Drawer>
          </>
        )}
      </Card>

      <AddOrderForm
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
