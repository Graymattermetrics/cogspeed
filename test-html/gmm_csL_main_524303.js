/*!
 *  Cogspeed
 *
 *  (c) 2014 Gray Matter Metrics
 *  graymattermetrics.com
 *
 *  Developed by Mateo Williford of Tengu
 *  tenguapps.com
 *
 */

window.gmm_app_loaded = false;
var VN_STRING = "";
var NEWLINE_BREAK = "\r\n";
var STRING_TAB = "&nbsp&nbsp&nbsp&nbsp";

//Error Handler
window.onerror = function myErrorHandler(errorMsg, url, lineNumber) {
  alert("Error: " + errorMsg + "@ line " + lineNumber, url);
};

var App_Offline = window.App_Offline;

//Container for sprite pointers
var Sp = {};

//Container for color definitions
var Color = {
  lblue: "#C2E2FF",
  mblue: "#6493c9",
  lgray: "#a5bbd4",
  llgray: "#cdd7e3",
  gray: "#697788",
};

//Global Bg element
var Bg;

// //Global Login Session reference
// var Session;

//Global UnderBg element
var UnderBg;

//makeScreen_home ref (temp until refactor....)
var makeScreen_home = function () {
  console.error("makeScreen_home not defined");
};

//Test Data Object
var Data;

//Record Object (used for fileio)
var Record;

var StringTable = {
  sleep_quality: ["Poor", "Restless", "Good"],
};

