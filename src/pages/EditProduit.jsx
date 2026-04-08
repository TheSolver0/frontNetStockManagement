import React, { useState, useEffect } from 'react';
import { useParams } from "react-router-dom";
import '@ant-design/v5-patch-for-react-19';
import {
    Button, Card, Form, Input, InputNumber, Select, message,
    Switch, Descriptions, Tag, Space, Flex, Upload, Image, Divider
} from 'antd';
import { EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { getProduit, getCategories, API_URL } from "../services/api.js";
import axiosInstance from '../services/axiosInstance';

// ─── Image produit (mode lecture) ─────────────────────────────────────────────
const ProductImageView = ({ imageUrl, name }) => {
    if (!imageUrl) {
        return (
            <div style={{
                width: '100%', maxWidth: 320, height: 220,
                borderRadius: 8, border: '1px dashed var(--color-border-secondary)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                color: 'var(--color-text-secondary)', fontSize: 13,
                background: 'var(--color-background-secondary)',
            }}>
                <span style={{ fontSize: 40, marginBottom: 8 }}>📦</span>
                Aucune image
            </div>
        );
    }
    return (
        <Image
            src={imageUrl}
            alt={name}
            style={{ maxWidth: 320, maxHeight: 220, objectFit: 'cover', borderRadius: 8 }}
            placeholder
        />
    );
};

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
    // prévisualisation locale de la nouvelle image choisie
    const [previewUrl, setPreviewUrl] = useState(null);

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
            // reset prévisualisation quand on recharge le produit
            setPreviewUrl(null);
        }
    }, [data, form]);

    const handleImageChange = ({ file }) => {
        // Ant Design Upload avec beforeUpload=false : file est le raw File
        const raw = file.originFileObj ?? file;
        if (raw && raw instanceof File) {
            setPreviewUrl(URL.createObjectURL(raw));
        }
    };

    const onFinish = async (values) => {
        setLoading(true);
        try {
            const fd = new FormData();
            fd.append('name', values.name.trim());
            fd.append('desc', values.desc?.trim() ?? '');
            fd.append('categoryId', String(parseInt(values.categoryId, 10)));
            fd.append('price', String(Number(values.price)));
            fd.append('quantity', String(parseInt(values.quantity, 10)));
            fd.append('threshold', String(parseInt(values.threshold, 10)));
            fd.append('sku', values.sku ?? '');
            fd.append('location', values.location ?? '');

            // Image : seulement si une nouvelle a été choisie
            const uploadVal = values.image;
            const rawFile = uploadVal?.file?.originFileObj ?? uploadVal?.file;
            if (rawFile instanceof File) {
                fd.append('image', rawFile);
            }

            const response = await axiosInstance.put(
                `${API_URL}Products/${data.id}/`, fd,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );

            message.success("Produit modifié avec succès !");
            setIsEditing(false);
            onSaved?.(response.data); // remonte les nouvelles données
        } catch (error) {
            message.error("Erreur lors de la modification du produit");
            console.error('Erreur :', error);
        } finally {
            setLoading(false);
        }
    };

    const layout = { labelCol: { span: 8 }, wrapperCol: { span: 16 } };

    // Image affichée en lecture : prévisualisation locale ou URL serveur
    const displayImageUrl = previewUrl ?? data.imageUrl;
    const categoryLabel = categories.find(c => c.id === data.categoryId)?.title
        ?? categories.find(c => c.id === data.categoryId)?.libelle
        ?? 'Non spécifié';

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
                <>
                    {/* Image en mode lecture */}
                    <Flex justify="center" style={{ marginBottom: 24 }}>
                        <ProductImageView imageUrl={data.imageUrl} name={data.name} />
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
                <Form {...layout} form={form} onFinish={onFinish} style={{ maxWidth: 600, margin: '0 auto' }}>

                    {/* ── Image ── */}
                    <Divider orientation="left" plain style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        Image du produit
                    </Divider>

                    {/* Prévisualisation de l'image actuelle ou nouvelle */}
                    <Form.Item wrapperCol={{ offset: 8, span: 16 }}>
                        <div style={{ marginBottom: 8 }}>
                            <ProductImageView imageUrl={displayImageUrl} name={data.name} />
                        </div>
                    </Form.Item>

                    <Form.Item name="image" label="Changer l'image">
                        <Upload
                            beforeUpload={() => false}
                            maxCount={1}
                            listType="picture"
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handleImageChange}
                            showUploadList={{ showRemoveIcon: true }}
                        >
                            <Button icon={<PlusOutlined />}>Choisir une image</Button>
                        </Upload>
                    </Form.Item>

                    {/* ── Infos générales ── */}
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

                    {/* ── Stock & Prix ── */}
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
                            <Button onClick={() => { setIsEditing(false); setPreviewUrl(null); }}>
                                Annuler
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
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

    // Met à jour l'état local avec les données retournées par le PUT
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