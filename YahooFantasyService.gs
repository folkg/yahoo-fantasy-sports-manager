function main() {
  //get all teams
  const teams = getHockeyTeams();
  // for each team, get the current roster
  var rosters = [];
  teams.forEach((team) => {
    rosters.push(getTeamRoster(team));
  });
  Logger.log(rosters);
}

function getHockeyTeams() {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {

    //Fetch a list of all hockey teams registered to the user
    //const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nhl/teams';
    //TODO: temporarily using 411 for 2021 NHL season. Change simply to 'nhl' as above to keep on current season always
    const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=411/teams';
    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
      , "muteHttpExceptions": true
    });
    // the return type is xml, find all 'team_key' items in the response and add to array
    const doc = XmlService.parse(response.getContentText());
    const root = doc.getRootElement();

    const team_keys = getElementStringsByTagName(root, 'team_key');

    // return array of Yahoo hockey team_keys
    return team_keys;
  } else {
    // Present authorization URL to user in the logs
    const authorizationUrl = yahooService.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
      authorizationUrl);
  }
}

function getTeamRoster(team_key) {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {
    //Yahoo API variables
    var url, response, doc, root;

    //Get currently assigned position for each player based on the 'roster' call
    const today = new Date();//defaults to today
    //TODO: change back to today's date. Testing using a specific date
    // url = 'https://fantasysports.yahooapis.com/fantasy/v2/teams;team_keys=nhl.l.' + team_key + '/roster;date=' + dateToString(today);
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/roster;date=2022-04-27';

    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
      , "muteHttpExceptions": true
    });
    doc = XmlService.parse(response.getContentText());
    root = doc.getRootElement();
    //put all players from the roster into an array
    const player_elements = getElementObjectsByTagName(root, "player");

    // TODO: We could probably come up with a more in-depth way of doing this if we wanted
    // Rank the players:
    // Fetch all players, sorted by last month to determine ranking order
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/players;sort=AR;sort_type=lastmonth;player_keys=';
    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
      , "muteHttpExceptions": true
    });
    console.log(response.getContentText());
    doc = XmlService.parse(response.getContentText());
    root = doc.getRootElement();
    const player_keys_sorted = getElementStringsByTagName(root, 'player_key');

    //loop through each player element and extract the relevant data to our new object
    var players = [];
    const xmlNamespace = root.getNamespace();
    player_elements.forEach((e) => {
      const player_key = e.getChildText("player_key", xmlNamespace);
      const player_rank = player_keys_sorted.indexOf(player_key);
      const player = {
        player_key: player_key,
        // player_name: getElementStringsByTagName(e, "full")[0],
        nhl_team: e.getChildText("editorial_team_abbr", xmlNamespace),
        eligible_positions: getElementStringsByTagName(e, "eligible_positions")[0].replace(/\s/g, ''),
        selected_position: e.getChild("selected_position", xmlNamespace).getChildText("position", xmlNamespace),
        lineup_status: getElementStringsByTagName(e, "status_full")[0],
        is_starting: getElementStringsByTagName(e, "is_starting")[0],
        rank: player_rank
      };
      players.push(player);
    });

    //return the values required to the set lineup function
    return players;
  } else {
    // Present authorization URL to user in the logs
    const authorizationUrl = yahooService.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
      authorizationUrl);
  }
}

/**
* Configures the service.
*/
function getYahooService_() {
  // Create a new service with the given name. The name will be used when
  // persisting the authorized token, so ensure it is unique within the
  // scope of the property store.
  return OAuth2.createService('yahoo')

    // Set the endpoint URLs
    .setAuthorizationBaseUrl('https://api.login.yahoo.com/oauth2/request_auth')
    .setTokenUrl('https://api.login.yahoo.com/oauth2/get_token')

    // Set the client ID and secret
    .setClientId(getClientId())
    .setClientSecret(getClientSecret())

    // Set the name of the callback function in the script referenced
    // above that should be invoked to complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())
}

function setClientIdSecret() {
  // NOTE: Run this function once before anything else to set your Yahoo client ID and client secret in the property store
  // Replace "TBD" with your Yahoo client ID and client secret
  var clientId = "TBD";
  var clientSecret = "TBD";
  var props = PropertiesService.getScriptProperties();
  props.setProperty('Client ID', clientId);
  props.setProperty('Client Secret', clientSecret);
}

function getClientId() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('Client ID');
}

function getClientSecret() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('Client Secret');
}

function authCallback(request) {
  var yahooService = getYahooService_();
  var isAuthorized = yahooService.handleCallback(request);
  if (isAuthorized) {
    return HtmlService.createHtmlOutput('Success! You can close this tab.');
  } else {
    return HtmlService.createHtmlOutput('Denied. You can close this tab');
  }
}

function logout() {
  var service = getYahooService_()
  service.reset();
}
