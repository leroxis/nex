const { SlashCommandBuilder, EmbedBuilder, AttachmentBuilder, ActivityType } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');

const { CanvasRenderingContext2D } = require('canvas');

CanvasRenderingContext2D.prototype.roundRect = function (x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  this.beginPath();
  this.moveTo(x + r, y);
  this.arcTo(x + w, y, x + w, y + h, r);
  this.arcTo(x + w, y + h, x, y + h, r);
  this.arcTo(x, y + h, x, y, r);
  this.arcTo(x, y, x + w, y, r);
  this.closePath();
  return this;
};

module.exports = {
  structure: new SlashCommandBuilder()
    .setName('spotify')
    .setDescription('Spotifyda dinlediğiniz şarkıya özel resim oluşturur')
    .addUserOption(option =>
      option
        .setName('üye')
        .setDescription('LÜye Seçiniz')
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName('ephemeral')
        .setDescription('Mesaj sadece size görünür olsun mu? (Varsayılan: false)')
    ),

  async run(client, interaction) {
    const isEphemeral = interaction.options.getBoolean('ephemeral') || false;

    await interaction.deferReply({ ephemeral: isEphemeral });

    const member = interaction.options.getMember('üye');

    if (!member || !member.presence || !member.presence.activities) {
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`**<@${interaction.options.getUser('üye').id}> Şu Anda Spotify'da Şarkı Dinlemiyor**`),
        ],
      });
    }

    const spotifyActivity = member.presence.activities.find(
      activity => activity.name === 'Spotify' && activity.type === ActivityType.Listening
    );

    if (!spotifyActivity || !spotifyActivity.assets || !spotifyActivity.assets.largeImage) {
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription(`**<@${interaction.options.getUser('üye').id}> Şu Anda Spotify'da Şarkı Dinlemiyor**`),
        ],
      });
    }

    try {
      const spotifyImageKey = spotifyActivity.assets.largeImage.slice(8);
      const spotifyImageUrl = `https://i.scdn.co/image/${spotifyImageKey}`;

      const songTitle = spotifyActivity.details || 'Bilinmeyen Şarkı';
      const artistName = spotifyActivity.state || 'Bilinmeyen Sanatçı';
      const albumName = spotifyActivity.assets.largeText || 'Bilinmeyen Albüm';
      const startTime = new Date(spotifyActivity.timestamps.start);
      const endTime = new Date(spotifyActivity.timestamps.end);
      const duration = (endTime - startTime) / 1000; 
      const currentTime = (Date.now() - startTime.getTime()) / 1000;

      const spotifyCover = await loadImage(spotifyImageUrl);
      const spotifyLogo = await loadImage('https://upload.wikimedia.org/wikipedia/commons/thumb/1/19/Spotify_logo_without_text.svg/2048px-Spotify_logo_without_text.svg.png');

      const canvas = createCanvas(1000, 500);
      const ctx = canvas.getContext('2d');

      
      ctx.fillStyle = '#121212';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

    
      ctx.fillStyle = '#FFFFFF';
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 1.2;
        const opacity = Math.random() * 0.8 + 0.2;
        ctx.globalAlpha = opacity;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
        
        if (Math.random() > 0.7) {
          ctx.shadowColor = '#FFFFFF';
          ctx.shadowBlur = 5;
          ctx.beginPath();
          ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
      ctx.globalAlpha = 1.0;

      for (let i = 0; i < 5; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const length = Math.random() * 30 + 10;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3})`;
        ctx.lineWidth = Math.random() * 0.8 + 0.2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + Math.cos(angle) * length, y + Math.sin(angle) * length);
        ctx.stroke();
      }

      const coverSize = 300;
      const coverX = 50;
      const coverY = 100;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;
      ctx.fillStyle = '#000';
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 15).fill();
      ctx.shadowBlur = 0;
    
      ctx.save();
      ctx.roundRect(coverX, coverY, coverSize, coverSize, 15).clip();
      ctx.drawImage(spotifyCover, coverX, coverY, coverSize, coverSize);
      ctx.restore();

      const logoSize = 50;
      const logoX = canvas.width - logoSize - 30;
      const logoY = 30;
      ctx.drawImage(spotifyLogo, logoX, logoY, logoSize, logoSize);
      
      ctx.font = 'bold 32px "Arial", sans-serif';
      ctx.fillStyle = '#1DB954';
      ctx.textAlign = 'right';
      ctx.fillText('Spotify', logoX - 10, logoY + logoSize/2 + 10);

      const infoX = coverX + coverSize + 40;
      const infoY = coverY + 30;
      const infoWidth = canvas.width - infoX - 30;

      ctx.font = 'bold 32px "Arial", sans-serif';
      ctx.fillStyle = '#1DB954';
      ctx.textAlign = 'left';
      ctx.fillText('ŞARKI', infoX, infoY);
      
      ctx.font = '28px "Arial", sans-serif';
      ctx.fillStyle = '#FFFFFF';
      const songTitleLines = wrapText(ctx, songTitle, infoWidth, 28);
      songTitleLines.forEach((line, i) => {
        ctx.fillText(line, infoX, infoY + 40 + (i * 35));
      });

      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillStyle = '#1DB954';
      ctx.fillText('SANATÇI', infoX, infoY + 120);
      
      ctx.font = '24px "Arial", sans-serif';
      ctx.fillStyle = '#B3B3B3';
      const artistLines = wrapText(ctx, artistName, infoWidth, 24);
      artistLines.forEach((line, i) => {
        ctx.fillText(line, infoX, infoY + 150 + (i * 30));
      });

      ctx.font = 'bold 26px "Arial", sans-serif';
      ctx.fillStyle = '#1DB954';
      ctx.fillText('ALBÜM', infoX, infoY + 220);
      
      ctx.font = '22px "Arial", sans-serif';
      ctx.fillStyle = '#B3B3B3';
      const albumLines = wrapText(ctx, albumName, infoWidth, 22);
      albumLines.forEach((line, i) => {
        ctx.fillText(line, infoX, infoY + 250 + (i * 28));
      });

      const progressBarWidth = coverSize;
      const progressBarHeight = 10; 
      const progressBarX = coverX;
      const progressBarY = coverY + coverSize + 60;

      
      ctx.fillStyle = 'rgba(179, 179, 179, 0.3)';
      ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 10);
      ctx.fill();

      
      const progress = Math.min((currentTime / duration) * progressBarWidth, progressBarWidth);
      const progressGradient = ctx.createLinearGradient(progressBarX, 0, progressBarX + progress, 0);
      progressGradient.addColorStop(0, '#1DB954');
      progressGradient.addColorStop(1, '#1ED760');
      
      ctx.fillStyle = progressGradient;
      ctx.roundRect(progressBarX, progressBarY, progress, progressBarHeight, 10);
      ctx.fill();

      
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(progressBarX + progress, progressBarY + progressBarHeight/2, progressBarHeight, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#B3B3B3';
      ctx.font = '18px "Arial", sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(
        formatTime(currentTime),
        progressBarX,
        progressBarY - 10
      );
      ctx.textAlign = 'right';
      ctx.fillText(
        formatTime(duration),
        progressBarX + progressBarWidth,
        progressBarY - 10
      );

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `spotify-${member.id}.png` });

      return interaction.followUp({ files: [attachment] });
    } catch (error) {
      console.error('Hata:', error);
      return interaction.followUp({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('> **Spotify bilgileri oluşturulurken bir hata oluştu.**'),
        ],
      });
    }
  },
};

function wrapText(ctx, text, maxWidth, fontSize) {
  const lines = [];
  let currentLine = '';
  
  const currentFont = ctx.font;
  ctx.font = `${fontSize}px ${ctx.font.split(' ').slice(1).join(' ')}`;
  
  const words = text.split(' ');
  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine + words[i] + ' ';
    const metrics = ctx.measureText(testLine);
    
    if (metrics.width > maxWidth && i > 0) {
      lines.push(currentLine.trim());
      currentLine = words[i] + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());
  
  ctx.font = currentFont;
  
  return lines;
}

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}