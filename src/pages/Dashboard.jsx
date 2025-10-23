import React, { useState, useEffect, } from 'react';
import BarChart from './Bar';
import './Dashboard.css';
import LineChart from './Line';
import ErrorBoundary from './ErrorBoundary';
import { Button, Layout, Row, Col, theme, Flex, Typography, Modal, Spin } from 'antd';
import { useAnalyticsAI } from '../hooks/useAnalyticsAI';
import { useOpenRouterAnalytics } from '../hooks/useOpenRouterAnalytics';
import {
    MinusSquareFilled,
    PlusSquareOutlined,
    EditFilled,
    QuestionCircleOutlined,
    CaretUpOutlined,
    CaretDownOutlined,
    RobotOutlined,
    LoadingOutlined,
    ShoppingOutlined,
    InboxOutlined,
    WarningOutlined,
    SwapOutlined
} from '@ant-design/icons';
import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getSortedRowModel,
    getPaginationRowModel,
    flexRender,
} from '@tanstack/react-table';
import DataTable from 'datatables.net-dt';

import AnalyticsPanel from '../components/AnalyticsPanel';

import { getMouvements, getCommandesClient, getProduits, getClients, getFournisseurs } from "../services/api";

const token = localStorage.getItem('accessToken');
const head = {
    headers: {
        Authorization: `Bearer ${token}`
    }
}
const { Content } = Layout;

const Desc = props => (
    <Flex justify="center" align="center" style={{ height: '100%' }}>
        <Typography.Title type="secondary" level={5} style={{ whiteSpace: 'nowrap' }}>
            {props.text}
        </Typography.Title>
    </Flex>
);

