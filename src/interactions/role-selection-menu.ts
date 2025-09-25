import {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ButtonInteraction,
} from 'discord.js';
import { getApexRanksForGuild } from '../helpers/get-apex-ranks-for-guild';
import { COUNTRY_NAME_TO_ISO } from '../utils/country-flag';
import { APEX_PLATFORMS } from '../models/constants';
import { getServerLogger } from '../utils/server-logger';

/**
 * Crea el embed y componentes para el menú de selección de roles excluidos.
 * Muestra los roles filtrados (excluyendo ranks y plataformas) y permite selección manual.
 * @param interaction La interacción de botón que activó el menú
 * @param excludedRoles Array de nombres de roles actualmente excluidos
 */
export async function createRoleSelectionMenu(
  interaction: ButtonInteraction,
  excludedRoles: string[] = [],
  isAdmin: boolean = false
) {
  const guild = interaction.guild!;

  // Obtener todos los roles y filtrar los permitidos (sin excluir los ya excluidos)
  const allRoles = guild.roles.cache.map((r: any) => r);
  const ranks = getApexRanksForGuild(guild.id, guild);
  const countryNames = Object.keys(COUNTRY_NAME_TO_ISO);
  const filteredRoles = allRoles.filter(
    (role: any) =>
      role.name !== '@everyone' &&
      !ranks.some((rank) => rank.roleName === role.name) &&
      !APEX_PLATFORMS.some((platform) => platform.roleName === role.name) &&
      !countryNames.includes(role.name.toUpperCase())
  );

  // Logging
  const logger = getServerLogger(
    interaction.guild!.id,
    interaction.guild!.name
  );
  logger.info(`Excluded roles: ${excludedRoles.join(', ')}`);

  // Crear embed
  const embed = new EmbedBuilder()
    .setTitle('Configurar Roles Excluidos')
    .setDescription(
      'Selecciona los roles que NO quieres mostrar en los paréntesis de los cards de rangos (banderas de países).\n\n' +
        'Si no seleccionas ninguno, se mostrarán todos los roles filtrados automáticamente.\n\n' +
        '**Roles disponibles para excluir:**'
    )
    .setColor(0x0099ff);

  // Agregar lista de roles en campos
  const roleNames = filteredRoles.map((r: any) => r.name);
  if (roleNames.length === 0) {
    embed.addFields({
      name: 'No hay roles disponibles',
      value: 'Todos los roles son ranks o plataformas.',
    });
  } else {
    embed.addFields({
      name: 'Roles Disponibles',
      value:
        roleNames.length > 0
          ? roleNames.slice(0, 20).join(', ') +
            (roleNames.length > 20 ? '...' : '')
          : 'Ninguno',
      inline: false,
    });
  }

  // Crear botones para selección (limitar a 5 por fila, máximo 4 filas = 20 roles)
  const buttons: ButtonBuilder[] = [];
  filteredRoles.slice(0, 20).forEach((role: any) => {
    const isSelected = excludedRoles.includes(role.name);
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`role_select_${role.id}${isAdmin ? '_admin' : ''}`)
        .setLabel(
          (role.name.length > 75
            ? role.name.substring(0, 72) + '...'
            : role.name) + (isSelected ? ' ✅' : '')
        )
        .setStyle(ButtonStyle.Secondary)
    );
  });

  // Agregar botones de control
  buttons.push(
    new ButtonBuilder()
      .setCustomId(`back_to_modes${isAdmin ? '_admin' : ''}`)
      .setLabel(isAdmin ? 'Cerrar' : 'Volver')
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(isAdmin ? '❌' : '⬅️'),
    new ButtonBuilder()
      .setCustomId(`role_skip${isAdmin ? '_admin' : ''}`)
      .setLabel('No Excluir Ninguno/Limpiar')
      .setStyle(ButtonStyle.Secondary)
  );

  // Crear filas de componentes (5 botones por fila)
  const rows: ActionRowBuilder<ButtonBuilder>[] = [];
  for (let i = 0; i < buttons.length; i += 5) {
    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.slice(i, i + 5)
    );
    rows.push(row);
  }

  // Decide cómo responder basado en si el menú es ephemeral (admin) o no (setup)
  if (isAdmin) {
    // Para modo admin: Si ya se respondió, edita el mensaje existente; de lo contrario, crea uno nuevo
    if (interaction.replied) {
      await interaction.editReply({ embeds: [embed], components: rows });
    } else {
      await interaction.reply({
        embeds: [embed],
        components: rows,
        ephemeral: true,
      });
    }
  } else {
    // Para modo setup: Edita el mensaje persistente
    await interaction.deferUpdate();
    await interaction.editReply({ embeds: [embed], components: rows });
  }
}
