const helpers = require('./helpers')

module.exports.handleForm = (event, context, callback) => {
  const postOrigin = event.headers.origin
  const postURL = event.headers.Referer
  const postData = helpers.parseFormData(event.body)
  const formName = postData._formname
  const email = postData._email
  const replyEmail = postData.Email
  const redirectURL = postData._redirect
  const response = {
    statusCode: 200
  }
  const config = helpers.validateAndFetchEnvVariables()
  if(config.valid && email && redirectURL) {
    if(config.allowAllDomains || config.allowedDomains.includes(postOrigin)) {
      const html = helpers.getEmailHeader(formName, postURL) + helpers.handleFormFields(postData)
      helpers.sendMail(email, formName, replyEmail, html, config, err => {
        if(err) {
          response.statusCode = 500
          console.error(`Error: Issue in sendMail.`)
          console.info(`sendMail Error - ${err}.`)
        }
        if(redirectURL) {
          response.statusCode = 301
          response.headers = {
            "Location": redirectURL,
          }
        }
        callback(null, response)
      })
    }
    else {
      response.statusCode = 401
      console.error(`Authentication Error: Domain not authorized in ALLOWED_DOMAINS.`)
      callback(null, response)
    }
  }
  else {
    if(!email) {
      response.statusCode = 400
      console.error(`Input Error: No _email field specified.`)
    }
    else if(!redirectURL) {
      response.statusCode = 400
      console.error(`Input Error: No _redirect field specified.`)
    }
    else if(!config.valid) {
      response.statusCode = 500
      console.error(`Config Error: ${config.reason}`)
    }
    callback(null, response)
  }
}
