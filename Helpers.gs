function footballScriptRunTimes() {
  const today = new Date();
  // Games are on:
  // Thursday 8:15pm EST
  // Friday 6pm early, 830pm late EST
  // Saturday: ??
  // Sunday 1pm early, 830pm late EST
  // Monday 715pm to 830pm EST

  // Run only during fantasy football season, starts in September and ends in December
  const month = today.getMonth();
  if (month < 8) return false; // months are zero indexed

  const day = today.getDay(); // 0 is Sunday  
  // Run every day but Tuesday and Wednesday
  if (day === 2 || day === 3) return false;

  // Only run between reasonable hours where we might have games (12 x per day still)
  const hour = today.getHours();
  if (hour < 8 || hour > 20) return false; // 8:55am will be first, 8:55pm will be last

  return true;
}

function hockeyScriptRunTimes() {
  const today = new Date();

  // Games usually between 11am (rare) and 20 (8pm) MST
  // Run only during fantasy hockey season, October through end of April
  const month = today.getMonth();
  if (month < 9 && month > 3) return false; // months are zero indexed

  // Run every day
  // Only run between reasonable hours where we might have games (12 x per day still)
  const hour = today.getHours();
  if (hour < 8 || hour > 20) return false; // 8:55am will be first, 8:55pm will be last

  return true;
}