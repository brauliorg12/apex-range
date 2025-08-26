import { SlashCommandBuilder, ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { getApexProfile } from '../services/apex-api';

export const data = new SlashCommandBuilder()
  .setName('apex-profile')
  .setDescription('Muestra información básica de un jugador de Apex Legends por UID.')
  .addStringOption(opt =>
    opt.setName('uid')
      .setDescription('UID del jugador de Apex Legends')
      .setRequired(true)
  )
  .addStringOption(opt =>
    opt.setName('platform')
      .setDescription('Plataforma (PC, X1, PS4, etc)')
      .setRequired(false)
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const uid = interaction.options.getString('uid', true);
  const platform = interaction.options.getString('platform') || 'PC';

  await interaction.deferReply({ ephemeral: true });

  const profile = await getApexProfile(uid, platform);

  if (!profile || profile.Error) {
    await interaction.editReply({
      content: `No se pudo obtener el perfil para UID: ${uid} (${platform}).`,
    });
    return;
  }

  // Ejemplo de campos básicos, puedes extenderlo según la respuesta de la API
  const embed = new EmbedBuilder()
    .setTitle(`Perfil de Apex: ${profile.global?.name || 'Desconocido'}`)
    .setColor('#e67e22')
    .addFields(
      { name: 'Nivel', value: String(profile.global?.level ?? 'N/A'), inline: true },
      { name: 'Rango', value: profile.global?.rank?.rankName || 'N/A', inline: true },
      { name: 'UID', value: uid, inline: true },
      { name: 'Plataforma', value: platform, inline: true }
    )
    .setFooter({ text: 'Datos obtenidos de la API de Mozambique' });

  await interaction.editReply({ embeds: [embed] });
}
