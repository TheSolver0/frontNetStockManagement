import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import { Button, Card, Col, Row, Form, Input, InputNumber, Modal, Select, Popconfirm, message, Table, Tag, Space, Typography, Flex, Grid, Drawer, Descriptions } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, QuestionCircleOutlined, CaretUpOutlined, CaretDownOutlined } from '@ant-design/icons';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import { getProduits, getCategories, API_URL } from "../services/api";
import axiosInstance from '../services/axiosInstance';

const AddProductForm = ({ open, onCancel, onProductAdded }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) {
            getCategories()
                .then(setCategories)
                .catch(error => console.error("Erreur lors du chargement des catégories :", error));
        }
    }, [open]);

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            const response = await axiosInstance.post(`${API_URL}Products/`, {
                ...values,
                categoryId: parseInt(values.categoryId, 10),
            });
            message.success("Produit ajouté avec succès !");
            form.resetFields();
            onProductAdded(response.data);
        } catch (error) {
            message.error("Erreur lors de l’ajout du produit !");
            console.error('Erreur lors de l’ajout', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title="Ajouter un nouveau produit"
            open={open}
            onCancel={onCancel}
            footer={null}
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} name="addProductForm">
                <Form.Item name="name" label="Nom du produit" rules={[{ required: true, message: 'Veuillez entrer le nom du produit' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="desc" label="Description" rules={[{ required: true, message: 'Veuillez entrer une description' }]}>
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="categoryId" label="Catégorie" rules={[{ required: true, message: 'Veuillez sélectionner une catégorie' }]}>
                            <Select placeholder="Sélectionner une catégorie">
                                {categories.map(cat => <Select.Option key={cat.id} value={cat.id}>{cat.title}</Select.Option>)}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="price" label="Prix unitaire (XAF)" rules={[{ required: true, type: 'number', min: 0, message: 'Prix invalide' }]}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="quantity" label="Quantité en stock" rules={[{ required: true, type: 'number', min: 0, message: 'Quantité invalide' }]}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="threshold" label="Seuil d'alerte" rules={[{ required: true, type: 'number', min: 0, message: 'Seuil invalide' }]}>
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>
                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Ajouter le produit
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export function Produits() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        setLoading(true);
        getProduits()
            .then(data => {
                setProduits(data);
                data.forEach(p => {
                    if (p.quantity <= p.threshold) {
                        message.warning(`Le stock du produit "${p.name}" est bas !`);
                    }
                });
            })
            .catch(error => console.error("Erreur lors du chargement des produits :", error))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`${API_URL}Products/${id}/`);
            message.success('Produit supprimé avec succès');
            setProduits(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            message.error("Erreur lors de la suppression du produit !");
            console.error('Erreur lors de la suppression', error);
        }
    };

    const columns = [
        { title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id, },
        { title: 'Nom', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        {
            title: 'Stock',
            dataIndex: 'quantity',
            key: 'quantity',
            sorter: (a, b) => a.quantity - b.quantity,
            render: (stock, record) => (
                <Tag color={stock <= record.threshold ? 'volcano' : 'green'}>
                    {stock}
                </Tag>
            ),
        },
        { title: 'Prix Unitaire', dataIndex: 'price', key: 'price', sorter: (a, b) => a.price - b.price, render: price => `${price.toLocaleString()} XAF` },
        { title: 'Seuil d\'Alerte', dataIndex: 'threshold', key: 'threshold', sorter: (a, b) => a.threshold - b.threshold },
        {
            title: 'Actions',
            key: 'actions',
            render: (_, record) => (
                <Space size="middle">
                    <NavLink to={`/produit/${record.id}`}>
                        <Button type="primary" icon={<EditOutlined />} shape="circle" />
                    </NavLink>
                    <Popconfirm
                        title="Confirmer la suppression"
                        description="Êtes-vous sûr de vouloir supprimer ce produit ?"
                        onConfirm={() => handleDelete(record.id)}
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

    const filteredData = produits.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const screens = Grid.useBreakpoint();
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const openProduct = (p) => {
        setSelectedProduct(p);
        setDrawerVisible(true);
    };

    const closeDrawer = () => setDrawerVisible(false);

    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

    const columnsRT = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Nom', accessorKey: 'name' },
        {
            header: 'Stock',
            accessorKey: 'quantity',
            cell: ({ row }) => (<Tag color={row.original.quantity <= row.original.threshold ? 'volcano' : 'green'}>{row.original.quantity}</Tag>),
        },
        {
            header: 'Prix Unitaire',
            accessorKey: 'price',
            cell: ({ row }) => (row.original.price ? `${row.original.price.toLocaleString()} XAF` : '-'),
        },
        { header: "Seuil d'Alerte", accessorKey: 'threshold' },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Space size="middle">
                    <NavLink to={`/produit/${row.original.id}`}>
                        <Button type="primary" icon={<EditOutlined />} shape="circle" />
                    </NavLink>
                    <Popconfirm
                        title="Confirmer la suppression"
                        description="Êtes-vous sûr de vouloir supprimer ce produit ?"
                        onConfirm={() => handleDelete(row.original.id)}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                        okText="Oui"
                        cancelText="Non"
                    >
                        <Button danger icon={<DeleteOutlined />} shape="circle" />
                    </Popconfirm>
                </Space>
            ),
        },
    ];

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

    return (
        <>
            <Card>
                <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                    <Typography.Title level={2} style={{ margin: 0 }}>Gestion des Produits</Typography.Title>
                    <Button type="primary" icon={<PlusOutlined />} size="large" onClick={() => setIsModalOpen(true)}>
                        Ajouter un produit
                    </Button>
                </Flex>
                <Input.Search
                    placeholder="Rechercher un produit..."
                    onSearch={setSearchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    style={{ marginBottom: 16, maxWidth: 300 }}
                    allowClear
                />
                {screens.lg ? (
                    <div className="table-responsive">
                        <table className="table table-hover responsive-table">
                            <caption>Liste des produits</caption>
                            <thead className="table-light">
                                {table.getHeaderGroups().map(hg => (
                                    <tr key={hg.id}>
                                        {hg.headers.map(header => (
                                            <th key={header.id} style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }} onClick={header.column.getToggleSortingHandler()}>
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {{ asc: <CaretUpOutlined />, desc: <CaretDownOutlined /> }[header.column.getIsSorted()] ?? null}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>
                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id}>{row.getVisibleCells().map(cell => <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>)}</tr>
                                ))}
                            </tbody>
                        </table>
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                            <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</Button>
                            <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</Button>
                            <span>Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="responsive-cards">
                            {filteredData.length === 0 && <div style={{ padding: 20, textAlign: 'center' }}>Aucun produit</div>}
                            {filteredData.map(product => (
                                <Card
                                    key={product.id}
                                    className="mobile-card"
                                    size="small"
                                    bordered
                                    hoverable
                                    onClick={() => openProduct(product)}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700 }}>{product.name}</div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <Popconfirm title="Confirmer la suppression" onConfirm={() => handleDelete(product.id)} okText="Oui" cancelText="Non">
                                                <Button size="small" danger onClick={(e) => e.stopPropagation()}><DeleteOutlined /></Button>
                                            </Popconfirm>

                                            <NavLink to={`/produit/${product.id}`} onClick={(e) => e.stopPropagation()}>
                                                <Button size="small" type="primary"><EditOutlined /></Button>
                                            </NavLink>
                                        </div>
                                    </div>

                                    <div className="card-row">
                                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Stock</div>
                                        <div style={{ fontWeight: 600 }}>{product.quantity}</div>
                                    </div>
                                    <div className="card-row">
                                        <div style={{ color: 'var(--muted)', fontSize: 12 }}>Prix</div>
                                        <div style={{ fontWeight: 600 }}>{product.price?.toLocaleString()} XAF</div>
                                    </div>
                                </Card>
                            ))}
                        </div>

                        <Drawer
                            open={drawerVisible}
                            onClose={closeDrawer}
                            title={selectedProduct?.name ?? 'Détails du produit'}
                            width={Math.min(520, window.innerWidth - 40)}
                        >
                            {selectedProduct && (
                                <Descriptions column={1} size="small">
                                    <Descriptions.Item label="Nom">{selectedProduct.name}</Descriptions.Item>
                                    <Descriptions.Item label="Description">{selectedProduct.desc}</Descriptions.Item>
                                    <Descriptions.Item label="Prix">{selectedProduct.price?.toLocaleString()} XAF</Descriptions.Item>
                                    <Descriptions.Item label="Quantité">{selectedProduct.quantity}</Descriptions.Item>
                                    <Descriptions.Item label="Seuil">{selectedProduct.threshold}</Descriptions.Item>
                                </Descriptions>
                            )}

                            <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                {selectedProduct && (
                                    <>
                                        <Popconfirm title="Confirmer la suppression" onConfirm={() => { handleDelete(selectedProduct.id); closeDrawer(); }} okText="Oui" cancelText="Non">
                                            <Button danger>Supprimer</Button>
                                        </Popconfirm>
                                        <NavLink to={`/produit/${selectedProduct.id}`} onClick={() => closeDrawer()}>
                                            <Button type="primary">Éditer</Button>
                                        </NavLink>
                                    </>
                                )}
                            </div>
                        </Drawer>
                    </>
                )}            </Card>

            <AddProductForm
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                onProductAdded={(newProduct) => {
                    setProduits(prev => [...prev, newProduct]);
                    setIsModalOpen(false);
                }}
            />
        </>
    );
}