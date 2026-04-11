import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from "react-router-dom";

import '@ant-design/v5-patch-for-react-19';
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message } from 'antd';
import {
    MinusSquareFilled,
    PlusSquareOutlined,
    EditFilled,
    QuestionCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
} from '@ant-design/icons';
import ResponsiveTable from '../components/ResponsiveTable';
import { getProduits, getUsers } from "../services/api.js";
import { getCategories, API_URL } from "../services/api.js"; // ✅ Importer API_URL

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

import axiosInstance from '../services/axiosInstance';




function AjouterUser({ onUserAdded }) {

    const [form] = Form.useForm();

    const layout = {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 },
    };
    const validateMessages = {
        required: '${label} is required!',
        types: {
            email: '${label} is not a valid email!',
            number: '${label} is not a valid number!',
        },
        number: {
            range: '${label} must be between ${min} and ${max}',
        },
    };

    const onFinish = async (values) => {
    const { username, email, password, confirmPassword } = values;

    try {
        const response = await axiosInstance.post(`${API_URL}Auth/register`, {
            email,
            password,
            confirmPassword,
            username,
           
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
            validateMessages={validateMessages}
            form={form}
        >
            <fieldset>
                <legend><h5>Ajouter un Utilisateur</h5></legend>
               <Form.Item name='username' label="Nom d'utilisateur" rules={[{ required: true }]}>
    <Input />
</Form.Item>
                <Form.Item name='email' label="Email" rules={[{ required: true, type: 'email' }]}>
                    <Input />
                </Form.Item>
                <Form.Item
                    label="Mot de passe"
                    name="password"
                    rules={[{ required: true, message: 'Veuillez entrer un mot de passe !' }]}
                >
                    <Input.Password />
                </Form.Item>
                <Form.Item
    label="Confirmer mot de passe"
    name="confirmPassword"
    dependencies={['password']}
    rules={[
        { required: true, message: 'Veuillez confirmer le mot de passe !' },
        ({ getFieldValue }) => ({
            validator(_, value) {
                if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                }
                return Promise.reject(new Error('Les mots de passe ne correspondent pas !'));
            },
        }),
    ]}
>
    <Input.Password />
</Form.Item>
                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">
                        Enregistrer Utilisateur
                    </Button>
                </Form.Item>
            </fieldset>
        </Form>
    );
}


function AjouterCategorie({ onCategorieAdded }) {

    const [form] = Form.useForm();

    const layout = {
        labelCol: { span: 8 },
        wrapperCol: { span: 16 },
    };
    const validateMessages = {
        required: '${label} is required!',
    };

    const onFinish = async (values) => {
        const { title } = values;

        try {
            const response = await axiosInstance.post(`${API_URL}Categories/`, { // ✅ URL corrigée
                title,
            });

            message.success("Catégorie ajoutée avec succès !");
            form.resetFields();
            onCategorieAdded(response.data);

        } catch (error) {
            message.error("Erreur lors de l'ajout de la catégorie !");
            console.error("Erreur lors de l'ajout", error);
        }
    };

    return (
        <Form
            {...layout}
            name="ajouter-categorie"
            onFinish={onFinish}
            style={{ maxWidth: 600 }}
            validateMessages={validateMessages}
            form={form}
        >
            <fieldset>
                <legend><h5>Ajouter une Catégorie</h5></legend>
                <Form.Item name='title' label="Libellé" rules={[{ required: true }]}>
                    <Input />
                </Form.Item>
                <Form.Item label={null}>
                    <Button type="primary" htmlType="submit">
                        Enregistrer Catégorie
                    </Button>
                </Form.Item>
            </fieldset>
        </Form>
    );
}


export function Parametres() {
    const [users, setUser] = useState([]);
    const [categories, setCategories] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);

    useEffect(() => {
        getUsers()
            .then(setUser)
            .catch((error) => console.error("Erreur lors du chargement des utilisateurs :", error));
        getCategories()
            .then(setCategories)
            .catch((error) => console.error("Erreur lors du chargement des catégories :", error));
    }, []);


    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Nom', accessorKey: 'nom' },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Role',
            id: 'is_superuser',
            cell: ({ row }) => {
                const role = row.original.is_superuser == 1 ? 'Admin' : 'Gérant';
                return role;
            }
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
                    <NavLink to={`/users/${row.original.id}`}>
                        <Button><EditFilled /></Button>
                    </NavLink>
                </Flex>
            ),
        },
    ];

    const columns2 = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Libellé', accessorKey: 'title' },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Flex justify="space-evenly">
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


    const handleDelete = async (id) => {
        try {
            await axiosInstance.delete(`${API_URL}gerants/${id}/`); // ✅ URL corrigée
            message.success('Utilisateur supprimé');
            setUser(prev => prev.filter(u => u.id !== id));
        } catch (error) {
            message.error("Erreur lors de la suppression de l'utilisateur !");
            console.error('Erreur lors de la suppression', error);
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await axiosInstance.delete(`${API_URL}Categories/${id}/`); // ✅ URL corrigée
            message.success('Catégorie supprimée');
            setCategories(prev => prev.filter(c => c.id !== id));
        } catch (error) {
            message.error("Erreur lors de la suppression de la catégorie !");
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

            <Row justify="space-between">
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
                                                            padding: '12px 8px'
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
                                <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
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
                                                    padding: '12px 8px'
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
                        <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                            <Button onClick={() => table2.previousPage()} disabled={!table2.getCanPreviousPage()}>Précédent</Button>
                            <Button onClick={() => table2.nextPage()} disabled={!table2.getCanNextPage()}>Suivant</Button>
                            <span>Page {table2.getState().pagination.pageIndex + 1} / {table2.getPageCount()}</span>
                        </div>
                    </div>
                </Col>
                <Col span={8}>
                    <AjouterCategorie onCategorieAdded={(newCategorie) => setCategories(prev => [...prev, newCategorie])} />
                </Col>
            </Row>
        </>
    );
}