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
            const errorMsg = 'Erreur analyse: ' + err.message;
            setError(errorMsg);
            throw new Error(errorMsg);
        } finally {
            setLoading(false);
        }
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
            "arcee-ai/trinity-large-preview:free",
            // "openrouter/andromeda-alpha",
            /*"google/gemini-pro", // Gratuit
            "meta-llama/llama-3-8b-instruct", // Gratuit
            "microsoft/wizardlm-2-8x22b", // Gratuit
            "qwen/qwen-2-7b-instruct" // Gratuit*/
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

        throw new Error('Tous les modèles gratuits sont indisponibles');
    };

    return { analyzeStockData, loading, error, analysis };
};