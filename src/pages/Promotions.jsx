import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card, Tabs, Table, Button, Modal, Form, Input, Select, Switch,
  Popconfirm, message, Space, Tag, Typography, Upload, ColorPicker,
  DatePicker, InputNumber, Flex, Tooltip,
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, PictureOutlined,
  QuestionCircleOutlined, GiftOutlined, CalendarOutlined,
  CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllEvents, createEvent, updateEvent, deleteEvent, uploadEventImage,
  getDiscounts, createDiscount, updateDiscount, deleteDiscount,
  getProduits,
} from '../services/api.js';
import { usePermissions } from '../hooks/usePermissions.js';

const { RangePicker } = DatePicker;
const { Title, Text } = Typography;

// ─── Utilitaires ─────────────────────────────────────────────────────────────
const fmtDate = (iso) => (iso ? dayjs(iso).format('DD/MM/YYYY') : '—');

const colorToHex = (val) => {
  if (!val) return '#000000';
  if (typeof val === 'string') return val;
  return val.toHexString?.() ?? String(val);
};

// ─── Badge coloré d'événement ─────────────────────────────────────────────────
const EventBadge = ({ label, bgColor, textColor }) => (
  <span
    style={{
      display: 'inline-block',
      padding: '2px 10px',
      borderRadius: 12,
      background: bgColor || '#333',
      color: textColor || '#fff',
      fontWeight: 700,
      fontSize: 11,
    }}
  >
    {label}
  </span>
);

