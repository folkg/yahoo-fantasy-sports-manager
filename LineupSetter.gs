function main() {
  //get all teams
  const teams = getTeams();
  // for each team, get the current roster
  var rosters = [];
  teams.forEach((team) => {
    rosters.push(getTeamRoster(team));
  });
  Logger.log(rosters);
}

function editStartingLineup(roster) {
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
    if (player.is_editable) {
      if (player.selected_position === "BN" && player.is_playing && player.injury_status != null) {
        benched.push(player);
      } else if (player.selected_position !== "IR" && player.selected_position !== "IR+") {
        rostered.push(player);
      }
    }
  });

  // Sort both player arrays by percent_started
  // We will use this as a crowd-sourced method to determine which players should be started over others
  const compareByPercentStarted = (a, b) => {
    return a.percent_started - b.percent_started;
  };
  //benched will be a stack with the lowest percent_started on top
  benched.sort(compareByPercentStarted).reverse();
  //rostered will be a normal array with the lowest percent_started at the beginning
  rostered.sort(compareByPercentStarted);


}


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


