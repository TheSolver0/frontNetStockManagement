import { useState } from 'react';

export const useAnalyticsAI = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);

    const analyzeStockData = async (chartData, chartData2, produits, commandes, mouvements) => {
        setLoading(true);
        setError(null);

        try {
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

            const result = await callOpenRouterAPI(analysisData);
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

    const callOpenRouterAPI = async (data) => {
        const prompt = `
En tant qu'expert en analyse de données de stock, analyse ces données en français:

**Données du stock:**
- Nombre de produits: ${data.produits_count}
- Commandes totales: ${data.commandes_count}
- Commandes livrées: ${data.commandes_livrees}
- Chiffre d'affaires: ${data.total_ventes.toLocaleString()} XAF
- Produits principaux: ${data.top_produits.map(p => `${p.nom} (stock: ${p.stock}, seuil: ${p.seuil})`).join(', ')}

**Donne une analyse structurée avec:**
1. **Points clés** - Les éléments les plus importants
2. **Recommandations** - 3 conseils actionnables
3. **Risques identifiés** - Points de vigilance
4. **Prévisions** - Tendances anticipées

Sois concis et professionnel.
`;

        // Modèles gratuits OpenRouter, tentés dans l'ordre
        const MODELS = [
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
    "microsoft/phi-3-mini-128k-instruct:free"
];

        const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

        for (const model of MODELS) {
            try {
                console.log(`Tentative avec le modèle: ${model}`);

                const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": window.location.origin,
                        "X-Title": "Stock Analytics"
                    },
                    body: JSON.stringify({
                        model,
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 1000,
                        temperature: 0.7
                    })
                });

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    console.warn(`Modèle ${model} indisponible:`, errData?.error?.message || response.status);
                    continue; // Essayer le modèle suivant
                }

                const result = await response.json();
                const content = result.choices?.[0]?.message?.content;

                if (content) {
                    console.log(`✅ Succès avec: ${model}`);
                    return content;
                }

            } catch (err) {
    console.warn("Erreur OpenRouter globale, fallback forcé:", err.message);

    const fallback = generateFallbackAnalysis({
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
    });

    setAnalysis(fallback);
    setError("Analyse IA indisponible → fallback utilisé");

    return fallback; // ✅ IMPORTANT
}
        }

        // Tous les modèles ont échoué → fallback local
        console.warn("Tous les modèles OpenRouter ont échoué, utilisation du fallback.");
        return generateFallbackAnalysis(data);
    };

    const generateFallbackAnalysis = (data) => {
        const produitsCritiques = data.top_produits.filter(p => p.statut === 'CRITIQUE');
        const tauxLivraison = data.commandes_count > 0
            ? (data.commandes_livrees / data.commandes_count * 100).toFixed(1)
            : 0;

        return `
🤖 **ANALYSE AUTOMATISÉE DU STOCK**

📊 **VUE D'ENSEMBLE**
- 📦 Produits en catalogue: ${data.produits_count}
- 📋 Commandes traitées: ${data.commandes_count}
- ✅ Taux de livraison: ${tauxLivraison}%
- 💰 Chiffre d'affaires: ${data.total_ventes.toLocaleString()} XAF

🎯 **POINTS CLÉS**
${produitsCritiques.length > 0
    ? `• ⚠️ ${produitsCritiques.length} produit(s) en stock critique`
    : '• ✅ Niveaux de stock globalement stables'
}
- 📈 ${data.commandes_livrees} commandes honorées avec succès
- 🔄 Activité commerciale: ${data.mouvements_recent.length} mouvements récents

💡 **RECOMMANDATIONS**
1. ${produitsCritiques.length > 0
    ? `Réapprovisionner "${produitsCritiques[0].nom}" en priorité`
    : 'Maintenir les niveaux de stock actuels'
}
2. Analyser la performance des 3 produits principaux
3. Automatiser les alertes de stock critique

⚠️ **RISQUES IDENTIFIÉS**
${produitsCritiques.length > 0
    ? `• Rupture de stock possible pour ${produitsCritiques.length} produit(s)`
    : '• Aucun risque immédiat détecté'
}
- Dépendance aux produits principaux

📈 **PRÉVISIONS**
- Tendances stables basées sur l'activité actuelle
- Recommandation: Surveiller les stocks hebdomadaires
- Optimisation possible de la gestion des commandes

*Analyse générée automatiquement le ${new Date().toLocaleDateString('fr-FR')}*
        `.trim();
    };

    return { analyzeStockData, loading, error, analysis };
};