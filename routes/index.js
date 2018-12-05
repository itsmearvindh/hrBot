require('dotenv').config();
var fs = require("fs");
var path = require('path');
var request = require('request');
var textract = require('textract');
var sppull = require("sppull").sppull;
var Connection = require('tedious').Connection;
var Request = require('tedious').Request;
var https = require ('https');

var url = require('url');
var juice = require('juice');
const sgMail = require('@sendgrid/mail');

var Linkedin = require('node-linkedin')('818fja7bhtzeac', 'LN713Gcs61J623hZ', 'https://hrscreeningbot.azurewebsites.net/linkedin');

var express = require('express');
var router = express.Router();


var phrasecount = 10;
var sendgridCredentials = [];

//Muthuprasanth1012

/* GET home page. */

router.get('/callback', function(req, res, next) {

  console.log("code ",req.query.code);

});


router.get('/linkedin1', function(req, res) {
  var scope = ['r_basicprofile','rw_company_admin','w_share','r_emailaddress'];
  Linkedin.auth.authorize(res, scope);
});
  
router.get('/linkedin', function(req, res) {
  Linkedin.auth.getAccessToken(res, req.query.code, req.query.state, function(err, results) {
    if ( err )
      return console.error(err);
      var linkedin = Linkedin.init(results.access_token || results.accessToken);
      var summary = "";
      var linkedinprofileurl = "";
      var resumefilename = "./Resumes/mahesh_1.docx";
        let promiseToReadResumeContent = getContents(resumefilename);
        promiseToReadResumeContent.then(function(resumePhrases){
          linkedinprofileurl = getLinkedinProfileUrl(resumePhrases);
          linkedin.people.url(linkedinprofileurl,['summary', 'positions'],function(err, profileDetails) {
            console.log("Summary of the LinkedIn Profile is ",profileDetails.summary)
            console.log("Specialties of the LinkedIn Profile is ",profileDetails.specialties)
            console.log("Positions of the LinkedIn Profile is ",profileDetails.positions)
            summary = profileDetails.summary;
            
            let promiseToGetlinkedinkeyphrases = textanalyics(summary,summary,res);
            promiseToGetlinkedinkeyphrases.then(function (linkedinphrases) {
              linkedindetail = linkedinphrases[1];
              res = linkedinphrases[2];
              //console.log("response_2",res);
              //console.log("linkedinphrase is", linkedinphrases[1]);
              linkedinphrase = updatingphrases(linkedinphrases[0], 0);
              console.log(linkedinphrase);
              var jdfilename = "./JD/Jdazure.docx";
              let promiseToReadJDContent = getContents(jdfilename);
              promiseToReadJDContent.then(function(jdPhrases){
                console.log(jdPhrases);
                let promiseToGetJobDesckeyphrases = textanalyics(jdPhrases,jdPhrases,res);
                promiseToGetJobDesckeyphrases.then(function (jdescPhrase) {
                  jdescdetail = jdescPhrase[1];
                  res = jdescPhrase[2];
                  console.log(jdescPhrase[0]);
                });
              });
            });
          });
        }) 
    }); 
});

