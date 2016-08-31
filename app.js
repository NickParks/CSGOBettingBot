var Bot = require('./bot');
var request = require('request');
var fs = require('fs');
var myJson = require('./config.json');
var CronJob = require('cron').CronJob;

var bot = new Bot(myJson);

var url = 'https://www.reddit.com/r/csgobetting/new.json?sort=new';

var threads;
var oldThreads = [];
var threadsToAdd = [];

loadNewThreads(true);

new CronJob('0 */10 * * * *', function() {
  console.log('Grabbing new threads...');
  loadNewThreads(false);
}, null, true, 'America/Los_Angeles');

new CronJob('0 */15 * * * *', function() {
  console.log('Running new check!');
  checkThreads();
}, null, true, 'America/Los_Angeles');

function loadNewThreads(firstRun) {
  request(url, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      threads = body;
      if (firstRun) {
        console.log('Running first run...');
        checkThreads();
      }
    } else {
      console.log(error);
      console.log("There was an error getting new threads!");
    }
  });
}

function loadArray() {
  fs.readFile('ids.txt', 'utf8', function(err, data) {
    if (err) {
      throw err;
    }
    oldThreads = data.toString();
  });
}

function checkThreads() {
  loadArray();
  //We actually have to wait for this because we're too poor to aford good servers
  var prased = JSON.parse(threads);
  if (prased.data.children === null) {
    console.log('Weird child null error from reddit?');
  } else {
    var size = prased.data.children.length;
    var number = 0;
    var interval = setInterval(function() {
      if (number == 24) {
        console.log('Cancelling interval!');
        clearInterval(interval);
      }
      var id = prased.data.children[number].data.id;
      var title = prased.data.children[number].data.title;
      if (oldThreads.indexOf(id) > -1) {
        // it's already been found!
        number++;
      } else {
        threadsToAdd.push(id);
        var rawType = prased.data.children[number].data.link_flair_text;
        var type = "[" + rawType + "] ";
        if (type !== "[null] " && rawType !== "Finished" && rawType !== "Discussion" && rawType !== "Question") {
          var link = "https://redd.it/" + id;

          var finalString = type + title + "\n " + link;

          if (finalString.length > 140) {
            var res = title.substring(0, 40);
            finalString = type + res +  "\n" + link;
          }

          bot.tweet(finalString, function(err, reply) {
            if (err) {
              console.error('Response Code: ', err.statusCode);
              console.error('Error Data: ', err.data);
            } else {
              console.log('\nTweet: ' + (reply ? reply.text : reply));
            }
          });

          number++;
          save(id);
        } else {
          number++;
        }
      }
    }, 5000);
  }
}

function save(id) {
  //Save file now
  fs.appendFile("ids.txt", id + "\n", function(err) {
    if (err) {
      throw err;
    }
  });
}

console.log('Loaded and ready sir!');
