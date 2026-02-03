import React, { useState, useEffect, use } from "react";
import { useParams, useNavigate } from "react-router-dom";
import inventoryService from "../services/inventoryService";
import { message } from "antd";
import PDFService from "../services/pdfService.js"

const InventoryDetails = () => {
    const params = useParams();
    const id = params.sessionId;
    const navigate = useNavigate();
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadSession();
    }, [id]);

    console.log("Session", session);

    const loadSession = async () => {
        try {
            const data = await inventoryService.getSessionById(id);
            setSession(data);
        } catch (error) {
            console.error("Erreur:", error);
            message.error("Session non trouvée");
            navigate("/inventory");
        } finally {
            setLoading(false);
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case "InProgress":
                return { label: "En cours", color: "#856404", bg: "#fff3cd" };
            case "Validated":
                return { label: "Validé", color: "#155724", bg: "#d4edda" };
            case "Cancelled":
                return { label: "Annulé", color: "#721c24", bg: "#f8d7da" };
            default:
                return { label: "Inconnu", color: "#666", bg: "#eee" };
        }
    };

    const formatDate = (date) => {
        if (!date) return "—";
        return new Date(date).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    if (loading)
        return (
            <div style={{ textAlign: "center", padding: "60px" }}>Chargement...</div>
        );
    if (!session) return null;

    const status = getStatusText(session.status);
    console.log("Status de la session :", status);
    const lines = session.lines || [];
    const countedLines = lines.filter((l) => l.countedQuantity !== null);
    const positiveVariances = lines.filter((l) => l.variance > 0);
    const negativeVariances = lines.filter((l) => l.variance < 0);
    const totalVariance = lines.reduce((acc, l) => acc + (l.variance || 0), 0);

    return (
        <div style={{ padding: "20px", maxWidth: "950px", margin: "0 auto" }}>
            {/* Header */}
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "24px",
                }}
            >
                <div>
                    <h1 style={{ margin: 0, color: "#333" }}>{session.reference}</h1>
                    <span
                        style={{
                            display: "inline-block",
                            marginTop: "8px",
                            padding: "4px 14px",
                            borderRadius: "12px",
                            fontSize: "0.85rem",
                            fontWeight: 500,
                            color: status.color,
                            backgroundColor: status.bg,
                        }}
                    >
                        {status.label}
                    </span>
                </div>
                <button
                    onClick={() => navigate("/inventory")}
                    style={{
                        padding: "10px 20px",
                        border: "1px solid #ccc",
                        borderRadius: "6px",
                        background: "white",
                        cursor: "pointer",
                        fontSize: "0.95rem",
                    }}
                >
                    ← Retour
                </button>
                    

                    <button
                        onClick={() => PDFService.exportSingleInventory(session)}
                        style={{
                            padding: "10px 20px",
                            border: "none",
                            borderRadius: "6px",
                            background: "#fb5363",
                            color: "white",
                            cursor: "pointer",
                            fontSize: "0.95rem",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                    >
                        Télécharger PDF
                    </button>
                
            </div>

            {/* Cartes résumé */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                {[
                    { label: "Produits", value: lines.length, color: "#007bff" },
                    { label: "Comptés", value: countedLines.length, color: "#28a745" },
                    {
                        label: "Écarts +",
                        value: positiveVariances.length,
                        color: "#28a745",
                    },
                    {
                        label: "Écarts −",
                        value: negativeVariances.length,
                        color: "#dc3545",
                    },
                    {
                        label: "Variance totale",
                        value: totalVariance,
                        color: totalVariance >= 0 ? "#28a745" : "#dc3545",
                    },
                ].map((card, i) => (
                    <div
                        key={i}
                        style={{
                            background: "white",
                            borderRadius: "8px",
                            padding: "18px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                fontSize: "1.8rem",
                                fontWeight: "bold",
                                color: card.color,
                            }}
                        >
                            {card.value}
                        </div>
                        <div
                            style={{ fontSize: "0.85rem", color: "#666", marginTop: "4px" }}
                        >
                            {card.label}
                        </div>
                    </div>
                ))}
            </div>

            {/* Infos session */}
            <div
                style={{
                    background: "white",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    marginBottom: "24px",
                }}
            >
                <h3 style={{ margin: "0 0 16px", color: "#333" }}>Informations</h3>
                <div
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "12px",
                    }}
                >
                    {[
                        {
                            label: "Type",
                            value:
                                session.type === 0
                                    ? "Complet"
                                    : session.type === 1
                                        ? "Tournant"
                                        : "Ciblé",
                        },
                        { label: "Créé par", value: session.createdBy },
                        {
                            label: "Date de création",
                            value: formatDate(session.createdDate),
                        },
                        { label: "Validé par", value: session.validatedBy || "—" },
                        {
                            label: "Date de validation",
                            value: formatDate(session.validatedDate),
                        },
                        { label: "Notes", value: session.notes || "—" },
                    ].map((item, i) => (
                        <div
                            key={i}
                            style={{
                                display: "flex",
                                justifyContent: "space-between",
                                padding: "10px",
                                background: "#f8f9fa",
                                borderRadius: "6px",
                            }}
                        >
                            <span style={{ fontWeight: 500, color: "#666" }}>
                                {item.label}
                            </span>
                            <span style={{ color: "#333" }}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Tableau des lignes */}
            <div
                style={{
                    background: "white",
                    borderRadius: "8px",
                    padding: "20px",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                }}
            >
                <h3 style={{ margin: "0 0 16px", color: "#333" }}>
                    Détails des lignes
                </h3>
                <div style={{ overflowX: "auto" }}>
                    <table
                        style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            fontSize: "0.95rem",
                        }}
                    >
                        <thead>
                            <tr style={{ background: "#f8f9fa" }}>
                                {[
                                    "SKU",
                                    "Produit",
                                    "Emplacement",
                                    "Théorique",
                                    "Compté",
                                    "Variance",
                                    "Compté par",
                                ].map((head) => (
                                    <th
                                        key={head}
                                        style={{
                                            padding: "12px",
                                            textAlign: "left",
                                            borderBottom: "2px solid #dee2e6",
                                            color: "#495057",
                                            fontWeight: 600,
                                        }}
                                    >
                                        {head}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line, i) => {
                                const variance = line.variance || 0;
                                const variantColor =
                                    variance > 0 ? "#28a745" : variance < 0 ? "#dc3545" : "#333";
                                return (
                                    <tr
                                        key={line.id || i}
                                        style={{ borderBottom: "1px solid #eee" }}
                                    >
                                        <td
                                            style={{
                                                padding: "12px",
                                                color: "#666",
                                                fontFamily: "monospace",
                                            }}
                                        >
                                            {line.productSku}
                                        </td>
                                        <td style={{ padding: "12px", fontWeight: 500 }}>
                                            {line.productName}
                                        </td>
                                        <td style={{ padding: "12px", color: "#666" }}>
                                            {line.location || "—"}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            {line.theoreticalQuantity}
                                        </td>
                                        <td style={{ padding: "12px", textAlign: "center" }}>
                                            {line.countedQuantity !== null ? (
                                                line.countedQuantity
                                            ) : (
                                                <span style={{ color: "#999", fontStyle: "italic" }}>
                                                    Non compté
                                                </span>
                                            )}
                                        </td>
                                        <td
                                            style={{
                                                padding: "12px",
                                                textAlign: "center",
                                                fontWeight: "bold",
                                                color: variantColor,
                                            }}
                                        >
                                            {variance > 0 ? `+${variance}` : variance}
                                        </td>
                                        <td style={{ padding: "12px", color: "#666" }}>
                                            {line.countedBy || "—"}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Si en cours, bouton pour reprendre le comptage */}
            {session.status === 0 && (
                <div style={{ marginTop: "24px", textAlign: "center" }}>
                    <button
                        onClick={() => navigate(`/inventory/${session.id}/count`)}
                        style={{
                            padding: "12px 32px",
                            background: "#007bff",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "1rem",
                            cursor: "pointer",
                        }}
                    >
                        Reprendre le comptage
                    </button>
                </div>
            )}
        </div>
    );
};

export default InventoryDetails;
