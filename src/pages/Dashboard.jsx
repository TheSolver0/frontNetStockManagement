import React, { useState, useEffect, } from 'react';
import BarChart from './Bar';
import './Dashboard.css';
import LineChart from './Line';
import ErrorBoundary from './ErrorBoundary';
import { Button, Layout, Row, Col, theme, Flex, Typography, Modal, Spin, Card, Statistic, Grid } from 'antd';
import { useAnalyticsAI } from '../hooks/useAnalyticsAI';
import { useOpenRouterAnalytics } from '../hooks/useOpenRouterAnalytics.js';
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
import ResponsiveTable from '../components/ResponsiveTable';

import { getMouvements, getCommandesClient, getProduits, getClients, getFournisseurs } from "../services/api.js";

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
    const screens = Grid.useBreakpoint();




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
                    <Flex justify="space-between" align="center" style={{ marginBottom: 24, gap: 16 }}>
                        <h2 style={{ margin: 0 }}>Dashboard</h2>
                        <Button
                            type="primary"
                            icon={<RobotOutlined />}
                            onClick={handleAIAnalysis}
                            size="large"
                        >
                            Analyse avec IA
                        </Button>
                    </Flex>

                    {/* Stat cards */}
                    <Row gutter={[16, 16]} className="stats-grid">
                        <Col xs={24} sm={12} md={6}>
                            <Card className="dashboard-card sales-card" bordered={false}>
                                <Statistic title="Ventes Totales" value={stats.totalVentes?.toLocaleString() || 0} suffix="XAF" />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card className="dashboard-card inventory-card" bordered={false}>
                                <Statistic title="Stock Total" value={stats.totalProduits || 0} />
                            </Card>
                        </Col>
                        <Col xs={24} sm={12} md={6}>
                            <Card className="dashboard-card critical-stock-card" bordered={false}>
                                <Statistic title="Produits Critiques" value={stats.produitsCritiques || 0} />
                            </Card>
                        </Col>
                        {/* Hide the movements card on very small screens to declutter */}
                        {screens.sm && (
                            <Col xs={24} sm={12} md={6}>
                                <Card className="dashboard-card movements-card" bordered={false}>
                                    <Statistic title="Mouvements du Mois" value={stats.mouvementsMois || 0} />
                                </Card>
                            </Col>
                        )}
                    </Row>

                    <div className="table-responsive" style={{ marginTop: 20 }}>

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

                    <ResponsiveTable
                        table={table}
                        renderTable={() => (
                            <>
                                <table id="myTable" className="table table-hover table-striped-columns align-middle responsive-table">
                                    <caption>Derniers mouvements</caption>
                                    <thead className="table-light">
                                        {table.getHeaderGroups().map(headerGroup => (
                                            <tr key={headerGroup.id}>
                                                {headerGroup.headers.map(header => (
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
                                <div className="pagination-controls" style={{ marginTop: '1rem', display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <Button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Précédent</Button>
                                    <Button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Suivant</Button>
                                    <span>Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}</span>
                                </div>
                            </>
                        )}
                    />

                    </div> {/* .table-responsive */} 
                </div>

                <div className="addProduit" >
                    <Card className="chart-card" bordered={false}>
                        {data?.labels?.length && data?.datasets?.length ? (
                            <LineChart data={data} compact={!screens.md} />
                        ) : (
                            <p>Chargement du graphique...</p>
                        )}
                    </Card>
                </div>
            </div>

            {/* Show second chart only on medium and larger screens to keep mobile clean */}
            {screens.md && (
                <div className="addProduit" style={{ marginTop: '20px' }}>
                    <Card className="chart-card" bordered={false}>
                        <LineChart data={data2} />
                    </Card>
                </div>
            )}


        </ErrorBoundary>

    )
}
