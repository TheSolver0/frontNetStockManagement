import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import './InventoryCount.css';
import ConfirmModal from '../components/ConfirmModal.jsx';
import { message } from 'antd';

const InventoryCount = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [countedQuantity, setCountedQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modal, setModal] = useState({
    open: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    variant: 'danger',
    icon: null,
    onConfirm: () => {},
  });

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const data = await inventoryService.getSessionById(sessionId);
      setSession(data);

      // Trouver la première ligne non comptée
      const firstUncountedIndex = data.lines.findIndex(
        (line) => line.countedQuantity === null
      );
      setCurrentLineIndex(firstUncountedIndex >= 0 ? firstUncountedIndex : 0);
    } catch (error) {
      console.error('Erreur:', error);
      message.error('Erreur lors du chargement de la session');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (config) =>
    setModal((prev) => ({ ...prev, open: true, ...config }));

  const closeModal = () =>
    setModal((prev) => ({ ...prev, open: false }));

  const handleSubmitCount = async () => {
    if (!countedQuantity || countedQuantity === '') {
      message.error('Veuillez saisir une quantité');
      return;
    }

    const currentLine = session.lines[currentLineIndex];
    setSaving(true);

    try {
      await inventoryService.recordCount(currentLine.id, {
        countedQuantity: parseFloat(countedQuantity),
        userId: session.createdBy,
        notes: notes
      });

      // Recharger la session
      await loadSession();

      // Réinitialiser les champs
      setCountedQuantity('');
      setNotes('');

      // Passer à la ligne suivante
      const isLastLine = currentLineIndex === session.lines.length - 1;
      if (isLastLine) {
        openModal({
          icon: '✓',
          title: 'Tous les produits sont comptés',
          message:
            'Voulez-vous valider cet inventaire maintenant ? Les stocks seront ajustés définitivement.',
          confirmText: 'Valider l\'inventaire',
          variant: 'success',
          onConfirm: () => {
            closeModal();
            handleValidateSession();
          },
        });
      } else {
        setCurrentLineIndex((prev) => prev + 1);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleValidateSession = async () => {
    try {
      await inventoryService.validateSession(sessionId, session.createdBy);
      message.success('Inventaire validé avec succès !');
      navigate('/inventory');
    } catch (error) {
      console.error('Erreur:', error);
      message.error(error.response?.data?.message || 'Erreur lors de la validation');
    }
  };

  const openValidationModal = () => {
    openModal({
      icon: '',
      title: 'Valider l\'inventaire',
      message:
        'Cette action est irréversible. Les quantités en stock vont être ajustées selon les comptages effectués.',
      confirmText: 'Oui, valider',
      variant: 'warning',
      onConfirm: () => {
        closeModal();
        handleValidateSession();
      },
    });
  };

  const openQuitModal = () => {
    openModal({
      icon: '',
      title: 'Quitter l\'inventaire',
      message:
        'Vous pouvez reprendre cet inventaire plus tard. Vos comptages déjà enregistrés seront conservés.',
      confirmText: 'Quitter',
      variant: 'danger',
      onConfirm: () => {
        closeModal();
        navigate('/inventory');
      },
    });
  };

  const handleSkip = () => {
    if (currentLineIndex < session.lines.length - 1) {
      setCurrentLineIndex(currentLineIndex + 1);
      setCountedQuantity('');
      setNotes('');
    }
  };

  const handlePrevious = () => {
    if (currentLineIndex > 0) {
      setCurrentLineIndex(currentLineIndex - 1);
      setCountedQuantity('');
      setNotes('');
    }
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  if (!session || session.lines.length === 0) {
    return (
      <div className="empty-state">
        <p>Aucun produit à inventorier</p>
        <button onClick={() => navigate('/inventory')} className="btn btn-primary">
          Retour aux inventaires
        </button>
      </div>
    );
  }

  const currentLine = session.lines[currentLineIndex];
  const countedLines = session.lines.filter((l) => l.countedQuantity !== null).length;
  const progress = (countedLines / session.lines.length) * 100;

  return (
    <div className="inventory-count-container">
      <div className="count-header">
        <h1>Inventaire : {session.reference}</h1>
        <div className="progress-info">
          <span>
            {countedLines} / {session.lines.length} produits comptés
          </span>
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="count-card">
        <div className="product-info">
          <h2>{currentLine.productName}</h2>
          <div className="product-details">
            <div className="detail-item">
              <span className="label">SKU:</span>
              <span className="value">{currentLine.productSku}</span>
            </div>
            {currentLine.location && (
              <div className="detail-item">
                <span className="label">Emplacement:</span>
                <span className="value">{currentLine.location}</span>
              </div>
            )}
            <div className="detail-item">
              <span className="label">Quantité théorique:</span>
              <span className="value theoretical">{currentLine.theoreticalQuantity}</span>
            </div>
          </div>
        </div>

        <div className="count-form">
          <div className="form-group">
            <label>Quantité comptée *</label>
            <input
              type="number"
              value={countedQuantity}
              onChange={(e) => setCountedQuantity(e.target.value)}
              placeholder="Entrez la quantité"
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmitCount();
                }
              }}
            />
          </div>

          <div className="form-group">
            <label>Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Ajoutez une remarque si nécessaire..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handlePrevious}
              className="btn btn-secondary"
              disabled={currentLineIndex === 0}
            >
              ← Précédent
            </button>

            <button
              type="button"
              onClick={handleSkip}
              className="btn btn-secondary"
              disabled={currentLineIndex === session.lines.length - 1}
            >
              Passer →
            </button>

            <button
              type="button"
              onClick={handleSubmitCount}
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Valider'}
            </button>
          </div>
        </div>
      </div>

      <div className="session-actions">
        <button onClick={() => navigate('/inventory')} className="btn btn-secondary">
          Quitter
        </button>

        {countedLines === session.lines.length && (
          <button onClick={handleValidateSession} className="btn btn-success">
            ✓ Valider l'inventaire complet
          </button>
        )}
      </div>
       <ConfirmModal
        isOpen={modal.open}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        variant={modal.variant}
        icon={modal.icon}
      />
    </div>
  );
};

export default InventoryCount;