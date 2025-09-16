import {
  SlashCommandBuilder,
  PermissionsBitField,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Definición del comando /cleanup-data para Discord.
 *
 * Utiliza SlashCommandBuilder para registrar el comando que permite limpiar archivos antiguos
 * de servidores donde el bot ya no está presente.
 */
export const data = new SlashCommandBuilder()
  .setName('cleanup-data')
  .setDescription(
    '[ADMIN] Limpia archivos JSON de servidores donde el bot ya no está presente.'
  )
  .addBooleanOption(option =>
    option.setName('confirm')
      .setDescription('Confirma que quieres eliminar los archivos antiguos')
      .setRequired(true)
  );

/**
 * Ejecuta el comando cleanup-data.
 * Este comando es solo para administradores del bot (owner) y permite limpiar archivos antiguos.
 * @param interaction La interacción del comando.
 */
export async function execute(interaction: ChatInputCommandInteraction) {
  // Solo permitir al owner del bot (ajusta el ID según sea necesario)
  const botOwnerId = process.env.BOT_OWNER_ID || 'TU_DISCORD_ID_AQUI';
  if (interaction.user.id !== botOwnerId) {
    await interaction.reply({
      content: 'Este comando solo puede ser usado por el administrador del bot.',
      ephemeral: true,
    });
    return;
  }

  const confirm = interaction.options.getBoolean('confirm', true);

  if (!confirm) {
    await interaction.reply({
      content: 'Operación cancelada. Los archivos no serán eliminados.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  try {
    const client = interaction.client;
    const stateDir = path.join(__dirname, '../../.bot-state');
    const dbDir = path.join(__dirname, '../../db');

    // Obtener lista de archivos existentes
    const [stateFiles, dbFiles] = await Promise.all([
      fs.readdir(stateDir).catch(() => []),
      fs.readdir(dbDir).catch(() => [])
    ]);

    // Extraer guildIds de los archivos
    const existingGuildIds = new Set<string>();

    // De archivos de estado
    for (const file of stateFiles) {
      if (file.endsWith('.json')) {
        const guildId = file.replace('.json', '');
        existingGuildIds.add(guildId);
      }
    }

    // De archivos de players
    for (const file of dbFiles) {
      if (file.startsWith('players_') && file.endsWith('.json')) {
        const guildId = file.replace('players_', '').replace('.json', '');
        existingGuildIds.add(guildId);
      }
    }

    // Verificar cuáles guilds ya no están accesibles
    const currentGuildIds = new Set(client.guilds.cache.map(g => g.id));
    const obsoleteGuildIds = [...existingGuildIds].filter(id => !currentGuildIds.has(id));

    if (obsoleteGuildIds.length === 0) {
      await interaction.editReply({
        content: '✅ No se encontraron archivos antiguos para limpiar. Todos los archivos corresponden a servidores activos.',
      });
      return;
    }

    // Limpiar archivos
    let cleanedCount = 0;
    const cleanedFiles: string[] = [];

    for (const guildId of obsoleteGuildIds) {
      const stateFile = path.join(stateDir, `${guildId}.json`);
      const playersFile = path.join(dbDir, `players_${guildId}.json`);

      const stateDeleted = await fs.unlink(stateFile).then(() => true).catch(() => false);
      const playersDeleted = await fs.unlink(playersFile).then(() => true).catch(() => false);

      if (stateDeleted || playersDeleted) {
        cleanedCount++;
        if (stateDeleted) cleanedFiles.push(`.bot-state/${guildId}.json`);
        if (playersDeleted) cleanedFiles.push(`db/players_${guildId}.json`);
      }
    }

    const embed = new EmbedBuilder()
      .setTitle('🧹 Limpieza de Datos Completada')
      .setColor(cleanedCount > 0 ? '#00ff00' : '#ffa500')
      .setDescription(
        cleanedCount > 0
          ? `Se limpiaron ${cleanedCount} archivos de ${obsoleteGuildIds.length} servidores obsoletos.`
          : 'No se pudieron limpiar archivos. Puede que ya hayan sido eliminados.'
      )
      .addFields(
        { name: 'Servidores Encontrados', value: `${obsoleteGuildIds.length}`, inline: true },
        { name: 'Archivos Limpiados', value: `${cleanedCount}`, inline: true },
        { name: 'Archivos Actuales', value: `${cleanedFiles.length}`, inline: true }
      );

    if (cleanedFiles.length > 0) {
      embed.addFields({
        name: 'Archivos Eliminados',
        value: cleanedFiles.map(f => `\`${f}\``).join('\n'),
        inline: false
      });
    }

    await interaction.editReply({ embeds: [embed] });

  } catch (error) {
    console.error('Error en cleanup-data:', error);
    await interaction.editReply({
      content: '❌ Ocurrió un error durante la limpieza de datos.',
    });
  }
}
