import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import inventoryService from '../services/inventoryService';
import {getCategories} from '../services/api.js';
import './CreateInventory.css';
import { message } from 'antd';

const CreateInventory = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    type: 0,
    categoryIds: [],
    userId: 'user_' + Date.now(), // A Remplacer par l'ID utilisateur réel si disponible
    notes: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      if (open) {
        Promise.all([getCategories()])
          .then(([categoriesData]) => {
            setCategories(categoriesData);
          })
          .catch(error => console.error("Erreur lors du chargement des données :", error));
      }
    }, [open]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const session = await inventoryService.createSession(formData);
      message.success(`Inventaire créé : ${session.reference}`);
      navigate(`/inventory/${session.id}/count`);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
      message.error('Erreur lors de la création de l\'inventaire');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => {
      const categoryIds = prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter(id => id !== categoryId)
        : [...prev.categoryIds, categoryId];
      return { ...prev, categoryIds };
    });
  };

  return (
    <div className="create-inventory-container">
      <div className="form-card">
        <h1>Nouvel inventaire</h1>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Type d'inventaire *</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: parseInt(e.target.value) })
              }
              required
            >
              <option value={0}>Complet - Tous les produits</option>
              <option value={1}>Tournant - Par rotation</option>
              <option value={2}>Ciblé - Produits spécifiques</option>
            </select>
          </div>

          <div className="form-group">
            <label>Catégories à inventorier</label>
            <div className="checkbox-group">
              {categories.length === 0 ? (
                <p className="text-muted">Aucune catégorie disponible</p>
              ) : (
                categories.map((category) => (
                  <label key={category.id} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryChange(category.id)}
                    />
                    <span>{category.title}</span>
                  </label>
                ))
              )}
            </div>
            <small className="form-text">
              Laissez vide pour inventorier tous les produits
            </small>
          </div>

          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows="4"
              placeholder="Ajoutez des notes sur cet inventaire..."
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate('/inventory')}
              className="btn btn-secondary"
              disabled={loading}
            >
              Annuler
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Création...' : 'Créer l\'inventaire'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateInventory;