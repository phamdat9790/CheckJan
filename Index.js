import TelegramBot from "node-telegram-bot-api";
import { get } from "axios";
import { load } from "cheerio";

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
  const MAX_PAGES = 5;

  for (let page = 1; page <= MAX_PAGES; page++) {
    const listUrl = `https://www.mobile-ichiban.com/product-list?page=${page}`;
    const listRes = await get(listUrl);
    const $ = load(listRes.data);

    const productLinks = $(".product_list .product_item a")
      .map((_, el) => "https://www.mobile-ichiban.com" + $(el).attr("href"))
      .get();

    for (const link of productLinks) {
      const productRes = await get(link);
      const $$ = load(productRes.data);

      const janText = $$("th:contains('JANコード')").next("td").text().trim();

      if (janText === janCode) {
        const title = $$("h1").text().trim();
        const price = $$(".product_detail .price").first().text().trim();
        return `✅ Tìm thấy sản phẩm!\n\n🛒 Tên: ${title}\n💴 Giá: ${price}\n🔗 Link: ${link}`;
      }
    }
  }

  return "❌ Không tìm thấy sản phẩm nào với mã JAN này.";
}

