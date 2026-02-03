import React, { useEffect, useRef } from 'react';
import './ConfirmModal.css';

/**
 * Modal de confirmation réutilisable
 *
 * Props :
 *   isOpen       – booléen pour afficher/cacher
 *   onClose      – callback quand on annule ou ferme
 *   onConfirm    – callback quand on confirme
 *   title        – titre du modal
 *   message      – texte descriptif
 *   confirmText  – texte du bouton confirmer (défaut : "Confirmer")
 *   cancelText   – texte du bouton annuler  (défaut : "Annuler")
 *   variant      – "danger" | "warning" | "success" (défaut : "danger")
 *   icon         – emoji ou caractère affiché en haut (optionnel)
 */
const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirmation',
  message = 'Êtes-vous sûr de vouloir effectuer cette action ?',
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  variant = 'danger',
  icon = null,
}) => {
  const confirmBtnRef = useRef(null);

  // Focus automatique sur le bouton confirmer quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && confirmBtnRef.current) {
      confirmBtnRef.current.focus();
    }
  }, [isOpen]);

  // Fermer le modal avec la touche Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className={`modal-card modal-card--${variant}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Barre de couleur en haut */}
        <div className="modal-card__bar" />

        {/* Icône */}
        {icon && (
          <div className={`modal-icon modal-icon--${variant}`}>
            <span>{icon}</span>
          </div>
        )}

        {/* Contenu textuel */}
        <div className="modal-content">
          <h2 className="modal-title">{title}</h2>
          <p className="modal-message">{message}</p>
        </div>

        {/* Boutons */}
        <div className="modal-actions">
          <button className="modal-btn modal-btn--cancel" onClick={onClose}>
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            className={`modal-btn modal-btn--confirm modal-btn--${variant}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;