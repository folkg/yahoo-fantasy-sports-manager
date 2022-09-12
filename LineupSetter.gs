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
  editStartingLineup(teams[1], rosters[0]);
}

function editStartingLineup(team_key, roster) {
  /* Algorithm:

  1. Add all benched players to stack 'benched_players' if:
   - They are playing today
   - Their status is not injured
   - is_editable
  2. Sort benched_players with lowest started_percentage at top of stack
  
  3. Add all rostered players to array 'rostered_players' if is_editable
  4. Sort rostered_players from lowest started_percentage at front of array

  5. While 'benched_players:
   - set worst_rank to benched_player
   - loop through each rostered_player
     -> if benched_player and rostered_player have same position, compare rostered_player rank to worst_rank.
       - If lower, worst_rank = rostered_player, continue loop
       - If higher, break loop. bench_player is worst. Pop from stack.
   - if worst_rank is less thank benched_player, swap players.
     - Add swapped player to top of benched_players stack. Repeat from top of loop.
     - Add other swapped player to rostered_players array. Re-sort the array.
  
  6. Make all swaps on Yahoo. Q: Do we want to do this as we go along?
  */

  // Loop through all players and add them to either the benched or rostered list if required.
  // We don't want to be swapping players if they are not editable, if they are hurt, or if they are in an IR spot
  var benched = [];
  var rostered = [];
  roster.forEach(player => {
    //TODO: Negate the is_editable for testing
    if (!player.is_editable) {
      if (player.selected_position === "BN" && player.is_playing && player.injury_status === "Healthy") {
        benched.push(player);
      } else if (player.selected_position !== "BN" && player.selected_position !== "IR" && player.selected_position !== "IR+") {
        // Artificially set the percent_started to 0 if the player is not playing, as this should be the case.
        if (!player.is_playing) player.percent_started = 0;
        rostered.push(player);
      }
    }
  });

  // Sort both player arrays by percent_started
  // We will use this as a crowd-sourced method to determine which players should be started over others
  const compareByPercentStarted = (a, b) => {
    return a.percent_started - b.percent_started;
  };
  // 'benched' will be a stack with the lowest percent_started on top
  benched.sort(compareByPercentStarted).reverse();
  // 'rostered' will be a normal array with the lowest percent_started at the beginning
  rostered.sort(compareByPercentStarted);

  // Loop over all benched players with games and swap into the active roster if necessary
  var new_player_positions = [];
  while (benched.length > 0) {
    // pop the benchPlayer off the benched stack, it will either be moved to the roster, or it belongs on the bench
    const benchPlayer = benched.pop();
    var swapPlayer = null;

    // Loop through each roster player and find the lowest eligible player to see if they should be swapped for the bench player
    var i;
    for (i = 0; i < rostered.length; i++) {
      const rosterPlayer = rostered[i];
      //TODO: Check the percent started first, doesn't matter if the position matches. If it doesn't beat even the wrong position, it won't be better than the right position.
      if (benchPlayer.eligible_positions.includes(rosterPlayer.selected_position)) {
        // If the rosterPlayer's current position is included in the list of the benchPlayer's eligible positions
        if (compareByPercentStarted(benchPlayer, rosterPlayer) > 0) {
          //flag the current rosterPlayer for swapping and break out of the loop
          swapPlayer = rosterPlayer;
        }
        // Else benchPlayer has the lowest score, they belong on the bench!  
        break; //Break the for/of loop
      }
    } //end for loop

    if (swapPlayer != null) {
      // Update the selected position for both swapped players
      benchPlayer.selected_position = swapPlayer.selected_position
      swapPlayer.selected_position = "BN"
      // Add both benchPlayer and swapPlayer to the new_player_positions array to be modified
      new_player_positions.push({ player_key: benchPlayer.player_key, position: benchPlayer.selected_position });      
      new_player_positions.push({ player_key: swapPlayer.player_key, position: swapPlayer.selected_position });

      // If swapPlayer plays a game today, add it to top of the benched stack for the next while loop iteration.
      // swapPlayer could still potentially displace a different player
      if (swapPlayer.is_playing)
        benched.push(swapPlayer);

      // Add the benchPlayer to the rostered array in place of swapPlayer and re-sort it.
      //TODO: Ensure i is what we think it is, and the right player is being replaced.
      Logger.log("i=" + i);
      Logger.log(rostered[i].player_key);
      Logger.log(swapPlayer.player_key);
      rostered[i] = benchPlayer;
      rostered.sort(compareByPercentStarted);
    }
  } //end while
  Logger.log("test");

  // Send the new_player_positions array to Yahoo to make the changes
  if (new_player_positions.length > 0) {
    const response = modifyRoster(team_key, new_player_positions);
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


