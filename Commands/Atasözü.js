const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    structure: new SlashCommandBuilder()
        .setName('atasözü')
        .setDescription('Bot size rastgele bir atasözü gönderir.'),
    async run(client, interaction) {

        const Atasözleri = [
            "Damlaya damlaya göl olur.",
            "Gülme komşuna, gelir başına.",
            "Taşıma su ile değirmen dönmez.",
            "Ayağını yorganına göre uzat.",
            "İşleyen demir ışıldar.",
            "Bir elin nesi var, iki elin sesi var.",
            "Güvenme varlığa, düşersin darlığa.",
            "Sakla samanı, gelir zamanı.",
            "Tatlı dil yılanı deliğinden çıkarır.",
            "Ağaç yaşken eğilir."
        ];

        const SuccessEmbed = new EmbedBuilder()
            .setDescription(`**${Atasözleri[Math.floor(Math.random() * Atasözleri.length)]}**`)
            .setColor("#49c5df")
            .setFooter({ text: `${interaction.member.user.tag} tarafından istendi.`, iconURL: interaction.member.user.avatarURL({ dynamic: true }) });

        await interaction.reply({ embeds: [SuccessEmbed] });
    }
};