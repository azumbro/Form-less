const mailgunJS = require('mailgun-js')
const nodemailer = require("nodemailer")

module.exports = {
    validateAndFetchEnvVariables,
    getEmailHeader,
    handleFormFields,
    parseFormData,
    sendMail
}

function checkAllowedDomains(config) {
    if(process.env.ALLOWED_DOMAINS
        && process.env.ALLOWED_DOMAINS.length > 0) {
            const allowedDomains = process.env.ALLOWED_DOMAINS.replace(/ /g,"").split(",")
            if(allowedDomains.length > 0) {
                config.allowedDomains = allowedDomains
            }
            else {
                config.valid = false
                config.reason = `ALLOW_ALL_DOMAINS doesn't exist or set to 'no' and ALLOWED_DOMAINS doesn't exist or is invalid.`
            }
    }
    else {
        config.valid = false
        config.reason = `ALLOW_ALL_DOMAINS doesn't exist or set to 'no' and ALLOWED_DOMAINS doesn't exist or is invalid.`
    }
    return config
}

function validateAndFetchEnvVariables(config) {
    config = {
        valid: true
    }
    if(process.env.ALLOW_ALL_DOMAINS
        && process.env.ALLOW_ALL_DOMAINS.length > 0) {
        if(process.env.ALLOW_ALL_DOMAINS == "yes") {
            config.allowAllDomains = true
        }
        else if(process.env.ALLOW_ALL_DOMAINS == "no") {
            config.allowAllDomains = false
            config = checkAllowedDomains(config)
        }
        else {
            config.valid = false
            config.reason = `ALLOW_ALL_DOMAINS must be set to "yes" or "no".`
        }
    }
    else {
        config.allowAllDomains = false
        config = checkAllowedDomains(config)
    }
    if(config.valid) {
        if(process.env.MAILGUN_API_KEY 
            && process.env.MAILGUN_API_KEY.length > 0
            && process.env.MAILGUN_FROM_EMAIL 
            && process.env.MAILGUN_FROM_EMAIL.length > 0
            && process.env.MAILGUN_DOMAIN 
            && process.env.MAILGUN_DOMAIN.length > 0) {
            config.method = 1
            config.mailgunAPIKey = process.env.MAILGUN_API_KEY
            config.mailgunFromEmail = process.env.MAILGUN_FROM_EMAIL
            config.mailgunDomain = process.env.MAILGUN_DOMAIN
        }
        else if(process.env.SMTP_SERVER && process.env.SMTP_SERVER.length > 0
            && process.env.SMTP_EMAIL && process.env.SMTP_EMAIL.length > 0
            && process.env.SMTP_USER && process.env.SMTP_USER.length > 0
            && process.env.SMTP_PASSWORD && process.env.SMTP_PASSWORD.length > 0
            && process.env.SMTP_PORT && process.env.SMTP_PORT.length > 0) {
            config.method = 2
            config.smtpServer = process.env.SMTP_SERVER
            config.smtpEmail = process.env.SMTP_EMAIL
            config.smtpUser = process.env.SMTP_USER
            config.smtpPassword = process.env.SMTP_PASSWORD
            config.smtpPort = parseInt(process.env.SMTP_PORT)
        }
        else {
            config.valid = false
            config.reason = `No valid email system configuration.`
        }
    }
    return config
}

function getEmailHeader(formName, postURL) {
    const date = (new Date)
    const dateString = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear()  
    let html = `
        <h2>New Form Submission ${(formName ? " for " + formName : (postURL ? " for " + postURL : ""))}</h2>
      `
      if(formName && postURL) {
        html += `
          <b>Form URL:</b> ${postURL}<br>
        `
      }
      html += `
        <b>Date:</b> ${dateString} (UTC)<br><br>
      `
      return html
}

function handleFormFields(postData) {
    let html = `
        <table style="width: 100%; padding: 1opx; border: 1px solid #ddd;  text-align: left; border-collapse: collapse;">
            <tr>
                <th style="padding: 10px; border: 1px solid #ddd;  text-align: left;">Field</th>
                <th style="padding: 10px; border: 1px solid #ddd;  text-align: left;">Value</th>
            </tr>
    `
    Object.keys(postData)
        .filter(key => key[0] != "_")
        .forEach(key => {
            html += `
                <tr>
                    <td style="padding: 10px; border: 1px solid #ddd;  text-align: left;">${key}</td>
                    <td style="padding: 10px; border: 1px solid #ddd;  text-align: left;">${postData[key]}</td>
                </tr>
            `
        })
    html += `
        </table>
    `
    return html
}

function parseFormData(data) {
    const postData = {}
    for(const item of data.split("&")) {
        const itemParts = item.split("=")
        postData[itemParts[0]] = decodeURIComponent(itemParts[1].replace(/\+/g, '%20'))
    }
    console.log(`POST Data - ${postData}`)
    return postData
}

function sendMail(toEmail, formName, replyEmail, messageHTML, config, callback) {
    const subject = `A New Form Submission Has Arrived ${(formName ? " - "  + formName : "")} (${new Date().toLocaleString()})`
    if(config.method == 1) {
        const mailgun = new mailgunJS({ 
            apiKey: config.mailgunAPIKey, 
            domain: config.mailgunDomain 
        })
        const emailConfig = {
            to: toEmail,
            from: config.mailgunFromEmail,
            subject: subject,
            html: messageHTML,
        }
        if(replyEmail) {
            emailConfig["h:Reply-To"] = replyEmail
        }
        mailgun.messages().send(emailConfig, (err, body) => {
            if(body) {
                console.log(`Data returned from mailgun.messages().send - ${body}`)
            }
            return(callback(err))
        })
    }
    else if(config.method == 2) {
        const transporter = nodemailer.createTransport({
            host: config.smtpServer,
            port: config.smtpPort,
            secure: true,
            auth: {
                user: config.smtpUser,
                pass: config.smtpPassword
            }
        })
        const emailConfig = {
            from: config.smtpEmail,
            to: toEmail,
            subject,
            html: messageHTML
        }
        transporter.sendMail(emailConfig, (err, info) => {
            if(info) {
                console.log(`Data returned from SMTP call - ${info}`)
            }
            return(callback(err))
        })
    }
}