import { PermissionsBitField } from 'discord.js';

/**
 * Lista completa de permisos necesarios para el funcionamiento del bot
 */
export const REQUIRED_PERMISSIONS = [
  {
    name: 'ViewChannel',
    flag: PermissionsBitField.Flags.ViewChannel,
    description: 'Ver Canal',
    scope: 'channel',
  },
  {
    name: 'SendMessages',
    flag: PermissionsBitField.Flags.SendMessages,
    description: 'Enviar Mensajes',
    scope: 'channel',
  },
  {
    name: 'ManageMessages',
    flag: PermissionsBitField.Flags.ManageMessages,
    description: 'Gestionar Mensajes',
    scope: 'channel',
  },
  {
    name: 'ManageRoles',
    flag: PermissionsBitField.Flags.ManageRoles,
    description: 'Gestionar Roles',
    scope: 'guild',
  },
  {
    name: 'UseExternalEmojis',
    flag: PermissionsBitField.Flags.UseExternalEmojis,
    description: 'Usar Emojis Externos',
    scope: 'channel',
  },
  {
    name: 'ReadMessageHistory',
    flag: PermissionsBitField.Flags.ReadMessageHistory,
    description: 'Leer Historial de Mensajes',
    scope: 'channel',
  },
  {
    name: 'EmbedLinks',
    flag: PermissionsBitField.Flags.EmbedLinks,
    description: 'Insertar Enlaces',
    scope: 'channel',
  },
  {
    name: 'AttachFiles',
    flag: PermissionsBitField.Flags.AttachFiles,
    description: 'Adjuntar Archivos',
    scope: 'channel',
  },
];
