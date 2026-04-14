import React, { useState, useRef } from 'react';
import {
  Button, Popconfirm, Spin, Tag, Tooltip, message, Typography,
  Divider, Badge,
} from 'antd';
import {
  StarFilled, StarOutlined, DeleteOutlined,
  PlusOutlined, InboxOutlined,
} from '@ant-design/icons';
import axiosInstance from '../services/axiosInstance';
import { API_URL } from '../services/api';

// ─── Styles internes ──────────────────────────────────────────────────────────

const gridStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: 12,
  marginBottom: 16,
};

const imgWrapStyle = (isMain) => ({
  position: 'relative',
  borderRadius: 8,
  overflow: 'hidden',
  border: isMain ? '2px solid #1677ff' : '2px solid #e5e7eb',
  cursor: 'pointer',
  background: '#f5f5f5',
});

const imgStyle = {
  width: '100%',
  height: 110,
  objectFit: 'cover',
  display: 'block',
};

const overlayStyle = {
  position: 'absolute',
  bottom: 0,
  left: 0,
  right: 0,
  background: 'rgba(0,0,0,0.45)',
  display: 'flex',
  justifyContent: 'center',
  gap: 6,
  padding: '4px 2px',
};

// ─── Placeholder "aucune image" ───────────────────────────────────────────────

const EmptyPlaceholder = () => (
  <div style={{
    height: 110, borderRadius: 8, border: '1px dashed #d9d9d9',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    color: '#bfbfbf', fontSize: 13, gap: 4,
  }}>
    <InboxOutlined style={{ fontSize: 28 }} />
    <span>Aucune image</span>
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MODE CRÉATION  — gestion de la liste de fichiers locaux avant soumission
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{ onFilesChange: (files: File[]) => void }} props
 */
export function ProductImageUploadCreate({ onFilesChange }) {
  const [previews, setPreviews] = useState([]); // [{ file, previewUrl }]
  const inputRef = useRef(null);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const invalid = selected.filter(
      (f) => f.size > 5 * 1024 * 1024 || !f.type.match(/image\/(jpeg|png|webp)/),
    );
    if (invalid.length) {
      message.error('Formats acceptés : jpg, png, webp — max 5 MB par image.');
      return;
    }

    const newPreviews = selected.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
    // Reset input so the same file can be re-sélectionné
    e.target.value = '';
  };

  const handleRemove = (index) => {
    URL.revokeObjectURL(previews[index].previewUrl);
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onFilesChange(updated.map((p) => p.file));
  };

  return (
    <div>
      <div style={gridStyle}>
        {previews.length === 0 && <EmptyPlaceholder />}

        {previews.map((p, i) => (
          <div key={p.previewUrl} style={imgWrapStyle(i === 0)}>
            <img src={p.previewUrl} alt={`preview-${i}`} style={imgStyle} />
            {i === 0 && (
              <Tag
                color="blue"
                style={{
                  position: 'absolute', top: 4, left: 4,
                  margin: 0, fontSize: 10, lineHeight: '16px',
                }}
              >
                Principale
              </Tag>
            )}
            <div style={overlayStyle}>
              <Tooltip title="Retirer">
                <Button
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  style={{ border: 'none', background: 'transparent', color: '#fff' }}
                />
              </Tooltip>
            </div>
          </div>
        ))}

        {/* Bouton ajouter */}
        <div
          onClick={() => inputRef.current?.click()}
          style={{
            height: 110, borderRadius: 8, border: '1px dashed #1677ff',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: '#1677ff', gap: 4,
          }}
        >
          <PlusOutlined style={{ fontSize: 22 }} />
          <span style={{ fontSize: 12 }}>Ajouter</span>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleFiles}
      />

      {previews.length > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {previews.length} image(s) sélectionnée(s) — la 1ère sera l'image principale.
        </Typography.Text>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MODE ÉDITION  — affiche les images existantes + ajout d'images supplémentaires
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {{
 *   productId: number,
 *   initialImages: Array<{id: number, url: string, isMain: boolean, order: number}>,
 *   canDelete: boolean,
 * }} props
 */
export function ProductImageUploadEdit({ productId, initialImages = [], canDelete }) {
  const [images, setImages] = useState(initialImages);
  const [loadingId, setLoadingId] = useState(null); // id de l'image en cours d'action
  const [addLoading, setAddLoading] = useState(false);
  const inputRef = useRef(null);

  // ── Définir comme principale ──────────────────────────────────────────────
  const handleSetMain = async (imgId) => {
    setLoadingId(imgId);
    try {
      await axiosInstance.patch(`${API_URL}Products/${productId}/images/${imgId}/main`);
      setImages((prev) =>
        prev.map((img) => ({ ...img, isMain: img.id === imgId })),
      );
      message.success('Image principale mise à jour.');
    } catch {
      message.error("Impossible de changer l'image principale.");
    } finally {
      setLoadingId(null);
    }
  };

  // ── Supprimer une image ───────────────────────────────────────────────────
  const handleDelete = async (imgId) => {
    setLoadingId(imgId);
    try {
      await axiosInstance.delete(`${API_URL}Products/${productId}/images/${imgId}`);
      setImages((prev) => prev.filter((img) => img.id !== imgId));
      message.success('Image supprimée.');
    } catch {
      message.error('Impossible de supprimer cette image.');
    } finally {
      setLoadingId(null);
    }
  };

  // ── Ajouter de nouvelles images (sans écraser les existantes) ─────────────
  const handleAddFiles = async (e) => {
    const selected = Array.from(e.target.files ?? []);
    if (!selected.length) return;

    const invalid = selected.filter(
      (f) => f.size > 5 * 1024 * 1024 || !f.type.match(/image\/(jpeg|png|webp)/),
    );
    if (invalid.length) {
      message.error('Formats acceptés : jpg, png, webp — max 5 MB par image.');
      e.target.value = '';
      return;
    }

    setAddLoading(true);
    try {
      const fd = new FormData();
      selected.forEach((file) => fd.append('images', file));

      const response = await axiosInstance.post(
        `${API_URL}Products/${productId}/images`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } },
      );

      // La réponse retourne le produit mis à jour → on recharge images
      const updatedImages = response.data?.images ?? [];
      setImages(updatedImages);
      message.success(`${selected.length} image(s) ajoutée(s) avec succès.`);
    } catch {
      message.error("Erreur lors de l'ajout des images.");
    } finally {
      setAddLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      {/* ── Galerie des images existantes ── */}
      <div style={gridStyle}>
        {images.length === 0 && <EmptyPlaceholder />}

        {images
          .slice()
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
          .map((img) => (
            <Spin key={img.id} spinning={loadingId === img.id}>
              <div style={imgWrapStyle(img.isMain)}>
                <img src={img.url} alt={`img-${img.id}`} style={imgStyle} />

                {img.isMain && (
                  <Tag
                    color="blue"
                    style={{
                      position: 'absolute', top: 4, left: 4,
                      margin: 0, fontSize: 10, lineHeight: '16px',
                    }}
                  >
                    Principale
                  </Tag>
                )}

                <div style={overlayStyle}>
                  {/* Étoile — définir comme principale */}
                  {!img.isMain && (
                    <Tooltip title="Définir comme principale">
                      <Button
                        size="small"
                        icon={<StarOutlined />}
                        onClick={() => handleSetMain(img.id)}
                        style={{ border: 'none', background: 'transparent', color: '#fadb14' }}
                      />
                    </Tooltip>
                  )}
                  {img.isMain && (
                    <Tooltip title="Image principale">
                      <StarFilled style={{ color: '#fadb14', fontSize: 16, alignSelf: 'center' }} />
                    </Tooltip>
                  )}

                  {/* Supprimer — Admin et Gérant seulement */}
                  {canDelete && (
                    <Popconfirm
                      title="Supprimer cette image ?"
                      onConfirm={() => handleDelete(img.id)}
                      okText="Oui"
                      cancelText="Non"
                    >
                      <Tooltip title="Supprimer">
                        <Button
                          size="small"
                          danger
                          icon={<DeleteOutlined />}
                          style={{ border: 'none', background: 'transparent', color: '#ff4d4f' }}
                        />
                      </Tooltip>
                    </Popconfirm>
                  )}
                </div>
              </div>
            </Spin>
          ))}
      </div>

      {/* ── Ajouter de nouvelles images ── */}
      <Divider orientation="left" plain style={{ fontSize: 13 }}>
        Ajouter des images
      </Divider>

      <Spin spinning={addLoading}>
        <div
          onClick={() => !addLoading && inputRef.current?.click()}
          style={{
            height: 80, borderRadius: 8, border: '1px dashed #1677ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: addLoading ? 'not-allowed' : 'pointer',
            color: '#1677ff', gap: 8,
          }}
        >
          <PlusOutlined />
          <span style={{ fontSize: 13 }}>Cliquer pour ajouter des images</span>
        </div>
      </Spin>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        style={{ display: 'none' }}
        onChange={handleAddFiles}
      />

      <Typography.Text type="secondary" style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
        Les images sont ajoutées sans supprimer les existantes. Formats : jpg, png, webp — max 5 MB.
      </Typography.Text>
    </div>
  );
}

