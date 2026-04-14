// hooks/useOpenRouterMultiModel.js
import { useState } from 'react';
import axios from 'axios';

export const useOpenRouterAnalytics = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [analysis, setAnalysis] = useState(null);

    const analyzeStockData = async (chartData, chartData2, produits, commandes, mouvements) => {
        setLoading(true);
        setError(null);

        try {
            const analysisData = prepareAnalysisData(produits, commandes, mouvements);
            const result = await callOpenRouterWithFallback(analysisData);
            setAnalysis(result);
            return result;

        } catch (err) {
    console.warn("Erreur globale → fallback forcé:", err.message);

    const fallback = generateFallbackAnalysis(
        prepareAnalysisData(produits, commandes, mouvements)
    );

    setAnalysis(fallback);
    setError("IA indisponible → analyse automatique utilisée");

    return fallback; // ✅ ne JAMAIS throw ici
} finally {
            setLoading(false);
        }
    };
const generateFallbackAnalysis = (data) => {
    const tauxLivraison = data.commandes_count > 0
        ? ((data.commandes_livrees / data.commandes_count) * 100).toFixed(1)
        : 0;

    return `
🤖 Analyse automatique (mode dégradé)

📊 Vue d'ensemble
- Produits: ${data.produits_count}
- Commandes: ${data.commandes_count}
- Livrées: ${data.commandes_livrees} (${tauxLivraison}%)
- CA: ${data.total_ventes.toLocaleString()} XAF

📌 Points clés
- ${data.top_produits.length > 0 ? 'Produits principaux identifiés' : 'Peu de données produits'}
- Activité commerciale ${data.commandes_count > 0 ? 'présente' : 'faible'}

💡 Recommandations
1. Surveiller les niveaux de stock
2. Optimiser les produits les plus vendus
3. Mettre en place des alertes de seuil

⚠️ Risques
- Rupture possible si stock faible
- Dépendance aux top produits

📈 Prévisions
- Activité stable si tendance maintenue
    `.trim();
};
    const prepareAnalysisData = (produits, commandes, mouvements) => {
        return {
            produits_count: produits?.length || 0,
            commandes_count: commandes?.length || 0,
            commandes_livrees: commandes?.filter(c => c.status === 'LIVREE').length || 0,
            total_ventes: commandes
                ?.filter(c => c.status === 'LIVREE')
                .reduce((sum, c) => sum + parseFloat(c.amount || 0), 0) || 0,
            top_produits: produits?.slice(0, 5).map(p => ({
                nom: p.name,
                stock: p.quantity,
                seuil: p.threshold
            })) || []
        };
    };

    const callOpenRouterWithFallback = async (data) => {
        const API_KEY = "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";
        // const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
        
        if (!API_KEY) {
            throw new Error('Clé API OpenRouter manquante');
        }

        const prompt = `Analyse données stock: ${JSON.stringify(data)}. Réponds en français avec points clés, recommandations, risques et prévisions.`;

        // Modèles gratuits sur OpenRouter
        const freeModels = [
    "meta-llama/llama-3.1-8b-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "google/gemma-2-9b-it:free",
    "microsoft/phi-3-mini-128k-instruct:free"
];

        const headers = {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://gestiondestockfrontdotnet.netlify.app/',
            'X-Title': 'Stock Management App'
        };

        for (const model of freeModels) {
            try {
                console.log(`Essai avec le modèle: ${model}`);
                
                const response = await axios.post(
                    'https://openrouter.ai/api/v1/chat/completions',
                    {
                        model: model,
                        messages: [
                            {
                                role: "system",
                                content: "Expert analyse stock. Réponses français concises."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        max_tokens: 800,
                        temperature: 0.7
                    },
                    {
                        headers: headers,
                        timeout: 25000
                    }
                );

                if (response.data.choices && response.data.choices[0].message.content) {
                    return response.data.choices[0].message.content;
                }

            } catch (error) {
                console.log(`Modèle ${model} échoué:`, error.response?.data?.error || error.message);
                continue;
            }
        }

        console.warn("Tous les modèles ont échoué → fallback activé");
return generateFallbackAnalysis(data);
    };

    return { analyzeStockData, loading, error, analysis };
};