router.get('/tasks', function(req, res, next) {
  console.log("ResumeScreening AI")
  
  //var filename = req.query.filename;
  var filename = "mahesh_1.docx";
  //var filename = "ramprasad_1.docx";
  var jdfilename = "Jdazure.docx";
  var resumedetail = "", JDdetail = "";
  console.log("inside main function phrasecount is ", phrasecount);
  let promiseTOGetsendgridCredentials = getSendgrid(res);
  promiseTOGetsendgridCredentials.then(function (Credentials) {
    sendgridCredentials[0] = Credentials[0];
    sendgridCredentials[1] = Credentials[1];
    res = Credentials[2];
    //console.log("sendgridCredentials is", sendgridCredentials);
    let promiseTOReadResumeContent = getFile(filename, 'Shared%20Documents', 'Resumes');
    promiseTOReadResumeContent.then(function (resumecontent) {
      resumedetail = resumecontent;
      console.log("resumedetail is", resumedetail);
      let promiseTOReadJDContent = getFile(jdfilename, 'Shared%20Documents', 'JD');
      promiseTOReadJDContent.then(function (JDcontent) {
        JDdetail = JDcontent;
        console.log("JDdetail is", JDdetail);
        let promiseToGetResumekeyphrases = textanalyics(resumedetail,resumedetail,res);
        promiseToGetResumekeyphrases.then(function (resumephrases) {
          resumedetail = resumephrases[1];
          res = resumephrases[2];
          //console.log("response_2",res);
          //console.log("resumephrase is", resumephrases[1]);
          resumephrase = updatingphrases(resumephrases[0], 0);
          console.log("Updated resumephrase is", resumephrase);
          let promiseToGetJDkeyphrases = textanalyics(JDdetail,resumedetail,res);
          promiseToGetJDkeyphrases.then(function (JDphrases) {
            resumedetail = JDphrases[1];
            res = JDphrases[2];
            JDphrase = updatingphrases(JDphrases[0], 1);
            console.log("Updated resumephrase is", JDphrase);

            let promiseToGetJDintent  =  helper2(JDphrase,resumephrase,phrasecount,resumedetail,res);

          }).catch(function (error) {
            console.log("Error in Getting JD Keyphrases is", error.message);
          });
        }).catch(function (error) {
          console.log("Error in Getting Resume Keyphrases is", error.message);
        });
      }).catch(function (error) {
        console.log("Error in Getting JD content is", error.message);
      });
    }).catch(function (error) {
      console.log("Error in Getting resume content is", error.message);
    });
  }).catch(function (error) {
    console.log("Error in Getting sendgridCredentials is", error.message);
  });
});

function getSendgrid(res) {
  
  var config =
  {
    userName: 'Muthuprasanth038', 
    password: 'Sirius@25', 
    server: 'sendgridcredentials.database.windows.net', 
    options:
    {
      database: 'Sendgridcred1', 
      encrypt: true
    }
  }

  var connection = new Connection(config);
  
  var i = 0;
  return new Promise(function (resolve, reject) {
   connection.on('connect', function (err) {
      if (err) {
        console.log(err)
        reject(err);
      }
      else {
        let tediousRequest = new Request(
          "SELECT  username,sendkey FROM dbo.userdetails",
          function (err, rowCount, rows) {
            sendgridCredentials[2] = res;
            resolve(sendgridCredentials);
          }
        );
        tediousRequest.on('row', function (columns) {
          columns.forEach(function (column) {
            sendgridCredentials[i] = column.value;
            i++;
          });

        });
        connection.execSql(tediousRequest);
      }
    });
 
  });
}

function resolveAfter3Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("before");
      resolve('resolved');
      console.log("after");
    }, 3000);
  });
}

function resolveAfter1Seconds() {
  return new Promise(resolve => {
    setTimeout(() => {
      console.log("1-before");
      resolve('resolved');
      console.log("1-after");
    }, 1000);
  });
}

async function helper2(JDphrase,resumephrase,phrasecount,resumedetail,res)
{
  console.log("Inside helper2");
let resumecontent="";

 let JDintentarray=[],resumeintentarray=[]; 
  for(let a=0;a<phrasecount;a++)
  {
    
      JDintentarray[a] = await getIntents(JDphrase[a]);
      console.log("JD");
      if((a+1)%5==0)
      {
        await resolveAfter3Seconds();
      }
      await resolveAfter1Seconds();
  
    
  }
  console.log("after FIRST for loop",JDintentarray);
  resumecontent = resumedetail;
  let response = res;
  for(let b=0;b<phrasecount;b++)
  {
  
    resumeintentarray[b] =  await getIntents(resumephrase[b]);
      console.log("REsume");
      if((b+1)%5==0)
      {
        await resolveAfter3Seconds();
      }
      await resolveAfter1Seconds();
   
  }
  console.log("after SECOND for loop",resumeintentarray);
  let total = phraseCompariosion(JDintentarray,resumeintentarray);
  if(total >= 5)
  {
    let email = getEmailsFromString(resumecontent);
    console.log("email",email,typeof email);
    sendMail(email,response);
  }
  else{
    console.log("Candidate score is "+total+" and rejected");
    response.json({ message: 'You are rejected' });
  }
}

