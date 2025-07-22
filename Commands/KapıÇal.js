const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('kapı-çal')
        .setDescription('Polat kapıyı çalar.'),
    async run(client, interaction) {
        const SuccessEmbed = new EmbedBuilder()
            .setDescription(`${interaction.member} • Tak Tak Tak`)
            .setColor("#49c5df")
            .setFooter({ text: `${interaction.member.user.tag} tarafından istendi.`, iconURL: interaction.member.user.avatarURL({ dynamic: true }) })
            .setImage(`https://media.tenor.com/xN9H6qF11NYAAAAM/polat-alemdar.gif`);
        interaction.reply({ embeds: [SuccessEmbed] })
    }
};