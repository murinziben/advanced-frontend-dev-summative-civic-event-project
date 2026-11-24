window.CivicConfig = Object.freeze({
  APP_NAME: "CivicEvents",
  // The only place the backend address is set, so moving the API needs one change.
  API_ORIGIN: "http://localhost:4000",
  get API_BASE_URL() {
    return this.API_ORIGIN + "/api";
  },
  PAGE_SIZE: 9,
  // Mirrors the backend's multer limits so users see type/size errors before a slow upload fails.
  UPLOADS: {
    image: { maxBytes: 2 * 1024 * 1024, extensions: [".jpg", ".jpeg", ".png", ".gif"], label: "JPG, PNG or GIF, up to 2 MB" },
    audio: { maxBytes: 5 * 1024 * 1024, extensions: [".mp3", ".wav", ".m4a", ".ogg"], aliases: { ".mpeg": ".mp3", ".mpga": ".mp3" }, label: "MP3, WAV, M4A or OGG, up to 5 MB" },
    video: { maxBytes: 8 * 1024 * 1024, extensions: [".mp4", ".mov", ".avi", ".mkv"], label: "MP4, MOV, AVI or MKV, up to 8 MB" },
  },
  // Kept here (not in the HTML) so photos can be swapped without touching page markup; credits are in the README.
  PHOTOS: (function () {
    var unsplash = function (id, w) { return "https://images.unsplash.com/" + id + "?fm=jpg&q=72&w=" + (w || 1920) + "&auto=format&fit=crop"; };
    return {
      stadium: { src: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Ikibuga_cy%27umupira_cya_sitade_amahoro.jpg", caption: "Amahoro National Stadium, Kigali" },
      skyline: { src: unsplash("photo-1687986261123-b17f08f2796c"), caption: "Kigali skyline at sunset" },
      ecopark: { src: unsplash("photo-1786795468102-84cd1ac41cd8"), caption: "Nyandungu Eco-Park, Kigali" },
      lake: { src: unsplash("photo-1779900275257-aaadab6d9285"), caption: "Green hills and wetlands of Kigali" },
      fields: { src: unsplash("photo-1692019007242-36158877ec96"), caption: "Rice fields in rural Rwanda" },
      sunrise: { src: unsplash("photo-1511283878565-0833bf39de9d"), caption: "Sunrise over the Rwandan countryside" },
      // Local photos of real Kigali community events; paths are relative to the frontend root.
      amahoroNight: { src: "assets/images/slides/hero-amahoro.jpg", caption: "Amahoro National Stadium, Kigali" },
      soberGenRun: { src: "assets/images/slides/hero-sober-gen-run.jpg", caption: "Sober Gen run on Car Free Day, Kigali" },
      youthUmuganda: { src: "assets/images/slides/hero-youth-umuganda.jpg", caption: "Youth Special Umuganda, Kigali" },
      bannerCarFree: { src: "assets/images/slides/banner-car-free-day.jpg", caption: "Car Free Day workout, Kigali" },
      bannerSoberChou: { src: "assets/images/slides/banner-sober-chou.jpg", caption: "Sober Gen youth at Car Free Day" },
      bannerUmuganda: { src: "assets/images/slides/banner-youth-umuganda.jpg", caption: "Youth Special Umuganda, Kigali" },
      bannerAmahoro: { src: "assets/images/slides/banner-amahoro.jpg", caption: "Amahoro National Stadium, Kigali" },
    };
  })(),
  get HERO_SLIDES() {
    var p = this.PHOTOS;
    return [p.amahoroNight, p.soberGenRun, p.skyline, p.youthUmuganda, p.ecopark, p.stadium];
  },
  get BANNER_SLIDES() {
    var p = this.PHOTOS;
    return [p.bannerCarFree, p.bannerSoberChou, p.bannerUmuganda, p.bannerAmahoro, p.ecopark];
  },
  CONTACT: {
    address: "Kigali, Rwanda",
    phone: "+250 788 000 000",
    email: "support@civicevents.test",
  },
});
