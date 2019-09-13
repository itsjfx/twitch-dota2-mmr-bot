const steam = require("steam");
const util = require("util");
const fs = require("fs");
const crypto = require("crypto");
const dota2 = require("dota2");
const twitch = require('twitch-js');
const SteamTotp = require('steam-totp');
const prompt = require('prompt');

let config = require("./config.js");

const twitchOptions = {
	channels: config.channels.map(chan => chan.channel),
	debug: true,
	identity: {
		username: config.twitch.username,
		password: config.twitch.password
	},
	connection: {
		reconnect: true
	}
}

let logOnDetails = {};

// All our clients
let steamClient = new steam.SteamClient();
let steamUser = new steam.SteamUser(steamClient);
let steamFriends = new steam.SteamFriends(steamClient);
let dotaClient = new dota2.Dota2Client(steamClient, true, true);

let twitchClient = new twitch.client(twitchOptions);

function addChatListener() {
	twitchClient.on('chat', (channel, userstate, message, self) => {
		if (self || !message || !message.startsWith(config.twitch.commandPrefix) || !twitchOptions.identity)
			return;
		
		let split = message.split(' ');
		if (!split.length)
			return;
			
		console.log(`Message "${message}" received from ${userstate['display-name']}`);

		if (message === '!mmr') {
			let str = '';
			let account_id = config.channels.find(chan => chan.channel == channel).account_id;
			if (!account_id) twitchClient.say(channel, 'Channel not linked, should never happen!');

			dotaClient.requestProfileCard(account_id, (err, data) => {
				if (err) {
					util.log("Error getting profile card " + err);
					twitchClient.say(channel, 'Error fetching profile card');
				}
				let mmrSlots = data.slots.filter((slot) =>
					(slot.stat && slot.stat.stat_id === dota2.schema.CMsgDOTAProfileCard.EStatID.k_eStat_CoreRank) ||
					(slot.stat && slot.stat.stat_id === dota2.schema.CMsgDOTAProfileCard.EStatID.k_eStat_SupportRank)
				).map((slot) => slot.stat);
				
				if (mmrSlots.length > 0) {
					// Do core mmr first, alternatively put the largest first but this seems the best
					let core = mmrSlots.find(slot => (slot.stat_id === dota2.schema.CMsgDOTAProfileCard.EStatID.k_eStat_CoreRank));
					if (core)
						str = `Core MMR: ${core.stat_score} | `;
					
					// Write support now
					let support = mmrSlots.find(slot => (slot.stat_id === dota2.schema.CMsgDOTAProfileCard.EStatID.k_eStat_SupportRank));
					if (support)
						str += `Support MMR: ${support.stat_score}`;
					
					twitchClient.say(channel, str);
				} else {
					twitchClient.say(channel, 'MMR is not featured on streamers profile');
				}
			});
		}
	});
}

// Load in server list if we've saved one before
if (fs.existsSync('servers')) {
	steam.servers = JSON.parse(fs.readFileSync('servers'));
}

steamClient.on('logOnResponse', (logonResp) => {
	if (logonResp.eresult == steam.EResult.OK) {
		steamFriends.setPersonaState(steam.EPersonaState.Offline);
		util.log("Logged on.");

		dotaClient.launch();
		dotaClient.on("ready", () => {
			util.log("Node-dota2 ready.");
			addChatListener();
		});

		dotaClient.on("unready", function onUnready() {
			util.log("Node-dota2 unready.");
		});

		dotaClient.on("unhandled", (kMsg) => {
			util.log("UNHANDLED MESSAGE " + dota2._getMessageName(kMsg));
		});
	}
});

steamClient.on('servers', (servers) => {
	util.log("Received servers.");
	fs.writeFile('servers', JSON.stringify(servers), (err) => {
		if (err) {if (this.debug) util.log("Error writing ");}
		else {if (this.debug) util.log("");}
	});
});

steamClient.on('loggedOff', (eresult) => {
	util.log("Logged off from Steam.");
});

steamClient.on('error', (error) => {
	util.log("Connection closed by server.", error);
});

steamUser.on('updateMachineAuth', (sentry, callback) => {
	var hashedSentry = crypto.createHash('sha1').update(sentry.bytes).digest();
	fs.writeFileSync('sentry', hashedSentry)
	util.log("sentryfile saved");

	callback({ sha_file: hashedSentry});
});

if (!config.steam || !config.steam.accountName || !config.steam.password) {
	prompt.get([{
		name: 'username',
		required: true
	}, {
		name: 'password',
		hidden: true,
		conform: function (value) {
			return true;
		}
	}, {
		name: 'twofactor (blank if none)',
		required: false
	}], function (err, res) {
		logOnDetails.account_name = res.username;
		logOnDetails.password = res.password;
		if (res.twofactor) {
			logOnDetails.two_factor_code = res.twofactor;
		}
		steamClient.connect();
	});
} else {
	logOnDetails = {
		"account_name": config.steam.accountName,
		"password": config.steam.password
	}
	if (config.steam.shared) logOnDetails.two_factor_code = SteamTotp.getAuthCode(config.steam.shared);
	steamClient.connect();
}

try {
	let sentry = fs.readFileSync('sentry');
	if (sentry.length) logOnDetails.sha_sentryfile = sentry;
} catch (e) {
}

twitchClient.connect();

steamClient.on('connected', () => {
	steamUser.logOn(logOnDetails);
});