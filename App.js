const { 
    Client, 
    GatewayIntentBits, 
    ModalBuilder, 
    TextInputBuilder, 
    AttachmentBuilder, 
    ActionRowBuilder, 
    EmbedBuilder, 
    ChannelType, 
    ButtonBuilder, 
    TextInputStyle, 
    PermissionFlagsBits, 
    PermissionsBitField, 
    ButtonStyle 
} = require("discord.js");
const Config = require("./Config.js");
require("advanced-logs");
const allIntents = Object.values(GatewayIntentBits);
const client = new Client({
    intents: [allIntents]
});
const { JsonDatabase } = require("wio.db");
const GuildDatas = new JsonDatabase({ databasePath: "./Database/Guilds.json" });
require("./Utils/eventLoader.js")(client);
require("./Utils/slashHandler.js")(client);
const puppeteer = require('puppeteer');

// ---------------------------- Level Updater ------------------------------------------- //

const { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');

GlobalFonts.registerFromPath('./fonts/Montserrat-Bold.ttf', 'Montserrat');

const lastLevelUps = new Map();

client.on("messageCreate", async (message) => {
    try {
        if (!message.inGuild() || message.author.bot) return;

        const { author, guild } = message;
        const { id: userId } = author;
        const { id: guildId } = guild;

        const infoChannelID = GuildDatas.get(`${guildId}.LevelSystem.Configure.InfoChannelID`);
        const configureMode = GuildDatas.get(`${guildId}.LevelSystem.Configure.Mode`);
        if (!infoChannelID || !configureMode) return;

        if (lastLevelUps.has(userId)) {
            const lastTime = lastLevelUps.get(userId);
            if (Date.now() - lastTime < 3000) return;
        }

        const key = `${guildId}.LevelSystem.Users.${userId}`;
        let userData = GuildDatas.get(key) || { xp: 0, level: 0 };

        userData.xp += getRandomXP(configureMode);

        const requiredXP = calculateRequiredXP(userData.level);
        if (userData.xp >= requiredXP) {
            const oldLevel = userData.level;
            userData.level++;
            userData.xp = 0;
            lastLevelUps.set(userId, Date.now());

            try {
                const imageBuffer = await createModernLevelUpImage(author, oldLevel, userData.level);
                const attachment = new AttachmentBuilder(imageBuffer, { name: 'levelup.png' });

                const targetChannel = guild.channels.cache.get(infoChannelID);
                if (targetChannel) {
                    await targetChannel.send({
                        content: `✨ ${author} **Level ${userData.level}**'e ulaştın!`,
                        files: [attachment]
                    });
                }
            } catch (error) {
                console.error('Görsel oluşturma hatası:', error);
                guild.channels.cache.get(infoChannelID)?.send(
                    `✨ ${author} Level ${userData.level}'e ulaştın!`
                );
            }
        }

        GuildDatas.set(key, userData);
    } catch (error) {
        console.error('Level sisteminde hata:', error);
    }
});

function getRandomXP(mode) {
    const modes = {
        easy: [5, 10],
        normal: [3, 7],
        hard: [2, 5],
        default: [1, 10]
    };
    const [min, max] = modes[mode.toLowerCase()] || modes.default;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function calculateRequiredXP(level) {
    return level < 2 ? 100 + (50 * level) : 150 * level;
}

async function createModernLevelUpImage(user, oldLevel, newLevel) {
    const canvasWidth = 1000;
    const canvasHeight = 400;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext('2d');

    drawModernGradient(ctx, canvasWidth, canvasHeight);

    drawGeometricPattern(ctx, canvasWidth, canvasHeight);

    await drawUserAvatarWithBorder(ctx, user);

    drawLevelUpText(ctx, oldLevel, newLevel);

    drawDecorativeElements(ctx, canvasWidth, canvasHeight);

    return canvas.toBuffer('image/png');
}

function drawModernGradient(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2b5876');
    gradient.addColorStop(1, '#4e4376');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function drawGeometricPattern(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 2;

    for (let y = 0; y < height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    for (let x = 0; x < width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

async function drawUserAvatarWithBorder(ctx, user) {
    try {
        const avatarSize = 180;
        const centerX = 200;
        const centerY = 200;
 
        const avatar = await loadImage(user.displayAvatarURL({ 
            extension: 'png', 
            size: 256,
            forceStatic: true 
        }));


        ctx.save();
        ctx.beginPath();
        ctx.arc(centerX, centerY, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        
        ctx.drawImage(
            avatar, 
            centerX - avatarSize/2, 
            centerY - avatarSize/2, 
            avatarSize, 
            avatarSize
        );
        ctx.restore();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, (avatarSize/2) + 5, 0, Math.PI * 2);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 8;
        ctx.stroke();
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, (avatarSize/2) + 2, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 4;
        ctx.stroke();
    } catch (error) {
        console.error('Avatar çizim hatası:', error);
    }
}

function drawLevelUpText(ctx, oldLevel, newLevel) {
    const textX = 450;
    
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 42px "Montserrat", Arial';
    ctx.fillText('LEVEL UP', textX, 120);
    
    ctx.font = 'bold 72px "Montserrat", Arial';
    const gradient = ctx.createLinearGradient(textX, 140, textX + 300, 180);
    gradient.addColorStop(0, '#00c6ff');
    gradient.addColorStop(1, '#0072ff');
    ctx.fillStyle = gradient;
    ctx.fillText(`${oldLevel} → ${newLevel}`, textX, 200);
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.font = '28px "Montserrat", Arial';
    ctx.fillText('Yeni seviyene ulaştın!', textX, 250);
    
    const barY = 280;
    const barWidth = 400;
    const barHeight = 12;
    
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.fillRect(textX, barY, barWidth, barHeight);
    
    const progressWidth = barWidth * 0.7; // %70 dolu gösterir 
    const progressGradient = ctx.createLinearGradient(textX, barY, textX + progressWidth, barY);
    progressGradient.addColorStop(0, '#00c6ff');
    progressGradient.addColorStop(1, '#0072ff');
    ctx.fillStyle = progressGradient;
    ctx.fillRect(textX, barY, progressWidth, barHeight);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.strokeRect(textX, barY, barWidth, barHeight);
}

function drawDecorativeElements(ctx, width, height) {

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 3;
    
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(100, 50);
    ctx.lineTo(50, 100);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 50, height - 50);
    ctx.lineTo(width - 100, height - 50);
    ctx.lineTo(width - 50, height - 100);
    ctx.stroke();
    
    const glowGradient = ctx.createRadialGradient(
        width/2, height/2, 0,
        width/2, height/2, Math.max(width, height)/2
    );
    glowGradient.addColorStop(0, 'transparent');
    glowGradient.addColorStop(0.8, 'transparent');
    glowGradient.addColorStop(1, 'rgba(0, 198, 255, 0.1)');
    
    ctx.fillStyle = glowGradient;
    ctx.fillRect(0, 0, width, height);
}
// ---------------------------- TicketSystem ------------------------------------------- //
client.on('ready', async () => {
    client.guilds.cache.forEach(async (guild) => {
        const ticketData = await GuildDatas.get(`${guild.id}.TicketSystem.Tickets`);

        if (ticketData) {
            let isDataUpdated = false;

            for (const channelId in ticketData) {
                const channel = guild.channels.cache.get(channelId);

                if (!channel) {
                    GuildDatas.delete(`${guild.id}.TicketSystem.Tickets.${channelId}`);
                    isDataUpdated = true;
                }
            }

            const updatedTicketData = await GuildDatas.get(`${guild.id}.TicketSystem.Tickets`);
            if (!updatedTicketData || Object.keys(updatedTicketData).length === 0) {
                GuildDatas.delete(`${guild.id}.TicketSystem.Tickets`);
            }
        }
    });
});


client.on('channelDelete', async (channel) => {
    const ticketData = await GuildDatas.get(`${channel.guild.id}.TicketSystem.Tickets`);

    if (ticketData && ticketData[channel.id]) {
        GuildDatas.delete(`${channel.guild.id}.TicketSystem.Tickets.${channel.id}`);

        const updatedTicketData = await GuildDatas.get(`${channel.guild.id}.TicketSystem.Tickets`);

        if (!updatedTicketData || Object.keys(updatedTicketData).length === 0) {
            GuildDatas.delete(`${channel.guild.id}.TicketSystem.Tickets`);
        }
    }
});

client.on("interactionCreate", async (interaction) => {
    if (interaction.isStringSelectMenu()) {
        if (interaction.values && interaction.values.length > 0) {
            for (const value of interaction.values) {
                if (value.startsWith("ticketCreate-")) {
                    const trueValue = value.split('-')[1];

                    if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`) && Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                        (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id)) {
                        await interaction.reply({
                            embeds: [
                                new EmbedBuilder()
                                    .setTitle("⚠️ Hata!")
                                    .setDescription(`⚠️ **Zaten bu sunucuda destek talebiniz bulunmaktadır.**\n✉️ **Talebinize <#${Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                                        (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id
                                    )}>'a tıklayarak ulaşabilirsiniz.**\n👍 **Eğer erişiminiz yok ise yetkililerden destek talebinizi silmesini/tekrardan açmasını isteyiniz.**`)
                                    .setFooter({ text: "Nexus" })
                                    .setColor("Red"),],
                            ephemeral: true,
                        });
                        return interaction.message.edit({ ephemeral: false });
                    }

                    const reasonModal = new ModalBuilder()
                        .setCustomId(`reason-modal-${trueValue}`)
                        .setTitle('Sebep Belirtiniz');

                    const reasonInput = new TextInputBuilder()
                        .setCustomId('reason-input')
                        .setLabel('Sebep:')
                        .setPlaceholder('Lütfen en az 10 karakterlik bir sebep belirtiniz')
                        .setStyle(TextInputStyle.Paragraph)
                        .setMinLength(10)
                        .setMaxLength(200)
                        .setRequired(true);

                    const modalActionRow = new ActionRowBuilder().addComponents(reasonInput);
                    reasonModal.addComponents(modalActionRow);

                    await interaction.showModal(reasonModal);
                    await interaction.message.edit({ ephemeral: false });
                }
            }
        }
    }
    if (interaction.isModalSubmit()) {
        if (interaction.customId.startsWith("reason-modal-")) {
            const reason = interaction.fields.getTextInputValue('reason-input');
            const value = interaction.customId.replace('reason-modal-', '');

            const now = Date.now();
            const newDate = Math.floor(now / 1000);
            const categoryID = interaction.guild.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.CategoryID`));
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`) && Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id
            )) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Hata!")
                            .setDescription(`⚠️ **Zaten bu sunucuda destek talebiniz bulunmaktadır.**\n✉️ **Talebinize <#${DejaUnChannel}>'a tıklayarak ulaşabilirsiniz.**\n👍 **Eğer erişiminiz yok ise yetkililerden destek talebinizi silmesini/tekrardan açmasını isteyiniz.**`)
                            .setFooter({ text: "Nexus" })
                            .setColor("Red"),],
                    ephemeral: true,
                });
                return interaction.message.edit({ ephemeral: false });
            } else {
                const supportChannel = await interaction.guild.channels.create({
                    name: `talep-${interaction.user.username}`,
                    topic: `Talep Sahibi: <@${interaction.user.id}>`,
                    type: ChannelType.GuildText,
                    parent: categoryID,
                    permissionOverwrites: [
                        {
                            id: interaction.guild.id,
                            deny: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: interaction.user.id,
                            allow: [PermissionFlagsBits.ViewChannel],
                        },
                        {
                            id: roleStaff,
                            allow: [PermissionFlagsBits.ViewChannel],
                        }
                    ],
                }
                );

                await GuildDatas.set(`${interaction.guild.id}.TicketSystem.Tickets.${supportChannel.id}.AuthorID`, interaction.member.id)

                await interaction.reply({
                    content: `**Destek talebiniz ${value} sebebiyle başarıyla açıldı:** ${supportChannel}`,
                    ephemeral: true,
                });
                await interaction.message.edit({ ephemeral: false });
                const MessageReply = await supportChannel.send({
                    content: `<@${interaction.user.id}> **|** ${roleStaff}`,
                    embeds: [new EmbedBuilder()
                        .setTitle(`Destek Talebi`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Nexus" })
                        .addFields(
                            {
                                name: `👍 **Destek talebiniz yetkililere bildirildi. Lütfen sabırla bekleyiniz.**`,
                                value: ` `
                            },
                            {
                                name: `👥 **Talebi Açan Üye:**`,
                                value: `**・** ${interaction.user}`,
                                inline: true
                            },
                            {
                                name: `📅 **Talep Açılış Tarihi:**`,
                                value: `**・** <t:${newDate}:R>`,
                                inline: true
                            },
                            {
                                name: `🔔 **Talebin Kategorisi:**`,
                                value: `**・** \`${value}\``,
                                inline: true
                            },
                            {
                                name: `❓ **Talebin Açılış Sebebi:**`,
                                value: `**・** \`${reason}\``,
                                inline: true
                            }
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
                await MessageReply.pin();
            }
        }
        if (interaction.customId.startsWith("add-member")) {
            const Channel = interaction.channel;
            const targetMember = await interaction.guild.members.fetch(interaction.fields.getTextInputValue("member-id"));

            if (!targetMember) {
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Başarısız!`)
                            .setColor("Red")
                            .setFooter({ text: "Nexus" })
                            .setDescription(`
                        ❌ **Bu kullanıcı sunucuda bulunamadığından destek talebine eklenemedi.**
                        `)
                    ],
                    ephemeral: true,
                });
            }

            if (
                targetMember &&
                Channel.permissionsFor(targetMember)?.has(PermissionFlagsBits.ViewChannel) ||
                targetMember.permissions.has(PermissionFlagsBits.Administrator)
            ) {
                return interaction.reply({
                    content: `**Bu kullanıcı zaten talebi görüntüleyebiliyor!**`,
                    ephemeral: true,
                });
            }

            await Channel.permissionOverwrites.edit(targetMember, {
                [PermissionFlagsBits.ViewChannel]: true,
            });


            interaction.reply({
                embeds: [new EmbedBuilder()
                    .setAuthor({ name: `Destek Sistemi`, iconURL: "https://media.discordapp.net/attachments/909508451712000051/1252681018620645436/alphalogo.png?ex=6686375c&is=6684e5dc&hm=0dbb9681e142fb7ba0ff6afa471bf2958e91e4e827ab6772d3d37a1d81021eda&=&format=webp&quality=lossless&width=80&height=80" })
                    .setColor("Green")
                    .setFooter({ text: "Nexus" })
                    .setDescription(`
                🎫 **${targetMember} adlı üye destek talebine eklendi.**
                ⭐ **Üyeyi Destek Talebine Ekleyen Yetkili:** <@${interaction.user.id}> **(** \`${interaction.user.id}\` **)**
                `)
                ],
            });
        }
        if (interaction.customId.startsWith("remove-member")) {
            const Channel = interaction.channel;
            const targetMember = await interaction.guild.members.fetch(interaction.fields.getTextInputValue("member-id"));

            if (!targetMember) {
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Başarısız!`)
                        .setColor(`0x0099ff`)
                        .setFooter({ text: "Nexus" })
                        .setDescription(`
                    ❌ **Bu kullanıcı sunucuda bulunamadığından destek talebinden çıkartılamadı.**
                    `)],
                    ephemeral: true,
                });
            }
            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`) === interaction.fields.getTextInputValue("member-id")) {
                return interaction.reply({ content: "Talebin sahibini talepten çıkartamazsınız.", ephemeral: true })
            }

            if (
                targetMember &&
                !Channel.permissionsFor(targetMember)?.has(PermissionFlagsBits.ViewChannel) ||
                targetMember.permissions.has(PermissionFlagsBits.Administrator)
            ) {
                return interaction.reply({
                    content: `**Bu kullanıcı zaten talebi görüntüleyemiyor!**`,
                    ephemeral: true,
                });
            }

            await Channel.permissionOverwrites.edit(targetMember, {
                [PermissionFlagsBits.ViewChannel]: false,
            });

            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setAuthor({ name: `Destek Sistemi`, iconURL: "https://media.discordapp.net/attachments/909508451712000051/1252681018620645436/alphalogo.png?ex=6686375c&is=6684e5dc&hm=0dbb9681e142fb7ba0ff6afa471bf2958e91e4e827ab6772d3d37a1d81021eda&=&format=webp&quality=lossless&width=80&height=80" })
                        .setColor("2f3136")
                        .setFooter({ text: "Nexus" })
                        .setDescription(`
                🎫 **${targetMember} adlı üye destek talebinden çıkartıldı.**
                ⭐ **Üyeyi Destek Talebinden Çıkartan Yetkili:** <@${interaction.user.id}> **(** \`${interaction.user.id}\` **)**
                `)
                ],
            });
        }
    }
    if (interaction.isButton()) {
        if (interaction.customId.startsWith("ticketCreate-")) {
            const trueValue = interaction.customId.split('-')[1];

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`) && Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id)) {
                await interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("⚠️ Hata!")
                            .setDescription(`⚠️ **Zaten bu sunucuda destek talebiniz bulunmaktadır.**\n✉️ **Talebinize <#${Object.keys(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets`)).find(
                                (channel) => GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${channel}.AuthorID`) === interaction.user.id
                            )}>'a tıklayarak ulaşabilirsiniz.**\n👍 **Eğer erişiminiz yok ise yetkililerden destek talebinizi silmesini/tekrardan açmasını isteyiniz.**`)
                            .setFooter({ text: "Nexus" })
                            .setColor("Red"),],
                    ephemeral: true,
                });
                return interaction.message.edit({ ephemeral: false });
            }

            const reasonModal = new ModalBuilder()
                .setCustomId(`reason-modal-${trueValue}`)
                .setTitle('Sebep Belirtiniz');

            const reasonInput = new TextInputBuilder()
                .setCustomId('reason-input')
                .setLabel('Sebep:')
                .setPlaceholder('Lütfen en az 10 karakterlik bir sebep belirtiniz')
                .setStyle(TextInputStyle.Paragraph)
                .setMinLength(10)
                .setMaxLength(200)
                .setRequired(true);

            const modalActionRow = new ActionRowBuilder().addComponents(reasonInput);
            reasonModal.addComponents(modalActionRow);

            await interaction.showModal(reasonModal);
            await interaction.message.edit({ ephemeral: false });
        }
        if (interaction.customId === "ticket-kapat") {
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));
            const channel = interaction.channel;
            const userId = GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`);

            let user;
            try {
                user = await interaction.guild.members.fetch(userId);
            } catch (error) {
                user = null;
            }

            let devralStatus = false
            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                devralStatus = true
            }

            if (!user) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Başarısız!`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Nexus" })
                        .setDescription(`
                    ❌ **Bu kullanıcı sunucudan ayrıldığı için destek talebini kapatamıyorum.**
                    👍 **Destek talebini silmek için aşağıdaki butona tıkla!**
                    `)],
                    components: [{
                        type: 1,
                        components: [new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setEmoji("🗑️")
                        ]
                    }],
                });
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setDisabled(true)
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(devralStatus)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
            }

            if (
                !channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel) &&
                !user.permissions.has(PermissionFlagsBits.Administrator)
            )
                return interaction.reply({
                    content: `**Bu destek talebi zaten kapalı!**`,
                    ephemeral: true,
                });

            if (user.permissions.has(PermissionFlagsBits.Administrator)) {
                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Yönetici Üye Hatası!`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Nexus" })
                        .setDescription(`
                    ⚠️ **Bu destek talebinin sahibi'nin yönetici yetkisi olduğu için kanalı kapatamazsınız!**
                    👍 **Aşağıdaki Destek Talebini Sil butonu ile kanalı silebilirsiniz.**
                    `)],
                    components: [{
                        type: 1,
                        components: [new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setEmoji("🗑️")
                        ]
                    }],
                });
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setDisabled(true)
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(devralStatus)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
            }

            await interaction.message.edit({
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-kapat')
                            .setLabel(`Destek Talebini Kapat`)
                            .setStyle('Danger')
                            .setDisabled(true)
                            .setEmoji("🔒"),
                        new ButtonBuilder()
                            .setCustomId("ticket-devral")
                            .setLabel("Talebi Devral")
                            .setStyle("Primary")
                            .setDisabled(devralStatus)
                            .setEmoji("🤠"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-add")
                            .setLabel("Üye Ekle")
                            .setStyle("Success")
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-remove")
                            .setLabel("Üye Çıkart")
                            .setStyle("Danger")
                            .setEmoji("➖")
                    ]
                }],
            });
            await channel.permissionOverwrites.edit(user, {
                [PermissionsBitField.Flags.ViewChannel]: false,
            });

            await interaction.message.edit({
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setDisabled(false)
                            .setEmoji("🗑️"),
                        new ButtonBuilder()
                            .setCustomId("ticket-devral")
                            .setLabel("Talebi Devral")
                            .setStyle("Primary")
                            .setDisabled(devralStatus)
                            .setEmoji("🤠"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-add")
                            .setLabel("Üye Ekle")
                            .setStyle("Success")
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-remove")
                            .setLabel("Üye Çıkart")
                            .setStyle("Danger")
                            .setEmoji("➖")
                    ]
                }],
            });

            let allMessages = [];
            let lastMessageId;
            let userMessageCount = {};

            while (true) {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;
                allMessages = [...messages.values(), ...allMessages];
                lastMessageId = messages.last().id;
            }

            let mdContent = '### Mesaj Sıralaması ( İlk 5 Kişi )\n\n';
            let hasUserMessages = false;

            allMessages.reverse().forEach(msg => {
                if (msg.author.bot) return;

                if (!userMessageCount[msg.author.username]) {
                    userMessageCount[msg.author.username] = { count: 0, messages: [] };
                }
                userMessageCount[msg.author.username].count++;
                userMessageCount[msg.author.username].messages.push({
                    timestamp: `**${msg.createdAt.toLocaleTimeString()}**`,
                    content: `${msg.content}\n`,
                    username: `**${msg.author.username}**`
                });
                hasUserMessages = true;
            });

            const authorUser = await client.users.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`))
            if (hasUserMessages) {
                const sortedUsers = Object.entries(userMessageCount)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5);

                sortedUsers.forEach(([username, { count }], index) => {
                    mdContent += `${index + 1}. **${username} - ${count} Mesaj**\n`;
                });

                mdContent += '\n### Mesajlar\n\n';

                let allMessagesSorted = [];

                sortedUsers.forEach(([username, { messages }]) => {
                    allMessagesSorted = allMessagesSorted.concat(messages);
                });

                allMessagesSorted.sort((a, b) => {
                    return new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`);
                });

                let lastUsername = null;

                allMessagesSorted.forEach(message => {
                    if (lastUsername === message.username) {
                        mdContent += `${message.content}`;
                    } else {
                        if (lastUsername !== null) {
                            mdContent += '\n';
                        }
                        mdContent += `${message.username} - ${message.timestamp}\n${message.content}`;
                        lastUsername = message.username;
                    }
                });

                const buffer = Buffer.from(mdContent, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}_transcript.md` });

                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )],
                    files: [attachment],
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    files: [attachment],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            } else {
                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )]
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            }

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                roleStaff = `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}>`
            }

            await interaction.reply({
                content: `${roleStaff}`,
                embeds: [new EmbedBuilder()
                    .setTitle(`Destek Talebi Kapatıldı!`)
                    .setColor(0x0099ff)
                    .setFooter({ text: "Nexus" })
                    .setDescription(`
          🔒 **Destek talebi başarıyla kapatıldı!**
          👤 **Destek talebini kapatan kişi:** <@${interaction.user.id}>
          👍 **Destek Talebini Sil butonuna basarak destek talebini silebilir, Destek Talebini Aç butonuna basarak destek talebini geri açabilirsiniz!**
        `)],
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setDisabled(false)
                            .setEmoji("🗑️"),
                        new ButtonBuilder()
                            .setCustomId('ticket-aç')
                            .setLabel(`Destek Talebini Aç`)
                            .setStyle('Primary')
                            .setEmoji("🔓")
                    ]
                }],
                ephemeral: false,
            });
            return interaction.message.edit({
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-kapat')
                            .setLabel(`Destek Talebini Kapat`)
                            .setStyle('Danger')
                            .setDisabled(true)
                            .setEmoji("🔒"),
                        new ButtonBuilder()
                            .setCustomId("ticket-devral")
                            .setLabel("Talebi Devral")
                            .setStyle("Primary")
                            .setDisabled(devralStatus)
                            .setEmoji("🤠"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-add")
                            .setLabel("Üye Ekle")
                            .setStyle("Success")
                            .setEmoji("➕"),
                        new ButtonBuilder()
                            .setCustomId("ticket-member-remove")
                            .setLabel("Üye Çıkart")
                            .setStyle("Danger")
                            .setEmoji("➖")
                    ]
                }],
            });
        }
        if (interaction.customId === "ticket-aç") {
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));
            const channel = interaction.channel;
            const userId = GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`);

            let devralStatus = false
            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                devralStatus = true
            }

            let user;
            try {
                user = await interaction.guild.members.fetch(userId);
            } catch (error) {
                user = null;
            }

            if (!user)
                return interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setTitle(`Başarısız!`)
                        .setColor(`0x0099ff`)
                        .setFooter({ text: "Nexus" })
                        .setDescription(`
                        🔒 **Bu kullanıcı sunucudan ayrıldığı için bileti açamıyorum.**
                        👍 **Destek talebini için aşağıdaki butona tıkla!**
                        `)
                    ],
                    components: [{
                        type: 1,
                        components: [new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setEmoji("🗑️")
                        ]
                    }],
                });
            if (channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel))
                return interaction.reply({
                    content: `**Bu destek talebi zaten açık!**`,
                    ephemeral: true,
                });

            await channel.permissionOverwrites.edit(user, {
                [PermissionsBitField.Flags.ViewChannel]: true,
            });

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                roleStaff = `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}>`
            }

            await interaction.reply({
                content: `${user} | ${roleStaff}`,
                embeds: [new EmbedBuilder()
                    .setTitle(`Destek Talebi Tekrardan Açıldı!`)
                    .setColor(0x0099ff)
                    .setFooter({ text: "Nexus" })
                    .setDescription(`
                    🔓 **Destek talebi tekrardan açıldı!**
                    👤 **Destek biletini açan kişi:** <@${interaction.user.id}>
                    👍 **Destek talebini butonuna basarak destek talebini kapatabilirsiniz.**
                    `)],
                components: [{
                    type: 1,
                    components: [new ButtonBuilder()
                        .setCustomId('ticket-kapat2')
                        .setLabel(`Destek Talebini Kapat`)
                        .setStyle('Danger')
                        .setEmoji("🔒")]
                }],
            });
            interaction.message.delete();
        }
        if (interaction.customId === "ticket-kapat2") {
            let roleStaff = interaction.guild.roles.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`));
            const channel = interaction.channel;
            const userId = GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`);

            let user;
            try {
                user = await interaction.guild.members.fetch(userId);
            } catch (error) {
                user = null;
            }

            if (!user)
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Başarısız!`)
                            .setColor(0x0099ff)
                            .setFooter({ text: "Nexus" })
                            .setDescription(`
                        ❌ **Bu kullanıcı sunucudan ayrıldığı için destek talebini kapatamıyorum.**
                        👍 **Destek talebini silmek için aşağıdaki butona tıkla!**
                        `)
                    ],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-sil')
                                .setLabel(`Destek Talebini Sil`)
                                .setStyle('Danger')
                                .setDisabled(false)
                                .setEmoji("🗑️")
                        ]
                    }],
                });

            if (
                !channel.permissionsFor(user).has(PermissionFlagsBits.ViewChannel) &&
                !user.permissions.has(PermissionFlagsBits.Administrator)
            )
                return interaction.reply({
                    content: `🔒 **Bu destek talebi zaten kapalı!**`,
                    ephemeral: true,
                });

            if (user.permissions.has(PermissionFlagsBits.Administrator))
                return interaction.reply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle(`Yönetici Üye Hatası!`)
                            .setColor(0x0099ff)
                            .setFooter({ text: "Nexus" })
                            .setDescription(`
                        ⚠️ **Bu destek talebinin sahibi'nin yönetici yetkisi olduğu için kanalı kapatamazsınız!**
                        👍 **Aşağıdaki Destek Talebini Sil butonu ile kanalı silebilirsiniz.**
                        `)
                    ],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-sil')
                                .setLabel(`Destek Talebini Sil`)
                                .setStyle('Danger')
                                .setDisabled(false)
                                .setEmoji("🗑️")
                        ]
                    }],
                });

            await channel.permissionOverwrites.edit(user, {
                [PermissionFlagsBits.ViewChannel]: false,
            });

            let allMessages = [];
            let lastMessageId;
            let userMessageCount = {};

            while (true) {
                const options = { limit: 100 };
                if (lastMessageId) {
                    options.before = lastMessageId;
                }

                const messages = await channel.messages.fetch(options);
                if (messages.size === 0) break;
                allMessages = [...messages.values(), ...allMessages];
                lastMessageId = messages.last().id;
            }

            let mdContent = '### Mesaj Sıralaması ( İlk 5 Kişi )\n\n';
            let hasUserMessages = false;

            allMessages.reverse().forEach(msg => {
                if (msg.author.bot) return;

                if (!userMessageCount[msg.author.username]) {
                    userMessageCount[msg.author.username] = { count: 0, messages: [] };
                }
                userMessageCount[msg.author.username].count++;
                userMessageCount[msg.author.username].messages.push({
                    timestamp: `**${msg.createdAt.toLocaleTimeString()}**`,
                    content: `${msg.content}\n`,
                    username: `**${msg.author.username}**`
                });
                hasUserMessages = true;
            });

            const authorUser = await client.users.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`))
            if (hasUserMessages) {
                const sortedUsers = Object.entries(userMessageCount)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .slice(0, 5);

                sortedUsers.forEach(([username, { count }], index) => {
                    mdContent += `${index + 1}. **${username} - ${count} Mesaj**\n`;
                });

                mdContent += '\n### Mesajlar\n\n';

                let allMessagesSorted = [];

                sortedUsers.forEach(([username, { messages }]) => {
                    allMessagesSorted = allMessagesSorted.concat(messages);
                });

                allMessagesSorted.sort((a, b) => {
                    return new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`);
                });

                let lastUsername = null;

                allMessagesSorted.forEach(message => {
                    if (lastUsername === message.username) {
                        mdContent += `${message.content}`;
                    } else {
                        if (lastUsername !== null) {
                            mdContent += '\n';
                        }
                        mdContent += `${message.username} - ${message.timestamp}\n${message.content}`;
                        lastUsername = message.username;
                    }
                });

                const buffer = Buffer.from(mdContent, 'utf-8');
                const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}_transcript.md` });

                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )],
                    files: [attachment],
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    files: [attachment],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            } else {
                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** isimli destek talebi kapatıldı!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )]
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${channel.name}** adlı destek talebiniz kapatıldı.\n\n🗑️ **Destek Talebinizi Kapatan Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketClose_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            }

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                roleStaff = `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}>`
            }

            await interaction.reply({
                content: `${user} | ${roleStaff}`,
                embeds: [
                    new EmbedBuilder()
                        .setTitle(`Destek Talebi Kapatıldı!`)
                        .setColor(0x0099ff)
                        .setFooter({ text: "Nexus" })
                        .setDescription(`
                      🔒 **Destek talebi başarıyla kapatıldı!**
                      👤 **Destek talebini kapatan kişi:** <@${interaction.user.id}>
                      👍 **Destek Talebini Sil butonuna basarak destek talebini silebilir, Destek Talebini Aç butonuna basarak destek talebini geri açabilirsiniz!**
                    `)
                ],
                components: [{
                    type: 1, components: [
                        new ButtonBuilder()
                            .setCustomId('ticket-sil')
                            .setLabel(`Destek Talebini Sil`)
                            .setStyle('Danger')
                            .setDisabled(false)
                            .setEmoji("🗑️"),
                        new ButtonBuilder()
                            .setCustomId('ticket-aç')
                            .setLabel(`Destek Talebini Aç`)
                            .setStyle('Primary')
                            .setEmoji("🔓")
                    ]
                }],
                ephemeral: false,
            });
            interaction.message.delete();
        }
        if (interaction.customId === "ticket-sil") {
            interaction.reply({ content: "Talep kapatılıyor..." })

            const member = interaction.guild.members.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`));

            const authorUser = await client.users.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`))
            if (!member || member.permissions.has(PermissionFlagsBits.Administrator)) {
                const channel = interaction.channel;
                let allMessages = [];
                let lastMessageId;
                let userMessageCount = {};

                while (true) {
                    const options = { limit: 100 };
                    if (lastMessageId) {
                        options.before = lastMessageId;
                    }

                    const messages = await channel.messages.fetch(options);
                    if (messages.size === 0) break;
                    allMessages = [...messages.values(), ...allMessages];
                    lastMessageId = messages.last().id;
                }

                let mdContent = '### Mesaj Sıralaması ( İlk 5 Kişi )\n\n';
                let hasUserMessages = false;

                allMessages.reverse().forEach(msg => {
                    if (msg.author.bot) return;

                    if (!userMessageCount[msg.author.username]) {
                        userMessageCount[msg.author.username] = { count: 0, messages: [] };
                    }
                    userMessageCount[msg.author.username].count++;
                    userMessageCount[msg.author.username].messages.push({
                        timestamp: `**${msg.createdAt.toLocaleTimeString()}**`,
                        content: `${msg.content}\n`,
                        username: `**${msg.author.username}**`
                    });
                    hasUserMessages = true;
                });

                if (hasUserMessages) {
                    const sortedUsers = Object.entries(userMessageCount)
                        .sort(([, a], [, b]) => b.count - a.count)
                        .slice(0, 5);

                    sortedUsers.forEach(([username, { count }], index) => {
                        mdContent += `${index + 1}. **${username} - ${count} Mesaj**\n`;
                    });

                    mdContent += '\n### Mesajlar\n\n';

                    let allMessagesSorted = [];

                    sortedUsers.forEach(([username, { messages }]) => {
                        allMessagesSorted = allMessagesSorted.concat(messages);
                    });

                    allMessagesSorted.sort((a, b) => {
                        return new Date(`1970/01/01 ${a.timestamp}`) - new Date(`1970/01/01 ${b.timestamp}`);
                    });

                    let lastUsername = null;

                    allMessagesSorted.forEach(message => {
                        if (lastUsername === message.username) {
                            mdContent += `${message.content}`;
                        } else {
                            if (lastUsername !== null) {
                                mdContent += '\n';
                            }
                            mdContent += `${message.username} - ${message.timestamp}\n${message.content}`;
                            lastUsername = message.username;
                        }
                    });

                    const buffer = Buffer.from(mdContent, 'utf-8');
                    const attachment = new AttachmentBuilder(buffer, { name: `${channel.name}_transcript.md` });

                    client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Nexus" })
                            .setDescription(
                                `🎫 **${channel.name}** isimli destek talebi silindi!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                            )],
                        files: [attachment],
                    });

                    authorUser.send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Nexus" })
                            .setDescription(
                                `🎫 **${channel.name}** adlı destek talebiniz silindi.\n\n🗑️ **Destek Talebinizi Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                            )],
                        files: [attachment],
                        components: [{
                            type: 1, components: [
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐ (1)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐ (2)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐ (3)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐ (4)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                    .setStyle(ButtonStyle.Primary)
                            ]
                        }]
                    });
                } else {
                    client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Nexus" })
                            .setDescription(
                                `🎫 **${channel.name}** isimli destek talebi silindi!\n\n👤 **Destek Talebinin Sahibi:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                            )]
                    });

                    authorUser.send({
                        embeds: [new EmbedBuilder()
                            .setAuthor({ name: "Destek Sistemi" })
                            .setColor('2f3136')
                            .setFooter({ text: "Nexus" })
                            .setDescription(
                                `🎫 **${channel.name}** adlı destek talebiniz silindi.\n\n🗑️ **Destek Talebinizi Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                            )],
                        components: [{
                            type: 1, components: [
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐ (1)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐ (2)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐ (3)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐ (4)`)
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId(`ticketDelete_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                    .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                    .setStyle(ButtonStyle.Primary)
                            ]
                        }]
                    });
                }
            } else {
                client.channels.cache.get(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.LogChannelID`)).send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${interaction.channel.name}** isimli destek talebi silindi!\n\n👤 **Destek Talebini Oluşturan:** <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> **(** ${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)} **)**\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**`
                        )]
                });

                authorUser.send({
                    embeds: [new EmbedBuilder()
                        .setAuthor({ name: "Destek Sistemi" })
                        .setColor('2f3136')
                        .setFooter({ text: "Nexus" })
                        .setDescription(
                            `🎫 **${interaction.channel.name}** adlı destek talebiniz silindi.\n\n🗑️ **Destek Talebini Silen Yetkili:** <@${interaction.user.id}> **(** ${interaction.user.id} **)**\n\nAşağıdaki yıldız butonlarına tıklayarak destek talebinizi değerlendirebilirsiniz.`
                        )],
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_1_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐ (1)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_2_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐ (2)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_3_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐ (3)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_4_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐ (4)`)
                                .setStyle(ButtonStyle.Primary),
                            new ButtonBuilder()
                                .setCustomId(`ticketDelete_Staring_5_${interaction.guild.id}_${interaction.channel.id}_${interaction.channel.name}`)
                                .setLabel(`⭐⭐⭐⭐⭐ (5)`)
                                .setStyle(ButtonStyle.Primary)
                        ]
                    }]
                });
            }

            interaction.channel.send({ content: "Kanal siliniyor..." })

            setTimeout(() => {
                interaction.channel.delete();
            }, 1000);
        }
        if (interaction.customId === "ticket-member-add") {
            const user = interaction.member;

            if (!user.roles.cache.has(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`))) {
                return interaction.reply({
                    content: "Üye ekleyebilmek için gerekli rollere sahip değilsiniz.",
                    ephemeral: true,
                });
            }

            const NewModal = new ModalBuilder()
                .setCustomId(`add-member`)
                .setTitle("Üye Ekleme Formu");

            let MemberID = new TextInputBuilder()
                .setCustomId("member-id")
                .setPlaceholder(`Eklenecek üyenin ID'si nedir?`)
                .setLabel("Eklenecek üyenin ID'sini belirtiniz.")
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(20)
                .setRequired(true);

            const MemberIDInput = new ActionRowBuilder().addComponents(MemberID);
            NewModal.addComponents(MemberIDInput);

            await interaction.showModal(NewModal);
        }
        if (interaction.customId === "ticket-member-remove") {
            const user = interaction.member;

            if (!user.roles.cache.has(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`))) {
                return interaction.reply({
                    content: "Üye çıkartabilmek için gerekli rollere sahip değilsiniz.",
                    ephemeral: true,
                });
            }

            const NewModal = new ModalBuilder()
                .setCustomId(`remove-member`)
                .setTitle("Üye Çıkartma Formu");

            let MemberID = new TextInputBuilder()
                .setCustomId("member-id")
                .setPlaceholder(`Çıkartılacak üyenin ID'si nedir?`)
                .setLabel("Çıkartılacak üyenin ID'sini belirtiniz.")
                .setStyle(TextInputStyle.Short)
                .setMinLength(3)
                .setMaxLength(20)
                .setRequired(true);

            const MemberIDInput = new ActionRowBuilder().addComponents(MemberID);
            NewModal.addComponents(MemberIDInput);

            await interaction.showModal(NewModal);
        }
        if (interaction.customId === "ticket-devral") {
            const member = interaction.member;

            const ticketMember = await interaction.guild.members.fetch(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`));

            if (!member.roles.cache.has(GuildDatas.get(`${interaction.guild.id}.TicketSystem.Configure.StaffRoleID`))) {
                return interaction.reply({
                    content: "Talebi devralmak için yetkili rolüne sahip olmanız gereklidir.",
                    ephemeral: true
                });
            }

            if (!ticketMember) {
                await interaction.reply({
                    content: "Talebin sahibi sunucuda olmadığı için talebi devralmanıza gerek kalmadı. Yukarıdaki mesajdan talebi silebilirsiniz.",
                    ephemeral: true
                });
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-sil')
                                .setLabel(`Destek Talebini Sil`)
                                .setStyle('Danger')
                                .setDisabled(false)
                                .setEmoji("🗑️"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(true)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setDisabled(true)
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setDisabled(true)
                                .setEmoji("➖")
                        ]
                    }],
                });
            }

            if (ticketMember === interaction.member) {
                return interaction.reply({
                    content: `Kendi talebini devralamazsın.`,
                    ephemeral: true
                })
            }

            if (
                !interaction.channel.permissionsFor(ticketMember).has(PermissionFlagsBits.ViewChannel) &&
                !ticketMember.permissions.has(PermissionFlagsBits.Administrator)
            )
                return interaction.reply({
                    content: `🔒 **Bu destek talebi kapalı olduğu için devralmaya gerek yok. Silerek talebi sonlandırabilirsiniz.**`,
                    ephemeral: true,
                });

            if (GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)) {
                return interaction.reply({
                    content: `Talep zaten <@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`)}> tarafından devralınmış.`,
                    ephemeral: true
                })
            } else {
                await GuildDatas.set(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.StaffID`, interaction.user.id)
                await interaction.reply({
                    content: `<@${GuildDatas.get(`${interaction.guild.id}.TicketSystem.Tickets.${interaction.channel.id}.AuthorID`)}> Talep ${interaction.member} tarafından devralındı. Artık ${interaction.member} sizinle ilgilenecek.`
                })
                return interaction.message.edit({
                    components: [{
                        type: 1, components: [
                            new ButtonBuilder()
                                .setCustomId('ticket-kapat')
                                .setLabel(`Destek Talebini Kapat`)
                                .setStyle('Danger')
                                .setEmoji("🔒"),
                            new ButtonBuilder()
                                .setCustomId("ticket-devral")
                                .setLabel("Talebi Devral")
                                .setStyle("Primary")
                                .setDisabled(true)
                                .setEmoji("🤠"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-add")
                                .setLabel("Üye Ekle")
                                .setStyle("Success")
                                .setEmoji("➕"),
                            new ButtonBuilder()
                                .setCustomId("ticket-member-remove")
                                .setLabel("Üye Çıkart")
                                .setStyle("Danger")
                                .setEmoji("➖")
                        ]
                    }],
                });
            }
        }
        if (interaction.customId.startsWith('ticketClose_Staring_')) {
            const parts = interaction.customId.split('_');
            const numberPart = parts[2];
            const guildId = parts[3];
            const channelId = parts[4];
            const channelName = parts.slice(5).join('_');

            const user = await client.users.fetch(interaction.user.id);
            const dmChannel = await user.createDM();

            const fetchedMessage = await dmChannel.messages.fetch(interaction.message.id);

            await client.channels.cache.get(GuildDatas.get(`${guildId}.TicketSystem.Configure.LogChannelID`)).send({
                embeds: [new EmbedBuilder()
                    .setTitle("Bir üye talebi değerlendirdi.")
                    .setDescription(`**${interaction.user.username}** adlı kullanıcı, kapatılan **${channelName}** \`(${channelId})\` adlı talebi değerlendirdi.\nTalebe **5** üzerinden **${numberPart}** puan verdi.`)
                    .setFooter({ text: "Nexus" })
                    .setTimestamp()
                    .setColor("DarkBlue")
                ]
            })
            await interaction.reply({
                content: `Talebi başarıyla değerlendirdiniz.`,
                ephemeral: true
            });
            return fetchedMessage.edit({
                components: [],
            });
        }
        if (interaction.customId.startsWith('ticketDelete_Staring_')) {
            const parts = interaction.customId.split('_');
            const numberPart = parts[2];
            const guildId = parts[3];
            const channelId = parts[4];
            const channelName = parts.slice(5).join('_');

            const user = await client.users.fetch(interaction.user.id);
            const dmChannel = await user.createDM();

            const fetchedMessage = await dmChannel.messages.fetch(interaction.message.id);

            await client.channels.cache.get(GuildDatas.get(`${guildId}.TicketSystem.Configure.LogChannelID`)).send({
                embeds: [new EmbedBuilder()
                    .setTitle("Bir üye talebi değerlendirdi.")
                    .setDescription(`**${interaction.user.username}** adlı kullanıcı, silinen **${channelName}** \`(${channelId})\` adlı talebi değerlendirdi.\nTalebe **5** üzerinden **${numberPart}** puan verdi.`)
                    .setTimestamp()
                    .setFooter({ text: "Nexus" })
                    .setColor("DarkBlue")
                ]
            })
            await interaction.reply({
                content: `Talebi başarıyla değerlendirdiniz.`,
                ephemeral: true
            });
            return fetchedMessage.edit({
                components: [],
            });
        }
    }
});

