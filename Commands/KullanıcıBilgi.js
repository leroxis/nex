const { SlashCommandBuilder } = require("discord.js");
const { createCanvas, loadImage } = require("canvas");
const moment = require("moment");
moment.locale("tr");

module.exports = {
  structure: new SlashCommandBuilder()
    .setName("kullanıcı-bilgi")
    .setDescription("Bir kullanıcının bilgilerini gösterir.")
    .addUserOption((option) =>
      option
        .setName("kullanıcı")
        .setDescription("Bilgilerini görmek istediğiniz kullanıcıyı seçin.")
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
      const member = interaction.guild.members.cache.get(user.id);

      if (!member) {
        return interaction.editReply({
          content: "⚠️ Kullanıcı bulunamadı. Lütfen geçerli bir kullanıcı seçin.",
        });
      }

      // Canvas oluşturma
      const canvas = createCanvas(950, 600);
      const ctx = canvas.getContext("2d");

      // Arka plan gradient
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#0f0c29");
      gradient.addColorStop(0.5, "#302b63");
      gradient.addColorStop(1, "#24243e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Dekoratif noktalar
      ctx.fillStyle = "rgba(100, 200, 255, 0.15)";
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const radius = Math.random() * 5 + 2;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bilgi kartı gövdesi
      ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      ctx.roundRect(30, 30, canvas.width - 60, canvas.height - 60, 20);
      ctx.fill();
      
      // Kenar çerçevesi
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.roundRect(30, 30, canvas.width - 60, canvas.height - 60, 20);
      ctx.stroke();

      // Tarih ve saat bilgisi (sağ üstte, iki satır halinde)
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      ctx.font = "bold 16px 'Arial'";
      
      // Tarih satırı (üstte) - "Tarih: " eklendi
      const tarihText = "Tarih: " + moment().format("DD/MM/YYYY dddd");
      const tarihWidth = ctx.measureText(tarihText).width;
      ctx.fillText(tarihText, canvas.width - tarihWidth - 40, 60);
      
      // Saat satırı (tarihin altında) - "Saat:" yapıldı (S büyük)
      const saatText = "Saat: " + moment().format("HH.mm"); // "Saat:24.15" formatı
      const saatWidth = ctx.measureText(saatText).width;
      ctx.fillText(saatText, canvas.width - saatWidth - 40, 85); // 25px aşağıda

      // Avatar bölümü
      try {
        const avatar = await loadImage(user.displayAvatarURL({ extension: 'png', size: 256 }));
        
        // Avatar için daire çerçeve
        ctx.save();
        ctx.beginPath();
        ctx.arc(150, 120, 70, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 80, 50, 140, 140);
        ctx.restore();
        
        // Avatar çerçevesi
        const borderGradient = ctx.createRadialGradient(150, 120, 60, 150, 120, 80);
        borderGradient.addColorStop(0, getStatusColor(member.presence?.status || 'offline'));
        borderGradient.addColorStop(1, "#ffffff");
        
        ctx.beginPath();
        ctx.arc(150, 120, 75, 0, Math.PI * 2, true);
        ctx.lineWidth = 6;
        ctx.strokeStyle = borderGradient;
        ctx.stroke();
      } catch (error) {
        console.error("Avatar yüklenirken hata:", error);
      }

      // Başlık
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px 'Arial'";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 5;
      ctx.fillText(`${user.username}`, 250, 90);
      ctx.font = "22px 'Arial'";
      ctx.fillText("Kullanıcı Bilgileri", 250, 120);
      ctx.shadowBlur = 0;

      // Ayırıcı çizgi
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(250, 140);
      ctx.lineTo(canvas.width - 60, 140);
      ctx.stroke();

      // Kullanıcı durumu
      const statusMapping = {
        online: "Çevrimiçi",
        idle: "Boşta",
        dnd: "Rahatsız Etmeyin",
        offline: "Çevrimdışı"
      };
      const status = statusMapping[member.presence?.status] || "Bilinmiyor";

      // Bilgi grupları
      const userInfo = [
        { title: "Kullanıcı Adı", value: user.tag },
        { title: "Kullanıcı ID", value: user.id },
        { title: "Hesap Oluşturulma", value: moment(user.createdAt).format("LL LTS") },
        { title: "Hesap Yaşı", value: moment(user.createdAt).fromNow(true) + " önce" },
        { title: "Sunucuya Katılma", value: moment(member.joinedAt).format("LL LTS") },
        { title: "Sunucuda Süre", value: moment(member.joinedAt).fromNow(true) + " önce" },
        { title: "Durum", value: status },
        { title: "Takma Ad", value: member.nickname || "Yok" },
        { title: "Rol Sayısı", value: (member.roles.cache.size - 1).toString() },
        { title: "En Yüksek Rol", value: member.roles.highest.name || "Yok" },
        { title: "Boost Durumu", value: member.premiumSince ? moment(member.premiumSince).format("LL LTS") + " tarihinden beri" : "Boost yok" }
      ];

      // Bilgileri yazdırma
      ctx.font = "18px 'Arial'";
      let yPos = 180;
      const boxWidth = canvas.width - 300;
      
      userInfo.forEach((info, index) => {
        // Satır arka planı
        ctx.fillStyle = index % 2 === 0 ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.02)";
        ctx.roundRect(250, yPos - 20, canvas.width - 300, 30, 5);
        ctx.fill();
        
        // Başlık
        ctx.fillStyle = "#AAAAAA";
        ctx.font = "bold 18px 'Arial'";
        ctx.fillText(info.title, 260, yPos);
        
        // Değer
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "18px 'Arial'";
        
        // Metin kısaltma
        let displayValue = info.value;
        const maxWidth = boxWidth - 150;
        if (ctx.measureText(displayValue).width > maxWidth) {
          while (ctx.measureText(displayValue + "...").width > maxWidth && displayValue.length > 3) {
            displayValue = displayValue.substring(0, displayValue.length - 1);
          }
          displayValue += "...";
        }
        
        ctx.fillText(displayValue, 460, yPos);
        
        yPos += 35;
      });

      // Resmi gönderme
      const attachment = canvas.toBuffer();
      await interaction.editReply({
        files: [{ attachment, name: "kullanici_bilgi.png" }]
      });

    } catch (error) {
      console.error("Hata oluştu:", error);
      return interaction.editReply({
        content: "Bir hata oluştu, lütfen tekrar deneyin.",
      });
    }
  }
};

// Duruma göre renk belirleme
function getStatusColor(status) {
  const colors = {
    online: "#43b581",
    idle: "#faa61a",
    dnd: "#f04747",
    offline: "#747f8d"
  };
  return colors[status] || "#747f8d";
}