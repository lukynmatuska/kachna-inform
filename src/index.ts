import { DuckState, DuckStates, EmailData } from './models';
import { Observable } from 'rxjs';
import { map, filter, tap } from 'rxjs/operators/index.js';
import { ajax } from 'rxjs/ajax/index.js';
import { XMLHttpRequest } from 'xmlhttprequest';
import * as nodemailer from 'nodemailer';
import moment from 'moment';
import { CronJob } from 'cron';

class Main {
    private _lastData?: string;
    private restart: boolean = true;

    get lastData(): DuckState { return this._lastData ? JSON.parse(this._lastData) : null; }
    set lastData(value: DuckState) { this._lastData = JSON.stringify(value); }

    run(): void {
        const getState = this.getState().pipe(
            filter(data => this._lastData !== JSON.stringify(data)), // Trigger only if something changed.
            tap(data => this.lastData = data) // Store temporary data.
        );

        getState.subscribe(state => {
            const mailData = this.prepareMail(state);
            this.sendMail(mailData).subscribe();
        });
    }

    getState(): Observable<DuckState> {
        const ajax$ = ajax({
            async: true,
            crossDomain: true,
            headers: {
                'Content-Type': 'application/json'
            },
            method: 'GET',
            responseType: 'json',
            url: 'https://www.su.fit.vutbr.cz/iskachnaopen/api/duck/currentState',
            createXHR: () => new XMLHttpRequest()
        });

        return ajax$.pipe(map(o => o.response as DuckState));
    }

    private sendMail(data: EmailData): Observable<nodemailer.SentMessageInfo> {
        return new Observable<nodemailer.SentMessageInfo>(observer => {
            const transporter = nodemailer.createTransport(
                JSON.parse(process.env.NODEMAILER_TRANSPORT || '{}'),
                process.env.NODEMAILER_DEFAULTS as any
            );

            const info = transporter.sendMail({
                from: process.env.NODEMAILER_SENDER,
                to: data.to,
                subject: data.subject,
                text: data.text,
                html: data.html
            })

            info
                .then(msgInfo => observer.next(msgInfo))
                .catch(err => observer.error(err));
        });
    }

    private prepareMail(state: DuckState): EmailData {
        const result: EmailData = {
            html: JSON.stringify(state),
            subject: process.env.MAIL_SUBJECT || 'Kachna',
            text: state.state,
            to: process.env.MAIL_TO
        };

        if (state.openedByName !== undefined) {
            result.text = `${result.text}By${state.openedByName}`;
        }

        if (this.restart) {
            console.log(`Restarted at ${moment().format('LLLL')}.`);
            this.restart = false;
            result.to = process.env.MAIL_TO_RESTART;
            result.text = `Restart&${result.text}`;
            result.html = `<p><b>Restarted</b> at ${moment().format('LLLL')}</p>`;
        }

        return result;
    }
}

console.log(`${moment().format('LLLL')} Application started`);
const main = new Main();
new CronJob(
    process.env.CRON_TIMING || '* * * * *',
    () => {
        console.log(`${moment().format('LLLL')} Triggered cron job.`);
        main.run();
    },
    null, true,
    process.env.CRON_TIMEZONE || 'Europe/Prague'
).start();
