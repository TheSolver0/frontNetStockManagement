import { useAuth } from '../contexts/AuthContext';

/**
 * Retourne des booléens prêts à l'emploi basés sur le rôle courant.
 *
 * Matrice des permissions :
 * ┌──────────────────────────────────────┬───────┬────────┬─────────┐
 * │ Permission                           │ Admin │ Gérant │ Employé │
 * ├──────────────────────────────────────┼───────┼────────┼─────────┤
 * │ canDelete (produits)                 │  ✅   │  ✅    │   ❌   │
 * │ canManageUsers                       │  ✅   │  ❌   │   ❌   │
 * │ canViewFinancials (/transactions)    │  ✅   │  ✅    │   ❌   │
 * │ canEditCategories (modifier/suppr.)  │  ✅   │  ✅    │   ❌   │
 * │ canManageCustomers (/clients)        │  ✅   │  ✅    │   ❌   │
 * │ canManageSuppliers (/fournisseurs)   │  ✅   │  ✅    │   ❌   │
 * │ canManageProvides (cmdes fourn.)     │  ✅   │  ✅    │   ❌   │
 * │ canCreateStockMovement               │  ✅   │  ✅    │   ❌   │
 * │ canModifyOrders (modifier/suppr.)    │  ✅   │  ✅    │   ❌   │
 * └──────────────────────────────────────┴───────┴────────┴─────────┘
 */
export function usePermissions() {
  const { role } = useAuth();

  const isAdmin = role === 'Admin';
  const isGerant = role === 'Gerant';
  const isAdminOrGerant = isAdmin || isGerant;

  return {
    // Suppression de produits
    canDelete: isAdminOrGerant,
    // Gestion des utilisateurs (page Paramètres → section Utilisateurs)
    canManageUsers: isAdmin,
    // Données financières (/transactions)
    canViewFinancials: isAdminOrGerant,
    // Modifier / supprimer une catégorie
    canEditCategories: isAdminOrGerant,
    // Accès à /clients
    canManageCustomers: isAdminOrGerant,
    // Accès à /fournisseurs
    canManageSuppliers: isAdminOrGerant,
    // Accès à /commandesfournisseurs
    canManageProvides: isAdminOrGerant,
    // Créer un mouvement de stock manuel
    canCreateStockMovement: isAdminOrGerant,
    // Modifier / supprimer une commande client
    canModifyOrders: isAdminOrGerant,
  };
}
