function getHockeyTeams() {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {
    //Yahoo API variables

    //Fetch a list of all hockey teams registered to the user
    const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nhl/teams';
    const response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
    });
    const doc = XmlService.parse(response.getContentText());
    const root = doc.getRootElement();
    const team_keys = getElementsByTagName(root, 'team_key');

    Logger.log(team_keys);
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

    //Fetch all players, NHL teams, and eligible positions
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/teams;team_keys=nhl.l.' + team_key + '/players;sort=AR;sort_type=lastmonth;player_keys=';
    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
    });
    doc = XmlService.parse(response.getContentText());
    root = doc.getRootElement();
    const player_keys = getElementsByTagName(root, 'player_key');
    const player_teams = getElementsByTagName(root, 'editorial_team_abbr'); //editorial_team_key, editorial_team_full_name
    const eligible_positions = getElementsByTagName(root, 'eligible_positions');

    //Get currently assigned position for each player based on the 'roster' call
    const today = new Date();//defaults to today
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/teams;team_keys=nhl.l.' + team_key + '/roster;date=' + dateToString(today);
    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
    });
    doc = XmlService.parse(response.getContentText());
    root = doc.getRootElement();
    const player_keys_unsorted = player_keys_unsorted.concat(getElementsByTagName(root, 'player_key'));
    const selected_positions_unsorted = selected_positions_unsorted.concat(getElementsByTagName(root, 'selected_position'));

    //filter the eligible positions to leave just the positions comma separated (remove first and last comma also)
    for (var i = 0, x = eligible_positions.length; i < x; i++) {
      eligible_positions[i] = eligible_positions[i].replace(/\W+/g, ",").slice(1).slice(0, -1);
    }

    //filter the selected positions to leave just the position
    for (var i = 0, x = selected_positions_unsorted.length; i < x; i++) {
      selected_positions_unsorted[i] = selected_positions_unsorted[i].replace(/\W/g, "").slice(12);
    }

    //order the assigned positions to each player
    var j = 0;
    for (var i = 0, x = player_keys.length; i < x; i++) {
      j = player_keys_unsorted.indexOf(player_keys[i]);
      selected_positions[i] = selected_positions_unsorted[j];
    }
    j = 0;

    //return the values required to the set lineup function
    return [player_keys, player_teams, eligible_positions, selected_positions];

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
