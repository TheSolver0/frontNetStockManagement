// components/AnalyticsPanel.jsx
import React, { useState } from 'react';
import { useAnalyticsAI } from '../hooks/useAnalyticsAI';
// import './AnalyticsPanel.css';

const AnalyticsPanel = ({ transactions, products }) => {
    const [analysisType, setAnalysisType] = useState('profit');
    const { analyzeStock, loading, error, analysis } = useAnalyticsAI();

    const handleAnalyze = async () => {
        const stockData = {
            transactions: transactions.slice(0, 10), // Limiter pour économiser des tokens
            products: products,
            analysis_type: analysisType,
            timestamp: new Date().toISOString()
        };

        await analyzeStock(stockData);
    };

    const analysisPrompts = {
        profit: "Analyse la rentabilité de mon stock et donne 3 conseils pour améliorer les gains",
        prediction: "Prédis les ventes des 15 prochains jours basé sur l'historique",
        optimization: "Identifie les produits surstockés et sous-stockés avec recommandations",
        alerts: "Détecte les anomalies et risques dans mon gestion de stock"
    };

    return (
        <div className="analytics-panel">
            <h3>🤖 Assistant Analyse Stock</h3>
            
            <div className="analysis-controls">
                <select 
                    value={analysisType} 
                    onChange={(e) => setAnalysisType(e.target.value)}
                    className="analysis-select"
                >
                    <option value="profit">💰 Analyse Rentabilité</option>
                    <option value="prediction">📈 Prévisions Vente</option>
                    <option value="optimization">⚡ Optimisation Stock</option>
                    <option value="alerts">🚨 Alertes & Risques</option>
                </select>
                
                <button 
                    onClick={handleAnalyze} 
                    disabled={loading}
                    className="analyze-btn"
                >
                    {loading ? 'Analyse en cours...' : 'Lancer l\'analyse'}
                </button>
            </div>

            {error && (
                <div className="error-message">
                    ❌ {error}
                </div>
            )}

            {analysis && (
                <div className="analysis-results">
                    <h4>📊 Résultats de l'analyse :</h4>
                    <div className="analysis-content">
                        {analysis.split('\n').map((line, index) => (
                            <p key={index}>{line}</p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsPanel;