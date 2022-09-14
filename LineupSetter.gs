function main() {
  //get all teams
  const teams = getTeams();
  // for each team, get the current roster
  //TODO: teams will eventually be a team object that includes whether it's a points only league
  var rosters = [];
  // teams.forEach((team) => {
  //   rosters.push(getTeamRoster(team));
  // });
  // Temporarily just fetch one roster for testing
  Logger.log(teams[1]);
  rosters.push(getTeamRoster(teams[1]));

  // Edit the starting lineup for one roster
  editStartingLineup(rosters[0]);
}

function editStartingLineup(teamRoster) {
  const {team_key, players, coverage_type, coverage_period} = teamRoster;

  // Loop through all players and add them to either the benched or rostered list if required.
  // We don't want to be swapping players if they are not editable, if they are hurt, or if they are in an IR spot
  var benched = [];
  var rostered = [];
  players.forEach(player => {
    //TODO: Negate the is_editable for testing
    if (!player.is_editable) {
      // TODO: check all statuses. For sure we want to factor Out, DTD. Do we have 'probable'? Maybe don't exclude that one.
      if (player.selected_position === "BN" && player.is_playing && player.injury_status === "Healthy") {
        benched.push(player);
      } else if (player.selected_position !== "BN" && player.selected_position !== "IR" && player.selected_position !== "IR+") {
        // Artificially set the percent_started to 0 if the player is not playing to de-prioritize them in the lineup
        if (!player.is_playing)
          player.percent_started = 0;
        // Artificially factor the percent_started by 0.01 if the player is hurt. Priority will be above players not playing at all, but below others.
        // TODO: check all statuses. For sure we want to factor Out, DTD. Do we have 'probable'? Maybe don't factor that one.
        if (player.injury_status !== "Healthy")
          player.percent_started = player.percent_started * 0.01;

        rostered.push(player);
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
    for (var i = 0; i < rostered.length; i++) {
      const rosterPlayer = rostered[i];
      if (benchPlayer.eligible_positions.includes(rosterPlayer.selected_position)) {
        // If the rosterPlayer's current position is included in the list of the benchPlayer's eligible positions.
        // We are only looking closer at players we can actually swap with.
        if (compareByPercentStarted(benchPlayer, rosterPlayer) > 0) {
          // If the benchPlayer has a higher score than the rosterPlayer. Perform a 2-way swap.
          // Update the selected position for both swapped players
          benchPlayer.selected_position = rosterPlayer.selected_position;
          rosterPlayer.selected_position = "BN";

          // Add both benchPlayer and rosterPlayer to the new_player_positions dictionary that will be swapped
          new_player_positions[benchPlayer.player_key] = benchPlayer.selected_position;
          new_player_positions[rosterPlayer.player_key] = rosterPlayer.selected_position;

          // If rosterPlayer plays a game today, add it to top of the benched stack for the next while loop iteration.
          // rosterPlayer could still potentially displace a different player
          if (rosterPlayer.is_playing)
            benched.push(rosterPlayer);

          // Add the benchPlayer to the rostered array in place of rosterPlayer and re-sort it.     
          const swapIndex = rostered.indexOf(rosterPlayer);
          rostered[swapIndex] = benchPlayer;
          rostered.sort(compareByPercentStarted);
          // We are finished with this benchPlayer, they have been added to the active roster.
          return;
        } else {
          // If the benchPlayer has a lower score than the rosterPlayer
          // We will see if there are any three-way swaps available to accomodate benchPlayer
          // Compare the rosterPlayer with each of the players with a lower score than benchPlayer (i.e. previously checked players)
          for (var j = 0; j < i; j++) {
            const thirdPlayer = rostered[j];
            if (rosterPlayer.eligible_positions.includes(thirdPlayer.selected_position)) {
              // If rosterPlayer can be swapped with any of the earlier players, Perform a 3-way swap.              
              benchPlayer.selected_position = rosterPlayer.selected_position;
              rosterPlayer.selected_position = thirdPlayer.selected_position;
              thirdPlayer.selected_position = "BN";

              // Add all players the new_player_positions dictionary that will be swapped
              new_player_positions[benchPlayer.player_key] = benchPlayer.selected_position;
              new_player_positions[rosterPlayer.player_key] = rosterPlayer.selected_position;
              new_player_positions[thirdPlayer.player_key] = thirdPlayer.selected_position;

              if (thirdPlayer.is_playing)
                benched.push(thirdPlayer);

              // Add the benchPlayer to the rostered array in place of thirdPlayer and re-sort it.     
              const swapIndex = rostered.indexOf(thirdPlayer);
              rostered[swapIndex] = benchPlayer;
              rostered.sort(compareByPercentStarted);

              // We are finished with this benchPlayer, they have been added to the active roster.
              return;
            } // end if possible three-way swap
          } // end for j, loop through all lower score players
        } // end if/else compare score
      } // end if players are of compatible positions. Move on to check next compatible roster player.
    } // end for i loop
  } // end swapPlayerIntoRoster()

  // Define a dictionary to hold the new positions of all moved players
  var new_player_positions = {};
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


