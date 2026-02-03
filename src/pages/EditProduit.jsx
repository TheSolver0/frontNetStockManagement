    import React, { useState, useEffect, } from 'react';
import { useParams, useLocation } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message, Switch, Descriptions, Tag, Space } from 'antd';

import { getProduit, API_URL } from "../services/api.js";
import { getCategories } from "../services/api.js";
import { EditOutlined, EyeOutlined } from '@ant-design/icons';

import axios from "axios";
import axiosInstance from '../services/axiosInstance';



function ModifierProduit({ data, isEditing, setIsEditing }) {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Charger les catégories
        getCategories()
            .then(setCategories)
            .catch(error => console.error("Erreur chargement catégories :", error));
    }, []);

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.setFieldsValue({
                name: data.name,
                desc: data.desc,
                quantity: data.quantity,
                categoryId: data.categoryId,
                price: data.price,
                threshold: data.threshold
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
            const response = await axiosInstance.put(`${API_URL}Products/${data.id}/`, values);
            message.success("Produit modifié avec succès !");
            setIsEditing(false);
        } catch (error) {
            message.error("Erreur lors de la modification du produit");
            console.error('Erreur :', error);
        }
        setLoading(false);
    };

    const getStockStatus = (quantity, threshold) => {
        if (quantity <= 0) {
            return <Tag color="red">Rupture de stock</Tag>;
        } else if (quantity <= threshold) {
            return <Tag color="orange">Stock faible</Tag>;
        } else {
            return <Tag color="green">Stock suffisant</Tag>;
        }
    };

    return (
        <Card
            title={
                <Flex justify="space-between" align="center">
                    <span>{isEditing ? "Modifier le Produit" : "Détails du Produit"}</span>
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
                    <Descriptions.Item label="Nom">
                        {data.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Description">
                        {data.desc}
                    </Descriptions.Item>
                    <Descriptions.Item label="Catégorie">
                        {categories.find(c => c.id === data.categoryId)?.libelle || 'Non spécifié'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Quantité en stock">
                        <Space>
                            {data.quantity}
                            {getStockStatus(data.quantity, data.threshold)}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Prix unitaire">
                        {data.price} €
                    </Descriptions.Item>
                    <Descriptions.Item label="Seuil d'alerte">
                        {data.threshold}
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Form
                    {...layout}
                    form={form}
                    onFinish={onFinish}
                    style={{ maxWidth: 600, margin: '0 auto' }}
                >
                    <Form.Item name='name' label="Nom" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>

                    <Form.Item name='desc' label="Description" rules={[{ required: true }]}>
                        <Input.TextArea />
                    </Form.Item>

                    <Form.Item name='categoryId' label="Catégorie" rules={[{ required: true }]}>
                        <Select>
                            {categories.map(categorie => (
                                <Select.Option key={categorie.id} value={categorie.id}>
                                    {categorie.libelle}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item name='quantity' label="Quantité" rules={[{ required: true, type: 'number', min: 0 }]}>
                        <InputNumber style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item name='price' label="Prix unitaire" rules={[{ required: true, type: 'number', min: 0 }]}>
                        <InputNumber style={{ width: '100%' }} prefix="€" />
                    </Form.Item>

                    <Form.Item name='threshold' label="Seuil" rules={[{ required: true, type: 'number', min: 0 }]}>
                        <InputNumber style={{ width: '100%' }} />
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

export function EditProduit() {
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
    const { id } = useParams();
    const [produit, setProduit] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchProduit = async () => {
            try {
                const data = await getProduit(id);
                setProduit(data);
            } catch (error) {
                message.error("Erreur lors du chargement du produit");
                console.error("Erreur lors du chargement du produit :", error);
            }
        };
        fetchProduit();
    }, [id]);

    return (
        <div style={{ padding: '24px' }}>
            <ModifierProduit 
                data={produit} 
                isEditing={isEditing} 
                setIsEditing={setIsEditing}
            />
        </div>
    )
}