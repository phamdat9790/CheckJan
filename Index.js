const TelegramBot = require('node-telegram-bot-api');
const axios = require('axios');
const cheerio = require('cheerio');

const token = process.env.BOT_TOKEN; // Lấy token từ biến môi trường
const bot = new TelegramBot(token, { polling: true });

bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const jan = msg.text.trim();

  if (!/^\d{8,13}$/.test(jan)) {
    return bot.sendMessage(chatId, '⚠️ Vui lòng nhập đúng mã JAN (8-13 chữ số).');
  }

  const info = await searchProduct(jan);
  bot.sendMessage(chatId, info);
});

async function searchProduct(janCode) {
  try {
    const url = `https://www.mobile-ichiban.com/product-list?keyword=${janCode}`;
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);

    const firstItem = $('.product_list .product_item').first();

    if (!firstItem.length) return '❌ Không tìm thấy sản phẩm nào với mã JAN này.';

    const title = firstItem.find('h2').text().trim();
    const price = firstItem.find('.price').text().trim();

    return `🔍 Sản phẩm: ${title || 'Không rõ'}\n💴 Giá: ${price || 'Không có thông tin'}\n🔗 Link: ${url}`;
  } catch (err) {
    console.error(err);
    return '❌ Lỗi khi tìm kiếm sản phẩm.';
  }
}
