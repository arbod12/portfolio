/* ============================================================
   YOUR PLAYLISTS  —  edit this file to add or move music
   ------------------------------------------------------------
   Files use simple names (track01.mp3 ... track15.mp3) so they
   can't get mangled on upload. They must live in the audio/
   folder next to index.html.

   Track reference:
     track01 Life is Beautiful (Aylex)      track09 Sunflower (Lukrembo)
     track02 At Ease (Hazelwood)            track10 This Is For You (Lukrembo)
     track03 Coming Of Age (Hazelwood)      track11 Feeling Good (Pufino)
     track04 Bread (Lukrembo)               track12 Vibing (Pufino)
     track05 Chocolate (Lukrembo)           track13 gingersweet (massobeats)
     track06 Donut (Lukrembo)               track14 honey jam (massobeats)
     track07 Jay (Lukrembo)                 track15 rose water (massobeats)
     track08 Rose (Lukrembo)
   ============================================================ */
window.SITE_PLAYLISTS = {

  // Homepage — full mix, all 15 tracks
  home: [
    { title:'Life is Beautiful', artist:'Aylex',      src:'audio/track01.mp3' },
    { title:'At Ease',           artist:'Hazelwood',   src:'audio/track02.mp3' },
    { title:'Coming Of Age',     artist:'Hazelwood',   src:'audio/track03.mp3' },
    { title:'Bread',             artist:'Lukrembo',    src:'audio/track04.mp3' },
    { title:'Chocolate',         artist:'Lukrembo',    src:'audio/track05.mp3' },
    { title:'Donut',             artist:'Lukrembo',    src:'audio/track06.mp3' },
    { title:'Jay',               artist:'Lukrembo',    src:'audio/track07.mp3' },
    { title:'Rose',              artist:'Lukrembo',    src:'audio/track08.mp3' },
    { title:'Sunflower',         artist:'Lukrembo',    src:'audio/track09.mp3' },
    { title:'This Is For You',   artist:'Lukrembo',    src:'audio/track10.mp3' },
    { title:'Feeling Good',      artist:'Pufino',      src:'audio/track11.mp3' },
    { title:'Vibing',            artist:'Pufino',      src:'audio/track12.mp3' },
    { title:'gingersweet',       artist:'massobeats',  src:'audio/track13.mp3' },
    { title:'honey jam',         artist:'massobeats',  src:'audio/track14.mp3' },
    { title:'rose water',        artist:'massobeats',  src:'audio/track15.mp3' },
  ],

  // SpacePlanner — calm, spacious
  spaceplanner: [
    { title:'At Ease',         artist:'Hazelwood', src:'audio/track02.mp3' },
    { title:'Coming Of Age',   artist:'Hazelwood', src:'audio/track03.mp3' },
    { title:'Sunflower',       artist:'Lukrembo',  src:'audio/track09.mp3' },
  ],

  // LedgerLens — focused, heads-down
  ledgerlens: [
    { title:'Feeling Good',    artist:'Pufino',   src:'audio/track11.mp3' },
    { title:'Vibing',          artist:'Pufino',   src:'audio/track12.mp3' },
    { title:'Jay',             artist:'Lukrembo', src:'audio/track07.mp3' },
  ],

  // PromptLab — bright, creative
  promptlab: [
    { title:'Life is Beautiful', artist:'Aylex',     src:'audio/track01.mp3' },
    { title:'Chocolate',         artist:'Lukrembo',  src:'audio/track05.mp3' },
    { title:'gingersweet',       artist:'massobeats',src:'audio/track13.mp3' },
  ],

  // ClarityCheck — clean, mellow
  claritycheck: [
    { title:'rose water',      artist:'massobeats', src:'audio/track15.mp3' },
    { title:'Rose',            artist:'Lukrembo',   src:'audio/track08.mp3' },
    { title:'This Is For You', artist:'Lukrembo',   src:'audio/track10.mp3' },
  ],

  // TimeBlock — upbeat, keep-moving
  timeblock: [
    { title:'honey jam',       artist:'massobeats', src:'audio/track14.mp3' },
    { title:'Bread',           artist:'Lukrembo',   src:'audio/track04.mp3' },
    { title:'Donut',           artist:'Lukrembo',   src:'audio/track06.mp3' },
  ],

};
