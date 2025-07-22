const { SlashCommandBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const moment = require("moment");
moment.locale("tr");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("doğum-günü-kartı")
    .setDescription("Doğum günü kartı oluşturur.")
    .addUserOption(option =>
      option
        .setName("kullanıcı")
        .setDescription("Kart oluşturulacak kullanıcı")
        .setRequired(true)
    )
    .addStringOption(option =>
      option
        .setName("mesaj")
        .setDescription("Kartta görünecek özel mesaj")
        .setRequired(true)
    )
    .addBooleanOption(option =>
      option
        .setName("ephemeral")
        .setDescription("Mesajı sadece sen mi göresin?")
        .setRequired(false)
    ),

  async run(client, interaction) {
    try {
      await interaction.deferReply({
        ephemeral: interaction.options.getBoolean("ephemeral") || false,
      });

      const user = interaction.options.getUser("kullanıcı");
      const customMessage = interaction.options.getString("mesaj") || "Mutlu Yıllar!";

      // Canvas oluşturma
      const canvas = createCanvas(800, 600);
      const ctx = canvas.getContext("2d");

      // Arka plan gradient (pastel renkler)
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#ff9a9e");
      gradient.addColorStop(0.5, "#fad0c4");
      gradient.addColorStop(1, "#fbc2eb");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Konfeti efekti
      const confettiColors = ["#ff9a9e", "#fad0c4", "#fbc2eb", "#a6c1ee", "#a18cd1"];
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 6 + 2;
        const angle = Math.random() * Math.PI * 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.fillStyle = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.restore();
      }

      // Ana kart gövdesi
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.roundRect(50, 50, canvas.width - 100, canvas.height - 100, 30);
      ctx.fill();
      
      // Çerçeve süslemesi
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 8;
      ctx.roundRect(50, 50, canvas.width - 100, canvas.height - 100, 30);
      ctx.stroke();
      
      // Noktalı çerçeve
      ctx.strokeStyle = "#ff9a9e";
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.roundRect(60, 60, canvas.width - 120, canvas.height - 120, 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Başlık
      ctx.fillStyle = "#d23669";
      ctx.font = "bold 48px 'Comic Sans MS', cursive";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.2)";
      ctx.shadowBlur = 10;
      ctx.fillText("Nice Yaşlara", canvas.width / 2, 120);
      ctx.shadowBlur = 0;

      // Avatar alanı
      try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        
        // Yuvarlak avatar çerçevesi (gradientli)
        const avatarSize = 180;
        const avatarX = canvas.width / 2 - avatarSize / 2;
        const avatarY = 150;
        
        // Çiçek çerçeve
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 15, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        // Çiçek deseni
        const flowerColors = ["#ff9a9e", "#fbc2eb", "#a6c1ee"];
        for (let i = 0; i < 24; i++) {
          const angle = (i / 24) * Math.PI * 2;
          const x = canvas.width / 2 + Math.cos(angle) * (avatarSize / 2 + 5);
          const y = avatarY + avatarSize / 2 + Math.sin(angle) * (avatarSize / 2 + 5);
          
          ctx.fillStyle = flowerColors[i % flowerColors.length];
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fill();
          
          // Çiçek yaprakları
          if (i % 2 === 0) {
            ctx.beginPath();
            ctx.arc(x + 8, y + 8, 6, 0, Math.PI * 2);
            ctx.arc(x - 8, y - 8, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.restore();
        
        // Avatar için daire çerçeve
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // Avatar çerçevesi
        const borderGradient = ctx.createRadialGradient(
          canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 - 5,
          canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5
        );
        borderGradient.addColorStop(0, "#d23669");
        borderGradient.addColorStop(1, "#ff9a9e");
        
        ctx.beginPath();
        ctx.arc(canvas.width / 2, avatarY + avatarSize / 2, avatarSize / 2 + 3, 0, Math.PI * 2, true);
        ctx.lineWidth = 6;
        ctx.strokeStyle = borderGradient;
        ctx.stroke();
      } catch (error) {
        console.error("Avatar yüklenirken hata:", error);
      }

      // Kullanıcı adı
      ctx.fillStyle = "#d23669";
      ctx.font = "bold 32px 'Comic Sans MS', cursive";
      ctx.textAlign = "center";
      ctx.fillText(user.username.toUpperCase(), canvas.width / 2, 400);

      // Özel mesaj
      ctx.fillStyle = "#5f5f5f";
      ctx.font = "italic 24px 'Comic Sans MS', cursive";
      wrapText(ctx, customMessage, canvas.width / 2, 440, 600, 30);

      // Alt bilgi
      ctx.fillStyle = "#d23669";
      ctx.font = "16px 'Comic Sans MS', cursive";
      ctx.fillText("🎂 " + moment().format("DD/MM/YYYY"), canvas.width / 2, 550);

      // Resmi gönderme
      const attachment = canvas.toBuffer();
      await interaction.editReply({
        files: [{ attachment, name: "dogum_gunu_karti.png" }],
      });

    } catch (error) {
      console.error("Hata oluştu:", error);
      return interaction.editReply({
        content: "⛔ Doğum günü kartı oluşturulurken bir hata oluştu.",
      });
    }
  }
};

// Metni satırlara bölen yardımcı fonksiyon
function wrapText(context, text, x, y, maxWidth, lineHeight) {
  const words = text.split(' ');
  let line = '';
  let testLine = '';
  let lineCount = 0;
  const maxLines = 3;

  for (let n = 0; n < words.length; n++) {
    testLine = line + words[n] + ' ';
    const metrics = context.measureText(testLine);
    const testWidth = metrics.width;
    
    if (testWidth > maxWidth && n > 0 && lineCount < maxLines - 1) {
      context.fillText(line, x, y);
      line = words[n] + ' ';
      y += lineHeight;
      lineCount++;
    } else {
      line = testLine;
    }
  }
  context.fillText(line, x, y);
}