// ─── Section Événements ────────────────────────────────────────────────────────
function EvenementsTab({ canManage }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingId, setUploadingId] = useState(null);
  const [includeExpired, setIncludeExpired] = useState(false);
  const [form] = Form.useForm();

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAllEvents(includeExpired);
      setEvents(data);
    } catch {
      message.error('Erreur lors du chargement des événements');
    } finally {
      setLoading(false);
    }
  }, [includeExpired]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const openCreate = () => {
    setEditingEvent(null);
    form.resetFields();
    form.setFieldsValue({ isActive: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingEvent(record);
    form.setFieldsValue({
      name: record.nom,
      description: record.description,
      badgeLabel: record.badge,
      bgColor: record.bg_color,
      textColor: record.text_color,
      dates:
        record.start_date && record.end_date
          ? [dayjs(record.start_date), dayjs(record.end_date)]
          : null,
      isActive: record.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteEvent(id);
      message.success('Événement supprimé');
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        name: values.name,
        description: values.description ?? '',
        badgeLabel: values.badgeLabel ?? '',
        bgColor: colorToHex(values.bgColor),
        textColor: colorToHex(values.textColor),
        startDate: values.dates?.[0]?.toISOString() ?? null,
        endDate: values.dates?.[1]?.toISOString() ?? null,
        isActive: values.isActive ?? true,
      };

      if (editingEvent) {
        const updated = await updateEvent(editingEvent.id, payload);
        setEvents((prev) =>
          prev.map((e) => (e.id === editingEvent.id ? { ...e, ...updated } : e))
        );
        message.success('Événement modifié');
      } else {
        const created = await createEvent(payload);
        setEvents((prev) => [...prev, created]);
        message.success('Événement créé');
      }
      setModalOpen(false);
    } catch {
      message.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleBannerUpload = async (file, eventId) => {
    setUploadingId(eventId);
    try {
      await uploadEventImage(eventId, file);
      message.success('Bannière mise à jour');
      fetchEvents();
    } catch {
      message.error("Erreur lors de l'upload de la bannière");
    } finally {
      setUploadingId(null);
    }
    return false; // empêche l'upload automatique d'antd
  };

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    {
      title: 'Nom / Badge',
      dataIndex: 'nom',
      render: (nom, record) => (
        <Space direction="vertical" size={4}>
          <Text strong>{nom}</Text>
          {record.badge && (
            <EventBadge
              label={record.badge}
              bgColor={record.bg_color}
              textColor={record.text_color}
            />
          )}
        </Space>
      ),
    },
    { title: 'Description', dataIndex: 'description', ellipsis: true },
    {
      title: 'Période',
      render: (_, r) => `${fmtDate(r.start_date)} → ${fmtDate(r.end_date)}`,
    },
    {
      title: 'Produits',
      dataIndex: 'nb_produits',
      render: (n) => (
        <Tag color="blue">
          {n ?? 0} produit{n !== 1 ? 's' : ''}
        </Tag>
      ),
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      render: (active) =>
        active ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Actif
          </Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />}>
            Inactif
          </Tag>
        ),
    },
    {
      title: 'Bannière',
      render: (_, record) =>
        record.bannerImage ? (
          <img
            src={record.bannerImage}
            alt="bannière"
            style={{ height: 36, borderRadius: 4, objectFit: 'cover' }}
          />
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            —
          </Text>
        ),
    },
    ...(canManage
      ? [
          {
            title: 'Actions',
            fixed: 'right',
            width: 160,
            render: (_, record) => (
              <Space>
                <Upload
                  showUploadList={false}
                  beforeUpload={(file) => handleBannerUpload(file, record.id)}
                  accept="image/*"
                >
                  <Tooltip title="Uploader bannière">
                    <Button
                      icon={<PictureOutlined />}
                      size="small"
                      loading={uploadingId === record.id}
                    />
                  </Tooltip>
                </Upload>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => openEdit(record)}
                />
                <Popconfirm
                  title="Supprimer cet événement ?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Oui"
                  cancelText="Non"
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Space>
          <Switch
            checked={includeExpired}
            onChange={setIncludeExpired}
            checkedChildren="Tous"
            unCheckedChildren="En cours"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {includeExpired ? 'Tous les événements' : 'Actifs et à venir'}
          </Text>
        </Space>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouvel événement
          </Button>
        )}
      </Flex>

      <Table
        columns={columns}
        dataSource={events}
        rowKey="id"
        loading={loading}
        scroll={{ x: 900 }}
        size="small"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingEvent ? "Modifier l'événement" : 'Créer un événement'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Enregistrer"
        cancelText="Annuler"
        width={560}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="name"
            label="Nom de l'événement"
            rules={[{ required: true, message: 'Requis' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Form.Item name="badgeLabel" label="Texte du badge">
            <Input placeholder="ex : BLACK FRIDAY" />
          </Form.Item>

          <Flex gap={24}>
            <Form.Item name="bgColor" label="Couleur fond" style={{ flex: 1 }}>
              <ColorPicker format="hex" showText />
            </Form.Item>
            <Form.Item
              name="textColor"
              label="Couleur texte"
              style={{ flex: 1 }}
            >
              <ColorPicker format="hex" showText />
            </Form.Item>
          </Flex>

          <Form.Item name="dates" label="Période (début → fin)">
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item
            name="isActive"
            label="Actif"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Section Remises ───────────────────────────────────────────────────────────
function RemisesTab({ canManage }) {
  const [discounts, setDiscounts] = useState([]);
  const [events, setEvents] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [form] = Form.useForm();

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [disc, evts, prods] = await Promise.all([
        getDiscounts({ activeOnly }),
        getAllEvents(true),
        getProduits(),
      ]);
      setDiscounts(disc);
      setEvents(evts);
      setProduits(prods);
    } catch {
      message.error('Erreur lors du chargement des remises');
    } finally {
      setLoading(false);
    }
  }, [activeOnly]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const productMap = useMemo(
    () => Object.fromEntries(produits.map((p) => [p.id, p.name])),
    [produits]
  );
  const eventMap = useMemo(
    () => Object.fromEntries(events.map((e) => [e.id, e])),
    [events]
  );

  const openCreate = () => {
    setEditingDiscount(null);
    form.resetFields();
    form.setFieldsValue({ discountType: 'Percentage', isActive: true });
    setModalOpen(true);
  };

  const openEdit = (record) => {
    setEditingDiscount(record);
    form.setFieldsValue({
      productId: record.productId,
      eventId: record.eventId ?? null,
      discountType: record.discountType,
      discountValue: record.discountValue,
      dates:
        record.startDate && record.endDate
          ? [dayjs(record.startDate), dayjs(record.endDate)]
          : null,
      isActive: record.isActive ?? true,
    });
    setModalOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteDiscount(id);
      message.success('Remise supprimée');
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    } catch {
      message.error('Erreur lors de la suppression');
    }
  };

  const handleSave = async (values) => {
    setSaving(true);
    try {
      const payload = {
        productId: values.productId,
        eventId: values.eventId ?? null,
        discountType: values.discountType,
        discountValue: values.discountValue,
        startDate: values.dates?.[0]?.toISOString() ?? null,
        endDate: values.dates?.[1]?.toISOString() ?? null,
        isActive: values.isActive ?? true,
      };

      if (editingDiscount) {
        const updated = await updateDiscount(editingDiscount.id, payload);
        setDiscounts((prev) =>
          prev.map((d) => (d.id === editingDiscount.id ? updated : d))
        );
        message.success('Remise modifiée');
      } else {
        const created = await createDiscount(payload);
        setDiscounts((prev) => [...prev, created]);
        message.success('Remise créée');
      }
      setModalOpen(false);
    } catch {
      message.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: 'Produit',
      dataIndex: 'productId',
      render: (id) => productMap[id] ?? `#${id}`,
    },
    {
      title: 'Type / Valeur',
      render: (_, r) => (
        <Tag color={r.discountType === 'Percentage' ? 'orange' : 'purple'}>
          {r.discountType === 'Percentage'
            ? `-${r.discountValue}%`
            : `-${r.discountValue?.toLocaleString()} XAF`}
        </Tag>
      ),
    },
    {
      title: 'Événement',
      dataIndex: 'eventId',
      render: (id) => {
        const ev = eventMap[id];
        return ev ? (
          <EventBadge
            label={ev.badge || ev.nom}
            bgColor={ev.bg_color}
            textColor={ev.text_color}
          />
        ) : (
          <Text type="secondary" style={{ fontSize: 12 }}>
            Standalone
          </Text>
        );
      },
    },
    {
      title: 'Période',
      render: (_, r) => `${fmtDate(r.startDate)} → ${fmtDate(r.endDate)}`,
    },
    {
      title: 'Actif',
      dataIndex: 'isActive',
      render: (active) =>
        active ? (
          <Tag color="green" icon={<CheckCircleOutlined />}>
            Actif
          </Tag>
        ) : (
          <Tag color="red" icon={<CloseCircleOutlined />}>
            Inactif
          </Tag>
        ),
    },
    ...(canManage
      ? [
          {
            title: 'Actions',
            fixed: 'right',
            width: 100,
            render: (_, record) => (
              <Space>
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  size="small"
                  onClick={() => openEdit(record)}
                />
                <Popconfirm
                  title="Supprimer cette remise ?"
                  onConfirm={() => handleDelete(record.id)}
                  okText="Oui"
                  cancelText="Non"
                  icon={<QuestionCircleOutlined style={{ color: 'red' }} />}
                >
                  <Button danger icon={<DeleteOutlined />} size="small" />
                </Popconfirm>
              </Space>
            ),
          },
        ]
      : []),
  ];

  return (
    <>
      <Flex justify="space-between" align="center" style={{ marginBottom: 16 }}>
        <Space>
          <Switch
            checked={activeOnly}
            onChange={setActiveOnly}
            checkedChildren="Actives"
            unCheckedChildren="Toutes"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {activeOnly ? 'Remises actives uniquement' : 'Toutes les remises'}
          </Text>
        </Space>
        {canManage && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            Nouvelle remise
          </Button>
        )}
      </Flex>

      <Table
        columns={columns}
        dataSource={discounts}
        rowKey="id"
        loading={loading}
        scroll={{ x: 800 }}
        size="small"
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={editingDiscount ? 'Modifier la remise' : 'Créer une remise'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={saving}
        okText="Enregistrer"
        cancelText="Annuler"
        width={520}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item
            name="productId"
            label="Produit"
            rules={[{ required: true, message: 'Sélectionner un produit' }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Choisir un produit"
              options={produits.map((p) => ({ value: p.id, label: p.name }))}
            />
          </Form.Item>

          <Form.Item name="eventId" label="Événement (optionnel)">
            <Select
              allowClear
              placeholder="Aucun — remise standalone"
              options={events.map((e) => ({
                value: e.id,
                label: e.nom || e.name,
              }))}
            />
          </Form.Item>

          <Flex gap={16}>
            <Form.Item
              name="discountType"
              label="Type"
              rules={[{ required: true }]}
              style={{ flex: 1 }}
            >
              <Select
                options={[
                  { value: 'Percentage', label: 'Pourcentage (%)' },
                  { value: 'Fixed', label: 'Montant fixe (XAF)' },
                ]}
              />
            </Form.Item>
            <Form.Item
              name="discountValue"
              label="Valeur"
              rules={[
                {
                  required: true,
                  type: 'number',
                  min: 0,
                  message: 'Valeur requise',
                },
              ]}
              style={{ flex: 1 }}
            >
              <InputNumber style={{ width: '100%' }} min={0} />
            </Form.Item>
          </Flex>

          <Form.Item name="dates" label="Période">
            <RangePicker
              showTime
              format="DD/MM/YYYY HH:mm"
              style={{ width: '100%' }}
            />
          </Form.Item>

          <Form.Item name="isActive" label="Actif" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export function Promotions() {
  const { canManagePromos } = usePermissions();

  const tabs = [
    {
      key: 'evenements',
      label: (
        <Space>
          <CalendarOutlined />
          Événements
        </Space>
      ),
      children: <EvenementsTab canManage={canManagePromos} />,
    },
    {
      key: 'remises',
      label: (
        <Space>
          <GiftOutlined />
          Remises
        </Space>
      ),
      children: <RemisesTab canManage={canManagePromos} />,
    },
  ];

  return (
    <Card>
      <Title level={2} style={{ marginBottom: 24 }}>
        <Space>
          <GiftOutlined />
          Promotions &amp; Événements
        </Space>
      </Title>
      <Tabs items={tabs} />
    </Card>
  );
}
