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
  // Saturday: ??
  // Sunday 1pm early, 830pm late EST
  // Monday 715pm to 830pm EST

  const day = today.getDay(); // 0 is Sunday  
  // Run every day but Tuesday and Wednesday
  if (day === 2 || day ===3) return false;

  // Only run between reasonable hours where we might have games (12 x per day still)
  const hour = today.getHours();
  if (hour < 8 || hour > 20) return false; // 8:55am will be first, 8:55pm will be last

  return true;
}

function hockeyScriptRunTimes() {
  const today = new Date();

  // Games usually between 11am (rare) and 20 (8pm) MST

  // Run every day
  // Only run between reasonable hours where we might have games (12 x per day still)
  const hour = today.getHours();
  if (hour < 8 || hour > 20) return false; // 8:55am will be first, 8:55pm will be last

  return true;
}