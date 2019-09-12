let config = {
	"steam": { // If accountName or password are blank the user login will be done over user input
		"accountName": "",
		"password": "",
		
		"shared": "",
		"identity": "" // unused
	},
	"twitch": {
		"username": "",
		"password": "oauth:",
		"commandPrefix": "!"
	},
	"channels": [
		{
			"channel": "#itsjfx",
			"account_id": 33230825
		}
	]
};

module.exports = config;