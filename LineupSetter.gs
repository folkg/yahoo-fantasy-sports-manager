function setHockeyLineups() {
  //TODO: Do we really need the time restrictions? Is it any trouble to run these 24 times per day? Most times there will be no pushes.
  if (hockeyScriptRunTimes()) {
    const teams = getTeams("nhl");
    Logger.log("Settings Lineups for the following teams: " + teams);
    teams.forEach((team_key) => {
      const roster = getTeamRoster(team_key);
      editStartingLineup(roster);
      Logger.log("Lineup set for team " + team_key);
    });
  }
}

function setFootballLineups() {
  if (footballScriptRunTimes()) {
    const teams = getTeams("nfl");
    Logger.log(teams);
    Logger.log("Settings Lineups for the following teams: " + teams);
    teams.forEach((team_key) => {
      const roster = getTeamRoster(team_key);
      editStartingLineup(roster);
      Logger.log("Lineup set for team " + team_key);
    });
  }
}

function editStartingLineup(teamRoster) {
  const { team_key, players, coverage_type, coverage_period } = teamRoster;

  // Loop through all players and add them to either the benched, rostered, or IR list.
  // We don't want to be swapping players if they are not editable, if they are hurt, or if they are in an IR spot
  const benched = [];
  const rostered = [];
  const healthyOnIR = [];
  const injuredOnRoster = [];
  players.forEach(player => {
    if (player.is_editable) {
      // Player statuses to be treated as healthy
      const healthyStatusList = ["Healthy", "Questionable", "Probable"];
      if (player.selected_position === "BN" && player.is_playing && healthyStatusList.includes(player.injury_status)) {
        // Add player to 'benched' list for potential swap into active roster
        benched.push(player);
      } else if (!["IR", "IR+", "BN"].includes(player.selected_position)) {
        // Artificially set the percent_started to 0 if the player is not playing to de-prioritize them in the lineup
        if (!player.is_playing)
          player.percent_started = 0;
        // Artificially factor the percent_started by 0.01 if the player is hurt. Priority will be above players not playing at all, but below others.
        if (!healthyStatusList.includes(player.injury_status))
          player.percent_started = player.percent_started * 0.01;
        // Add player to 'rostered' list, which reflects the current active roster
        rostered.push(player);
      } else if (["IR", "IR+"].includes(player.selected_position) && healthyStatusList.includes(player.injury_status)) {
        // If there is a healthy player sitting on the IR, add them to a list for potential swap onto bench/roster
        healthyOnIR.push(player);
      }
      // In addition to adding to one of the three lists above, check if the player is IR eligible and on the bench/roster
      const arrayIntersection = ["IR", "IR+"].filter(value => player.eligible_positions.includes(value));
      if (!["IR", "IR+"].includes(player.selected_position) && arrayIntersection.length > 0) {
        injuredOnRoster.push(player);
      }
    }
  });

  // Sort both player arrays by percent_started
  // We will use this as a crowd-sourced method to determine which players should be started over others
  const compareByPercentStarted = (a, b) => {
    return a.percent_started - b.percent_started;
  };

  // 'rostered' will be sorted with the lowest percent_started at the beginning, so the worst palyer will always be checked first
  rostered.sort(compareByPercentStarted);

  // Define the function that attempts to move a bench player onto the active roster
  const swapPlayerToActiveRoster = (benchPlayer) => {
    for (const rosterPlayer of rostered) {
      if (benchPlayer.eligible_positions.includes(rosterPlayer.selected_position)) {
        // If the rosterPlayer's current position is included in the list of the benchPlayer's eligible positions.
        // We are only looking closer at players we can actually swap with.
        if (compareByPercentStarted(benchPlayer, rosterPlayer) > 0) {
          // If the benchPlayer has a higher score than the rosterPlayer. Perform a 2-way swap.

          // Update the selected position for both swapped players
          benchPlayer.selected_position = rosterPlayer.selected_position;
          rosterPlayer.selected_position = "BN";

          // Add to the new_player_positions dictionary
          new_player_positions[benchPlayer.player_key] = benchPlayer.selected_position;
          if (rosterPlayer.player_key !== null) {
            // Only add the rosterPlayer to dictionary if it was not a dummy empty roster spot
            new_player_positions[rosterPlayer.player_key] = rosterPlayer.selected_position;
            // If rosterPlayer plays a game today, add it to top of the benched stack for the next while loop iteration.
            // rosterPlayer could still potentially displace a different player
            if (rosterPlayer.is_playing)
              benched.push(rosterPlayer);
          }

          // Add the benchPlayer to the rostered array in place of rosterPlayer and re-sort it.     
          const swapIndex = rostered.indexOf(rosterPlayer);
          rostered[swapIndex] = benchPlayer;
          rostered.sort(compareByPercentStarted);

          // We are finished with this benchPlayer, they have been added to the active roster.
          return;
        } else {
          // If the benchPlayer has a lower score than the rosterPlayer
          // We will see if there are any three-way swaps available to accomodate benchPlayer
          // Compare the rosterPlayer with each of the players (thirdPlayer) with a lower score than benchPlayer
          var idx = 0;
          var thirdPlayer = rostered[idx];
          while (compareByPercentStarted(thirdPlayer, benchPlayer) < 0) {
            if (rosterPlayer.eligible_positions.includes(thirdPlayer.selected_position)) {
              // If rosterPlayer can be swapped with any of the earlier players, Perform a 3-way swap.              
              benchPlayer.selected_position = rosterPlayer.selected_position;
              rosterPlayer.selected_position = thirdPlayer.selected_position;
              thirdPlayer.selected_position = "BN";

              // Add all players the new_player_positions dictionary that will be swapped
              new_player_positions[benchPlayer.player_key] = benchPlayer.selected_position;
              new_player_positions[rosterPlayer.player_key] = rosterPlayer.selected_position;

              if (thirdPlayer.player_key !== null) {
                new_player_positions[thirdPlayer.player_key] = thirdPlayer.selected_position;
                if (thirdPlayer.is_playing)
                  benched.push(thirdPlayer);
              }

              // Add the benchPlayer to the rostered array in place of thirdPlayer and re-sort it.     
              const swapIndex = rostered.indexOf(thirdPlayer);
              rostered[swapIndex] = benchPlayer;
              rostered.sort(compareByPercentStarted);

              // We are finished with this benchPlayer, they have been added to the active roster.
              return;
            } // end if possible three-way swap
            thirdPlayer = rostered[++idx];
          } //end while
        } // end if/else compare score
      } // end if players are of compatible positions. Move on to check next compatible roster player.
    } // end for i loop
  } // end swapPlayerIntoRoster()

  // Define a dictionary to hold the new positions of all moved players
  const new_player_positions = {};
  // TODO: Before looping all players, check if any IR eligible players can be swapped with healthy players on IR.
  // Loop over all benched players with games and swap into the active roster if able
  while (benched.length > 0) {
    // Pop the benchPlayer off the benched stack, it will either be moved to the roster, or it belongs on the bench and can be ignored.
    const benchPlayer = benched.pop();

    // Only attempt to swap player if it is better than at least one player on the active roster. Otherwise, just discard and move to the next.
    if (compareByPercentStarted(benchPlayer, rostered[0]) > 0) {
      swapPlayerToActiveRoster(benchPlayer);
    }
  } //end while

  // Send the new_player_positions dictionary to Yahoo to make the changes official
  if (Object.keys(new_player_positions).length > 0) {
    const response = modifyRoster(team_key, coverage_type, coverage_period, new_player_positions);
    Logger.log(response);
  }
}