function sendMail(emails,response)
{
  console.log("email username and password",sendgridCredentials[0],sendgridCredentials[1]);
 /* var sendgrid = new Sendgrid({
    user: sendgridCredentials[0],//provide the login credentials
    key:sendgridCredentials[1]
  });*/
  sgMail.setApiKey(sendgridCredentials[1]);

  let htmlstart="<!DOCTYPE html> <html><head><style> body {padding:10px; }"
  + ".sign{ width:1.7812in;height:0.6145in; }.hrname{margin:10px 0 0 0} .phone{color:rgb(102, 102, 102);margin:0} .web{color:rgb(48, 74, 134);} .line{margin:0 5px;} .email{color:#0000FF} </style></head><body>";
  let htmlend  = "</body></html>";
  let content = "<span> Hi, </span> <br><br> <span>Greetings from Sirius India !!</span><br>"+       
  "<p>Thank you for your interest with Sirius Computer Solutions. You have been shortlisted for <b>.NET and Azure Developer</b>. Your next round is Technical Interview with our Hiring-Bot.</p>"+
  "<p><b>Please follow the below instructions to start your Interview</b></p>"+
  "<ol>"+
      "<li>Signup/Login with Skype</li>"+
     "<li>Click<a href='https://join.skype.com/bot/ec47385e-f2db-4df7-9d3b-c5f9f767bd43'> Here</a> to start nterview</li>"+
     "<li>Once the chat window opens, say <b>Hi</b></li>"+
  "</ol>"+
  "<div><img src='https://image.ibb.co/grmLHo/sirius_Logo_Mail.png'  alt='no image found' class='sign'/></div><h4 class = 'hrname'>Human Resources</h4><p class='phone'>Office (India): +91 44 6650 7800 </p>"+
  "<span><a href='http://www.siriuscom.com' class = 'web'>www.siriuscom.com</a></span><span class='line'>|</span><span class='email'>Sirius.IndiaHR@siriuscom.com</span>";
  // "<p><a href='https://join.skype.com/bot/9c011e01-a307-4aa5-b9a6-13b3b5df47d1'>Click me</a> for the next round of Interview</p> <br><br>" +
  // "<img src='cid:testme' alt='graphic'/>";
  //https://join.skype.com/bot/b23753fe-a695-4f1c-a94a-86fc3a0eb8c8
  //+"<img src = 'data:image/png;base64,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'/>";
  let response1 = htmlstart+ content + htmlend;
  let response2 =  juice(response1);
  console.log(" response2 = ",response2);
  sgMail.send({
      to:emails[0],
      from: 'mprasanthmurugesan@gmail.com',
    //   cc:"sendgriduser112@gmail.com",
      subject: 'Interview from Sirius Computer Solutions India Pvt Ltd ',

      html: response2,    
      // "<a href='https://join.skype.com/bot/3935f689-309f-4bea-a782-dd4fdce254b4'>Click me</a>",

  }, function (err) {
    if (err) {
      response.json({ message: 'Selected but Mail not sended and Error is'+err });
      console.log("Mail error",err);
   
    } else {
      console.log("Success Mail sended From Azure ");
      response.json({ message: 'Selected and Mail sended' });
    }
  });
}

function phraseCompariosion(JDintentarray,resumeintentarray)
{
  var JDintentsuniquecounts = {};
  var resumeintentsuniquecounts = {};
  JDintentarray.forEach(function(x) { JDintentsuniquecounts[x] = (JDintentsuniquecounts[x] || 0)+1; });
  resumeintentarray.forEach(function(x) { resumeintentsuniquecounts[x] = (resumeintentsuniquecounts[x] || 0)+1; });
  let total=0;
  for (key in JDintentsuniquecounts) {
    if (JDintentsuniquecounts.hasOwnProperty(key)) 
    {
      if(resumeintentsuniquecounts.hasOwnProperty(key))
      {
        if(resumeintentsuniquecounts[key] <= JDintentsuniquecounts[key])
        {
          console.log("key "+key+" JDintentsuniquecounts "+JDintentsuniquecounts[key]+" resumeintentsuniquecounts "+resumeintentsuniquecounts[key]);
          console.log("value "+(resumeintentsuniquecounts[key]/JDintentsuniquecounts[key])*JDintentsuniquecounts[key]);
         // total +=(resumeintentsuniquecounts[key]/JDintentsuniquecounts[key])*JDintentsuniquecounts[key];
         total += resumeintentsuniquecounts[key];
          console.log("subtotal is",total);
        }
        else{
          console.log("key "+key+" resumeintentsuniquecounts "+resumeintentsuniquecounts[key]+" is greater than  JDintentsuniquecounts "+JDintentsuniquecounts[key]);
           total += JDintentsuniquecounts[key];
           console.log("subtotal is",total);
        }
      }
      else{
        //total += 0;
        console.log("key not found "+key);
        console.log("subtotal is",total);
      }
    }
  }
console.log("total is",total);
return total;
}

