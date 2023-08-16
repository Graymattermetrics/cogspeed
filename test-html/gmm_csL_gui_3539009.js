var GMM_Gui;
console.log("Loading GMM_GUI");
function initGMMGUI(T, Sp) {
  console.log("GMM GUI initializing...");
  //Privatess/////////////////////////////////////////////////////////////////

  //Public////////////////////////////////////////////////////////////////////
  var G = {};

  //Default screen maker
  G.makeScreen = function () {
    var sc, bg;

    sc = T.newScreenElement();
    sc.onFadeIn = function () {};
    sc.onFadeOut = function () {
      sc.destroy();
    };

    //Set the default fadeIn/fadeOut values
    sc.setFadeIn("slideLeft", 500, function () {
      sc.onFadeIn();
    });
    sc.setFadeOut("slideLeft", 500, function () {
      sc.onFadeOut();
    });

    //onFadeout callback
    onFadeout = T.bind(this, function () {
      //Clear screen from memory
      sc.destroy();
    });

    //Return the Screen
    return sc;
  };

  G.makeLabel = function (text) {
    var t = GMM_Gui.make_textElement(text, 35);
    t.getDOMElement().className = "whitetext";
    return t;
  };

  //Make and return a textbox
  function _makeTextBox(defaultText, type) {
    var tb = T.newDOMElement(type),
      d = tb.getDOMElement();
    tb.x = 0;
    tb.y = 0;
    tb.width = 500;
    tb.height = 60;

    d.placeholder = defaultText;
    d.className = "textbox";

    //Disable hints
    d.autocomplete = "off";
    d.autocorrect = "off";
    d.autocapitalize = "off";
    d.spellcheck = "false";

    //FontSize
    tb.fontSize = 35;
    d.style.fontSize = tb.fontSize * tb.scale;

    //Set Text
    tb.setText = function (string) {
      d.value = string;
    };

    return tb;
  }

  G.makeTextBox = function (defaultText) {
    return _makeTextBox(defaultText, "input");
  };

  G.makePasswordBox = function (defaultText) {
    var t = _makeTextBox(defaultText, "input"),
      d = t.getDOMElement();
    d.name = "password";
    d.type = "password";
    return t;
  };

  //Make and return a scrolling textbox
  G.makeScrollingTextBox = function (text) {
    var tb = T.newDOMElement("div"),
      d = tb.getDOMElement();
    tb.x = 0;
    tb.y = 0;
    tb.scaling_enabled = true;
    tb.width = 512;
    tb.height = 700;
    tb.scale = 0.95;

    d.className = "scrolltextbox";

    tb.setText = function (t) {
      d.innerHTML = t;
    };
    tb.setText(text);

    tb.scroll = function (y) {
      d.scrollTop += y;
    };

    return tb;
  };

  //Draws a glowy image
  G.drawImageGlowFunction = function (canvasData, drawData) {
    var c = canvasData,
      d = drawData,
      ctx = c.ctx,
      imgGlo = T.getSine(2400) * 0.5;

    //Draw default
    this.defaultDraw(c, d);

    //Draw glowy on top
    ctx.save();
    ctx.globalAlpha = imgGlo;
    ctx.globalCompositeOperation = "lighter";
    this.defaultDraw(c, d);
    ctx.restore();
  };

  //Make a glowy blue button and return it
  var _makeButton = function () {
    var e = T.newImgElement(Sp.okButton[0]);

    e.bbox = {
      x: -46,
      y: -35,
      w: 92,
      h: 70,
    };

    e.buttonActive = true;
    e.buttonText = "";
    e.buttonSprite = Sp.okButton;
    e.fontSize = 20;

    //Set the button text
    e.setText = function (text) {
      e.buttonText = text;
    };

    //Returns true if active
    e.isActive = function () {
      return e.buttonActive;
    };

    //Activate button (or a=false to deactivate)
    e.setActive = function (a) {
      if (a == undefined) {
        a = true;
      }
      e.buttonActive = a;
      e.disabled = !a;
    };

    //Button draw function
    e.drawFunction = function (c, d) {
      var ctx = c.ctx,
        imgGlo,
        frame;

      //Set the frame, text color if active
      if (e.buttonActive) {
        ctx.fillStyle = "#ffffff";
        frame = 1;
      } else {
        ctx.fillStyle = "#6493c9";
        ctx.globalAlpha *= 0.5;
        frame = 0;
      }

      //Set the image frame
      e.imgFrame = e.buttonSprite[frame];

      //NOTE:  Adding to dy is wrong, but it's a temp fix
      //Something's wrong with the draw data in _drawElement()...
      var dyoff = 16 * d.scale;
      d.y += dyoff;

      //Draw
      e.defaultDraw(c, d);

      //Draw Glowy
      if (e.buttonActive) {
        imgGlo = T.getSine(1200) * 0.5;
        ctx.save();
        ctx.globalAlpha *= imgGlo;
        ctx.globalCompositeOperation = "lighter";
        e.defaultDraw(c, d);
        ctx.restore();
      }

      d.y -= dyoff;

      //Draw the text
      ctx.save();
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = e.fontSize * d.scale + "px Trebuchet";
      ctx.fillText(this.buttonText, d.x, d.y);
      ctx.restore();
    };

    //Return the button
    return e;
  };

  G.makeButton = function () {
    return _makeButton();
  };

  //Make a large button and return it
  G.makeLargeButton = function () {
    var b = _makeButton();

    b.setImage(Sp.largeButton);
    b.buttonSprite = [b.imgFrame, b.imgFrame];
    b.bbox = {
      x: -230,
      y: -84,
      w: 460,
      h: 168,
    };

    b.fontSize = 67;

    return b;
  };

  G.drawBottomGlowText = function (text, offX) {
    var textAlf = T.getSine(1200) * 0.5 + 0.5,
      c = T.getCanvasData(),
      ctx = c.ctx,
      scalar = c.scalar;

    ctx.save();
    ctx.globalAlpha = textAlf;
    var fontSize = 45 * scalar;
    ctx.font = fontSize + "px Trebuchet";
    ctx.fillStyle = Color.lblue;
    ctx.textAlign = "center";
    ctx.fillText(text, c.cx + offX, c.h - 100 * scalar);
    ctx.restore();
  };

  G.makeBgGate = function (filename) {
    var e = T.newStaticBgElement(filename),
      gate_state = "closed",
      gateTween = null,
      gate_x = 1,
      //Note, this assumes img is a filename
      gate_img = T.getImage(filename).img,
      openCB,
      closeCB,
      onClose,
      onOpen,
      drawGate;
    e.width = "100%";
    e.height = "100%";
    e.halign = "left";
    e.valign = "top";

    onClose = function () {
      gateTween = null;
      gate_x = 1;
      gate_state = "closed";

      //external callback
      if (closeCB != undefined) {
        closeCB();
        closeCB = undefined;
      }
    };

    onOpen = function () {
      gateTween = null;
      gate_x = 0;
      gate_state = "open";

      //external callback
      if (openCB != undefined) {
        openCB();
        openCB = undefined;
      }
    };

    e.setOpen = function () {
      onOpen();
    };
    e.setClosed = function () {
      onClose();
    };

    e.open = function (callback, duration) {
      if (gate_state != "closed") {
        return false;
      }

      openCB = callback;
      duration = duration || 1000;
      gateTween = new T.Tween();
      gateTween.addInterval(duration);
      gateTween.setCallback(onOpen);
      gate_state = "opening";
    };

    e.close = function (callback, duration) {
      if (gate_state != "open") {
        return false;
      }

      closeCB = callback;
      duration = duration || 1000;
      gateTween = new T.Tween();
      gateTween.addInterval(duration);
      gateTween.setCallback(onClose);
      gate_state = "closing";
    };

    drawGate = function (c, x) {
      var isVertical = true;
      var canvas = c.canvas;
      var cx = c.cx;
      var ctx = c.ctx;
      var winW = c.w;
      var winH = c.h;
      //var boolRot = ((winH>winW) != isVertical);
      boolRot = true;

      var wcx = winW / 2;
      var wcy = winH / 2;

      var isx = 0;
      var isy = 0;

      var iw = 640;
      var ih = 960;

      var icx = iw / 2;
      var icy = ih / 2;

      var img = gate_img;
      var gateSheetImg = T.getImage(Sp.gateSheet).img;

      var wRatio = winW / winH;
      var iRatio = iw / ih;

      var dWcx = wcx + 40;

      ctx.save();
      if (boolRot) {
        ctx.translate(c.w, 0);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(img, 0, 0, iw, icy, 0, x * dWcx - dWcx, winH, wcx);
        ctx.drawImage(
          img,
          0,
          icy,
          iw,
          icy,
          0,
          -(x * dWcx) + winW + 40,
          winH,
          wcx
        );
      } else {
        ctx.drawImage(img, 0, 0, icx, ih, 0, 0, wcx, winH);
      }

      ctx.restore();

      for (var i = 0; i < 10; i++) {
        //Draw the teeth
        ctx.drawImage(
          gateSheetImg,
          0,
          0,
          40,
          128,
          x * dWcx - 40,
          i * 128,
          40,
          128
        );
        ctx.drawImage(
          gateSheetImg,
          40,
          0,
          40,
          128,
          -(x * dWcx) + winW,
          i * 128,
          40,
          128
        );
      }
    };

    e.drawFunction = function (c, d) {
      if (gateTween != null) {
        gateTween.update();

        //Double null check since it destroys on callback
        switch (gate_state) {
          case "opening":
            gate_x = T.arcFadeIn(gateTween.getTween());
            break;
          case "open":
            gate_x = 0;
            break;
          case "closing":
            gate_x = 1 - T.arcFadeOut(gateTween.getTween());
            break;
          case "closed":
            gate_x = 1;
            break;
        }
      }

      switch (gate_state) {
        case "opening":
          drawGate(c, gate_x);
          break;
        case "open":
          break;
        case "closing":
          drawGate(c, gate_x);
          break;
        case "closed":
          e.defaultDraw(c, d);
          break;
      }
    };

    return e;
  };

  G.make_textElement = function (text, size, className) {
    var t = T.newTextElement(text),
      d = t.getDOMElement();

    className = className || "bluetext";

    t.fontSize = size;
    t.id = text;

    d.className = className;
    t.setTextClass = function (className) {
      d.className = className;
    };

    return t;
  };

  G.makeCheckbox = function (label, callback) {
    var size = 35;

    var e = T.newElement(label);

    var cbox = T.newCheckboxElement(false);
    cbox.halign = "left";
    cbox.valign = "top";
    cbox.width = size;
    cbox.height = size;
    cbox.onValueChange = function (v) {
      callback(v);
    };

    var cboxTxt = make_textElement(label, size, "whitetext");
    cboxTxt.x = size * 1.5;
    cboxTxt.y = 0;
    cboxTxt.width = 500;
    cboxTxt.halign = "left";
    cboxTxt.valign = "top";

    var style = cboxTxt.getDOMStyle();
    style.color = "white";
    style.textAlign = "left";
    style.verticalAlign = "center";

    e.addChild(cbox);
    e.addChild(cboxTxt);
    e.isChecked = function () {
      return cbox.isChecked();
    };

    e.setChecked = function (bool) {
      return cbox.setChecked(bool);
    };

    return e;
  };

  //VVV Wow, this needs to be refactored....
  G.onClickCallback = function (scr, nextScreen, slideRight) {
    if (slideRight) {
      scr.setFadeOut("slideRight", 500);
    }
    scr.fadeOut();
    T.docAddChild(nextScreen());
  };

  function _makeLRButton(text, nextScreen, slideRight) {
    var b = _makeButton(),
      scr;
    b.y = -100;
    b.valign = "bottom";

    b.scale = 1.5;
    b.setActive();

    b.setText(text);

    b.onClick = function () {
      scr = b.parent;
      if (slideRight) {
        scr.setFadeOut("slideRight", 500);
      }

      scr.fadeOut();

      T.docAddChild(nextScreen());
    };

    return b;
  }

  G.makeCenterButton = function (text, nextScreen) {
    return (b = _makeLRButton(text, nextScreen, false));
  };

  G.makeLeftButton = function (text, nextScreen, panLeft) {
    if (panLeft == undefined) {
      panLeft = true;
    }
    var b = _makeLRButton(text, nextScreen, panLeft);
    b.x = -100;
    return b;
  };

  G.makeRightButton = function (text, nextScreen) {
    var b = _makeLRButton(text, nextScreen, false);
    b.x = 100;
    return b;
  };

  G.addOkButton = function (scr, nextScreen) {
    var b = _makeButton();
    b.y = -100;
    b.valign = "bottom";

    b.scale = 1.5;
    b.setActive();

    b.setText("Ok");
    b.x = 100;

    b.onClick = function () {
      scr.fadeOut();

      scr.onFadeout = function () {
        //Clear screen from memory
        sc.destroy();
      };

      T.docAddChild(nextScreen());
    };

    scr.addChild(b);

    return b;
  };

  G.addBackButton = function (scr, nextScreen) {
    var b = _makeButton();
    b.y = -100;
    b.valign = "bottom";

    b.scale = 1.5;
    b.setActive();

    b.setText("Back");

    b.onClick = function () {
      scr.setFadeOut("slideRight", 500);
      scr.fadeOut();

      scr.onFadeout = function () {
        //Clear screen from memory
        sc.destroy();
      };

      T.docAddChild(nextScreen());
    };

    scr.addChild(b);

    return b;
  };

  GMM_Gui = G;
} //end init function
