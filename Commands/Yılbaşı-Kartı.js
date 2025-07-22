const { SlashCommandBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const moment = require("moment");
moment.locale("tr");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("yılbaşı-kartı")
    .setDescription("Yılbaşı temalı özel bir kart oluşturur.")
    .addUserOption((option) =>
      option
        .setName("kullanıcı")
        .setDescription("Kart oluşturmak istediğiniz kullanıcıyı seçin.")
        .setRequired(true)
    )
    .addBooleanOption((option) =>
      option
        .setName("ephemeral")
        .setDescription("Mesajın gizli (ephemeral) olup olmayacağını belirleyin.")
    ),

  async run(client, interaction) {
    try {
      await interaction.deferReply({
        ephemeral: interaction.options.getBoolean("ephemeral") || false,
      });

      const user = interaction.options.getUser("kullanıcı") || interaction.user;

      const canvas = createCanvas(800, 500);
      const ctx = canvas.getContext("2d");

      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#1a2a6c");
      gradient.addColorStop(0.5, "#b21f1f");
      gradient.addColorStop(1, "#fdbb2d");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (let i = 0; i < 100; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 3 + 1;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.roundRect(30, 30, canvas.width - 60, canvas.height - 60, 20);
      ctx.fill();
      
      ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
      ctx.lineWidth = 5;
      ctx.roundRect(30, 30, canvas.width - 60, canvas.height - 60, 20);
      ctx.stroke();

      ctx.fillStyle = "#228B22";
      ctx.beginPath();
      ctx.moveTo(canvas.width - 100, canvas.height - 100);
      ctx.lineTo(canvas.width - 50, canvas.height - 30);
      ctx.lineTo(canvas.width - 150, canvas.height - 30);
      ctx.closePath();
      ctx.fill();
      
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(canvas.width - 95, canvas.height - 30, 10, 30);
      
      const decorations = ["#FF0000", "#FFD700", "#FFFFFF", "#1E90FF"];
      for (let i = 0; i < 10; i++) {
        const x = canvas.width - 150 + Math.random() * 100;
        const y = canvas.height - 100 + Math.random() * 70;
        ctx.fillStyle = decorations[Math.floor(Math.random() * decorations.length)];
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = "#FFD700";
      drawStar(ctx, canvas.width - 100, canvas.height - 120, 5, 15, 5);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 36px 'Arial'";
      ctx.textAlign = "center";
      ctx.fillText("Mutlu Yıllar!", canvas.width / 2, 80);
      
      ctx.font = "italic 20px 'Arial'";
      ctx.fillText(`${moment().format('YYYY')} Yılına Hoş Geldiniz`, canvas.width / 2, 110);

      try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 220, 80, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, canvas.width / 2 - 80, 140, 160, 160);
        ctx.restore();

        ctx.beginPath();
        ctx.arc(canvas.width / 2, 220, 85, 0, Math.PI * 2, true);
        ctx.lineWidth = 8;
        ctx.strokeStyle = "#FF0000";
        ctx.stroke();
 
        ctx.beginPath();
        ctx.arc(canvas.width / 2, 220, 90, 0, Math.PI * 2, true);
        ctx.lineWidth = 3;
        ctx.strokeStyle = "#228B22";
        ctx.stroke();
      } catch (error) {
        console.error("Avatar yüklenirken hata:", error);
      }

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 28px 'Arial'";
      ctx.textAlign = "center";
      ctx.fillText(user.username, canvas.width / 2, 350);

      ctx.font = "20px 'Arial'";
      ctx.fillText("Yeni yılda sağlık, mutluluk ve başarı dolu günler dileriz!", canvas.width / 2, 380);

      ctx.font = "16px 'Arial'";
      ctx.fillText(moment().format("DD MMMM YYYY, dddd"), canvas.width / 2, 420);


      const attachment = canvas.toBuffer();
      await interaction.editReply({
        files: [{ attachment, name: "yilbasi_karti.png" }]
      });

    } catch (error) {
      console.error("Hata oluştu:", error);
      return interaction.editReply({
        content: "Bir hata oluştu, lütfen tekrar deneyin.",
      });
    }
  }
};

function drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {
  let rot = Math.PI / 2 * 3;
  let x = cx;
  let y = cy;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(cx, cy - outerRadius);
  
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outerRadius;
    y = cy + Math.sin(rot) * outerRadius;
    ctx.lineTo(x, y);
    rot += step;

    x = cx + Math.cos(rot) * innerRadius;
    y = cy + Math.sin(rot) * innerRadius;
    ctx.lineTo(x, y);
    rot += step;
  }
  
  ctx.lineTo(cx, cy - outerRadius);
  ctx.closePath();
  ctx.fill();
}
