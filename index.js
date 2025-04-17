const TelegramBot = require("node-telegram-bot-api");
const axios = require("axios");
const cheerio = require("cheerio");

const token = process.env.BOT_TOKEN; 
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
  let found = false;
  let text = "Null";

  for (let i = 1; i <= 4; i++) {
    const url = `https://www.mobile-ichiban.com/Prod/${i}`;
    const res = await axios.get(url);
    const $ = cheerio.load(res.data);

    $(".card-body .text-center").each((_, el) => {
      if (found) return; // Nếu đã tìm thấy thì không xử lý tiếp

      const item = $(el);
      text = item.text().trim();
      const janMatch = text.match(/JAN:(\d{8,13})/);

      if (janMatch) {
        const foundJanCode = janMatch[1];
        if (foundJanCode === janCode) {
          const name = item.find('label[data-original-title]').attr('data-original-title') || "Không có tên sản phẩm";
          const price = item.find('.badge-warning').text().trim() || "Giá liên hệ";
          const relativeLink = item.find("a").attr("href") || "";
          const fullLink = "https://www.mobile-ichiban.com" + relativeLink;

          results.push(`✅ Tìm thấy:\n🛒 ${name}\n💴 ${price}\n🔗 ${fullLink}`);
          found = true;
        }
      }
    });

    if (found) break; // Thoát khỏi vòng lặp sau khi tìm thấy
  }

  if (results.length > 0) {
    return results.join("\n\n");
  } else {
    return "❌ Không tìm thấy sản phẩm nào với mã JAN này." + text;
  }
}