// ─── Galerie lecture seule (liste / fiche produit) ────────────────────────────

/**
 * Affiche un carousel simple ou une image unique selon la quantité d'images.
 */
export function ProductGallery({ images = [], imageUrl, name }) {
  const [current, setCurrent] = useState(0);

  // Compatibilité legacy : si pas de tableau images mais imageUrl présent
  const list = images?.length > 0 ? images : (imageUrl ? [{ url: imageUrl, isMain: true, id: 0 }] : []);

  if (list.length === 0) {
    return (
      <div style={{
        width: '100%', maxWidth: 320, height: 220,
        borderRadius: 8, border: '1px dashed #d9d9d9',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        color: '#bfbfbf', fontSize: 13, gap: 4,
      }}>
        <InboxOutlined style={{ fontSize: 36 }} />
        <span>Aucune image</span>
      </div>
    );
  }

  if (list.length === 1) {
    return (
      <img
        src={list[0].url}
        alt={name}
        style={{ maxWidth: 320, maxHeight: 220, objectFit: 'cover', borderRadius: 8 }}
      />
    );
  }

  // Mini-carousel
  const mainImg = list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[current];
  return (
    <div style={{ maxWidth: 320 }}>
      <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
        <img
          src={mainImg.url}
          alt={name}
          style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
        />
        {mainImg.isMain && (
          <Tag color="blue" style={{ position: 'absolute', top: 8, left: 8, margin: 0 }}>
            Principale
          </Tag>
        )}
        <div style={{ position: 'absolute', bottom: 8, right: 8, color: '#fff', fontSize: 12,
          background: 'rgba(0,0,0,0.5)', borderRadius: 4, padding: '2px 8px' }}>
          {current + 1} / {list.length}
        </div>
      </div>

      {/* Miniatures */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
        {list.map((img, i) => (
          <img
            key={img.id ?? i}
            src={img.url}
            alt={`thumb-${i}`}
            onClick={() => setCurrent(i)}
            style={{
              width: 52, height: 52, objectFit: 'cover', borderRadius: 4, cursor: 'pointer',
              border: i === current ? '2px solid #1677ff' : '2px solid transparent',
            }}
          />
        ))}
      </div>
    </div>
  );
}
