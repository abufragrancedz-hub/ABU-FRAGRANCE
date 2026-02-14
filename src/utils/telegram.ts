import { Order } from '../types';

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN || "YOUR_TELEGRAM_BOT_TOKEN";
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID || "YOUR_CHAT_ID";

export const sendOrderToTelegram = async (order: Order) => {
    if (BOT_TOKEN === "YOUR_TELEGRAM_BOT_TOKEN" || !BOT_TOKEN) {
        console.warn("Telegram Bot Token not set. Check your .env file.");
        return false;
    }
    console.log("Sending Telegram message with token:", BOT_TOKEN.slice(0, 5) + "...");

    const itemsList = order.items.map((item, index) =>
        `${index + 1}. *${item.name}*\n   Quantity: ${item.quantity}\n   Size: ${item.selectedSize || 'Standard'}\n   Price: ${item.finalPrice} DZD`
    ).join('\n\n');

    const message = `
📦 *NEW ORDER #${order.id.slice(0, 8)}*
----------------------------
👤 *Customer*: ${order.customer.fullName}
📱 *Phone*: ${order.customer.phone}
📍 *Address*: ${order.customer.address}
🏙 *Location*: ${order.customer.commune}, ${order.customer.wilaya}

🛒 *Items*:
${itemsList}

🚚 *Delivery*: ${order.deliveryFee} DZD
💰 *TOTAL*: ${order.total} DZD
----------------------------
📅 ${new Date(order.date).toLocaleString()}
  `;

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn(`Telegram API Error: ${response.status} ${response.statusText} (Token might be invalid)`);
            return false;
        }

        return response.ok;
    } catch (error) {
        console.error("Failed to send to Telegram", error);
        return false;
    }
};
