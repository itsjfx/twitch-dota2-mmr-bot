/*

	Twitch Dota 2 MMR Bot
	by jfx.

	Provides basic functionality to grab MMR from a user using node-dota2 and say it in a twitch chat.
	I didn't spend lots of time making this, but I wanted to make a proof-of-concept in case other people were interested in having a bot like this in their twitch chat.
	
	TO-DO:
		* Get assignid to work and store twitchids-steamids in a database (sqlite)?
		* Perhaps have one bot doing the work and then just get them in peoples channels and shit
		* Code/config rework at some point since its a little garbled right now.

		
	Feel free to do whatever you want with this
*/



var steam = require("steam"),
    util = require("util"),
    fs = require("fs"),
    crypto = require("crypto"),
    dota2 = require("../"),
    steamClient = new steam.SteamClient(),
    steamUser = new steam.SteamUser(steamClient),
    steamFriends = new steam.SteamFriends(steamClient),
    Dota2 = new dota2.Dota2Client(steamClient, true),
	irc = require('irc');

// Load config
global.config = require("./config");


var admins = ["itsjfx", "someoneelse"] //work in progress, used eventually
var streamsteamid64 = Dota2.ToAccountID("76561197993496553");

var ircconfig = {
    channels: ["#"],
    server: "irc.chat.twitch.tv",
    username: "",
    nick: "",
    password: "oauth:",
	debug: true
};


// Create the bot name
var bot = new irc.Client(ircconfig.server, ircconfig.nick, ircconfig);

// Listen for joins
bot.addListener("join", function(channel, who) {
	
});

bot.addListener('message', function(from, to, message) {
    if (to.match(/^[#&]/)) {
        // channel message
		if (message.match(/!assignid/i)) { //work in progress
			if (admins.inArray(from)) {
				var inputs = message.split(/[ ,]+/);
				console.log(inputs[1]);
			}
        }
		if (message.match(/!mmr/i)) {
            Dota2.requestProfileCard(streamsteamid64);
            Dota2.on("profileCardData", function (accountId, profileData) {
			var parsed = JSON.parse(JSON.stringify(profileData, null, 2));
			var done = false;
			for(var stuff in parsed.slots){
				try {
					if (parsed.slots[stuff].stat.stat_id == "1") {
						console.log("We found their MMR! " + parsed.slots[stuff].stat.stat_score);
						bot.say(to, 'MMR: ' + parsed.slots[stuff].stat.stat_score);
						done = true;
						break;
					}
				} catch (e) {
					console.log("Keep looking for their MMR");
				}
			}
			if (done == false) {
				bot.say(to, 'Error finding MMR');
			}
			});
		}
    }
    else {
        // private message
        //console.log('private message');
    }
});


/* Steam logic */
var onSteamLogOn = function onSteamLogOn(logonResp) {
        if (logonResp.eresult == steam.EResult.OK) {
            steamFriends.setPersonaState(steam.EPersonaState.Busy); // to display your steamClient's status as "Online"
            steamFriends.setPersonaName("aaaaaaaaaaaaaaaa"); // to change its nickname
            util.log("Logged on.");
            Dota2.launch();
            Dota2.on("ready", function() {
                console.log("Node-dota2 ready.");
            });
            Dota2.on("unready", function onUnready() {
                console.log("Node-dota2 unready.");
            });
            Dota2.on("chatMessage", function(channel, personaName, message) {
                // util.log([channel, personaName, message].join(", "));
            });
            Dota2.on("guildInvite", function(guildId, guildName, inviter) {
                // Dota2.setGuildAccountRole(guildId, 75028261, 3);
            });
            Dota2.on("unhandled", function(kMsg) {
                util.log("UNHANDLED MESSAGE " + kMsg);
            });
            // setTimeout(function(){ Dota2.exit(); }, 5000);
        }
    },
    onSteamServers = function onSteamServers(servers) {
        util.log("Received servers.");
        fs.writeFile('servers', JSON.stringify(servers));
    },
    onSteamLogOff = function onSteamLogOff(eresult) {
        util.log("Logged off from Steam.");
    },
    onSteamError = function onSteamError(error) {
        util.log("Connection closed by server.");
    };

steamUser.on('updateMachineAuth', function(sentry, callback) {
    var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
    fs.writeFileSync('sentry', hashedSentry)
    util.log("sentryfile saved");
    callback({
        sha_file: hashedSentry
    });
});


// Login, only passing authCode if it exists
var logOnDetails = {
    "account_name": global.config.steam_user,
    "password": global.config.steam_pass,
};
if (global.config.steam_guard_code) logOnDetails.auth_code = global.config.steam_guard_code;

try {
    var sentry = fs.readFileSync('sentry');
    if (sentry.length) logOnDetails.sha_sentryfile = sentry;
} catch (beef) {
    util.log("Cannae load the sentry. " + beef);
}

steamClient.connect();
steamClient.on('connected', function() {
    steamUser.logOn(logOnDetails);
});
steamClient.on('logOnResponse', onSteamLogOn);
steamClient.on('loggedOff', onSteamLogOff);
steamClient.on('error', onSteamError);
steamClient.on('servers', onSteamServers);



Object.defineProperty(Object.prototype, 'inArray', {
  value: function(needle, searchInKey) {
    var object = this;
    if (Object.prototype.toString.call(needle) === '[object Object]' ||
      Object.prototype.toString.call(needle) === '[object Array]') {
      needle = JSON.stringify(needle);
    }
    return Object.keys(object).some(function(key) {
      var value = object[key];
      if (Object.prototype.toString.call(value) === '[object Object]' ||
        Object.prototype.toString.call(value) === '[object Array]') {
        value = JSON.stringify(value);
      }
      if (searchInKey) {
        if (value === needle || key === needle) {
          return true;
        }
      } else {
        if (value === needle) {
          return true;
        }
      }
    });
  },
  writable: true,
  configurable: true,
  enumerable: false
});
