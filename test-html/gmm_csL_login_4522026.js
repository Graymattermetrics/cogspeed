var GMM_Login, GMM_UrlBase;
console.log("csL_login run");

//Still uses jquery for now
function initGMMLogin(T) {
  //Privates///////////////////////////////////
  var _returnObj = null;

  //Private objects////////////////////////////////
  var AllUrlBase = (function () {
    var _url_base = "https://www.cogspeed.com",
      _alpha_base = "https://cogspeed1-test.azurewebsites.net/",
      _base_array = [_url_base, _alpha_base],
      _magicNamePass = {
        name: "alphaman",
        pass: "Capri7381",
      };
    _target = 0;

    //Public Interface//////////////////////////
    var U = {};
    U.get = function () {
      return _base_array[_target];
    };

    U.swap = function () {
      //Flip index
      _target = _target ? 0 : 1;
      return _base_array[_target];
    };

    U.checkNamePass = function (name, pass) {
      return name == _magicNamePass.name && pass == _magicNamePass.pass;
    };
    return U;
  })();
  GMM_UrlBase = AllUrlBase;

  // var VersionIcon = (function(){
  //     var _iconDiv;
  //     var _create = function(){
  //         var s;
  //         _iconDiv = document.createElement('div');
  //         s = _iconDiv.style;

  //         s.zIndex = -100;
  //         s.borderColor
  //         s."border-weight":"1px",
  //         s."border-style":"solid"

  //     };
  // }());

  //Private methods////////////////////////////////
  //Creates a file from a string and returns url pointing to it
  var _stringToURL = function (string, type) {
    type = type || "text/plain";
    window.URL = window.webkitURL || window.URL;
    var blob = new Blob([string], {
      type: type,
    });
    return window.URL.createObjectURL(blob);
  };
  //Load js from string and add to document head
  //Returns link to dom element
  //Calls callback once script is loaded
  var _appendJS = function (text, callback) {
    callback = callback || function () {};
    var head = document.getElementsByTagName("head")[0],
      script = document.createElement("script");
    script.type = "text/javascript";
    script.src = _stringToURL(text, script.type);
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);

    return script;
  };
  var _validateLocalAppData = function () {
    //Get app data
    var a = _loadAppData();
    //Is it a string?
    if (!T.isString(a)) {
      return false;
    }
    //Does it have a reasonable length?
    if (a.length < 1000) {
      return false;
    }
    return true;
  };
  var _getVersion = function () {
    if (!_validateLocalAppData) {
      //locally stored app data is invalid
      return 0;
    }

    var vs = T.localGet("version_number");
    if (!vs) {
      //Local version not a string (or just not stored)
      return 0;
    }

    var vno = T.versionToFloat(vs);

    if (!T.isValidNum(vno)) {
      //Local version isn't a valid number
      console.warn("Invalid local version number: ", vs);
      return 0;
    }

    return vno;
  };

  //Save appdata
  var _saveAppData = function (appdata) {
    if (!T.isString(appdata) || !appdata) {
      throw new Error("Appdata isn't a string", appdata);
      return false;
    }
    T.localSet("appdata", appdata);
  };

  //Get appdata
  var _loadAppData = function () {
    return T.localGet("appdata");
  };

  //Weird, but not sure how else to get into the global namespace
  //Returns GMM_Session!!! (odd, but hard to get to otherwise because of namespacing)
  var _evalData = function (data) {
    //_appendJS(data);
    //with (window){
    eval(data);
    //}
    return GMM_Session;
  };

  var _runLocalAppData = function (success, fail) {
    var appdata = _loadAppData();
    if (T.isString(appdata) && appdata) {
      var Session = _evalData(appdata);
      // console.log("///////////////////////////////////////////////////////////");
      // console.log(appdata);
      // console.log("///////////////////////////////////////////////////////////");

      success(Session);
      return true;
    } else {
      e = {
        name: "NOAPPDATA",
        message: "Error - appdata not available",
      };
      fail(e);
      return false;
    }
  };

  var _localLogin = function (
    data,
    userid,
    password,
    success,
    fail,
    defaultError
  ) {
    _runLocalAppData(
      function (Session) {
        //Make sure app is loaded
        if (!window.gmm_app_loaded) {
          e = {
            name: "NOLOCALAPPDATA",
            message: "Login Error - Local appdata not found",
          };
          fail(e);
          return false;
        }

        //Login Locally
        if (T.isObject(data)) {
          //Verified Login
          Session.verifiedLogin(data);
          success();
        } else {
          //Offline Login
          Session.offlineLogin(
            userid,
            password,
            function () {
              //Login successful!
              success();
            },
            function (e) {
              //Login failed!
              fail(e);
            },
            defaultError
          );
        }
      },
      function (e) {
        //Can't get local app data
        fail(e);
      }
    );
  };

  /*
    Login success object
    {
    "guid": "063ccdf2-36fd-4b8a-a5af-808dd63744f6",
    "roleId": 4,
    "expiration": 0,
    "tos_accepted": true,
    "session_time_out": 30000,
    "appdata": null
}
     */

  var _getCompanySessions = function (username, password, company_id) {
    var _onSuccess = function (data) {
      console.log("getCompanySessions - Success: ", data);
    };
    var _onFail = function (data) {
      console.log("getCompanySessions - Fail: ", data);
    };
    //Data///////////////////////////////////////
    var _data = T.encodeURI({
        userName: username,
        password: password,
        companyId: company_id,
      }),
      _alpha_base = "https://cogspeed1-test.azurewebsites.net/",
      _url = _alpha_base + "/api/company/sessions";

    try {
      console.log("getCompanySessions Data", _data);
      console.log("getCompanySessions url", _url);
      $.ajax(_url, {
        type: "POST",
        data: _data,
        //contentType: "application/json; charset=utf-8",
        dataType: "json",
      })
        .done(_onSuccess)
        .fail(_onFail)
        .always(function () {
          console.log("getCompanySessions always");
        });
    } catch (e) {
      console.warn("getCompanySessions Error", e);
    }
  };

  var _getUserSessions = function (username, password, user_guid) {
    var _onSuccess = function (data) {
      console.log("getUserSessions - Success: ", data);
    };
    var _onFail = function (data) {
      console.log("getUserSessions - Fail: ", data);
    };
    //Data///////////////////////////////////////
    var _data = T.encodeURI({
        userName: username,
        password: password,
        guid: user_guid,
      }),
      _alpha_base = "https://cogspeed1-test.azurewebsites.net/",
      _url = _alpha_base + "/api/user/sessions";

    try {
      console.log("getUserSessions Data", _data);
      console.log("getUserSessions url", _url);
      $.ajax(_url, {
        type: "POST",
        data: _data,
        //contentType: "application/json; charset=utf-8",
        dataType: "json",
      })
        .done(_onSuccess)
        .fail(_onFail)
        .always(function () {
          console.log("getUserSessions always");
        });
    } catch (e) {
      console.warn("getUserSessions Error", e);
    }
  };

  var _login = function (username, password, success, fail) {
    //Private methods//////////////////////////////////
    //Callbacks//////////////////////////////////
    var _onSuccess = function (data) {
        //Add userid and password to data object
        data.userid = username;
        data.password = password;

        console.log("Authenticate onSuccess", data);
        //Fail if not an object
        if (!T.isObject(data)) {
          e = {
            name: "NODATA",
            message: "Error - login not returning object",
          };
          fail(e);
          return false;
        }

        if (T.isString(data.appdata) && data.appdata) {
          console.log("eval apdata");

          // console.log("////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");
          // console.log(data.appdata);
          // console.log("////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////");

          //console.log("make_textElement",make_textElement);
          _saveAppData(data.appdata);
          //_appendJS(data.appdata, function(){console.log("appdata appended")});
          var Session = _evalData(data.appdata);

          if (!window.gmm_app_loaded) {
            e = {
              name: "NOONLINEAPPDATA",
              message: "Login Error - Online appdata not found",
            };
            fail(e);
            return false;
          }
          //Verified Login
          Session.verifiedLogin(data);

          success();
          return true;
        } else {
          return _localLogin(data, username, password, success, fail);
        }
      },
      _onFail = function (data) {
        var rj = data.responseJSON,
          e = {
            name: null,
            message: "Login Error - No Response",
          };
        console.log("Authenticate Fail", data);
        if (data) {
          console.log("Authenticate onFail", data);
          if (!rj || !rj.message) {
            console.log("Authenticate offline", data);
            e.name = "ERROR";
            e.message = "Can't access server - Error " + data.status;
            // fail(e);
            // return false;
            return _localLogin(undefined, username, password, success, fail, e);
          } else {
            e.name = "SERVER_ERROR" + rj.id;
            e.message = rj.message;
            // fail(e);
            // return false;
            return _localLogin(undefined, username, password, success, fail, e);
          }
        } else {
          console.log("Authenticate offline");
          return _localLogin(undefined, username, password, success, fail);
        }
      };

    //Data///////////////////////////////////////
    var _data = T.encodeURI({
        userName: username,
        password: password,
        vno: _getVersion(),
      }),
      _url = AllUrlBase.get() + "/api/Login/";

    //Check alpha api magic namepass
    if (AllUrlBase.checkNamePass(username, password)) {
      (function () {
        var e = {
          name: "ALPHA_API",
          message: "url: ",
        };
        e.message += AllUrlBase.swap();

        fail(e);
      })();
      return false;
    } //end if

    try {
      console.log("Login Data", _data);
      console.log("Login url", _url);
      $.ajax(_url, {
        type: "POST",
        data: _data,
        //contentType: "application/json; charset=utf-8",
        dataType: "json",
      })
        .done(_onSuccess)
        .fail(_onFail)
        .always(function () {
          console.log("loginapi always");
        });
    } catch (e) {
      console.warn("Login Error", e);
    }
  };

  //Public interface//////////////////////////
  var L = function (username, password, success, fail) {
    _login(username, password, success, fail);
  };

  GMM_Login = L;
}
