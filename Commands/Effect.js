const {
    SlashCommandBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    AttachmentBuilder,
  } = require('discord.js');
  const { createCanvas, loadImage } = require('canvas');
  
  module.exports = {
    structure: new SlashCommandBuilder()
      .setName('effect')
      .setDescription('Avatarına efekt uygula!')
      .addUserOption(option =>
        option.setName('kullanıcı')
          .setDescription('Efekt uygulanacak kullanıcı. (Varsayılan: kendin)')
          .setRequired(false)
      )
      .addBooleanOption(option =>
        option.setName('ephemeral')
          .setDescription('Mesajı sadece size özel yap')
          .setRequired(false)
      ),
  
    async run(client, interaction) {
      const user = interaction.options.getUser('kullanıcı') || interaction.user;
      const ephemeral = interaction.options.getBoolean('ephemeral') ?? false;
  
      await interaction.deferReply({ ephemeral });
  
      const avatarURL = user.displayAvatarURL({ extension: 'png', size: 512 });
      const avatarImage = await loadImage(avatarURL);
  
      const canvas = createCanvas(512, 512);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(avatarImage, 0, 0, 512, 512);
  
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'avatar.png' });
  
      const selectMenu = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`effect_select_${interaction.user.id}`)
          .setPlaceholder('Bir efekt seçin')
          .addOptions(
            { label: 'Türk Bayrağı', value: 'turk' },
            { label: 'Azerbaycan Bayrağı', value: 'azeri' },
            { label: 'Glitch', value: 'glitch' },
            { label: 'Hapishane', value: 'prison' },
            { label: 'Kar', value: 'snow' },
            { label: 'Kedi Selfie', value: 'cat' },
            { label: 'Köpek Selfie', value: 'dog' },
            { label: 'To Be Continued', value: 'tbc' },
            { label: 'Triggered', value: 'triggered' },
            { label: 'Wasted', value: 'wasted' },
          )
      );
  
      await interaction.editReply({
        files: [attachment],
        components: [selectMenu],
      });
  
      const collector = interaction.channel.createMessageComponentCollector({
        filter: i => i.isStringSelectMenu(),
        time: 5 * 60 * 1000,
      });
  
      collector.on('collect', async i => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: `**❌ Bu menüyü sadece <@${interaction.user.id}> kullanabilir.**`,
            ephemeral: true
          });
        }
  
        const selectedEffect = i.values[0];
        await i.deferUpdate();
  
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 512 }));
        const canvas = createCanvas(512, 512);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(avatar, 0, 0, 512, 512);
  
        switch (selectedEffect) {
          case 'turk':
            ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
            ctx.fillRect(0, 0, 512, 512);
            break;
          case 'azeri':
            ctx.fillStyle = 'rgba(0, 153, 255, 0.3)';
            ctx.fillRect(0, 0, 512, 512);
            break;
          case 'glitch':
            ctx.globalCompositeOperation = 'difference';
            ctx.translate(5, 0);
            ctx.drawImage(avatar, 0, 0, 512, 512);
            break;
          case 'prison':
            for (let i = 0; i < 512; i += 40) {
              ctx.fillStyle = 'rgba(0,0,0,0.4)';
              ctx.fillRect(i, 0, 10, 512);
            }
            break;
          case 'snow':
            for (let i = 0; i < 100; i++) {
              ctx.fillStyle = 'white';
              ctx.beginPath();
              ctx.arc(Math.random() * 512, Math.random() * 512, 2, 0, Math.PI * 2);
              ctx.fill();
            }
            break;
          case 'cat':
            ctx.fillStyle = 'rgba(255, 192, 203, 0.3)';
            ctx.fillRect(0, 0, 512, 512);
            break;
          case 'dog':
            ctx.fillStyle = 'rgba(160, 82, 45, 0.3)';
            ctx.fillRect(0, 0, 512, 512);
            break;
          case 'tbc':
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = 'white';
            ctx.fillText('To Be Continued →', 220, 480);
            break;
          case 'triggered':
            ctx.font = 'bold 40px Arial';
            ctx.fillStyle = 'red';
            ctx.fillText('TRIGGERED', 160, 480);
            break;
          case 'wasted':
            ctx.font = 'bold 50px Impact';
            ctx.fillStyle = 'red';
            ctx.fillText('WASTED', 160, 270);
            break;
        }
  
        const efektli = new AttachmentBuilder(canvas.toBuffer(), {
          name: `efekt-${selectedEffect}.png`,
        });
  
        await i.editReply({
          files: [efektli],
          components: [selectMenu],
        });
      });
    },
  };
  
