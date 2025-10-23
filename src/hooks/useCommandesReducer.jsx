import { useReducer, useEffect } from "react";
import axios from "axios";
import axiosInstance from "../services/axiosInstance";


const initialState = {
    dejaTraitees: JSON.parse(localStorage.getItem('commandesLivrees')) || [], // Récupère les commandes livrées précédemment
    dejaPreparees: JSON.parse(localStorage.getItem('commandesPreparees')) || [], // Récupère les commandes livrées précédemment
  };
  
  function reducer(state, action) {
    switch (action.type) {
      case "NOUVELLES_LIVRAISONS":
        // Met à jour l'état et sauvegarde dans localStorage
        const nouvellesLivrees = [...state.dejaTraitees, ...action.payload.map(c => c.id)];
        localStorage.setItem('commandesLivrees', JSON.stringify(nouvellesLivrees));
        return {
          ...state,
          dejaTraitees: nouvellesLivrees,
        };
      case "NOUVELLES_PREPARATIONS":
        // Met à jour l'état et sauvegarde dans localStorage
        const nouvellesPreparees = [...state.dejaPreparees, ...action.payload.map(c => c.id)];
        localStorage.setItem('commandesPreparees', JSON.stringify(nouvellesPreparees));
        return {
          ...state,
          dejaPreparees: nouvellesPreparees,
        };
      default:
        return state;
    }
  }

export function useCommandesReducer(commandes) {
   const [state, dispatch] = useReducer(reducer, initialState); // AJOUT OBLIGATOIRE
 
  useEffect(() => {
    const commandesLivrees = commandes.filter(c => c.statut === 'LIVREE');
    const commandesPreparees = commandes.filter(c => c.statut === 'PREPAREE');
  
    // Filtrage avec les données actuelles du localStorage (pas du state)
    const dejaTraitees = JSON.parse(localStorage.getItem('commandesLivrees')) || [];
    const dejaPreparees = JSON.parse(localStorage.getItem('commandesPreparees')) || [];
  
    const nouvellesLivraisons = commandesLivrees.filter(
      cmd => !dejaTraitees.includes(cmd.id)
    );
    const nouvellesPreparations = commandesPreparees.filter(
      cmd => !dejaPreparees.includes(cmd.id)
    );

    if (nouvellesPreparations.length > 0) {
      console.log("Nouvelles Preparations via reducer:", nouvellesPreparations);
  
      nouvellesPreparations.forEach(cmd => {
      
        const newProduit = {
          ...cmd.produits_details,
          qte: cmd.produits_details.qte - cmd.qte,
        };
  
        axiosInstance.put(`http://localhost:8000/produits/${cmd.produits}/`, newProduit);
      });
        // Sauvegarde directe dans le localStorage
      const nouveauxIds = [...dejaPreparees, ...nouvellesPreparations.map(c => c.id)];
      localStorage.setItem('commandesPreparees', JSON.stringify(nouveauxIds));

      // Met à jour le reducer
      dispatch({ type: "NOUVELLES_PREPARATIONS", payload: nouvellesPreparations });
    }
  
    if (nouvellesLivraisons.length > 0) {
      console.log("Nouvelles livraisons via reducer:", nouvellesLivraisons);
  
      nouvellesLivraisons.forEach(cmd => {
        axiosInstance.post("http://localhost:8000/mouvements/", {
          type: "SORTIE",
          qte: cmd.qte,
          montant: cmd.montant,
          user : cmd.client,
          produits: cmd.produits
        });
       
      });
  
      // Sauvegarde directe dans le localStorage
      const nouveauxIds = [...dejaTraitees, ...nouvellesLivraisons.map(c => c.id)];
      localStorage.setItem('commandesLivrees', JSON.stringify(nouveauxIds));
  
      // Met à jour le reducer
      dispatch({ type: "NOUVELLES_LIVRAISONS", payload: nouvellesLivraisons });
    }
  }, [commandes]);
  return state; // retourner l’état 
  
  }
  