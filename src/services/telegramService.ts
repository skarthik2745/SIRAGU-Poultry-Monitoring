// All Telegram API calls are proxied through the Express backend to bypass browser CORS restrictions.
// Backend endpoints: GET /api/telegram/updates  and  POST /api/telegram/send

const CHAT_ID_STORAGE_KEY = 'poultryguard_telegram_chat_id';

// Backend base URL — same origin when running via Vite proxy, or localhost:5000
const API_BASE = 'http://localhost:5000';

export interface TelegramAlertPayload {
  severity: 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED';
  sensor: string;
  title: string;
  message: string;
  value?: string;
  threshold?: string;
  zone?: string;
  timestamp?: string;
  actionRequired?: string;
}

class TelegramService {
  private targetChatId: string | null = '1475583718';
  private lastAlertTimes: { [key: string]: number } = {};

  constructor() {
    // Load persisted chat ID from localStorage, sanitize away invalid old ID
    const savedChatId = localStorage.getItem(CHAT_ID_STORAGE_KEY);
    if (savedChatId && savedChatId !== '5044522382' && savedChatId.trim().length > 0) {
      this.targetChatId = savedChatId;
    } else {
      this.targetChatId = '1475583718';
      localStorage.setItem(CHAT_ID_STORAGE_KEY, '1475583718');
    }
    console.log('[Telegram] Active Chat ID:', this.targetChatId);
    // Auto-discover chat_id from anyone who sent /start
    this.autoDiscoverChatId();
  }

  public setChatId(chatId: string) {
    this.targetChatId = chatId.trim();
    localStorage.setItem(CHAT_ID_STORAGE_KEY, this.targetChatId);
    console.log('[Telegram] Chat ID set to:', this.targetChatId);
  }

  public getChatId(): string | null {
    return this.targetChatId;
  }

  /**
   * Calls backend proxy to get Telegram updates and extract the latest chat_id
   */
  public async autoDiscoverChatId(): Promise<string | null> {
    try {
      const res = await fetch(`${API_BASE}/api/telegram/updates`);
      const data = await res.json();

      if (data.ok && data.result && data.result.length > 0) {
        for (let i = data.result.length - 1; i >= 0; i--) {
          const update = data.result[i];
          const chatId =
            update.message?.chat?.id ||
            update.channel_post?.chat?.id ||
            update.callback_query?.message?.chat?.id;
          if (chatId) {
            const idStr = String(chatId);
            if (idStr !== this.targetChatId) {
              this.setChatId(idStr);
              console.log('[Telegram] Auto-discovered Chat ID:', idStr);
            }
            return idStr;
          }
        }
      }
    } catch (err) {
      console.warn('[Telegram] Auto-discovery failed (backend may not be running):', err);
    }
    return this.targetChatId;
  }

