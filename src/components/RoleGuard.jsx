import { useAuth } from '../contexts/AuthContext';

/**
 * Rend ses enfants uniquement si le rôle courant est dans la liste.
 *
 * @example
 * // Affiche le bouton Supprimer seulement pour Admin et Gérant
 * <RoleGuard roles={['Admin', 'Gerant']}>
 *   <Button danger>Supprimer</Button>
 * </RoleGuard>
 *
 * @example
 * // Avec un fallback
 * <RoleGuard roles={['Admin']} fallback={<span>—</span>}>
 *   <AdminPanel />
 * </RoleGuard>
 */
export default function RoleGuard({ roles, children, fallback = null }) {
  const { hasRole } = useAuth();
  return hasRole(roles) ? children : fallback;
}
