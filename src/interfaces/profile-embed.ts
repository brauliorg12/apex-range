import { AttachmentBuilder, EmbedBuilder } from 'discord.js';

// Tipo para el resultado de la función buildApexProfileEmbed
export type ApexProfileEmbedResult = {
  embed: EmbedBuilder;
  files?: AttachmentBuilder[];
};
