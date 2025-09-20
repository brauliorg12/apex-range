import {
  TextChannel,
  ChatInputCommandInteraction,
  EmbedBuilder,
} from 'discord.js';
import { REQUIRED_PERMISSIONS } from '../models/required-permissions';
import { logApp } from '../utils/logger';

/**
 * Verifica si el bot tiene todos los permisos necesarios en un canal específico
 * @param interaction La interacción del comando
 * @param channel El canal donde verificar permisos
 * @returns true si todos los permisos están presentes, false si faltan algunos
 */
export async function checkBotPermissions(
  interaction: ChatInputCommandInteraction,
  channel: TextChannel
): Promise<boolean> {
  await logApp(
    `🔍 Verificando permisos en servidor ${interaction.guild!.name} (${
      interaction.guild!.id
    }) y canal ${channel.name} (${channel.id})`
  );

  const botMember = await interaction.guild!.members.fetch(
    interaction.client.user!.id
  );

  const missingPermissions: string[] = [];
  const permissionStatus: string[] = [];

  for (const perm of REQUIRED_PERMISSIONS) {
    let hasPerm = false;

    if (perm.scope === 'guild') {
      // Verificar permisos a nivel de servidor
      hasPerm = botMember.permissions.has(perm.flag);
    } else {
      // Verificar permisos en el canal específico
      hasPerm = botMember.permissionsIn(channel).has(perm.flag);
    }

    const status = hasPerm ? '✅' : '❌';
    await logApp(`${status} ${perm.description} (${perm.scope}): ${hasPerm}`);
    permissionStatus.push(`${status} ${perm.description}`);

    if (!hasPerm) {
      missingPermissions.push(
        `${perm.description} (${perm.scope === 'guild' ? 'servidor' : 'canal'})`
      );
    }
  }

  // Mostrar resumen de permisos en logs
  await logApp(`📋 Resumen de permisos: ${permissionStatus.join(' | ')}`);

  if (missingPermissions.length > 0) {
    await logApp(`❌ Permisos faltantes: ${missingPermissions.join(', ')}`);

    // Verificar si hay overrides específicos del canal
    const channelOverrides = channel.permissionOverwrites.cache;
    const botOverride = channelOverrides.get(interaction.client.user!.id);

    let additionalInfo = '';
    if (botOverride) {
      additionalInfo =
        '\n\n⚠️ **Detectado override de permisos en este canal específico.**';
    }

    const embed = new EmbedBuilder()
      .setColor('#ff6b6b')
      .setTitle('❌ Permisos Faltantes')
      .setDescription(
        `El bot necesita los siguientes permisos para funcionar correctamente:\n\n${missingPermissions
          .map((perm) => {
            // Encontrar el permiso completo para mostrar detalles
            const permDetails = REQUIRED_PERMISSIONS.find(
              (p) =>
                `${p.description} (${
                  p.scope === 'guild' ? 'servidor' : 'canal'
                })` === perm
            );
            return `• **${perm}**\n  ${
              permDetails?.details ||
              'Permiso requerido para el funcionamiento del bot'
            }`;
          })
          .join('\n\n')}\n\n${additionalInfo}\n\n**🔧 Solución:**
1. Ve a **Configuración del servidor** → **Roles**
2. Busca el rol **"Apex Range"** (o el rol del bot)
3. **Activa** los permisos faltantes
4. Para permisos de canal, también verifica la configuración específica del canal`
      )
      .setFooter({
        text: 'Los permisos de servidor son necesarios para gestionar roles, mientras que los de canal son para mensajes',
      });

    await interaction.editReply({
      embeds: [embed],
    });
    return false;
  }

  await logApp(`✅ Todos los permisos verificados correctamente`);
  return true;
}
