import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { NavLink } from "react-router-dom";
import {
    Button, Card, Col, Row, Form, Input, InputNumber, Modal,
    Select, Popconfirm, message, Tag, Space, Typography, Flex,
    Grid, Drawer, Descriptions,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined,
    QuestionCircleOutlined, CaretUpOutlined, CaretDownOutlined,
    InboxOutlined,
} from '@ant-design/icons';
import {
    useReactTable,
    getCoreRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import { getProduits, getCategories, API_URL } from "../services/api.js";
import axiosInstance from '../services/axiosInstance';
import { usePermissions } from '../hooks/usePermissions';
import { ProductImageUploadCreate, ProductGallery } from '../components/ProductImageUpload';

// ─── Miniature produit ────────────────────────────────────────────────────────
const ProductImage = ({ src, name, size = 40 }) =>
    src ? (
        <img
            src={src}
            alt={name}
            style={{ width: size, height: size, objectFit: 'cover', borderRadius: 6 }}
        />
    ) : (
        <div style={{
            width: size, height: size, borderRadius: 6,
            background: 'var(--color-background-secondary)',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: size * 0.45,
        }}>
            <InboxOutlined style={{ color: '#bfbfbf' }} />
        </div>
    );

// ─── Formulaire d'ajout ───────────────────────────────────────────────────────
const AddProductForm = ({ open, onCancel, onProductAdded }) => {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);

    useEffect(() => {
        if (open) {
            getCategories()
                .then(setCategories)
                .catch(err => console.error("Erreur catégories :", err));
        }
    }, [open]);

    // Reset les fichiers à la fermeture
    useEffect(() => {
        if (!open) setSelectedFiles([]);
    }, [open]);

    const handleFinish = async (values) => {
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', values.name);
            fd.append('desc', values.desc ?? '');
            fd.append('categoryId', parseInt(values.categoryId, 10));
            fd.append('price', values.price);
            fd.append('quantity', values.quantity);
            fd.append('threshold', values.threshold);
            if (values.sku) fd.append('sku', values.sku);
            if (values.location) fd.append('location', values.location);

            // Multi-images — la 1ère sera automatiquement l'image principale
            selectedFiles.forEach(file => fd.append('Images', file));

            const response = await axiosInstance.post(`${API_URL}Products/`, fd, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            message.success("Produit ajouté avec succès !");
            form.resetFields();
            setSelectedFiles([]);
            onProductAdded(response.data);
        } catch (error) {
            message.error("Erreur lors de l'ajout du produit !");
            console.error('Erreur ajout :', error);
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
            width={600}
            confirmLoading={loading}
        >
            <Form form={form} layout="vertical" onFinish={handleFinish} name="addProductForm">

                {/* ── Multi-upload d'images ── */}
                <Form.Item label="Images du produit">
                    <ProductImageUploadCreate onFilesChange={setSelectedFiles} />
                </Form.Item>

                <Form.Item
                    name="name"
                    label="Nom du produit"
                    rules={[{ required: true, message: 'Veuillez entrer le nom du produit' }]}
                >
                    <Input />
                </Form.Item>

                <Form.Item
                    name="desc"
                    label="Description"
                    rules={[{ required: true, message: 'Veuillez entrer une description' }]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="categoryId"
                            label="Catégorie"
                            rules={[{ required: true, message: 'Veuillez sélectionner une catégorie' }]}
                        >
                            <Select placeholder="Sélectionner une catégorie">
                                {categories.map(cat => (
                                    <Select.Option key={cat.id} value={cat.id}>{cat.title}</Select.Option>
                                ))}
                            </Select>
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="price"
                            label="Prix unitaire (XAF)"
                            rules={[{ required: true, type: 'number', min: 0, message: 'Prix invalide' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item
                            name="quantity"
                            label="Quantité en stock"
                            rules={[{ required: true, type: 'number', min: 0, message: 'Quantité invalide' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item
                            name="threshold"
                            label="Seuil d'alerte"
                            rules={[{ required: true, type: 'number', min: 0, message: 'Seuil invalide' }]}
                        >
                            <InputNumber style={{ width: '100%' }} />
                        </Form.Item>
                    </Col>
                </Row>

                {/* <Row gutter={16}>
                    <Col span={12}>
                        <Form.Item name="sku" label="SKU">
                            <Input />
                        </Form.Item>
                    </Col>
                    <Col span={12}>
                        <Form.Item name="location" label="Emplacement">
                            <Input />
                        </Form.Item>
                    </Col>
                </Row> */}

                <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                        Ajouter le produit
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

// ─── Page principale ──────────────────────────────────────────────────────────
export function Produits() {
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
    const [drawerVisible, setDrawerVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    const { canDelete } = usePermissions();

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
            .catch(err => console.error("Erreur produits :", err))
            .finally(() => setLoading(false));
    }, []);

    const handleDelete = useCallback(async (id) => {
        try {
            await axiosInstance.delete(`${API_URL}Products/${id}`);
            message.success('Produit supprimé avec succès');
            setProduits(prev => prev.filter(p => p.id !== id));
        } catch (error) {
            const msg = error.response?.data?.message || "Erreur lors de la suppression du produit !";
            message.error(msg);
        }
    }, []);

    const columnsRT = useMemo(() => {
        const cols = [
            { header: 'ID', accessorKey: 'id' },
            {
                header: 'Image',
                accessorKey: 'imageUrl',
                enableSorting: false,
                cell: ({ row }) => (
                    <ProductImage src={row.original.imageUrl} name={row.original.name} size={40} />
                ),
            },
            { header: 'Nom', accessorKey: 'name' },
            {
                header: 'Stock',
                accessorKey: 'quantity',
                cell: ({ row }) => (
                    <Tag color={row.original.quantity <= row.original.threshold ? 'volcano' : 'green'}>
                        {row.original.quantity}
                    </Tag>
                ),
            },
            {
                header: 'Prix Unitaire',
                accessorKey: 'price',
                cell: ({ row }) => row.original.price ? `${row.original.price.toLocaleString()} XAF` : '-',
            },
            { header: "Seuil d'Alerte", accessorKey: 'threshold' },
            {
                header: 'Actions',
                id: 'actions',
                enableSorting: false,
                cell: ({ row }) => (
                    <Space size="middle">
                        <NavLink to={`/produit/${row.original.id}`}>
                            <Button type="primary" icon={<EditOutlined />} shape="circle" />
                        </NavLink>
                        {/* Bouton Supprimer — Admin et Gérant uniquement */}
                        {canDelete && (
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
                        )}
                    </Space>
                ),
            },
        ];
        return cols;
    }, [handleDelete, canDelete]);

    const filteredData = useMemo(() =>
        produits.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [produits, searchTerm]
    );

    const screens = Grid.useBreakpoint();

    const openProduct = (p) => { setSelectedProduct(p); setDrawerVisible(true); };
    const closeDrawer = () => setDrawerVisible(false);

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
                            <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</Button>
                            <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</Button>
                            <span>Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="responsive-cards">
                            {filteredData.length === 0 && (
                                <div style={{ padding: 20, textAlign: 'center' }}>Aucun produit</div>
                            )}
                            {filteredData.map(product => (
                                <Card
                                    key={product.id}
                                    className="mobile-card"
                                    size="small"
                                    variant="outlined"
                                    hoverable
                                    onClick={() => openProduct(product)}
                                >
                                    {/* Galerie produit — carousel si plusieurs images */}
                                    <div style={{ marginBottom: 8 }}>
                                        <ProductGallery
                                            images={product.images}
                                            imageUrl={product.imageUrl}
                                            name={product.name}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                        <div style={{ fontWeight: 700 }}>{product.name}</div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            {canDelete && (
                                                <Popconfirm
                                                    title="Confirmer la suppression"
                                                    onConfirm={() => handleDelete(product.id)}
                                                    okText="Oui"
                                                    cancelText="Non"
                                                >
                                                    <Button size="small" danger onClick={(e) => e.stopPropagation()}>
                                                        <DeleteOutlined />
                                                    </Button>
                                                </Popconfirm>
                                            )}
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
                                <>
                                    <ProductGallery
                                        images={selectedProduct.images}
                                        imageUrl={selectedProduct.imageUrl}
                                        name={selectedProduct.name}
                                    />
                                    <div style={{ marginTop: 16 }}>
                                        <Descriptions column={1} size="small">
                                            <Descriptions.Item label="Nom">{selectedProduct.name}</Descriptions.Item>
                                            <Descriptions.Item label="Description">{selectedProduct.desc}</Descriptions.Item>
                                            <Descriptions.Item label="Prix">{selectedProduct.price?.toLocaleString()} XAF</Descriptions.Item>
                                            <Descriptions.Item label="Quantité">{selectedProduct.quantity}</Descriptions.Item>
                                            <Descriptions.Item label="Seuil">{selectedProduct.threshold}</Descriptions.Item>
                                        </Descriptions>
                                    </div>

                                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                                        {canDelete && (
                                            <Popconfirm
                                                title="Confirmer la suppression"
                                                onConfirm={() => { handleDelete(selectedProduct.id); closeDrawer(); }}
                                                okText="Oui"
                                                cancelText="Non"
                                            >
                                                <Button danger>Supprimer</Button>
                                            </Popconfirm>
                                        )}
                                        <NavLink to={`/produit/${selectedProduct.id}`} onClick={closeDrawer}>
                                            <Button type="primary">Éditer</Button>
                                        </NavLink>
                                    </div>
                                </>
                            )}
                        </Drawer>
                    </>
                )}
            </Card>

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