export function Dashboard() {

    const [mouvements, setMouvements] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');
    const [sorting, setSorting] = useState([{ id: 'id', desc: true }]);
    const [produits, setProduits] = useState([]);
    const [commandes, setCommandes] = useState([]);
    const [clients, setClients] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [data, setData] = useState({});
    const [data2, setData2] = useState({});
    const [isAIModalVisible, setIsAIModalVisible] = useState(false);
    const [aiAnalysis, setAiAnalysis] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const { analyzeStockData, loading, error, analysis } = useOpenRouterAnalytics();

    const handleAIAnalysis = async () => {
        setIsAIModalVisible(true);
        try {
            await analyzeStockData(data, data2, produits, commandes, mouvements);
        } catch (error) {
            console.error("Erreur analyse OpenRouter:", error);
        }
    };
    useEffect(() => {
        getMouvements().then(setMouvements);
        getMouvements().catch(error => console.error("Erreur lors du chargement des Mouvements :", error));
        getProduits()
            .then(setProduits)
            .catch((error) => console.error("Erreur lors du chargement des produits :", error));
        getCommandesClient().then(setCommandes);
        getCommandesClient().catch(error => console.error("Erreur lors du chargement des commandes :", error));

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
    console.log('data', data);
    useEffect(() => {
        console.log('data2', data);
    }, [data]);
    const analyserDonnees = (produits, commandes) => {
        if (!Array.isArray(produits) || !Array.isArray(commandes)) return;

        // Calculer les statistiques
        const commandesLivrees = commandes.filter(c => c.statut === 'LIVREE');
        const totalVentes = commandesLivrees.reduce((sum, c) => sum + parseFloat(c.montant), 0);

        // Produits les plus vendus
        const ventesParProduit = produits.map(p => ({
            nom: p.nom,
            quantite: commandesLivrees.filter(c => c.produits === p.id)
                .reduce((sum, c) => sum + parseFloat(c.qte), 0),
            montant: commandesLivrees.filter(c => c.produits === p.id)
                .reduce((sum, c) => sum + parseFloat(c.montant), 0)
        })).sort((a, b) => b.quantite - a.quantite);

        // Stocks critiques
        const stocksCritiques = produits
            .filter(p => p.qte <= p.seuil)
            .map(p => ({
                nom: p.nom,
                stock: p.qte,
                seuil: p.seuil,
                critique: (p.seuil - p.qte) / p.seuil * 100
            }))
            .sort((a, b) => b.critique - a.critique);

        /*setAnalyticsData({
            totalVentes,
            croissanceVentes: 15, // À calculer avec les données historiques
            produitsPlusVendus: ventesParProduit.slice(0, 5),
            stocksCritiques: stocksCritiques.slice(0, 5),
            tendances: ventesParProduit.map(p => ({
                nom: p.nom,
                progression: Math.random() * 100 - 50 // À remplacer par le vrai calcul
            })),
            performanceGlobale: 75 // À calculer selon vos métriques
        });*/
    };

    useEffect(() => {
        if (!Array.isArray(produits) || !Array.isArray(commandes)) return;
        analyserDonnees(produits, commandes);
        const newData = {
            labels: produits.map(p => p.name),
            datasets: [
                {
                    label: 'Nombres de ventes en fonction de produits',
                    data: produits.map(p =>
                        commandes.filter(c => c.status === 'LIVREE' && c.productId === p.id).length
                    ),
                    borderColor: 'rgb(27, 104, 220)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.5, // courbe lissée
                    fill: true,
                },
                {
                    label: 'Nombre de produits vendu en fonction des produits',
                    data: produits.map(p =>
                        commandes.filter(c => c.status === 'LIVREE' && c.productId === p.id).reduce((somme, c) => (parseFloat(somme) + parseFloat(c.quantity)), 0)
                    ),
                    borderColor: 'rgb(27, 220, 101)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.5, // courbe lissée
                    fill: true,
                }
            ]
        }
        const newData2 = {
            labels: produits.map(p => p.name),
            datasets: [

                {
                    label: 'Entrées d\'argent(en milliers de XAF) en fonction des produits',
                    data: produits.map(p =>
                        commandes.filter(c => c.status === 'LIVREE' && c.productId === p.id).reduce((somme, c) => (parseFloat(somme) + parseFloat(c.amount) / 1000), 0)
                    ),
                    borderColor: 'rgb(27, 220, 101)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.5, // courbe lissée
                    fill: true,
                }
            ]
        }
        setData(newData);
        setData2(newData2);

    }, [produits, commandes])

    const exampleMouvement = Array.isArray(mouvements) && mouvements.length > 0 ? mouvements[0] : null;
    const product = exampleMouvement?.productId ? produits.find(p => p.id === exampleMouvement.productId) : null;
    const customer = exampleMouvement?.customerId ? clients.find(c => c.id === exampleMouvement.customerId) : null;
    const supplier = exampleMouvement?.supplierId ? fournisseurs.find(f => f.id === exampleMouvement.supplierId) : null;


    const columns = [
        { header: 'ID', accessorKey: 'id' },
        {
            header: 'Type',
            id: 'type',
            cell: ({ row }) => (<span className="badge " style={{
                fontSize: '12px',
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
                    return p ? p.name || 'Produit' : 'Produit non trouvé';
                }
                return '-';
            }
        },
        { header: 'Quantité', accessorKey: 'quantity' },
        {
            header: 'Montant(XAF)',
            id: 'amount',
            cell: ({ row }) => (<span className="badge " style={{
                fontSize: '13px',
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




    // Calcul des statistiques
    const calculateStats = () => {
        if (!Array.isArray(commandes) || !Array.isArray(produits) || !Array.isArray(mouvements)) return {};

        const totalVentes = commandes
            .filter(c => c.status === 'LIVREE')
            .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0);

        const produitsCritiques = produits
            .filter(p => p.quantity <= p.seuilAlerte)
            .length;

        const totalProduits = produits.reduce((sum, p) => sum + (parseInt(p.quantity) || 0), 0);

        const mouvementsMois = mouvements
            .filter(m => {
                const date = new Date(m.date);
                const maintenant = new Date();
                return date.getMonth() === maintenant.getMonth() &&
                    date.getFullYear() === maintenant.getFullYear();
            }).length;

        return {
            totalVentes,
            produitsCritiques,
            totalProduits,
            mouvementsMois
        };
    };

    const stats = calculateStats();

    return (
        <ErrorBoundary>
            <div className="contentBody">
                <div className="produits">
                    <Flex justify="space-between" align="center" style={{ marginBottom: 24 }}>
                        <h2>Dashboard</h2>
                        <Button
                            type="primary"
                            icon={<RobotOutlined />}
                            onClick={handleAIAnalysis}
                            size="large"
                            style={{ position: "absolute", right: "10px" }}
                        >
                            Analyse avec IA
                        </Button>
                    </Flex>

                    {/* Cartes statistiques */}
                    {/* <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={6}>
                            <div style={{ 
                                background: '#e6f7ff', 
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <Flex align="center" justify="space-between">
                                    <div>
                                        <Typography.Text type="secondary">Ventes Totales</Typography.Text>
                                        <Typography.Title level={3} style={{ margin: '8px 0' }}>
                                            {stats.totalVentes?.toLocaleString()} XAF
                                        </Typography.Title>
                                    </div>
                                    <div style={{ 
                                        background: '#1890ff',
                                        padding: '12px',
                                        borderRadius: '50%',
                                        color: 'white'
                                    }}>
                                        <ShoppingOutlined style={{ fontSize: '24px' }} />
                                    </div>
                                </Flex>
                            </div>
                        </Col>
                        <Col span={6}>
                            <div style={{ 
                                background: '#fff7e6', 
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <Flex align="center" justify="space-between">
                                    <div>
                                        <Typography.Text type="secondary">Stock Total</Typography.Text>
                                        <Typography.Title level={3} style={{ margin: '8px 0' }}>
                                            {stats.totalProduits} unités
                                        </Typography.Title>
                                    </div>
                                    <div style={{ 
                                        background: '#fa8c16',
                                        padding: '12px',
                                        borderRadius: '50%',
                                        color: 'white'
                                    }}>
                                        <InboxOutlined style={{ fontSize: '24px' }} />
                                    </div>
                                </Flex>
                            </div>
                        </Col>
                        <Col span={6}>
                            <div style={{ 
                                background: '#fff1f0', 
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <Flex align="center" justify="space-between">
                                    <div>
                                        <Typography.Text type="secondary">Produits Critiques</Typography.Text>
                                        <Typography.Title level={3} style={{ margin: '8px 0' }}>
                                            {stats.produitsCritiques} produits
                                        </Typography.Title>
                                    </div>
                                    <div style={{ 
                                        background: '#ff4d4f',
                                        padding: '12px',
                                        borderRadius: '50%',
                                        color: 'white'
                                    }}>
                                        <WarningOutlined style={{ fontSize: '24px' }} />
                                    </div>
                                </Flex>
                            </div>
                        </Col>
                        <Col span={6}>
                            <div style={{ 
                                background: '#f6ffed', 
                                padding: '20px',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}>
                                <Flex align="center" justify="space-between">
                                    <div>
                                        <Typography.Text type="secondary">Mouvements du Mois</Typography.Text>
                                        <Typography.Title level={3} style={{ margin: '8px 0' }}>
                                            {stats.mouvementsMois}
                                        </Typography.Title>
                                    </div>
                                    <div style={{ 
                                        background: '#52c41a',
                                        padding: '12px',
                                        borderRadius: '50%',
                                        color: 'white'
                                    }}>
                                        <SwapOutlined style={{ fontSize: '24px' }} />
                                    </div>
                                </Flex>
                            </div>
                        </Col>
                    </Row> */}

                    <Modal
                        title={
                            <Flex align="center" gap="small">
                                <RobotOutlined />
                                <span>Analyse Intelligence Artificielle</span>
                                {loading && <Spin size="small" />}
                            </Flex>
                        }
                        open={isAIModalVisible}
                        onCancel={() => setIsAIModalVisible(false)}
                        footer={null}
                        width={1200}
                        style={{ top: 20 }}
                    >
                        <div style={{ minHeight: '50vh', padding: '20px' }}>
                            {loading && (
                                <div style={{ textAlign: 'center', padding: '40px' }}>
                                    <Spin size="large" />
                                    <p>Analyse OpenRouter en cours...</p>
                                </div>
                            )}

                            {error && (
                                <div style={{
                                    background: '#fff2f0',
                                    border: '1px solid #ffccc7',
                                    padding: '16px',
                                    borderRadius: '6px',
                                    color: '#a8071a'
                                }}>
                                    ❌ {error}
                                </div>
                            )}

                            {analysis && (
                                <div style={{
                                    whiteSpace: 'pre-wrap',
                                    lineHeight: '1.6',
                                    fontSize: '14px',
                                    fontFamily: 'system-ui'
                                }}>
                                    {analysis}
                                </div>
                            )}
                        </div>
                    </Modal>


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

                <div className="addProduit" >
                    {/* <Col span={10} style={{ background: '#f6f4ff', borderRadius: '10px', }}> */}
                    {data?.labels?.length && data?.datasets?.length ? (
                        <LineChart data={data} />
                    ) : (
                        <p>Chargement du graphique...</p>
                    )}

                    {/* </Col> */}



                </div>
            </div>

            <div className="addProduit" style={{ width: '105%', marginTop: '20px', }}>
                {/* <Col  style={{ background: '#f6f4ff', borderRadius: '0px', width: '100%' }}> */}
                <LineChart data={data2} />
                {/* </Col> */}


            </div>


        </ErrorBoundary>

    )
}
