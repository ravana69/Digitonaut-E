const SEBASTIAN={ //proc SEBASTIAN
    GLOBALS:{ //proc GLOBALS {orange indent_1}
      firstDraw:1,
      timeDelta:0, //proc particles
      fps:30, //orginal value: 1000 - number of frames rendered per second, the higher the number the greater the cpu usage
      maxHandledTextures:8, //8 seems the max number suitable for mobile. if increased, fragment shader code modifications are required iON2D2Js0y
      maxTextureAtlasWidth:4096, //4096 tested on on iPhone 6 and Android
      maxTextureAtlasHeight:4096,
      m3d:null, //mouse 3d coordinates from 2d position
      mx:0, //actual mouse coord and prev mouse coords
      my:0,
      mb:null, //mouse button pressed or released
      oMx:null, //detect mouse movement
      oMy:null,

      //time
      hours:null,
      minutes:null,

      //entities idx counter
      idx:0,

      loadedAssets:0, //texture loader index
      //pressed keys
      keys:[],
      keysUp:[],
      //frame control
      lastTime:window.performance.now(),
      //color mapping and time travel
      lastTimeKey:null,
      debugLightColors:1,
      timeTravel:0,
      //proc camera keypoints {indent_3}
            cameraKeyPoints:[
        //birds
        {
          xPos:16.459999999999965,yPos:34.05000000000035,zPos:11.139999999999791,pitch:0,yaw:0
        },
        { //snails
          xPos:10.059999999999981,yPos:0.5100000000001518,zPos:20.38999999999983,pitch:-0.5,yaw:0
        },
        { //grumpy frog
          xPos:24.660000000000082,yPos:0.4899999999999314,zPos:25.7199999999999,pitch:0,yaw:0
        },
        { //mushrooms
          xPos:13.809999999999901,yPos:0.5100000000001518,zPos:18.439999999999756,pitch:-0.5,yaw:0
        },
        { //drutts
          xPos:26.620000000000257,yPos:0.5100000000001518,zPos:21.349999999999866,pitch:-0.5,yaw:0
        },
        { //moais
          xPos:38.260000000000694,yPos:1.1100000000001522,zPos:24.86,pitch:-0.5,yaw:0
        }

      ],

      cameraKeyPoinstIndex:0,
      //map Editor
      editorConsoleIsVisible:1,
      tilesColorPool:['C5','C1','C3','C2','C4','B1','B2','B3'],
      tilesColorPoolIdx:0,
      tilesBusyList:{},
      //tile blob editor
      mapEntityGroups:[
                        'water2','water2_tiled','moai1','moai2','moai3',
                        'drutt',
                        'raindrops',
                        'mushroom_01','mushroom_01B','mushroom_02','mushrooms',
                        'snail_papa','snail_son',
                        'nymphaea','nymphaea2','pavementAngleTopLeft','pavementTop','pavementAngleTopRight',
                        'pavementLeft','pavementRight',
                        'pavementAngleBottomLeft','pavementBottom','pavementAngleBottomRight',
                        'water','water_tiled','grass','taraxacum','bullrushes','frog',
                      ],
      mapEntityGroupsIdx:0,
      //--
      editorMode:'terrain', //auto select editor mode
      currentInput:null,
      currentEntityId:0,    //current selected entity
      currentEntityMOId:0,  //current entity under mouse
      entitySelectionColor:[1.0,0.0,1.0], //the color used to highlight a selected entity
      entitySelectedColor:[1.0,0.0,1.0], //the color used to highlight an entity when the mouse is on it
      tilesTexturePool:['pavement_02','pavement_01'],
      tilesTexturePoolIdx:0,
      tilesOpacityPool:[1.0,.7,.9,.5,.3],
      tilesOpacityPoolIdx:0,
      currentTileId:null, //current selected tile
      currentTileMOId:null, //current tile under mouse

      //particles
      currentSelectedParticles:[], //current editor selected particles
      currentSelectedParticlesIdx:-1,
      currentSelectedParticlesGIdx:0,
      currentSelectedParticlesGMovementSpeed:0.05,
      currentSelectedParticlesGMovementSpeedStep:0.005,
      currentSelectedParticlesGMovementMinSpeed:0.001,
      currentSelectedParticlesGMovementMaxSpeed:0.1,
      currentSelectedParticlesGX:0, //store last editor position
      currentSelectedParticlesGY:0,
      particleSelEnableSingle:false, //if true enable adjustments for a single particle of a particle cluster
      currentSelectedParticleIdx:0, //current idx for a single particle of a particle cluster
      particleSelectionColor:[1.0,0.0,0.0], //the color used to highlight a selected particle or particle cluster

      dynamicEntitiesGeometry:1,
      //flags/counters
      isParticlesBufferDataDirty:1,
      isWorldTilesVerticesPositionDirty:0,
      isWorldTilesColorsDirty:0,
      isWorldTilesTextureCoordsDirty:0,
      isWorldTilesPropertiesDirty:0, //if a tile alpha or sprite is changed we set this flag to 1
      autoBuildTextureAtlases:0, //if true, load all the separate texture images and create a texture atlas, otherwise load the atlas (manually saved)
      isEditorEnabled:0,

      chooseRandomWeather:1,
      chanceOfRain:0.3, //0 disabled - 0..1 simple chance of rain
      chooseRandomCameraKeyPoint:1,
      loadSavedScene:1,

      isMouseDirty:0,    //used to perform analysis only during mouse movements
      sceneVersion:0,    //used to visually increase the version number of the scene during save, it has no other uses.
      useUTCTime:1,
    },
    init:function(){ //proc init {green indent_1}
      const _seba=SEBASTIAN;

      _seba.GLOBALS.canvas=document.getElementById('c');
      _seba.GLOBALS.clock=document.getElementById('clock');
      _seba.WEBGL.initGL();
      _seba.UTILS.init();
      _seba.WEBGL.initShaders();
      _seba.WEBGL.WORLD.ENTITIES.init();

      //init time
      // we use getUTCHours so that there are no 'jumps'
      // in the hour due to the introduction of daylight savings time
      // if we used eg getHours
      // there would be a jump from 01:59 to 03:00 on 24/03/2018
      // and this would cause the moon to jump forward
      var tDate=new Date();
      _seba.GLOBALS.fpsInterval=1000/_seba.GLOBALS.fps;
      if (_seba.GLOBALS.useUTCTime){
        _seba.GLOBALS.hours=tDate.getUTCHours();
        _seba.GLOBALS.minutes=tDate.getUTCMinutes();
      }else{
        _seba.GLOBALS.hours=tDate.getHours();
        _seba.GLOBALS.minutes=tDate.getMinutes();
      }

      //color timekey
      var h_key,m_key;
      var hours,minutes;
      if (_seba.GLOBALS.debugLightColors===1){ //allows setting the time manually
        var tDate=new Date();
                var unixtime=tDate.getTime();
        unixtime+=_seba.GLOBALS.timeTravel*60*1000;
        tDate.setTime(unixtime);
        if (SEBASTIAN.GLOBALS.useUTCTime){
          h_key=tDate.getUTCHours();
          m_key=tDate.getUTCMinutes();
        }else{
          h_key=tDate.getHours();
          m_key=tDate.getMinutes();
        }
        hours=h_key;
        minutes=m_key;
      }else{
        if (SEBASTIAN.GLOBALS.useUTCTime){
          h_key=oDate.getUTCHours();
          m_key=oDate.getUTCMinutes();
        }else{
          h_key=oDate.getHours();
          m_key=oDate.getMinutes();
        }
        hours=h_key;
        minutes=m_key;
      }
      var colorKey=h_key+'_'+m_key;
      _seba.GLOBALS.lastTimeKey=colorKey;

      //proc assets loading CODEPEN {byellow indent_2}
      //load assets with a callback, then load world with a callback
      //then init gameloop.
      var assetsListContent=[
        {
          lightColorTimeMap:'https://s3-us-west-2.amazonaws.com/s.cdpn.io/1981998/colormap.eiv3.json',
          //color data is a little compressed, translate it before decoding from json
          onLoad:function(responseText){
            responseText=responseText.replace(/\|/g,'0.');
            responseText=responseText.replace(/LG/g,'linear-gradient(to bottom,');
            return responseText;
          },
          onLoadDone:function(o){
            // assign an index to every hour of the day,
            // we will use this to rotate the moon and the sun
            // based on current hour
            var counter=0;
            for (var z in o){
              o[z].idx=counter;
              //console.log(z);
              counter++;
            }
            //console.log(o);
          }
        },
      ];
      var assetsListContentTextures=[
        {
          texturesData:'texturesData.eiv4.json',
          onLoadDone:function(o){
            SEBASTIAN.WEBGL.GLOBALS.textures=o;
            //console.log(o);
          }
        },
      ];
      var assetsListAtlases=[
        {'atlas1.glTexture':'1.eiv4.png'}, //here we can for example choose textures with different quality/resolution to improve performance on mobile browsers
        {'atlas2.glTexture':'2.eiv4.png'},
        {'atlas3.glTexture':'3.eiv4.png'},
      ]
      var assetsList=[];
      assetsList=assetsListContent.concat(assetsListContentTextures,assetsListAtlases);
      SEBASTIAN.UTILS.initAssets(assetsList,function(){
        SEBASTIAN.WEBGL.loadTextureAtlases(function(){
          SEBASTIAN.WEBGL.WORLD.init();
          SEBASTIAN.WEBGL.WORLD.load(function(){SEBASTIAN.gameLoop(window.performance.now())});
        });
      });

    },
    gameLoop:function(newtime){ //proc gameLoop {green indent_1}
      const _seba=SEBASTIAN;
      //proc draw scene call {violet indent_2}
      _seba.WEBGL.WORLD.draw(newtime);

      var keys=_seba.GLOBALS.keys;
      var keysUp=_seba.GLOBALS.keysUp;

      //j -> camera keypoint travel--
      if (keysUp[74]){
        keysUp[74]=0;
        //determiniamo il numero di camera key points
        SEBASTIAN.GLOBALS.cameraKeyPoinstIndex--;
        var totalCameraKeyPoints0idx=SEBASTIAN.GLOBALS.cameraKeyPoints.length-1;
        if (SEBASTIAN.GLOBALS.cameraKeyPoinstIndex<0)
          SEBASTIAN.GLOBALS.cameraKeyPoinstIndex=totalCameraKeyPoints0idx;
        //console.log(SEBASTIAN.GLOBALS.cameraKeyPoinstIndex);
        SEBASTIAN.WEBGL.WORLD.setCameraTo(SEBASTIAN.GLOBALS.cameraKeyPoints[SEBASTIAN.GLOBALS.cameraKeyPoinstIndex]);
      }

      //k -> camera keypoint travel++
      if (keysUp[75] || _seba.GLOBALS.touchClick===1){
        _seba.GLOBALS.touchClick=0;
        keysUp[75]=0;
        //determiniamo il numero di camera key points
        SEBASTIAN.GLOBALS.cameraKeyPoinstIndex++;
        var totalCameraKeyPoints0idx=SEBASTIAN.GLOBALS.cameraKeyPoints.length-1;
        if (SEBASTIAN.GLOBALS.cameraKeyPoinstIndex>totalCameraKeyPoints0idx)
          SEBASTIAN.GLOBALS.cameraKeyPoinstIndex=0;
        //console.log(SEBASTIAN.GLOBALS.cameraKeyPoinstIndex);
        SEBASTIAN.WEBGL.WORLD.setCameraTo(SEBASTIAN.GLOBALS.cameraKeyPoints[SEBASTIAN.GLOBALS.cameraKeyPoinstIndex]);
      }

            var rainMoreKeyCode=107; //+
      var rainLessKeyCode=109;     //-

      if (keys[rainMoreKeyCode] || _seba.GLOBALS.swipeDirH==='right'){ //rainDelta++
        //console.log(SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey]);
        //console.log(SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].g);
        //keysUp[221]=0;
        var rainInc=0.03;
        if (_seba.GLOBALS.swipeDirH==='right'){
          rainInc=_seba.GLOBALS.swipeDirHDistance;
          _seba.GLOBALS.swipeDirH='none';
        }
        _seba.WEBGL.WORLD.GLOBALS.rainDelta+=rainInc;
        if (_seba.WEBGL.WORLD.GLOBALS.rainDelta>1)
          _seba.WEBGL.WORLD.GLOBALS.rainDelta=1;
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        var shaderProgram=_seba.WEBGL.GLOBALS.shaderProgram;
        var shaderProgramP=_seba.WEBGL.GLOBALS.shaderProgramP;
        gl.useProgram(shaderProgram);
        gl.uniform1f(shaderProgram.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
        gl.useProgram(shaderProgramP);
        gl.uniform1f(shaderProgramP.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
        _seba.UTILS.backgroundGradientFadeToGray();
      }
      if (keys[rainLessKeyCode] || _seba.GLOBALS.swipeDirH==='left'){ //rainDelta--
        //keysUp[219]=0;
        var rainDec=0.03;
        if (_seba.GLOBALS.swipeDirH==='left'){
          rainDec=_seba.GLOBALS.swipeDirHDistance;
          _seba.GLOBALS.swipeDirH='none';
        }
        _seba.WEBGL.WORLD.GLOBALS.rainDelta-=rainDec;
        if (_seba.WEBGL.WORLD.GLOBALS.rainDelta<0)
          _seba.WEBGL.WORLD.GLOBALS.rainDelta=0;
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        var shaderProgram=_seba.WEBGL.GLOBALS.shaderProgram;
        var shaderProgramP=_seba.WEBGL.GLOBALS.shaderProgramP;
        gl.useProgram(shaderProgram);
        gl.uniform1f(shaderProgram.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
        gl.useProgram(shaderProgramP);
        gl.uniform1f(shaderProgramP.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
        _seba.UTILS.backgroundGradientFadeToGray();
      }

      keys[84]?_seba.GLOBALS.timeTravel++:0; //t -> time travel
      keys[82]?_seba.GLOBALS.timeTravel--:0; //r -> time travel

      //precise timetravel
      if (keysUp[89]){ //y ->
        keysUp[89]=0;
        _seba.GLOBALS.timeTravel--;
      }
      if (keysUp[85]){ //u ->
        keysUp[85]=0;
        _seba.GLOBALS.timeTravel++;
      }

      keys[33]?(SEBASTIAN.WEBGL.WORLD.GLOBALS.yPos+=0.03,_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1):0;   //Page up
      keys[34]?(SEBASTIAN.WEBGL.WORLD.GLOBALS.yPos-=0.03,_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1):0;   //Page up
      keys[37]?(SEBASTIAN.WEBGL.WORLD.GLOBALS.xPos-=0.03,_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1):0;   //cursor left
      keys[39]?(SEBASTIAN.WEBGL.WORLD.GLOBALS.xPos+=0.03,_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1):0;   //cursor right
      keys[38]?(SEBASTIAN.WEBGL.WORLD.GLOBALS.zPos-=0.03,_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1):0;   //cursor up
      keys[40]?(SEBASTIAN.WEBGL.WORLD.GLOBALS.zPos+=0.03,_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1):0;   //cursor down

      keys[36]?SEBASTIAN.WEBGL.WORLD.GLOBALS.pitch+=0.3:0;  //init line
      keys[35]?SEBASTIAN.WEBGL.WORLD.GLOBALS.pitch-=0.3:0;  //END line

      keys[45]?SEBASTIAN.WEBGL.WORLD.GLOBALS.yaw+=0.3:0;    //INSERT
      keys[46]?SEBASTIAN.WEBGL.WORLD.GLOBALS.yaw-=0.3:0;    //CANC

      requestAnimationFrame(_seba.gameLoop); //loop forever
    },
    UTILS:{ //proc UTILS {orange indent_1}
      init:function(){ //proc init {green indent_2}
        const _seba=SEBASTIAN;

        //mobile input detection
        //adapted from http://www.javascriptkit.com/javatutors/touchevents2.shtml
        document.body.addEventListener('touchstart',function(e){
          var nowNow=new Date().getTime();
          _seba.GLOBALS.touchEvent={time2:nowNow,time:nowNow,touch:e.changedTouches[0]};
          _seba.GLOBALS.touchClick=0;
          return false;
        });
        var touchEnd=function(e){
          var allowedTime=2000;
          var vThreshold=150;
          var hThreshold=20;
          var swipeDirH='none';
          var swipeDirV='none';
          var previousEvent=_seba.GLOBALS.touchEvent;
          var distX =  e.changedTouches[0].pageX - previousEvent.touch.pageX;
          var distY =  e.changedTouches[0].pageY - previousEvent.touch.pageY;
          var nowNow=new Date().getTime();
          var elapsedTime =  nowNow - previousEvent.time;
          var elapsedTimeReal =  nowNow - previousEvent.time2;
          //console.log(elapsedTime,'<=',allowedTime,_seba.GLOBALS.swipeDirV,_seba.GLOBALS.swipeDirVDistance);
          //console.log(elapsedTime,'<=',allowedTime,Math.abs(distX),'>=',threshold,Math.abs(distY),'<=');
          //console.log(elapsedTime,'<',100,'&&',(nowNow-_seba.GLOBALS.touchEventResetAt),'>200','&&',e.type,'===touchend && ',Math.abs(distX),'<5','&&',Math.abs(distY),'<5');
          //if (elapsedTime<100 && (typeof _seba.GLOBALS.touchEventResetAt==='undefined' || nowNow-_seba.GLOBALS.touchEventResetAt>200) && e.type==='touchend' && Math.abs(distX)<5 && Math.abs(distY)<5)
          if (elapsedTimeReal<300 && e.type==='touchend' && Math.abs(distX)<5 && Math.abs(distY)<5)
            _seba.GLOBALS.touchClick=1;

          if (elapsedTime<=allowedTime){
            if (Math.abs(distX)>=hThreshold)
              swipeDirH=distX<0?'left':'right';
            if (Math.abs(distY)>=vThreshold)
              swipeDirV=distY<0?'up':'down';
          }
          if (
            (swipeDirV!==_seba.GLOBALS.swipeDirV || swipeDirH!==_seba.GLOBALS.swipeDirH) ||
            (elapsedTime>allowedTime && e.type==='touchmove')
          ){
            //dir is changed -> reset
            _seba.GLOBALS.touchEvent={time:new Date().getTime(),touch:e.changedTouches[0]};
          }
          _seba.GLOBALS.swipeDirH=swipeDirH;
          _seba.GLOBALS.swipeType=e.type;
          _seba.GLOBALS.swipeDirV=swipeDirV;
          var docWidth=document.documentElement.clientWidth;
          var docHeight=document.documentElement.clientHeight;
          _seba.GLOBALS.swipeDirHDistance=Math.abs(distX/(docWidth/1.5));
          _seba.GLOBALS.swipeDirVDistance=Math.abs(distY/(docHeight/1.5));
          //console.log(_seba.GLOBALS.swipeDirH,_seba.GLOBALS.swipeDirV,_seba.GLOBALS.swipeDirVDistance);
          return false;
        };
        document.body.addEventListener('touchend',touchEnd);
        document.body.addEventListener('touchmove',touchEnd);

        //proc window.onresize {violet indent_3}
        window.onresize=function(){
          //console.log('resize',document.documentElement.clientWidth);
          //canvas resizing
          var docWidth=document.documentElement.clientWidth;
          var docHeight=document.documentElement.clientHeight;
          var canvasDom=document.getElementById('c');
          canvasDom.width=docWidth;
          canvasDom.setAttribute('width',docWidth);
          canvasDom.style.width=docWidth+'px';
          canvasDom.height=docHeight;
          canvasDom.style.height=docHeight+'px';
          canvasDom.setAttribute('height',docHeight);

          //resize webgl render window
          var gl=_seba.GLOBALS.webgl_ctx; //lookup var
          gl.viewportWidth=docWidth;
          gl.viewportHeight=docHeight;
          _seba.WEBGL.WORLD.GLOBALS.isViewportDirty=1;
        };
        window.onresize();

        //proc window.onkeyup {violet indent_3}
        window.onkeyup=function(e){

          _seba.GLOBALS.keys[e.keyCode]=0;
          _seba.GLOBALS.keysUp[e.keyCode]=1;

        };

        //proc window.onkeydown {violet indent_3}
        //keyboard event handlers
        window.onkeydown=function(e){

          _seba.GLOBALS.keys[e.keyCode]=1;
          if (typeof _seba.GLOBALS.worldData==='undefined')
            return;

        };

      },
      onVisibilityChangeHandler:function(hiddenPropertyName){ //proc editorInputKeyUp
        if (document[hiddenPropertyName]){
          SEBASTIAN.GLOBALS.fpsInterval=10000;
          //console.log('HIDDEN',new Date());
        }else{
          SEBASTIAN.GLOBALS.fpsInterval=1000/SEBASTIAN.GLOBALS.fps;
          //console.log('VISIBLE',new Date());
        }
      },
      backgroundGradientFadeToGray:function(){ //proc init {green indent_2}
        const _seba=SEBASTIAN;
        var colorKey=_seba.GLOBALS.lastTimeKey;
        //console.log(SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey]);
        if (typeof SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].oG==='undefined')
          SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].oG=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].g;

        var rainDelta=_seba.WEBGL.WORLD.GLOBALS.rainDelta;
        var g=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].oG;
        //console.log(SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].oG);
        var sg=g.replace(/\#([^\s]+)/g,function(a,hex){
            //https://stackoverflow.com/questions/5623838/rgb-to-hex-and-hex-to-rgb
            var bigint = parseInt(hex, 16);
            var r = (bigint >> 16) & 255;
            var g = (bigint >> 8) & 255;
            var b = bigint & 255;
            var gray=(r+g+b)/3
            var rG=r+rainDelta*(gray-r);
            var gG=g+rainDelta*(gray-g);
            var bG=b+rainDelta*(gray-b);

            var rgb = bG | (gG << 8) | (rG << 16);
            var grayG='#' + (0x1000000 + rgb).toString(16).slice(1);
            //console.log(grayG);
            return grayG;
            //console.log(r + "," + g + "," + b);
        });
        SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].g=sg;
        //apply new background color
        document.body.style.background=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].g;
        //apply sun opacity
        var worldData=SEBASTIAN.GLOBALS.worldData;
        var brotherSun=worldData.entitiesNamePointer['sun'];
        brotherSun.opacity=_seba.UTILS.lerp(1,0.2,rainDelta);
        _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(brotherSun); //update alpha
      },
      lerp:function(a,b,alpha){ //proc lerp {green indent_2}
        //https://en.wikipedia.org/wiki/Linear_interpolation
        return a+alpha*(b-alpha);
      },

      applyTimeCalc(cfg){  //proc applyTimeCalc {green indent_2}
        var config={
          //sunLightVerticalPosition:cfg.sunLightVerticalPosition, //_seba.WEBGL.WORLD.GLOBALS.sunLightVerticalDistance
          parameter:cfg.parameter,
          currentHour:cfg.currentHour,
          currentMinute:cfg.currentMinute,
          fromHours:cfg.fromHours,
          toHours:cfg.toHours,
          fromMinutes:cfg.fromMinutes,
          toMinutes:cfg.toMinutes,
          fromValue:cfg.fromValue,
          toValue:cfg.toValue,
          logInfo:cfg.logInfo || 0,
          applyTimeBouncing:cfg.applyTimeBouncing,
        }
        var _seba=SEBASTIAN;
        var parameter=config.parameter;
        var currentHour=config.currentHour;
        var currentMinute=config.currentMinute;
        var fromHours=config.fromHours;
        var toHours=config.toHours;
        var fromMinutes=config.fromMinutes;
        var toMinutes=config.toMinutes;
        var fromValue=config.fromValue;
        var toValue=config.toValue;
        var logInfo=config.logInfo;
        var applyTimeBouncing=config.applyTimeBouncing;
        if (typeof applyTimeBouncing==='undefined')
          applyTimeBouncing=1;

        //build Time index
        var h_key, m_key, colorKey;
        //current index
        //to index
        h_key=currentHour;
        m_key=currentMinute;
        colorKey=h_key+'_'+m_key;
        var currentTimeIdx=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].idx;
        //from index
        h_key=fromHours;
        m_key=fromMinutes;
        colorKey=h_key+'_'+m_key;
        var initTimeIdx=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].idx;
        //to index
        h_key=toHours;
        m_key=toMinutes;
        colorKey=h_key+'_'+m_key;
        var endTimeIdx=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].idx;
        var distanceIdx=endTimeIdx-initTimeIdx;
        var halfTimeIdx=initTimeIdx+(distanceIdx)/2;

        if (applyTimeBouncing){
          //if (currentHour===fromHours && currentMinute>=fromMinutes){
          if (currentTimeIdx>=initTimeIdx && currentTimeIdx<halfTimeIdx){
            //console.log('+delta',(currentTimeIdx-initTimeIdx)*1/halfTimeIdx);
            //var delta=(currentTimeIdx-initTimeIdx)/initTimeIdx; //normalize
            var delta=(currentTimeIdx-initTimeIdx)*1/distanceIdx*2; //normalize to 0..1
            parameter=fromValue*(1-delta)+toValue*delta; //lerp
            //console.log('>>',parameter);
          }
          if (currentTimeIdx>=halfTimeIdx && currentTimeIdx<=endTimeIdx){
            //var delta=1-((toMinutes-currentMinute)/toMinutes); //normalize
            //console.log('-delta',1-((endTimeIdx-currentTimeIdx)*1/halfTimeIdx));
            //var delta=1-((endTimeIdx-currentTimeIdx)/endTimeIdx); //normalize
            var delta=1-((endTimeIdx-currentTimeIdx)*1/distanceIdx*2);
            parameter=toValue*(1-delta)+fromValue*delta; //lerp
            //console.log('<<',parameter);
          }
        }else{
          if (currentTimeIdx>=initTimeIdx && currentTimeIdx<=endTimeIdx){
            //console.log('+DELTA',(currentTimeIdx-initTimeIdx)*1/halfTimeIdx);
            //var delta=(currentTimeIdx-initTimeIdx)/initTimeIdx; //normalize
            var delta=(currentTimeIdx-initTimeIdx)*1/distanceIdx; //normalize to 0..1
            parameter=fromValue*(1-delta)+toValue*delta; //lerp
            //console.log('>>',parameter);
          }
        }
        return parameter;

      },
      degToRad(degrees){ //proc deg2rad {green indent_2}
        return degrees*Math.PI/180;
      },
      initAssets:function(tList,callback){ //proc initAssets {green indent_2}
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        for (var z=0,zEnd=tList.length;z<zEnd;z++){

          //a bit hacky
          //for (var assetId in tList[z]){}
          //clearer ->
          var assetId=Object.keys(tList[z])[0];

          //console.log(assetId);

          if (tList[z][assetId].match(/\.json$/)){
            var assetUrl=tList[z][assetId];
            var xhr=new XMLHttpRequest();
            xhr.onload=function(z,assetId){
              return function(){ //func factory {indent_4}
                //if (xhr.status===200){ //2018-05-15 02:25:37 - wrong, this does not allow us to properly load files if they are cached
                var responseText=this.responseText;
                if (typeof tList[z].onLoad!=='undefined')
                  responseText=tList[z].onLoad(responseText);
                SEBASTIAN.GLOBALS[assetId]=JSON.parse(responseText); //save the object in SEBASTIAN.GLOBALS with the specified key
                if (typeof tList[z].onLoadDone!=='undefined')
                  responseText=tList[z].onLoadDone(SEBASTIAN.GLOBALS[assetId]);

                SEBASTIAN.GLOBALS.loadedAssets++;
                if (SEBASTIAN.GLOBALS.loadedAssets===tList.length){ //all loaded
                  callback();
                }
              }
            }(z,assetId);
            xhr.open('GET',assetUrl);
            xhr.send();
          }else if(assetId.match(/\.glTexture$/)){
            var imgUrl=tList[z][assetId];
            var tempImage=gl.createTexture();
            tempImage.image=new Image();
            SEBASTIAN.WEBGL.GLOBALS.tempTextures[assetId]=tempImage;
            tempImage._data=tList[z].data; //set data
            tempImage.image.onload=function(assetId){
              return function(){
                SEBASTIAN.GLOBALS.loadedAssets++;
                //console.log(SEBASTIAN.GLOBALS.loadedAssets,tList.length);
                if (SEBASTIAN.GLOBALS.loadedAssets===tList.length){ //all loaded
                  callback();
                }
              }
            }(assetId);

            //activate Cross Origin Resource Sharing
            //ask the remote image server for permission to use the image.
            tempImage.image.crossOrigin='anonymous';

            tempImage.image.src=imgUrl;

          }else{
            var imgUrl=tList[z][assetId];
            var tempImage=new Image();
            SEBASTIAN.WEBGL.GLOBALS.tempTextures[assetId]=tempImage;
            tempImage._data=tList[z].data; //set data
            tempImage.onload=function(assetId){
              return function(){
                SEBASTIAN.GLOBALS.loadedAssets++;
                if (SEBASTIAN.GLOBALS.loadedAssets===tList.length){ //all loaded
                  callback();
                }
              }
            }(assetId);

            //activate Cross Origin Resource Sharing
            //ask the remote image server for permission to use the image.
            tempImage.crossOrigin='anonymous';
            var rainMoreKeyCode=107;
                        tempImage.src=imgUrl;
          }
        }
      },
    },
    WEBGL:{ //proc WEBGL {orange indent_1}
      GLOBALS:{ //proc WEBGL.GLOBALS {orange indent_3}
        buffers:{}, //proc buffers {blue indent_3}
        textures:{}, //proc textures {blue indent_3} texture database in relation to the atlas texture
        tempTextures:{}, //proc tempTextures {blue indent_3} textures loaded individually before creating the atlas texture
        shaderProgram:{}, //proc shaderProgram {blue indent_3}
        anisotropicFilter:null,
      },
      //--
      initGL:function(){ //proc initGL {green indent_2}
        var canvas=SEBASTIAN.GLOBALS.canvas;
        //preserveDrawingBuffer    -> determines whether or not to clear the buffer at each frame
        //alpha:false              -> disabled alpha blending with html background
        //premultipliedAlpha:false -> blend alpha from gl with html background
        SEBASTIAN.GLOBALS.webgl_ctx=canvas.getContext('webgl',{preserveDrawingBuffer:false,premultipliedAlpha:true});
        if (!SEBASTIAN.GLOBALS.webgl_ctx) //no luck? ok, let's try something different....
          SEBASTIAN.GLOBALS.webgl_ctx=canvas.getContext('experimental-webgl',{preserveDrawingBuffer:false,premultipliedAlpha:true});
        //--
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        gl.viewportWidth=canvas.width;
        gl.viewportHeight=canvas.height;

        //enable ALPHA blending for png transparent textures
        //gl.blendFunc(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA); //premultipliedAlpha should be set to true and -> gl.pixelStorei   (gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true); should be used
        //enable ALPHA blending for gif transparent textures (deal with 1 bit transparency)
        gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        //2018-03-12 22:58:42
        //test if we can enable anisotropic filtering
        //https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic
        SEBASTIAN.WEBGL.GLOBALS.anisotropicFilter=gl.getExtension('EXT_texture_filter_anisotropic');

        // if we want alpha blending for our .PNGs file we can't use DEPTH_TEST
        // we manage the depth test in a distinct way during drawing.
        // use depthMask(true) for objects without alpha
        // use depthMask(false) for transparent objects ->
        // in this case the z-ordering must be done by our routine
        // see drawloop

        gl.enable(gl.DEPTH_TEST);
      },

      initShaders:function(){ //proc initShaders {green indent_2}
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        //Init shaders
        //setup a GLSL program
        var vertexShader  =SEBASTIAN.WEBGL.createShaderFromScript(gl,'2d-vertex-shader');
        var fragmentShader=SEBASTIAN.WEBGL.createShaderFromScript(gl,'2d-fragment-shader');
        var shaderProgram =SEBASTIAN.WEBGL.createProgram(gl,[vertexShader,fragmentShader]);
        SEBASTIAN.WEBGL.GLOBALS.shaderProgram=shaderProgram;
        //gl.useProgram(shaderProgram);

        //proc shaderProgram set vars {violet indent_3}

        shaderProgram.data={
          aVertexPosition             :{location:gl.getAttribLocation (shaderProgram,'aVertexPosition')},
          aTextureCoord               :{location:gl.getAttribLocation (shaderProgram,'aTextureCoord')},
          aEntityTranslation          :{location:gl.getAttribLocation (shaderProgram,'aEntityTranslation')},
          aEntityColor                :{location:gl.getAttribLocation (shaderProgram,'aEntityColor')},
          aEntityProperties           :{location:gl.getAttribLocation (shaderProgram,'aEntityProperties')},
          uPMatrix                    :{location:gl.getUniformLocation(shaderProgram,'uPMatrix')},
          uMVMatrix                   :{location:gl.getUniformLocation(shaderProgram,'uMVMatrix')},
          //uTimeDelta                  :{location:gl.getUniformLocation(shaderProgram,'uTimeDelta')},
          uCameraTranslation          :{location:gl.getUniformLocation(shaderProgram,'uCameraTranslation')},
          uTextureSampler0            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler0')},
          uTextureSampler1            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler1')},
          uTextureSampler2            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler2')},
          uTextureSampler3            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler3')},
          uTextureSampler4            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler4')},
          uTextureSampler5            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler5')},
          uTextureSampler6            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler6')},
          uTextureSampler7            :{location:gl.getUniformLocation(shaderProgram,'uTextureSampler7')},
          uAmbientLightColor          :{location:gl.getUniformLocation(shaderProgram,'uAmbientLightColor')},
          uAmbientLightColorIntensity :{location:gl.getUniformLocation(shaderProgram,'uAmbientLightColorIntensity')},
          uPointLighting1Location     :{location:gl.getUniformLocation(shaderProgram,'uPointLighting1Location')},
          uPointLighting2Location     :{location:gl.getUniformLocation(shaderProgram,'uPointLighting2Location')},
          uRainDelta                  :{location:gl.getUniformLocation(shaderProgram,'uRainDelta')},
          interleavedStruct           :{
            buffer  :gl.createBuffer(),
            //data    :new Float32Array(verticesbuffer),

            //stride is
           //number of interleaved properties associated with a vertex
           //--
           //size in bytes
           //this will be used by opengl to associate the linear
           //array with the attributes passed to each vertex
            stride:15*Float32Array.BYTES_PER_ELEMENT //unused for now
          },
          enable:function(){
            for (var z in this){
              if (typeof this[z].location!=='undefined' && (z.indexOf('a')===0))
                gl.enableVertexAttribArray(this[z].location);
            }
            //gl.enableVertexAttribArray(shaderProgram.aVertexPosition_var);
          }
        }
        shaderProgram.data.enable();

        //proc particles
        var vertexShaderP   =SEBASTIAN.WEBGL.createShaderFromScript(gl,'2d-vertex-shader-particles');
        var fragmentShaderP =SEBASTIAN.WEBGL.createShaderFromScript(gl,'2d-fragment-shader-particles');
        var shaderProgramP  =SEBASTIAN.WEBGL.createProgram(gl,[vertexShaderP,fragmentShaderP]);
        gl.useProgram(shaderProgramP); //swith to particles program

        var triangleStrippedQuad=[ //draw a quad with two different triangles
           0,  0,  0,
           0,  1,  0,
           1,  1,  0,
           1,  0,  0
        ];
        var indices=[0,1,2,2,3,0];

        //rain drops

        var verticesbuffer=[];
        var indicesBuffer=[];
        var indicesIdx=0;

        var rainDropsTotalParticles=9000;//10000; //10000 = very good
        var particleType=0;
        var color_r=0.8;
        var color_g=0.8;
        var color_b=0.8;
        for (var z=0;z<rainDropsTotalParticles;z++){

          var minRand=5;
          var maxRand=15;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var yPositionRandom=randValue;
          //yPositionRandom=0;

          var minRand=0.0;
          //minRand=0.0;
          var maxRand=14.0;//con il trucco telecamera basta molto meno, -telecamera.x su shader*2 -> SEBASTIAN.WEBGL.WORLD.GLOBALS.columns;
          //maxRand=10;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var xPositionRandom=randValue;
          //xPositionRandom=0;

          var minRand=SEBASTIAN.WEBGL.WORLD.GLOBALS.rows-8;
          var maxRand=SEBASTIAN.WEBGL.WORLD.GLOBALS.rows-1; //we remove one because SEBASTIAN.WEBGL.WORLD.GLOBALS.rows is not visible
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var zPositionRandom=randValue;
          //zPositionRandom=0;

          var minRand=4.0;
          var maxRand=6.0;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var velocityRandom=randValue;

          var scaleX=280; //80
          var scaleY=5;   //20

          //scaleX=1; //80
          //scaleY=1;   //20

          //vertex 1
          verticesbuffer.push(
            //the numbers between squares show the value that we will have to pass to vertexAttribPointer as an offset
            //[0]                                           1                               2
            triangleStrippedQuad[ 0]/scaleX,triangleStrippedQuad[ 1]/scaleY,triangleStrippedQuad[ 2]
            //[3]   4                 5   - INIT POSITION (used as default state)
            ,0    , yPositionRandom  ,0,
            //[6]
            velocityRandom,
            //[7]
            particleType,
            //[8]   9    10 - DESTINATION
            0,      0,   0,
            //[11]                12    13 - TRANSLATION
            xPositionRandom,      0,    zPositionRandom,
            //[14] - LIFETIME
            0,
            //[15] - Color.r,  16 color.g  17 color.b 18 color.a
            color_r,color_g,color_b,0
          );
          //vertex 2
          verticesbuffer.push(triangleStrippedQuad[ 3]/scaleX,triangleStrippedQuad[ 4]/scaleY,triangleStrippedQuad[ 5],0,yPositionRandom,0,velocityRandom,particleType,0,0,0,xPositionRandom,0,zPositionRandom,0,color_r,color_g,color_b,0);
          //vertex 3
          verticesbuffer.push(triangleStrippedQuad[ 6]/scaleX,triangleStrippedQuad[ 7]/scaleY,triangleStrippedQuad[ 8],0,yPositionRandom,0,velocityRandom,particleType,0,0,0,xPositionRandom,0,zPositionRandom,0,color_r,color_g,color_b,0);
          //vertex 4
          verticesbuffer.push(triangleStrippedQuad[ 9]/scaleX,triangleStrippedQuad[10]/scaleY,triangleStrippedQuad[11],0,yPositionRandom,0,velocityRandom,particleType,0,0,0,xPositionRandom,0,zPositionRandom,0,color_r,color_g,color_b,0);

          var idx4=indicesIdx;
          indicesBuffer.push(indices[0]+idx4,indices[1]+idx4,indices[2]+idx4,indices[3]+idx4,indices[4]+idx4,indices[5]+idx4);
          indicesIdx+=4; //we have 4 vertices per triangle
        }
        //console.log(indicesBuffer.length);

        //rain drops collision
        var rainDropsCollisionsTotalParticles=Math.floor(65536/4)-rainDropsTotalParticles;
        var particleType=1;
        var color_r=0.9;
        var color_g=0.9;
        var color_b=0.9;
        for (var z=0;z<rainDropsCollisionsTotalParticles;z++){

          var minRand=0;
          var maxRand=14;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var xTranslationRandom=randValue;
          //xTranslationRandom=0;

          var minRand=5;
          var maxRand=15;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var yTranslationRandom=randValue;
          yTranslationRandom=0;

          var minRand=0;
          var maxRand=16;//SEBASTIAN.WEBGL.WORLD.GLOBALS.rows;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var zTranslationRandom=randValue;
          //zTranslationRandom=0;

          var minRand=-.01;
          var maxRand=.01;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var xDestinationRandom=randValue;
          //xDestinationRandom=0;

          var minRand=0;
          var maxRand=.01;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var yDestinationRandom=randValue;
          yDestinationRandom=0;

          var minRand=-.05;
          var maxRand=.05;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var zDestinationRandom=randValue;
          zDestinationRandom=0;

          var minRand=0.5;
          var maxRand=0.7;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          //randValue=2;
          var lifeTimeRandom=1;//randValue;

          var minRand=5;
          var maxRand=6;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          //randValue=2;
          var velocityRandom=randValue;//randValue;

          var minRand=90; //80
          var maxRand=120;
          var randValue=(Math.random() * (maxRand-minRand)) + minRand;
          var sizeRandom=randValue;//randValue;
          var scaleX=sizeRandom; //80
          var scaleY=sizeRandom;   //20

          verticesbuffer.push(
            //the numbers between squares show the value that we will have to pass to vertexAttribPointer as an offset
            //[0]                                           1                               2
            triangleStrippedQuad[ 0]/scaleX,triangleStrippedQuad[ 1]/scaleY,triangleStrippedQuad[ 2]
            //[3]   4                 5
            ,0    , 0                ,0,
            //[6]
            velocityRandom,
            //[7]
            particleType,
            //[8]                    9                     10 - DESTINATION
            xDestinationRandom,      yDestinationRandom,   zDestinationRandom,
            //[11] 12    13 - TRANSLATION
            xTranslationRandom,      yTranslationRandom,   zTranslationRandom,
            //[14] - LIFETIME
            lifeTimeRandom,
            //[15] - Color.r,  16 color.g  17 color.b 18 color.a
            color_r,color_g,color_b,0
          );
          //                  0                                               1                               2                                        3 4               5 6              7            8 9                  10 11  12 13
          verticesbuffer.push(triangleStrippedQuad[ 3]/scaleX,triangleStrippedQuad[ 4]/scaleY,triangleStrippedQuad[ 5],0,0,0,velocityRandom,particleType,xDestinationRandom,yDestinationRandom, zDestinationRandom, xTranslationRandom, yTranslationRandom, zTranslationRandom,lifeTimeRandom,color_r,color_g,color_b,0);
          verticesbuffer.push(triangleStrippedQuad[ 6]/scaleX,triangleStrippedQuad[ 7]/scaleY,triangleStrippedQuad[ 8],0,0,0,velocityRandom,particleType,xDestinationRandom,yDestinationRandom, zDestinationRandom, xTranslationRandom, yTranslationRandom, zTranslationRandom,lifeTimeRandom,color_r,color_g,color_b,0);
          verticesbuffer.push(triangleStrippedQuad[ 9]/scaleX,triangleStrippedQuad[10]/scaleY,triangleStrippedQuad[11],0,0,0,velocityRandom,particleType,xDestinationRandom,yDestinationRandom, zDestinationRandom, xTranslationRandom, yTranslationRandom, zTranslationRandom,lifeTimeRandom,color_r,color_g,color_b,0);

          var idx4=indicesIdx;
          indicesBuffer.push(indices[0]+idx4,indices[1]+idx4,indices[2]+idx4,indices[3]+idx4,indices[4]+idx4,indices[5]+idx4);
          indicesIdx+=4; //we have 4 vertices per triangle
        }

        shaderProgramP.data={

          uTimeDelta              :{location:gl.getUniformLocation(shaderProgramP,'uTimeDelta')},
          uDelta                  :{location:gl.getUniformLocation(shaderProgramP,'uDelta')},
          uCameraTranslation      :{location:gl.getUniformLocation(shaderProgramP,'uCameraTranslation')},
          uPMatrix                :{location:gl.getUniformLocation(shaderProgramP,'uPMatrix')},
          uMVMatrix               :{location:gl.getUniformLocation(shaderProgramP,'uMVMatrix')},
          uRainDelta              :{location:gl.getUniformLocation(shaderProgramP,'uRainDelta')},
          aVertexPosition         :{location:gl.getAttribLocation (shaderProgramP,'aVertexPosition')},
          aParticleInitPosition   :{location:gl.getAttribLocation (shaderProgramP,'aParticleInitPosition')},
          aParticleVelocity       :{location:gl.getAttribLocation (shaderProgramP,'aParticleVelocity')},
          aParticleType           :{location:gl.getAttribLocation (shaderProgramP,'aParticleType')},
          aParticleDestination    :{location:gl.getAttribLocation (shaderProgramP,'aParticleDestination')},
          aParticleTranslation    :{location:gl.getAttribLocation (shaderProgramP,'aParticleTranslation')},
          aParticleLifetime       :{location:gl.getAttribLocation (shaderProgramP,'aParticleLifetime')},
          aParticleColor          :{location:gl.getAttribLocation (shaderProgramP,'aParticleColor')},
          uPointLighting1Location :{location:gl.getUniformLocation (shaderProgramP,'uPointLighting1Location')},
          uPointLighting2Location :{location:gl.getUniformLocation (shaderProgramP,'uPointLighting2Location')},
          uAmbientLightColorIntensity :{location:gl.getUniformLocation (shaderProgramP,'uAmbientLightColorIntensity')},
          uAmbientLightColor      :{location:gl.getUniformLocation (shaderProgramP,'uAmbientLightColor')},

          indicesStruct         :{
            rainDropsCount:rainDropsTotalParticles,
            rainDropsCollisionsCount:rainDropsCollisionsTotalParticles,
            elementsCount:rainDropsTotalParticles+rainDropsCollisionsTotalParticles,
            buffer:gl.createBuffer(),
            data:new Uint16Array(indicesBuffer), //we use a suitable data type for indexes
          },
          interleavedStruct     :{
            buffer  :gl.createBuffer(),
            data    :new Float32Array(verticesbuffer),

            //stride is
           //number of interleaved properties associated with a vertex
           //--
           //size in bytes
           //this will be used by opengl to associate the linear
           //array with the attributes passed to each vertex
            elementsDataLength:19,
            stride:19*Float32Array.BYTES_PER_ELEMENT
          },
          userParticles:{ //particles added by the user (editor)
            triangleStrippedQuad:triangleStrippedQuad,
            indices:indices,
            verticesbuffer:[],
            indicesBuffer:[],
            indicesIdx:0,
            indicesStruct:{
              elementsCount:0,//rainDropsTotalParticles+rainDropsCollisionsTotalParticles,
              buffer:gl.createBuffer(),
              data:null//new Uint16Array(indicesBuffer), //we use a suitable data type for indexes
            },
            interleavedStruct:{
              buffer  :gl.createBuffer(),
              data    :null,//new Float32Array(verticesbuffer),
              elementsDataLength:19,
              stride:19*Float32Array.BYTES_PER_ELEMENT
            },
          }
        }
        //now we could run enableVertexAttribArray but to avoid run-time errors
        //we execute it right before drawing inside the drawcall

        SEBASTIAN.WEBGL.GLOBALS.shaderProgramP=shaderProgramP;

        //proc particles
        gl.useProgram(shaderProgram); //use default program so texture loading and buffers are bind to it
      },

      loadTextureAtlases:function(callback){ //proc loadTextureAtlases {green indent_2}
        const _seba=SEBASTIAN;
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        var atlasLayerIndex=0;
        for (var textureSid in _seba.WEBGL.GLOBALS.tempTextures){
          var currentTexture=_seba.WEBGL.GLOBALS.tempTextures[textureSid];
          SEBASTIAN.WEBGL.handleLoadedTextureAtlasImage(currentTexture,atlasLayerIndex);
          //console.log(_seba.WEBGL.GLOBALS.tempTextures,atlasLayerIndex);
          atlasLayerIndex++;
        }
        delete SEBASTIAN.WEBGL.GLOBALS.tempTextures;
        callback();
      },

      handleLoadedTextureAtlasImage:function(texture,layerIdx){ //proc handleLoadedTextureAtlasImage {green indent_2}
        //multitextures -> ref: https://webglfundamentals.org/webgl/webgl-2-textures.html
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
        var shaderProgram=SEBASTIAN.WEBGL.GLOBALS.shaderProgram;
        var USE_MIPMAPS=1;

        //console.log(shaderProgram.data['uTextureSampler'+layerIdx].location);
        gl.uniform1i     (shaderProgram.data['uTextureSampler'+layerIdx].location,layerIdx);
        gl.activeTexture (gl.TEXTURE0+layerIdx);
        gl.bindTexture   (gl.TEXTURE_2D,texture); //bind once - the atlas texture
        gl.texImage2D    (gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,texture.image);
        gl.texParameteri (gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        if (USE_MIPMAPS){
          //gl.texParameteri (gl.TEXTURE_2D,gl.TEXTURE_BASE_LEVEL,0);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri (gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        }else{
          gl.texParameteri (gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        }

        //2018-03-12 23:04:23
        //https://developer.mozilla.org/en-US/docs/Web/API/EXT_texture_filter_anisotropic
        //MAX_TEXTURE_MAX_ANISOTROPY_EXT is 16 on my card
        if (SEBASTIAN.WEBGL.GLOBALS.anisotropicFilter)
          gl.texParameteri(
            gl.TEXTURE_2D,
            SEBASTIAN.WEBGL.GLOBALS.anisotropicFilter.TEXTURE_MAX_ANISOTROPY_EXT,
            gl.getParameter(SEBASTIAN.WEBGL.GLOBALS.anisotropicFilter.MAX_TEXTURE_MAX_ANISOTROPY_EXT)
          );

        //2018-02-11 16:26:59
        //using the 'CLAMP_TO_EDGE' setting we
        //avoid the texture bleeding phenomenon visible
        //in the edges of the textures that extend throughout
        //the width or height of the tile (tileable-type textures)
        //Note: 2018-03-11 23:03:15
        //since CLAMP_TO_EDGE only applies to the edges of the texture,
        //this setting can not solve the texture bleeding problem if we are using
        //a texture atlas

        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );

      },
      createShaderFromScript:function(gl,scriptId){ //proc createShaderFromScript {green indent_2}
        var shaderType;
        var shaderScript = document.getElementById(scriptId);
        if (!shaderScript)
          alert("*** Error: script element not found: " + scriptId);

        switch(shaderScript.type){
          case 'x-shader/x-vertex':
            shaderType = gl.VERTEX_SHADER;
          break;
          case 'x-shader/x-fragment':
            shaderType = gl.FRAGMENT_SHADER;
          break;
          default:
            alert('webgl_createShaderFromScript error unkown type')
          break;
        }

        // Create the shader object
        var shader = gl.createShader(shaderType);
        // Load the shader source
        gl.shaderSource(shader,shaderScript.text);
        // Compile the shader
        gl.compileShader(shader);
        // Check the compile status
        var compiled = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (!compiled) {
          // Something went wrong during compilation; get the error
          var lastError = gl.getShaderInfoLog(shader);
          console.error("*** Error compiling shader '" + shader + "':" + lastError);
          gl.deleteShader(shader);
          return null;
        }

        return shader;
      },
      createProgram:function(gl,shaders){ //proc createProgram {green indent_2}
        var program = gl.createProgram();
        for (var ii = 0; ii < shaders.length; ++ii) {
          gl.attachShader(program,shaders[ii]);
        }
        gl.linkProgram(program);

        // Check the link status
        var linked = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (!linked) {
          // something went wrong with the link
          var lastError = gl.getProgramInfoLog (program);
          console.error("Error in program linking:" + lastError);
          gl.deleteProgram(program);
          return null;
        }
        return program;
      },

      project:function(x,y,z,xPos,yPos,zPos,eX,eY,eZ,pMatrix,mvMatrix){ //proc project {green indent_2}
        var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var

        var out=vec4.fromValues(x-xPos+eX,y-yPos+eY,z-zPos+eZ,1.0);
        var pMatrixClone=mat4.clone(pMatrix);
        mat4.multiply(pMatrixClone,pMatrixClone,mvMatrix);

        //transform world to clipping coordinates
        vec4.transformMat4(out,out,pMatrixClone);

        var screenX=Math.round(((out[0]/out[2]+1)/2.0)*gl.viewportWidth);
        var screenY=Math.round(((1-out[1]/out[2])/2.0)*gl.viewportHeight);
        return [screenX,screenY];
      },

      WORLD:{ //proc WEBGL.WORLD {orange indent_2}
        GLOBALS:{ //proc WEBGL.WORLD.GLOBALS {orange indent_3}
          //vertexPositions:null, //store dynamic terrain vertex positions
          //worldTilesData:[], //store info for every world tile (e.g textureindex)
          isCameraPositionDirty:1, //flag used to decide whether or not it is necessary to update the translation uniforms of the shader

          //rainDelta 2018-05-30 22:07:39
          rainDelta:0, //this value also controls the conversion of the palette. 1 means greyscale

          //tile world columns
          //these numbers determine the size of the world
          columns:45,
          rows:25,

          //world colors and flags
          sunLightVerticalDistance:300, //height of sunlight (point light) relative to the y position of the sun, the greater the distance the greater the amount of radiated light
          isPointLightPositionDirty:1,
          isAmbientLightDirty:1,

          //def 0.0,0.0,0.0 -> ambient light, the scene has a point light (the sun),
          //this parameter indicates how bright the scene is in case the point-light does
          //not affect what we are watching
          //by setting it to 0,0,0 we get colors with greater contrast
          ambientLightColorIntensity:[0.0,0.0,0.0], //black

          //this color changes according to the time regardless
          //of the light intensity. This parameter allows us to specify
          //which color is the global light
          //(the point light light componente is fixed into the fragment shader for simplicity)
          ambientLightColor:[1.0,1.0,1.0], //1,1,1 -> white

          //ambientLightColor:[22/255,4/255,2/255], //1,1,1 -> white
          //skyLightColor:[254/255,196/255,1/255], //2018-03-17 11:06:14 discontinued
          //ambientLightColor:[171/255,60/255,45/255], //1,1,1 -> white
          //ambientLightColor:[0.01,0.01,0.01], //1,1,1 -> white

          pMatrix:mat4.create(),
          mvMatrix:mat4.create(),

        },
        //dynamic buffers (ummovable objects)
        //static world buffers (ummovable objects)
        vertexPositionBuffer:{}, //proc vertexPositionBuffer {blue indent_3}
        vertexTextureCoordBuffer:{}, //proc vertexTextureCoordBuffer {blue indent_3}
        //---
        init:function(){ //proc init {green indent_3} WEBGL.WORLD.init

        },
        setCameraTo:function(cfg){
          var config={
            xPos:cfg.xPos,
            yPos:cfg.yPos,
            zPos:cfg.zPos,
            pitch:cfg.pitch,
            yaw:cfg.yaw,
          }
          SEBASTIAN.WEBGL.WORLD.GLOBALS.xPos=config.xPos;
          SEBASTIAN.WEBGL.WORLD.GLOBALS.yPos=config.yPos;
          SEBASTIAN.WEBGL.WORLD.GLOBALS.zPos=config.zPos;
          SEBASTIAN.WEBGL.WORLD.GLOBALS.pitch=config.pitch;
          SEBASTIAN.WEBGL.WORLD.GLOBALS.yaw=config.yaw;
          SEBASTIAN.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=1
        },

        syncAllTileBuffersData:function(){ //proc syncAllTileBuffersData {green indent_4}
          //console.log('synca');
          //update the dynamic buffers of all the world tiles
          var _seba=SEBASTIAN;
          var worldData             =_seba.GLOBALS.worldData;
          var dWorldTileSpriteColors=_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.data;

          for (var z=0,zEnd=worldData.world.length;z<zEnd;z++){
            var currentWorldTile=worldData.world[z];
            var idx4=currentWorldTile.id*6*4; //added alpha component
            //console.log(z,idx4);
            //vertex colors (4 points per vertex)
            dWorldTileSpriteColors[idx4+0]=currentWorldTile.color1[0];
            dWorldTileSpriteColors[idx4+1]=currentWorldTile.color1[1];
            dWorldTileSpriteColors[idx4+2]=currentWorldTile.color1[2];
            dWorldTileSpriteColors[idx4+3]=currentWorldTile.opacity;

            dWorldTileSpriteColors[idx4+4]=currentWorldTile.color1[0];
            dWorldTileSpriteColors[idx4+5]=currentWorldTile.color1[1];
            dWorldTileSpriteColors[idx4+6]=currentWorldTile.color1[2];
            dWorldTileSpriteColors[idx4+7]=currentWorldTile.opacity;

            dWorldTileSpriteColors[idx4+8]=currentWorldTile.color1[0];
            dWorldTileSpriteColors[idx4+9]=currentWorldTile.color1[1];
            dWorldTileSpriteColors[idx4+10]=currentWorldTile.color1[2];
            dWorldTileSpriteColors[idx4+11]=currentWorldTile.opacity;

            dWorldTileSpriteColors[idx4+12]=currentWorldTile.color1[0];
            dWorldTileSpriteColors[idx4+13]=currentWorldTile.color1[1];
            dWorldTileSpriteColors[idx4+14]=currentWorldTile.color1[2];
            dWorldTileSpriteColors[idx4+15]=currentWorldTile.opacity;

            dWorldTileSpriteColors[idx4+16]=currentWorldTile.color1[0];
            dWorldTileSpriteColors[idx4+17]=currentWorldTile.color1[1];
            dWorldTileSpriteColors[idx4+18]=currentWorldTile.color1[2];
            dWorldTileSpriteColors[idx4+19]=currentWorldTile.opacity;

            dWorldTileSpriteColors[idx4+20]=currentWorldTile.color1[0];
            dWorldTileSpriteColors[idx4+21]=currentWorldTile.color1[1];
            dWorldTileSpriteColors[idx4+22]=currentWorldTile.color1[2];
            dWorldTileSpriteColors[idx4+23]=currentWorldTile.opacity;
          }

          //update the buffer only if necessary
          _seba.GLOBALS.isWorldTilesColorsDirty=1;

        },
        syncTileBuffersData:function(currentWorldTile){ //proc syncTileBuffersData {green indent_4}
          //console.log('syncb');
          //update the dynamic buffers of the world tiles
          //console.log('xxx',currentWorldTile.id);
          var _seba=SEBASTIAN;
          var dWorldTileSpriteColors    =_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.data;
          var dWorldTileEntityProperties=_seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties.data;
          var dWorldTileTextureCoords   =_seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords.data;
          var currentTexture=_seba.WEBGL.GLOBALS.textures[currentWorldTile.textureId];

          var idx4=currentWorldTile.id*6*4; //2018-05-03 17:19:15 added alpha component
          var dWorldTileEntityPropertiesIdx=currentWorldTile.id*6*_seba.WEBGL.WORLD.ENTITIES.GLOBALS.totalProperties;
          var dWorldTileTextureCoordsIdx=currentWorldTile.id*6*2;
          //vertex colors (3 points per vertex)
          dWorldTileSpriteColors[idx4+0]=currentWorldTile.color1[0];
          dWorldTileSpriteColors[idx4+1]=currentWorldTile.color1[1];
          dWorldTileSpriteColors[idx4+2]=currentWorldTile.color1[2];
          dWorldTileSpriteColors[idx4+3]=currentWorldTile.opacity;

          dWorldTileSpriteColors[idx4+4]=currentWorldTile.color1[0];
          dWorldTileSpriteColors[idx4+5]=currentWorldTile.color1[1];
          dWorldTileSpriteColors[idx4+6]=currentWorldTile.color1[2];
          dWorldTileSpriteColors[idx4+7]=currentWorldTile.opacity;

          dWorldTileSpriteColors[idx4+8]=currentWorldTile.color1[0];
          dWorldTileSpriteColors[idx4+9]=currentWorldTile.color1[1];
          dWorldTileSpriteColors[idx4+10]=currentWorldTile.color1[2];
          dWorldTileSpriteColors[idx4+11]=currentWorldTile.opacity;

          dWorldTileSpriteColors[idx4+12]=currentWorldTile.color1[0];
          dWorldTileSpriteColors[idx4+13]=currentWorldTile.color1[1];
          dWorldTileSpriteColors[idx4+14]=currentWorldTile.color1[2];
          dWorldTileSpriteColors[idx4+15]=currentWorldTile.opacity;

          dWorldTileSpriteColors[idx4+16]=currentWorldTile.color1[0];
          dWorldTileSpriteColors[idx4+17]=currentWorldTile.color1[1];
          dWorldTileSpriteColors[idx4+18]=currentWorldTile.color1[2];
          dWorldTileSpriteColors[idx4+19]=currentWorldTile.opacity;

          dWorldTileSpriteColors[idx4+20]=currentWorldTile.color1[0];
          dWorldTileSpriteColors[idx4+21]=currentWorldTile.color1[1];
          dWorldTileSpriteColors[idx4+22]=currentWorldTile.color1[2];
          dWorldTileSpriteColors[idx4+23]=currentWorldTile.opacity;

          // simply copy the the selected texture coordinates
          // into the 'slot' of the current world tile within the buffer of texture coordinates

          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 0]=currentTexture.textureCoordinates[0];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 1]=currentTexture.textureCoordinates[1];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 2]=currentTexture.textureCoordinates[2];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 3]=currentTexture.textureCoordinates[3];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 4]=currentTexture.textureCoordinates[4];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 5]=currentTexture.textureCoordinates[5];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 6]=currentTexture.textureCoordinates[6];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 7]=currentTexture.textureCoordinates[7];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 8]=currentTexture.textureCoordinates[8];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+ 9]=currentTexture.textureCoordinates[9];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+10]=currentTexture.textureCoordinates[10];
          dWorldTileTextureCoords[dWorldTileTextureCoordsIdx+11]=currentTexture.textureCoordinates[11];

          dWorldTileEntityProperties[  dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[0]; //texture X coord
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.layerId; //sprite layer id
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4]; //texture X1 coord
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=0.0; //is light emitter,apply shadow attenuation,isFlippedX
          //--
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[0];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.layerId;
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=0.0;
          //--
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[0];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.layerId;
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=0.0;
          //--
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[0];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.layerId;
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=0.0;
          //--
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[0];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.layerId;
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=0.0;
          //--
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[0];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.layerId;
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
          dWorldTileEntityProperties[++dWorldTileEntityPropertiesIdx]=0.0;

          _seba.GLOBALS.isWorldTilesColorsDirty=1;
          _seba.GLOBALS.isWorldTilesTextureCoordsDirty=1;
          _seba.GLOBALS.isWorldTilesPropertiesDirty=1;

        },
        draw:function(now){ //proc DRAW! {green bold indent_3}

          const _seba=SEBASTIAN; //performance lookup
          //var lastTime=;
          //console.log(now,lastTime);
          var elapsed=now-_seba.GLOBALS.lastTime;
          if (elapsed<_seba.GLOBALS.fpsInterval)
            return;
          //console.log(elapsed);

          //BEGIN RENDER

          //console.log('frame',new Date());

          var delta=elapsed;
          if (delta>_seba.GLOBALS.fpsInterval) //do not allow overflow
            delta=_seba.GLOBALS.fpsInterval;

          _seba.GLOBALS.lastTime=now;

//          return;

          var oDate=new Date();

          //color timekey
          var h_key,m_key;
          var hours,minutes;
          if (_seba.GLOBALS.debugLightColors===1){ //allows setting the time manually
            var tDate=new Date();
                        var unixtime=tDate.getTime();
            unixtime+=_seba.GLOBALS.timeTravel*60*1000;
            tDate.setTime(unixtime);
            if (SEBASTIAN.GLOBALS.useUTCTime){
              h_key=tDate.getUTCHours();
              m_key=tDate.getUTCMinutes();
            }else{
              h_key=tDate.getHours();
              m_key=tDate.getMinutes();
            }
            hours=h_key;
            minutes=m_key;
          }else{
            if (SEBASTIAN.GLOBALS.useUTCTime){
              h_key=oDate.getUTCHours();
              m_key=oDate.getUTCMinutes();
            }else{
              h_key=oDate.getHours();
              m_key=oDate.getMinutes();
            }
            hours=h_key;
            minutes=m_key;
          }
          //if (h_key<10)
          //  h_key='0'+h_key;
          //if (m_key<10)
          //  m_key='0'+m_key;
          var colorKey=h_key+'_'+m_key;
          var timeIdx=hours*60+minutes; //this allows us to index the day in minutes

          //lookups
          var shaderProgram                =_seba.WEBGL.GLOBALS.shaderProgram;
          //proc particles
          var shaderProgramP               =_seba.WEBGL.GLOBALS.shaderProgramP;
          var worldVertexPositionBuffer    =_seba.WEBGL.WORLD.vertexPositionBuffer;
          var worldVertexTextureCoordBuffer=_seba.WEBGL.WORLD.vertexTextureCoordBuffer;
          var gl                           =_seba.GLOBALS.webgl_ctx; //lookup var
          var pitch                        =_seba.WEBGL.WORLD.GLOBALS.pitch;
          var yaw                          =_seba.WEBGL.WORLD.GLOBALS.yaw;
          var pMatrix                      =_seba.WEBGL.WORLD.GLOBALS.pMatrix;
          var mvMatrix                     =_seba.WEBGL.WORLD.GLOBALS.mvMatrix;
          var xPos                         =_seba.WEBGL.WORLD.GLOBALS.xPos;
          var yPos                         =_seba.WEBGL.WORLD.GLOBALS.yPos;
          var zPos                         =_seba.WEBGL.WORLD.GLOBALS.zPos;
          var degToRad                     =_seba.UTILS.degToRad;
          var textures                     =_seba.WEBGL.textures;
          var worldData                    =_seba.GLOBALS.worldData;
          var entitiesTotalProperties      =_seba.WEBGL.WORLD.ENTITIES.GLOBALS.totalProperties;

          //proc particles
          gl.useProgram(shaderProgram);

          if (_seba.GLOBALS.firstDraw || _seba.GLOBALS.lastTimeKey===null || _seba.GLOBALS.lastTimeKey!==colorKey){
            //console.log(tDate);
            //update time globals
            _seba.GLOBALS.firstDraw=0;
            _seba.GLOBALS.hours=h_key;//tDate.getHours();
            _seba.GLOBALS.minutes=m_key;//tDate.getMinutes();
            //refresh clock
            var c_h_key=tDate.getHours();
            var c_m_key=tDate.getMinutes();
            if (c_h_key<10)
              c_h_key='0'+c_h_key;
            if (c_m_key<10)
              c_m_key='0'+c_m_key;
            SEBASTIAN.GLOBALS.clock.textContent=c_h_key+':'+c_m_key;
            //map new colors
            //console.log('map color',colorKey,SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].idx);

            var brotherSun=worldData.entitiesNamePointer['sun'];
            var sisterMoon=worldData.entitiesNamePointer['moon'];
            var centerX=0;
            var centerY=-25; //let's move the moon and the sun down a little bit so that they are more visible in our horizon
            var circleRadius=120;
            var distance=1440; //number of minutes in a day, corresponds to our time keys.
                               //We want our stars (star and satellite to be precise)
                               //to describe a circle based on the current minute.
                               //I want the sun to be high at midday and low at midnight.
                               //for the moon I want the exact opposite, ergo set a distance of 720 minutes between them
                               //720 minutes = half of the minutes in a day
            //console.log(Math.acos(1-(Math.pow(distance/circleRadiusX,2)/2)));
            //arccos( 1-(d/r)^2/2 )
            //console.log(distance/circleRadiusX,2);
            //https://stackoverflow.com/questions/17384663/canvas-move-object-in-circle
            //https://www.safaribooksonline.com/library/view/html5-canvas/9781449308032/ch05s03.html
            //console.log(Math.pow(distance/circleRadiusX,2)/2);
            //console.log(Math.acos(1-Math.pow(distance/circleRadiusX,2)/2));
            //console.log(colorKey);
            var angle1=((SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].idx+720)*Math.PI/(360*2));
            var angle2=((SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].idx)*Math.PI/(360*2));
            //console.log();
            brotherSun.x=centerX+Math.sin(angle1)*circleRadius;
            brotherSun.y=centerY+Math.cos(angle1)*circleRadius;
            brotherSun.angle=angle1; //used to simplify light position calculations
            //brotherSun.z=-(centerY+Math.cos(angle)*circleRadius);
            //I would say to put an opacity to the moon in order to make it disappear when it's sunny...
            sisterMoon.x=centerX+Math.sin(angle2)*circleRadius;
            sisterMoon.y=centerY+Math.cos(angle2)*circleRadius;
            _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(brotherSun);
            _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(sisterMoon);

            //console.log((2 * Math.PI/60)*oDate.getSeconds());
            //ctx.rotate(((2 * Math.PI) / 60) * oDate.getSeconds() + ((2 * Math.PI) / 60000) * oDate.getMilliseconds());

            _seba.WEBGL.WORLD.GLOBALS.ambientLightColor=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].a;
            //_seba.WEBGL.WORLD.GLOBALS.skyLightColor=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].a;
            document.body.style.background=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey].g;
            _seba.GLOBALS.lastTimeKey=colorKey;
            //the position of the light has changed
            _seba.WEBGL.WORLD.GLOBALS.isPointLightPositionDirty=1;
            //the color of the light has changed
            _seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty=1;
          }

          //read the mouse coordinates from the html
          var mx=_seba.GLOBALS.mx;
          var my=_seba.GLOBALS.my;
          var oMx=_seba.GLOBALS.oMx;
          var oMy=_seba.GLOBALS.oMy;

          if (worldVertexTextureCoordBuffer===null || worldVertexPositionBuffer===null)
            return;

          if (_seba.WEBGL.WORLD.GLOBALS.isViewportDirty){ //browser window resized
            // we need to calculate the perspective
            // only if the viewport is resized
            gl.viewport(0,0,gl.viewportWidth,gl.viewportHeight);
            mat4.perspective(pMatrix,45,gl.viewportWidth/gl.viewportHeight,0.1,200.0);
            gl.uniformMatrix4fv(shaderProgram.data.uPMatrix.location,false,pMatrix); //apply global projection matrix
            _seba.WEBGL.WORLD.GLOBALS.isViewportDirty=0;

            //proc particles
            gl.useProgram(shaderProgramP); //switch to particles
            gl.uniformMatrix4fv(shaderProgramP.data.uPMatrix.location,false,pMatrix); //apply global projection matrix
            gl.useProgram(shaderProgram); //back to default

          }

          if (_seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty){ // modified camera position
            gl.uniform3f(shaderProgram.data.uCameraTranslation.location,xPos,yPos,zPos); // pass the position of the camera to the vertex shader

            //proc particles
            gl.useProgram(shaderProgramP); //switch to particles
            gl.uniform3f(shaderProgramP.data.uCameraTranslation.location,xPos,yPos,zPos); // pass the position of the camera to the vertex shader
            gl.useProgram(shaderProgram); //back to default

            _seba.WEBGL.WORLD.GLOBALS.isCameraPositionDirty=0;

            // I have to perform entity position analysis and determine who is visible
            // 0 = I do not care to reorder on z
            // 1= I'm interested in determining visibility
            // 0= I do not care to know who is under the mouse

            _seba.WEBGL.WORLD.ENTITIES.checkEntitiesDepthVisibilityMousePos(0,1,0);
          }

          //clear the buffers
          //ref: https://stackoverflow.com/questions/19469194/why-do-we-have-to-clear-depth-buffer-in-opengl-during-rendering/19469291#19469291
          gl.clear(gl.COLOR_BUFFER_BIT | gl.GL_DEPTH_BUFFER_BIT);

           // if a different rotation is applied than the one we have stored
           // Let's do some nice calculations.
          if (_seba.WEBGL.WORLD.GLOBALS.lPitch!==pitch || _seba.WEBGL.WORLD.GLOBALS.lYaw!==yaw){
            mat4.identity(mvMatrix);
            if (pitch!==0)
              mat4.rotate(mvMatrix,mvMatrix,degToRad(-pitch), [1, 0, 0]);
            if (yaw!==0)
              mat4.rotate(mvMatrix,mvMatrix,degToRad(-yaw)  , [0, 1, 0]);
            _seba.WEBGL.WORLD.GLOBALS.lPitch=pitch;
            _seba.WEBGL.WORLD.GLOBALS.lYaw=yaw;
            //apply global viematrix only if a rotation is applied
            gl.uniformMatrix4fv(shaderProgram.data.uMVMatrix.location,false,mvMatrix);

            //proc particles
            gl.useProgram(shaderProgramP); //switch to particles
            gl.uniformMatrix4fv(shaderProgramP.data.uMVMatrix.location,false,mvMatrix);
            gl.useProgram(shaderProgram); //back to default

          }

          var foundTileUnderMouse=0;
          var foundEntityUnderMouse=0;
          var searchTile=0;
          var searchEntity=0;

          if (_seba.WEBGL.WORLD.GLOBALS.isPointLightPositionDirty){
            // apply light-based calculations
            // only if the position of the light has changed
            var brotherSun=worldData.entitiesNamePointer['sun'];
            var sisterMoon=worldData.entitiesNamePointer['moon'];

            // change the vertical position of the light based on the time of day,
            // this allows us, for example, to create the silhouette effect during sunset or sunrise
            var sunLightVerticalDistance=_seba.WEBGL.WORLD.GLOBALS.sunLightVerticalDistance;

            //sunset
            sunLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              parameter:sunLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :17,fromMinutes:45,
              toHours   :18,toMinutes  :15,
              fromValue:SEBASTIAN.WEBGL.WORLD.GLOBALS.sunLightVerticalDistance,
              toValue  :0,
            });
            //from after sunset to midnight
            sunLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:sunLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :18,fromMinutes:16,
              toHours   :23 ,toMinutes :59,
              fromValue:SEBASTIAN.WEBGL.WORLD.GLOBALS.sunLightVerticalDistance,
              toValue  :-1600,
            });
            // from midnight to dawn
            sunLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:sunLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :0,fromMinutes:0,
              toHours   :5 ,toMinutes :44,
              fromValue:-1600,
              toValue  :-400,
            });
            //Sunrise
            sunLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              applyTimeBouncing:0,
              parameter:sunLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :5,fromMinutes:45,
              toHours   :6,toMinutes  :15,
              fromValue:-400,
              toValue  :SEBASTIAN.WEBGL.WORLD.GLOBALS.sunLightVerticalDistance,
            });

            //MOON

            var moonLightVerticalDistance=-300;
            moonLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:moonLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :17,fromMinutes:16,
              toHours   :23 ,toMinutes :59,
              fromValue:30,
              toValue  :150,
            });
            //from midnight to before dawn
            moonLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:moonLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :0,fromMinutes:0,
              toHours   :5 ,toMinutes :44,
              fromValue:150,
              toValue  :50,
            });
            moonLightVerticalDistance=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:moonLightVerticalDistance,
              currentHour:hours,currentMinute:minutes,
              fromHours :5,fromMinutes:45,
              toHours   :6 ,toMinutes :0,
              fromValue:50,
              toValue  :-300,
            });
            //the moon 'disappears' in the light of day
            var moonOpacity=0;
            moonOpacity=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:moonOpacity,
              currentHour:hours,currentMinute:minutes,
              fromHours :18,fromMinutes:0,
              toHours   :21 ,toMinutes :0,
              fromValue:0,
              toValue  :1,
            });
            moonOpacity=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:moonOpacity,
              currentHour:hours,currentMinute:minutes,
              fromHours :21,fromMinutes:1,
              toHours   :23,toMinutes  :59,
              fromValue:1,
              toValue  :1,
            });
            moonOpacity=SEBASTIAN.UTILS.applyTimeCalc({
              //logInfo:1,
              applyTimeBouncing:0,
              parameter:moonOpacity,
              currentHour:hours,currentMinute:minutes,
              fromHours :0,fromMinutes:0,
              toHours   :5,toMinutes  :45,
              fromValue:1,
              toValue  :0,
            });

            //2018-05-31 10:41:00 fade to gray the background if needed
            //this include sun opacity status variation
            //proc rain controller {indent_4}
            _seba.UTILS.backgroundGradientFadeToGray();

            sisterMoon.opacity=moonOpacity;
            _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(sisterMoon); //update alpha

            //console.log(moonLightVerticalDistance);
            //console.log(parseFloat(t).toFixed(2),parseFloat(brotherSun.angle).toFixed(2),sunLightVerticalPosition);
            gl.uniform3f(shaderProgram.data.uPointLighting1Location.location,brotherSun.x,brotherSun.y+sunLightVerticalDistance,brotherSun.z);

             // instead of lowering the intensity of the moonlight in the vertex shader
             // make sure that the light is less high than the satellite in order to illuminate less
            gl.uniform3f(shaderProgram.data.uPointLighting2Location.location,sisterMoon.x,sisterMoon.y+moonLightVerticalDistance,sisterMoon.z);

            gl.useProgram(shaderProgramP);
            gl.uniform3f(shaderProgramP.data.uPointLighting1Location.location,brotherSun.x,brotherSun.y+sunLightVerticalDistance,brotherSun.z);
            gl.uniform3f(shaderProgramP.data.uPointLighting2Location.location,sisterMoon.x,sisterMoon.y+moonLightVerticalDistance,sisterMoon.z);
            gl.useProgram(shaderProgram);

            _seba.WEBGL.WORLD.GLOBALS.isPointLightPositionDirty=0;
          }

          if (_seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty){
            gl.uniform3fv(shaderProgram.data.uAmbientLightColorIntensity.location,_seba.WEBGL.WORLD.GLOBALS.ambientLightColorIntensity); //set ambient light intensity
            gl.uniform3fv(shaderProgram.data.uAmbientLightColor.location,_seba.WEBGL.WORLD.GLOBALS.ambientLightColor); //set ambient light color
            gl.uniform1f(shaderProgram.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set gray color

            gl.useProgram(shaderProgramP);
            gl.uniform1f(shaderProgramP.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
            gl.uniform3fv(shaderProgramP.data.uAmbientLightColorIntensity.location,_seba.WEBGL.WORLD.GLOBALS.ambientLightColorIntensity); //set ambient light intensity
            gl.uniform3fv(shaderProgramP.data.uAmbientLightColor.location,_seba.WEBGL.WORLD.GLOBALS.ambientLightColor); //set ambient light color
            gl.useProgram(shaderProgram);
          }

          var drawCalls=0;

          //proc TILES {indent_4}
          //first we draw the static world, it has no transparencies
          gl.depthMask(true); //this disables alpha blending, if we were to render a texture with alpha it would have a solid background

          var skippedTiles=0;

          var vertexPositions=_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.data;
          for (var z=0,zEnd=worldData.world.length;z<zEnd;z++){
            var currentWorldTile=worldData.world[z];

            //if (z===20){
            //  console.log(vertexPositions[z*6*3+2]);
            //}

            if (_seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty){ // This must be done regardless of the visibility of the tile
              var clockKey=_seba.GLOBALS.lastTimeKey;
              var colorsPoolIdx=currentWorldTile.colorsPoolIdx;
              var chosenColor=SEBASTIAN.GLOBALS.lightColorTimeMap[clockKey][colorsPoolIdx];
              currentWorldTile.color1=chosenColor;
              currentWorldTile.oColor1=chosenColor;
              // it makes no sense to sync one tile at a time.
              // run a single call at the end
              //_seba.WEBGL.WORLD.syncTileBuffersData(currentWorldTile);
            }

            //drawCalls++;
          }
//          _seba.GLOBALS.isMouseDirty=0;

          //update the color of the tiles if necessary
          if (_seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty){
            _seba.WEBGL.WORLD.syncAllTileBuffersData();
          }

          // worldtile buffers data do not change with each drawcall
          // only in the in case something changes during editing -> update them

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords.buffer);
          if (_seba.GLOBALS.isWorldTilesTextureCoordsDirty){
            gl.bufferData(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords.data,gl.DYNAMIC_DRAW);
            _seba.GLOBALS.isWorldTilesTextureCoordsDirty=0;
          }
          gl.vertexAttribPointer(shaderProgram.data.aTextureCoord.location,2,gl.FLOAT,false,0,0);

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTranslations.buffer);
          gl.vertexAttribPointer(shaderProgram.data.aEntityTranslation.location,3,gl.FLOAT,false,0,0);

          //replace the color buffer data once a minute (see WORLD.syncTileBuffersData)
          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.buffer);
          if (_seba.GLOBALS.isWorldTilesColorsDirty){
            gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.data);
            _seba.GLOBALS.isWorldTilesColorsDirty=0;
          }
          gl.vertexAttribPointer(shaderProgram.data.aEntityColor.location,4,gl.FLOAT,false,0,0);

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties.buffer);
          if (_seba.GLOBALS.isWorldTilesPropertiesDirty){
            gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties.data);
            _seba.GLOBALS.isWorldTilesPropertiesDirty=0;
          }
          gl.vertexAttribPointer(shaderProgram.data.aEntityProperties.location,entitiesTotalProperties,gl.FLOAT,false,0,0);

          gl.bindBuffer   (gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.buffer);
          if (_seba.GLOBALS.isWorldTilesVerticesPositionDirty){
            //since we allow editing of the vertices, apply them for the current drawcall if they have been modified
            gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.data); // this makes the position of the vertices dynamic, in case we use static terrain we can remove this line
            _seba.GLOBALS.isWorldTilesVerticesPositionDirty=0;
          }
          gl.vertexAttribPointer(shaderProgram.data.aVertexPosition.location,3,gl.FLOAT,false,0,0);

          gl.drawArrays(gl.TRIANGLES,0,_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.count);

          //----------------------

          //proc ENTITIES {indent_4}
          //now we draw entities that have transparent PNGs as textures

          //proc particles code goes here
          gl.depthMask(false); //disabling depth mask we can have alpha objects but we have to sort them
          gl.useProgram(shaderProgramP);
          gl.uniform1f(shaderProgramP.data.uTimeDelta.location,_seba.GLOBALS.timeDelta); // pass the elapsed time
          gl.uniform1f(shaderProgramP.data.uDelta.location,delta);                       // pass the frame delta
          //--
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,shaderProgramP.data.indicesStruct.buffer);
          if (_seba.GLOBALS.isParticlesBufferDataDirty){
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,shaderProgramP.data.indicesStruct.data,gl.DYNAMIC_DRAW);
            //time to enable attributes
            gl.enableVertexAttribArray(shaderProgramP.data.aVertexPosition.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleInitPosition.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleVelocity.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleType.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleDestination.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleTranslation.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleLifetime.location);
            gl.enableVertexAttribArray(shaderProgramP.data.aParticleColor.location);
            //--
            //console.log('dirty');
          }
          gl.bindBuffer(gl.ARRAY_BUFFER,shaderProgramP.data.interleavedStruct.buffer);
          if (_seba.GLOBALS.isParticlesBufferDataDirty){
            gl.bufferData(gl.ARRAY_BUFFER,shaderProgramP.data.interleavedStruct.data,gl.DYNAMIC_DRAW);
            //console.log('diana');
          }
          var stride=shaderProgramP.data.interleavedStruct.stride;
          gl.vertexAttribPointer(shaderProgramP.data.aVertexPosition.location      ,3,gl.FLOAT,false,stride,0);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleInitPosition.location,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*3);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleVelocity.location    ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*6);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleType.location        ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*7);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleDestination.location ,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*8);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleTranslation.location ,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*11);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleLifetime.location    ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*14);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleColor.location       ,4,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*15);

          //gl.drawArrays(gl.TRIANGLES,0,4*shaderProgramP.data.interleavedStruct.elementsCount);
          //console.log(shaderProgramP.data.indicesStruct.elementsCount);
          //gl.drawElements(gl.TRIANGLES,60000,gl.UNSIGNED_SHORT,120000);

          //console.log(delta);
          var rdcc=shaderProgramP.data.indicesStruct.rainDropsCollisionsCount*_seba.WEBGL.WORLD.GLOBALS.rainDelta;
          gl.drawElements(gl.TRIANGLES,6*rdcc,gl.UNSIGNED_SHORT,6*shaderProgramP.data.indicesStruct.rainDropsCount*Uint16Array.BYTES_PER_ELEMENT);
          _seba.GLOBALS.timeDelta+=0.001*delta;

          //necessaria solo se spostiamo codice prima del render delle entities
          gl.useProgram(shaderProgram);

          //proc particles code end

          var depths=_seba.WEBGL.WORLD.ENTITIES.GLOBALS.depthSorted;

          //writing into the depth buffer is now disabled.
          gl.depthMask(false); //disabling depth mask we can have alpha objects but we have to sort them

          for (var z=0,zEnd=worldData.entities.length;z<zEnd;z++){
            var currentEntity=worldData.entities[depths[z].entityId]; // obtain the ordered entities based on depth, and we use the painter algorithm to draw them

            if (currentEntity.isHidden===1) // entities such as clusters are hidden. (in fact they are always drawn because the data is in the buffer array, but with negative x)
              continue;

            //todo: this is perhaps less expensive to do once and for all entities
            if (_seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty){
              // update color pool if necessary
              // this same routine manages the dynamic color of the single entities dDMKCWhHp4
              if (currentEntity.hasPoolColor===1){
                var clockKey=_seba.GLOBALS.lastTimeKey;
                var colorsPoolIdx=currentEntity.colorsPoolIdx;
                var chosenColor=SEBASTIAN.GLOBALS.lightColorTimeMap[clockKey][colorsPoolIdx];
                currentEntity.color1=chosenColor;
                currentEntity.oColor1=chosenColor;
                SEBASTIAN.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity);
              }
            }

            _seba.WEBGL.WORLD.ENTITIES.animate(currentEntity.id,delta,timeIdx);

            if (currentEntity.isVisible===0) // non-visible entities are still animated at position level, but not geometry
              continue;

            _seba.WEBGL.WORLD.ENTITIES.animateGeometry(currentEntity.id,delta);
          }

          //proc reset isAmbientLightDirty flag {indent_4}
          if (_seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty){
            _seba.WEBGL.WORLD.GLOBALS.isAmbientLightDirty=0;
          }

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesTextureCoordsZ.buffer);
          gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.entitiesTextureCoordsZ.data);
          gl.vertexAttribPointer(shaderProgram.data.aTextureCoord.location,2,gl.FLOAT,false,0,0);

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.buffer);
          gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data);
          gl.vertexAttribPointer(shaderProgram.data.aEntityTranslation.location,3,gl.FLOAT,false,0,0);

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesSpriteColorsZ.buffer);
          gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.entitiesSpriteColorsZ.data);
          gl.vertexAttribPointer(shaderProgram.data.aEntityColor.location,4,gl.FLOAT,false,0,0);

          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesPropertiesZ.buffer);
          gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.entitiesPropertiesZ.data);
          gl.vertexAttribPointer(shaderProgram.data.aEntityProperties.location,entitiesTotalProperties,gl.FLOAT,false,0,0);

          gl.bindBuffer   (gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.buffer);
          gl.bufferSubData(gl.ARRAY_BUFFER,0,_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.data);
          gl.vertexAttribPointer(shaderProgram.data.aVertexPosition.location,3,gl.FLOAT,false,0,0);

          gl.drawArrays(gl.TRIANGLES,0,_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.count);

          if (_seba.GLOBALS.isEditorEnabled){
            var colorsPoolIdx='p'+_seba.GLOBALS.tilesColorPool[_seba.GLOBALS.tilesColorPoolIdx];
            var chosenTileColor=SEBASTIAN.GLOBALS.lightColorTimeMap[_seba.GLOBALS.lastTimeKey][colorsPoolIdx];
            var sCol='rgb('+Math.round(chosenTileColor[0]*255)+','+Math.round(chosenTileColor[1]*255)+','+Math.round(chosenTileColor[2]*255)+')';
            var sTileColor='<div style="display:inline-block;width:10px;height:10px;background-color:'+sCol+'"></div>'
            var sTileOpacity=_seba.GLOBALS.tilesOpacityPool[_seba.GLOBALS.tilesOpacityPoolIdx];
            var sTileTexture=_seba.GLOBALS.tilesTexturePool[_seba.GLOBALS.tilesTexturePoolIdx];

            var sMapEditorCurrentEntityGroup=_seba.GLOBALS.mapEntityGroups[_seba.GLOBALS.mapEntityGroupsIdx];

            //document.getElementById('debug').innerHTML='group:'+sMapEditorCurrentEntityGroup+' tileTexure:'+sTileTexture+' tileColor:'+sTileColor+' tileOpacity:'+sTileOpacity+' tile:'+_seba.GLOBALS.currentTileId+' skipped tiles:'+skippedTiles+' skipped entities:'+skippedEntities+' drawCalls:'+drawCalls;
            document.getElementById('debug').innerHTML='group:'+sMapEditorCurrentEntityGroup+' tileTexure:'+sTileTexture+' tileColor:'+sTileColor+' tileOpacity:'+sTileOpacity+' tile:'+_seba.GLOBALS.currentTileId;
          }

          gl.useProgram(shaderProgramP);
          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,shaderProgramP.data.indicesStruct.buffer);
          gl.bindBuffer(gl.ARRAY_BUFFER,shaderProgramP.data.interleavedStruct.buffer);
          //var stride=shaderProgramP.data.interleavedStruct.stride;
          gl.vertexAttribPointer(shaderProgramP.data.aVertexPosition.location      ,3,gl.FLOAT,false,stride,0);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleInitPosition.location,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*3);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleVelocity.location    ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*6);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleType.location        ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*7);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleDestination.location ,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*8);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleTranslation.location ,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*11);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleLifetime.location    ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*14);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleColor.location       ,4,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*15);
          var rdc=shaderProgramP.data.indicesStruct.rainDropsCount*_seba.WEBGL.WORLD.GLOBALS.rainDelta;
          gl.drawElements(gl.TRIANGLES,6*rdc,gl.UNSIGNED_SHORT,0);

          gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,shaderProgramP.data.userParticles.indicesStruct.buffer);
          if (_seba.GLOBALS.isParticlesBufferDataDirty){
            if (shaderProgramP.data.userParticles.indicesStruct.elementsCount>0){
              gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,shaderProgramP.data.userParticles.indicesStruct.data,gl.DYNAMIC_DRAW);
            }
            //console.log('dirty2');
          }

          gl.bindBuffer(gl.ARRAY_BUFFER,shaderProgramP.data.userParticles.interleavedStruct.buffer);
          if (_seba.GLOBALS.isParticlesBufferDataDirty){
            if (shaderProgramP.data.userParticles.indicesStruct.elementsCount>0){
              gl.bufferData(gl.ARRAY_BUFFER,shaderProgramP.data.userParticles.interleavedStruct.data,gl.DYNAMIC_DRAW);
            }
            //console.log('diana2');
            _seba.GLOBALS.isParticlesBufferDataDirty=0;
          }

          //var stride=shaderProgramP.data.interleavedStruct.stride;
          gl.vertexAttribPointer(shaderProgramP.data.aVertexPosition.location      ,3,gl.FLOAT,false,stride,0);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleInitPosition.location,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*3);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleVelocity.location    ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*6);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleType.location        ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*7);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleDestination.location ,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*8);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleTranslation.location ,3,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*11);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleLifetime.location    ,1,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*14);
          gl.vertexAttribPointer(shaderProgramP.data.aParticleColor.location       ,4,gl.FLOAT,false,stride,Float32Array.BYTES_PER_ELEMENT*15);
          gl.drawElements(gl.TRIANGLES,6*shaderProgramP.data.userParticles.indicesStruct.elementsCount,gl.UNSIGNED_SHORT,0);

          //proc particles code end

          //It was fun. ALL DONE.
        },

        load:function(callback){ //proc load WORLD/SCENE {green indent_3 bold}
          var request=new XMLHttpRequest();

          //proc sebastian {indent_5 red}

          //proc codepen {indent_5 red}

            request.open('GET','https://s3-us-west-2.amazonaws.com/s.cdpn.io/1981998/scene.eiv4.json');

          //proc builder {indent_5 red}

          //proc buildercodepen {indent_5 red bviolet}

          //proc none {indent_5 red}

          request.onreadystatechange=function(){
            if (request.readyState===4){
              SEBASTIAN.WEBGL.WORLD.onloadHandler(request.responseText,callback);
            }
          }
          request.send();
        },

        onloadHandler:function(data,callback){ //proc onloadHandler WORLD/SCENE {green indent_3}
          var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
          var worldData=JSON.parse(data);
          var _seba=SEBASTIAN;
          _seba.GLOBALS.worldData=worldData;

          //console.log(worldData.entities.length);

          //proc USER PARTICLES {violet bold indent_4}
          //particles load init
          if (typeof worldData.userParticles!=='undefined'){
            var shaderProgramP=_seba.WEBGL.GLOBALS.shaderProgramP;

            //    var triangleStrippedQuad=shaderProgramP.data.userParticles.triangleStrippedQuad;
            shaderProgramP.data.userParticles.indices=worldData.userParticles.indices;
            SEBASTIAN.GLOBALS.currentSelectedParticles=worldData.userParticles.currentSelectedParticles;
            SEBASTIAN.GLOBALS.currentSelectedParticlesGIdx=worldData.userParticles.currentSelectedParticlesGIdx;
            shaderProgramP.data.userParticles.indicesIdx=worldData.userParticles.indicesIdx;
            shaderProgramP.data.userParticles.indicesStruct.elementsCount=worldData.userParticles.indicesStruct.elementsCount;
            shaderProgramP.data.userParticles.indicesBuffer=worldData.userParticles.indicesBuffer;
            shaderProgramP.data.userParticles.indicesStruct.data=new Uint16Array(shaderProgramP.data.userParticles.indicesBuffer);
            shaderProgramP.data.userParticles.verticesbuffer=worldData.userParticles.verticesbuffer;
            shaderProgramP.data.userParticles.interleavedStruct.data=new Float32Array(shaderProgramP.data.userParticles.verticesbuffer);
            _seba.GLOBALS.currentSelectedParticlesIdx=SEBASTIAN.GLOBALS.currentSelectedParticles.length-1;

            //update buffers
            _seba.GLOBALS.isParticlesBufferDataDirty=1; //force particles buffer data mapping
            //SEBASTIAN.GLOBALS.currentSelectedParticles.push(currentSelectedParticles);
            //SEBASTIAN.GLOBALS.currentSelectedParticlesGIdx=currentSelectedParticlesGIdx;
            //_seba.GLOBALS.currentSelectedParticlesIdx=SEBASTIAN.GLOBALS.currentSelectedParticles.length-1;
            var particleSelectionColor=_seba.GLOBALS.particleSelectionColor;
            _seba.WEBGL.WORLD.PARTICLES.updateCurrentSelectedGroup({r:particleSelectionColor[0],g:particleSelectionColor[1],b:particleSelectionColor[2]});
            //particles load end
          }

          //proc WORLD ENTITIES {violet bold indent_4}
          for (var z=0,zEnd=worldData.entities.length;z<zEnd;z++){
            worldData.entities[z].id=z;
            worldData.entities[z].x=parseFloat(worldData.entities[z].x);
            worldData.entities[z].y=parseFloat(worldData.entities[z].y);
            worldData.entities[z].z=parseFloat(worldData.entities[z].z);
            //handle undef neeeded props
            if (typeof worldData.entities[z].isLivingBeing==='undefined')
              worldData.entities[z].isLivingBeing=0;
            if (typeof worldData.entities[z].color1==='undefined')
              worldData.entities[z].color1=[1.0,1.0,1.0];
            worldData.entities[z].oColor1=worldData.entities[z].color1; //original color1
            if (typeof worldData.entities[z].speed==='undefined'){
              worldData.entities[z].speed=0;
            }

            worldData.entities[z].oTextureId=worldData.entities[z].textureId; // save the original texture without animations, we need it to save the scene
            worldData.entities[z].oY=worldData.entities[z].y; // save the original Y
            // init of the entities read from file
            SEBASTIAN.WEBGL.WORLD.ENTITIES.define(z);
            //SEBASTIAN.WEBGL.WORLD.dynamicVertexTextureCoordBuffers[z]=worldVertexTextureCoordBuffer;
          }

          // after the define cycle we have the actual number of existing entities
          //console.log(worldData.entities.length);

          //init buffers
          _seba.WEBGL.GLOBALS.buffers.entitiesVertexPositions={};

          // create buffers for Z sorting
          // the vertex coordinate buffer exists in two forms:
          // not ordered and ordered in z
          // for the representation of the entities we use the z-sorted buffer
          _seba.WEBGL.GLOBALS.buffers.entitiesTextureCoordsZ={
            buffer:gl.createBuffer(),
            data:new Float32Array(worldData.entities.length * 6 * 2)
          };
          //--
          _seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ={ // identical to entitiesVertexPositions but sorted into z, we keep the unordered buffer to access the original coordinates of the entities
            buffer:gl.createBuffer(),
            data:new Float32Array(worldData.entities.length * 6 * 3),
            count:6*worldData.entities.length
          };
          //--
          _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ={
            buffer:gl.createBuffer(),
            data:new Float32Array(worldData.entities.length * 6 * 3)
          };
          //--
          _seba.WEBGL.GLOBALS.buffers.entitiesSpriteColorsZ={
            buffer:gl.createBuffer(),
            data:new Float32Array(worldData.entities.length * 6 * 4)
          };
          //--
          _seba.WEBGL.GLOBALS.buffers.entitiesPropertiesZ={
            buffer:gl.createBuffer(),
            data:new Float32Array(worldData.entities.length * 6 * _seba.WEBGL.WORLD.ENTITIES.GLOBALS.totalProperties) //3 proprietà per ogni entity
          }

          //
          var bEntitiesVertexPositions=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositions;
          bEntitiesVertexPositions.data=new Float32Array(worldData.entities.length * 6 * 3);

          //fill entities buffer data
          var bEntitiesVertexPositionsIdx=0;
          for (var z=0,zEnd=worldData.entities.length;z<zEnd;z++){
            var currentEntity=worldData.entities[z];

            var currentTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.oTextureId];
            if (typeof currentTexture==='undefined'){
              currentTexture=_seba.WEBGL.GLOBALS.textures['pavement_01'];
              console.log(currentEntity.oTextureId,'->','pavement_01');
            }

            if (currentEntity.isStanding===1){
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+0]=0.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+1]=1.0*currentEntity.scale*currentTexture.scaleY;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+2]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+3]=0.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+4]=0.0*currentEntity.scale*currentTexture.scaleY;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+5]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+6]=1.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+7]=0.0*currentEntity.scale*currentTexture.scaleY;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+8]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+9] =0.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+10]=1.0*currentEntity.scale*currentTexture.scaleY;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+11]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+12]=1.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+13]=1.0*currentEntity.scale*currentTexture.scaleY;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+14]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+15]=1.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+16]=0.0*currentEntity.scale*currentTexture.scaleY;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+17]=0.0;

              //if (currentEntity.oTextureId.indexOf('grass')!==-1){
              //  console.log(currentEntity.oTextureId,currentEntity.scale,currentTexture.scaleX);
              //}

            }else{ //entities such as water

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+0]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+1]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+2]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+3]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+4]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+5]=1.0*currentEntity.scale*currentTexture.scaleY;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+6]=1.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+7]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+8]=1.0*currentEntity.scale*currentTexture.scaleY;;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+9] =0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+10]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+11]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+12]=1.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+13]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+14]=0.0;

              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+15]=1.0*currentEntity.scale*currentTexture.scaleX;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+16]=0.0;
              bEntitiesVertexPositions.data[bEntitiesVertexPositionsIdx+17]=1.0*currentEntity.scale*currentTexture.scaleY;
            }

            bEntitiesVertexPositionsIdx+=18;

          }

          //Once the buffers are created, sort them by the z by position
          //of the entities
          SEBASTIAN.WEBGL.WORLD.ENTITIES.sortZBuffersByEntityPosition();

          //proc WORLD TILES {violet bold indent_4}

          //proc PARSE WORLD FILE > STATIC VERTEX DATA {yellow indent_4}
          //---------
          //STATIC WORLD DATA
          //vertices that can not move
          //--

          var wordlTileColumns=SEBASTIAN.WEBGL.WORLD.GLOBALS.columns;
          var wordlTileTotalTiles=wordlTileColumns*SEBASTIAN.WEBGL.WORLD.GLOBALS.rows;
          var offsetX=0;
          var offsetZ=0;
          var tileScale=1;
          var currentTexture; //pointer to the texture applied to the tile

          //2018-03-22 13:13:51 add dynamic colors to world tiles
          var tileDefaultPoolColor='C1'; //proc default tile color {violet indent_5}
          //--

          var h_key=SEBASTIAN.GLOBALS.hours;//=tDate.getUTCHours();
          var m_key=SEBASTIAN.GLOBALS.minutes;//=tDate.getUTCMinutes();
          var colorKey=h_key+'_'+m_key;
          var colorsPoolIdx='p'+tileDefaultPoolColor;
          var chosenTileColor=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey][colorsPoolIdx];

          var counter=0;
          var initOffsetX=offsetX;
          if (typeof worldData.world==='undefined')
            worldData.world=[];

          //init buffers
          _seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords={};
          _seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions={};
          _seba.WEBGL.GLOBALS.buffers.worldTileTranslations={};
          _seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors={};
          _seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties={};
          var bWorldTileTextureCoords=_seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords;
          var bWorldTileVertexPositions=_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions;
          var bWorldTileTranslations=_seba.WEBGL.GLOBALS.buffers.worldTileTranslations;
          var bWorldTileSpriteColors=_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors;
          var bWorldTileEntityProperties=_seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties;
          //--
          var bWorldTileTextureCoordsIdx=0;
          var bWorldTileVertexPositionsIdx=0;
          var bWorldTileTranslationsIdx=0;
          var bWorldTileSpriteColorsIdx=0;
          var bWorldTileEntityPropertiesIdx=0;

          // for textures we need two coordinates for each vertex of the two triangles
          // the two triangles make 6 vertices in total
          bWorldTileTextureCoords.data=new Float32Array(wordlTileTotalTiles * 6 * 2);
          //for the buffer of the vertices we need 3 coordinates for each vertex of the two triangles
          //then 3 coordinates (x, y, z) for each of the 6 vertices = 6 * 3
          bWorldTileVertexPositions.data=new Float32Array(wordlTileTotalTiles * 6 * 3);
          bWorldTileTranslations.data=new Float32Array(wordlTileTotalTiles * 6 * 3);
          bWorldTileSpriteColors.data=new Float32Array(wordlTileTotalTiles * 6 * 4); //2018-05-03 16:48:33 added alpha r,g,b,a
          bWorldTileEntityProperties.data=new Float32Array(wordlTileTotalTiles * 6 * _seba.WEBGL.WORLD.ENTITIES.GLOBALS.totalProperties);

          if (SEBASTIAN.GLOBALS.loadSavedScene){
            //load the scene.json file

            for (var z=0,zEnd=worldData.world.length;z<zEnd;z++){
              var currentWorldTile=worldData.world[z];
              //handle undef neeeded props
              if (typeof currentWorldTile.color1==='undefined')
                currentWorldTile.color1=[1.0,1.0,1.0];
              currentWorldTile.oColor1=currentWorldTile.color1; //original color
              currentWorldTile.oTextureId=currentWorldTile.textureId; //original texture so we are able able to change it during selection and saving
            }

            //set camera from scene
            if (typeof worldData.camera!=='undefined'){
              SEBASTIAN.WEBGL.WORLD.GLOBALS.yPos=worldData.camera.yPos;
              SEBASTIAN.WEBGL.WORLD.GLOBALS.xPos=worldData.camera.xPos;
              SEBASTIAN.WEBGL.WORLD.GLOBALS.zPos=worldData.camera.zPos;
              SEBASTIAN.WEBGL.WORLD.GLOBALS.pitch=worldData.camera.pitch;
              SEBASTIAN.WEBGL.WORLD.GLOBALS.yaw=worldData.camera.yaw;
            }

            //set random camera
            if (
                 typeof SEBASTIAN.GLOBALS.chooseRandomCameraKeyPoint!=='undefined' &&
                 SEBASTIAN.GLOBALS.chooseRandomCameraKeyPoint
            ){
              var cameraKeyPointsLen=SEBASTIAN.GLOBALS.cameraKeyPoints.length;
              var randomCameraKeyPoint=SEBASTIAN.GLOBALS.cameraKeyPoints[Math.floor(Math.random()*cameraKeyPointsLen)]; //https://stackoverflow.com/questions/4550505/getting-a-random-value-from-a-javascript-array
              SEBASTIAN.WEBGL.WORLD.setCameraTo(randomCameraKeyPoint);
            }else{
              SEBASTIAN.WEBGL.WORLD.setCameraTo(SEBASTIAN.GLOBALS.cameraKeyPoints[0]);
            }

            //set random weather
            if (typeof _seba.GLOBALS.chooseRandomWeather!=='undefined' && _seba.GLOBALS.chooseRandomWeather){
              var chanceOfRain=_seba.GLOBALS.chanceOfRain;
              var dice=Math.random();
              //console.log('the dice',dice);
              if (dice<=chanceOfRain){
                _seba.WEBGL.WORLD.GLOBALS.rainDelta=Math.random()+0.3;
                if (_seba.WEBGL.WORLD.GLOBALS.rainDelta>1)
                  _seba.WEBGL.WORLD.GLOBALS.rainDelta=1;
                var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
                var shaderProgram=_seba.WEBGL.GLOBALS.shaderProgram;
                var shaderProgramP=_seba.WEBGL.GLOBALS.shaderProgramP;
                gl.useProgram(shaderProgram);
                gl.uniform1f(shaderProgram.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
                gl.useProgram(shaderProgramP);
                gl.uniform1f(shaderProgramP.data.uRainDelta.location,_seba.WEBGL.WORLD.GLOBALS.rainDelta); //set ambient light color
                _seba.UTILS.backgroundGradientFadeToGray();
              }

            }

            //restore vertices position into the typed Array
            bWorldTileVertexPositions.data.set(worldData.worldTilesVertices);
          }

          for (var z=0;z<wordlTileTotalTiles;z++){

            //set default tile data
            if (typeof worldData.world[z]==='undefined')
              worldData.world[z]={};

            var currentWorldTile=worldData.world[z];

            currentWorldTile.id=z;

            if (!SEBASTIAN.GLOBALS.loadSavedScene){

              currentWorldTile.color1=[1.0,1.0,1.0];
              currentWorldTile.opacity=1.0;
              currentWorldTile.oColor1=worldData.world[z].color1;
              currentWorldTile.textureId='pavement_01';
              currentWorldTile.oTextureId=worldData.world[z].textureId; //saved so we can 'select' a tile by switching textures
              currentWorldTile.colorsPoolIdx=colorsPoolIdx; //set colorPool index
              currentTexture=_seba.WEBGL.GLOBALS.textures[currentWorldTile.textureId];

              //vertices         texture coordinates
              // 0.0  0.0  0.0   0.0  1.0   //a  0, 1, 2
              // 0.0  0.0  1.0   0.0  0.0   //b  3, 4, 5
              // 1.0  0.0  1.0   1.0  0.0   //c  6, 7, 8
              //
              // 0.0  0.0  0.0   0.0  1.0   //d  9,10,11
              // 1.0  0.0  0.0   1.0  1.0   //e 12,13,14
              // 1.0  0.0  1.0   1.0  0.0   //f 15,16,17

              //vertexPositions
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+0]=0.0*tileScale*currentTexture.scaleX+offsetX;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+1]=0.0;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+2]=0.0*tileScale*currentTexture.scaleY+offsetZ;

              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+3]=0.0*tileScale*currentTexture.scaleX+offsetX;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+4]=0.0;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+5]=1.0*tileScale*currentTexture.scaleY+offsetZ;

              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+6]=1.0*tileScale*currentTexture.scaleX+offsetX;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+7]=0.0;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+8]=1.0*tileScale*currentTexture.scaleY+offsetZ;

              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+9]=0.0*tileScale*currentTexture.scaleX+offsetX;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+10]=0.0;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+11]=0.0*tileScale*currentTexture.scaleY+offsetZ;

              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+12]=1.0*tileScale*currentTexture.scaleX+offsetX;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+13]=0.0;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+14]=0.0*tileScale*currentTexture.scaleY+offsetZ;

              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+15]=1.0*tileScale*currentTexture.scaleX+offsetX;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+16]=0.0;
              bWorldTileVertexPositions.data[bWorldTileVertexPositionsIdx+17]=1.0*tileScale*currentTexture.scaleY+offsetZ;
              bWorldTileVertexPositionsIdx+=18;
            }else{
              //if we do not load a scene, we just need to set the current texture
              currentTexture=_seba.WEBGL.GLOBALS.textures[currentWorldTile.textureId];
            }
            if (typeof currentWorldTile.textureId==='undefined'){
              currentWorldTile.textureId='pavement_01';
              currentTexture=_seba.WEBGL.GLOBALS.textures[currentWorldTile.textureId];
            }

            //copy the coordinates of the selected texture into
            //the current world tile slot in the texture coordinate buffer
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 0]=currentTexture.textureCoordinates[0];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 1]=currentTexture.textureCoordinates[1];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 2]=currentTexture.textureCoordinates[2];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 3]=currentTexture.textureCoordinates[3];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 4]=currentTexture.textureCoordinates[4];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 5]=currentTexture.textureCoordinates[5];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 6]=currentTexture.textureCoordinates[6];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 7]=currentTexture.textureCoordinates[7];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 8]=currentTexture.textureCoordinates[8];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+ 9]=currentTexture.textureCoordinates[9];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+10]=currentTexture.textureCoordinates[10];
            bWorldTileTextureCoords.data[bWorldTileTextureCoordsIdx+11]=currentTexture.textureCoordinates[11];
            bWorldTileTextureCoordsIdx+=12;

            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 0]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 1]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 2]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 3]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 4]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 5]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 6]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 7]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 8]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 9]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 10]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 11]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 12]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 13]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 14]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 15]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 16]=0.0;
            bWorldTileTranslations.data[bWorldTileTranslationsIdx+ 17]=0.0;
            bWorldTileTranslationsIdx+=18;

            //colors

            //we do not need to specify an initial color because
            //the first draw will automatically determine the color of the tiles based
            //on their colorDynamic property
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+0 ]=1.0;//r
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+1 ]=1.0;//g
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+2 ]=1.0;//b
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+3 ]=currentWorldTile.opacity;//a

            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+4 ]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+5 ]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+6 ]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+7 ]=currentWorldTile.opacity;

            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+8 ]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+9 ]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+10 ]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+11 ]=currentWorldTile.opacity;

            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+12]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+13]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+14]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+15]=currentWorldTile.opacity;

            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+16]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+17]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+18]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+19]=currentWorldTile.opacity;

            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+20]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+21]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+22]=1.0;
            bWorldTileSpriteColors.data[bWorldTileSpriteColorsIdx+23]=currentWorldTile.opacity;
            bWorldTileSpriteColorsIdx+=24;

            //proc TILES.PROPERTIES.FLAGS {violet bold indent_4}
            bWorldTileEntityProperties.data[  bWorldTileEntityPropertiesIdx]=currentTexture.oX;  //texture coord x
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.layerId; //sprite layer id
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4]; //texture coord x1
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=0.0; //is light emitter, apply shadow attenuation, is x flipped
            //--
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.oX;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.layerId;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=0.0;
            //--
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.oX;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.layerId;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=0.0;
            //--
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.oX;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.layerId;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=0.0;
            //--
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.oX;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.layerId;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=0.0;
            //--
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.oX;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.layerId;
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=currentTexture.textureCoordinates[4];
            bWorldTileEntityProperties.data[++bWorldTileEntityPropertiesIdx]=0.0;
            bWorldTileEntityPropertiesIdx++;

            counter++;
            offsetX+=tileScale*1;
            if (counter%wordlTileColumns===0){
              offsetX=initOffsetX;
              offsetZ+=tileScale;
            }

          }

          //create the buffers for the worldtiles

          _seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords.buffer=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords.buffer);
          gl.bufferData(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTextureCoords.data,gl.DYNAMIC_DRAW);

          _seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.buffer=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.buffer);
          gl.bufferData(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.data,gl.DYNAMIC_DRAW);
          _seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.count=wordlTileTotalTiles*6;
          //console.log(_seba.WEBGL.GLOBALS.buffers.worldTileVertexPositions.data,wordlTileTotalTiles);

          _seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.buffer=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.buffer);
          gl.bufferData(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileSpriteColors.data,gl.DYNAMIC_DRAW);

          _seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties.buffer=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties.buffer);
          gl.bufferData(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileEntityProperties.data,gl.DYNAMIC_DRAW);

          //the position of the world tiles never change
          //so set the buffer data just once
          _seba.WEBGL.GLOBALS.buffers.worldTileTranslations.buffer=gl.createBuffer();
          gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTranslations.buffer);
          gl.bufferData(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.worldTileTranslations.data,gl.STATIC_DRAW); //2018-02-22 08:58:06 opz. avevo messo worldTileVertexPositions al posto di worldTileTranslations e tutti i tile venivano ovviamente cannati....

          callback();
        },

        PARTICLES:{ //proc PARTICLES {orange indent_3} WEBGL.WORLD.PARTICLES
          updateCurrentSelectedGroup:function(cfg){ //proc updateCurrentSelectedGroup {orange indent_4}
            var config={};
            var xx=0;
            var yy=0;
            var zz=0;
            var translate=0;
            var bSelectSingle=0;
            var _seba=SEBASTIAN;
            var resetOnly=0;

            if (!_seba.GLOBALS.isEditorEnabled)
              return;

            if (_seba.GLOBALS.particleSelEnableSingle)
              bSelectSingle=1;
            var selectSingle=_seba.GLOBALS.currentSelectedParticleIdx;

            if (typeof cfg.resetOnly!=='undefined')
              resetOnly=cfg.resetOnly;

            if (typeof cfg.x!=='undefined'){
              xx=cfg.x;
              translate=1;
            }
            if (typeof cfg.y!=='undefined')
              yy=cfg.y;
            if (typeof cfg.z!=='undefined')
              zz=cfg.z;

            var R,G,B;
            var modColor=0;
            if (typeof cfg.r!=='undefined'){
              R=cfg.r;
              modColor=1;
            }
            if (typeof cfg.g!=='undefined')
              G=cfg.g
            if (typeof cfg.b!=='undefined')
              B=cfg.b;

            var pIdx=_seba.GLOBALS.currentSelectedParticlesIdx;
            var shaderProgramP=_seba.WEBGL.GLOBALS.shaderProgramP;
            //var strideElements=18;
            var elementsDataLength=shaderProgramP.data.userParticles.interleavedStruct.elementsDataLength

            //console.log('st',stride);

            if (typeof _seba.GLOBALS.currentSelectedParticles[pIdx]!=='undefined'){

              var pGroup=_seba.GLOBALS.currentSelectedParticles[pIdx];
              var verticesbuffer=shaderProgramP.data.userParticles.verticesbuffer;
              //console.log(shaderProgramP.data.userParticles.stride);

              //reset color
              var rr=0.9;
              var gg=0.9;
              var bb=0.9;

              for (var w=0,wEnd=_seba.GLOBALS.currentSelectedParticles.length;w<wEnd;w++){
                var cpGroup=_seba.GLOBALS.currentSelectedParticles[w];
                for (var z=0,zEnd=cpGroup.length;z<zEnd;z++){
                  var currentRelIndex=cpGroup[z];

                  //console.log(currentRelIndex+elementsDataLength*0+15);

                  verticesbuffer[currentRelIndex+elementsDataLength*0+15]=rr;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+15]=rr;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+15]=rr;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+15]=rr;
                  //--
                  verticesbuffer[currentRelIndex+elementsDataLength*0+16]=gg;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+16]=gg;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+16]=gg;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+16]=gg;
                  //--
                  verticesbuffer[currentRelIndex+elementsDataLength*0+17]=bb;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+17]=bb;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+17]=bb;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+17]=bb;

                  verticesbuffer[currentRelIndex+elementsDataLength*0+18]=0;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+18]=0;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+18]=0;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+18]=0;

                }
              }

              //prendiamo le coordinate di traslazioni attuali
              //currentSelectedParticlesGX

              if (resetOnly)
                return;

              //var shaderProgramP=_seba.WEBGL.GLOBALS.shaderProgramP;
              //console.log(verticesbuffer);
              for (var z=0,zEnd=pGroup.length;z<zEnd;z++){
                var currentRelIndex=pGroup[z];

                if (z===0){
                  _seba.GLOBALS.currentSelectedParticlesGX=verticesbuffer[currentRelIndex+elementsDataLength*0+11];
                  _seba.GLOBALS.currentSelectedParticlesGY=verticesbuffer[currentRelIndex+elementsDataLength*0+12];
                }

                if (bSelectSingle){
                  if (z!==selectSingle)
                    continue;
                }

                if (translate){
                  //x
                  verticesbuffer[currentRelIndex+elementsDataLength*0+11]+=xx;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+11]+=xx;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+11]+=xx;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+11]+=xx;

                  //y
                  verticesbuffer[currentRelIndex+elementsDataLength*0+12]+=yy;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+12]+=yy;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+12]+=yy;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+12]+=yy;

                  //z
                  verticesbuffer[currentRelIndex+elementsDataLength*0+13]+=zz;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+13]+=zz;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+13]+=zz;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+13]+=zz;
                }

                if (modColor){

                  verticesbuffer[currentRelIndex+elementsDataLength*0+15]=R;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+15]=R;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+15]=R;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+15]=R;
                  //--
                  verticesbuffer[currentRelIndex+elementsDataLength*0+16]=G;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+16]=G;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+16]=G;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+16]=G;
                  //--
                  verticesbuffer[currentRelIndex+elementsDataLength*0+17]=B;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+17]=B;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+17]=B;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+17]=B;
                  //--
                  verticesbuffer[currentRelIndex+elementsDataLength*0+18]=2;
                  verticesbuffer[currentRelIndex+elementsDataLength*1+18]=2;
                  verticesbuffer[currentRelIndex+elementsDataLength*2+18]=2;
                  verticesbuffer[currentRelIndex+elementsDataLength*3+18]=2;

                }

              }
              _seba.GLOBALS.isParticlesBufferDataDirty=1; //force particles buffer data mapping
              shaderProgramP.data.userParticles.interleavedStruct.data=null;
              shaderProgramP.data.userParticles.interleavedStruct.data=new Float32Array(verticesbuffer);
            }
          }
        },

        ENTITIES:{ //proc ENTITIES {orange indent_3}
          GLOBALS:{ //proc WEBGL.WORLD.ENTITIES.GLOBALS {orange indent_4}
            depthSorted:[], //array with list of entity ids sorted by camera to be drawn with the painter's algorithm
            //NOTE: it is not possible to have a vertextattibute with dim greather than 4 {indent_4}
            //      ref: http://docs.gl/gl3/glVertexAttribPointer -> errors

            totalProperties:4,
          },
          init:function(){ //proc init {green indent_4}
            var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
            //define a polygon -> vertical 1x1 square at offset 0,0
            var vertexPositions=[
               0.0,  1.0,  0.0 ,
               0.0,  0.0,  0.0 ,
               1.0,  0.0,  0.0 ,

               0.0,  1.0,  0.0 ,
               1.0,  1.0,  0.0 ,
               1.0,  0.0,  0.0
            ];
            var vertexTextureCoords=[
               0.0, 1.0,
               0.0, 0.0,
               1.0, 0.0,

               0.0, 1.0,
               1.0, 1.0,
               1.0, 0.0
            ];
            //all entities share the same texture geometry
            SEBASTIAN.WEBGL.WORLD.ENTITIES.GLOBALS.vertexPositions=vertexPositions;
            SEBASTIAN.WEBGL.WORLD.ENTITIES.GLOBALS.vertexTextureCoords=vertexTextureCoords;
            var aVertexTextureCoords=new Float32Array(vertexTextureCoords);
            SEBASTIAN.WEBGL.WORLD.ENTITIES.GLOBALS.aVertexTextureCoords=aVertexTextureCoords;
          },

          add:function(cfg){ //proc add {green indent_4}
            cfg=cfg?cfg:{};

            var config={
              isBot:cfg.isBot || 0,
              x:cfg.x || 0,
              y:cfg.y || 0,
              z:cfg.z || 0,
              rx:cfg.rx || 0,
              ry:cfg.ry || 0,
              rz:cfg.rz || 0,
              scale:cfg.scale,
              color1:cfg.color1 || [1.0,1.0,1.0],
              colorDynamic:cfg.colorDynamic || '', //2018-03-22 12:11:51 allows to color the entity with a color that varies depending on the time
              speed:cfg.speed || 0,
              textureId:cfg.textureId || 'sel_02',
              opacity:cfg.opacity || 1,
              isLivingBeing:cfg.isLivingBeing || 0,
              isLightEmitter:cfg.isLightEmitter || 0,
              hasShadowMitigation:cfg.hasShadowMitigation || 0,
              attachToCurrentTile:cfg.attachToCurrentTile || 0,
              isFlippedX:cfg.isFlippedX || 0,
            };
            var _seba=SEBASTIAN;
            var worldData=_seba.GLOBALS.worldData;
            var newEntityId=worldData.entities.length;

            worldData.entities.push(config);
            worldData.entities[newEntityId].id=newEntityId;

            return newEntityId;
          },
          bootBot:function(idx,cloneIdx){ //proc bootBot {green indent_4}
            var worldData=SEBASTIAN.GLOBALS.worldData;
            var currentEntity=worldData.entities[idx];
            var resetSingleEntity=false;
            if (typeof cloneIdx!=='undefined')
              resetSingleEntity=true;

            if (typeof currentEntity.isCluster!=='undefined' && currentEntity.isCluster || resetSingleEntity){
              if (typeof currentEntity.cloneOf!=='undefined')
                currentEntity=worldData.entities[currentEntity.cloneOf]; // take the parent entity of the current clone
              var nClones=currentEntity.clusterInfo.clones;
              var ooX=currentEntity.clusterInfo.xRange[0];
              var ooY=currentEntity.clusterInfo.yRange[0];
              var ooZ=currentEntity.clusterInfo.zRange[0];
              var yStep=currentEntity.clusterInfo.yStep;
              var stepX=(currentEntity.clusterInfo.xRange[1]-currentEntity.clusterInfo.xRange[0])/nClones;
              var stepY=(currentEntity.clusterInfo.yRange[1]-currentEntity.clusterInfo.yRange[0])/nClones;
              var stepZ=(currentEntity.clusterInfo.zRange[1]-currentEntity.clusterInfo.zRange[0])/nClones;
              var xLimit=currentEntity.clusterInfo.xRange[1];
              var minSpeed=currentEntity.clusterInfo.speedRange[0];
              var maxSpeed=currentEntity.clusterInfo.speedRange[1];
              var minY=currentEntity.clusterInfo.yRange[0];
              var maxY=currentEntity.clusterInfo.yRange[1];
              var minZ=currentEntity.clusterInfo.zRange[0];
              var maxZ=currentEntity.clusterInfo.zRange[1];
              var minOpacity=currentEntity.clusterInfo.opacityRange[0];
              var maxOpacity=currentEntity.clusterInfo.opacityRange[1];
              var minScale=currentEntity.clusterInfo.scaleRange[0];
              var maxScale=currentEntity.clusterInfo.scaleRange[1];
              var behaviorId=currentEntity.clusterInfo.behaviorId;
              var clusterScatter=currentEntity.clusterInfo.scatter;
              var colors=currentEntity.clusterInfo.colors;
              var colorDynamic=currentEntity.colorDynamic;
              var isStanding=currentEntity.isStanding;

              var colorsPool=currentEntity.clusterInfo.colorsPool;
              var isLightEmitter=currentEntity.isLightEmitter;
              var isFlippedX=currentEntity.isFlippedX;
              var hasShadowMitigation=currentEntity.hasShadowMitigation;

              if (typeof clusterScatter==='undefined')
                clusterScatter=1;
              if (resetSingleEntity)
                nClones=1;
              for (var z=0,zEnd=nClones;z<zEnd;z++){
                //var textureId=currentEntity.clusterInfo.textures[Math.floor(Math.random()*currentEntity.clusterInfo.textures.length)];
                var textureId=currentEntity.clusterInfo.textures[Math.floor(Math.random()*currentEntity.clusterInfo.textures.length)];
                var speed=(Math.random() * (maxSpeed-minSpeed)) + minSpeed;
                var opacity=(Math.random() * (maxOpacity-minOpacity)) + minOpacity;
                var scale=(Math.random() * (maxScale-minScale)) + minScale;
                //console.log(speed);
                ooZ=(Math.random() * (maxZ-minZ)) + minZ;
                ooY=(Math.random() * (maxY-minY)) + minY;
                if (typeof yStep!=='undefined'){ //per il tronco dell'albero
                  if (typeof currentEntity.currentAutoY==='undefined')
                    currentEntity.currentAutoY=currentEntity.clusterInfo.yRange[0];
                  ooY=currentEntity.currentAutoY;
                  currentEntity.currentAutoY+=yStep;
                }
                var newEntityId;
                if (!resetSingleEntity){
                  newEntityId=SEBASTIAN.WEBGL.WORLD.ENTITIES.add({});
                  SEBASTIAN.GLOBALS.worldData.entities[newEntityId].cloneOf=idx;
                }else{
                  newEntityId=idx;
                }
                var theEntity=SEBASTIAN.GLOBALS.worldData.entities[newEntityId];

                theEntity.behaviorId=behaviorId;
                theEntity.isBot=1;
                theEntity.x=ooX;
                theEntity.y=ooY;
                theEntity.z=ooZ;
                theEntity.textureId=textureId;
                theEntity.oTextureId=theEntity.textureId;
                theEntity.oY=theEntity.y;
                theEntity.speed=speed;
                theEntity.opacity=opacity;
                theEntity.scale=scale;
                theEntity.isIdle=0;
                theEntity.isLightEmitter=isLightEmitter;
                theEntity.hasShadowMitigation=hasShadowMitigation;
                theEntity.isFlippedX=isFlippedX;
                if (theEntity.speed!==0)
                  theEntity.xLimit=xLimit;
                if (typeof colors!=='undefined'){
                  var chosenColor=currentEntity.clusterInfo.colors[Math.floor(Math.random()*currentEntity.clusterInfo.colors.length)];
                  theEntity.color1=[chosenColor[0]/255,chosenColor[1]/255,chosenColor[2]/255,];
                }
                if (typeof colorDynamic!=='undefined'){ // 2018-03-22 15:05:03 dynamic color applied to an entire group of clones clusters

                  var h_key=SEBASTIAN.GLOBALS.hours;
                  var m_key=SEBASTIAN.GLOBALS.minutes;
                  var colorKey=h_key+'_'+m_key;
                  var colorsPoolIdx='p'+colorDynamic;
                  var chosenColor=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey][colorsPoolIdx];
                  theEntity.hasPoolColor=1;
                  theEntity.colorsPoolIdx=colorsPoolIdx;
                  theEntity.color1=chosenColor;
                }
                if (typeof colorsPool!=='undefined'){ // 2018-03-21 01:21:41 select a random color from the corresponding pool

                  var h_key=SEBASTIAN.GLOBALS.hours;
                  var m_key=SEBASTIAN.GLOBALS.minutes;
                  var colorKey=h_key+'_'+m_key;
                  //get a random value from the color pool
                  var max=5;
                  var min=1;
                  var rnd=Math.floor(Math.random() * (max - min + 1)) + min; //ref: https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
                  //console.log('p'+colorsPool+rnd);
                  var colorsPoolIdx='p'+colorsPool+rnd;
                  var chosenColor=SEBASTIAN.GLOBALS.lightColorTimeMap[colorKey][colorsPoolIdx];
                  theEntity.hasPoolColor=1;
                  theEntity.colorsPoolIdx=colorsPoolIdx;
                  theEntity.color1=chosenColor;
                  //console.log(theEntity.color1);
                }
                theEntity.oColor1=theEntity.color1;
                //define geometry and stuff
                SEBASTIAN.WEBGL.WORLD.ENTITIES.define(newEntityId);
                if (clusterScatter){ // if 1 spread the clones around (eg clouds)
                  ooX+=stepX;
                  ooY+=stepY;
                }
              }
            }
          },
          setLivingCreatureBehaviors:function(currentEntity){  //proc setLivingBehaviors {green indent_4}

            var _seba=SEBASTIAN;
            var h_key=_seba.GLOBALS.hours;
            var m_key=_seba.GLOBALS.minutes;
            var timeIdx=h_key*60+m_key;

            var bedtime_hours=20;
            var bedtime_minutes=30;
            var waketime_hours=7;
            var waketime_minutes=30;

            //2018-04-30 19:33:25
            // add calculation taking into account daylight saving time and offset
            var ddd=new Date();
            var offsetHours=ddd.getTimezoneOffset()/60;
            bedtime_hours-=-offsetHours;
            waketime_hours-=-offsetHours;
            //console.log('bed',bedtime_hours,'wake',waketime_hours);

            var bedtime_idx =bedtime_hours*60+bedtime_minutes;
            var waketime_idx=waketime_hours*60+waketime_minutes;
            //set a random bedtime/waketime interval
            var max=20;
            var min=0;
            var rnd=Math.floor(Math.random()*(max-min+1))+min;//https://stackoverflow.com/questions/1527803/generating-random-whole-numbers-in-javascript-in-a-specific-range
            currentEntity.bedtime=bedtime_idx+rnd;
            var rnd=Math.floor(Math.random()*(max-min+1))+min;
            currentEntity.waketime=waketime_idx+rnd;
            //console.log('bedtime',currentEntity.bedtime,'waketime',currentEntity.waketime);

            if (currentEntity.isAwake===1){ //do not allow to set wake alarms on the past
              if (timeIdx<currentEntity.waketime)
                currentEntity.waketime=timeIdx-1;
            }

          },
          define:function(idx){ //proc define {green indent_4}
            var _seba=SEBASTIAN;
            var worldData=_seba.GLOBALS.worldData;
            var currentEntity=worldData.entities[idx];

            if (typeof currentEntity.isCluster!=='undefined' && currentEntity.isCluster){
              _seba.WEBGL.WORLD.ENTITIES.bootBot(idx);
              // The cluster is an invisible 'master' that is cloned
              currentEntity.isHidden=1;
              currentEntity.x=-5000; //'hide' geometry
            }else{
              // if the entity is not of type cluster,
              // create the lookup of entities by name
              //console.log(currentEntity.name);
              if (typeof currentEntity.name!=='undefined'){
                if (typeof currentEntity.isBot==='undefined' || !currentEntity.isBot){
                  if (typeof worldData.entitiesNamePointer==='undefined')
                    worldData.entitiesNamePointer={};
                  worldData.entitiesNamePointer[currentEntity.name]=worldData.entities[idx];
                  //console.log(currentEntity.name,SEBASTIAN.GLOBALS.worldData.entitiesNamePointer);
                }
              }
            }

            if (typeof currentEntity.isStanding==='undefined')
              currentEntity.isStanding=1;

            if (typeof currentEntity.isLightEmitter==='undefined')
              currentEntity.isLightEmitter=0;
            if (typeof currentEntity.hasShadowMitigation==='undefined')
              currentEntity.hasShadowMitigation=0;
            if (typeof currentEntity.isFlippedX==='undefined')
              currentEntity.isFlippedX=0;

            if (currentEntity.isLivingBeing){
              _seba.WEBGL.WORLD.ENTITIES.setLivingCreatureBehaviors(currentEntity);
            }

            if (typeof currentEntity.colorDynamic!=='undefined' && currentEntity.colorDynamic!==''){ //dDMKCWhHp4
              //var tDate=new Date();
              //var h_key=tDate.getHours();
              //var m_key=tDate.getMinutes();
              var h_key=_seba.GLOBALS.hours;
              var m_key=_seba.GLOBALS.minutes;
              var colorKey=h_key+'_'+m_key;
              var colorsPoolIdx='p'+currentEntity.colorDynamic;
              //var chosenColor=_seba.GLOBALS.lightColorTimeMap[colorKey][colorsPoolIdx];
              currentEntity.hasPoolColor=1;
              currentEntity.colorsPoolIdx=colorsPoolIdx;
            }

            var isFloatingOnWater=0;
            //proc geometry animation behavior INIT {yellow indent_5}
            switch (currentEntity.behaviorId){
              case 1: //proc taraxacum {bold indent_6} and other vegetation geometry deform (windflow-like)

                var minRand=0.022;
                var maxRand=0.028;
                var randValue=(Math.random() * (maxRand-minRand)) + minRand;
                breathDeformLimit=randValue;

                var minRand=0.09;
                var maxRand=0.14;
                var randValue=(Math.random() * (maxRand-minRand)) + minRand;
                breatheSlowness=randValue;

                //if (typeof currentEntity.breathDeformLimit!=='undefined')
                //  breathDeformLimit=currentEntity.breathDeformLimit;
                //if (typeof currentEntity.breatheSlowness!=='undefined')
                //  breatheSlowness=currentEntity.breatheSlowness;
                currentEntity.breathDeformLimit=breathDeformLimit;
                currentEntity.breatheSlowness=breatheSlowness;

              break;
              case 2: //breath geometry deform (organic-life-like)

                var breathDeformLimit=0.028;
                var breatheSlowness=0.12;
                if (typeof currentEntity.breathDeformLimit!=='undefined')
                  breathDeformLimit=currentEntity.breathDeformLimit;
                if (typeof currentEntity.breatheSlowness!=='undefined')
                  breatheSlowness=currentEntity.breatheSlowness;
                currentEntity.breathDeformLimit=breathDeformLimit;
                currentEntity.breatheSlowness=breatheSlowness;

                //console.log(currentEntity.name,currentEntity.breathDeformLimit,currentEntity.breatheSlowness);

                if (currentEntity.isFloatingOnWater===1)
                  isFloatingOnWater=1;
              break;
              case 3: //water geometry deform (windflow-like)

                var minDeformSpeed=0.00003;
                var maxDeformSpeed=0.00005;
                var deformSpeed=(Math.random() * (maxDeformSpeed-minDeformSpeed)) + minDeformSpeed;
                //var deformSpeed=0.0001;
                currentEntity.counterDeltaIncrement=deformSpeed;
              break;
              case 4: // objects that float in the water
                isFloatingOnWater=1;
              break;
            }

            if (isFloatingOnWater){
              //WIRED G9YjdnHuAK
              currentEntity.onWaterYMovementSlowness=0.3; //counterDeltaYIncrement
              currentEntity.onWaterYMovementDistance=0.05; //counterYTotalDistance
            }

            //SEBASTIAN.GLOBALS.worldData.entities[
            //console.log(idx,SEBASTIAN.GLOBALS.worldData.entities[idx].scale);
            SEBASTIAN.WEBGL.WORLD.ENTITIES.setGeometry(idx);
          },
          checkEntitiesDepthVisibilityMousePos(updateDepth,updateVisibility,applyMouseDetection){ //proc checkEntitiesDepthVisibilityMousePos {green indent_4}
            //cycle on all entities, check their visibility,calculate their depth
            //and update the zdepth array

            // if updateDepth is 1 updates the position z of all entities

            // we need it for
            // - reorder the zbuffer if necessary
            // - determine the entity under the mouse
            // - to determine if an entity is visible (if invisible we do not animate geometry)

            var _seba=SEBASTIAN;
            var vertexPositions=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.data;
            var worldData=_seba.GLOBALS.worldData;
            var depths=_seba.WEBGL.WORLD.ENTITIES.GLOBALS.depthSorted;
            var xPos                         =_seba.WEBGL.WORLD.GLOBALS.xPos;
            var yPos                         =_seba.WEBGL.WORLD.GLOBALS.yPos;
            var zPos                         =_seba.WEBGL.WORLD.GLOBALS.zPos;
            var pMatrix                      =_seba.WEBGL.WORLD.GLOBALS.pMatrix;
            var mvMatrix                     =_seba.WEBGL.WORLD.GLOBALS.mvMatrix;
            var gl                           =_seba.GLOBALS.webgl_ctx; //lookup var
            var mx=_seba.GLOBALS.mx;
            var my=_seba.GLOBALS.my;

            var skippedEntities=0;
            var foundEntityUnderMouse=0;

            var isMouseOverCurrentEntity=0;
            var isCurrentEntityVisible=1;
            var currentEntity=worldData.entities[_seba.GLOBALS.currentEntityId];
            var cx=currentEntity.x;
            var cy=currentEntity.y;
            var cz=currentEntity.z;
            //console.log(currentEntity.textureId);
            var currentTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.textureId];
            var aa=_seba.WEBGL.project(0,currentEntity.scale*currentTexture.scaleY,0,xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix,1,sid);
            var ff=_seba.WEBGL.project(currentEntity.scale*currentTexture.scaleX,0,0,xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix);
            if (ff[0]<-100 || aa[0]>gl.viewportWidth+100 || ff[1]<-100 || aa[1]>gl.viewportHeight+100)
              isCurrentEntityVisible=0;
            var ee=_seba.WEBGL.project(currentEntity.scale*currentTexture.scaleX,currentEntity.scale*currentTexture.scaleY,0,xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix);
            if (isCurrentEntityVisible){
              if (mx>=aa[0] && mx<ee[0]){
                if (my>=aa[1] && my<ff[1]){
                  isMouseOverCurrentEntity=1;
                }
              }
            }

            for (var z=0,zEnd=worldData.entities.length;z<zEnd;z++){
              var currentEntity=worldData.entities[z];
              var cx=currentEntity.x;
              var cy=currentEntity.y;
              var cz=currentEntity.z;

              var currentTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.textureId];

              if (updateVisibility){
                currentEntity.isVisible=1;

                var idx=z*6*3; //the entities have ids based on their creation
                if (vertexPositions[idx+2]+currentEntity.z>zPos){
                  currentEntity.isVisible=0;
                  skippedEntities++;
                }else{
                  var sid='';

                  var aa=_seba.WEBGL.project(0,currentEntity.scale*currentTexture.scaleY,0,xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix);
                  var ff=_seba.WEBGL.project(currentEntity.scale*currentTexture.scaleX,0,0,xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix);
                  if (ff[0]<-100 || aa[0]>gl.viewportWidth+100 || ff[1]<-100 || aa[1]>gl.viewportHeight+100)
                    currentEntity.isVisible=0;
                }

                if (
                  applyMouseDetection && _seba.GLOBALS.isMouseDirty && currentEntity.isVisible
                  //&& currentEntity.isLivingBeing //nuovo , non ci serve editing di oggetti 2018-05-15 00:14:37
                ){
                  //var ee=_seba.WEBGL.project(vertexPositions[idx+12]/currentEntity.scale*currentTexture.scaleX,vertexPositions[idx+13]/currentEntity.scale*currentTexture.scaleY,vertexPositions[idx+14],xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix);
                  var ee=_seba.WEBGL.project(currentEntity.scale*currentTexture.scaleX,currentEntity.scale*currentTexture.scaleY,0,xPos,yPos,zPos,cx,cy,cz,pMatrix,mvMatrix);

                  //if (currentEntity.name==='moai_1'){
                  //  console.log('x',aa[0],'y',aa[1]);
                  //}
                  if (mx>=aa[0] && mx<ee[0]){
                    if (my>=aa[1] && my<ff[1]){

                      //console.log('mao',_seba.GLOBALS.currentEntityId);
                      var testEntity=worldData.entities[_seba.GLOBALS.currentEntityId];
                      //console.log('test',testEntity.z,'vs',currentEntity.z,'ise mouse over',testEntity.z,'?',isMouseOverCurrentEntity);
                      if (!isMouseOverCurrentEntity || testEntity.z<currentEntity.z){
                        //console.log('under mouse',currentEntity.name);
                        foundEntityUnderMouse=1;
                        //currentEntity.color1=_seba.GLOBALS.entitySelectionColor;
                        //_seba.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity); // since we have changed a property we have to update the buffers
                        if (_seba.GLOBALS.currentEntityId!==z){
                          //selected entity is different -> reset particles group offset
                          _seba.GLOBALS.currentSelectedParticlesGX=0;
                          _seba.GLOBALS.currentSelectedParticlesGY=0;
                        }
                        _seba.GLOBALS.currentEntityId=z;
                      }
                      //_seba.GLOBALS.isMouseDirty=0;
                    }
                  }
                }
              }

              if (updateDepth){
                depths[currentEntity.id]={

                  //make a calculation to determine the z-index of the current Entity
                  //A bit Approximate but functional. Enough for our simplified 3d simulated world.
                  //for our simulation simplified 3d
                  //depth:_seba.WEBGL.getDepth(xPos,yPos,zPos,quat4,currentEntity.x,currentEntity.y,currentEntity.z)
                  // Performance trick
                  //if we consider that we will never make particular
                  //rotations for rendering, we just need to use z as a depth factor ...

                  depth:currentEntity.z,
                  entityId:currentEntity.id
                };
              }
            }

            if (updateDepth){
              depths.sort(function(a,b){ //sort by depth, painter's algorithm.
                return a.depth-b.depth;
              });
            }

            if (foundEntityUnderMouse){
              var currentEntity=worldData.entities[_seba.GLOBALS.currentEntityId];
              currentEntity.color1=_seba.GLOBALS.entitySelectionColor;
              _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity); // since we have changed a property we have to update the buffers
              _seba.GLOBALS.isMouseDirty=0;
            }

            if (applyMouseDetection)
              return [foundEntityUnderMouse,skippedEntities];
          },

          sortZBuffersByEntityPosition(){  //proc sortZBuffersByEntityPosition {green indent_4}
            //very similar to syncBuffersData but for all entities
            //after Z sorting
            var _seba=SEBASTIAN;
            var worldData=_seba.GLOBALS.worldData;
            var depths=_seba.WEBGL.WORLD.ENTITIES.GLOBALS.depthSorted;
            var gl                           =_seba.GLOBALS.webgl_ctx; //lookup var

            //we need only the z position of the entities -> exclude the rest
            _seba.WEBGL.WORLD.ENTITIES.checkEntitiesDepthVisibilityMousePos(1,0,0);

            //var dEntitiesTextureCoords=_seba.WEBGL.GLOBALS.buffers.entitiesTextureCoords.data;
            var dEntitiesVertexPositions=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositions.data;
            //var dEntitiesTranslations=_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data;
            //var dEntitiesSpriteColors=_seba.WEBGL.GLOBALS.buffers.entitiesSpriteColors.data;
            //var dEntitiesSpriteAlphas=_seba.WEBGL.GLOBALS.buffers.entitiesSpriteAlphas.data;
            //--
            var dEntitiesTextureCoordsZ=_seba.WEBGL.GLOBALS.buffers.entitiesTextureCoordsZ.data;
            var dEntitiesVertexPositionsZ=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.data;
            var dEntitiesTranslationsZ=_seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data;
            var dEntitiesSpriteColorsZ=_seba.WEBGL.GLOBALS.buffers.entitiesSpriteColorsZ.data;
            //var dEntitiesSpriteAlphasZ=_seba.WEBGL.GLOBALS.buffers.entitiesSpriteAlphasZ.data;
            //var dEntitiesTextureLayerIndexesZ=_seba.WEBGL.GLOBALS.buffers.entitiesTextureLayerIndexesZ.data;
            var dEntitiesPropertiesZ=_seba.WEBGL.GLOBALS.buffers.entitiesPropertiesZ.data;

            var dEntitiesVertexPositionsZIdx=0;
            var dEntitiesTextureCoordsZIdx=0;
            var dEntitiesTranslationsZIdx=0;
            var dEntitiesSpriteColorsZIdx=0;
            //var dEntitiesSpriteAlphasZIdx=0;
            //var dEntitiesTextureLayerIndexesZIdx=0;
            var dEntitiesPropertiesZIdx=0;
            for (var z=0,zEnd=worldData.entities.length;z<zEnd;z++){
              var currentEntity=worldData.entities[depths[z].entityId]; //we obtain the ordered entities based on depth, and we use the painter algorithm to draw them
              currentEntity.depthId=z;
              //var idx0=currentEntity.id*6;
              //var idx2=currentEntity.id*6*2;
              var idx3=currentEntity.id*6*3;

              var currentTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.textureId];
              if (typeof currentTexture==='undefined'){
                currentTexture=_seba.WEBGL.GLOBALS.textures['pavement_01'];
                //console.log(currentEntity.oTextureId,'->','pavement_01');
              }

              //texture coordinates (2 points per vertex)
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+0]=currentTexture.textureCoordinates[0];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+1]=currentTexture.textureCoordinates[1];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+2]=currentTexture.textureCoordinates[2];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+3]=currentTexture.textureCoordinates[3];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+4]=currentTexture.textureCoordinates[4];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+5]=currentTexture.textureCoordinates[5];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+6]=currentTexture.textureCoordinates[6];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+7]=currentTexture.textureCoordinates[7];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+8]=currentTexture.textureCoordinates[8];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+9]=currentTexture.textureCoordinates[9];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+10]=currentTexture.textureCoordinates[10];
              dEntitiesTextureCoordsZ[dEntitiesTextureCoordsZIdx+11]=currentTexture.textureCoordinates[11];
              dEntitiesTextureCoordsZIdx+=12;
              //vertex positions (3 points per vertex)
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+0]=dEntitiesVertexPositions[idx3+0];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+1]=dEntitiesVertexPositions[idx3+1];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+2]=dEntitiesVertexPositions[idx3+2];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+3]=dEntitiesVertexPositions[idx3+3];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+4]=dEntitiesVertexPositions[idx3+4];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+5]=dEntitiesVertexPositions[idx3+5];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+6]=dEntitiesVertexPositions[idx3+6];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+7]=dEntitiesVertexPositions[idx3+7];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+8]=dEntitiesVertexPositions[idx3+8];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+9]=dEntitiesVertexPositions[idx3+9];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+10]=dEntitiesVertexPositions[idx3+10];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+11]=dEntitiesVertexPositions[idx3+11];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+12]=dEntitiesVertexPositions[idx3+12];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+13]=dEntitiesVertexPositions[idx3+13];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+14]=dEntitiesVertexPositions[idx3+14];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+15]=dEntitiesVertexPositions[idx3+15];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+16]=dEntitiesVertexPositions[idx3+16];
              dEntitiesVertexPositionsZ[dEntitiesVertexPositionsZIdx+17]=dEntitiesVertexPositions[idx3+17];
              dEntitiesVertexPositionsZIdx+=18;
              //vertex translations (3 points per vertex)
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+0]=currentEntity.x;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+1]=currentEntity.y;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+2]=currentEntity.z;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+3]=currentEntity.x;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+4]=currentEntity.y;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+5]=currentEntity.z;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+6]=currentEntity.x;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+7]=currentEntity.y;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+8]=currentEntity.z;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+9]=currentEntity.x;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+10]=currentEntity.y;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+11]=currentEntity.z;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+12]=currentEntity.x;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+13]=currentEntity.y;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+14]=currentEntity.z;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+15]=currentEntity.x;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+16]=currentEntity.y;
              dEntitiesTranslationsZ[dEntitiesTranslationsZIdx+17]=currentEntity.z;
              dEntitiesTranslationsZIdx+=18;
              //vertex colors (4 points per vertex)
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+0]=currentEntity.color1[0];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+1]=currentEntity.color1[1];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+2]=currentEntity.color1[2];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+3]=currentEntity.opacity;

              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+4]=currentEntity.color1[0];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+5]=currentEntity.color1[1];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+6]=currentEntity.color1[2];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+7]=currentEntity.opacity;

              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+8]=currentEntity.color1[0];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+9]=currentEntity.color1[1];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+10]=currentEntity.color1[2];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+11]=currentEntity.opacity;

              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+12]=currentEntity.color1[0];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+13]=currentEntity.color1[1];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+14]=currentEntity.color1[2];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+15]=currentEntity.opacity;

              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+16]=currentEntity.color1[0];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+17]=currentEntity.color1[1];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+18]=currentEntity.color1[2];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+19]=currentEntity.opacity;

              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+20]=currentEntity.color1[0];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+21]=currentEntity.color1[1];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+22]=currentEntity.color1[2];
              dEntitiesSpriteColorsZ[dEntitiesSpriteColorsZIdx+23]=currentEntity.opacity;
              dEntitiesSpriteColorsZIdx+=24;

              dEntitiesPropertiesZ[  dEntitiesPropertiesZIdx]=currentTexture.oX;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.layerId;
              //pack flags
              //http://theinstructionlimit.com/encoding-boolean-flags-into-a-float-in-hlsl
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.textureCoordinates[4];
              //proc ENTITIES.PROPERTIES.FLAGS {violet bold indent_5}
              //     the properties are mutually exclusive
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
              //--
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.oX;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.layerId;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.textureCoordinates[4];
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
              //--
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.oX;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.layerId;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.textureCoordinates[4];
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
              //--
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.oX;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.layerId;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.textureCoordinates[4];
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
              //--
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.oX;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.layerId;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.textureCoordinates[4];
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
              //--
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.oX;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.layerId;
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentTexture.textureCoordinates[4];
              dEntitiesPropertiesZ[++dEntitiesPropertiesZIdx]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
              dEntitiesPropertiesZIdx++;
            }

            gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesPropertiesZ.buffer);
            gl.bufferData(gl.ARRAY_BUFFER,dEntitiesPropertiesZ,gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesSpriteColorsZ.buffer);
            gl.bufferData(gl.ARRAY_BUFFER,dEntitiesSpriteColorsZ,gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.buffer);
            gl.bufferData(gl.ARRAY_BUFFER,dEntitiesTranslationsZ,gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.buffer);
            gl.bufferData(gl.ARRAY_BUFFER,dEntitiesVertexPositionsZ,gl.DYNAMIC_DRAW);

            gl.bindBuffer(gl.ARRAY_BUFFER,_seba.WEBGL.GLOBALS.buffers.entitiesTextureCoordsZ.buffer);
            gl.bufferData(gl.ARRAY_BUFFER,dEntitiesTextureCoordsZ,gl.DYNAMIC_DRAW);

          },

          syncBuffersData:function(currentEntity){ //proc syncBuffersData {green indent_4}
            //since we have abandoned the simplicity of having a drawcall
            //for each entity I am forced to update all the buffers to keep
            //the properties of the entity coupled to the data that are used by opengl to draw it

            //we synchronize the Zbuffers according to the entity status
            var _seba=SEBASTIAN;
            var gl                           =_seba.GLOBALS.webgl_ctx; //lookup var

            var zIdx0   =currentEntity.depthId*6;
            var zIdx2   =currentEntity.depthId*6*2;
            var zIdx3   =currentEntity.depthId*6*3;
            var zIdx4   =currentEntity.depthId*6*4; //2018-05-03 17:20:45
            //console.log(_seba.WEBGL.WORLD.ENTITIES.GLOBALS.totalProperties);
            var zIdxProp=currentEntity.depthId*6*_seba.WEBGL.WORLD.ENTITIES.GLOBALS.totalProperties;

            //--
            var dEntitiesTextureCoordsZ=_seba.WEBGL.GLOBALS.buffers.entitiesTextureCoordsZ.data;
            var dEntitiesTranslationsZ=_seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data;
            var dEntitiesSpriteColorsZ=_seba.WEBGL.GLOBALS.buffers.entitiesSpriteColorsZ.data;

            var dEntitiesPropertiesZ=_seba.WEBGL.GLOBALS.buffers.entitiesPropertiesZ.data;

            var currentTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.textureId];
            if (typeof currentTexture==='undefined'){
              currentTexture=_seba.WEBGL.GLOBALS.textures['pavement_01'];
              //console.log(currentEntity.oTextureId,'->','pavement_01');
            }

            dEntitiesTextureCoordsZ[zIdx2+0]=currentTexture.textureCoordinates[0];
            dEntitiesTextureCoordsZ[zIdx2+1]=currentTexture.textureCoordinates[1];
            dEntitiesTextureCoordsZ[zIdx2+2]=currentTexture.textureCoordinates[2];
            dEntitiesTextureCoordsZ[zIdx2+3]=currentTexture.textureCoordinates[3];
            dEntitiesTextureCoordsZ[zIdx2+4]=currentTexture.textureCoordinates[4];
            dEntitiesTextureCoordsZ[zIdx2+5]=currentTexture.textureCoordinates[5];
            dEntitiesTextureCoordsZ[zIdx2+6]=currentTexture.textureCoordinates[6];
            dEntitiesTextureCoordsZ[zIdx2+7]=currentTexture.textureCoordinates[7];
            dEntitiesTextureCoordsZ[zIdx2+8]=currentTexture.textureCoordinates[8];
            dEntitiesTextureCoordsZ[zIdx2+9]=currentTexture.textureCoordinates[9];
            dEntitiesTextureCoordsZ[zIdx2+10]=currentTexture.textureCoordinates[10];
            dEntitiesTextureCoordsZ[zIdx2+11]=currentTexture.textureCoordinates[11];

            //vertex translations (3 points per vertex)
            dEntitiesTranslationsZ[zIdx3+0]=currentEntity.x;
            dEntitiesTranslationsZ[zIdx3+1]=currentEntity.y;
            dEntitiesTranslationsZ[zIdx3+2]=currentEntity.z;
            dEntitiesTranslationsZ[zIdx3+3]=currentEntity.x;
            dEntitiesTranslationsZ[zIdx3+4]=currentEntity.y;
            dEntitiesTranslationsZ[zIdx3+5]=currentEntity.z;
            dEntitiesTranslationsZ[zIdx3+6]=currentEntity.x;
            dEntitiesTranslationsZ[zIdx3+7]=currentEntity.y;
            dEntitiesTranslationsZ[zIdx3+8]=currentEntity.z;
            dEntitiesTranslationsZ[zIdx3+9]=currentEntity.x;
            dEntitiesTranslationsZ[zIdx3+10]=currentEntity.y;
            dEntitiesTranslationsZ[zIdx3+11]=currentEntity.z;
            dEntitiesTranslationsZ[zIdx3+12]=currentEntity.x;
            dEntitiesTranslationsZ[zIdx3+13]=currentEntity.y;
            dEntitiesTranslationsZ[zIdx3+14]=currentEntity.z;
            dEntitiesTranslationsZ[zIdx3+15]=currentEntity.x;
            dEntitiesTranslationsZ[zIdx3+16]=currentEntity.y;
            dEntitiesTranslationsZ[zIdx3+17]=currentEntity.z;

            //vertex colors (3 points per vertex)
            dEntitiesSpriteColorsZ[zIdx4+0]=currentEntity.color1[0];
            dEntitiesSpriteColorsZ[zIdx4+1]=currentEntity.color1[1];
            dEntitiesSpriteColorsZ[zIdx4+2]=currentEntity.color1[2];
            dEntitiesSpriteColorsZ[zIdx4+3]=currentEntity.opacity;

            dEntitiesSpriteColorsZ[zIdx4+4]=currentEntity.color1[0];
            dEntitiesSpriteColorsZ[zIdx4+5]=currentEntity.color1[1];
            dEntitiesSpriteColorsZ[zIdx4+6]=currentEntity.color1[2];
            dEntitiesSpriteColorsZ[zIdx4+7]=currentEntity.opacity;

            dEntitiesSpriteColorsZ[zIdx4+8]=currentEntity.color1[0];
            dEntitiesSpriteColorsZ[zIdx4+9]=currentEntity.color1[1];
            dEntitiesSpriteColorsZ[zIdx4+10]=currentEntity.color1[2];
            dEntitiesSpriteColorsZ[zIdx4+11]=currentEntity.opacity;

            dEntitiesSpriteColorsZ[zIdx4+12]=currentEntity.color1[0];
            dEntitiesSpriteColorsZ[zIdx4+13]=currentEntity.color1[1];
            dEntitiesSpriteColorsZ[zIdx4+14]=currentEntity.color1[2];
            dEntitiesSpriteColorsZ[zIdx4+15]=currentEntity.opacity;

            dEntitiesSpriteColorsZ[zIdx4+16]=currentEntity.color1[0];
            dEntitiesSpriteColorsZ[zIdx4+17]=currentEntity.color1[1];
            dEntitiesSpriteColorsZ[zIdx4+18]=currentEntity.color1[2];
            dEntitiesSpriteColorsZ[zIdx4+19]=currentEntity.opacity;

            dEntitiesSpriteColorsZ[zIdx4+20]=currentEntity.color1[0];
            dEntitiesSpriteColorsZ[zIdx4+21]=currentEntity.color1[1];
            dEntitiesSpriteColorsZ[zIdx4+22]=currentEntity.color1[2];
            dEntitiesSpriteColorsZ[zIdx4+23]=currentEntity.opacity;

            dEntitiesPropertiesZ[  zIdxProp]=currentTexture.oX;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.layerId;
            //proc ENTITIES.PROPERTIES.FLAGS {violet bold indent_5}
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.textureCoordinates[4];//currentEntity.isLightEmitter;
            //console.log(currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX);
            dEntitiesPropertiesZ[++zIdxProp]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX; //poors man bitwise...
            //--
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.oX;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.layerId;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.textureCoordinates[4];//currentEntity.isLightEmitter;
            dEntitiesPropertiesZ[++zIdxProp]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
            //--
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.oX;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.layerId;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.textureCoordinates[4];//currentEntity.isLightEmitter;
            dEntitiesPropertiesZ[++zIdxProp]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
            //--
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.oX;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.layerId;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.textureCoordinates[4];//currentEntity.isLightEmitter;
            dEntitiesPropertiesZ[++zIdxProp]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
            //--
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.oX;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.layerId;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.textureCoordinates[4];//currentEntity.isLightEmitter;
            dEntitiesPropertiesZ[++zIdxProp]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;
            //--
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.oX;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.layerId;
            dEntitiesPropertiesZ[++zIdxProp]=currentTexture.textureCoordinates[4];//currentEntity.isLightEmitter;
            dEntitiesPropertiesZ[++zIdxProp]=currentEntity.hasShadowMitigation+10*currentEntity.isLightEmitter+20*currentEntity.isFlippedX;

          },
          setScale:function(currentEntity){ //proc setScale {green indent_4}

            var _seba=SEBASTIAN;

            var entitiesVertPosZdata=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.data;
            var entitiesVertPosdata=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositions.data;
            var currentEntityVertexZIndex=currentEntity.depthId*6*3;
            var currentEntityVertexIndex=currentEntity.id*6*3;
            //--
            var currentTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.textureId];
            if (typeof currentTexture==='undefined'){
              currentTexture=_seba.WEBGL.GLOBALS.textures['pavement_01'];
              //console.log(currentEntity.oTextureId,'->','pavement_01');
            }
            //console.log(currentEntity.scale);

            if (currentEntity.isStanding===1){
              entitiesVertPosdata[currentEntityVertexIndex+0]=0.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+1]=1.0*currentEntity.scale*currentTexture.scaleY;
              entitiesVertPosdata[currentEntityVertexIndex+2]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+3]=0.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+4]=0.0*currentEntity.scale*currentTexture.scaleY;
              entitiesVertPosdata[currentEntityVertexIndex+5]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+6]=1.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+7]=0.0*currentEntity.scale*currentTexture.scaleY;
              entitiesVertPosdata[currentEntityVertexIndex+8]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+9] =0.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+10]=1.0*currentEntity.scale*currentTexture.scaleY;
              entitiesVertPosdata[currentEntityVertexIndex+11]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+12]=1.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+13]=1.0*currentEntity.scale*currentTexture.scaleY;
              entitiesVertPosdata[currentEntityVertexIndex+14]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+15]=1.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+16]=0.0*currentEntity.scale*currentTexture.scaleY;
              entitiesVertPosdata[currentEntityVertexIndex+17]=0.0;

              //--
              entitiesVertPosZdata[currentEntityVertexZIndex+0]=entitiesVertPosdata[currentEntityVertexIndex];
              entitiesVertPosZdata[currentEntityVertexZIndex+1]=entitiesVertPosdata[currentEntityVertexIndex+1];
              entitiesVertPosZdata[currentEntityVertexZIndex+2]=entitiesVertPosdata[currentEntityVertexIndex+2];

              entitiesVertPosZdata[currentEntityVertexZIndex+3]=entitiesVertPosdata[currentEntityVertexIndex+3];
              entitiesVertPosZdata[currentEntityVertexZIndex+4]=entitiesVertPosdata[currentEntityVertexIndex+4];
              entitiesVertPosZdata[currentEntityVertexZIndex+5]=entitiesVertPosdata[currentEntityVertexIndex+5];

              entitiesVertPosZdata[currentEntityVertexZIndex+6]=entitiesVertPosdata[currentEntityVertexIndex+6];
              entitiesVertPosZdata[currentEntityVertexZIndex+7]=entitiesVertPosdata[currentEntityVertexIndex+7];
              entitiesVertPosZdata[currentEntityVertexZIndex+8]=entitiesVertPosdata[currentEntityVertexIndex+8];

              entitiesVertPosZdata[currentEntityVertexZIndex+9] =entitiesVertPosdata[currentEntityVertexIndex+9];
              entitiesVertPosZdata[currentEntityVertexZIndex+10]=entitiesVertPosdata[currentEntityVertexIndex+10];
              entitiesVertPosZdata[currentEntityVertexZIndex+11]=entitiesVertPosdata[currentEntityVertexIndex+11];

              entitiesVertPosZdata[currentEntityVertexZIndex+12]=entitiesVertPosdata[currentEntityVertexIndex+12];
              entitiesVertPosZdata[currentEntityVertexZIndex+13]=entitiesVertPosdata[currentEntityVertexIndex+13];
              entitiesVertPosZdata[currentEntityVertexZIndex+14]=entitiesVertPosdata[currentEntityVertexIndex+14];

              entitiesVertPosZdata[currentEntityVertexZIndex+15]=entitiesVertPosdata[currentEntityVertexIndex+15];
              entitiesVertPosZdata[currentEntityVertexZIndex+16]=entitiesVertPosdata[currentEntityVertexIndex+16];
              entitiesVertPosZdata[currentEntityVertexZIndex+17]=entitiesVertPosdata[currentEntityVertexIndex+17];

              //if (currentEntity.oTextureId.indexOf('grass')!==-1){
              //  console.log(currentEntity.oTextureId,currentEntity.scale,currentTexture.scaleX);
              //}

            }else{ // entity such as water

              entitiesVertPosdata[currentEntityVertexIndex+0]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+1]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+2]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+3]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+4]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+5]=1.0*currentEntity.scale*currentTexture.scaleY;

              entitiesVertPosdata[currentEntityVertexIndex+6]=1.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+7]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+8]=1.0*currentEntity.scale*currentTexture.scaleY;;

              entitiesVertPosdata[currentEntityVertexIndex+9] =0.0;
              entitiesVertPosdata[currentEntityVertexIndex+10]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+11]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+12]=1.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+13]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+14]=0.0;

              entitiesVertPosdata[currentEntityVertexIndex+15]=1.0*currentEntity.scale*currentTexture.scaleX;
              entitiesVertPosdata[currentEntityVertexIndex+16]=0.0;
              entitiesVertPosdata[currentEntityVertexIndex+17]=1.0*currentEntity.scale*currentTexture.scaleY;

              //--------

              entitiesVertPosZdata[currentEntityVertexZIndex+0]=entitiesVertPosdata[currentEntityVertexIndex];
              entitiesVertPosZdata[currentEntityVertexZIndex+1]=entitiesVertPosdata[currentEntityVertexIndex+1];
              entitiesVertPosZdata[currentEntityVertexZIndex+2]=entitiesVertPosdata[currentEntityVertexIndex+2];

              entitiesVertPosZdata[currentEntityVertexZIndex+3]=entitiesVertPosdata[currentEntityVertexIndex+3];
              entitiesVertPosZdata[currentEntityVertexZIndex+4]=entitiesVertPosdata[currentEntityVertexIndex+4];
              entitiesVertPosZdata[currentEntityVertexZIndex+5]=entitiesVertPosdata[currentEntityVertexIndex+5];

              entitiesVertPosZdata[currentEntityVertexZIndex+6]=entitiesVertPosdata[currentEntityVertexIndex+6];
              entitiesVertPosZdata[currentEntityVertexZIndex+7]=entitiesVertPosdata[currentEntityVertexIndex+7];
              entitiesVertPosZdata[currentEntityVertexZIndex+8]=entitiesVertPosdata[currentEntityVertexIndex+8];

              entitiesVertPosZdata[currentEntityVertexZIndex+9] =entitiesVertPosdata[currentEntityVertexIndex+9];
              entitiesVertPosZdata[currentEntityVertexZIndex+10]=entitiesVertPosdata[currentEntityVertexIndex+10];
              entitiesVertPosZdata[currentEntityVertexZIndex+11]=entitiesVertPosdata[currentEntityVertexIndex+11];

              entitiesVertPosZdata[currentEntityVertexZIndex+12]=entitiesVertPosdata[currentEntityVertexIndex+12];
              entitiesVertPosZdata[currentEntityVertexZIndex+13]=entitiesVertPosdata[currentEntityVertexIndex+13];
              entitiesVertPosZdata[currentEntityVertexZIndex+14]=entitiesVertPosdata[currentEntityVertexIndex+14];

              entitiesVertPosZdata[currentEntityVertexZIndex+15]=entitiesVertPosdata[currentEntityVertexIndex+15];
              entitiesVertPosZdata[currentEntityVertexZIndex+16]=entitiesVertPosdata[currentEntityVertexIndex+16];
              entitiesVertPosZdata[currentEntityVertexZIndex+17]=entitiesVertPosdata[currentEntityVertexIndex+17];

            }
          },

          animate:function(idx,delta,timeIdx){ //proc animate {green indent_4}
            var worldData=SEBASTIAN.GLOBALS.worldData;
            var currentEntity=worldData.entities[idx];
            var _seba=SEBASTIAN;
            var currentEntityVertexZIndex=currentEntity.depthId*6*3; // index of the first vertex of the entity in the zbuffer array

            //behavior
            //sleep animation
            if (currentEntity.isLivingBeing){
              if (currentEntity.currentAnimation!=='sleep'){
                if (timeIdx>=currentEntity.bedtime || timeIdx<=currentEntity.waketime){
                  currentEntity.currentAnimation='sleep';
                  currentEntity.currentAnimationFrameIdx=0;
                  currentEntity.isPlayingAnim=1;
                  currentEntity.hasEnteredFrame=0;
                  currentEntity.saved_textureId=currentEntity.oTextureId; // save the current texture
                  currentEntity.isAwake=0;
                  //console.log(currentEntity.name,'is sleeping at',currentEntity.bedtime);
                }
              }else{
                if (currentEntity.isAwake===0){
                  if (timeIdx>currentEntity.waketime && timeIdx<currentEntity.bedtime){
                    currentEntity.isPlayingAnim=0;
                    currentEntity.isAwake=1;
                    currentEntity.textureId=currentEntity.oTextureId; // save the current texture
                    //console.log(timeIdx,1440-timeIdx,currentEntity.waketime,currentEntity.bedtime,currentEntity.name,'is awake');
                    //set random sleep/wake time
                    SEBASTIAN.WEBGL.WORLD.ENTITIES.setLivingCreatureBehaviors(currentEntity);
                    //console.log(currentEntity.name,'is awake at',currentEntity.waketime);
                  }
                }
              }
            }

            //movement
            //speed X animation
            //---------------

            if (currentEntity.speed!==0){ // We update the x position only if the speed of the entity is different from 0 (clouds)
              currentEntity.x+=currentEntity.speed*delta;
              _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+0]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+1]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+2]=currentEntity.x;
              _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+3]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+4]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+5]=currentEntity.x;
              _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+6]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+7]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+8]=currentEntity.x;
              _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+9]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+10]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+11]=currentEntity.x;
              _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+12]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+13]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+14]=currentEntity.x;
              _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+15]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+16]=currentEntity.x;
              //_seba.WEBGL.GLOBALS.buffers.entitiesTranslations.data[currentEntity.id*6*3+17]=currentEntity.x;

              if (currentEntity.isBot){
                if (currentEntity.x>currentEntity.xLimit){
                  currentEntity.x=0-currentEntity.speed;
                  _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+0]=currentEntity.x;
                  _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+3]=currentEntity.x;
                  _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+6]=currentEntity.x;
                  _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+9]=currentEntity.x;
                  _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+12]=currentEntity.x;
                  _seba.WEBGL.GLOBALS.buffers.entitiesTranslationsZ.data[currentEntityVertexZIndex+15]=currentEntity.x;
                  //--
                  SEBASTIAN.WEBGL.WORLD.ENTITIES.bootBot(currentEntity.id,currentEntity.id);
                  SEBASTIAN.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity);
                }
              }

            }

            //aspect
            if (typeof currentEntity.animations!=='undefined'){
              //console.log(currentEntity.name,'has animations');
              //idle animation
              if (currentEntity.isPlayingAnim!==1){
                if (typeof currentEntity.animations.idle!=='undefined'){
                  // we get a random element from the array of available idle animations
                  var randomIdleAnimId=currentEntity.animations.idle.animations[Math.floor(Math.random()*currentEntity.animations.idle.animations.length)];
                  //console.log(randomIdleAnimId);
                  currentEntity.currentAnimation=randomIdleAnimId;
                  currentEntity.currentAnimationFrameIdx=0;
                  currentEntity.isPlayingAnim=1;
                  currentEntity.hasEnteredFrame=0;
                  currentEntity.saved_textureId=currentEntity.textureId; //salviamo la texture corrente
                  _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity);
                }
              }else{ // animation execution in progress

                if (typeof currentEntity.animations[currentEntity.currentAnimation]!=='undefined'){
                  if (currentEntity.hasEnteredFrame!==1){
                    var currentAnim=currentEntity.animations[currentEntity.currentAnimation];
                    var currentAnimFrameIdx=currentEntity.currentAnimationFrameIdx;
                    var chance=Math.random(); //0 inclusive 1 exclusive
                    //console.log(currentAnim.probability_range[0],chance,currentAnim.probability_range[1]);
                    if ((typeof currentAnim.probability_range==='undefined') || (chance>currentAnim.probability_range[0] && chance<currentAnim.probability_range[1])){
                      currentEntity.textureId=currentAnim.frames[currentAnimFrameIdx].textureId;
                      _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity);
                      currentEntity.hasEnteredFrame=1;
                      currentEntity.frameTimer=0;
                      if (typeof currentAnim.frames[currentAnimFrameIdx].duration_range!=='undefined') {
                        var frameDurationMin=currentAnim.frames[currentAnimFrameIdx].duration_range[0];
                        var frameDurationMax=currentAnim.frames[currentAnimFrameIdx].duration_range[1];
                        currentEntity.frameDisplayDuration=(Math.random()*(frameDurationMax-frameDurationMin))+frameDurationMin;
                      }else{
                        currentEntity.frameDisplayDuration=Infinity; //unlimited duration
                      }
                      //console.log('dur',currentEntity.frameDisplayDuration,frameDurationMin,frameDurationMax);
                    }else{
                      //console.log(currentEntity.currentAnimation,'failed',chance);
                      currentEntity.isPlayingAnim=0; // the animation has not been launched -> return to idle state
                    }
                  }else{ //we are inside the current animation frame

                    if (currentEntity.frameDisplayDuration!==Infinity){
                      var currentAnim=currentEntity.animations[currentEntity.currentAnimation];
                      currentEntity.frameTimer+=0.001*delta;
                      //console.log('ft',currentEntity.frameTimer);
                      if (currentEntity.frameTimer>currentEntity.frameDisplayDuration){
                        currentEntity.currentAnimationFrameIdx++;
                        if (currentEntity.currentAnimationFrameIdx>=currentAnim.frames.length){
                          // we have reached the total number of frames for this animation, return to idle
                          currentEntity.textureId=currentEntity.saved_textureId;
                          _seba.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity);
                          currentEntity.isPlayingAnim=0;
                        }else{ // there are still other frames for this animation
                          currentEntity.hasEnteredFrame=0;
                          currentEntity.currentAnimationFrameIdx=0; // reset the current frame
                        }
                      }
                    }

                  }
                }

              }

            }

          },
          animateGeometry:function(idx,delta){ //proc animateGeometry {green indent_4}

            var _seba=SEBASTIAN;
            var worldData=SEBASTIAN.GLOBALS.worldData;
            var currentEntity=worldData.entities[idx];

            var entitiesVertPosZdata=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositionsZ.data;
            var entitiesVertPosdata=_seba.WEBGL.GLOBALS.buffers.entitiesVertexPositions.data;
            var currentEntityVertexZIndex=currentEntity.depthId*6*3;
            var currentEntityVertexIndex=currentEntity.id*6*3;

            //proc geometry animation behavior RUN {yellow indent_5}
            //tJYHTOX5az breath formula
            if (currentEntity.behaviorId===2){ //breath geometry deform (organic-life-like)
              var ms=_seba.GLOBALS.timeDelta%(currentEntity.breatheSlowness*delta);//currentEntity.deformDelta;
              var norm=ms/(currentEntity.breatheSlowness*delta);
              //console.log(norm);
              ms=Math.sin(norm*Math.PI*2)*currentEntity.breathDeformLimit;
              //console.log(ms);

              //if (currentEntity.name==='drutt'){
              //  console.log(ms,Math.sin(norm*6.28),currentEntity.breathDeformLimit);
              //}

              entitiesVertPosZdata[currentEntityVertexZIndex+0 ]=entitiesVertPosdata[currentEntityVertexIndex+0]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+9 ]=entitiesVertPosdata[currentEntityVertexIndex+9]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+12]=entitiesVertPosdata[currentEntityVertexIndex+12]-ms;

              entitiesVertPosZdata[currentEntityVertexZIndex+1 ]=entitiesVertPosdata[currentEntityVertexIndex+1]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+10]=entitiesVertPosdata[currentEntityVertexIndex+10]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+13]=entitiesVertPosdata[currentEntityVertexIndex+13]-ms;

            }

            if (currentEntity.behaviorId===1){ //taraxacum geometry deform (windflow-like)
              //var ms=currentEntity.deformDelta;

              var ms=_seba.GLOBALS.timeDelta%(currentEntity.breatheSlowness*delta);//currentEntity.deformDelta;
              var norm=ms/(currentEntity.breatheSlowness*delta);
              //console.log(norm);
              ms=Math.sin(norm*Math.PI*2)*currentEntity.breathDeformLimit;

              //if(currentEntity.id===500){
              //  console.log(delta);
              //}

              entitiesVertPosZdata[currentEntityVertexZIndex+0 ]=entitiesVertPosdata[currentEntityVertexIndex+0]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+9 ]=entitiesVertPosdata[currentEntityVertexIndex+9]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+12]=entitiesVertPosdata[currentEntityVertexIndex+12]-ms;

            }

            if (currentEntity.behaviorId===3){ //water geometry deform (windflow-like)
              var ms=currentEntity.deformDelta;

              entitiesVertPosZdata[currentEntityVertexZIndex+0 ]=entitiesVertPosdata[currentEntityVertexIndex+0 ]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+3 ]=entitiesVertPosdata[currentEntityVertexIndex+3 ]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+9 ]=entitiesVertPosdata[currentEntityVertexIndex+9 ]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+12]=entitiesVertPosdata[currentEntityVertexIndex+12]+ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+15]=entitiesVertPosdata[currentEntityVertexIndex+15]+ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+6 ]=entitiesVertPosdata[currentEntityVertexIndex+6 ]+ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+2 ]=entitiesVertPosdata[currentEntityVertexIndex+2 ]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+11]=entitiesVertPosdata[currentEntityVertexIndex+11]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+14]=entitiesVertPosdata[currentEntityVertexIndex+14]-ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+5 ]=entitiesVertPosdata[currentEntityVertexIndex+5 ]+ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+8 ]=entitiesVertPosdata[currentEntityVertexIndex+8 ]+ms;
              entitiesVertPosZdata[currentEntityVertexZIndex+17]=entitiesVertPosdata[currentEntityVertexIndex+17]+ms;

              currentEntity.deformDelta=currentEntity.counterDelta;
              if (!currentEntity.isIdle){
                if (!currentEntity.backCounter)
                  currentEntity.counterDelta+=currentEntity.counterDeltaIncrement*delta;
                else
                  currentEntity.counterDelta-=currentEntity.counterDeltaIncrement*delta;
                if (currentEntity.counterDelta<0 && currentEntity.backCounter){
                  currentEntity.counterDelta=0;
                  currentEntity.backCounter=0;
                  //--
                  currentEntity.isIdle=1;
                  currentEntity.idleCounter=0;
                  currentEntity.idleWait=0.2;
                }
                if (currentEntity.counterDelta>0.20){ //deformation limit
                  currentEntity.backCounter=1;
                  //--
                  currentEntity.isIdle=1;
                  currentEntity.idleCounter=0;
                  currentEntity.idleWait=0.2;
                }
              }else{
                currentEntity.idleCounter+=0.001*delta;
                if (currentEntity.idleCounter>currentEntity.idleWait){
                  currentEntity.isIdle=0;
                  currentEntity.idleCounter=0;
                }
              }

            }

            //position 2018-04-30 18:55:57
            if (currentEntity.behaviorId===4 || currentEntity.isFloatingOnWater===1){ //on water movement
              //it is not necessary to update this kind of position animation
              //for non-visible elements
              //so it goes inside the animateGeometry function even if it does not animate the geometry
              var ms=_seba.GLOBALS.timeDelta%(currentEntity.onWaterYMovementSlowness*delta);//currentEntity.deformDelta;
              var norm=ms/(currentEntity.onWaterYMovementSlowness*delta);

              ms=Math.sin(norm*Math.PI*2)*currentEntity.onWaterYMovementDistance;
              currentEntity.y=currentEntity.oY+ms;// *Math.sign(1+norm2*-2);// *Math.sign(-1+norm*2);

              SEBASTIAN.WEBGL.WORLD.ENTITIES.syncBuffersData(currentEntity);
            }

          },

          setGeometry:function(idx){ //proc setGeometry {green indent_4}
            //var DYNAMIC_ENTITY_GEOMETRY=1;
            var _seba=SEBASTIAN;
            var gl=SEBASTIAN.GLOBALS.webgl_ctx; //lookup var
            var worldData=SEBASTIAN.GLOBALS.worldData;
            var currentEntity=worldData.entities[idx];
            var currentEntityTexture;
            currentEntityTexture=_seba.WEBGL.GLOBALS.textures[currentEntity.textureId];
            if (typeof currentEntityTexture==='undefined'){
              console.log('undefined texture',currentEntity.textureId);
              currentEntityTexture=_seba.WEBGL.GLOBALS.textures['pavement_01'];
            }

            if (SEBASTIAN.GLOBALS.dynamicEntitiesGeometry){
              //define vertext animation params
              currentEntity.deformDelta=0;
              currentEntity.counterDelta=0;
              currentEntity.backCounter=0;
            }

          }
        },

      }
    },
  };
  SEBASTIAN.init(); //LET'S START THE SHOW

  function hideInfo(){
    document.getElementById('help_box').style.display='';
    if (document.getElementById('gdpr_box')!==null)
      document.getElementById('gdpr_box').style.display='';
    if (document.getElementById('copyright_box')!==null)
      document.getElementById('copyright_box').style.display='';
    if (document.getElementById('license_box')!==null)
      document.getElementById('license_box').style.display='';
    SEBASTIAN.GLOBALS.prevBox=null;
  }

  function showInfo(o){
    var id=o.id+'_box';
    var savePrev=SEBASTIAN.GLOBALS.prevBox;
    hideInfo();
    SEBASTIAN.GLOBALS.prevBox=savePrev;
    if (SEBASTIAN.GLOBALS.prevBox===id){
      document.getElementById(id).style.display='';
      SEBASTIAN.GLOBALS.prevBox=null;
    }else{
      document.getElementById(id).style.display='block';
      SEBASTIAN.GLOBALS.prevBox=id;
    }
    return false;
  }