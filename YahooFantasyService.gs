function test_API() {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {
    //nfl.p.30994
    //411.p.6427
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/player/411.p.6427/percent_started'; //get 'percent_started'.'value'
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/player/411.p.6427/opponent'; // get 'opponent'
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/411.l.9755.t.8/roster;date=2022-04-28/players;out=percent_started,opponent,starting_status';
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/411.l.9755.t.8/players;position=G;out=percent_started,opponent,starting_status';
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/leagues';
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nfl/teams';
    // const url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/414.l.240994.t.12/roster/players;out=percent_started,opponent';
    const url = 'https://fantasysports.yahooapis.com/fantasy/v2/league/414.l.240994/settings' // settings.getChild(roster_positions).getChildren(roster_position) >> position, count
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

function test_getRoster() {
  // getTeamRoster("411.l.9755.t.8");
  getTeamRoster("414.l.240994.t.12");
  Logger.log("test");
}

function getTeams() {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {

    //Fetch a list of all hockey teams registered to the user
    //const url = 'https://fantasysports.yahooapis.com/fantasy/v2/users;use_login=1/games;game_keys=nhl/teams';
    //TODO: temporarily using 411 for 2021 NHL season. Change simply to 'nhl' as above to keep on current season always
    //TODO: how do we include all sports (ie.football)? Probably just remove the games;game_keys
    //TODO: Fetch info on the team/league itself - is it a points only league? We would need this for the getTeamRoster as well. Pass a team object around instead of the team_key.
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
} //end getTeams()

function getTeamRoster(team_key) {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {
    //Yahoo API variables
    var url, response, doc, root;

    // Get the roster positions from the league settings
    const league_key = team_key.split(".t.", 1)[0];
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/league/' + league_key + '/settings';
    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
      , "muteHttpExceptions": true
    });
    // Logger.log(response.getContentText());
    doc = XmlService.parse(response.getContentText());
    root = doc.getRootElement();
    const xmlNamespace = root.getNamespace();
    const roster_positions = root.getChild("league", xmlNamespace).getChild("settings", xmlNamespace).getChild("roster_positions", xmlNamespace).getChildren("roster_position", xmlNamespace);

    var position_counter = {};
    roster_positions.forEach((element) => {
      position_counter[element.getChildText("position", xmlNamespace)] = parseInt(element.getChildText("count", xmlNamespace));
    });

    //TODO: How do we get the projected point totals if this is a points only league? Add a new out='' prop to the request, probably
    // url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/roster;date=2022-04-26/players;out=percent_started,opponent,starting_status';
    url = 'https://fantasysports.yahooapis.com/fantasy/v2/team/' + team_key + '/roster/players;out=percent_started,opponent,starting_status';

    response = UrlFetchApp.fetch(url, {
      headers: {
        'Authorization': 'Bearer ' + yahooService.getAccessToken()
      }
      , "muteHttpExceptions": true
    });
    // Logger = BetterLog.useSpreadsheet('1azpYfhxShueuk0dr6EWAsIukBlJ_nDPSjbXIvptfBA0');
    // Logger.log(response.getContentText());
    doc = XmlService.parse(response.getContentText());
    root = doc.getRootElement();
    const roster_element = root.getChild("team", xmlNamespace).getChild("roster", xmlNamespace);
    // Extract information from the XML to be returned from the function
    const coverage_type = roster_element.getChildText("coverage_type", xmlNamespace);
    const coverage_period = roster_element.getChildText(coverage_type, xmlNamespace);
    const player_elements = roster_element.getChild("players", xmlNamespace).getChildren("player", xmlNamespace);

    //loop through each player element and extract the relevant data to our new object

    //TODO: I am hoping that is_starting will be populated for the goaltenders. If not, we will need to fetch from elsewhere. Once the season starts I may be able to determine if there is a specific subresource that will provide this info for the goalies that I can call.
    //TODO: Add projected points for use in points only leagues (ie. football)

    var players = [];
    player_elements.forEach((element) => {
      const player = {
        player_key: element.getChildText("player_key", xmlNamespace),
        // player_name: getElementStringsByTagName(e, "full")[0],
        // nhl_team: e.getChildText("editorial_team_abbr", xmlNamespace),
        eligible_positions: getElementStringsByTagName(element, "eligible_positions")[0].replace(/\s/g, ''),
        selected_position: element.getChild("selected_position", xmlNamespace).getChildText("position", xmlNamespace),
        is_editable: element.getChildText("is_editable", xmlNamespace) === "1" ? true : false,
        is_playing: element.getChildText("opponent", xmlNamespace) ? true : false,
        injury_status: element.getChildText("status_full", xmlNamespace) || "Healthy",
        percent_started: parseInt(element.getChild("percent_started", xmlNamespace).getChildText("value", xmlNamespace)),
        is_starting: getElementStringsByTagName(element, "is_starting")[0] || "N/A",
      };

      // Remove the player's selected position from the allowable total
      // At the end, position_counter will hold the number of unfilled positions on the roster
      position_counter[player.selected_position] -= 1;

      // Push the player to the object
      players.push(player);
    });

    //Add a dummy player for every unfilled position in the roster (not IR, IR+, or BN)
    for (const position in position_counter) {
      const count = position_counter[position];
      if (!["IR", "IR+", "BN"].includes(position) && count > 0) {
        for (var i = 0; i < count; i++) {
          const player = {
            player_key: null,
            eligible_positions: null,
            selected_position: position,
            is_editable: true,
            is_playing: false,
            injury_status: null,
            percent_started: 0,
            is_starting: null,
          };
          players.push(player);
        } //end for i loop
      } //end if
    }// end for position loop

    //return the values required to the set lineup function
    return { team_key, players, coverage_type, coverage_period };
  } else {
    // Present authorization URL to user in the logs
    const authorizationUrl = yahooService.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
      authorizationUrl);
  }
} //end getTeamRoster()

function modifyRoster(team_key, coverage_type, coverage_period, new_player_positions) {
  //ensure that we have access to Yahoo prior to using function
  const yahooService = getYahooService_();
  if (yahooService.hasAccess()) {
    const today = new Date();//defaults to today

    //TODO: For weekly leagues
    // <coverage_type>week</coverage_type>
    // <week>13</week>

    // Build the input XML to move players to new positions
    const startXML = '<fantasy_content>' +
      '<roster>' +
      '<coverage_type>' + coverage_type + '</coverage_type>' +
      '<' + coverage_type + '>' + coverage_period + '</' + coverage_type + '>' +
      '<players>';
    const endXML = '</players>' +
      '</roster>' +
      '</fantasy_content>';

    // Loop over the new_player_positions array passed in to create all player modification entries
    var bodyXML = "";
    for (const player_key in new_player_positions) {
      const position = new_player_positions[player_key];

      bodyXML += '<player>' +
        '<player_key>' + player_key + '</player_key>' +
        '<position>' + position + '</position>' +
        '</player>';
    }

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
    return response.getContentText();
  } else {
    // Present authorization URL to user in the logs
    const authorizationUrl = yahooService.getAuthorizationUrl();
    Logger.log('Open the following URL and re-run the script: %s',
      authorizationUrl);
  }
} //end modifyRoster()

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
