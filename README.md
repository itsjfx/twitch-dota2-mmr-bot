# twitch-dota2-mmr-bot
Simple proof of concept bot to grab MMR from a users profile and say it in a twitch chat  
It has a nice config file to set it up, or alternatively if the accountName or password are null for steam login it can take user input to login

# How does this work... I thought you can't do this anymore?!?!?!
Actually you still can! But it's a bit tricky. The streamer/person you're grabbing the data from has to have the "Core / Support MMR" boxes featured on their profile like in this screenshot: https://i.imgur.com/yKUbtOP.jpg

You can do so if you customise node-dota2 to edit your slots on your profile (a tool I'm planning on making to make this easy), or you can follow this tutorial: https://reddit.com/r/DotA2/comments/95ny0e/how_to_make_mmr_progress_trackable_on_dotabuff/ - However be mindful it is a sizeable download.

The cost of doing this is you sacrifice at least one of your slots (if you feature at least one MMR) since it's useless in-game, but for your stream they get to track your MMR so that's cool :)

# How to
npm install
edit the config
run the app :d

# To do
* It would be nice to have a module/class for the steam and dota management part of this
* Integrate this with a database instead of a config file, this way I can host it and get people to use it (similar to 9kmmrbot)
* Figure out if the player has finished a match, and if so cache the data until they finish their match (since MMR wont update in the mean time). This will probably have to be done since the endpoint for getting players profile cards is heavily rate limited and I can see this being an issue. Right now this works really well just being used on small streams.
* Maybe intergrate this into 9kmmrbot so everyone can enjoy it, and implement it with their !lg or !score API so it only refreshes when the player has finished a game.
