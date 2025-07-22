const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ChannelType, PermissionsBitField } = require('discord.js');

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('sunucu-bilgi')
    .setDescription('Sunucu hakkında detaylı bilgi gösterir')
    .addBooleanOption(option =>
      option.setName('ephemeral')
        .setDescription('Mesajın gizli (ephemeral) olup olmayacağını belirleyin')
        .setRequired(false)
    ),

  async run(client, interaction) {
    const guild = interaction.guild;
    const member = interaction.member;
    const ephemeralOption = interaction.options.getBoolean('ephemeral') || false;

    await interaction.deferReply({ ephemeral: ephemeralOption });

    const memberCount = guild.memberCount;
    const botCount = guild.members.cache.filter(m => m.user.bot).size;
    const humanCount = memberCount - botCount;
    const owner = await guild.fetchOwner();
    const verificationLevels = {
      NONE: 'Yok',
      LOW: 'Düşük',
      MEDIUM: 'Orta',
      HIGH: 'Yüksek',
      VERY_HIGH: 'Çok Yüksek'
    };
    const premiumTierNames = {
      0: 'Yok',
      1: 'Seviye 1',
      2: 'Seviye 2',
      3: 'Seviye 3'
    };
    const premiumTierIcons = {
      0: '❌',
      1: '✨',
      2: '🌟',
      3: '💎'
    };

    const features = guild.features.map(f => {
      const featureNames = {
        'ANIMATED_BANNER': 'Hareketli Afiş',
        'ANIMATED_ICON': 'Hareketli İkon',
        'BANNER': 'Afiş',
        'COMMERCE': 'Ticaret',
        'COMMUNITY': 'Topluluk',
        'DISCOVERABLE': 'Keşfedilebilir',
        'FEATURABLE': 'Öne Çıkarılabilir',
        'INVITE_SPLASH': 'Davet Arkaplanı',
        'MEMBER_VERIFICATION_GATE_ENABLED': 'Üye Doğrulama',
        'MONETIZATION_ENABLED': 'Monetizasyon',
        'MORE_STICKERS': 'Daha Fazla Sticker',
        'NEWS': 'Duyuru Kanalları',
        'PARTNERED': 'Discord Partner',
        'PREVIEW_ENABLED': 'Önizleme',
        'PRIVATE_THREADS': 'Özel Threadler',
        'ROLE_ICONS': 'Rol İkonları',
        'SEVEN_DAY_THREAD_ARCHIVE': '7 Günlük Thread Arşivi',
        'THREE_DAY_THREAD_ARCHIVE': '3 Günlük Thread Arşiv',
        'TICKETED_EVENTS': 'Biletli Etkinlikler',
        'VANITY_URL': 'Özel URL',
        'VERIFIED': 'Doğrulanmış Sunucu',
        'VIP_REGIONS': 'VIP Ses Bölgeleri',
        'WELCOME_SCREEN_ENABLED': 'Karşılama Ekranı'
      };
      return featureNames[f] || f;
    }).join(', ') || 'Özel özellik yok';

    const statuses = {
      online: guild.members.cache.filter(m => m.presence?.status === 'online').size,
      idle: guild.members.cache.filter(m => m.presence?.status === 'idle').size,
      dnd: guild.members.cache.filter(m => m.presence?.status === 'dnd').size,
      offline: guild.members.cache.filter(m => !m.presence || m.presence.status === 'offline').size
    };

    const oceanColor = '#1E90FF';

    const embed = new EmbedBuilder()
      .setTitle(`▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬\n${guild.name.toUpperCase()} SUNUCU BİLGİLERİ\n▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 4096 }))
      .setColor(oceanColor)
      .setImage(guild.bannerURL({ size: 2048 }) || null)
      .addFields(
        {
          name: '📅 **Kuruluş Bilgileri**',
          value: `▸ **Tarih:** <t:${Math.floor(guild.createdTimestamp / 1000)}:D>\n▸ **Yaş:** <t:${Math.floor(guild.createdTimestamp / 1000)}:R>\n▸ **Sunucu ID:** \`${guild.id}\``,
          inline: true
        },
        {
          name: '👑 **Yönetim**',
          value: `▸ **Sahip:** <@${owner.id}>\n▸ **Doğrulama:** ${verificationLevels[guild.verificationLevel]}\n▸ **Özellikler:** ${features.split(', ').slice(0, 3).join(', ')}${features.split(', ').length > 3 ? '...' : ''}`,
          inline: true
        },
        {
          name: '🚀 **Boost Bilgisi**',
          value: `▸ **Seviye:** ${premiumTierIcons[guild.premiumTier]} ${premiumTierNames[guild.premiumTier]}\n▸ **Sayı:** ${guild.premiumSubscriptionCount} Boost\n▸ **Boosters:** ${guild.members.cache.filter(m => m.premiumSince).size}`,
          inline: true
        },
        {
          name: '👥 **Üye İstatistikleri**',
          value: `▸ **Toplam:** ${memberCount}\n▸ **Kullanıcı:** ${humanCount}\n▸ **Bot:** ${botCount}\n▸ **Booster:** ${guild.members.cache.filter(m => m.premiumSince).size}`,
          inline: true
        },
        {
          name: '📊 **Üye Durumları**',
          value: `🟢 Çevrimiçi: ${statuses.online}\n🟡 Boşta: ${statuses.idle}\n🔴 Rahatsız Etmeyin: ${statuses.dnd}\n⚫ Çevrimdışı: ${statuses.offline}`,
          inline: true
        },
        {
          name: '🌍 **Diğer Bilgiler**',
          value: `▸ **Bölge:** ${guild.preferredLocale}\n▸ **AFK Kanalı:** ${guild.afkChannel ? `<#${guild.afkChannel.id}>` : 'Yok'}\n▸ **AFK Zaman Aşımı:** ${guild.afkTimeout / 60} dakika`,
          inline: true
        }
      )
      .setFooter({
        text: `${interaction.user.tag} tarafından istendi • ${new Date().toLocaleString()}`,
        iconURL: interaction.user.displayAvatarURL()
      });

    const row = new ActionRowBuilder()
      .addComponents(
        new StringSelectMenuBuilder()
          .setCustomId('sunucuBilgiSelect')
          .setPlaceholder('🔍 Daha fazla bilgi seçin...')
          .addOptions([
            { 
              label: 'Roller', 
              description: `Sunucudaki ${guild.roles.cache.size} rolü görüntüle`,
              emoji: '🎭',
              value: 'roles' 
            },
            { 
              label: 'Emojiler & Stickerlar', 
              description: `Sunucudaki ${guild.emojis.cache.size} emojiyi görüntüle`,
              emoji: '😀',
              value: 'emojis' 
            },
            { 
              label: 'Kanallar', 
              description: `Sunucudaki ${guild.channels.cache.size} kanalı görüntüle`,
              emoji: '📚',
              value: 'channels' 
            },
            { 
              label: 'Yöneticiler', 
              description: `Sunucudaki yöneticileri görüntüle`,
              emoji: '👑',
              value: 'admins' 
            },
            { 
              label: 'Sunucu Görselleri', 
              description: 'İkon, afiş ve diğer görseller',
              emoji: '🖼️',
              value: 'images' 
            },
            { 
              label: 'Botlar', 
              description: `Sunucudaki ${botCount} botu görüntüle`,
              emoji: '🤖',
              value: 'bots' 
            },
            { 
              label: 'Boost Detayları', 
              description: 'Boosterlar ve boost bilgileri',
              emoji: '🚀',
              value: 'boosts' 
            },
            { 
              label: 'Üye Durumları', 
              description: 'Detaylı üye durum istatistikleri',
              emoji: '📊',
              value: 'statuses' 
            }
          ])
      );

    const reply = await interaction.editReply({ embeds: [embed], components: [row] });

    const collector = reply.createMessageComponentCollector({
      componentType: 3,
      time: 60000,
      filter: i => i.user.id === interaction.user.id
    });

    collector.on('collect', async i => {
      const val = i.values[0];
      let detailEmbed;

      if (val === 'roles') {
        const roles = guild.roles.cache.sort((a, b) => b.position - a.position).map(r => `<@&${r.id}>`).join(' ');
        detailEmbed = new EmbedBuilder()
          .setTitle(`🎭 ${guild.name} Rolleri (${guild.roles.cache.size})`)
          .setDescription(roles.slice(0, 4000) || 'Rol yok')
          .setColor(oceanColor)
          .setFooter({ text: 'En yüksek rol en üstte gösterilir' });

      } else if (val === 'emojis') {
        const emojis = guild.emojis.cache.map(e => `${e} \`:${e.name}:\``).join(' ');
        const stickers = guild.stickers.cache.map(s => `[${s.name}](${s.url})`).join(', ') || 'Sticker yok';
        
        detailEmbed = new EmbedBuilder()
          .setTitle(`😀 ${guild.name} Emojileri & Stickerları`)
          .setColor(oceanColor)
          .addFields(
            { name: `Emojiler (${guild.emojis.cache.size})`, value: emojis.slice(0, 2000) || 'Emoji yok' },
            { name: `Stickerlar (${guild.stickers.cache.size})`, value: stickers.slice(0, 2000) }
          )
          .setFooter({ text: 'Emojileri kopyalamak için :emojiname: yazabilirsiniz' });

      } else if (val === 'channels') {
        const text = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).map(c => `<#${c.id}>`).join(', ');
        const voice = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).map(c => `<#${c.id}>`).join(', ');
        const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).map(c => `📂 ${c.name}`).join(', ');
        const threads = guild.channels.cache.filter(c => c.isThread()).size;
        
        detailEmbed = new EmbedBuilder()
          .setTitle(`📚 ${guild.name} Kanalları`)
          .setColor(oceanColor)
          .addFields(
            { name: `📝 Metin Kanalları [${guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size}]`, 
              value: text.slice(0, 1024) || 'Yok', inline: true },
            { name: `🔊 Ses Kanalları [${guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size}]`, 
              value: voice.slice(0, 1024) || 'Yok', inline: true },
            { name: `📂 Kategoriler [${guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size}]`, 
              value: categories.slice(0, 1024) || 'Yok', inline: true },
            { name: '🧵 Threadler', 
              value: `Toplam ${threads} thread`, inline: true }
          );

      } else if (val === 'admins') {
        const admins = guild.members.cache.filter(m => m.permissions.has(PermissionsBitField.Flags.Administrator) && !m.user.bot);
        const list = admins.map(m => `▸ <@${m.id}> (\`${m.user.tag}\`) - Katılma: <t:${Math.floor(m.joinedTimestamp / 1000)}:R>`).join('\n');
        detailEmbed = new EmbedBuilder()
          .setTitle(`👑 ${guild.name} Yöneticileri (${admins.size})`)
          .setDescription(list.slice(0, 4000) || 'Yönetici yok')
          .setColor(oceanColor)
          .setFooter({ text: 'Bu kullanıcılar yönetici yetkisine sahip' });

      } else if (val === 'images') {
        const icon = guild.iconURL({ dynamic: true, size: 4096 });
        const banner = guild.bannerURL({ size: 4096 });
        const splash = guild.splashURL({ size: 4096 });
        const discoverySplash = guild.discoverySplashURL({ size: 4096 });
        
        detailEmbed = new EmbedBuilder()
          .setTitle(`🖼️ ${guild.name} Sunucu Görselleri`)
          .setColor(oceanColor)
          .setImage(banner || icon || null)
          .addFields(
            { name: 'Sunucu İkonu', value: icon ? `[İndir](${icon})` : 'Yok', inline: true },
            { name: 'Sunucu Afişi', value: banner ? `[İndir](${banner})` : 'Yok', inline: true },
            { name: 'Davet Arkaplanı', value: splash ? `[İndir](${splash})` : 'Yok', inline: true },
            { name: 'Keşif Afişi', value: discoverySplash ? `[İndir](${discoverySplash})` : 'Yok', inline: true }
          )
          .setFooter({ text: 'Görselleri indirmek için bağlantılara tıklayın' });

      } else if (val === 'bots') {
        const bots = guild.members.cache.filter(m => m.user.bot);
        const list = bots.map(b => `▸ <@${b.id}> - \`${b.user.tag}\` (${b.user.flags?.toArray().join(', ') || 'Bot'})`).join('\n');
        detailEmbed = new EmbedBuilder()
          .setTitle(`🤖 ${guild.name} Botları (${bots.size})`)
          .setDescription(list.slice(0, 4000) || 'Bot yok')
          .setColor(oceanColor)
          .setFooter({ text: 'Bu botlar sunucuda bulunuyor' });

      } else if (val === 'boosts') {
        const boosters = guild.members.cache.filter(m => m.premiumSince);
        const list = boosters.map(b => `▸ <@${b.id}> - <t:${Math.floor(b.premiumSinceTimestamp / 1000)}:R>`).join('\n');
        detailEmbed = new EmbedBuilder()
          .setTitle(`🚀 ${guild.name} Boost Bilgileri`)
          .setDescription(`▸ **Seviye:** ${premiumTierIcons[guild.premiumTier]} ${premiumTierNames[guild.premiumTier]}\n▸ **Boost Sayısı:** ${guild.premiumSubscriptionCount}\n▸ **Boost Aşaması:** ${Math.floor(guild.premiumSubscriptionCount / 2)}/15`)
          .addFields({ name: `🎁 Boosterlar (${boosters.size})`, value: list.slice(0, 1024) || 'Boost yok' })
          .setColor(oceanColor)
          .setFooter({ text: 'Sunucuyu boostlayan değerli üyeler' });

      } else if (val === 'statuses') {
        const total = statuses.online + statuses.idle + statuses.dnd + statuses.offline;
        const onlinePercentage = ((statuses.online / total) * 100).toFixed(1);
        const idlePercentage = ((statuses.idle / total) * 100).toFixed(1);
        const dndPercentage = ((statuses.dnd / total) * 100).toFixed(1);
        const offlinePercentage = ((statuses.offline / total) * 100).toFixed(1);
        
        detailEmbed = new EmbedBuilder()
          .setTitle(`📊 ${guild.name} Üye Durum İstatistikleri`)
          .setColor(oceanColor)
          .addFields(
            { name: '🟢 Çevrimiçi', value: `${statuses.online} üye (${onlinePercentage}%)`, inline: true },
            { name: '🟡 Boşta', value: `${statuses.idle} üye (${idlePercentage}%)`, inline: true },
            { name: '🔴 Rahatsız Etmeyin', value: `${statuses.dnd} üye (${dndPercentage}%)`, inline: true },
            { name: '⚫ Çevrimdışı', value: `${statuses.offline} üye (${offlinePercentage}%)`, inline: true },
            { name: '📈 Toplam', value: `${total} üye`, inline: false }
          )
          .setFooter({ text: 'Gerçek zamanlı üye durum dağılımı' });
      }

      await i.reply({ embeds: [detailEmbed], ephemeral: true });
    });

    collector.on('end', () => {
      reply.edit({ components: [] }).catch(() => {});
    });
  }
};
