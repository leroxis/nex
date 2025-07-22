const { ActivityType } = require("discord.js");
const { joinVoiceChannel } = require("@discordjs/voice");
require("advanced-logs");

module.exports = client => { 
    console.success(`${client.user.username} adlı hesaba başarıyla bağlanıldı.`);

    const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);

    const statuses = [
        { name: `Powered By Lerox Inc`, type: ActivityType.Competing },
        { name: `Coded By Lerox`, type: ActivityType.Custom },
        { name: `${client.user.username} Hizmete Hazır`, type: ActivityType.Playing },
        { name: `Lerox Inc Tarafından Geliştirilmiştir`, type: ActivityType.Watching },
        { name: `${client.user.username} | ${client.guilds.cache.size} Sunucu`, type: ActivityType.Watching },
        { name: `${client.user.username} | ${totalUsers} Kullanıcı`, type: ActivityType.Listening }
    ];

    let index = 0;

    setInterval(() => {
        const status = statuses[index];
        client.user.setPresence({
            activities: [{ name: status.name, type: status.type }],
            status: 'online' 
        });

        index = (index + 1) % statuses.length;
    }, 10000); 

    const voiceChannelId = ""; // Botun Bağlanacağı Ses Kanal ID'Si
    const guildId = ""; // Sunucu ID'Si

    const guild = client.guilds.cache.get(guildId);
    if (guild) {
        const channel = guild.channels.cache.get(voiceChannelId);
        if (channel && channel.isVoiceBased()) {
            try {
                joinVoiceChannel({
                    channelId: voiceChannelId,
                    guildId: guildId,
                    adapterCreator: guild.voiceAdapterCreator,
                    selfDeaf: true,
                    selfMute: false,
                });
                console.success("Bot başarıyla ses kanalına katıldı.");
            } catch (err) {
                console.error("Ses kanalına katılırken bir hata oluştu:", err);
            }
        } else {
            console.warn("Belirtilen ses kanalı bulunamadı veya ses kanalı değil.");
        }
    } else {
        console.warn("Belirtilen sunucu bulunamadı.");
    }
};
