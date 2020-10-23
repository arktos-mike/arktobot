// Подключаем модули
const fs = require('fs');
require('dotenv').config();
const { Telegraf } = require('telegraf')
const {
    Extra,
    Markup,
    Stage,
    session
} = Telegraf;
const SceneGen = require('./scenes');
const curScene = new SceneGen();
const repeateScene = curScene.RepeateScene();
const recordScene = curScene.RecordScene();
const talkScene = curScene.TalkScene();
const videoScene = curScene.VideoScene();
const { leave } = Stage;

// Создаем объект Telegraf.js
const bot = new Telegraf(process.env.TOKEN);
// Установливаем webHook
bot.telegram.setWebhook('https://' + process.env.DOMAIN + ':' + process.env.PORT + '/');
// Запускаем https webhook
require('http')
    .createServer(bot.webhookCallback('/'))
    .listen(process.env.PORT);
//Значения текстовых ответов
let replyText = {
    "helloAdmin": "Привет админ, ждем команд. /help - чем могу помочь.",
    "helloUser": "Приветствую, я - помощник. /help - чем могу помочь.",
    "replyWrong": "Для ответа пользователю используйте функцию Ответить/Reply.",
    "replyRights": "У Вас недостаточно прав для выполнения этой команды."
};

let isAdmin = (userId) => {
    const arr = process.env.ADMIN.split(' ');
    return arr.includes(userId.toString());
};

//Перенаправляем админу от пользователя или уведомляем админа об ошибке
let forwardToAdmin = (ctx) => {
    const arr = process.env.ADMIN.split(' ');
    if (isAdmin(ctx.message.from.id)) {
        ctx.reply(replyText.replyWrong);
    } else {
        ctx.forwardMessage(arr[0], ctx.from.id, ctx.message.id);
        ctx.telegram.sendMessage(arr[0], ctx.message.from.id);
    }
};

const stage = new Stage([talkScene, repeateScene, recordScene, videoScene]);
stage.command('cancel', leave());
bot.use(session());
bot.use(stage.middleware());
////////////////////////////////////// СТАРТ
bot.start((ctx) => {
    ctx.reply(isAdmin(ctx.message.from.id)
        ? replyText.helloAdmin
        : replyText.helloUser);
    if (!isAdmin(ctx.message.from.id)) {
        forwardToAdmin(ctx);
    }
});
bot.command('repeat', (ctx) => {
    if (isAdmin(ctx.message.from.id)) {
        ctx.scene.enter('repeate');
    } else {
        ctx.reply(replyText.replyRights);
    }  
});
bot.command('record', (ctx) => {
    if (isAdmin(ctx.message.from.id)) {
        ctx.scene.enter('record');
    } else {
        ctx.reply(replyText.replyRights);
    }  
});
bot.command('video', (ctx) => {
    if (isAdmin(ctx.message.from.id)) {
        ctx.scene.enter('video');
    } else {
        ctx.reply(replyText.replyRights);
    }  
});
bot.command('say', (ctx) => {
    if (isAdmin(ctx.message.from.id)) {
        ctx.scene.enter('say');
    } else {
        ctx.reply(replyText.replyRights);
    }
})
bot.help((ctx) => ctx.reply('/say - сценарий проигрывания текстового сообщения\n' +
 '/repeat - сценарий проигрывания голосового сообщения\n'+ 
 '/record - сценарий записи с микрофона\n'+
 '/video - сценарий записи с камеры\n'
 ))
bot.on('sticker', (ctx) => ctx.reply('👍'));
//bot.hears('hi', (ctx) => ctx.reply('Hey there'))
bot.launch();