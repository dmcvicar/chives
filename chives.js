var Botkit = require('botkit');

var controller;
if(process.argv[3]){
    controller = Botkit.slackbot({ json_file_store: process.argv[3]} );
} else {
    controller = Botkit.slackbot();
}
var bot = controller.spawn({
  token: process.argv[2]
})

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }
});

var have_conversation = function(bot, message) {
  bot.startConversation(message, function(err, convo) {
    convo.ask('What can I do for you?', perform_task);
  });
}

var leave_channel = function(bot, message) {
  bot.reply(message,'Goodbye!')
  bot.configureIncomingWebhook({url: 'https://slack.com/api/channels.leave'});
  bot.api.mpim.close({channel: message.channel},function(err,response){console.log(response)});
}

var name_user = function(bot, message) {
    var name = message.match[1].replace(',','');
    controller.storage.users.get(message.user, function(err, user) {
        if (!user) {
            user = {
                id: message.user,
            };
        }
        user.name = name;
        controller.storage.users.save(user, function(err, id) {
            bot.reply(message, 'Got it. I will call you ' + user.name + ' from now on.');
        });
    });
}

var perform_task = function(response, convo) {
  for(i=0;i<actions.length;i++) {
    if(controller.hears_test(actions[i].keywords,response)) {
      actions[i].action(bot, response);
      break;
    }
    convo.next();
  }
}

var quit = function(bot, message) {
  bot.reply(message,'Quitting. Bye!')
  bot.closeRTM()
  process.exit()
}

var say_hi = function(bot, message) {
  controller.storage.users.get(message.user, function(err, user) {
      if (user && user.name) {
          bot.reply(message,'Hello ' + user.name + '!')
      } else {
          bot.reply(message,'Hello!')
      }
  });
}

var tell_name = function(bot, message) {
    controller.storage.users.get(message.user, function(err, user) {
        if (user && user.name) {
            bot.reply(message, 'Your name is ' + user.name);
        } else {
            bot.reply(message, 'I\'m afraid we haven\'t been acquainted yet. What is your name?');
        }
    });
}

actions = [
  {
    'keywords':['hello', ' hi', 'hi ','sup', 'hey'],
    'action': say_hi
  },
  {
    'keywords':['call me (.*) (.*)', 'my name is (.*) (.*)', 'call me (.*)', 'my name is (.*)'],
    'action': name_user
  },
  {
    'keywords':['goodbye', 'that will be all'],
    'action': leave_channel
  },
  {
    'keywords':['what is my name', 'who am i', 'what\'s my name'],
    'action': tell_name
  }
]

actions.forEach( function (d) {
  controller.hears(d.keywords, 'direct_message,direct_mention,mention', d.action);
});
controller.on(['exit','quit','goodbye'],'direct_message',quit)
controller.on('direct_mention', have_conversation);
