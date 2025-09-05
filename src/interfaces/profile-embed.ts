import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

// Tipo para el resultado de la función buildApexProfileEmbed
export interface ApexProfileEmbedResult {
  embeds: EmbedBuilder[]; // Cambiado de 'embed' a 'embeds'
  files?: AttachmentBuilder[];
}