function createTimeDrivenTriggers() {
  // Runs at approximately :55 every hour
  ScriptApp.newTrigger("setFootballLineups")
    .timeBased()
    .nearMinute(55)
    .everyHours(1) // Frequency is required if you are using atHour() or nearMinute()
    .create();

  // ScriptApp.newTrigger("setHockeyLineups")
  //   .timeBased()
  //   .nearMinute(55)
  //   .everyHours(1) // Frequency is required if you are using atHour() or nearMinute()
  //   .create();
}

//TODO: Is this function even required? We might be able to get this data from Yahoo itself from the API
function getTodaysTeamsGoalies() {
  var goalies = [];
  var teams = [];

  //scrape goaliepost.com for today's starters and respective teams
  var page = UrlFetchApp.fetch('https://www.dailyfaceoff.com/starting-goalies/');
  var doc = Xml.parse(page, true);
  var bodyHtml = doc.html.body.toXmlString();
  doc = XmlService.parse(bodyHtml);
  var root = doc.getRootElement();

  goalies = goalies.concat(getElementsByTagName(root, 'h4'));
  teams = teams.concat(getElementsByTagName(root, 'player_key'));
  return HtmlService.createHtmlOutput(output);

  //TODO: Get todays playing teams
  //TODO: Get todays starting goaltenders

}


