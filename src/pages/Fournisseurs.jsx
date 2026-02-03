import React, { useState, useEffect } from 'react';
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
  Tag 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  QuestionCircleOutlined, 
  CaretUpOutlined, 
  CaretDownOutlined,
  ShopOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined,
  ClockCircleOutlined,
  AppstoreOutlined
} from '@ant-design/icons';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { getFournisseurs, getProduits, API_URL } from "../services/api.js";
import axiosInstance from '../services/axiosInstance';

// Modal pour ajouter un fournisseur
const AddSupplierForm = ({ open, onCancel, onSupplierAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [produits, setProduits] = useState([]);

  useEffect(() => {
    if (open) {
      getProduits()
        .then(setProduits)
        .catch(error => console.error("Erreur lors du chargement des produits :", error));
    }
  }, [open]);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${API_URL}Suppliers/`, {
        ...values,
        telephone: parseInt(values.telephone, 10),
        delay: parseInt(values.delay, 10),
      });
      message.success("Fournisseur enregistré avec succès !");
      form.resetFields();
      onSupplierAdded(response.data);
    } catch (error) {
      message.error("Erreur lors de l'ajout du fournisseur !");
      console.error('Erreur lors de l\'ajout', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Ajouter un nouveau fournisseur"
      open={open}
      onCancel={onCancel}
      footer={null}
      confirmLoading={loading}
      width={600}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} name="addSupplierForm">
        <Form.Item 
          name="name" 
          label="Nom du fournisseur" 
          rules={[{ required: true, message: 'Veuillez entrer le nom du fournisseur' }]}
        >
          <Input prefix={<ShopOutlined />} placeholder="Ex: Fournisseur SARL" />
        </Form.Item>

        <Form.Item 
          name="email" 
          label="E-mail" 
          rules={[
            { required: true, message: 'Veuillez entrer l\'email' },
            { type: 'email', message: 'Email invalide' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="contact@fournisseur.com" />
        </Form.Item>

        <Form.Item 
          name="address" 
          label="Adresse" 
          rules={[{ required: true, message: 'Veuillez entrer l\'adresse' }]}
        >
          <Input.TextArea 
            prefix={<HomeOutlined />} 
            rows={2} 
            placeholder="Adresse complète du fournisseur" 
          />
        </Form.Item>

        <Form.Item 
          name="telephone" 
          label="Téléphone" 
          rules={[
            { required: true, message: 'Veuillez entrer le numéro de téléphone' },
            { type: 'number', min: 0, message: 'Numéro invalide' }
          ]}
        >
          <InputNumber 
            style={{ width: '100%' }} 
            placeholder="Ex: 237699123456"
          />
        </Form.Item>

        <Form.Item 
          name="products" 
          label="Produits fournis" 
          rules={[{ required: true, message: 'Veuillez sélectionner au moins un produit' }]}
        >
          <Select 
            mode="multiple" 
            placeholder="Sélectionnez les produits"
            showSearch
            filterOption={(input, option) =>
              (option?.children ?? '').toLowerCase().includes(input.toLowerCase())
            }
          >
            {produits.map((produit) => (
              <Select.Option key={produit.id} value={produit.id}>
                {produit.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item 
          name="delay" 
          label="Délai de livraison (jours)" 
          rules={[
            { required: true, message: 'Veuillez entrer le délai de livraison' },
            { type: 'number', min: 1, message: 'Le délai doit être au moins 1 jour' }
          ]}
        >
          <InputNumber 
            min={1} 
            style={{ width: '100%' }} 
            placeholder="Ex: 3 jours"
            addonAfter="jours"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Enregistrer le fournisseur
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export function Fournisseurs() {
  const [fournisseurs, setFournisseurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

  // Drawer pour mobile
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  useEffect(() => {
    setLoading(true);
    getFournisseurs()
      .then(data => {
        setFournisseurs(data);
      })
      .catch(error => console.error("Erreur lors du chargement des fournisseurs :", error))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`${API_URL}Suppliers/${id}/`);
      message.success('Fournisseur supprimé avec succès');
      setFournisseurs(prev => prev.filter(f => f.id !== id));
    } catch (error) {
      message.error("Erreur lors de la suppression du fournisseur !");
      console.error('Erreur lors de la suppression', error);
    }
  };

  // Colonnes pour React Table
  const columnsRT = [
    { header: 'ID', accessorKey: 'id' },
    { 
      header: 'Nom', 
      accessorKey: 'name',
      cell: ({ row }) => (
        <span style={{ fontWeight: 600 }}>{row.original.name}</span>
      )
    },
    { 
      header: 'Email', 
      accessorKey: 'email',
      cell: ({ row }) => (
        <span style={{ color: '#1677ff' }}>{row.original.email}</span>
      )
    },
    { 
      header: 'Adresse', 
      accessorKey: 'address',
      cell: ({ row }) => (
        <span style={{ fontSize: '13px' }}>{row.original.address}</span>
      )
    },
    { 
      header: 'Téléphone', 
      accessorKey: 'telephone',
      cell: ({ row }) => (
        <Tag color="blue">{row.original.telephone}</Tag>
      )
    },
    { 
      header: 'Délai (jrs)', 
      accessorKey: 'delay',
      cell: ({ row }) => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          {row.original.delay} jours
        </Tag>
      )
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Space size="middle">
          <NavLink to={`/fournisseur/${row.original.id}`}>
            <Button type="primary" icon={<EditOutlined />} shape="circle" />
          </NavLink>
          <Popconfirm
            title="Confirmer la suppression"
            description="Êtes-vous sûr de vouloir supprimer ce fournisseur ?"
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

  const filteredData = fournisseurs.filter(item =>
    item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.email?.toLowerCase().includes(searchTerm.toLowerCase())
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

  const openSupplier = (supplier) => {
    setSelectedSupplier(supplier);
    setDrawerVisible(true);
  };

  const closeDrawer = () => setDrawerVisible(false);

  return (
    <>
      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Gestion des Fournisseurs
          </Typography.Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            onClick={() => setIsModalOpen(true)}
          >
            Ajouter un fournisseur
          </Button>
        </Flex>

        <Input.Search
          placeholder="Rechercher un fournisseur par nom ou email..."
          onSearch={setSearchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
          allowClear
        />

        {screens.lg ? (
          // Vue Desktop - Table
          <div className="table-responsive">
            <table className="table table-hover responsive-table">
              <caption>Liste des fournisseurs</caption>
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
                  Aucun fournisseur trouvé
                </div>
              )}
              {filteredData.map(supplier => (
                <Card
                  key={supplier.id}
                  className="mobile-card"
                  size="small"
                  bordered
                  hoverable
                  onClick={() => openSupplier(supplier)}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 8 
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      <ShopOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                      {supplier.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Popconfirm
                        title="Confirmer la suppression"
                        onConfirm={() => handleDelete(supplier.id)}
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

                      <NavLink to={`/fournisseur/${supplier.id}`} onClick={(e) => e.stopPropagation()}>
                        <Button size="small" type="primary">
                          <EditOutlined />
                        </Button>
                      </NavLink>
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <MailOutlined style={{ marginRight: 4 }} />
                      Email
                    </div>
                    <div style={{ fontWeight: 500, fontSize: 13, color: '#1677ff' }}>
                      {supplier.email}
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      Téléphone
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {supplier.telephone}
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <ClockCircleOutlined style={{ marginRight: 4 }} />
                      Délai
                    </div>
                    <div style={{ fontWeight: 600, color: '#fa8c16' }}>
                      {supplier.delay} jours
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Drawer pour les détails sur mobile */}
            <Drawer
              open={drawerVisible}
              onClose={closeDrawer}
              title={selectedSupplier?.name ?? 'Détails du fournisseur'}
              width={Math.min(520, window.innerWidth - 40)}
            >
              {selectedSupplier && (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label={<><ShopOutlined /> Nom</>}>
                    {selectedSupplier.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><MailOutlined /> Email</>}>
                    <a href={`mailto:${selectedSupplier.email}`} style={{ color: '#1677ff' }}>
                      {selectedSupplier.email}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label={<><PhoneOutlined /> Téléphone</>}>
                    <a href={`tel:${selectedSupplier.telephone}`}>
                      {selectedSupplier.telephone}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label={<><HomeOutlined /> Adresse</>}>
                    {selectedSupplier.address}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><ClockCircleOutlined /> Délai de livraison</>}>
                    <Tag color="orange">{selectedSupplier.delay} jours</Tag>
                  </Descriptions.Item>
                  {selectedSupplier.products && selectedSupplier.products.length > 0 && (
                    <Descriptions.Item label={<><AppstoreOutlined /> Produits fournis</>}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {selectedSupplier.products.map((product, index) => (
                          <Tag key={index} color="blue">
                            {typeof product === 'object' ? product.name : product}
                          </Tag>
                        ))}
                      </div>
                    </Descriptions.Item>
                  )}
                </Descriptions>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                {selectedSupplier && (
                  <>
                    <Popconfirm
                      title="Confirmer la suppression"
                      onConfirm={() => {
                        handleDelete(selectedSupplier.id);
                        closeDrawer();
                      }}
                      okText="Oui"
                      cancelText="Non"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Supprimer
                      </Button>
                    </Popconfirm>

                    <NavLink to={`/fournisseur/${selectedSupplier.id}`} onClick={() => closeDrawer()}>
                      <Button type="primary" icon={<EditOutlined />}>
                        Éditer
                      </Button>
                    </NavLink>
                  </>
                )}
              </div>
            </Drawer>
          </>
        )}
      </Card>

      <AddSupplierForm
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSupplierAdded={(newSupplier) => {
          setFournisseurs(prev => [...prev, newSupplier]);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
