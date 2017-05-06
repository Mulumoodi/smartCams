var http = require('http');
var url = require('url');
var fs = require('fs');
var watson = require('watson-developer-cloud');
var client = require('./connection.js'); 
var moment = require('moment'); 

var current_date = moment().format("YYYY-MM-DD");
var current_time = moment().format("h:mm:ss");

var temp = require('temp-sdk');
temp.config.update({accessKeyId:"",
secretAccessKey:"",
"region":"us-west-2"});

var visual_recognition = watson.visual_recognition({
  api_key: 'c23b8c3f8eb01911834d2c50444f63cea40d56d2',
  version: 'v3',
  version_date: '2016-05-20'
});


var sns = new temp.SNS();
var sendNotif=function(object){
    var params = {
    Message: 'STRING_VALUE', /* required */
    MessageAttributes: {
      'sampleAlert': {
        DataType: 'String', /* required */
        StringValue: 'Some shit'
      },
      /* '<String>': ... */
    },
    MessageStructure: 'json',
    Message:'{"default":"Some more shit","email":"Something unusual is happening"}',
    Subject: 'Be alert!!',
    //TargetArn: 'arn:aws:sns:us-west-2:394476956221:alertQueue',
    TopicArn: 'arn:aws:sns:us-west-2:394476956221:alertQueue'
    };
    sns.publish(params, function(err, data) {
    if (err) console.log(err, err.stack); // an error occurred
    else     console.log(data);           // successful response:Q
    });
}


var server = http.createServer(function(req, res) {
var page = url.parse(req.url).pathname;
console.log(page);

// Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);
if (page == '/'){
  console.log("Entered /");
    if (req.method == 'POST') {
            console.log("Entered POST");
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write('You\'re at the reception desk. How can I help you?');

            console.log("Waiting a sec");
            setTimeout(function(){
              var params = {
                images_file: fs.createReadStream('/Users/ambikabohra/Downloads/dl.png')
              };

              visual_recognition.classify(params, function(err, res) {
                if (err){
                  console.log("Somethings wrong with the service");
                  console.log(err);
                }
                else{
                  var jstring=JSON.stringify(res, null, 2);
                  console.log(jstring);
                  if(jstring.indexOf("thumb") > -1){
                      console.log("\n\nThumb is there!!!\n\n")

                  }
		  if((jstring.indexOf("person") > -1) || (jstring.indexOf("people") > -1)){
                      console.log("\nAlert, Someone is in secure room !!!!! \n\n")
                      sendNotif("dangeralert");
                      client.index({   
                        index: 'image_index',
                        type: 'datetime_score',
                        body: {
                          "current_Time":current_time,
                          "current_Date":current_date,
                          "scores":res
                        }
                      },function(err,resp,status) {
                        if(err) {
                          console.log(err);
                        }
                        else {
                          console.log("create",resp);
                        }
                      }) 
                  }


                  fs.unlinkSync('/Users/ambikabohra/Downloads/dl.png');
                  console.log("Deletion succesful");
                }
              });

            }, 1000);

            res.write('You\'re at the reception desk. How can I help you?');
            res.end('post received');
        }
      }
});
server.listen(8080);

