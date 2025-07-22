const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("ship")
    .setDescription("İki kullanıcı arasındaki uyumu ölçer.")
    .addUserOption(option =>
      option.setName("kullanıcı")
        .setDescription("Bir kullanıcıyı seçin.")
        .setRequired(true))
    .addBooleanOption(option =>
      option.setName("ephemeral")
        .setDescription("Mesajın gizli olup olmayacağını belirleyin.")),

  async run(client, interaction) {
    try {
      await interaction.deferReply({ ephemeral: interaction.options.getBoolean("ephemeral") ?? false });

      const user1 = interaction.user;
      const user2 = interaction.options.getUser("kullanıcı");

      if (user2.bot) {
        return await interaction.editReply({ content: "⚠️ Botlarla ship yapılamaz!" });
      }

      // Canvas oluşturma
      const canvas = createCanvas(753, 370);
      const ctx = canvas.getContext("2d");

      // Arka plan gradient (daha canlı renkler)
      const bgGradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      bgGradient.addColorStop(0, "#ff1493");
      bgGradient.addColorStop(0.5, "#9400D3");
      bgGradient.addColorStop(1, "#4B0082");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Arka plana küçük kalpler ekleme
      ctx.font = "14px serif";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        ctx.fillText("❤", x, y);
      }

      // Üst pembe bar (daha parlak)
      ctx.fillStyle = "#ff00aa";
      ctx.fillRect(0, 0, canvas.width, 50);

      // Üst kalpler (ortalanmış ve daha fazla çeşit)
      const topHearts = "💖 💘 💝 💞 💗 💓";
      ctx.font = "18px serif";
      ctx.fillStyle = "white";
      const textWidth = ctx.measureText(topHearts).width;
      ctx.fillText(topHearts, (canvas.width - textWidth) / 2, 32);

      // Kullanıcı adları (daha şık görünüm)
      ctx.font = "bold 24px 'Arial'";
      ctx.fillStyle = "#ffffff";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeText(user1.username, 90, 33);
      ctx.fillText(user1.username, 90, 33);
      
      ctx.fillStyle = "#00ffff";
      ctx.strokeText(user2.username, 730 - ctx.measureText(user2.username).width, 33);
      ctx.fillText(user2.username, 730 - ctx.measureText(user2.username).width, 33);

      // Yan kalpler (renkli ve çeşitli)
      ctx.font = "22px serif";
      const heartTypes = ["❤", "🧡", "💛", "💚", "💙", "💜", "🤎", "🖤", "🤍"];
      for (let i = 0; i < 10; i++) {
        const heart1 = heartTypes[Math.floor(Math.random() * heartTypes.length)];
        const heart2 = heartTypes[Math.floor(Math.random() * heartTypes.length)];
        ctx.fillStyle = `hsl(${Math.random() * 360}, 100%, 70%)`;
        ctx.fillText(heart1, 10, 90 + i * 24);
        ctx.fillText(heart2, 725, 90 + i * 24);
      }

      // Avatarları yükleme
      let avatar1, avatar2;
      try {
        avatar1 = await loadImage(user1.displayAvatarURL({ extension: "png", size: 256 }));
        avatar2 = await loadImage(user2.displayAvatarURL({ extension: "png", size: 256 }));
      } catch (error) {
        console.error("Avatar yükleme hatası:", error);
        return await interaction.editReply({ content: "⚠️ Avatar yüklenirken bir hata oluştu!" });
      }

      // Yuvarlak avatar çizme fonksiyonu (daha şık çerçeve)
      const drawCircularAvatar = (x, y, img) => {
        const radius = 70;
        const gradient = ctx.createRadialGradient(x, y, radius - 10, x, y, radius + 10);
        gradient.addColorStop(0, "#ff00cc");
        gradient.addColorStop(0.5, "#ff66ff");
        gradient.addColorStop(1, "#cc00ff");

        ctx.beginPath();
        ctx.arc(x, y, radius + 8, 0, Math.PI * 2);
        ctx.lineWidth = 4;
        ctx.strokeStyle = gradient;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.2)";
        ctx.fill();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
        ctx.restore();
      };

      drawCircularAvatar(140, 190, avatar1);
      drawCircularAvatar(613, 190, avatar2);

      // Aşk yüzdesi hesaplama
      const percent = Math.floor(Math.random() * 101);
      const percentHeight = Math.floor((percent / 100) * 180);

      // Bar çizme (daha şık bir bar)
      const barX = (canvas.width - 50) / 2;
      const barY = 80;
      const barWidth = 50;
      const barHeight = 180;

      // Bar gölgelendirme
      ctx.fillStyle = "rgba(0,0,0,0.3)";
      ctx.fillRect(barX + 5, barY + 5, barWidth, barHeight);

      // Bar gradient
      const barGradient = ctx.createLinearGradient(barX, barY, barX, barY + barHeight);
      barGradient.addColorStop(0, "#ffffff");
      barGradient.addColorStop(0.5, "#ff66cc");
      barGradient.addColorStop(1, "#ff1493");

      ctx.fillStyle = barGradient;
      ctx.fillRect(barX, barY + (barHeight - percentHeight), barWidth, percentHeight);

      // Bar çerçevesi
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 3;
      ctx.strokeRect(barX, barY, barWidth, barHeight);

      // Yüzde ve kalp türü
      let heart = "💔";
      let heartColor = "#aaaaaa";
      if (percent >= 85) {
        heart = "💘";
        heartColor = "#ff00aa";
      } else if (percent >= 70) {
        heart = "💖";
        heartColor = "#ff66cc";
      } else if (percent >= 40) {
        heart = "❤️";
        heartColor = "#ff3366";
      }

      // Yüzde yazısı
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Arial'";
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.strokeText(`${percent}%`, barX + (barWidth - ctx.measureText(`${percent}%`).width) / 2, barY + barHeight + 35);
      ctx.fillText(`${percent}%`, barX + (barWidth - ctx.measureText(`${percent}%`).width) / 2, barY + barHeight + 35);

      // Bar yanındaki dekoratif kalpler (animasyon efekti)
      ctx.font = "24px serif";
      ctx.fillStyle = heartColor;
      ctx.fillText("💝", barX + 60, barY + 40);
      ctx.fillText("💖", barX + 60, barY + 100);
      ctx.fillText("💘", barX + 60, barY + 160);
      ctx.fillText("❤️", barX - 60, barY + 40);
      ctx.fillText("🧡", barX - 60, barY + 100);
      ctx.fillText("💛", barX - 60, barY + 160);

      // Alt büyük kalp (parıltı efekti)
      ctx.font = "48px serif";
      ctx.fillStyle = heartColor;
      ctx.shadowColor = "white";
      ctx.shadowBlur = 15;
      ctx.fillText(heart, barX + (barWidth - 70) / 2, barY + barHeight + 90);
      ctx.shadowBlur = 0;

      // Görseli gönder
      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: `ship-${user1.id}-${user2.id}.png` });
      await interaction.editReply({ files: [attachment] });

    } catch (error) {
      console.error("Ship komutunda hata:", error);
      await interaction.editReply({ content: "⚠️ Komut çalıştırılırken bir hata oluştu!" });
    }
  }
};