const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('öp')
    .setDescription('Bir kullanıcıyı öpersin.')
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Kullanıcıyı seçin.')
        .setRequired(true)),
  async run(client, interaction) {
    const User = interaction.options.getMember('Kullanıcı')

    const SuccessEmbed = new EmbedBuilder()
      .setFooter({ text: `${interaction.member.user.tag} tarafından istendi.`, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
      .setDescription(`${interaction.member} kullanıcısı ${User} kullanıcısını öpüyor.`)
      .setImage(`https://c.tenor.com/fRIfg-otefcAAAAC/tenor.gif`);
    interaction.reply({ embeds: [SuccessEmbed] });
  }
};