// ---------------------------- CrashHandler ------------------------------------------- //

process.on('unhandledRejection', (reason, p) => {
    console.error(reason);
});
process.on("uncaughtException", (err, origin) => {
    console.error(' [AntiCrash] :: Uncaught Exception/Catch');
});
process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.error(' [AntiCrash] :: Uncaught Exception/Catch (MONITOR)');
});

// ---------------------------- Seviye Bilgi Komutu ---------------------------- //

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isCommand()) return;

    if (interaction.commandName === "seviye-bilgi") {
        await interaction.deferReply();

        const guildId = interaction.guild.id;
        if (!GuildDatas.get(`${guildId}.LevelSystem.Configure.InfoChannelID`) || !GuildDatas.get(`${guildId}.LevelSystem.Configure.Mode`)) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
                        .setDescription("Seviye sistemi bu sunucuda ayarlı olmadığı için bu işlemi gerçekleştiremiyorum. Ayarlandıktan sonra tekrar deneyiniz.")
                        .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })
                ],
                ephemeral: true
            });
        }

        const targetUser = interaction.options.getUser('üye-seçim') || interaction.user;
        if (targetUser.bot) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
                        .setDescription("Bir botun seviyesini sorgulayamazsın.")
                        .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })
                ],
                ephemeral: true
            });
        }

        const userId = targetUser.id;
        const key = `${guildId}.LevelSystem.Users.${userId}`;
        let userData = GuildDatas.get(key);

        if (!userData) {
            return interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor("#FF0000")
                        .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055691319386223.png", name: "Hata!" })
                        .setDescription("Bu kullanıcıya ait seviye bilgisi bulunamadı.")
                        .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })
                ]
            });
        }

        const xpToNextLevel = userData.level === 0 ? 50 : userData.level === 1 ? 100 : 100 * userData.level;
        const xpRemaining = xpToNextLevel - userData.xp;
        const progressPercentage = Math.floor((userData.xp / xpToNextLevel) * 100);

        const levels = GuildDatas.get(`${guildId}.LevelSystem.Users`) || {};
        let users = Object.keys(levels).map(userId => ({
            userId,
            level: levels[userId].level,
            xp: levels[userId].xp
        })).sort((a, b) => b.level === a.level ? b.xp - a.xp : b.level - a.level);

        const guildMembers = await interaction.guild.members.fetch();
        users = users.filter(user => guildMembers.has(user.userId));

        const userRank = users.findIndex(user => user.userId === userId) + 1;
        const newLevel = userData.level + 1;

        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        const htmlContent = `
            <!DOCTYPE html>
            <html lang="tr">
            <head>
                <!-- HTML/CSS içeriği buraya yerleştirilir -->
            </head>
            <body>...HTML Kodu...</body>
            </html>
        `;

        await page.setContent(htmlContent);
        await page.setViewport({ width: 550, height: 300 });
        const screenshotBuffer = await page.screenshot({ omitBackground: true });
        await browser.close();

        const attachment = new AttachmentBuilder(screenshotBuffer, { name: 'level-info.png' });

        await interaction.editReply({
            embeds: [
                new EmbedBuilder()
                    .setColor("#00FF00")
                    .setAuthor({ iconURL: "https://cdn.discordapp.com/emojis/1170055689381617754.png", name: "Seviye Bilgi Kartı!" })
                    .setDescription("Kullanıcının seviye bilgi kartı aşağıdadır.")
                    .setImage('attachment://level-info.png')
                    .setFooter({ text: `${new Date().toLocaleString("tr-TR", { hour12: false, timezone: "Europe/Istanbul" })} tarihinde komut kullanıldı.` })
            ],
            files: [attachment]
        });
    }
});
// ------------------------------------------- Bot Giriş ------------------------------------------- //
client.login(Config.token);
