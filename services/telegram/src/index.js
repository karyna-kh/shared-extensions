const API_BASE_URL = 'https://api.telegram.org'

const logger = {
  info: (...args) => console.log('[Telegram Service] info:', ...args),
  debug: (...args) => console.log('[Telegram Service] debug:', ...args),
  error: (...args) => console.log('[Telegram Service] error:', ...args),
  warn: (...args) => console.log('[Telegram Service] warn:', ...args),
}

class ResponseError extends Error {
  constructor(message, httpStatusCode, data) {
    super(message)

    this.message = message
    this.httpStatusCode = httpStatusCode
    this.data = data
  }

  toJSON() {
    return {
      message: this.message,
      httpStatusCode: this.httpStatusCode,
      data: this.data,
    }
  }
}

/**
 * @integrationName Telegram
 * @integrationIcon /icon.png
 * @integrationTriggersScope SINGLE_APP
 */
class Telegram {

  constructor(config) {
    this.botToken = config.botToken
  }

  async #apiRequest({ url, method, body, query, logTag }) {
    method = method || 'get'
    query = cleanupObject(query)

    try {
      logger.debug(`${ logTag } - api request: [${ method }::${ url }] q=[${ JSON.stringify(query) }]`)

      return await Backendless.Request[method](url).query(query).send(body)
    } catch (error) {
      if (typeof error.body === 'object') {
        error = new ResponseError(
          `Telegram Error: [${ error.body.error_code }] ${ error.body.description }`,
          null,
          error.body
        )
      }

      logger.error(`${ logTag } - error: ${ error.message }`)

      throw error
    }
  }

  /**
   * @operationName Send Message
   * @category Messaging
   * @appearanceColor #0088CC #54A9EB
   * @description Sends a text message to a specified chat, group, or channel.
   * @route POST /send-message
   * @paramDef {"type":"String","label":"Chat ID","name":"chatId","required":true,"description":"Unique identifier for the target chat, group, or channel."}
   * @paramDef {"type":"String","label":"Message Text","name":"text","required":true,"uiComponent":{"type":"MULTI_LINE_TEXT"},"description":"Text of the message to be sent."}
   * @paramDef {"type":"String","label":"Parse Mode","name":"parseMode","uiComponent":{"type":"DROPDOWN","options":{"values":["","Markdown","MarkdownV2","HTML"]}},"description":"Mode for parsing entities in the message text."}
   * @paramDef {"type":"Boolean","label":"Disable Web Page Preview","name":"disableWebPagePreview","uiComponent":{"type":"TOGGLE"},"description":"Disables link previews for links in this message."}
   * @paramDef {"type":"Boolean","label":"Disable Notification","name":"disableNotification","uiComponent":{"type":"TOGGLE"},"description":"Sends the message silently without notification."}
   * @paramDef {"type":"Number","label":"Reply to Message ID","name":"replyToMessageId","description":"If the message is a reply, ID of the original message."}
   * @returns {Object}
   * @sampleResult {"message_id":123,"from":{"id":123456789,"is_bot":true,"first_name":"BotName"},"chat":{"id":-1001234567890,"title":"Test Group","type":"supergroup"},"date":1642781234,"text":"Hello from Telegram!"}
   */
  async sendMessage(chatId, text, parseMode, disableWebPagePreview, disableNotification, replyToMessageId) {
    const messageData = {
      chat_id: chatId,
      text: text,
    }

    if (parseMode) messageData.parse_mode = parseMode
    if (disableWebPagePreview) messageData.disable_web_page_preview = disableWebPagePreview
    if (disableNotification) messageData.disable_notification = disableNotification
    if (replyToMessageId) messageData.reply_to_message_id = replyToMessageId

    return this.#apiRequest({
      url: `${ API_BASE_URL }/bot${ this.botToken }/sendMessage`,
      method: 'post',
      body: messageData,
      logTag: 'sendMessage',
    })
  }

}

Backendless.ServerCode.addService(Telegram, [
  {
    name: 'botToken',
    displayName: 'Bot Token',
    type: Backendless.ServerCode.ConfigItems.TYPES.STRING,
    required: true,
    hint: 'Your Telegram Bot Token. Get it from @BotFather on Telegram by creating a new bot.',
  },
])

function cleanupObject(data) {
  if (!data) {
    return
  }

  Object.keys(data).forEach(key => {
    if (data[key] === undefined || data[key] === null) {
      delete data[key]
    }
  })

  return data
}
