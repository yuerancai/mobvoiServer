var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();
var bodyParser = require('body-parser');


//must! for nodejs to correctly recieve and send JSON file
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(bodyParser.json());
app.use(express.static('public'));

app.get('/index.htm', function (req, res) {
    res.sendFile( __dirname + "/" + "index.htm" );
});
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

var repeat = false;       //whether to enter the repeat model
var endSession = false;   //whether to end session
var responseText = "";    //response to client
app.post('/', function (req, res) {
    //console.log(req.body);
    res.json({"jh":"jh"});
});

app.post('/process_post', function (req, res) {
    var query = req.body.query;
    console.log('接受',req.body);
    console.log('repeat',repeat);
    console.dir(req.body);
    // res.writeHead(200, {'Content-Type': 'application/json'});
    if(query ==="跟我说" && repeat === false){
        repeat = true;
        endSession = true;
        responseText = "已进入模式";
    }else if(query ==="退出"){
        repeat = false;
        endSession = true;
        responseText = "退出模式";
    }else if(repeat===true){
        endSession = false;
        responseText = query;

    }
    var response = {
        "version": "string",
        "status": "success",// "success" or "error" or “not_supported”,//warning: 下划线命名法
        "sessionAttributes": {//用于更新session，可以为空JSON
            "key": "value"
        },
        "sessionExpireTime":900,//可选字段，单位为秒，不指定时默认900也即15min，最大3600
        "context": {},//用于更新context，可以为空
        "shouldEndSession":endSession,//是否结束当前session，如果否，则在LU时一直进入当前场景
        "response": {//该部分格式与TCP Webhook中相同
            "status": "success",// "success" or "error"
            "control": {
                "voiceControl": "end",//枚举值默认”end”不开启自动聆听;“start_voice”: 开启聆听       
                "execType":"text",//枚举值：show_onebox:展示对话文本以及Onebox 数据;
                //text:仅展示文本;
                //voice_action:展示对话文本以及执行client action
                //warning：返回协议中其他字段都为小驼峰命名法，唯有
                //枚举字段的取值为下划线命名法。
                "voiceOption":{
                    "silenceTime":"",//下次聆听的静音检测时间，类型为int，仅当voiceContraol为// start_voice时包含
                    "stateActionMap": {//不同的前端状态下采取的action
                        "noSpeech":{//经过maxSilenceTime后前端依然没有检测到语音输入时的action
                            "type":"textQuery",//枚举类型，textQuery, text与webhook，其中textQuery时，前端构造特殊
// query发送到m.mobvoi.com实现一些特殊的后端
// 命令；text直接播报相应的tts，webhook则以get
// 调用相应的url。
                            "textQuery":query,//可选值，类型为textQuery时前端填到
// query字段中的内容
                            "url":"",//可选值，类型为webhook时前端请求的url
                            "text":"string"//可选值，类型为text时播报的tts
                        }
                    }
                }
            },
            //以上为必选项字段，包括内嵌的execType等。clientData和clientAction为某些条件下
//必选的字段, 它们的格式主要是为了搭配问问相关的SDK使用，如果开发者完全自己
//实现前端的数据解析逻辑，则clientData和clientAction中的具体格式可以自定义，否
//则需要严格按照此格式进行实现
            "languageOutput":{//execType为“text”时必选
                "displayText": responseText,
                "tts": responseText
            },
            "clientData": { //execType为"show_onebox"时必选
                "status":"",
                "data":[],
                "type":"",//“string”
                "dataSummary":{}//JSONObject
            },
            "clientAction":{//execType为"voice_action"时必选
                "action":"com.mobvoi.DO_SOMETHING",
                "auto":false,
                "extras":{}//参数列表
            },
            "innerExecution":{//execType为 "inner_execute "时必选
                "url ": "string ",
                "systemAction": { // 系统动作，主要参考字段
                    "auto": true,
                    "action": "com.mobvoi.semantic.action.REMINDER.SET",  // action名称
                    "extras": {// 执行的action的参数
                        "time": "明天早晨8点::1491004800000",
                        "content": "睡觉::睡觉"
                    }
                }
            }
        }

    };
    //console.log(response);
    res.end(JSON.stringify(response));
});
app.use(logger('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
