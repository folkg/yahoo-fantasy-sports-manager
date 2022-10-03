function getBuzzIndex(url) {
  const content = UrlFetchApp.fetch(url).getContentText();
  const $ = Cheerio.load(content);
  const playerCells = $('table > tbody tr');

  const playerList = [];
  $('table > tbody tr').each(function (idxr, row) {
    const playerData = [];
    $(row).find('td > div').each(function (idxc, col) {
      playerData.push($(col).text());
    });
    const playerId = $(row).find('a').attr('data-ys-playerid');
    const percent_rostered = parseInt(playerData[1]);
    const percent_started = parseInt(playerData[2]);
    const drops = parseInt(playerData[3]);
    const adds = parseInt(playerData[4]);
    playerList.push({ playerId, percent_rostered, percent_started, drops, adds });
  });

  return playerList;
}

function getWhosHot(url) {
  const content = UrlFetchApp.fetch(url).getContentText();
  const $ = Cheerio.load(content);
  const playerCells = $('table > tbody tr');

  const playerList = [];
  $('table > tbody tr').each(function (idxr, row) {
    const playerData = [];
    $(row).find('td > div').each(function (idxc, col) {
      playerData.push($(col).text());
    });
    //TODO: This may need to be modified for NHL. It may not have stats and fantasy points. TBD. Maybe just keep player id only.
    const playerId = $(row).find('a').attr('data-ys-playerid');
    const stats = playerData[1];
    const fan_pts = parseFloat(playerData[2]);
    playerList.push({ playerId, stats, fan_pts });
  });

  return playerList;
}

function getNHLTopAdds() {
  //TODO: Do we want to get yesterday and today transactions combined? Can add &date=2022-10-03
  const url = "https://hockey.fantasysports.yahoo.com/hockey/buzzindex?&pos=ALL&src=combined&bimtab=A&trendtab=O&sort=BI_A&sdir=1";
  const playerList = getBuzzIndex(url)
  Logger.log(playerList);
}

function getNHLTopDrops() {
  const url = "https://hockey.fantasysports.yahoo.com/hockey/buzzindex?pos=ALL&src=combined&bimtab=A&trendtab=O&sort=BI_D&sdir=1";
  const playerList = getBuzzIndex(url)
  Logger.log(playerList);
}

function getNHLHotPlayers() {
  // Could use this format if we need something specific: https://hockey.fantasysports.yahoo.com/hockey/whoshot?pos=ALL&week=4
  const url = "https://hockey.fantasysports.yahoo.com/hockey/whoshot";
  const playerList = getWhosHot(url)
  Logger.log(playerList);
}

function getNFLTopAdds() {
  const url = "https://football.fantasysports.yahoo.com/f1/buzzindex?pos=ALL&src=combined&bimtab=A&trendtab=O&sort=BI_A&sdir=1";
  const playerList = getBuzzIndex(url)
  Logger.log(playerList);
}

function getNFLTopADrops() {
  const url = "https://football.fantasysports.yahoo.com/f1/buzzindex?pos=ALL&src=combined&bimtab=A&trendtab=O&sort=BI_D&sdir=1";
  const playerList = getBuzzIndex(url)
  Logger.log(playerList);
}

function getNFLHotPlayers() {
  // Could use this format if we need something specific: https://football.fantasysports.yahoo.com/f1/whoshot?pos=ALL&week=4
  // Currentl can't filter by week, or can I?
  const url = "https://football.fantasysports.yahoo.com/f1/whoshot";
  const playerList = getWhosHot(url)
  Logger.log(playerList);
}
