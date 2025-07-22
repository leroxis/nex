const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const mapping = {
  ' ': '   ',
  '0': ':zero:',
  '1': ':one:',
  '2': ':two:',
  '3': ':three:',
  '4': ':four:',
  '5': ':five:',
  '6': ':six:',
  '7': ':seven:',
  '8': ':eight:',
  '9': ':nine:',
  '!': ':grey_exclamation:',
  '?': ':grey_question:',
  '#': ':hash:',
  '*': ':asterisk:',
  'a': ':regional_indicator_a:',
  'b': ':regional_indicator_b:',
  'c': ':regional_indicator_c:',
  'd': ':regional_indicator_d:',
  'e': ':regional_indicator_e:',
  'f': ':regional_indicator_f:',
  'g': ':regional_indicator_g:',
  'h': ':regional_indicator_h:',
  'i': ':regional_indicator_i:',
  'j': ':regional_indicator_j:',
  'k': ':regional_indicator_k:',
  'l': ':regional_indicator_l:',
  'm': ':regional_indicator_m:',
  'n': ':regional_indicator_n:',
  'o': ':regional_indicator_o:',
  'p': ':regional_indicator_p:',
  'q': ':regional_indicator_q:',
  'r': ':regional_indicator_r:',
  's': ':regional_indicator_s:',
  't': ':regional_indicator_t:',
  'u': ':regional_indicator_u:',
  'v': ':regional_indicator_v:',
  'w': ':regional_indicator_w:',
  'x': ':regional_indicator_x:',
  'y': ':regional_indicator_y:',
  'z': ':regional_indicator_z:',
  'A': ':regional_indicator_a:',
  'B': ':regional_indicator_b:',
  'C': ':regional_indicator_c:',
  'D': ':regional_indicator_d:',
  'E': ':regional_indicator_e:',
  'F': ':regional_indicator_f:',
  'G': ':regional_indicator_g:',
  'H': ':regional_indicator_h:',
  'I': ':regional_indicator_i:',
  'J': ':regional_indicator_j:',
  'K': ':regional_indicator_k:',
  'L': ':regional_indicator_l:',
  'M': ':regional_indicator_m:',
  'N': ':regional_indicator_n:',
  'O': ':regional_indicator_o:',
  'P': ':regional_indicator_p:',
  'Q': ':regional_indicator_q:',
  'R': ':regional_indicator_r:',
  'S': ':regional_indicator_s:',
  'T': ':regional_indicator_t:',
  'U': ':regional_indicator_u:',
  'V': ':regional_indicator_v:',
  'W': ':regional_indicator_w:',
  'X': ':regional_indicator_x:',
  'Y': ':regional_indicator_y:',
  'Z': ':regional_indicator_z:',
  'İ': ':regional_indicator_i:',
  'Ö': ':regional_indicator_o:',
  'ö': ':regional_indicator_o:',
  'Ş': ':regional_indicator_s:',
  'Ü': ':regional_indicator_u:',
  'Ç': ':regional_indicator_c:',
  'ı': ':regional_indicator_i:',
  'ş': ':regional_indicator_s:',
  'ğ': ':regional_indicator_g:',
  'Ğ': ':regional_indicator_g:',
  'ü': ':regional_indicator_u:',
  'ç': ':regional_indicator_c:'
};

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('emoji-yazı')
    .setDescription('Metinleri emojilere çevirir.')
    .addStringOption(option =>
      option.setName('metin')
        .setDescription('Metni buraya giriniz.')
        .setRequired(true)),
  async run(client, interaction) {
    const yazı = interaction.options.getString("metin");

    if (yazı.length > 50) {
      return interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Hata!")
            .setDescription("Metin maksimum 50 karakterlik olabilir.")
            .setColor("Red"),
        ], ephemeral: true
      });
    }

    const emojifiedText = yazı.split('').map(c => mapping[c] || c).join('');
    await interaction.reply(`${emojifiedText}\n\n -> Bu komut bir eğlence komutudur.`);
  }
};