function getContents(resumeName) {
  console.log("Inside get contents function")
  return new Promise(function (resolve, reject) {
    textract.fromFileWithPath(resumeName, function (error, text) {
      //  console.log("file data",text);
    resolve(text);          
    })
  });
}
function getIntents(resumekeyphrase) {
  console.log("Inside getIntents");
   var luisserverurl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/95eec808-1452-461b-b7d4-4a7a35ffaae1?subscription-key=c020b67f43b44573bb611d9ed30e2bd0&timezoneOffset=-360&q="+resumekeyphrase;
   //var luisserverurl = "https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/af03578f-3913-4308-9cb4-535a5407b681?subscription-key=46da208aabf64fa4a0e531803b8f5bec&timezoneOffset=-360&q="+resumekeyphrase;
  var options4 = {
    method: 'get',
    url:luisserverurl,
  }

  return new Promise(function (resolve, reject) {
    request(options4, function (err, result, body) {
      let resultfromluis = JSON.parse(body);
      if (!("query" in resultfromluis)) {
        console.log("Inside reject");
        console.log("error is ", err);
        console.log("-----------------------------------------------------------------");
        reject(resumekeyphrase);
      }
      else {
        let body_ = JSON.parse(body);
        console.log("Inside resolve", body_);
        console.log("-----------------------------------------------------------------");
        let luisintent = body_.topScoringIntent.intent;
        resolve(luisintent);
      }
    });
  });      
}

function updatingphrases(phrase, flag) {
  //console.log("phrase is",phrase);
  var reqskills = ["AngularJs", "HTML5", "CSS3"];
  reqskills.forEach(function (entry) {
    if (phrase.indexOf(entry) != -1) {
      let pos = phrase.indexOf(entry);
      phrase.splice(pos, 1);
      phrase.unshift(entry);
    }
  });
  if (flag) {
    if (phrase.indexOf("projects") != -1) {
      let pos = phrase.indexOf("projects");
      console.log("projects index", pos);
      phrase.splice(pos, 1);
    }
  }
  if (phrase.indexOf("Azure Blob") != -1) {
    let pos = phrase.indexOf("Azure Blob");
    console.log("Azure Blob index", pos);
    phrase.splice(pos, 1);
  }
  return phrase;
}

function textanalyics(text,resumedetail,res) {
  let body_;
  console.log("inside textanalytics");
  let documents = {
    'documents': [
      { "language": "en", 'id': '1', 'text': text },
    ]
  };
  var options3 = {
    method: 'post',
    headers: {
      'Ocp-Apim-Subscription-Key':'e208e04d79c74b84b4864c1b5382ed12', // this text-analytics api key is valid only for 7 days
      // 'Content-Type':'application/json',
      // 'Accept':'application/json',
    },
    body: JSON.stringify(documents),
    // body: documents,
    url: 'https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases',
  }
  return new Promise(function (resolve, reject) {
    request(options3, function (err, result, body) {
      if (err) {
        console.log("error is ", err);
        
      }
      else {
        body_ = JSON.parse(body);
        console.log(body_);
        // let body__ = JSON.stringify (body_, null, '  ');
        let keyphrases = body_.documents[0].keyPhrases;
        let keyphrasesarray =[];
        keyphrasesarray[0]= keyphrases;
        keyphrasesarray[1]= resumedetail;
        keyphrasesarray[2]= res;
        // console.log ("output type is", typeof keyphrases,Object.keys(keyphrases).length);  
        // console.log ("output is",body_.documents[0].keyPhrases[146]);  
  
        resolve(keyphrasesarray);
      }
    });
  });

}

