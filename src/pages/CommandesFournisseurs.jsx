import React, { useState, useEffect, useRef } from 'react';
import { NavLink } from "react-router-dom";
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message } from 'antd';
import {
    MinusSquareFilled,
    PlusSquareOutlined,
    EditFilled,
    CaretUpOutlined,
    CaretDownOutlined,
    QuestionCircleOutlined,


} from '@ant-design/icons';
import DataTable from 'datatables.net-dt';
import { getCommandesFournisseur, getProduits, getFournisseurs, API_URL } from "../services/api";

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

import axios from "axios";
import { useCommandesReducerF } from '../hooks/useCommandesReducerF';
import axiosInstance from '../services/axiosInstance';


const { Content } = Layout;


function AjouterCommande({ onCommandeAdded }) {

    const [form] = Form.useForm();

    const [produits, setProduits] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);

    useEffect(() => {
        getProduits().then(setProduits);
        getProduits().catch(error => console.error("Erreur lors du chargement des produits :", error));
        getFournisseurs().then(setFournisseurs);
        getFournisseurs().catch(error => console.error("Erreur lors du chargement des clients :", error));
    }, [])


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
        const { productId, quantity, supplierId } = values;
        // const userC = null;
        // console.log(values);
        // console.log('fournisseur', fournisseur_produit);
        // console.log('produit', produits);
    const supplier = fournisseurs.find(f => f.id === supplierId);
    // Certaines réponses API utilisent 'products' et d'autres 'produits'.
    // Normaliser et extraire une liste d'IDs (pas d'objets) pour la comparaison.
    const supplierProductList = supplier ? (supplier.products ?? supplier.produits ?? []) : [];
    console.log('supplier', supplier);
    console.log('supplierProductList (raw)', supplierProductList);

    // supplierProductList peut contenir des objets { id, ... } ou des ids simples.
    const supplierProductIds = supplierProductList.map(p => (p && typeof p === 'object' ? p.id : p));

    // Normaliser productId et les ids en string pour éviter mismatch number/string
    const normalizedProductId = productId == null ? productId : String(productId);
    const normalizedSupplierIds = supplierProductIds.map(id => (id == null ? id : String(id)));

    console.log('productId', productId, 'normalizedProductId', normalizedProductId);
    console.log('supplierProductIds (normalized)', normalizedSupplierIds);
    console.log('is In supplierProductList', normalizedSupplierIds.includes(normalizedProductId));
        // console.log('supplierIdList', supplierIdList);
        try {
            if (normalizedSupplierIds.includes(normalizedProductId)) {
                const response = await axiosInstance.post(`${API_URL}Provides/`, {
                    quantity, 
                    productId,
                    supplierId,

                });

                message.success("Commande ajouté avec succès !");
                form.resetFields();
                setTimeout(() => {
                    onCommandeAdded(response.data);
                }, 1000);

                console.log('Commande ajouté :', response.data);
            }
            else (
                message.error("Ce fournisseur n'a pas ce produit dans sa liste")
            )

        } catch (error) {
            message.error("Erreur lors de l’ajout de la commande !");
            console.error('Erreur lors de l’ajout', error);
        }
    };



    const handleFournisseurChange = (id) => {
        const fournisseur = fournisseurs.find(f => f.id === id);
        if (fournisseur) {
            // console.log(fournisseur)
            // Met à jour dynamiquement le champ caché avec la liste des IDs produits
            form.setFieldsValue({
                fournisseur_produit: fournisseur.produits, // ou JSON.stringify si besoin texte
            });
        }
    }

    return (<Form
        {...layout}
        name="nest-messages"
        onFinish={onFinish}
        style={{ maxWidth: 600 }}
        validateMessages={validateMessages}
        form={form}
    >
        <fieldset>
            <legend> <h5>Ajouter une Commande</h5> </legend>
            <Form.Item name='productId' label="Produit" rules={[{ required: true }]}>
                <Select>
                    {produits.map((produit) => (
                        <Select.Option key={produit.id} value={produit.id} >{produit.name}</Select.Option>
                    ))}

                </Select>
            </Form.Item>

            <Form.Item name='quantity' label="Quantité" rules={[{ type: 'number', min: 0, required: true }]}>
                <InputNumber style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name='supplierId' label="Fournisseur" rules={[{ required: true }]}>
                <Select onChange={handleFournisseurChange}>
                    {fournisseurs.map((fournisseur) => (
                        <Select.Option key={fournisseur.id} value={fournisseur.id} >{fournisseur.name}</Select.Option>

                    ))}

                </Select>
            </Form.Item>
            <Form.Item name="fournisseur_produit" hidden>
                <Input type="hidden" />
            </Form.Item>



            <Form.Item label={null}>
                <Button type="primary" htmlType="submit" >
                    Ajouter Commande
                </Button>
            </Form.Item>
        </fieldset>

    </Form>
    );
}



