import React, { useState, useEffect, } from 'react';
import { useParams, useLocation } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import { Button, Layout, Menu, theme, Card, Col, Row, Flex, Form, Input, InputNumber, Modal, Select, Popconfirm, message, Switch, Descriptions, Tag, Space } from 'antd';

import { getClient, API_URL } from "../services/api";
import { EditOutlined, EyeOutlined, UserOutlined, MailOutlined, PhoneOutlined, HomeOutlined } from '@ant-design/icons';

import axios from "axios";
import axiosInstance from '../services/axiosInstance';


function ModifierClient({ data, isEditing, setIsEditing }) {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
   

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.setFieldsValue({
                name: data.name,
                email: data.email,
                address: data.address,
                telephone: data.telephone,
               
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
            const response = await axiosInstance.put(`${API_URL}Customers/${data.id}/`, values);
            message.success("Client modifié avec succès !");
            setIsEditing(false);
        } catch (error) {
            message.error("Erreur lors de la modification du client");
            console.error('Erreur :', error);
        }
        setLoading(false);
    };

    return (
        <Card
            title={
                <Flex justify="space-between" align="center">
                    <span>{isEditing ? "Modifier le Client" : "Détails du Client"}</span>
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
                        <Input.TextArea prefix={<HomeOutlined />} />
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

export function EditClient() {
    const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
    const { id } = useParams();
    const [client, setClient] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        const fetchClient = async () => {
            try {
                const data = await getClient(id);
                setClient(data);
            } catch (error) {
                message.error("Erreur lors du chargement du client");
                console.error("Erreur lors du chargement du client :", error);
            }
        };
        fetchClient();
    }, [id]);

    return (
        <div style={{ padding: '24px' }}>
            <ModifierClient 
                data={client} 
                isEditing={isEditing} 
                setIsEditing={setIsEditing}
            />
        </div>
    )
}