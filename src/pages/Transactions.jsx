import React, { useState, useEffect, } from 'react';
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
import { getMouvements, getProduits, getClients, getFournisseurs } from "../services/api";

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';

const { Content } = Layout;




export function Transactions() {
    const [mouvements, setMouvements] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
    const [produits, setProduits] = useState([]);
    const [clients, setClients] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);

    useEffect(() => {
        getMouvements().then(setMouvements);
        getMouvements().catch(error => console.error("Erreur lors du chargement des Mouvements :", error));
    }, [])
    useEffect(() => {
        // Charger les données une seule fois
        getClients()
            .then(setClients)
            .catch((error) => console.error("Erreur lors du chargement des clients :", error));
    }, []);
    useEffect(() => {
        // Charger les données une seule fois
        getFournisseurs()
            .then(setFournisseurs)
            .catch((error) => console.error("Erreur lors du chargement des fournisseurs :", error));
    }, []);
    useEffect(() => {
        // Charger les données une seule fois
        getProduits()
            .then(setProduits)
            .catch((error) => console.error("Erreur lors du chargement des produits :", error));
    }, []);
    // Remarque: `mouvements` est un tableau. Si vous voulez tester une correspondance
    // avec un produit/client/fournisseur, utilisez un élément de ce tableau (ex: le premier).
    const exampleMouvement = Array.isArray(mouvements) && mouvements.length > 0 ? mouvements[0] : null;
    const product = exampleMouvement?.productId ? produits.find(p => p.id === exampleMouvement.productId) : null;
    const customer = exampleMouvement?.customerId ? clients.find(c => c.id === exampleMouvement.customerId) : null;
    const supplier = exampleMouvement?.supplierId ? fournisseurs.find(f => f.id === exampleMouvement.supplierId) : null;

    // Logs plus utiles: taille des tableaux et exemple d'association
    console.log("Mouvements (count):", Array.isArray(mouvements) ? mouvements.length : mouvements);
    console.log("Exemple mouvement:", exampleMouvement);
    console.log("Produit (exemple):", product);
    // console.log("Client (exemple):", customer.name);
    console.log("Fournisseur (exemple):", supplier);

    const columns = [
        { header: 'ID', accessorKey: 'id' },
        {
            header: 'Type',
            id: 'type',
            cell: ({ row }) => (<span className="badge " style={{
                fontSize: '11px',
                background: (row.original.type === 'Entrée') ? '#06d6a0' :
                    (row.original.type === 'Sortie') ? 'red' : ''
            }} >{row.original.type}</span>)
        },
        {
            header: 'Acteur',
            id: 'acteur',
            cell: ({ row }) => {
                const orig = row.original;
                // Prioriser le client si présent sinon le fournisseur
                if (orig.customerId) {
                    const c = clients.find(x => x.id === orig.customerId);
                    return c ? c.name || 'Client' : 'Client non trouvé';
                }
                if (orig.supplierId) {
                    const f = fournisseurs.find(x => x.id === orig.supplierId);
                    return f ? f.name || 'Fournisseur' : 'Fournisseur non trouvé';
                }
                return '-';
            }
        },
        {
            header: 'Produit',
            id: 'produit',
            cell: ({ row }) => {
                const orig = row.original;
                if (orig.productId) {
                    const p = produits.find(x => x.id === orig.productId);
                    return p ?  p.name || 'Produit' : 'Produit non trouvé';
                }
                return '-';
            }
        },
        { header: 'Quantité', accessorKey: 'quantity' },
        {
            header: 'Montant(XAF)',
            id: 'amount',
            cell: ({ row }) => (<span className="badge " style={{
                fontSize: '11px',
                background: (row.original.type === 'Entrée') ? 'red' :
                    (row.original.type === 'Sortie') ? '#06d6a0' : ''
            }} >{row.original.amount}</span>)
        },
        // {
        //     header: 'Actions',
        //     id: 'actions',
        //     cell: ({ row }) => (
        //         <Flex justify="space-evenly">
        //             <Popconfirm
        //                 title="Suppression de ligne"
        //                 description="Êtes-vous sûr de vouloir supprimer cette ligne ?"
        //                 onConfirm={() => handleDelete(row.original.id)}
        //                 icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
        //             >
        //                 <Button danger><MinusSquareFilled /></Button>
        //             </Popconfirm>


        //         </Flex>
        //     ),
        // },
    ];
    const table = useReactTable({
        data: mouvements,
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
                pageSize: 3,   // tu ne verras que 3 entrées
            }
        },
    });


    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken();
    const [size, setSize] = useState('large');

    return (

        <>
            <Flex align="flex-end" justify="space-between" className='flexCardstat'>
                <h2 style={{ color: "rgb(0 21 41)", }}>Table de Transactions</h2>

            </Flex>
            <Row justify="space-between">
                <Col span={24}>
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
                </Col>

            </Row >
        </>



    )
}