/**
 * Módulo principal de gestión de rangos y plataformas de Apex Legends
 * Este archivo re-exporta las funciones de los módulos especializados
 * para mantener la compatibilidad con el resto del código.
 */

// Re-exportar funciones de construcción de menús
export { buildManageRankPayload } from './rank-menu-builder';

// Re-exportar handlers de plataformas
export { handlePlatformAssignment } from './platform-handlers';

// Re-exportar handlers de rangos
export { handleManageRankMenu } from './rank-menu';
export {
  handleRoleAssignment,
} from './rank-assignment';
export { handleManagePlatform, handleSetPlatform } from './platform-management';
