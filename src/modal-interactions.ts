import { ModalSubmitInteraction, EmbedBuilder } from 'discord.js';
import { createCloseButtonRow } from './utils/button-helper';
import { getApexProfileByName } from './services/apex-api';
import { APEX_RANKS } from './constants';

export async function handleModalInteraction(
  interaction: ModalSubmitInteraction
) {
  try {
    if (interaction.customId === 'apex_profile_modal') {
      await interaction.deferReply({ ephemeral: true });

      const playerName = interaction.fields.getTextInputValue('apex_name');
      const platform = interaction.fields
        .getTextInputValue('apex_platform')
        .toUpperCase();

      const allowed = ['PC', 'PS4', 'X1'];
      if (!allowed.includes(platform)) {
        await interaction.editReply({
          content: `Plataforma inválida. Solo se permite: PC, PS4 o X1.`,
          components: [createCloseButtonRow()],
        });
        return;
      }

      const profile = await getApexProfileByName(playerName, platform);

      // Log solo el status
      if (!profile || profile.Error) {
        console.log('[API][Perfil] status: ERROR');
        await interaction.editReply({
          embeds: [
            {
              title: 'Error al obtener perfil',
              description: `No se pudo obtener el perfil para **${playerName}** (${platform}).`,
              color: 0xED4245, // rojo
            },
          ],
          components: [createCloseButtonRow()],
        });
        return;
      } else {
        console.log('[API][Perfil] status: OK');
      }

      const global = profile.global || {};
      const selectedLegend =
        profile.legends?.selected?.LegendName || 'Desconocida';
      let legendBanner = profile.legends?.selected?.ImgAssets?.banner;
      let rankImg = global.rank?.rankImg;
      const rankDiv = global.rank?.rankDiv ?? '';
      const rankName = global.rank?.rankName ?? 'N/A';

      if (legendBanner) legendBanner = encodeURI(legendBanner);
      if (rankImg) rankImg = encodeURI(rankImg);

      // Traducción del rango usando APEX_RANKS
      let rankLabel = rankName;
      const rankConst = APEX_RANKS.find(
        r => r.apiName?.toLowerCase() === rankName.toLowerCase()
      );
      if (rankConst && rankConst.label) {
        rankLabel = rankConst.label;
      }

      // Si es rookie, puedes dejarlo vacío o poner "Sin rango"
      if (rankLabel.toLowerCase().includes('rookie')) {
        rankLabel = 'Sin rango';
      }

      const kills = profile.total?.career_kills?.value ?? 'N/A';
      const rank = `${rankLabel} ${rankDiv}`.trim();

      // Usa el color del rango si existe, si no, usa naranja por defecto
      // Convierte el string hexadecimal a número
      const embedColorStr = (rankConst?.color || 'e67e22').replace(/^#/, '');
      const embedColor = parseInt(embedColorStr, 16);

      const embed = new EmbedBuilder()
        .setTitle(`Perfil de Apex: ${global.name || playerName}`)
        .setColor(embedColor)
        .setThumbnail(rankImg || undefined)
        .addFields(
          { name: 'Nivel:', value: `**${global.level ?? 'N/A'}**`, inline: true },
          { name: 'Rango:', value: `**${rank}**`, inline: true },
          { name: 'Kills:', value: `**${kills}**`, inline: true },
          { name: 'Leyenda seleccionada:', value: `**${selectedLegend}**`, inline: true },
          { name: 'UID:', value: `**${global.uid ?? 'N/A'}**`, inline: true },
          { name: 'Plataforma:', value: `**${platform}**`, inline: true }
        )
        .setFooter({ text: 'Datos obtenidos de la API de Mozambique' });

      if (legendBanner) embed.setImage(legendBanner);

      await interaction.editReply({ embeds: [embed], components: [createCloseButtonRow()] });
    }
  } catch (error) {
    console.error('Error en handleModalInteraction:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({
        content: 'Ocurrió un error al procesar el modal.',
        ephemeral: true,
        components: [createCloseButtonRow()],
      });
    }
  }
}