  /**
   * Format and send a beautifully structured alert message via backend proxy
   */
  public async sendAlert(alert: TelegramAlertPayload): Promise<{ success: boolean; error?: string }> {
    const alertKey = `${alert.sensor}_${alert.title}`;
    const now = Date.now();

    // Debounce: don't spam the same alert within 30 seconds
    if (this.lastAlertTimes[alertKey] && now - this.lastAlertTimes[alertKey] < 30000) {
      return { success: false, error: 'Debounced duplicate alert' };
    }
    this.lastAlertTimes[alertKey] = now;

    // Ensure we have a chat ID
    if (!this.targetChatId) {
      await this.autoDiscoverChatId();
    }

    if (!this.targetChatId) {
      console.warn('[Telegram] No Chat ID available. Please send /start to your bot first!');
      return { success: false, error: 'No Chat ID found. Please send /start to @AN2745Bot in Telegram!' };
    }

    const timeString = alert.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

    // Header emoji & severity tag
    let headerEmoji = 'ℹ️';
    let severityTag = 'SYSTEM NOTIFICATION';
    if (alert.severity === 'CRITICAL') {
      headerEmoji = '🚨';
      severityTag = 'EMERGENCY CRITICAL HAZARD';
    } else if (alert.severity === 'WARNING') {
      headerEmoji = '⚠️';
      severityTag = 'THRESHOLD EXCEEDED — ATTENTION REQUIRED';
    } else if (alert.severity === 'RESOLVED') {
      headerEmoji = '✅';
      severityTag = 'STATUS RESTORED TO NORMAL';
    }

    const formattedMessage = `
${headerEmoji} <b>[POULTRYGUARD AI — ${severityTag}]</b> ${headerEmoji}
━━━━━━━━━━━━━━━━━━━━━━━
📍 <b>Alert:</b> <code>${alert.title}</code>
🏷 <b>Sensor / Node:</b> <b>${alert.sensor}</b>
${alert.zone ? `🗺 <b>Monitored Sector:</b> <i>${alert.zone}</i>\n` : ''}${alert.value ? `📊 <b>Current Reading:</b> <code>${alert.value}</code>\n` : ''}${alert.threshold ? `🎯 <b>Threshold Limit:</b> <code>${alert.threshold}</code>\n` : ''}━━━━━━━━━━━━━━━━━━━━━━━
📝 <b>Diagnostic Details:</b>
${alert.message}

${alert.actionRequired ? `🎯 <b>Prescribed Remediation Action:</b>\n👉 <i>${alert.actionRequired}</i>\n\n` : ''}⏰ <b>Timestamp:</b> ${dateString} at ${timeString}
⚡ <i>PoultryGuard IoT Telemetry Engine</i>
    `.trim();

    try {
      const res = await fetch(`${API_BASE}/api/telegram/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: this.targetChatId,
          text: formattedMessage,
          parse_mode: 'HTML',
        }),
      });

      const json = await res.json();
      if (json.ok) {
        console.log('✅ [Telegram] Alert sent successfully to Chat ID:', this.targetChatId);
        return { success: true };
      } else {
        console.error('❌ [Telegram] API Error:', json);
        return { success: false, error: json.description || json.error || 'Telegram API error' };
      }
    } catch (err: any) {
      console.error('❌ [Telegram] Network request failed:', err);
      return { success: false, error: err.message || 'Cannot reach backend server' };
    }
  }

  /**
   * Send a test verification alert
   */
  public async sendTestPing(chatId?: string): Promise<{ success: boolean; message: string }> {
    if (chatId && chatId.trim()) {
      this.setChatId(chatId.trim());
    }

    if (!this.targetChatId) {
      const discovered = await this.autoDiscoverChatId();
      if (!discovered) {
        return {
          success: false,
          message: '❌ No chat detected. Please open Telegram, search for @AN2745Bot, and send /start, then click Send Test Alert again.',
        };
      }
    }

    const testAlert: TelegramAlertPayload = {
      severity: 'INFO',
      sensor: 'ESP32 GATEWAY',
      title: '✅ Telegram Alert Bridge Connected',
      message: 'Your Telegram bot is now successfully paired with PoultryGuard AI! All critical hazard thresholds, fire alerts, gas toxicity spikes, and security breaches will be delivered here in real-time.',
      value: 'Online — Backend Proxy Active',
      threshold: 'Real-Time Webhook Enabled',
      zone: 'All Zones — System Broadcast',
      actionRequired: 'No action needed. System is nominal and monitoring is active.',
    };

    // Bypass debounce for test ping
    const alertKey = `${testAlert.sensor}_${testAlert.title}`;
    delete this.lastAlertTimes[alertKey];

    const result = await this.sendAlert(testAlert);
    if (result.success) {
      return {
        success: true,
        message: `✅ Test alert sent successfully to Telegram Chat ID: ${this.targetChatId}! Check your Telegram app now.`,
      };
    } else {
      return {
        success: false,
        message: `❌ Failed to send: ${result.error || 'Unknown error'}. Please send /start to @AN2745Bot in Telegram!`,
      };
    }
  }
}

export const telegramService = new TelegramService();
