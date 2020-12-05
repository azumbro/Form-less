<p align="center">
    <img src="https://zumbro.me/assets/images/Form-lessLogo.png" width="40%;" style="margin: 0 auto;">
</p>

An AWS Lambda function for processing HTML forms without the need to write backend code. This works by generating an email report for each form submission based off of the form field names and user submitted values.

# Usage
### Initial Setup
- Run ```npm install``` to pull in the required node packages.
- Form-less uses the [Serverless framework](https://serverless.com/) to simplify the AWS deployment process. To setup Serverless with your AWS account, follow the steps from their [tutorial](https://serverless.com/framework/docs/providers/aws/guide/credentials/) (note that the Serverless module is already added in the provided ```package.json``` file).

### Configuration & Deploy
- Before deploying to AWS using Serverless, configurations values need to be added in ```servereless.yml``` for the form handler. These configuration options are:
    - ALLOW_ALL_DOMAINS: Specifies whether or not all domains can POST forms to the form handler. Must be set to ```"yes"``` or ```"no"```.
    - ALLOWED_DOMAINS: Specifies specific domains that can POST forms to the form handler. Is only considered if ALLOW_ALL_DOMAINS is set to ```"no"```. Multiple domain names can be added by separating them with a comma (eg, ```"https://domain1.com/, https://domain2.com/"```)
    - Mailgun Fields: Form-less supports sending submission emails using the [Mailgun](https://www.mailgun.com/) email service. To enable Mailgun, set ```MAILGUN_API_KEY``` to an API key for the Mailgun service, ```MAILGUN_FROM_EMAIL``` to the address the submission emails should appear to come from, and ```MAILGUN_DOMAIN``` to the domain you have connected to Mailgun.
    - SMTP Fields: As as alternative to Mailgun, Form-less also supports sending submission emails over SMTP. To use this method, set ```SMTP_SERVER``` to the address for an SMTP email server, ```SMTP_EMAIL``` to an email address on the SMTP server, ```SMTP_PASSWORD``` to the password associated with the email address, and ```SMTP_PORT``` to the correct port for sending SMTP mail through the server.
-   Once the configuration values are set, the Lambda function can now be deployed to AWS with the ```serverless --deploy``` command. Running this command will output an endpoint URL that will be needed during form setup below.

### Form Setup
- Once the Lambda function has been deployed, it can now be used in an HTML form. For the form to be processed correctly, the following format should be used:
    - The ```action``` attribute for the form should be set to the endpoint output from the ```serverless --deploy``` command, and the ```method``` attribute should be set to ```POST```.
    - The form should have a hidden field named ```_email``` that specifies the email address to send form submissions.
    - The form should have a hidden field named ```_redirect``` that specifies a URL to redirect the user to after the form is submitted.
    - The form can optionally have a hidden field named ```_formname``` that (if provided) will be used to identify the form in the submission email.
    - The ```name``` attributes for each form field will be used to identify them in the submission email, so it is advisable to give fields a descriptive name.
    - If there is a field with the ```name``` attribute set to ```Email```, the value entered by the user into this field will be used as the reply-to address for the submission email.

- Example of a simple contact form:

```
<form action="[LAMBDA_ENDPOINT_GOES_HERE]" method="POST">
    <input type="hidden" name="_redirect" value="https://example.com/contact-success-page">
    <input type="hidden" name="_email" value="formsubmissionreceiver@example.com">
    <input type="hidden" name="_formname" value="Example.com Contact Form">
    <label for="Name">Name</label>
    <input type="text" name="Name" required>
    <label for="Email">Email</label>
    <input type="email" name="Email" required>
    <label for="Subject">Subject</label>
    <input type="text" name="Subject" required>
    <label for="Message">Message</label>
    <textarea name="Message" rows="2" required></textarea>
    <input type="submit">
</form>
```

### Other
- Most use cases for Form-less will likely fall under the [AWS Lambda Free Tier](https://aws.amazon.com/lambda/pricing/) due to the small amount of compute power needed to process form submissions. However, it is a good idea to monitor usage so that unexpected charges do not incur.