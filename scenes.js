const Scene = require('telegraf/scenes/base');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const say = require('say');

class SceneGen {
    TalkScene() {
        const talk = new Scene('say');
        talk.enter((ctx) => ctx.reply('Введи текст для зачитки'));
        talk.on('text', (ctx) => {
            say.export(ctx.message.text, 'Microsoft Irina Desktop', 1.0, 'hal.wav', () => {
                fs.closeSync(fs.openSync("ready", 'w'));
            });
            say.speak(ctx.message.text, 'Microsoft Irina Desktop', 1.0);    
            ctx.reply('ОК, проигрываю сообщение. Может еще разок? Или /cancel для возврата.');
        });
        talk.on('message', (ctx) => ctx.reply('Жду твое текстовое сообщение'));
        return talk;
    }
    RepeateScene() {
        const repeate = new Scene('repeate');
        repeate.enter((ctx) => ctx.reply('Запиши свое аудио сообщение'));
        repeate.on('voice', (ctx) => {
            const file = ctx.update.message.voice.file_id;
            if (fs.existsSync('record/out.ogg')) fs.unlinkSync('record/out.ogg');
            ctx.telegram.getFileLink(file).then(url => {
                axios({ url, responseType: 'stream' }).then(response => {
                    return new Promise((resolve, reject) => {
                        response.data.pipe(fs.createWriteStream(`${ctx.update.message.from.id}.ogg`))
                            .on('finish', () => fs.closeSync(fs.openSync("ready", 'w')));
                    });
                })
            })
            ctx.reply('ОК, проигрываю сообщение. Может еще разок? Или /cancel для возврата.');
        });
        repeate.on('message', (ctx) => ctx.reply('Жду твое голосовое сообщение'));
        return repeate;
    }
    RecordScene() {
        const record = new Scene('record');
        record.enter((ctx) => ctx.reply('Введи длительность записи в секундах'));
        record.on('text', (ctx) => {
            const recordTime = Number(ctx.message.text);
            if (recordTime && recordTime > 0 && !fs.existsSync('startRecord')) {
                if (fs.existsSync('record/out.ogg')) fs.unlinkSync('record/out.ogg');
                ctx.reply(`Записываю.. ${recordTime} сек`);
                var fd = fs.openSync('startRecord', 'w');
                fs.writeSync(fd, recordTime);
                fs.closeSync(fd);
                checkExistsWithTimeout('record/out.ogg', (recordTime + 10) * 1000).then(function () {
                    ctx.replyWithVoice({
                        source: fs.createReadStream('record/out.ogg')
                    });
                    ctx.reply('ОК, вот запись. Может еще разок? Или /cancel для возврата.')
                });
            }
        });
        record.on('message', (ctx) => ctx.reply(`Просто введи число`));
        return record;
    }
    VideoScene() {
        const video = new Scene('video');
        video.enter((ctx) => ctx.reply('Введи длительность записи в секундах'));
        video.on('text', (ctx) => {
            const recordTime = Number(ctx.message.text);
            if (recordTime && recordTime > 0 && !fs.existsSync('startVideo')) {
                if (fs.existsSync('record/out.mp4')) fs.unlinkSync('record/out.mp4');
                ctx.reply(`Записываю.. ${recordTime} сек`);
                var fd = fs.openSync('startVideo', 'w');
                fs.writeSync(fd, recordTime);
                fs.closeSync(fd);
                checkExistsWithTimeout('record/out.mp4', recordTime * 4000).then(function () {
                    ctx.replyWithVideo({
                        source: fs.createReadStream('record/out.mp4')
                    });
                    ctx.reply('ОК, вот запись. Может еще разок? Или /cancel для возврата.')
                });
            }
        });
        video.on('message', (ctx) => ctx.reply(`Просто введи число`));
        return video;
    }
}
function checkExistsWithTimeout(filePath, timeout) {
    return new Promise(function (resolve, reject) {
        var timer = setTimeout(function () {
            watcher.close();
            watcher.close();
            reject(new Error('File still not exists.'));
        }, timeout);
        var dir = path.dirname(filePath);
        var basename = path.basename(filePath);
        var watcher = fs.watch(dir, function (eventType, filename) {
            if (eventType === 'rename' && filename === basename) {
                var watcher2 = fs.watch(filePath, function (curr, prev) {
                    fs.stat(filePath, function (err, stats) {
                        if (stats.size > 0) {
                            clearTimeout(timer);
                            watcher2.close();
                            watcher.close();
                            resolve();
                        }
                    });
                });
            }
        });
    });
}

module.exports = SceneGen