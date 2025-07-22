const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('avatar')
    .setDescription('Seçilen kullanıcının avatarını gösterir')
    .addUserOption(option =>
      option.setName('kullanıcı')
        .setDescription('Avatarını görmek istediğiniz kullanıcıyı seçin')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option.setName('ephemeral')
        .setDescription('Mesajın gizli (ephemeral) olup olmayacağını belirleyin')
    ),

  async run(client, interaction) {
    try {
      const user = interaction.options.getUser('kullanıcı');
      if (!user) {
        return interaction.reply({ content: 'Kullanıcı bulunamadı.', ephemeral: true });
      }

      const member = await interaction.guild.members.fetch(user.id);
      if (!member) {
        return interaction.reply({ content: 'Üye bulunamadı.', ephemeral: true });
      }

      const avatarUrl = user.displayAvatarURL({ dynamic: true });
      const komutKullananKisi = interaction.user;
      const ephemeralOption = interaction.options.getBoolean('ephemeral') || false;

      await interaction.deferReply({ ephemeral: ephemeralOption });

      const embed = new EmbedBuilder()
        .setTitle(`${user.username}'nin Avatarı`)
        .setImage(`${avatarUrl}?size=256`)
        .setFooter({ text: `${member.displayName} adlı kişinin avatarı` })
        .setColor('#49c5df');

      const selectMenu = new ActionRowBuilder()
        .addComponents(
          new StringSelectMenuBuilder()
            .setCustomId('avatarSize')
            .setPlaceholder('Bir boyut seçin')
            .addOptions([
              { label: '16x16', description: 'Avatarı 16x16 boyutunda görüntüleyin', value: '16' },
              { label: '32x32', description: 'Avatarı 32x32 boyutunda görüntüleyin', value: '32' },
              { label: '64x64', description: 'Avatarı 64x64 boyutunda görüntüleyin', value: '64' },
              { label: '128x128', description: 'Avatarı 128x128 boyutunda görüntüleyin', value: '128' },
              { label: '256x256', description: 'Avatarı 256x256 boyutunda görüntüleyin', value: '256' },
              { label: '1024x1024', description: 'Avatarı 1024x1024 boyutunda görüntüleyin', value: '1024' }
            ])
        );

      const bannerButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('showBanner')
            .setLabel('Banneri Göster')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🖼️')
        );

      const message = await interaction.editReply({ 
        embeds: [embed], 
        components: [selectMenu, bannerButton], 
        fetchReply: true 
      });

      // Avatar boyutu seçimi için collector
      const avatarFilter = i => i.user.id === komutKullananKisi.id && i.customId === 'avatarSize';
      const avatarCollector = message.createMessageComponentCollector({ filter: avatarFilter });

      avatarCollector.on('collect', async i => {
        const size = i.values[0];

        const updatedEmbed = new EmbedBuilder()
          .setTitle(`${user.username}'nin Avatarı`)
          .setImage(`${avatarUrl}?size=${size}`)
          .setFooter({ text: `${member.displayName} adlı kişinin avatarı` })
          .setColor('#49c5df');

        await i.deferUpdate();
        await interaction.editReply({ embeds: [updatedEmbed] });
      });

      // Banner butonu için collector
      const bannerFilter = i => i.user.id === komutKullananKisi.id && i.customId === 'showBanner';
      const bannerCollector = message.createMessageComponentCollector({ filter: bannerFilter });

      bannerCollector.on('collect', async i => {
        try {
          await i.deferReply({ ephemeral: true });
          
          // Kullanıcının bannerını al
          const bannerUser = await client.users.fetch(user.id, { force: true });
          const bannerURL = bannerUser.bannerURL({ dynamic: true, size: 1024 });

          if (bannerURL) {
            const bannerEmbed = new EmbedBuilder()
              .setTitle(`${user.username}'nin Bannerı`)
              .setImage(bannerURL)
              .setColor('#49c5df');

            await i.followUp({ embeds: [bannerEmbed], ephemeral: true });
          } else {
            await i.followUp({ 
              content: `**<a:axen_carpi:1298348573817049120> <@${user.id}> kişisinin bannerı bulunmuyor!**`, 
              ephemeral: true 
            });
          }
        } catch (error) {
          console.error(error);
          await i.followUp({ 
            content: `**<a:axen_carpi:1298348573817049120> <@${user.id}> kişisinin banneri bulunmuyor!**`, 
            ephemeral: true 
          });
        }
      });

      // Başkalarının tıklamalarını engelleme
      const otherFilter = i => i.user.id !== komutKullananKisi.id;
      const otherCollector = message.createMessageComponentCollector({ filter: otherFilter });

      otherCollector.on('collect', async i => {
        await i.deferReply({ ephemeral: true });
        await i.followUp({ 
          content: `**<a:axen_carpi:1298348573817049120> Bu butonu komutu kullanan kişi yani <@${komutKullananKisi.id}> kullanabilir!**`, 
          ephemeral: true 
        });
      });

    } catch (e) {
      console.error(e);
      await interaction.editReply({ content: '⚠️ Bir hata oluştu!', ephemeral: true }).catch(e => { });
    }
  }
};