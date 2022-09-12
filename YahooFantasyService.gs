function test_API() {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {
    //nfl.p.30994
    //411.p.6427
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/player/411.p.6427/percent_started'; //get 'percent_started'.'value'
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/player/411.p.6427/opponent'; // get 'opponent'
    const url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/411.l.9755.t.8/roster;date=2022-04-28/players;out=percent_started,opponent';
    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
      , "muteHttpExceptions": true
    });
    // the return type is xml, find all 'team_key' items in the response and add to array
    Logger.log(response.getContentText());
    const doc = XmlService.parse(response.getContentText());
    const root = doc.getRootElement();

  } else {
    // Present authorization URL to user in the logs
    const authorizationUrl = yahooService.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
      authorizationUrl);
  }
}

function getTeams() {
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
    // url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/roster;date=' + dateToString(today) + '/players;out=percent_started,opponent';
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/roster;date=2022-04-26/players;out=percent_started,opponent';

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

    //loop through each player element and extract the relevant data to our new object
    //TODO: I am hoping that is_starting will be populated for the goaltenders. If not, we will need to fetch from elsewhere. Once the season starts I may be able to determine if there is a specific subresource that will provide this info for the goalies that I can call.
    //TODO: Add projected points for use in points only leagues (ie. football)
    var players = [];
    const xmlNamespace = root.getNamespace();
    player_elements.forEach((e) => {
      const player_key = e.getChildText("player_key", xmlNamespace);
      const player = {
        player_key: player_key,
        // player_name: getElementStringsByTagName(e, "full")[0],
        // nhl_team: e.getChildText("editorial_team_abbr", xmlNamespace),
        eligible_positions: getElementStringsByTagName(e, "eligible_positions")[0].replace(/\s/g, ''),
        selected_position: e.getChild("selected_position", xmlNamespace).getChildText("position", xmlNamespace),
        is_editable: e.getChildText("is_editable", xmlNamespace),
        is_playing: e.getChildText("opponent", xmlNamespace) ? true : false,
        injury_status: getElementStringsByTagName(e, "status_full")[0],
        percent_started: parseInt(e.getChild("percent_started", xmlNamespace).getChildText("value", xmlNamespace)),
        is_starting: getElementStringsByTagName(e, "is_starting")[0]
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

function modifyRoster(team_key, new_player_positions) {
  const today = new Date();//defaults to today

  // Build the input XML to move players to new positions
  const startXML = '<fantasy_content>' +
    '<roster>' +
    '<coverage_type>date</coverage_type>' +
    '<date>' + dateToString(today) + '</date>' +
    '<players>';
  const endXML = '</players>' +
    '</roster>' +
    '</fantasy_content>';

  // Reduce over the new_player_positions array passed in to create all player modification entries
  const bodyXML = new_player_positions.reduce((str, player) => {
    const entry = '<player>' +
      '<player_key>' + player.player_key + '</player_key>' +
      '<position>' + player.position + '</position>' +
      '</player>';
    return str + entry;
  });
  const modifyRosterXML = startXML + bodyXML + endXML;

  Logger.log('%s', modifyRosterXML);

  //Add the options for the PUT
  const options =
  {
    "contentType": "application/xml; charset=utf-8",
    "method": "put",
    "payload": modifyRosterXML,
    headers: {
      'Authorization': 'Bearer ' + yahooService.getAccessToken()
    },
    "muteHttpExceptions": true
  };

  //PUT the roster modification
  const response = UrlFetchApp.fetch('https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/roster', options);
  Logger.log('%s', response.getContentText());

  //TODO: Do we just want to return status? Or full response good?
  return response;

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
    .setClientId(getClientId_())
    .setClientSecret(getClientSecret_())

    // Set the name of the callback function in the script referenced
    // above that should be invoked to complete the OAuth flow.
    .setCallbackFunction('authCallback')

    // Set the property store where authorized tokens should be persisted.
    .setPropertyStore(PropertiesService.getUserProperties())
}

function setClientIdSecret_() {
  // NOTE: Run this function once before anything else to set your Yahoo client ID and client secret in the property store
  // Replace "TBD" with your Yahoo client ID and client secret
  var clientId = "TBD";
  var clientSecret = "TBD";
  var props = PropertiesService.getScriptProperties();
  props.setProperty('Client ID', clientId);
  props.setProperty('Client Secret', clientSecret);
}

function getClientId_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('Client ID');
}

function getClientSecret_() {
  var props = PropertiesService.getScriptProperties();
  return props.getProperty('Client Secret');
}

function authCallback_(request) {
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
