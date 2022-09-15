/**
* Find elements in an XML file by their tag name, returns them all in an array.
*/
function getElementsByTagName(element, tagName) {
  var data = [];
  var descendants = element.getDescendants();
  for (i in descendants) {
    var elt = descendants[i].asElement();
    if (elt != null && elt.getName() == tagName) data.push(elt.getValue());
  }
  return data;
}

function footballScriptRunTimes() {
  const today = new Date();

  // Thursday 8:15pm
  // Friday 6pm early, 830pm late
  // Monday 715pm to 830pm

  const day = today.getDay(); // 0 is Sunday
  if (day == 2 || day == 3) {
    return false;
  }

  // Only run between reasonable hours
  const hour = today.getHours();
  if (hour < 10 || hour > 18) {
    return false;
  }

  return true;
}

function hockeyScriptRunTimes() {
  const today = new Date();

  // Run every day
  // Only run between reasonable hours
  const hour = today.getHours();
  if (hour < 10 || hour > 20) {
    return false;
  }
  return true;
}