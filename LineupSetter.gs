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

  TODO: How do we know if a player is playing today?

  1. Add all benched players to stack 'benched_players' if:
   - They are playing today
   - Their status is not injured
  2. Sort benched_players from worst rank to best rank, with worst rank on top of queue.
  
  3. Add all rostered players to array 'rostered_players'
  4. Sort rostered_players from worst rank to best rank

  5. While 'benched_players:
   - set worst_rank to benched_player
   - loop through each rostered_player
     -> if benched_player and rostered_player have same position, compare rostered_player rank to worst_rank.
       - If lower, worst_rank = rostered_player, continue loop
       - If higher, break loop. bench_player is worst. Pop from stack.
   - if worst_rank is less thank benched_player, swap players.
     - Add swapped player to top of benched_players stack. Repeat from top of loop.
  
  6. Make all swaps on Yahoo. Q: Do we want to do this as we go along?
  */
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


