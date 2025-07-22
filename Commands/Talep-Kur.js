const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const { JsonDatabase } = require("wio.db")
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" })

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('talep-kur')
    .setDescription('Talep sistemini kurmak için bu komutu kullanabilirsiniz.')
    .addStringOption(option => option.setName('seçim')
      .setDescription('Menülü mü, Buton mu?')
      .setRequired(true)
      .addChoices(
        { name: 'Menülü', value: 'menulu' },
        { name: 'Buton', value: 'buton' }
      ))
    .addIntegerOption(option => option.setName('adet')
      .setDescription('Kaç adet menü veya buton oluşturulacak?')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(5))
    .addRoleOption(option => option.setName('yetkili-rol-seçimi')
      .setDescription('Staff rolünü seçin.')
      .setRequired(true))
    .addChannelOption(option => option.setName('log-kanal-seçimi')
      .setDescription('Talep kayıtlarının gönderileceği log kanalını seçiniz.')
      .addChannelTypes(ChannelType.GuildText)
      .setRequired(true))
    .addChannelOption(option => option.setName('talep-kategori-seçimi')
      .setDescription('Taleplerin oluşturulacağı talep kategorisini seçiniz.')
      .addChannelTypes(ChannelType.GuildCategory)
      .setRequired(true))
    .addStringOption(option => option.setName('embed-başlığını-giriniz')
      .setDescription('Gömülü mesajın başlığını giriniz.')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(256))
    .addStringOption(option => option.setName('embed-açıklamasını-giriniz')
      .setDescription('Gömülü mesajın açıklamasını giriniz. (Alt satıra geçmek için \\n kullanabilirsiniz)')
      .setRequired(true)
      .setMinLength(1)
      .setMaxLength(4096))
    .addStringOption(option => option.setName('embed-resim-urlsi-giriniz')
      .setDescription('Gömülü mesajdaki resmin URL\'sini giriniz.')
      .setRequired(false))
    .addStringOption(option => option.setName('embed-küçük-resim-urlsi-giriniz')
      .setDescription('Gömülü mesajdaki küçük resmin URL\'sini giriniz.')
      .setRequired(false))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async run(client, interaction) {
    const seçim = interaction.options.getString('seçim');
    const adet = interaction.options.getInteger('adet');
    const StaffRoleID = interaction.options.getRole('yetkili-rol-seçimi').id;
    const LogChannelID = interaction.options.getChannel('log-kanal-seçimi').id;
    const CategoryID = interaction.options.getChannel('talep-kategori-seçimi').id;
    const embedTitle = interaction.options.getString('embed-başlığını-giriniz');
    const embedDescription = interaction.options.getString('embed-açıklamasını-giriniz').split('\\n').join('\n');
    const embedImage = interaction.options.getString('embed-resim-urlsi-giriniz');
    const embedThumbnail = interaction.options.getString('embed-küçük-resim-urlsi-giriniz');



    const createModal = (adet) => {
      const modal = new ModalBuilder()
        .setCustomId(`ticketModal-${seçim}-${adet}`)
        .setTitle(`${seçim === 'menulu' ? 'Menüleri' : 'Butonları'} İsimlendirin!`);

      const inputComponents = [];

      for (let i = 1; i <= adet; i++) {
        const input = new TextInputBuilder()
          .setCustomId(`${i}-name`)
          .setLabel(`${i}. ${seçim === 'menulu' ? 'Menü' : 'Buton'} İsmi`)
          .setStyle(TextInputStyle.Short)
          .setRequired(true)
          .setMinLength(1)
          .setMaxLength(seçim === 'menulu' ? 80 : 80);

        inputComponents.push(new ActionRowBuilder().addComponents(input));
      }

      modal.addComponents(...inputComponents);
      return modal;
    };

    if (adet >= 1 && adet <= 5) {
      const modal = createModal(adet);
      await interaction.showModal(modal);

      client.once('interactionCreate', async interaction => {
        if (interaction.isModalSubmit()) {

          const [_, seçim, adet] = interaction.customId.split('-');

          GuildDatas.set(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`, StaffRoleID);
          GuildDatas.set(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`, LogChannelID);
          GuildDatas.set(`${interaction.guild.id}.TicketSystem.Configure.CategoryID`, CategoryID);

          const names = [];
          for (let i = 1; i <= parseInt(adet); i++) {
            names.push(interaction.fields.getTextInputValue(`${i}-name`));
          }

          const embed = {
            title: embedTitle,
            description: embedDescription,
            image: embedImage ? { url: embedImage } : undefined,
            thumbnail: embedThumbnail ? { url: embedThumbnail } : undefined,
            color: 0x0099ff,
          };

          let components = [];
          if (seçim === 'buton') {
            const buttons = names.map(name => new ButtonBuilder()
              .setLabel(name)
              .setStyle(ButtonStyle.Primary)
              .setEmoji("➡️")
              .setCustomId(`ticketCreate-${name}`)
            );
            components = [new ActionRowBuilder().addComponents(...buttons)];
          } else if (seçim === 'menulu') {
            const selectMenu = new StringSelectMenuBuilder()
              .setCustomId('ticketSelectMenu')
              .setPlaceholder('Açmak istediğiniz talebin kategorisini seçiniz.')
              .addOptions(names.map(name => ({
                label: name,
                value: `ticketCreate-${name}`,
                emoji: '➡️'
              })));

            components = [new ActionRowBuilder().addComponents(selectMenu)];
          }

          await interaction.reply({ content: "Talep sistemi başarılı bir şekilde oluşturuldu.", ephemeral: true });
          await interaction.channel.send({ embeds: [embed], components });
        }
      });
    } else {
      await interaction.reply({ content: 'Geçersiz adet.', ephemeral: true });
    }
  }
};