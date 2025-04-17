const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");

const token = process.env.BOT_TOKEN; // Đặt token bot Telegram vào biến môi trường
const bot = new TelegramBot(token, { polling: true });

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const janCode = msg.text.trim();

  if (!/^\d{8,13}$/.test(janCode)) {
    return bot.sendMessage(chatId, "⚠️ Vui lòng nhập đúng mã JAN (8-13 chữ số).");
  }

  bot.sendMessage(chatId, `🔎 Đang tìm sản phẩm với mã JAN: ${janCode}... Vui lòng chờ.`);

  try {
    const result = await searchProductByJan(janCode);
    bot.sendMessage(chatId, result);
  } catch (err) {
    console.error(err);
    bot.sendMessage(chatId, "❌ Lỗi xảy ra khi tìm kiếm sản phẩm.");
  }
});


async function searchProductByJan(janCode) {
  const results = [];
  
  for (let i = 1; i <= 4; i++) {
    const url = `https://www.mobile-ichiban.com/Prod/${i}`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    $(".product_list .product_item").each((_, el) => {
      const item = $(el);
      const text = item.text();
      
      // Kiểm tra nếu chứa mã JAN
      if (text.includes(janCode)) {
        const name = item.find(".product_name").text().trim();
        const price = item.find(".price").text().trim();
        const relativeLink = item.find("a").attr("href");
        const fullLink = "https://www.mobile-ichiban.com" + relativeLink;

        results.push(`✅ Tìm thấy:\n🛒 ${name}\n💴 ${price}\n🔗 ${fullLink}`);
      }
    });
  }

  if (results.length > 0) {
    return results.join("\n\n");
  } else {
    return "❌ Không tìm thấy sản phẩm nào với mã JAN này.";
  }
}

