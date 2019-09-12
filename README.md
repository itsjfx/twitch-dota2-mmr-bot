# twitch-dota2-mmr-bot
Simple proof of concept bot to grab MMR from a users profile and say it in a twitch chat  
It has a nice config file to set it up, or alternatively if the accountName or password are null for steam login it can take user input to login

# How does this work... I thought you can't do this anymore?!?!?!
Actually you still can! But it's a bit tricky. The streamer/person you're grabbing the data from has to have the "Core / Support MMR" boxes featured on their profile like in this screenshot: https://i.imgur.com/yKUbtOP.jpg

You can do so if you customise node-dota2 to edit your slots on your profile (a tool I'm planning on making to make this easy), or you can follow this tutorial: https://reddit.com/r/DotA2/comments/95ny0e/how_to_make_mmr_progress_trackable_on_dotabuff/ - However be mindful it is a sizeable download.

The cost of doing this is you lose at least one of your slots (if you feature at least one MMR) since it's useless in-game, but for your stream they get to track your MMR so that's cool :)

# How to
npm install
edit the config
run the app :d
