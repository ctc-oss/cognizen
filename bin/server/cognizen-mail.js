var nodemailer = require("nodemailer");

var Mail = {
    config: {},
    logger: {},
    init: function(config, logger) {
        this.config = config;
        this.logger = logger;
        return this;
    },

    send: function (data) {
        var _this = this;
        var smtpTransport = nodemailer.createTransport("SMTP", {
            //Docs available at: https://github.com/andris9/Nodemailer
            host: _this.config.mailServer
        });

        // setup e-mail data with unicode symbols
        var mailOptions = {
            from: "cognizen <" + _this.config.adminEmail + ">",// sender address
            to: data.user, // list of receivers
            subject: data.subject, // Subject line
            text: data.txtMsg, // plaintext body
            html: data.msg // html body
        }

        // send mail with defined transport object
        smtpTransport.sendMail(mailOptions, function (error, response) {
            if (error) {
                _this.logger.info("Houston: We have a mail problem = " + error);
            } else {
                _this.logger.info("Message sent: " + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            smtpTransport.close(); // shut down the connection pool, no more messages
        });
    }
};

module.exports = Mail;