import React, { useState, useEffect, } from 'react';
import { useParams, useLocation } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message, Switch, Descriptions, Tag, Space } from 'antd';

import { getFournisseur, getProduits, API_URL } from "../services/api.js";
import { EditOutlined, EyeOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined, ShoppingOutlined } from '@ant-design/icons';

import axios from "axios";
import axiosInstance from '../services/axiosInstance';


function ModifierFournisseur({ data, isEditing, setIsEditing }) {
    const [form] = Form.useForm();
    const [produits, setProduits] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        getProduits().then(setProduits);
    
    
        getProduits().catch(error => console.error("Erreur lors du chargement des produits :", error));
    }, [])

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.setFieldsValue({
                name: data.name,
                email: data.email,
                address: data.address,
                telephone: data.telephone,
                delay: data.delay,
                // si data.products est un tableau d'objets { id, name }, mapper sur les ids
                products: Array.isArray(data.products) ? data.products.map(p => p.id) : data.products,

            });
        }
    }, [data, form]);
    console.log("data", data);
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
            const response = await axiosInstance.put(`${API_URL}Suppliers/${data.id}/`, values);
            message.success("Fournisseur modifié avec succès !");
            setIsEditing(false);
        } catch (error) {
            message.error("Erreur lors de la modification du fournisseur");
            console.error('Erreur :', error);
        }
        setLoading(false);
    };

    return (
        <Card
            title={
                <Flex justify="space-between" align="center">
                    <span>{isEditing ? "Modifier le Fournisseur" : "Détails du Fournisseur"}</span>
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
                    <Descriptions.Item label={<Space><UserOutlined /> Nom</Space>}>
                        {data.name}
                    </Descriptions.Item>
                    <Descriptions.Item label={<Space><MailOutlined /> Email</Space>}>
                        <a href={`mailto:${data.email}`}>{data.email}</a>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Space><HomeOutlined /> Adresse</Space>}>
                        {data.address}
                    </Descriptions.Item>
                    <Descriptions.Item label={<Space><PhoneOutlined /> Téléphone</Space>}>
                        <a href={`tel:${data.telephone}`}>{data.telephone}</a>
                    </Descriptions.Item>
                    <Descriptions.Item label={<Space><ShoppingOutlined /> Produits fournis</Space>}>
                        <Space size={[0, 8]} wrap>
                            {data?.products?.map((p) => {
                                return (
                                    <Tag key={p.id} color="blue">
                                        {p.name ? p.name : `Produit ${p.id}`}
                                    </Tag>
                                );
                            })}
                        </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="Date d'inscription">
                        {data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Non spécifié'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Statut">
                        <Tag color={data.isActive ? 'green' : 'red'}>
                            {data.isActive ? 'Actif' : 'Inactif'}
                        </Tag>
                    </Descriptions.Item>
                </Descriptions>
            ) : (
                <Form
                    {...layout}
                    form={form}
                    onFinish={onFinish}
                    style={{ maxWidth: 600, margin: '0 auto' }}
                >
                    <Form.Item 
                        name='name' 
                        label="Nom" 
                        rules={[{ required: true, message: 'Le nom est requis' }]}
                    >
                        <Input prefix={<UserOutlined />} />
                    </Form.Item>

                    <Form.Item 
                        name='email' 
                        label="Email" 
                        rules={[
                            { required: true, message: 'L\'email est requis' },
                            { type: 'email', message: 'Email invalide' }
                        ]}
                    >
                        <Input prefix={<MailOutlined />} />
                    </Form.Item>

                    <Form.Item 
                        name='address' 
                        label="Adresse" 
                        rules={[{ required: true, message: 'L\'adresse est requise' }]}
                    >
                        <Input.TextArea />
                    </Form.Item>

                    <Form.Item 
                        name='telephone' 
                        label="Téléphone" 
                        rules={[
                            { required: true, message: 'Le téléphone est requis' },
                            { pattern: /^[0-9+ -]+$/, message: 'Numéro de téléphone invalide' }
                        ]}
                    >
                        <Input prefix={<PhoneOutlined />} />
                    </Form.Item>

                    <Form.Item 
                        name='products' 
                        label="Produits" 
                        rules={[{ required: true, message: 'Sélectionnez au moins un produit' }]}
                    >
                        <Select
                            mode="multiple"
                            placeholder="Sélectionnez les produits"
                            style={{ width: '100%' }}
                            prefix={<ShoppingOutlined />}
                        >
                            {produits.map((produit) => (
                                <Select.Option key={produit.id} value={produit.id}>
                                    {produit.name}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                    <Form.Item name='delay' label="Delai de livraison(jrs)" rules={[{ required: true }]}>
                            <InputNumber min={1} placeholder="Ex: 3" />
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

export function EditFournisseur() {
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
    const { id } = useParams();
    const [fournisseur, setFournisseur] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchFournisseur = async () => {
            try {
                const data = await getFournisseur(id);
                setFournisseur(data);
            } catch (error) {
                message.error("Erreur lors du chargement du fournisseur");
                console.error("Erreur lors du chargement du fournisseur :", error);
            }
        };
        fetchFournisseur();
    }, [id]);

    return (
        <div style={{ padding: '24px' }}>
            <ModifierFournisseur 
                data={fournisseur} 
                isEditing={isEditing} 
                setIsEditing={setIsEditing}
            />
        </div>
    )
}