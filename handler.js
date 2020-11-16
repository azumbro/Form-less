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
      let html = helpers.getEmailHeader(formName, postURL)
      html += helpers.handleFormFields(postData)
      helpers.sendMail(email, formName, replyEmail, html, config, err => {
        if(err) {
          response.statusCode = 500
          console.log(`Error: Issue in sendMail.`)
          console.log(err)
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
      console.log(`Authentication Error: Domain not authorized in ALLOWED_DOMAINS.`)
      console.log(postData)
      callback(null, response)
    }
  }
  else {
    response.statusCode = 400
    if(!email) {
      console.log(`Input Error: No _email field specified.`)
      console.log(postData)
    }
    if(!redirectURL) {
      response.statusCode = 400
      console.log(`Input Error: No _redirect field specified.`)
      console.log(postData)
    }
    else if(!config.valid) {
      response.statusCode = 500
      console.log(`Config Error: ${config.reason}`)
      console.log(postData)
    }
    callback(null, response)
  }
}
