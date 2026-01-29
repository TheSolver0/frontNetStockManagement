import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import { 
  Button, 
  Card, 
  Form, 
  Input, 
  InputNumber, 
  Modal, 
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
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  HomeOutlined
} from '@ant-design/icons';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { getClients, API_URL } from "../services/api";
import axiosInstance from '../services/axiosInstance';

// Modal pour ajouter un client
const AddClientForm = ({ open, onCancel, onClientAdded }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleFinish = async (values) => {
    setLoading(true);
    try {
      const response = await axiosInstance.post(`${API_URL}Customers/`, {
        ...values,
        telephone: parseInt(values.telephone, 10),
      });
      message.success("Client enregistré avec succès !");
      form.resetFields();
      onClientAdded(response.data);
    } catch (error) {
      message.error("Erreur lors de l'ajout du client !");
      console.error('Erreur lors de l\'ajout', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Ajouter un nouveau client"
      open={open}
      onCancel={onCancel}
      footer={null}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical" onFinish={handleFinish} name="addClientForm">
        <Form.Item 
          name="name" 
          label="Nom complet" 
          rules={[{ required: true, message: 'Veuillez entrer le nom du client' }]}
        >
          <Input prefix={<UserOutlined />} placeholder="Ex: Jean Dupont" />
        </Form.Item>

        <Form.Item 
          name="email" 
          label="E-mail" 
          rules={[
            { required: true, message: 'Veuillez entrer l\'email' },
            { type: 'email', message: 'Email invalide' }
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="exemple@email.com" />
        </Form.Item>

        <Form.Item 
          name="address" 
          label="Adresse" 
          rules={[{ required: true, message: 'Veuillez entrer l\'adresse' }]}
        >
          <Input.TextArea 
            prefix={<HomeOutlined />} 
            rows={2} 
            placeholder="Adresse complète du client" 
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
            prefix={<PhoneOutlined />}
            style={{ width: '100%' }} 
            placeholder="Ex: 237699123456"
          />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            Enregistrer le client
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

  // Drawer pour mobile
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    setLoading(true);
    getClients()
      .then(data => {
        setClients(data);
      })
      .catch(error => console.error("Erreur lors du chargement des clients :", error))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    try {
      await axiosInstance.delete(`${API_URL}Customers/${id}/`);
      message.success('Client supprimé avec succès');
      setClients(prev => prev.filter(c => c.id !== id));
    } catch (error) {
      message.error("Erreur lors de la suppression du client !");
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
      header: 'Actions',
      id: 'actions',
      cell: ({ row }) => (
        <Space size="middle">
          <NavLink to={`/client/${row.original.id}`}>
            <Button type="primary" icon={<EditOutlined />} shape="circle" />
          </NavLink>
          <Popconfirm
            title="Confirmer la suppression"
            description="Êtes-vous sûr de vouloir supprimer ce client ?"
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

  const filteredData = clients.filter(item =>
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

  const openClient = (client) => {
    setSelectedClient(client);
    setDrawerVisible(true);
  };

  const closeDrawer = () => setDrawerVisible(false);

  return (
    <>
      <Card>
        <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
          <Typography.Title level={2} style={{ margin: 0 }}>
            Gestion des Clients
          </Typography.Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="large" 
            onClick={() => setIsModalOpen(true)}
          >
            Ajouter un client
          </Button>
        </Flex>

        <Input.Search
          placeholder="Rechercher un client par nom ou email..."
          onSearch={setSearchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          style={{ marginBottom: 16, maxWidth: 400 }}
          allowClear
        />

        {screens.lg ? (
          // Vue Desktop - Table
          <div className="table-responsive">
            <table className="table table-hover responsive-table">
              <caption>Liste des clients</caption>
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
                  Aucun client trouvé
                </div>
              )}
              {filteredData.map(client => (
                <Card
                  key={client.id}
                  className="mobile-card"
                  size="small"
                  bordered
                  hoverable
                  onClick={() => openClient(client)}
                >
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: 8 
                  }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>
                      <UserOutlined style={{ marginRight: 6, color: '#1677ff' }} />
                      {client.name}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Popconfirm
                        title="Confirmer la suppression"
                        onConfirm={() => handleDelete(client.id)}
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

                      <NavLink to={`/client/${client.id}`} onClick={(e) => e.stopPropagation()}>
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
                      {client.email}
                    </div>
                  </div>

                  <div className="card-row">
                    <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                      <PhoneOutlined style={{ marginRight: 4 }} />
                      Téléphone
                    </div>
                    <div style={{ fontWeight: 600 }}>
                      {client.telephone}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Drawer pour les détails sur mobile */}
            <Drawer
              open={drawerVisible}
              onClose={closeDrawer}
              title={selectedClient?.name ?? 'Détails du client'}
              width={Math.min(520, window.innerWidth - 40)}
            >
              {selectedClient && (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label={<><UserOutlined /> Nom</>}>
                    {selectedClient.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={<><MailOutlined /> Email</>}>
                    <a href={`mailto:${selectedClient.email}`} style={{ color: '#1677ff' }}>
                      {selectedClient.email}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label={<><PhoneOutlined /> Téléphone</>}>
                    <a href={`tel:${selectedClient.telephone}`}>
                      {selectedClient.telephone}
                    </a>
                  </Descriptions.Item>
                  <Descriptions.Item label={<><HomeOutlined /> Adresse</>}>
                    {selectedClient.address}
                  </Descriptions.Item>
                </Descriptions>
              )}

              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                {selectedClient && (
                  <>
                    <Popconfirm
                      title="Confirmer la suppression"
                      onConfirm={() => {
                        handleDelete(selectedClient.id);
                        closeDrawer();
                      }}
                      okText="Oui"
                      cancelText="Non"
                    >
                      <Button danger icon={<DeleteOutlined />}>
                        Supprimer
                      </Button>
                    </Popconfirm>

                    <NavLink to={`/client/${selectedClient.id}`} onClick={() => closeDrawer()}>
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

      <AddClientForm
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onClientAdded={(newClient) => {
          setClients(prev => [...prev, newClient]);
          setIsModalOpen(false);
        }}
      />
    </>
  );
}