function getFile(filename, foldername, localfolder) {
  var extname = path.extname(filename);
  //console.log(extname);
  var url2 = "https://siriuscomsharepoint.sharepoint.com/_api/web/GetFileByServerRelativeUrl('/" + foldername + "/" + filename + "')/$value";
  var cs = encodeURIComponent("HfH/3FQfEmE7T5rZXYYezeEYbQ0JcB+zYm7+nJdYbRY=");
  var inputs = "grant_type=client_credentials&client_id=9e03361f-4257-46fd-92e3-283725b73d2f@efd5e309-58b5-4b73-9884-fb4d0252aa8a&client_secret=" + cs + "&resource=00000003-0000-0ff1-ce00-000000000000/siriuscomsharepoint.sharepoint.com@efd5e309-58b5-4b73-9884-fb4d0252aa8a";
  var token = "";

  return new Promise(function (resolve, reject) {
    if (extname == ".txt") { //this if for getting contents form text file using Sharepoint rest API
      console.log("Its a txt file");
      try {
        var url1 = "https://accounts.accesscontrol.windows.net/efd5e309-58b5-4b73-9884-fb4d0252aa8a/tokens/OAuth/2";  // this url is to get authentication token
        var options1 = {
          method: 'post',
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          //body: JSON.stringify(inputdata),
          body: inputs,
          url: url1,
        }
        request(options1, function (err, result, body) {   // this request is to get authentication token
          if (err) {
            console.log("err", err);
            reject(err);
            // res.json({ message: 'Error occurred in Reading a file'+ err });
          }
          else {
            body = JSON.parse(body);
            token = body.access_token;
            try {
              var options2 = {
                method: 'get',
                url: url2,
                headers: {
                  'Authorization': 'Bearer ' + token,
                },
                //  encoding: null,
              }
              request(options2, function (err, result, body) {
                if (err) {
                  console.log("err", err);
                  reject(err);
                  // res.json({ message: 'Error occurred in Reading a file'+ err });
                }
                else {
                  resolve(body);
                  //  nlpParser(body,filename);
                  //   res.json({ message: 'Files are downloaded' });

                }

              });
            } catch (err) {
              res.json({ message: 'Error occurred' + err });
            }
          }

        });

      } catch (err) {

        res.json({ message: 'Error occurred' + err });
      }
    }
    else { //this is for getting contents from non txt file by downloading it to the Resumes folder
      try {
        console.log("Its a DOCX file");
        var context = {
          siteUrl: "https://siriuscomsharepoint.sharepoint.com",
          creds: {
            username: "muthuprasanth@siriuscomsharepoint.onmicrosoft.com",
            password: "Sirius@25"
          }
        };

        var options = {
          spRootFolder: foldername,
          dlRootFolder: "./" + localfolder,
          strictObjects: [
            filename
          ]
        };
        //console.log("dd",context,options);
        sppull(context, options).then(function (downloadResults) {
          console.log("Files are downloaded");
          //  fs.readdir('./Resumes', function(err, items) {
          //   for (var i=0; i<items.length; i++) {
          //  console.log("path",items[i]);

          fs.stat('./' + localfolder + '/' + filename, function (err, stat) {
            if (err == null) {
              console.log('File exists');
              if (extname == ".pdf") {
                var pdftext = "";
                console.log("Its a pdf");
                new PdfReader.PdfReader().parseFileItems('./' + localfolder + '/' + filename, function (err, item) {
                  if (err) {
                    console.log("err is", err);
                    reject(err);
                  }
                  else if (!item) {
                    //console.log("pdf content is ",pdftext);
                    // textanalyics(pdftext);
                    // console.log("else ssssss is",err);
                    //console.log("pdf content is ",pdftext);
                    resolve(pdftext);
                  }
                  else if (item.text) {
                    pdftext += item.text;
                    //console.log(item.text);
                  }
                });
              }
              else {
                textract.fromFileWithPath('./' + localfolder + '/' + filename, function (error, text) {
                  //  console.log("file data",text);
                  var filePath = './' + localfolder + '/' + filename;
                  console.log("filepath is", filePath);
                  resolve(text);
                  // nlpParser(text,filename);    
                  //    fs.unlinkSync(filePath);          
                })
              }
              // res.json({ message: 'Files are downloaded' });
            } else if (err.code == 'ENOENT') {
              // file does not exist
              console.log('Some other error in elseif: ', err.code);
              reject(err);
            } else {
              console.log('Some other error: ', err.code);
              reject(err);
            }
          });

        }).catch(function (err) {
          console.log("Core error has happened", err);
          // res.json({ message: 'Core error has happened' });
          reject(err);
        });

      }//end of try
      catch (err) {
        console.log("Errrrrr", err);
        reject(err);
      }
      console.log("111eeeee");
    }
    // });
  });
}
function getEmailsFromString(text) {
  return text.match(/([a-zA-Z0-9._+-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}

function getLinkedinProfileUrl(text) {
  return text.match(/(ftp|http|https):\/\/?((www|\w\w)\.)?linkedin.com(\w+:{0,1}\w*@)?(\S+)(:([0-9])+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/gi);
}

module.exports = router;
