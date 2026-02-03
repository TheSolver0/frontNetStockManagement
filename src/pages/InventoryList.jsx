import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import inventoryService from "../services/inventoryService";
import "./InventoryList.css";
import { message } from "antd";
import PDFService from "../services/pdfService.js";

const InventoryList = () => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await inventoryService.getAllSessions();
      setSessions(data);
    } catch (error) {
      console.error("Erreur lors du chargement des sessions:", error);
      message.error("Erreur lors du chargement des inventaires");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "InProgress":
        return <span className="badge badge-warning">En cours</span>;
      case "Validated":
        return <span className="badge badge-success">Validé</span>;
      case "Cancelled":
        return <span className="badge badge-danger">Annulé</span>;
      default:
        return <span className="badge badge-secondary">Inconnu</span>;
    }
  };

  const getTypeName = (type) => {
    switch (type) {
      case "Full":
        return "Complet";
      case "Cyclic":
        return "Tournant";
      case "Spot":
        return "Ciblé";
      default:
        return "Inconnu";
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return <div className="loading">Chargement...</div>;
  }

  return (
    <div className="inventory-list-container">
      <div className="page-header">
        <h1>Inventaires</h1>
        
        <div style={{ display: "flex", gap: "10px" }}>
        <Link to="/inventory/new" className="btn btn-primary">
          + Nouvel inventaire
        </Link>
          {sessions.length > 0 && (
            <button
              onClick={() => PDFService.exportAllInventories(sessions)}
              style={{
                padding: "10px 20px",
                border: "none",
                borderRadius: "6px",
                background: "#f45060",
                color: "white",
                cursor: "pointer",
                fontSize: "0.95rem",
              }}
            >
              Exporter tous les PDF
            </button>
          )}

        </div>
      </div>

      <div className="sessions-grid">
        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>Aucun inventaire trouvé</p>
            <Link to="/inventory/new" className="btn btn-primary">
              Créer le premier inventaire
            </Link>
          </div>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="session-card">
              <div className="session-header">
                <h3>{session.reference}</h3>
                {getStatusBadge(session.status)}
              </div>

              <div className="session-details">
                <div className="detail-row">
                  <span className="label">Type:</span>
                  <span className="value">{getTypeName(session.type)}</span>
                </div>

                <div className="detail-row">
                  <span className="label">Créé le:</span>
                  <span className="value">
                    {formatDate(session.createdDate)}
                  </span>
                </div>

                <div className="detail-row">
                  <span className="label">Créé par:</span>
                  <span className="value">{session.createdBy}</span>
                </div>

                {session.validatedDate && (
                  <div className="detail-row">
                    <span className="label">Validé le:</span>
                    <span className="value">
                      {formatDate(session.validatedDate)}
                    </span>
                  </div>
                )}

                <div className="detail-row">
                  <span className="label">Lignes:</span>
                  <span className="value">
                    {session.lines?.length || 0} produits
                  </span>
                </div>

                {session.notes && (
                  <div className="detail-row">
                    <span className="label">Notes:</span>
                    <span className="value">{session.notes}</span>
                  </div>
                )}
              </div>

              <div className="session-actions">
                {session.status === 0 ? (
                  <Link
                    to={`/inventory/${session.id}/count`}
                    className="btn btn-primary btn-sm"
                  >
                    Continuer le comptage
                  </Link>
                ) : (
                  <Link
                    to={`/inventory/${session.id}/details`}
                    className="btn btn-secondary btn-sm"
                  >
                    Voir les détails
                  </Link>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default InventoryList;
