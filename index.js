import nodemailer from "nodemailer";
import fetch from "node-fetch";
if (!globalThis.fetch) {
    globalThis.fetch = fetch;
}

import { CronJob } from "cron";
import moment from "moment";

// Prepare global variables
global.lastState = {};
global.lastResult = {};
global.restart = true;

// async..await is not allowed in global scope, must use a wrapper
async function sendMail(to, subject = "Kachna", text, html) {
    let transporter = nodemailer.createTransport(
        JSON.parse(process.env.NODEMAILER_TRANSPORT || "{}"),
        process.env.NODEMAILER_DEFAULTS
    );

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: process.env.NODEMAILER_SENDER, // sender address
        to: to, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: html, // html body
    });
    console.log("Message sent: %s", info.messageId);
}

async function getState() {
    const response = await fetch(
        "https://www.su.fit.vutbr.cz/iskachnaopen/api/duck/currentState",
        {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
        }
    );
    return response.json(); // parses JSON response into native JavaScript objects
}

async function updateLastState(newStateData) {
    global.lastResult = newStateData;
    global.lastState = newStateData.state;
}

async function main() {
    const data = await getState();
    if (JSON.stringify(data) == JSON.stringify(global.lastResult)) {
        return console.log("Data didn't changed.");
    }
    await updateLastState(data);

    let mailTo = process.env.MAIL_TO;
    let text = data.state;
    let html = JSON.stringify(data);
    if (data.openedByName != undefined) {
        text = `${text}By${data.openedByName}`;
    }
    if (global.restart) {
        console.log(`Restarted at ${moment().format('LLLL')}.`);
        global.restart = false;
        mailTo = process.env.MAIL_TO_RESTART;
        text = `Restart&${text}`;
        html = `<p><b>Restarted</b> at ${moment().format('LLLL')}.</p>`;
    }
    await sendMail(
        mailTo,
        process.env.MAIL_SUBJECT || "Kachna",
        text,
        html
    );
}

const job = new CronJob(
    process.env.CRON_TIMING || '* * * * *',
    main,
    null,
    true,
    process.env.CRON_TIMEZONE || 'Europe/Prague'
);
job.start();

// main();