var Discord = require('discord.io');
var logger = require('winston');
var auth = require('./auth.json');
var twitch = '0460hs97f0gp9c685c0vgjt35qsila';
var twitchurl = 'https://api.twitch.tv.kraken/';
var express        = require("express");
var bodyParser     = require("body-parser");
var cookieParser   = require("cookie-parser");
var cookieSession  = require("cookie-session");
var passport       = require("passport");
var twitchStrategy = require("passport-twitch").Strategy;
var requestify = require('requestify'); 
var app = express();

 
app.set("views", "./views");
// app.set("view engine", "ejs");
 
// Middlewares 
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(cookieSession({secret:"toa7405ogoojejkq1dgna1e3pxeztw"}));
app.use(passport.initialize());
app.use(express.static("./public"));
 
passport.use(new twitchStrategy({
    clientID: "0460hs97f0gp9c685c0vgjt35qsila",
    clientSecret: "toa7405ogoojejkq1dgna1e3pxeztw",
    callbackURL: "http://127.0.0.1:3000/auth/twitch/callback",
    scope: "user_read"
  },
  function(accessToken, refreshToken, profile, done) {
    // Suppose we are using mongo.. 
    User.findOrCreate({ twitchId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
 
passport.serializeUser(function(user, done) {
    done(null, user);
});
 
passport.deserializeUser(function(user, done) {
    done(null, user);
});
 
app.get("/", function (req, res) {
    res.render("index");
});
 
app.get("/auth/twitch", passport.authenticate("twitch"));
app.get("/auth/twitch/callback", passport.authenticate("twitch", { failureRedirect: "/" }), function(req, res) {
    // Successful authentication, redirect home. 
    res.redirect("/");
});
 
app.listen(3000);
// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';


// Initialize Discord Bot
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
});


bot.on('message', function (user, userID, channelID, message, evt) {

    if (message.substring(0, 1) == '!') {
        var args = message.substring(1).split(' ');
        var cmd = args[0];
       
        args = args.splice(1);
        switch(cmd) {
            // !ping
            case 'ping':
                bot.sendMessage({
                    to: channelID,
                    message: 'Pong!'
                });
            break;
            case 'commands':
                bot.sendMessage({
                    to: channelID,
                    message: '!Online : Get a multitwitch link with Team Reapers that are currently online.  !TeamReaper : Learn how to join Team Reaper.  !Perks : Learn the perks of joining Team Reaper.'
                });
            break;
            case 'TeamReaper':
                bot.sendMessage({
                    to: channelID,
                    message: 'Join Team Reaper by filling out the form at this link: https://docs.google.com/forms/d/e/1FAIpQLSd99KZjXNJlHT1VZ5Rnm58Fzj4LPKeDx7X4p5x0VqS6s1aBjw/viewform?usp=sf_link in order to add yourself to our roster!'
                });
            break;
            case 'perks':
                bot.sendMessage({
                    to: channelID,
                    message: 'Perks of joining Team Reaper include being added to the Live Notifications, added to the multitwitch link, special team-only giveaways and team-only events.  Join today! Learn how with the command !TeamReaper'
                });
            break;
            case 'store':
                bot.sendMessage({
                    to: channelID,
                    message: 'Get your sweet Team Reaper swag here: https://www.designbyhumans.com/shop/ReaperStudios/'
                });
            break;
            case 'online':
                var multi = [];
                //Pull data on who is online on Team Reaper's follow list 
                requestify.request('https://api.twitch.tv/kraken/users/171135805/follows/channels?limit=100&sortby=last_broadcast', {
                    method: 'GET',
                    headers: {
                        'Client-ID': '0460hs97f0gp9c685c0vgjt35qsila',
                        'Accept': 'application/vnd.twitchtv.v5+json'
                    }
                })
                .then(function(response) {
                    // get the response body
                    var total = response.getBody().follows.length;
                    var j = 0;
                    for(var i=0; i <= total; i++) {
                        requestify.request('https://api.twitch.tv/kraken/streams/' + response.getBody().follows[i].channel._id, {
                            method: 'GET',
                            headers: {
                                'Client-ID': '0460hs97f0gp9c685c0vgjt35qsila',
                                'Accept': 'application/vnd.twitchtv.v5+json'
                            }   
                        })
                        .then(function(response) {
                            if(response.getBody().stream != null) {
                                multi.push(response.getBody().stream.channel.name);
                            }
                            console.log(multi);
                            if(j == total-1) {
                                if(multi.length != 0) {
                                    bot.sendMessage({
                                        to: channelID,
                                        message: 'http://www.multitwitch.tv/' + multi.join("/")
                                    });
                                }
                            } 
                            j++;
                        })
                    }
                });
            break;
         }
     }
});
