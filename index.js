var Botkit = require('botkit');

var controller = Botkit.slackbot();

var bot = controller.spawn({
  token: my_slack_bot_token
})

bot.startRTM(function(err,bot,payload) {
  if (err) {
    throw new Error('Could not connect to Slack');
  }

  // close the RTM for the sake of it in 5 seconds
  setTimeout(function() {
      bot.closeRTM();
  }, 5000);
});