export function CommandesFournisseurs() {
    const [commandes, setCommandes] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
    const previousLivreesRef = useRef([]);

    useEffect(() => {

        getCommandesFournisseur().then(setCommandes);
        getCommandesFournisseur().catch(error => console.error("Erreur lors du chargement des commandes :", error));


    }, [])
    useCommandesReducerF(commandes);
    useEffect(() => {
        commandes.forEach(c => {
            if (c.statut === 'EN_ATTENTE') {
                message.warning(`La commande #${c.id} est en attente de reception`);
            }
        });
    }, [commandes]);

    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [size, setSize] = useState('large');

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        { header: 'Produit', accessorKey: 'product.name' },
        { header: 'Quantité', accessorKey: 'quantity' },
        { header: 'Fournisseur', accessorKey: 'supplier.name' },
        // { header: 'Prix Unitaire(XAF)', accessorKey: 'product.price' },
        { header: 'Montant(XAF)', accessorKey: 'amount' },
        /*{
            header: 'Date de commande',
            accessorKey: 'createdAt', // ou produits_details.created_at
            cell: info => {
                const raw = info.getValue();
                if (!raw) return '—';

                // Tronquer les millisecondes à 3 chiffres (JavaScript ne supporte pas plus)
                const safeIso = raw.replace(/\.(\d{3})\d*Z$/, '.$1Z');

                const date = new Date(safeIso);
                if (isNaN(date)) return 'Date invalide';

                return date.toLocaleDateString('fr-FR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            }
        }*/,

        {
            header: 'Date de livraison',
            accessorFn: row => ({
                createdAt: row.createdAt,
                delai: row.supplier.delay,
                id: row.id,
            }),
            cell: info => {
                const { createdAt, delai, id } = info.getValue() || {};

                if (!createdAt || delai == null) return '—';

                // Nettoyer la date
                const safeDateStr = typeof createdAt === 'string' ? createdAt.replace(/\.(\d{3})\d*Z$/, '.$1Z') : createdAt;
                const date = new Date(safeDateStr);
                if (isNaN(date)) return 'Date invalide';

                // delai peut arriver comme string ("3 00:00:00"), number, ou même objet.
                // Gérer les différents types pour éviter 'delai.match is not a function'.
                console.debug('delai raw:', delai, 'type:', typeof delai);

                let jours = 0;
                try {
                    if (typeof delai === 'string') {
                        // ex: "3 00:00:00" ou "3"
                        const joursMatch = delai.match(/^(\d+)\s/);
                        if (joursMatch) jours = parseInt(joursMatch[1], 10);
                        else {
                            const m = delai.match(/(\d+)/);
                            if (m) jours = parseInt(m[1], 10);
                        }
                    } else if (typeof delai === 'number') {
                        jours = delai;
                    } else if (typeof delai === 'object' && delai !== null) {
                        // Tentatives courantes selon différentes API
                        if ('days' in delai) jours = Number(delai.days);
                        else if ('Days' in delai) jours = Number(delai.Days);
                        else if ('value' in delai) jours = Number(delai.value);
                        else {
                            // fallback: chercher un nombre dans la représentation JSON
                            const s = JSON.stringify(delai);
                            const m = s.match(/(\d+)/);
                            if (m) jours = parseInt(m[1], 10);
                        }
                    }
                } catch (e) {
                    console.warn('Erreur parse delai:', e, delai);
                    jours = 0;
                }

                if (!Number.isFinite(jours) || isNaN(jours)) jours = 0;

                // Ajouter les jours
                date.setDate(date.getDate() + jours);

                const now = new Date();
                const isRetard = now >= date;

                return (<span style={{ display: 'flex', alignItems: 'center' }}>
                    <span>{date.toLocaleDateString('fr-FR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</span>
                    {isRetard && (
                        <span style={{
                            marginLeft: '8px',
                            backgroundColor: 'red',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '12px',
                            fontSize: '12px',
                        }}>
                            Retard
                        </span>
                    )}
                </span>);
            }
        },

        {
            header: 'Statut',
            id: 'statut',
            cell: ({ row }) => (<span className="badge " style={{
                fontSize: '10px',
                background: (row.original.status === 'EN_ATTENTE') ? 'orange' :
                    (row.original.status === 'PREPAREE') ? 'blue' :
                        (row.original.status === 'EXPEDIEE') ? '#06d6a0' :
                            (row.original.status === 'LIVREE') ? '#007f5f' :
                                (row.original.status === 'ANNULEE') ? 'red' : ''
            }} >{row.original.status}</span>)
        },
        {
            header: 'Actions',
            id: 'actions',
            cell: ({ row }) => (
                <Flex justify="space-evenly">
                    <Popconfirm
                        title="Suppression de commande"
                        description="Êtes-vous sûr de vouloir supprimer cette commande ?"
                        onConfirm={() => handleDelete(row.original.id)}
                        icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                    >
                        <MinusSquareFilled style={{color:"red"}}/>
                    </Popconfirm>

                    <NavLink to={`/commandefournisseurs/${row.original.id}`}>
                        <EditFilled />
                    </NavLink>
                </Flex>
            ),
        },
    ];
    const table = useReactTable({
        data: commandes,
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
                pageSize: 3,
            }
        },
    });
    const handleDelete = async (id) => {
        console.log('id', id);
        // console.log('id',id);
        try {
            const response = await axiosInstance.delete(`${API_URL}Provides/${id}/`);
            message.success('Commande supprimé');
            setTimeout(() => {
                setCommandes(prev => prev.filter(c => c.id !== id));
            }, 1000)


        } catch (error) {
            message.error("Erreur lors de la suppression de la commande !");
            console.error('Erreur lors de la suppression', error);
        }
    };

    return (

        <>
        <div className="contentBody">
        <div className="produits">
                <h2>Table de Commandes Aux fournisseurs</h2>
             


            
                    <table id="myTable" className="table  table-hover table-striped-columns  align-middle">
                        <thead className="table-light">
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
                        <span>
                            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
                        </span>
                    </div>
    </div>
                
                <div className="addProduit">
                    <AjouterCommande onCommandeAdded={(newCommande) => setCommandes(prev => [...prev, newCommande])} />

                </div>
                </div>
                

        </>



    )
}