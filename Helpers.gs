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
  // Games are on:
  // Thursday 8:15pm EST
  // Friday 6pm early, 830pm late EST
  // Sunday 1pm early, 830pm late EST
  // Monday 715pm to 830pm EST

  const day = today.getDay(); // 0 is Sunday
  const hour = today.getHours();
  
  if (day === 3) {// Wednesday, just so it's ready to go for the week
    // between 7am and 9am MST (9am and 11am EST)
    if (hour > 7 && hour < 9) return true;
    
  } else if (day === 4) { // Thursday
    // between 4pm and 7pm MST (6pm and 9pm EST)
    if (hour > 16 && hour < 19) return true;

  } else if (day === 0) { // Sunday
    // between 9am and 7pm MST (11am and 9pm EST)
    if (hour > 9 && hour < 19) return true;

  } else if (day === 1) { // Monday
    // between 3pm and 7pm MST (5pm and 9pm EST)
    if (hour > 15 && hour < 19) return true;
  }

  return false;
}

function hockeyScriptRunTimes() {
  const today = new Date();

  // Games usually between 11am (rare) and 20 (8pm) MST

  // Run every day
  // Only run between reasonable hours where we might have games (10 x per day still)
  const hour = today.getHours();
  if (hour < 10 || hour > 20) {
    return false;
  }
  return true;
}