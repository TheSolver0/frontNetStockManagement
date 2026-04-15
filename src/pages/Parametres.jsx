import React, { useState, useEffect } from 'react';
import { NavLink } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import {
    Button, Card, Col, Row, Flex, Form, Input, Modal, Select,
    Popconfirm, message, Alert,
} from 'antd';
import {
    MinusSquareFilled,
    PlusSquareOutlined,
    EditFilled,
    QuestionCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    LockOutlined,
} from '@ant-design/icons';
import ResponsiveTable from '../components/ResponsiveTable';
import { getProduits, getUsers } from "../services/api.js";
import { getCategories, API_URL } from "../services/api.js";
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import axiosInstance from '../services/axiosInstance';
import { usePermissions } from '../hooks/usePermissions';
import RoleGuard from '../components/RoleGuard';

// ─── Formulaire ajout utilisateur (Admin seulement) ──────────────────────────
function AjouterUser({ onUserAdded }) {
    const [form] = Form.useForm();
    const layout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

    const onFinish = async (values) => {
        const { username, email, password, confirmPassword, role } = values;
        try {
            const response = await axiosInstance.post(`${API_URL}Auth/register`, {
                email, password, confirmPassword, username, role,
            });
            message.success("Utilisateur ajouté avec succès !");
            form.resetFields();
            onUserAdded(response.data);
        } catch (error) {
            message.error("Erreur lors de l'ajout de l'utilisateur !");
            console.error("Erreur lors de l'ajout", error);
        }
    };

    return (
        <Form
            {...layout}
            name="ajouter-user"
            onFinish={onFinish}
            style={{ maxWidth: 600 }}
            form={form}
        >
            <fieldset>
                <legend><h5>Ajouter un Utilisateur</h5></legend>
                <Form.Item name="username" label="Nom d'utilisateur" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item name="role" label="Rôle" rules={[{ required: true, message: 'Veuillez choisir un rôle' }]}>
                    <Select placeholder="Sélectionnez un rôle">
                        <Select.Option value="Admin">Admin</Select.Option>
                        <Select.Option value="Gerant">Gérant</Select.Option>
                        <Select.Option value="Employe">Employé</Select.Option>
                    </Select>
                </Form.Item>
                <Form.Item name="password" label="Mot de passe" rules={[{ required: true }]}>
                    <Input.Password />
                </Form.Item>
                <Form.Item
                    name="confirmPassword"
                    label="Confirmer mot de passe"
                    dependencies={['password']}
                    rules={[
                        { required: true, message: 'Veuillez confirmer le mot de passe !' },
                        ({ getFieldValue }) => ({
                            validator(_, value) {
                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                return Promise.reject(new Error('Les mots de passe ne correspondent pas !'));
                            },
                        }),
                    ]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">Enregistrer Utilisateur</Button>
                </Form.Item>
            </fieldset>
        </Form>
    );
}

// ─── Formulaire ajout catégorie (tous les rôles) ──────────────────────────────
function AjouterCategorie({ onCategorieAdded }) {
    const [form] = Form.useForm();
    const layout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

    const onFinish = async (values) => {
        try {
            const response = await axiosInstance.post(`${API_URL}Categories/`, { title: values.title });
            message.success("Catégorie ajoutée avec succès !");
            form.resetFields();
            onCategorieAdded(response.data);
        } catch (error) {
            message.error("Erreur lors de l'ajout de la catégorie !");
            console.error("Erreur lors de l'ajout", error);
        }
    };

    return (
        <Form {...layout} name="ajouter-categorie" onFinish={onFinish} style={{ maxWidth: 600 }} form={form}>
            <fieldset>
                <legend><h5>Ajouter une Catégorie</h5></legend>
                <Form.Item name="title" label="Libellé" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">Enregistrer Catégorie</Button>
                </Form.Item>
            </fieldset>
        </Form>
    );
}

// ─── Page Paramètres ──────────────────────────────────────────────────────────
export function Parametres() {
    const [users, setUser] = useState([]);
    const [categories, setCategories] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editForm] = Form.useForm();

    const { canManageUsers, canEditCategories } = usePermissions();

    useEffect(() => {
        if (canManageUsers) {
            getUsers()
                .then(setUser)
                .catch((error) => console.error("Erreur lors du chargement des utilisateurs :", error));
        }
        getCategories()
            .then(setCategories)
            .catch((error) => console.error("Erreur lors du chargement des catégories :", error));
    }, [canManageUsers]);

    // ── Colonnes tableau utilisateurs ──
    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Nom', accessorKey: 'username' },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Rôle',
            id: 'role',
            cell: ({ row }) => row.original.role ?? (row.original.is_superuser == 1 ? 'Admin' : 'Gérant'),
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Flex justify="space-evenly">
                    <Popconfirm
                        title="Suppression de l'utilisateur"
                        description="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                        onConfirm={() => handleDelete(row.original.id)}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    >
                        <Button danger><MinusSquareFilled /></Button>
                    </Popconfirm>
                    <Button onClick={() => handleEditUser(row.original)}><EditFilled /></Button>
                </Flex>
            ),
        },
    ];

    // ── Colonnes tableau catégories ──
    const columns2 = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Libellé', accessorKey: 'title' },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Flex justify="space-evenly">
                    {/* Modifier / Supprimer catégorie → Admin + Gérant seulement */}
                    <RoleGuard
                        roles={['Admin', 'Gerant']}
                        fallback={<span style={{ color: '#bfbfbf', fontSize: 12 }}>—</span>}
                    >
                        <Popconfirm
                            title="Suppression de la catégorie"
                            description="Êtes-vous sûr de vouloir supprimer cette catégorie ?"
                            onConfirm={() => handleDeleteCategory(row.original.id)}
                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                        >
                            <Button danger><MinusSquareFilled /></Button>
                        </Popconfirm>
                        <NavLink to={`/categories/${row.original.id}`}>
                            <Button><EditFilled /></Button>
                        </NavLink>
                    </RoleGuard>
                </Flex>
            ),
        },
    ];

    const table = useReactTable({
        data: users,
        columns,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 3 } },
    });

    const table2 = useReactTable({
        data: categories,
        columns: columns2,
        state: { globalFilter, sorting },
        onGlobalFilterChange: setGlobalFilter,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        initialState: { pagination: { pageIndex: 0, pageSize: 3 } },
    });

    const handleEditUser = (user) => {
        setEditingUser(user);
        editForm.setFieldsValue({ username: user.username, email: user.email, role: user.role });
        setEditModalOpen(true);
    };

    const handleSaveUser = async (values) => {
        try {
            await axiosInstance.put(`${API_URL}users/${editingUser.id}`, {
                username: values.username,
                email: values.email,
                role: values.role,
            });
            message.success("Utilisateur mis à jour !");
            setUser(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...values } : u));
            setEditModalOpen(false);
        } catch (error) {
            message.error("Erreur lors de la mise à jour !");
            console.error(error);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`${API_URL}users/${id}/`);
            message.success('Utilisateur supprimé');
            setUser(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            message.error("Erreur lors de la suppression de l'utilisateur !");
            console.error('Erreur lors de la suppression', error);
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await axiosInstance.delete(`${API_URL}Categories/${id}`);
            message.success('Catégorie supprimée');
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            const msg = error.response?.data?.message || "Erreur lors de la suppression !";
            message.error(msg);
            console.error('Erreur lors de la suppression', error);
        }
    };

    return (
        <>
            <h2>Paramètres</h2>
            <Input
                placeholder="Rechercher..."
                value={globalFilter || ''}
                onChange={e => setGlobalFilter(e.target.value)}
                style={{ marginBottom: '1rem', width: '100%', maxWidth: 360 }}
            />

            {/* ── Section Utilisateurs — Admin uniquement ── */}
            <RoleGuard
                roles={['Admin']}
                fallback={
                    <Alert
                        type="warning"
                        showIcon
                        icon={<LockOutlined />}
                        message="Gestion des utilisateurs réservée aux Administrateurs."
                        style={{ marginBottom: 24 }}
                    />
                }
            >
                <Row justify="space-between" style={{ marginBottom: 32 }}>
                    <Col span={14}>
                        <ResponsiveTable
                            table={table}
                            renderTable={() => (
                                <>
                                    <table className="table table-hover table-striped-columns align-middle responsive-table">
                                        <caption>Liste des Utilisateurs</caption>
                                        <thead className="table-light">
                                            {table.getHeaderGroups().map(headerGroup => (
                                                <tr key={headerGroup.id}>
                                                    {headerGroup.headers.map(header => (
                                                        <th
                                                            key={header.id}
                                                            style={{
                                                                cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                                backgroundColor: '#f8f9fa',
                                                                color: '#262626',
                                                                fontWeight: '600',
                                                                padding: '12px 8px',
                                                            }}
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
                                    <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                                        <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</Button>
                                        <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</Button>
                                        <span>Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                                    </div>
                                </>
                            )}
                            renderActions={(row) => {
                                if (!row) return null;
                                const id = row.original?.id;
                                return (
                                    <div style={{ display: 'flex', gap: 8 }}>
                                        <Popconfirm
                                            title="Suppression de l'utilisateur"
                                            description="Êtes-vous sûr de vouloir supprimer cet utilisateur ?"
                                            onConfirm={() => handleDelete(id)}
                                            icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                                        >
                                            <Button size="small" danger onClick={(e) => e.stopPropagation()}>Supprimer</Button>
                                        </Popconfirm>
                                    </div>
                                );
                            }}
                        />
                    </Col>
                    <Col span={8} style={{ marginTop: '-60px' }}>
                        <AjouterUser onUserAdded={(newUser) => setUser(prev => [...prev, newUser])} />
                    </Col>
                </Row>
            </RoleGuard>

            {/* ── Section Catégories — visible par tous, actions filtrées ── */}
            <Row justify="space-between">
                <Col span={14}>
                    <div className="table-responsive">
                        <table className="table table-hover table-striped-columns align-middle responsive-table">
                            <caption>Liste des catégories de produits</caption>
                            <thead className="table-light">
                                {table2.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                style={{
                                                    cursor: header.column.getCanSort() ? 'pointer' : 'default',
                                                    backgroundColor: '#f8f9fa',
                                                    color: '#262626',
                                                    fontWeight: '600',
                                                    padding: '12px 8px',
                                                }}
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
                                {table2.getRowModel().rows.map(row => (
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
                        <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                            <Button onClick={() => table2.previousPage()} disabled={!table2.getCanPreviousPage()}>Précédent</Button>
                            <Button onClick={() => table2.nextPage()} disabled={!table2.getCanNextPage()}>Suivant</Button>
                            <span>Page {table2.getState().pagination.pageIndex + 1} / {table2.getPageCount()}</span>
                        </div>
                    </div>
                </Col>
                <Col span={8}>
                    {/* Ajouter une catégorie → tous les rôles */}
                    <AjouterCategorie onCategorieAdded={(newCategorie) => setCategories(prev => [...prev, newCategorie])} />
                </Col>
            </Row>

            {/* ── Modal édition utilisateur ── */}
            <Modal
                title="Modifier l'utilisateur"
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={() => editForm.submit()}
                okText="Enregistrer"
                cancelText="Annuler"
            >
                <Form form={editForm} layout="vertical" onFinish={handleSaveUser} style={{ marginTop: '1rem' }}>
                    <Form.Item
                        name="username"
                        label="Nom d'utilisateur"
                        rules={[{ required: true, message: "Le nom d'utilisateur est requis" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="email"
                        label="Email"
                        rules={[{ required: true, type: 'email', message: "Email invalide" }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="role"
                        label="Rôle"
                        rules={[{ required: true, message: "Veuillez choisir un rôle" }]}
                    >
                        <Select>
                            <Select.Option value="Admin">Admin</Select.Option>
                            <Select.Option value="Gerant">Gérant</Select.Option>
                            <Select.Option value="Employe">Employé</Select.Option>
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
}
