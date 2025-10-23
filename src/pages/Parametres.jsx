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
import DataTable from 'datatables.net-dt';
import { getProduits, getUsers } from "../services/api";
import { getCategories } from "../services/api";

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

import axios from "axios";
import Password from 'antd/es/input/Password';
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
        const { nom, email, password } = values;
        console.log(values);

        try {
            const response = await axiosInstance.post('http://localhost:8000/auth/register/', {
                email,
                password,
                nom,
                role: "GERANT",
            });

            message.success("User ajouté avec succès !");
            form.resetFields();
            onProduitAdded(response.data);

            console.log('Produit ajouté :', response.data);
        } catch (error) {
            message.error("Erreur lors de l’ajout de l'user !");
            console.error('Erreur lors de l’ajout', error);
        }
    };





    return (<Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish}
        style={{ maxWidth: 600 }}
        validateMessages={validateMessages}
        form={form}
    >
        <fieldset>
            <legend> <h5>Ajouter un User</h5> </legend>
            <Form.Item name='nom' label="Nom" rules={[{ required: true }]} >
                <Input />
            </Form.Item>
            <Form.Item name='email' label="Email" rules={[{ required: true }]} >
                <Input />
            </Form.Item>
            <Form.Item
                label="Password"
                name="password"
                rules={[{ required: true, message: 'Veuillez entrer votre mot de passe!' }]}
            >
                <Input.Password />
            </Form.Item>

            <Form.Item label={null}>
                <Button type="primary" htmlType="submit" >
                    Enregistrer User
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
        types: {
            email: '${label} is not a valid email!',
            number: '${label} is not a valid number!',
        },
        number: {
            range: '${label} must be between ${min} and ${max}',
        },
    };
    const onFinish = async (values) => {
        const { libelle} = values;
        console.log(values);

        try {
            const response = await axiosInstance.post('http://localhost:8000/categories/', {
               libelle,
            });

            message.success("Catégorie ajouté avec succès !");
            form.resetFields();
            onCategorieAdded(response.data);

            console.log('Catégorie ajoutée :', response.data);
        } catch (error) {
            message.error("Erreur lors de l’ajout de la catégorie !");
            console.error('Erreur lors de l’ajout', error);
        }
    };





    return (<Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish}
        style={{ maxWidth: 600 }}
        validateMessages={validateMessages}
        form={form}
    >
        <fieldset>
            <legend> <h5>Ajouter une Categorie</h5> </legend>
            <Form.Item name='libelle' label="Libellé" rules={[{ required: true }]} >
                <Input />
            </Form.Item>

            <Form.Item label={null}>
                <Button type="primary" htmlType="submit" >
                    Enregistrer Categorie
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
            .catch((error) => console.error("Erreur lors du chargement des users :", error));
        getCategories()
            .then(setCategories)
            .catch((error) => console.error("Erreur lors du chargement des categories :", error));
    }, []);


    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Nom', accessorKey: 'nom' },
        { header: 'Email', accessorKey: 'email' },
        {
            header: 'Role',
            id: 'is_superuser',
            cell: ({ row }) => {
                console.log('row', row.original);
                const role = row.original.is_superuser == 1 ? 'Admin' : 'Gérant'; // == convertit automatiquement
                return role;
            }
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Flex justify="space-evenly">
                    <Popconfirm
                        title="Suppression de l'user"
                        description="Êtes-vous sûr de vouloir supprimer cet user ?"
                        onConfirm={() => handleDelete(row.original.id)}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    >
                        <Button danger><MinusSquareFilled /></Button>
                    </Popconfirm>

                    <NavLink to={`/produit/${row.original.id}`}>
                        <Button><EditFilled /></Button>
                    </NavLink>
                </Flex>
            ),
        },
    ];
    const columns2 = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Libelle', accessorKey: 'libelle' },

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
        initialState: {
            pagination: {
                pageIndex: 0,  // première page
                pageSize: 3,   // 3 entrées
            }
        },
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
        initialState: {
            pagination: {
                pageIndex: 0,  // première page
                pageSize: 3,   // 3 entrées
            }
        },
    });



    const handleDelete = async (id) => {
        console.log('id', id);
        // console.log('id',id);
        try {
            const response = await axiosInstance.delete(`http://localhost:8000/users/${id}/`);
            message.success('User supprimé');
            setUser(prev => prev.filter(c => c.id !== id));


        } catch (error) {
            message.error("Erreur lors de la suppression du produit !");
            console.error('Erreur lors de la suppression', error);
        }
    };
    const handleDeleteCategory = async (id) => {
        console.log('id', id);
        // console.log('id',id);
        try {
            const response = await axiosInstance.delete(`http://localhost:8000/categories/${id}/`);
            message.success('Catégorie supprimée');
            setCategories(prev => prev.filter(c => c.id !== id));


        } catch (error) {
            message.error("Erreur lors de la suppression de la catégorie !");
            console.error('Erreur lors de la suppression', error);
        }
    };
    const cancel = e => {
        console.log(e);
        message.error('Click on No');
    };

    return (

        <>
            <h2 >Paramètres</h2>
            <Input
                placeholder="Rechercher..."
                value={globalFilter || ''}
                onChange={e => setGlobalFilter(e.target.value)}
                style={{ marginBottom: '1rem', width: '300px' }}
            />

            {/* <Flex style={{ marginTop: '20px', overflowY: 'scroll', flexFlow: 'column' }} direction="column" gap="20px"> */}
                <Row justify="space-between">
                    <Col span={14}>
                        <table id="myTable" className="table  table-hover table-striped-columns  align-middle">
                            <caption>Liste des Utilisateurs</caption>
                            <thead className="table-dark">
                                {table.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {{ asc: <CaretUpOutlined />, desc: <CaretDownOutlined /> }[header.column.getIsSorted()] ?? null}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>

                                {table.getRowModel().rows.map(row => (
                                    <tr key={row.id} className={row.original.qte <= row.original.seuil ? 'table-danger' : ''}>
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
                            <span>
                                Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                            </span>
                        </div>
                    </Col>
                    <Col span={8} style={{ marginTop: '-60px' }}>
                        <AjouterUser onUserAdded={(newUser) => setUser(prev => [...prev, newUser])} />

                    </Col>
                </Row>
                <Row justify="space-between">
                    <Col span={14}>
                        <table id="myTable" className="table  table-hover table-striped-columns  align-middle">
                            <caption>Liste des catégories de produits</caption>
                            <thead className="table-dark">
                                {table2.getHeaderGroups().map(headerGroup => (
                                    <tr key={headerGroup.id}>
                                        {headerGroup.headers.map(header => (
                                            <th
                                                key={header.id}
                                                style={{ cursor: header.column.getCanSort() ? 'pointer' : 'default' }}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                                {{ asc: <CaretUpOutlined />, desc: <CaretDownOutlined /> }[header.column.getIsSorted()] ?? null}
                                            </th>
                                        ))}
                                    </tr>
                                ))}
                            </thead>
                            <tbody>

                                {table2.getRowModel().rows.map(row => (
                                    <tr key={row.id} className={row.original.qte <= row.original.seuil ? 'table-danger' : ''}>
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
                            <span>
                                Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                            </span>
                        </div>
                    </Col>
                    <Col span={8} style={{ marginTop: '0px' }}>
                        <AjouterCategorie onCategorieAdded={(newCategorie) => setCategories(prev => [...prev, newCategorie])} />

                    </Col>
                </Row>
            {/* </Flex> */}


        </>


    )
}