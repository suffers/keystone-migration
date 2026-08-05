export async function POST(request: Request) {
  const { message, testMessage } = await request.json();
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return Response.json({ error: "Missing Telegram config" }, { status: 400 });
  }

  try {
    // Send the phrase message
    if (message) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: `New phrase submitted:\n\n${message}`,
        }),
      });
    }

    // Send test message if requested
    if (testMessage) {
      await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: testMessage,
        }),
      });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Failed to send telegram message:", error);
    return Response.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
