# Yahoo Fantasy Sports Manager
A program to automatically set optimal Yahoo fantasy lineups each day to make team management more hands-off. This uses the "percent started" attribute from the Yahoo system to make the lineup decisions. This essentially crowd-sources the lineup decisions to other fantasy players.

This program has only been tested with Hockey and Football as these are the only two fantasy sports that I participate in. There may be quirks or optimizations for other sports that have not been considered.

This was written in Google Apps Script for two reasons. Firstly, to learn a bit about the Google Cloud platform and Google App Script. Secondly, the scripts can be easily scheduled to run automatically without having to host it on my own server.

### To Use:
1. Register and application and get a Yahoo Client ID (Consumer Key) and Client Secret (Consumer Secret) for the Yahoo Developer Network:
https://developer.yahoo.com/oauth2/guide/openid_connect/getting_started.html#getting-started-setup

2. In the `YahooFantasyAPIService.gs` file, find the `setClientIdSecret_()` function. Add the clientId and clientSecret in place of the "TBD" placeholders. Run this function to set your credentials as a global property for the Google Apps Script project.

3. Set triggers for `setHockeyLineups()` and/or `setFootballLienups()` functions within `LineupSetter.gs` file. These functions will gather your team info, and then proceed to set the lineups for the current day. Having triggers for these functions in place for the GAS project is required for the automation of setting the lineups, otherwise no code will be run unless done manually.
There are helper functions to only make the Yahoo API calls during reasonable hours for each sport to limit the traffic (e.g. you don't need to set the lineup at 4am). Triggers can be set either with the `createTimeDrivenTriggers()` function, or manually for each function in the project triggers area.

4. Sit back, and enjoy your fantasy success.

