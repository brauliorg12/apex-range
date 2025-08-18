import { ChatInputCommandInteraction, SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGlobalApiStatus } from '../utils/global-api-status';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('api-status')
    .setDescription('Muestra el estado actual de la API externa.'),
  async execute(interaction: ChatInputCommandInteraction) {
    const status = getGlobalApiStatus();
    const color = status.ok ? 0x2ecc71 : 0xe74c3c;
    const estado = status.ok ? '🟢 Conectado' : '🔴 Desconectado';
    const lastChecked = status.lastChecked
      ? status.lastChecked.toLocaleString()
      : 'Nunca';

    const embed = new EmbedBuilder()
      .setTitle('Estado de la API')
      .setColor(color)
      .addFields(
        { name: 'Estado', value: estado, inline: true },
        { name: 'Última verificación', value: lastChecked, inline: true }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