Tengu(function (T) {
  //Load all the images into Sp
  function loadImages() {
    var spW, px, py, i, n;

    //Load Images
    Sp.buttonStrip = T.loadImage("smallButton128x96_5177373.png");
    Sp.arrow = T.loadImage("arrow_80.png");
    Sp.cpButtonStrip = T.loadImage("cpButtonStrip_80_7995411.png");
    Sp.numLetKey = T.loadImage("numletkey_580x850.png");
    Sp.largeButton = T.loadImage("largeButton_620x320_6226017.png");
    Sp.csLogo = T.loadImage("CSLogo_512x512_4456463.png");
    Sp.csLogoGears = T.loadImage("CSLogo_wGears_512x512_3342354.png");
    Sp.wTri = T.loadImage("warningTriangle64x64_3342424.png");
    Sp.rDem = T.loadImage("readyDemo_512_6357015.png");
    Sp.gateSheet = T.loadImage("gateTeeth_40x128_6553716.png");
    Sp.gear = T.loadImage("gear512.png");
    Sp.gearSix = T.loadImage("gear6_512.png");
    Sp.gearWell = T.loadImage("gearWell_540_786454.png");
    Sp.displayTarget = T.loadImage("displayNum_192_5177425.png");
    Sp.testB = T.loadImage("testButton_192_6946936.png");
    Sp.testBInvert = T.loadImage("testButtonInvert_192_1376309.png");
    Sp.letNumSheet = T.loadImage("letNum_96_5767284.png");
    Sp.letNumInvertSheet = T.loadImage("letNumInvert_96_2555961.png");
    Sp.blueGear128 = T.loadImage("blueGear_128_28.png");
    Sp.blueGear96 = T.loadImage("blueGear_96_40.png");
    Sp.logoGear0 = T.loadImage("logoGear0_3145837.png");
    Sp.logoGear1 = T.loadImage("logoGear1_3145836.png");
    Sp.logoGear2 = T.loadImage("logoGear2_3145839.png");
    Sp.rIconsSheet = T.loadImage("resultsIcons_80_3014668.png");
    Sp.sleepqualityIconsSheet = T.loadImage("sleepQualityIcons_80_6029350.png");
    Sp.csMeterBack = T.loadImage("csMeterBack_512_1769557.png");
    Sp.csMeterNeedle = T.loadImage("csMeterNeedle_1245244.png");
    Sp.timespin = T.loadImage("timeSpin_320x224_68.png");
    Sp.timespin_long = T.loadImage("timeSpin2_432x112_1048676.png");
    Sp.dashMeter = T.loadImage("dashMeter_640x480_327726.png");
    Sp.dbWin0 = T.loadImage("db_win0.png");
    Sp.dbWin1 = T.loadImage("db_win1.png");
    Sp.dbWinELSR = T.loadImage("db_win_elsr.png");
    Sp.guiIconSheet = T.loadImage("guiIcon_sheet_76_8323094.png");
    Sp.roundArrow0 = T.loadImage("roundArrow0_6422590.png");
    Sp.roundArrow1 = T.loadImage("roundArrow1_6422591.png");
    Sp.roundArrow2 = T.loadImage("roundArrow2_6422588.png");
    Sp.touchhand = T.loadImage("touchhand128.png");
    Sp.tinygearstrip = T.loadImage("tinygear32.png");

    Sp.carbonBg = T.loadImage("bg_carbon640x960.jpg");
    Sp.steelBg = T.loadImage("bg_steel640x960.png");

    //Load Sprites
    Sp.iconAwake = T.newImgFrame("resultsIcons_80_3014668.png", 0, 0, 80, 80);
    Sp.iconAsleep = T.newImgFrame("resultsIcons_80_3014668.png", 80, 0, 80, 80);
    Sp.iconSQ = T.newImgFrame("resultsIcons_80_3014668.png", 160, 0, 80, 80);

    Sp.guiIcon = {};
    var guiIconKey = ["home", "graph", "list", "zoomout", "zoomin", "page_dl"],
      max = guiIconKey.length;
    spW = 76;
    for (i = 0; i < max; i += 1) {
      var k = guiIconKey[i];
      Sp.guiIcon[k] = T.newImgFrame(
        "guiIcon_sheet_76_8323094.png",
        i * spW,
        0,
        spW,
        spW
      );
    }

    Sp.sleepqIcon = [];
    spW = 80;
    for (i = 0; i < 3; i++) {
      Sp.sleepqIcon.push(
        T.newImgFrame("sleepQualityIcons_80_6029350.png", i * spW, 0, spW, spW)
      );
    }

    Sp.cpButton = [];
    spW = 80;
    for (i = 0; i < 5; i++) {
      Sp.cpButton.push(
        T.newImgFrame("cpButtonStrip_80_7995411.png", i * spW, 0, spW, spW)
      );
    }

    Sp.okButton = [];
    spW = 128;
    for (i = 0; i < 2; i++) {
      Sp.okButton.push(
        T.newImgFrame("smallButton128x96_5177373.png", i * spW, 0, 128, 96)
      );
    }

    Sp.tinygear = [];
    spW = 32;
    for (i = 0; i < 2; i++) {
      Sp.tinygear.push(T.newImgFrame("tinygear32.png", i * spW, 0, spW, spW));
    }

    spW = 96;
    Sp.letnum = [];
    Sp.letnumInvert = [];
    for (i = 0; i < 18; i++) {
      px = (i % 4) * spW;
      py = Math.floor(i / 4) * spW;
      Sp.letnum.push(T.newImgFrame("letNum_96_5767284.png", px, py, spW, spW));
      Sp.letnumInvert.push(
        T.newImgFrame("letNumInvert_96_2555961.png", px, py, spW, spW)
      );
    }
  }

  //Make the loading screen and return it
  function makeScreen_loading() {
    console.log("Making screen");
    var c = T.updateCanvasData(),
      sc,
      spLogo,
      txtLoading,
      timer,
      timedout,
      loaded,
      clicked,
      fading,
      onTimeout,
      onFadeout,
      onLoad,
      onClick,
      onEvent,
      logo,
      tween,
      p1 = [],
      p2 = [];

    //Make the screen, add the logo and text
    sc = T.newScreenElement();

    tween = new T.Tween();
    tween.addInterval(1000);
    tween.addInterval(1000);

    logo = T.newElement();
    logo.setWidthHeight(512, 512);
    logo.setPosition(0, -150);
    logo.scale = 1;

    logo.drawFunction = function (c, d) {
      console.log("Draw function called'", d.x, d.y, d.scale)
      var ctx = c.ctx,
        dx = d.x, //no idea why the x is so far off....
        dy = d.y,
        p;

      //Draw the gmm text
      //T.drawImgFrame(ctx,Sp.gmmLogoText,d.x + (15 * d.scale),d.y + (454*d.scale),d.scale,d.scale);
      T.drawImgFrame(
        ctx,
        Sp.gmmLogoText,
        dx,
        dy + 198 * d.scale,
        d.scale,
        d.scale
      );
      p1[0] = {
        x: dx - 150 * d.scale,
        y: dy,
        scale: 0.75 * d.scale,
        rot: 0,
        sprite: Sp.gmmLogo_g,
      };
      p1[1] = {
        x: dx - 10 * d.scale,
        y: dy,
        scale: 1.5 * d.scale,
        rot: 0,
        sprite: Sp.gmmLogo_m0,
      };
      p1[2] = {
        x: dx + 150 * d.scale,
        y: dy,
        scale: 1.5 * d.scale,
        rot: 0,
        sprite: Sp.gmmLogo_m1,
      };

      p2[0] = {
        x: dx,
        y: dy - 50 * d.scale,
        scale: 1.64 * d.scale,
        rot: 0,
        sprite: Sp.gmmLogo_g,
      };
      p2[1] = {
        x: dx - 140 * d.scale,
        y: dy - 40 * d.scale,
        scale: 1.64 * d.scale,
        rot: -Math.PI / 2,
        sprite: Sp.gmmLogo_m0,
      };
      p2[2] = {
        x: dx - 10 * d.scale,
        y: dy - 200 * d.scale,
        scale: 1.64 * d.scale,
        rot: -0.15,
        sprite: Sp.gmmLogo_m1,
      };

      tween.update();
      var t = 0;
      if (tween.getIndex() > 0) {
        t = tween.getTween();
      }
      if (t < 0) {
        t = 1;
      }

      for (i = 0; i < 3; i += 1) {
        p = {
          x: (p2[i].x - p1[i].x) * t + p1[i].x,
          y: (p2[i].y - p1[i].y) * t + p1[i].y,
          scale: (p2[i].scale - p1[i].scale) * t + p1[i].scale,
          rot: (p2[i].rot - p1[i].rot) * t + p1[i].rot,
          sprite: p1[i].sprite,
        };
        T.drawImgFrame(ctx, p.sprite, p.x, p.y, p.scale, p.scale, p.rot);
      }
    };

    sc.addChild(logo);

    /*
        //Make the logo element
        spLogo = T.newImgElement(Sp.gmmLogo);
        spLogo.id = "gmmLogo";
        spLogo.setPosition("50%","40%");
        spLogo.setAlign("left","top");
        spLogo.scale = 1.10;
        //sc.addChild( spLogo );
        
        var logoG = T.newImgElement(Sp.gmmLogo_g);
        logoG.setPosition("50%","35%");
        logoG.setAlign("left","top");
        logoG.scale = 1.8;
        sc.addChild( logoG );
        
        var logoText = T.newImgElement(Sp.gmmLogoText);
        logoText.setPosition("50%","65%");
        logoText.setAlign("left","top");
        logoText.scale = 1.10;
        sc.addChild( logoText );
        
        */

    //Make the text element
    txtLoading = T.newElement();
    txtLoading.drawFunction = function (cData, drawData) {
      var c = Math.floor(T.getSine(2400) * 127.5 + 127.5);
      ctx = cData.ctx;
      d = drawData;

      ctx.save();
      ctx.font = Math.round(d.scale * 60) + "px Trebuchet";
      ctx.fillStyle = T.rgbToString(c, c, c);
      ctx.textAlign = "center";
      ctx.fillText("loading...", d.x, d.y);
      ctx.restore();
    };

    txtLoading.y = -150;
    txtLoading.setAlign("bottom");
    sc.addChild(txtLoading);

    //Generalized 'event' callback for this screen
    onEvent = T.bind(this, function () {
      if (loaded && !fading) {
        if (timedout || clicked) {
          //Fadeout
          sc.fadeOut();
          fading = true;
        }
      }
    });

    //onFadeout callback
    onFadeout = T.bind(this, function () {
      //Clear the onClickAnywhere to be safe
      sc.onClickAnywhere = undefined;

      //Make the under bg element (for test use)
      UnderBg = T.newElement("UnderBg");
      UnderBg.halign = "left";
      UnderBg.valign = "top";
      UnderBg.width = "100%";
      UnderBg.height = "100%";

      //Make the bg element
      console.log(GMM_Gui);
      Bg = GMM_Gui.makeBgGate(Sp.carbonBg);

      //Add the bg elements to the document
      T.docAddChild(UnderBg);
      T.docAddChild(Bg);

      var nextscr;

      //Make the Home screen and add to doc
      if (false) {
        //if (GMM_Session.isLoggedIn()) {
        nextscr = makeScreen_cp;
        //T.docAddChild(makeScreen_cp());
      } else {
        nextscr = makeScreen_login;
        //T.docAddChild(makeScreen_login());
      }

      //This is so ghetto, but it works :p
      T.docAddChild(
        (function () {
          var sc = nextscr();
          sc.setFadeIn("white", 0);
          return sc;
        })()
      );

      //Clear screen from memory
      sc.destroy();
    });

    //Timeout callback
    onTimeout = T.bind(this, function () {
      timedout = true;
      onEvent();
    });

    //Load callback
    onLoad = T.bind(this, function () {
      loaded = true;
      txtLoading.visible = false;
      onEvent();
    });

    //onClick callback
    onClick = T.bind(this, function () {
      if (!clicked) {
        clicked = true;
        onEvent();
      }
    });

    //Set the fade and the click callback
    sc.onClickAnywhere = onClick;
    sc.setFadeIn("white", 1000);
    sc.setFadeOut("white", 0, onFadeout);

    //Set the timer
    timer = window.setTimeout(onTimeout, 3000);

    //Load the Images
    loadImages();
    //Call onLoad once Images are loaded
    T.setImgLoadCallback(onLoad);
    //Call onLoad if app is offline
    // T.appCache_onOffline(onLoad);

    //Return the screen
    return sc;
  }

  makeScreenPart_login = function () {
    T.clearFadeOverlay();
    var scp = T.newElement(),
      b,
      t = [],
      invalidTxt,
      _loadingGears;

    scp.width = "100%";
    scp.height = "100%";
    scp.id = "sPart Login";
    scp.halign = "left";
    scp.valign = "top";

    var onLogin = function () {
      var name = t[0].getValue(),
        pass = t[1].getValue();
      //Start gears anim
      _loadingGears.setActive(true);

      //Note, Session calls Record and tells it to login
      GMM_Login(
        name,
        pass,
        function () {
          //onSuccess
          console.log("onSuccess Main");

          var p = scp.parent;
          //Make the control panel
          p.swapSP(makeScreenPart_cp);
        },
        function (e) {
          //Set the error text
          if (e.message && T.isString(e.message)) {
            invalidTxt.setText(e.message);
          } else {
            invalidTxt.setText("Can't log in, message: 2214");
          }
          //Make the error message visible
          invalidTxt.visible = true;
          _loadingGears.setActive(false);
        }
      );
    };

    //No signup in app since v0.9
    // var onSignup = function() {
    //     var p = scp.parent;
    //     p.fadeOut();

    //     p.onFadeout = function() {
    //         //Clear screen from memory
    //         p.destroy();
    //     };

    //     T.docAddChild(makeScreen_tos());
    // };

    //Make the buttons
    var onFieldValChange = function () {
      var a = t[0].getValue() != "" && t[1].getValue() != "";
      b.setActive(a);
    };

    b = GMM_Gui.makeCenterButton("Login");
    b.setActive(false);
    b.onClick = function () {
      if (b.isActive) {
        onLogin();
      }
    };
    scp.addChild(b);

    t[0] = GMM_Gui.makeTextBox("User Name");
    t[0].y = 150;
    t[0].halign = "center";
    t[0].id = "username";
    t[0].onValueChange = onFieldValChange;

    t[1] = GMM_Gui.makePasswordBox("Password");
    t[1].y = 230;
    t[1].id = "password";
    t[1].onValueChange = onFieldValChange;

    invalidTxt = GMM_Gui.make_textElement(
      "User Name or Password is invalid.",
      30,
      "whitetext"
    );
    invalidTxt.x = -230;
    invalidTxt.y = 265;
    invalidTxt.width = 500;
    invalidTxt.fontSize = 30;
    invalidTxt.visible = false;

    for (i = 0; i < 2; i += 1) {
      scp.addChild(t[i]);
    }
    scp.addChild(invalidTxt);

    //Make gears
    //Args: screen_part, login button
    _loadingGears = (function (scp, button) {
      var b = button,
        g = [],
        rot,
        i;
      for (i = 0; i < 2; i += 1) {
        g[i] = T.newImgElement(Sp.blueGear96);
        g[i].scale = 0.5;
        g[i].x = -100 + i * 200;
        g[i].y = -100;
        g[i].setAlign("center", "bottom");
        g[i].visible = false;
        scp.addChild(g[i]);

        g[i].drawFunction = function (c, d) {
          var ctx = c.ctx,
            s = c.scalar * 0.5,
            r = T.getIntervalRot(5000, true);
          T.drawImgFrame(ctx, Sp.blueGear96, d.x, d.y, s, s, r);
        };
      }

      //Interface
      var lg = {};
      lg.setActive = function (bool) {
        b.setActive(!bool);
        g[0].visible = bool;
        g[1].visible = bool;
      };
      return lg;
    })(scp, b);

    return scp;
  };

  function makeScreenPart_csLogo() {
    var logo = T.newImgElement(Sp.csLogo),
      gear = [],
      sp = [Sp.logoGear0, Sp.logoGear1, Sp.logoGear2],
      _cpi,
      _rS = 0,
      pos = [
        {
          x: 276,
          y: 177,
        },
        {
          x: 206,
          y: 257,
        },
        {
          x: 190,
          y: 140,
        },
      ],
      i;
    logo.setPosition("50%", "33.33%");
    logo.setAlign("left", "top");
    logo.scale = 1;
    logo.drawFunction = GMM_Gui.drawImageGlowFunction;

    for (i = 0; i < 3; i += 1) {
      gear[i] = T.newImgElement(sp[i]);
      gear[i].setAlign("center", "middle");
      gear[i].scale = 1;
      gear[i].setPosition(pos[i].x - 512, pos[i].y - 512);
      gear[i].rotDir = false;
      gear[i].drawFunction = function (c, d) {
        var dd = undefined, //Data.getDashData(),
          speed;

        if (dd) {
          if (dd.results.cpi != _cpi) {
            speed = (dd.results.cpi / 100) * 0.0001;
            _rS = 1 / speed;
          }
        } else {
          _rS = 0;
        }

        this.rotation = T.getIntervalRot(_rS, this.rotDir);
        T.bind(this, GMM_Gui.drawImageGlowFunction)(c, d);
      };

      logo.addChild(gear[i]);
    }
    gear[0].rotDir = true;

    //Temp for clock testing
    logo.onClick = function () {
      var t = T.date(),
        d = new Date(t),
        s = "";
      s += "Time (ms): " + t + NEWLINE_BREAK;
      s += "UTC Date: " + d.toUTCString() + NEWLINE_BREAK;
      s +=
        "Local Date: " + d.toLocaleDateString() + " " + d.toLocaleTimeString();

      //alert(s);
    };

    return logo;
  }

  //These need to be independent (really need to refactor this)
  var homescreenSCF = {
    a: makeScreenPart_login,
    b: null,
    swapped: false,
  };

  //Make the home screen and return it
  //Make login screen if makelogin is true, else make cp
  makeScreen_home = function (makelogin) {
    var b = [],
      scF = homescreenSCF,
      sc,
      scp_a,
      scp_b,
      tween,
      default_predraw,
      onSPTweenout,
      i;

    var _swapScreenMakers = function (newScreen) {
      var ns = scF.b;
      if (T.isFunction(newScreen)) {
        ns = newScreen;
      }
      var f = scF.a;
      scF.a = ns;
      scF.b = f;
      scF.swapped = !scF.swapped;
    };

    if (!makelogin && !scF.swapped) {
      //Swap the screen part maker functions
      _swapScreenMakers();
    }

    //Make the Screen Part
    scp_a = scF.a();

    //Make the screen, set fade
    sc = GMM_Gui.makeScreen();
    default_predraw = sc.preDrawFunction;
    sc.setFadeIn("white", 500);
    sc.setFadeOut("slideLeft", 500);

    //Add elements to screen
    sc.addChild(makeScreenPart_csLogo());
    sc.addChild(scp_a);

    //Swap the screen parts (public)
    sc.swapSP = function (newScreen) {
      _swapScreenMakers(newScreen);
      //Move the old screen to scp_b
      scp_b = scp_a;
      //Make a new screen in scp_a
      scp_a = scF.a();
      scp_a.alpha = 0;
      sc.addChild(scp_a);

      //Make the tween w callback
      tween = new T.Tween();
      tween.addInterval(500);
      tween.setCallback(onSPTweenout);
    };

    onSPTweenout = function () {
      scp_b.destroy();
      scp_b = null;
    };

    sc.preDrawFunction = function (c, d) {
      var alf;
      //Do default predraw...
      default_predraw.call(sc, c, d);

      //Default alpha 1 and scp_a accepts input
      alf = 1;
      scp_a.disabled = false;

      if (tween != null) {
        //Update tween, set alf to tween value
        tween.update();
        if (tween.getIndex() < 1) {
          alf = tween.getTween();
          //Disable input while tweening
          scp_a.disabled = true;
        } else {
          tween = null;
        }

        //Set the screen parts alpha
        scp_a.alpha = alf;

        if (scp_b != null) {
          scp_b.alpha = 1 - alf;
          scp_b.disabled = true;
        }
      }
    };

    //Return screen
    return sc;
  };

  //Make the login screen and return it
  function makeScreen_login() {
    return makeScreen_home(true);
  }

  ////////////////////////////////////////////////////////////////////////////////////////

  //////////////////////////////////////////////////////////////////////////////////////////////

  $(document).ready(function () {
    //Sha3 test
    //http://stackoverflow.com/questions/20522661/how-to-calculate-a-256-bit-hmac-sha3-hash-with-cryptojs
    // (function(){
    //     console.log("SHA3 test");
    //     var start,duration;
    //     start = T.now();
    //     console.log("username|password",CryptoJS.SHA3("username|password").toString());
    //     duration = T.now()-start;
    //     console.log("SHA3 duration: "+duration);

    //     //T.afk(function(){
    //     //    console.log("AFK!!!!");
    //     //},1000);
    //     var stringReplaceAll = function(str,str1, str2, ignore) {
    //         return str.replace(new RegExp(str1.replace(/([\/\,\!\\\^\$\{\}\[\]\(\)\.\*\+\?\|\<\>\-\&])/g,"\\$&"),(ignore?"gi":"g")),(typeof(str2)=="string")?str2.replace(/\$/g,"$$$$"):str2);
    //     };
    //     // var a = 'ABCD"EFG ';
    //     // var b = replaceAll(a,'"', '\\"');
    //     // var c = "ABCD\"EFG"
    //     // console.log(a,b,c);//tengu.escapeDQuotes
    //     var a = 'ABCD"EFG\\HIJKLM\\"NOP';
    //     var b = T.safeDQuoteString(a);
    //     console.log(a,b);
    // }());

    (function () {
      //Testing window.navigator
      console.log("window.navigator", window.navigator);
      console.log("window.screen", window.screen);
      console.log("window", window);
      console.log("T.getDeviceData", T.getDeviceData());
    })();

    //Set the global localStorage key
    T.setGlobalKey("GMM");

    //Legacy Compatibility
    T.disableDOMScaling();

    //Disable rightclick
    T.disableRightClick();

    //Init Test Data
    //Data = new GMM_TestData(TestConstants);

    //Load the external modules
    // initGMMServerAPI(T);
    // initTestConfig(T, TestConstants);
    // wrapTestModel(T, Data);
    // initGMMRecord(T,Data);
    // initGMMSession(T,GMM_Record);
    // initTestController(T);
    // initGMMReport(T);
    //Init GMM_Graph and GMM_Table
    //initGMMGraph(T, GMM_Record);

    //Init the gui functions
    initGMMGUI(T, Sp);
    //Load external modules for LAUNCHER
    initGMMLogin(T);

    // var r = GMM_Record.getSyncJSON("forced_username_bob");
    // console.log("r",r);

    //Temp
    //GMM_Record.getSyncJSON();

    //Temp//////////////////////////////////////////////
    // (function() {
    //     var D = {
    //             email: "roy@gmail.com",
    //             password: "Pass#123"
    //         },
    //         S = GMM_ServerAPI;
    //     console.log("temp func called");
    //     S.authenticate(D.email, D.password);
    // }())

    //end Temp////////////////////////////////////////////

    document.title = "CogSpeed";
    //Set the canvas to fullscreen
    T.canvasFillScreen();

    //Create the loading screen once the logo is loaded
    var onLoadLogo = function () {
      T.docAddChild(makeScreen_loading());
    };
    Sp.gmmLogo_g = T.loadImage("gmm_g.svg");
    Sp.gmmLogo_m0 = T.loadImage("gmm_m0.svg");
    Sp.gmmLogo_m1 = T.loadImage("gmm_m1.svg");
    Sp.gmmLogoText = T.loadImage("gmmLogoText_480_3407989.jpg");
    Sp.gmmLogo = T.loadImage("gmmLogo_512_1114215.jpg");

    T.setImgLoadCallback(onLoadLogo);

    //T.localStorageLog();
  });
});
