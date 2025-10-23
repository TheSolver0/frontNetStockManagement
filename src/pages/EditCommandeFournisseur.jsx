import React, { useState, useEffect, } from 'react';
import { useParams, useLocation } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message, Switch, Descriptions, Tag, Space } from 'antd';

import { getCommandeClient, getClients, getProduits, getCommandeFournisseur, getFournisseurs, API_URL } from "../services/api";
import { EditOutlined, EyeOutlined } from '@ant-design/icons';

import axios from "axios";
import { Fournisseurs } from './Fournisseurs';
import axiosInstance from '../services/axiosInstance';

const STATUT_CHOICES = [
    {
        "id": 0,
        "libelle": 'EN_ATTENTE',
    },
    {
        "id": 1,
        "libelle": 'PREPAREE',
    },
    {
        "id": 2,
        "libelle": 'EXPEDIEE',
    },
    {
        "id": 3,
        "libelle": 'LIVREE',
    },
    {
        "id": 4,
        "libelle": 'ANNULEE',
    }

]
function ModifierCommande({ data, isEditing, setIsEditing }) {
    const [form] = Form.useForm();
    const [produits, setProduits] = useState([]);
    const [fournisseurs, setFournisseurs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const produitsData = await getProduits();
                setProduits(produitsData);
                const fournisseursData = await getFournisseurs();
                setFournisseurs(fournisseursData);
            } catch (error) {
                console.error("Erreur lors du chargement des données :", error);
                message.error("Erreur lors du chargement des données");
            }
        };
        fetchData();
    }, [])



    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.setFieldsValue({
                productId: data.productId,
                quantity: data.quantity,
                supplierId: data.supplierId,
                status: data.status,

            });
        }
    }, [data, form]);
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
        setLoading(true);
        values.id = data.id;
        try {
            const response = await axiosInstance.put(`${API_URL}Provides/${data.id}/`, values);
            message.success("Commande fournisseur modifiée avec succès !");
            setIsEditing(false);
        } catch (error) {
            message.error("Erreur lors de la modification de la commande fournisseur");
            console.error('Erreur :', error);
        }
        setLoading(false);
        
    };

    const handleFournisseurChange = (id) => {
        const fournisseur = fournisseurs.find(f => f.id === id);
        console.log('f', fournisseur);
        if (fournisseur) {
            // console.log(fournisseur)
            // Met à jour dynamiquement le champ caché avec la liste des IDs produits
            form.setFieldsValue({
                fournisseur_produit: fournisseur.produits, // ou JSON.stringify si besoin texte
            });
        }
    }


    const getStatusTag = (status) => {
        const statusColors = {
            'EN_ATTENTE': 'blue',
            'PREPAREE': 'gold',
            'EXPEDIEE': 'purple',
            'LIVREE': 'green',
            'ANNULEE': 'red'
        };
        return <Tag color={statusColors[status]}>{status}</Tag>;
    };

    return (
        <Card
            title={
                <Flex justify="space-between" align="center">
                    <span>{isEditing ? "Modifier la Commande Fournisseur" : "Détails de la Commande Fournisseur"}</span>
                    <Switch
                        checkedChildren={<EditOutlined />}
                        unCheckedChildren={<EyeOutlined />}
                        checked={isEditing}
                        onChange={(checked) => setIsEditing(checked)}
                    />
                </Flex>
            }
            style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}
        >
            {!isEditing ? (
                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Produit">
                        {produits.find(p => p.id === data.productId)?.nom || 'Non spécifié'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quantité">
                        {data.quantity}
                    </Descriptions.Item>
                    <Descriptions.Item label="Fournisseur">
                        {fournisseurs.find(f => f.id === data.supplierId)?.nom || 'Non spécifié'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Statut">
                        {getStatusTag(data.status)}
                    </Descriptions.Item>
                    <Descriptions.Item label="Date de création">
                        {new Date(data.createdAt).toLocaleDateString()}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Form
                    {...layout}
                    name="nest-messages"
                    onFinish={onFinish}
                    validateMessages={validateMessages}
                    form={form}
                >
                    <Form.Item name='productId' label="Produit" rules={[{ required: true }]}>
                        <Select>
                            {produits.map((produit) => (
                                <Select.Option key={produit.id} value={produit.id}>{produit.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name='quantity' label="Quantité" rules={[{ type: 'number', min: 0, required: true }]}>
                        <InputNumber style={{ width: "100%" }} />
                    </Form.Item>

                    <Form.Item name='supplierId' label="Fournisseur" rules={[{ required: true }]}>
                        <Select onChange={handleFournisseurChange}>
                            {fournisseurs.map((fournisseur) => (
                                <Select.Option key={fournisseur.id} value={fournisseur.id}>{fournisseur.name}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name='status' label="Statut" rules={[{ required: true }]}>
                        <Select>
                            {STATUT_CHOICES.map((statut) => (
                                <Select.Option key={statut.id} value={statut.libelle}>{statut.libelle}</Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name="fournisseur_produit" hidden>
                        <Input type="hidden" />
                    </Form.Item>

                    <Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" loading={loading}>
                                Enregistrer les modifications
                            </Button>
                            <Button onClick={() => setIsEditing(false)}>
                                Annuler
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            )}
        </Card>
    );
}

export function EditCommandeFournisseur() {
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
    const { id } = useParams();
    const [commande, setCommande] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchCommande = async () => {
            try {
                const data = await getCommandeFournisseur(id);
                setCommande(data);
            } catch (error) {
                message.error("Erreur lors du chargement de la commande fournisseur");
                console.error("Erreur lors du chargement de la commande :", error);
            }
        };
        fetchCommande();
        getCommandeFournisseur().catch(error => console.error("Erreur lors du chargement des Clients :", error));
    }, [])

    return (
        <div style={{ padding: '24px' }}>
            <ModifierCommande 
                data={commande} 
                isEditing={isEditing} 
                setIsEditing={setIsEditing}
            />
        </div>
    )
}