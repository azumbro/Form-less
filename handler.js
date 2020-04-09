const helpers = require('./helpers')

module.exports.handleForm = (event, context, callback) => {
  let postOrigin = event.headers.origin
  let postURL = event.headers.Referer
  let postData = helpers.parseFormData(event.body)
  let formName = postData._formname
  let email = postData._email
  let replyEmail = postData.Email
  let redirectURL = postData._redirect
  let response = {
    statusCode: 200
  }
  let config = helpers.validateAndFetchEnvVariables()
  if(config.valid && email && redirectURL) {
    if(config.allowAllDomains || config.allowedDomains.includes(postOrigin)) {
      let html = helpers.getEmailHeader(formName, postURL)
      html += helpers.handleFormFields(postData)
      helpers.sendMail(email, formName, replyEmail, html, config, err => {
        if(err) {
          response.statusCode = 500
          console.log("Error: Issue in sendMail.")
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
      console.log("Authentication Error: Domain not authorized in ALLOWED_DOMAINS.")
      console.log(postData)
      callback(null, response)
    }
  }
  else {
    response.statusCode = 400
    if(!email) {
      console.log("Input Error: No _email field specified in form.")
      console.log(postData)
    }
    if(!redirectURL) {
      response.statusCode = 400
      console.log("Input Error: No _redirect field specified in form.")
      console.log(postData)
    }
    else if(!config.valid) {
      response.statusCode = 500
      console.log("Config Error: " + config.reason)
      console.log(postData)
    }
    callback(null, response)
  }
}
