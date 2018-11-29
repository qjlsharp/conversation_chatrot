
var nodemailer = require("nodemailer");

var transport = nodemailer.createTransport({
    host: "smtp.qq.com", //主机
    secureConnection: true,
    port: 465, //STMP端口号，必有用465
    auth: {
        user: "252156462@qq.com", //帐号
        pass: "dgcgkisnhxzgbgde" //授权码
    }
}
)

var mailOptions = function (loclTitle, loclContent) {
    var param = {
        from: "252156462@qq.com", //你的邮件昵称
        to: "qujialin52@hotmail.com", //收件人，可多个收件人
        subject: loclTitle,//标题
        // text: loclContent, 
        html: loclContent//内容
        // attachments: [
        //     {
        //         filename: "text",
        //         path: "./app.js" //文件路径
        //     },
        //     {
        //         filename: "text1",
        //         content: "test"
        //     }
        // ]
    }
    return param;
}

function send(loclTitle, loclContent) {
    transport.sendMail(mailOptions(loclTitle, loclContent), function (err, response) {
        if (err) console.log(err)
        else console.log(response)
    })
}

module.exports = {
    send
}
