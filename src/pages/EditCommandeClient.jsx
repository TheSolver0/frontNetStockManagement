import React, { useState, useEffect, } from 'react';
import { useParams, useLocation } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message, Switch, Descriptions, Tag, Space } from 'antd';

import { getCommandeClient, getClients, getProduits, API_URL } from "../services/api";
import { EditOutlined, EyeOutlined } from '@ant-design/icons';

import axios from "axios";
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
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProduits().then(setProduits);
        getProduits().catch(error => console.error("Erreur lors du chargement des produits :", error));
        getClients().then(setClients);
        getClients().catch(error => console.error("Erreur lors du chargement des clients :", error));
    }, [])



    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.setFieldsValue({
                productId: data.productId,
                quantity: data.quantity,
                customerId: data.customerId,
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
        const p = produits.find(p => p.id === values.productId);
        // if (values.quantity > (parseInt(p.qte - p.seuil)) && 
        //     (values.status === 'LIVREE' || values.status === 'EXPEDIEE' || values.status === 'PREPAREE')) {
        //     message.error("Le produit ne peut passer à ce statut. Stock insuffisant.");
        // } else {
            try {
                const response = await axiosInstance.put(`${API_URL}Orders/${data.id}/`, values);
                message.success("Commande client modifiée avec succès !");
                setIsEditing(false);
            } catch (error) {
                message.error("Erreur lors de la modification de la commande client");
                console.error('Erreur :', error);
            }
        // }
        setLoading(false);

    };

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
                    <span>{isEditing ? "Modifier la Commande" : "Détails de la Commande"}</span>
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
                    <Descriptions.Item label="Client">
                        {clients.find(c => c.id === data.customerId)?.nom || 'Non spécifié'}
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

                    <Form.Item name='customerId' label="Client" rules={[{ required: true }]}>
                        <Select>
                            {clients.map((client) => (
                                <Select.Option key={client.id} value={client.id}>{client.name}</Select.Option>
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

export function EditCommandeClient() {
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
    const { id } = useParams();
    const [commande, setCommande] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchCommande = async () => {
            try {
                const data = await getCommandeClient(id);
                setCommande(data);
            } catch (error) {
                message.error("Erreur lors du chargement de la commande");
                console.error("Erreur lors du chargement de la commande :", error);
            }
        };
        fetchCommande();
    }, [id]);

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