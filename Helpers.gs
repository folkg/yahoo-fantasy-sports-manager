/**
* Find elements in an XML file by their tag name, returns them all in an array.
*/
function getElementsByTagName(element, tagName) {  
  var data = [];
  var descendants = element.getDescendants();  
  for(i in descendants) {
    var elt = descendants[i].asElement();     
    if( elt !=null && elt.getName()== tagName) data.push(elt.getValue());
  }
  return data;
}

/*
This function borrowed from devinmcinnis @ https://github.com/devinmcinnis/yahoo-fantasy-start-active-players/blob/master/script.js
*/
function dateToString (date) {
  // From the new date we created, get the values for year, month, day
  var year = date.getFullYear();
  var month = date.getMonth() + 1;//dates run 0-11
  var day = date.getDate();
  
  // Same as in the beginning, if a month or day is a single digit,
  // add a '0' in front of it; again, for Yahoo
  if (month.toString().length === 1) {
    month = '0' + month;
  }
  
  if (day.toString().length === 1) {
    day = '0' + day;
  }
  
  return year + '-' + month + '-' + day;
}