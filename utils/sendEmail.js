import nodeMailer from "nodemailer";
export const sendEmail = async (options) => {
  const transport = nodeMailer.createTransport({
    service: "gmail",
    smtp: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "YourEmail@gmail.com",
      pass: "YourPASSWORD",
    },
  });
  const mailOptions = {
    from: '"ShinigamiDev" <hashir.gr8.4u@gmail.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };
  await transport.sendMail(mailOptions, function (err, result) {
    if (err) throw err;
    console.log(result, mailOptions);
  });
};
