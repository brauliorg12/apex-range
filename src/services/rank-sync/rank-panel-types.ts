import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  EmbedBuilder,
} from 'discord.js';
import { ApexRank } from '../../interfaces/apex-rank';

/**
 * Card de un rango dentro del panel.
 */
export interface RankPanelCard {
  /** Rango representado por el card. */
  rank: ApexRank;
  /** Embed del card. */
  embed: EmbedBuilder;
  /** Imagen adjunta del card, o `null` si no tiene. */
  file: AttachmentBuilder | null;
  /** Filas de botones del card. */
  components: ActionRowBuilder<ButtonBuilder>[];
}

/**
 * Panel completo construido en memoria.
 */
export interface RankPanelPayload {
  /** Embed de encabezado del panel. */
  header: EmbedBuilder;
  /** Cards de rangos en el orden del catálogo. */
  cards: RankPanelCard[];
  /** Panel de gestión con sus botones. */
  management: {
    /** Embed del panel de gestión. */
    embed: EmbedBuilder;
    /** Filas de botones del panel de gestión. */
    components: ActionRowBuilder<ButtonBuilder>[];
  };
}

/**
 * IDs de los mensajes que forman el panel persistido.
 */
export interface RankPanelMessageIds {
  /** ID del mensaje de encabezado. */
  headerMessageId: string;
  /** IDs de cards indexados por `shortId` del rango. */
  cardMessageIds: Record<string, string>;
  /** ID del mensaje del panel de gestión. */
  managementMessageId: string;
}

/**
 * Resultado de reconstruir el panel.
 */
export interface RankPanelRebuildResult {
  /** Cantidad de cards enviadas. */
  cardCount: number;
  /** Avisos no fatales de recolección y borrado de mensajes. */
  warnings: string[];
}

/**
 * Resultado de recolectar los mensajes viejos del panel.
 */
export interface RankPanelCollectionResult {
  /** IDs únicos recolectados del estado y del canal. */
  messageIds: string[];
  /** Cantidad de IDs aportados por el estado persistido. */
  fromState: number;
  /** Cantidad de IDs encontrados por el fallback del canal. */
  fromFallback: number;
  /** Avisos no fatales de la recolección. */
  warnings: string[];
}

/**
 * Journal de limpieza que se persiste junto con los IDs del panel.
 */
export interface RankPanelJournalState {
  /** IDs retirados que quedan pendientes de borrado. */
  retiredMessageIds: string[];
  /** Indica si un rebuild sigue en curso. */
  rebuildInProgress: boolean;
}

/**
 * Resultado de la limpieza de recuperación del panel.
 */
export interface RankPanelRecoveryResult {
  /** Indica si hay un rebuild interrumpido y se debe reconstruir el panel. */
  rebuildRequired: boolean;
  /** Avisos no fatales de la limpieza. */
  warnings: string[];
}

/**
 * Resultado de borrar mensajes del panel.
 */
export interface PanelDeletionResult {
  /** Avisos de los mensajes que no se pudieron borrar. */
  warnings: string[];
  /** IDs que fallaron por un error distinto de `10008`. */
  failedIds: string[];
}
