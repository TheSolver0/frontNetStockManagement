import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '@ant-design/v5-patch-for-react-19';
import { Button, Col, Row, Flex, Form, Input, Popconfirm, message, Spin, Tag } from 'antd';
import {
    MinusSquareFilled,
    QuestionCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    ArrowLeftOutlined,
    SaveOutlined,
} from '@ant-design/icons';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import axiosInstance from '../services/axiosInstance';
import { API_URL } from '../services/api';

export function EditCategorie() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [form] = Form.useForm();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await axiosInstance.get(`${API_URL}Categories/${id}`);
                const cat = res.data;
                setCategory(cat);
                form.setFieldsValue({ title: cat.title });

                // Récupérer les produits de cette catégorie
                const prodRes = await axiosInstance.get(`${API_URL}Products`);
                const filtered = prodRes.data.filter(p => p.categoryId === parseInt(id));
                setProducts(filtered);
            } catch (error) {
                message.error("Erreur lors du chargement de la catégorie !");
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleSave = async (values) => {
        setSaving(true);
        try {
            await axiosInstance.put(`${API_URL}Categories/${id}`, {
                id: parseInt(id),
                title: values.title,
            });
            message.success("Catégorie mise à jour !");
            setCategory(prev => ({ ...prev, title: values.title }));
        } catch (error) {
            message.error("Erreur lors de la mise à jour !");
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
    try {
        await axiosInstance.delete(`${API_URL}Products/${productId}`);
        message.success('Produit supprimé');

        const remaining = products.filter(p => p.id !== productId);
        setProducts(remaining);

        // Dernier produit supprimé → proposer de supprimer la catégorie
        if (remaining.length === 0) {
            Modal.confirm({
                title: 'Catégorie vide',
                content: 'Cette catégorie ne contient plus de produits. Voulez-vous la supprimer aussi ?',
                okText: 'Supprimer la catégorie',
                okType: 'danger',
                cancelText: 'Garder la catégorie',
                onOk: async () => {
                    try {
                        await axiosInstance.delete(`${API_URL}Categories/${id}`);
                        message.success('Catégorie supprimée');
                        navigate('/parametres');
                    } catch (error) {
                        message.error("Erreur lors de la suppression de la catégorie !");
                        console.error(error);
                    }
                },
            });
        }
    } catch (error) {
        message.error("Erreur lors de la suppression du produit !");
        console.error(error);
    }
};

    const columns = [
        { header: 'ID', accessorKey: 'id', size: 60 },
        { header: 'Nom', accessorKey: 'name' },
        { header: 'Prix', accessorKey: 'price', cell: ({ getValue }) => `${getValue()} FCFA` },
        { header: 'Stock', accessorKey: 'quantity', cell: ({ row, getValue }) => (
            <Tag color={getValue() <= row.original.threshold ? 'red' : 'green'}>
                {getValue()}
            </Tag>
        )},
        { header: 'SKU', accessorKey: 'sku' },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Popconfirm
                    title="Supprimer ce produit ?"
                    description="Cette action est irréversible."
                    onConfirm={() => handleDeleteProduct(row.original.id)}
                    icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                >
                    <Button danger size="small"><MinusSquareFilled /></Button>
                </Popconfirm>
            ),
        },
    ];

    const table = useReactTable({
        data: products,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 5 } },
    });

    if (loading) return <Spin size="large" style={{ display: 'block', marginTop: '3rem' }} />;

    return (
        <>
            <Flex align="center" gap={12} style={{ marginBottom: '1.5rem' }}>
                <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/parametres')}>
                    Retour
                </Button>
                <h2 style={{ margin: 0 }}>Modifier la catégorie</h2>
            </Flex>

            {/* Formulaire édition */}
            <div style={{ maxWidth: 500, marginBottom: '2rem' }}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSave}
                >
                    <Form.Item
                        name="title"
                        label="Titre de la catégorie"
                        rules={[{ required: true, message: 'Le titre est requis' }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            loading={saving}
                            icon={<SaveOutlined />}
                        >
                            Enregistrer
                        </Button>
                    </Form.Item>
                </Form>
            </div>

            {/* Tableau des produits */}
            <h3>Produits de cette catégorie ({products.length})</h3>

            <Input
                placeholder="Rechercher un produit..."
                value={globalFilter || ''}
                onChange={e => setGlobalFilter(e.target.value)}
                style={{ marginBottom: '1rem', maxWidth: 360 }}
            />

            <div className="table-responsive">
                <table className="table table-hover table-striped-columns align-middle">
                    <caption>Produits de la catégorie : {category?.title}</caption>
                    <thead className="table-dark">
                        {table.getHeaderGroups().map(headerGroup => (
                            <tr key={headerGroup.id}>
                                {headerGroup.headers.map(header => (
                                    <th
                                        key={header.id}
                                        style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                        onClick={header.column.getToggleSortingHandler()}
                                    >
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {header.column.getCanSort() && (
                                            header.column.getIsSorted() === 'asc' ? <CaretUpOutlined />
                                            : header.column.getIsSorted() === 'desc' ? <CaretDownOutlined />
                                            : null
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {table.getRowModel().rows.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                    Aucun produit dans cette catégorie
                                </td>
                            </tr>
                        ) : (
                            table.getRowModel().rows.map(row => (
                                <tr
                                    key={row.id}
                                    className={row.original.quantity <= row.original.threshold ? 'table-danger' : ''}
                                >
                                    {row.getVisibleCells().map(cell => (
                                        <td key={cell.id}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Button onClick={() => table.firstPage()} disabled={!table.getCanPreviousPage()}>«</Button>
                    <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</Button>
                    <span>Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                    <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</Button>
                    <Button onClick={() => table.lastPage()} disabled={!table.getCanNextPage()}>»</Button>
                </div>
            </div>
        </>
    );
}