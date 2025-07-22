const { SlashCommandBuilder } = require('discord.js');
const canvafy = require('canvafy');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('tweet')
    .setDescription('Bir tweet oluşturmanızı sağlar.')
    .addStringOption(option =>
      option.setName('mesaj')
        .setDescription('Tweet içeriğini yazın.')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('ephemeral')
        .setDescription('Yanıt gizli olsun mu? (true = gizli, false = açık)')
        .setRequired(false)
    ),

  async run(client, interaction) {
    const mesaj = interaction.options.getString('mesaj');
    const ephemeralOption = interaction.options.getBoolean('ephemeral') || false;

    await interaction.deferReply({ ephemeral: ephemeralOption });

    const avatarURL = interaction.user.displayAvatarURL({ format: 'png', dynamic: true, size: 512 });

    try {
      const tweetImage = await new canvafy.Tweet()
        .setTheme('dark') 
        .setUser({
          displayName: interaction.member.displayName,
          username: interaction.user.username,
        })
        .setVerified(true) 
        .setComment(mesaj)
        .setAvatar(avatarURL)
        .build();

      await interaction.editReply({
        files: [{
          attachment: tweetImage,
          name: `tweet-${interaction.user.id}.png`,
        }],
      });
    } catch (error) {
      console.error('Tweet oluşturulurken bir hata oluştu:', error);
      await interaction.editReply({ content: '⚠️ Tweet oluşturulamadı. Lütfen tekrar deneyin.' });
    }
  },
};
