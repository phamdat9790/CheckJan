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

  bot.sendMessage(chatId, `🔎 Đang tìm sản phẩm với mã JAN: ${janCode}  ... Vui lòng chờ.`);

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
  const payload = new URLSearchParams();
  payload.append("g01ListOrImg", "1");
  payload.append("g01Search", janCode);

  const response = await axios.post(
    "https://www.mobile-ichiban.com",
    payload,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
      },
    }
  );
  const html = response.data;
  const $ = cheerio.load(html);
  $(".card-body").each((i, el) => {
    const item = $(el);
    let text = item.text().trim(); // Dùng let thay vì const
    text = text.replace(/\s{2,}/g, '\n');
    
    if (text.includes(janCode)) {
      results.push(`✅ Tìm thấy sản phẩm: \n🛒 ${text}`);
    }
    
  });

  if (results.length > 0) {
    return results.join("\n\n");
  } else {
    return "❌ Không tìm thấy sản phẩm nào với mã JAN: " + janCode;
  }
}


