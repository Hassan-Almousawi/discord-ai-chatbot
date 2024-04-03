const { Client, GatewayIntentBits, MessageAttachment } = require('discord.js');
const { Hercai } = require('hercai');
const Tesseract = require('tesseract.js');
const fetch = require('node-fetch');
const { allowed_channel_ids, token, image2textChannels } = require('./config.json');

const herc = new Hercai();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`bot is ready! ${client.user.tag}!`);
  console.log(`Code by Wick Studio`);
  console.log(`discord.gg/wicks`);
});

async function extractTextFromImage(url) {
  try {
    const image = await fetch(url).then(res => res.buffer());
    const textFromImage = await Tesseract.recognize(image, 'eng');
    return textFromImage.data.text;
  } catch (error) {
    console.error(error);
    throw new Error('Failed to extract text from the image.');
  }
}

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const isAllowedChannel = allowed_channel_ids.includes(message.channel.id);
  const isImageChannel = image2textChannels.includes(message.channel.id);

  if (!isAllowedChannel && !isImageChannel) return;

  let fullContent = message.content;

  if (message.attachments.size > 0 && isImageChannel) {
    const attachment = message.attachments.first();
    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
      try {
        const extractedText = await extractTextFromImage(attachment.url);
        await message.reply(`Extracted Text: ${extractedText}`);
      } catch (error) {
        console.error(error);
        await message.reply('Sorry, I had trouble reading that image.');
      }
    }
    return;
  }

  if (message.attachments.size > 0 && isAllowedChannel) {
    const attachment = message.attachments.first();
    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
      try {
        const textFromImage = await extractTextFromImage(attachment.url);
        fullContent += ` [Image Content: ${textFromImage}]`;
      } catch (error) {
        console.error(error);
        await message.reply('Sorry, I had trouble reading that image.');
      }
    }
  }

  try {
    const response = await herc.question({ model: "v3-beta", content: fullContent });
    await message.reply(response.reply);
  } catch (error) {
    console.error(error);
    await message.reply('Sorry, I ran into a bit of trouble trying to respond.');
  }
});

client.login(token);
