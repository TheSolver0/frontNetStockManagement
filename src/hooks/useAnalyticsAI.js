
import { useState } from 'react';
import axios from 'axios';

export const useAnalyticsAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);

    const analyzeStockData = async (chartData, chartData2, produits, commandes, mouvements) => {
        setLoading(true);
        setError(null);

        try {
            // Préparer les données pour l'analyse
            const analysisData = {
                produits_count: produits?.length || 0,
                commandes_count: commandes?.length || 0,
                commandes_livrees: commandes?.filter(c => c.status === 'LIVREE').length || 0,
                total_ventes: commandes
                    ?.filter(c => c.status === 'LIVREE')
                    .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0,
                top_produits: produits?.slice(0, 5).map(p => ({
                    nom: p.name,
                    stock: p.quantity,
                    seuil: p.threshold,
                    statut: p.quantity <= p.threshold ? 'CRITIQUE' : 'NORMAL'
                })) || [],
                mouvements_recent: mouvements?.slice(0, 5).map(m => ({
                    type: m.type,
                    quantite: m.quantity,
                    montant: m.amount
                })) || []
            };

            // Utiliser Google Gemini API (gratuite)
            const result = await callGeminiAPI(analysisData);
            setAnalysis(result);
            return result;

        } catch (err) {
            const errorMsg = 'Erreur lors de l\'analyse: ' + (err.message || 'Erreur inconnue');
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    const callGeminiAPI = async (data) => {
        // API simple et gratuite - Text Generation API
        const prompt = `
En tant qu'expert en analyse de données de stock, analyse ces données en français:

**Données du stock:**
- Nombre de produits: ${data.produits_count}
- Commandes totales: ${data.commandes_count}
- Commandes livrées: ${data.commandes_livrees} 
- Chiffre d'affaires: ${data.total_ventes.toLocaleString()} XAF
- Produits principaux: ${data.top_produits.map(p => `${p.nom} (stock: ${p.stock}, seuil: ${p.threshold})`).join(', ')}

**Donne une analyse structurée avec:**
1. **Points clés** - Les éléments les plus importants
2. **Recommandations** - 3 conseils actionnables
3. **Risques identifiés** - Points de vigilance
4. **Prévisions** - Tendances anticipées

Sois concis et professionnel.
`;

        try {
            // Essayer l'API Google Gemini (gratuite)
            const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || 'AIzaSyC1fzFql7uaukiVG7-sxTbPKaH2Tf6';
            const response = await axios.post(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${API_KEY}`,
                {
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }]
                },
                {
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    timeout: 30000
                }
            );

            return response.data.candidates[0].content.parts[0].text || "Analyse générée avec succès.";

        } catch (geminiError) {
            console.log('Gemini API failed, using fallback...');
            // return generateFallbackAnalysis(data);
        }
    };

    const generateFallbackAnalysis = (data) => {
        // Analyse de fallback professionnelle
        const produitsCritiques = data.top_produits.filter(p => p.statut === 'CRITIQUE');
        const tauxLivraison = data.commandes_count > 0 ? (data.commandes_livrees / data.commandes_count * 100).toFixed(1) : 0;

        return `
🤖 **ANALYSE AUTOMATISÉE DU STOCK**

📊 **VUE D'ENSEMBLE**
• 📦 Produits en catalogue: ${data.produits_count}
• 📋 Commandes traitées: ${data.commandes_count}
• ✅ Taux de livraison: ${tauxLivraison}%
• 💰 Chiffre d'affaires: ${data.total_ventes.toLocaleString()} XAF

🎯 **POINTS CLÉS**
${produitsCritiques.length > 0 ? 
    `• ⚠️ ${produitsCritiques.length} produit(s) en stock critique` : 
    '• ✅ Niveaux de stock globalement stables'
}
• 📈 ${data.commandes_livrees} commandes honorées avec succès
• 🔄 Activité commerciale: ${data.mouvements_recent.length} mouvements récents

💡 **RECOMMANDATIONS**
1. ${produitsCritiques.length > 0 ? 
    `Réapprovisionner "${produitsCritiques[0].nom}" en priorité` : 
    'Maintenir les niveaux de stock actuels'
}
2. Analyser la performance des 3 produits principaux
3. Automatiser les alertes de stock critique

⚠️ **RISQUES IDENTIFIÉS**
${produitsCritiques.length > 0 ? 
    `• Rupture de stock possible pour ${produitsCritiques.length} produit(s)` : 
    '• Aucun risque immédiat détecté'
}
• Dépendance aux produits principaux

📈 **PRÉVISIONS**
• Tendances stables basées sur l'activité actuelle
• Recommandation: Surveiller les stocks hebdomadaires
• Optimisation possible de la gestion des commandes

*Analyse générée automatiquement le ${new Date().toLocaleDateString('fr-FR')}*
        `.trim();
    };

    return { analyzeStockData, loading, error, analysis };
};
