import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import {
    Button, Card, Form, Input, InputNumber, Select, message,
    Switch, Descriptions, Tag, Space, Flex, Divider, Alert,
} from 'antd';
import { EditOutlined, EyeOutlined, WarningOutlined } from '@ant-design/icons';
import { getProduit, getCategories, API_URL } from "../services/api.js";
import axiosInstance from '../services/axiosInstance';
import { usePermissions } from '../hooks/usePermissions';
import { ProductImageUploadEdit, ProductGallery } from '../components/ProductImageUpload';

// ─── Badge de statut stock ────────────────────────────────────────────────────
const getStockStatus = (quantity, threshold) => {
    if (quantity <= 0) return <Tag color="red">Rupture de stock</Tag>;
    if (quantity <= threshold) return <Tag color="orange">Stock faible</Tag>;
    return <Tag color="green">Stock suffisant</Tag>;
};

// ─── Composant principal ──────────────────────────────────────────────────────
function ModifierProduit({ data, isEditing, setIsEditing, onSaved }) {
    const [form] = Form.useForm();
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);

    const { canDelete } = usePermissions();

    useEffect(() => {
        getCategories()
            .then(setCategories)
            .catch(err => console.error("Erreur catégories :", err));
    }, []);

    useEffect(() => {
        if (data && Object.keys(data).length > 0) {
            form.setFieldsValue({
                name: data.name,
                desc: data.desc,
                quantity: data.quantity,
                categoryId: data.categoryId,
                price: data.price,
                threshold: data.threshold,
                sku: data.sku ?? '',
                location: data.location ?? '',
            });
        }
    }, [data, form]);

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('id', data.id);
            fd.append('name', values.name.trim());
            fd.append('desc', values.desc?.trim() ?? '');
            fd.append('categoryId', String(parseInt(values.categoryId, 10)));
            fd.append('price', String(Number(values.price)));
            fd.append('quantity', String(parseInt(values.quantity, 10)));
            fd.append('threshold', String(parseInt(values.threshold, 10)));
            fd.append('sku', values.sku ?? '');
            fd.append('location', values.location ?? '');
            // NE PAS inclure Images → les images existantes sont conservées
            // La gestion des images se fait via ProductImageUploadEdit

            const response = await axiosInstance.put(
                `${API_URL}Products/${data.id}`, fd,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            message.success("Produit modifié avec succès !");
            setIsEditing(false);
            onSaved?.(response.data || { ...data, ...values });
        } catch (error) {
            const msg = error.response?.data?.message || "Erreur lors de la modification du produit";
            message.error(msg);
            console.error('Erreur :', error);
        } finally {
            setLoading(false);
        }
    };

    const layout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };
    const categoryLabel =
        categories.find(c => c.id === data.categoryId)?.title ??
        categories.find(c => c.id === data.categoryId)?.libelle ??
        'Non spécifié';

    return (
        <Card
            title={
                <Flex justify="space-between" align="center">
                    <span>{isEditing ? "Modifier le produit" : "Détails du produit"}</span>
                    <Switch
                        checkedChildren={<EditOutlined />}
                        unCheckedChildren={<EyeOutlined />}
                        checked={isEditing}
                        onChange={setIsEditing}
                    />
                </Flex>
            }
            style={{ width: '100%', maxWidth: 800, margin: '0 auto' }}
        >
            {!isEditing ? (
                /* ── Mode lecture ── */
                <>
                    <Flex justify="center" style={{ marginBottom: 24 }}>
                        <ProductGallery
                            images={data.images}
                            imageUrl={data.imageUrl}
                            name={data.name}
                        />
                    </Flex>

                    <Descriptions bordered column={1} size="small">
                        <Descriptions.Item label="Nom">{data.name}</Descriptions.Item>
                        <Descriptions.Item label="Description">{data.desc}</Descriptions.Item>
                        <Descriptions.Item label="Catégorie">{categoryLabel}</Descriptions.Item>
                        <Descriptions.Item label="SKU">{data.sku || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Emplacement">{data.location || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Quantité en stock">
                            <Space>
                                {data.quantity}
                                {getStockStatus(data.quantity, data.threshold)}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="Prix unitaire">
                            {data.price?.toLocaleString()} XAF
                        </Descriptions.Item>
                        <Descriptions.Item label="Seuil d'alerte">{data.threshold}</Descriptions.Item>
                    </Descriptions>
                </>
            ) : (
                /* ── Mode édition ── */
                <>
                    {/* ── Gestion des images (indépendante du formulaire principal) ── */}
                    <Divider orientation="left" plain style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        Gestion des images
                    </Divider>

                    {data.id && (
                        <>
                            <Alert
                                type="info"
                                showIcon
                                icon={<WarningOutlined />}
                                message="Les modifications d'images sont appliquées immédiatement, indépendamment de la sauvegarde du formulaire."
                                style={{ marginBottom: 16, fontSize: 12 }}
                            />
                            <ProductImageUploadEdit
                                productId={data.id}
                                initialImages={data.images ?? []}
                                canDelete={canDelete}
                            />
                        </>
                    )}

                    {/* ── Formulaire infos produit ── */}
                    <Form {...layout} form={form} onFinish={onFinish} style={{ maxWidth: 600, margin: '0 auto', marginTop: 24 }}>

                        <Divider orientation="left" plain style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            Informations générales
                        </Divider>

                        <Form.Item name="name" label="Nom" rules={[{ required: true, message: 'Champ requis' }]}>
                            <Input />
                        </Form.Item>

                        <Form.Item name="desc" label="Description" rules={[{ required: true, message: 'Champ requis' }]}>
                            <Input.TextArea rows={3} />
                        </Form.Item>

                        <Form.Item name="categoryId" label="Catégorie" rules={[{ required: true, message: 'Champ requis' }]}>
                            <Select>
                                {categories.map(cat => (
                                    <Select.Option key={cat.id} value={cat.id}>
                                        {cat.title ?? cat.libelle}
                                    </Select.Option>
                                ))}
                            </Select>
                        </Form.Item>

                        <Form.Item name="sku" label="SKU">
                            <Input placeholder="Ex: PROD-001" />
                        </Form.Item>

                        <Form.Item name="location" label="Emplacement">
                            <Input placeholder="Ex: Rayon A3" />
                        </Form.Item>

                        <Divider orientation="left" plain style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                            Stock & Prix
                        </Divider>

                        <Form.Item name="quantity" label="Quantité" rules={[{ required: true, type: 'number', min: 0, message: 'Valeur invalide' }]}>
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>

                        <Form.Item name="price" label="Prix unitaire (XAF)" rules={[{ required: true, type: 'number', min: 0, message: 'Valeur invalide' }]}>
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>

                        <Form.Item name="threshold" label="Seuil d'alerte" rules={[{ required: true, type: 'number', min: 0, message: 'Valeur invalide' }]}>
                            <InputNumber style={{ width: '100%' }} min={0} />
                        </Form.Item>

                        <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                            <Space>
                                <Button type="primary" htmlType="submit" loading={loading}>
                                    Enregistrer
                                </Button>
                                <Button onClick={() => setIsEditing(false)}>
                                    Annuler
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </>
            )}
        </Card>
    );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export function EditProduit() {
    const { id } = useParams();
    const [produit, setProduit] = useState({});
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        getProduit(id)
            .then(setProduit)
            .catch(() => message.error("Erreur lors du chargement du produit"));
    }, [id]);

    const handleSaved = (updated) => {
        setProduit(prev => ({ ...prev, ...updated }));
    };

    return (
        <div style={{ padding: '24px' }}>
            <ModifierProduit
                data={produit}
                isEditing={isEditing}
                setIsEditing={setIsEditing}
                onSaved={handleSaved}
            />
        </div>
    );
}
