/*
 *    C_LMSAPI
 *
 *    ©Concurrent Technologies Corporation 2018
 */
var constants = {
  activityProfileIri:"http://adlnet.gov/xapi/profile/scorm/activity-profile",
  activityStateIri:"http://adlnet.gov/xapi/profile/scorm/activity-state",
  actorProfileIri:"http://adlnet.gov/xapi/profile/scorm/actor-profile",
  attemptStateIri:"http://adlnet.gov/xapi/profile/scorm/attempt-state"
};

var exitSetToSuspend = false;

var success = "unknown";//retrieveDataValue(scormVersionConfig.successElement);
var completion = "unknown";//retrieveDataValue(scormVersionConfig.completionElement);
var scoreScaled = "";//retrieveDataValue(scormVersionConfig.scoreScaledElement);
var scoreRaw = "";//retrieveDataValue(scormVersionConfig.scoreRawElement);
var scoreMin = "";//retrieveDataValue(scormVersionConfig.scoreMinElement);
var scoreMax = "";//retrieveDataValue(scormVersionConfig.scoreMaxElement);

//TODO: set cmi values where needed
// location, preferences object, credit, lesson_mode, suspend_data, 
// total_time, adl_data
var cmi_location = "";//retrieveDataValue(scormVersionConfig.locationElement);

var cmi_language = "";//retrieveDataValue(scormVersionConfig.languageElement);
var cmi_audio_level = "";//retrieveDataValue(scormVersionConfig.audioLevelElement);
var cmi_delivery_speed = "";//retrieveDataValue(scormVersionConfig.deliverySpeedElement);
var cmi_audio_captioning = "";//retrieveDataValue(scormVersionConfig.audioCaptioningElement);

var cmi_credit = "";//retrieveDataValue(scormVersionConfig.creditElement);
var cmi_mode = "";//retrieveDataValue(scormVersionConfig.modeElement);
var cmi_suspend_data = "";//retrieveDataValue(scormVersionConfig.suspendDataElement);
var cmi_total_time = "";//retrieveDataValue(scormVersionConfig.totalTimeElement);

var activity = currentLesson.path;
var isResumed = false;

var API_1484_11 = {
    Initialize : function(){

      activity = currentLesson.path;
      attemptId = ADL.ruuid();

      // // Determine whether this is a new or resumed attempt (based on cmi.entry)
      var entry = (exitSetToSuspend) ? "resume" : "ab_initio";

      isResumed = (entry == "resume"); 

      // // if "resume", determine if the user issued a suspend sequencing nav 
      // // request and a terminate was called instead of a suspend and if so, fix
      // if(isResumed)
      // {
         adjustFinishStatementForResume();
      // }

      //configure Attempt Context Activity ID
      // if( entry == "resume" )
      // {
      //   if( window.localStorage[activity] == null )
      //   {
      //     window.localStorage[activity] = activity + "?attemptId=" + ADL.ruuid();
      //   }
      // }
      // else
      // {
      //    window.localStorage[activity] = activity + "?attemptId=" + ADL.ruuid();

      //    // update the activity state with the new attempt IRI
      //    setActivityState();
      // } 

      // setActivityProfile();
      // setAttemptState();

      // // Set the appropriate verb based on resumed or new attempt
      // var startVerb = isResumed ? ADL.verbs.resumed : ADL.verbs.initialized;

      // // // Execute the statement
      // sendSimpleStatement(startVerb);      
      return "true";

    },
    Terminate : function(){

      var stmt = getBaseStatement();

      // get the exit and use appropriate verb
      var stopVerb = (exitSetToSuspend) ? ADL.verbs.suspended : ADL.verbs.terminated;      

      stmt.verb = stopVerb;

      var stmtWithResult = getStmtWithResult(stmt);            
        
        // stmt.result = {
        //     "success": true,
        //     "completion": true,
        //     "score": {
        //         "scaled": 0.95
        //     }
        // };
        socket.emit('sendXapiStatement',stmt, function(data){
          //TODO: 500 error coming back from ADL LRS
          console.log("suspendAttempt - sendXapiStatement");
          console.log(data.resp.statusCode);
          console.log(data.bdy);
        });                 

        return "true";
    },
    GetValue: function(_cmiElement){ 
        var returnValue = "testGet";

        if(_cmiElement === "cmi.location"){
          return cmi_location;
        }
        else if(_cmiElement === "cmi.objectives._count"){
            returnValue = "0";
        }
        else if(_cmiElement === "cmi.completion_status"){
          returnValue = completion;
        }
        else if(_cmiElement === "cmi.success_status"){
          returnValue = success;
        }
        else if(_cmiElement === "cmi.score.scaled"){
          returnValue = scoreScaled;
        }
        else if(_cmiElement === "cmi.score.raw"){
          returnValue = scoreRaw;
        }
        else if(_cmiElement === "cmi.entry"){
          returnValue = (exitSetToSuspend) ? "resume" : "ab_initio";
        }
        else if(_cmiElement === "cmi.suspend_data"){
          returnValue = cmi_suspend_data;
        }
        //console.log("GetValue : " + _cmiElement + " return - " + returnValue);
        return returnValue;
    }, 
    SetValue: function(_cmiElement, _value){ 
      //console.log("SetValue : " + _cmiElement + "(" + _value + ")");
        if(_cmiElement === "cmi.location"){
          cmi_location = _value;
        }
        else if(_cmiElement === "cmi.completion_status"){
          completion = _value;
        }
        else if(_cmiElement === "cmi.success_status"){
          success = _value;
        }
        else if(_cmiElement === "cmi.score.scaled"){
          scoreScaled = _value;
        }
        else if(_cmiElement === "cmi.score.raw"){
          scoreRaw = _value;
        }
        else if(_cmiElement === "cmi.exit"){
          if(_value === "suspend"){
            exitSetToSuspend = true;
          }
          else{
            exitSetToSuspend = false;
          }
        }
        else if(_cmiElement === "cmi.suspend_data"){
          cmi_suspend_data = _value;
        }
        return "true";
    },
    Commit: function(){return "true"},
    GetLastError: function(){return 0},
    GetErrorString: function(_cmiErrorCode){return "errorString"},
    GetDiagnostic: function(_cmiErrorCode){return "errorString"}
};

 /*******************************************************************************
 **
 ** This function looks at the last terminate or statement for a given attempt.
 ** If "terminated", the terminated stmt is voided and a suspend is issued
 **
 *******************************************************************************/
 var adjustFinishStatementForResume = function()
 {
    if(isResumed)
    {
      var search = ADL.XAPIWrapper.searchParams();
      search['verb'] = ADL.verbs.terminated.id;
      search['activity'] = window.localStorage[activity];
      search['related_activities'] = true;

      //var res = ADL.XAPIWrapper.getStatements(search);
      socket.emit('getXapiStatement',search, function (data){
        console.log("adjustFinishStatementForResume - getXapiStatement");
        var res = JSON.parse(data.resp.body);
        console.log(res);
        if (res.statements.length == 1)
        {
           // there is a terminate verb, so must void it and replace with suspended
           // Note: if there is length == 0, no issue.  
           //       if length > 1, things are very messed up. Do nothing.
           
           var terminateStmt = res.statements[0];

           // send the voided statement
           var voidedStmt = getVoidedBaseStatement();
           voidedStmt.verb = ADL.verbs.voided;
           voidedStmt.object.id = terminateStmt.id;

           var response = ADL.XAPIWrapper.sendStatement(voidedStmt); 

           // send a suspended statement to replace the (voided) terminated statement
           suspendAttempt(terminateStmt.timestamp);


        }
        else{
          configureAttemptContextActivityID();
        }
      });
    }
    else{
      configureAttemptContextActivityID();
    }

 }



/*******************************************************************************
 **
 ** This function is used to suspent an attempt
 **
 *******************************************************************************/
 var suspendAttempt = function(timestamp)
 {
    //sendSimpleStatement(ADL.verbs.suspended);
    var stmt = getBaseStatement();
    stmt.verb = ADL.verbs.suspended;

    if (timestamp != undefined && timestamp != null)
    {
       stmt.timestamp = timestamp;
    }

    // window.localStorage[activity] uses activity id to return the most recent
    // attempt
    stmt.context.contextActivities.grouping[0].id = window.localStorage[activity];

    var stmtWithResult = getStmtWithResult(stmt);
    //var response = ADL.XAPIWrapper.sendStatement(stmtWithResult); 
    socket.emit('sendXapiStatement',stmtWithResult, function(data){
      //TODO: 500 error coming back from ADL LRS
      console.log("suspendAttempt - sendXapiStatement");
      console.log(data.resp.statusCode);
      console.log(data.bdy);
      configureAttemptContextActivityID();
    });      
 }

/*******************************************************************************
 **
 ** This function is used to get the attempt context activity (grouping) id
 **
 *******************************************************************************/
 var configureAttemptContextActivityID = function ()
 {
    // window.localStorage[activity] uses activity id to return the most recent
    // attempt
    if( isResumed )
    {
       if( window.localStorage[activity] == null )
       {
          window.localStorage[activity] = activity + "?attemptId=" + ADL.ruuid();
       }

       // send a resume statement
       //resumeAttempt();
       setActivityProfile();
    }
    else
    {
       window.localStorage[activity] = activity + "?attemptId=" + ADL.ruuid();

       // update the activity state with the new attempt IRI
       setActivityState();
    }
 } 

 /*******************************************************************************
 **
 ** This function is used to complete the stmt result for terminate and suspend
 **
 *******************************************************************************/
 var getStmtWithResult = function(baseStatement)
 {

    var resultSet = false;
    var resultJson = {};
    var scoreSet = false;
    var scoreJson = {};

    // create all of the statement json 

    // set success if known
    if(success == "passed")
    {
       resultSet = true;
       resultJson.success =  true;
    }
    else if(success == "failed")
    {
       resultSet = true;
       resultJson.success = false;
    }

    // set completion if known
    if(completion == "completed")
    {
       resultSet = true;
       resultJson.completion =  true;
    }
    else if(completion == "incomplete")
    {
       resultSet = true;
       resultJson.completion = false;
    }

    // set scaled score if set by sco
    if(scoreScaled != undefined && scoreScaled != "")
    {
       scoreSet = true;
       resultSet = true;
       scoreJson.scaled =  parseFloat(scoreScaled);
    }

    // set raw score if set by sco
    if(scoreRaw != undefined && scoreRaw != "")
    {
       scoreSet = true;
       resultSet = true;
       scoreJson.raw =  parseFloat(scoreRaw);

       // // if SCORM 1.2, use raw score / 100 for scaled score
       // if(!config.isScorm2004){
          scoreJson.scaled = parseFloat(scoreRaw) / 100;
       // }
    }
    
    // set min score if set by sco
    if(scoreMin != undefined && scoreMin != "")
    {
       scoreSet = true;
       resultSet = true;
       scoreJson.min =  parseFloat(scoreMin);
    }

    // set max score if set by sco
    if(scoreMax != undefined && scoreMax != "")
    {
       scoreSet = true;
       resultSet = true;
       scoreJson.max =  parseFloat(scoreMax);
    }

    // set the score object in with the rest of the result object
    if (scoreSet)
    {
       resultJson.score = scoreJson;
    }

    // add result to the base statement
    if (resultSet)
    {
       baseStatement.result = resultJson;
    }

    return baseStatement;
 } 

 var setActivityState = function()
 {
    // window.localStorage[activity] uses activity id to return the most recent
    // attempt
    var attemptIri = window.localStorage[activity];

    var agent = getAgent();

    // see if the profile is already set

    var stateData = {
      activity: activity,
      agent: agent,
      stateid: constants.activityStateIri,
    };
    console.log("setActivityState : ");
    console.log(stateData);
    //var as = ADL.XAPIWrapper.getState(activity, agent, constants.activityStateIri);
    socket.emit('getXapiState',stateData, function (data){
      console.log("setActivityState - getXapiState");
      var as = data;
      console.log(as);
      // First time, create a new one
      if (as.resp.statusCode == 404)
      {

        stateData.state = {attempts: [attemptIri]}; 
        stateData.matchHash = "*";
        stateData.virg = true;
        socket.emit('sendXapiState',stateData, function (data){
          console.log("setActivityState - sendXapiState");
          console.log(data.resp.statusCode);
          setActivityProfile();
        });
        // ADL.XAPIWrapper.sendState(activity, agent, constants.activityStateIri, null, {attempts:[attemptIri]});
      }
      else
      {
         // update state
        var newAs = JSON.parse(as.bdy);
        console.log(as.bdy);
        stateData.state = newAs;
        stateData.matchHash = as.bdy;
        stateData.virg = false;

        stateData.state.attempts.push(attemptIri);
        //state.attempts = {attempts: [attemptIri]}; 
        socket.emit('sendXapiState',stateData, function (data){
          console.log("setActivityState - sendXapiState");
          console.log(data.resp.statusCode);
          setActivityProfile();
        });
         //ADL.XAPIWrapper.sendState(activity, agent, constants.activityStateIri, null, newAs, ADL.XAPIWrapper.hash(asStr));         
      }
    });


 }

var setActivityProfile = function()
{      

  var profile = {
    activityid: activity,
    profileid: constants.activityProfileIri

  };
  // see if the profile is already set
  //var ap = ADL.XAPIWrapper.getActivityProfile(activity, constants.activityProfileIri);

  socket.emit('getXapiActivityProfile', profile, function(data){
    console.log("setActivityProfile - getXapiActivityProfile");
    var ap = data;
    console.log(ap);
    if(ap.resp.statusCode == 404 )
    {
       // get comments from lms (if any)
       //var cmi_num_comments_from_lms_count = retrieveDataValue("cmi.comments_from_lms._count");
       // todo: get the comments, if any and add to array
       //TODO: implement these values in lms
       // get completion threshold (if supplied in manifest)
       var cmi_completion_threshold = "";// retrieveDataValue(scormVersionConfig.completionThresholdElement);
       var cmi_launch_data = "";//retrieveDataValue(scormVersionConfig.launchDataElement);
       var cmi_max_time_allowed = "";//retrieveDataValue(scormVersionConfig.maxTimeAllowedElement);
       var cmi_scaled_passing_score = "";//retrieveDataValue(scormVersionConfig.scaledPassingScoreElement);
       var cmi_time_limit_action = "";//retrieveDataValue(scormVersionConfig.timeLimitActionElement);

       var activityProfile = {};

       if (cmi_completion_threshold != "")
          activityProfile.completion_threshold = cmi_completion_threshold;

       if (cmi_launch_data != "")
          activityProfile.launch_data = cmi_launch_data;
       
       if (cmi_max_time_allowed != "")
          activityProfile.max_time_allowed = cmi_max_time_allowed;

       if (cmi_scaled_passing_score != "")
          activityProfile.scaled_passing_score = cmi_scaled_passing_score;

       if (cmi_time_limit_action != "")
          activityProfile.time_limit_action = cmi_time_limit_action;

      profile.profile = activityProfile;
      socket.emit('sendXapiActivityProfile',profile, function (data){
        console.log("setActivityProfile - sendXapiActivityProfile");
        console.log(data.resp.statusCode);
        setAttemptState();
      });
       //ADL.XAPIWrapper.sendActivityProfile(activity, constants.activityProfileIri, activityProfile, null, "*");
    }
    else{
      setAttemptState();
    }
  });

}

var setAttemptState = function()
{
  var attemptIri = window.localStorage[activity];

  var agent = getAgent();  

  var stateData = {
    activity: attemptIri,
    agent: agent,
    stateid: constants.attemptStateIri,
  };



  var preferences = {
                       language: cmi_language,
                       audio_level: cmi_audio_level,
                       delivery_speed: cmi_delivery_speed,
                       audio_captioning: cmi_audio_captioning
                    };



  // todo: implement adl.data buckets and store in attempt state

  // create the state object
  var state = {}; 
     
  if (cmi_location != "")
     state.location = cmi_location;

  state.preferences = preferences;

  if (cmi_credit != "")
     state.credit = cmi_credit;

  if (cmi_mode != "")
     state.mode = cmi_mode;

  if (cmi_suspend_data != "")
     state.suspend_data = cmi_suspend_data;

  if (cmi_total_time != "")
     state.total_time = cmi_total_time; 

  console.log("setAttemptState : ");
  console.log(stateData);
  socket.emit('getXapiState',stateData, function (data){
    console.log("setAttemptState - getXapiState");
    var as = data;
    console.log(as);
    // First time, create a new one
    if (as.resp.statusCode == 404)
    {    
      stateData.state = state; 
      stateData.virg = true;
      socket.emit('sendXapiState',stateData, function (data){
        console.log("setAttemptState - sendXapiState");
        console.log(data.resp.statusCode);
        var startVerb = isResumed ? ADL.verbs.resumed : ADL.verbs.initialized;
        // // Execute the statement
        sendSimpleStatement(startVerb);  
      });      
    }
    else{
      stateData.state = state;
      stateData.matchHash = as.bdy;
      stateData.virg = false;
      socket.emit('sendXapiState',stateData, function (data){
        console.log("setAttemptState - sendXapiState");
        console.log(data.resp.statusCode);
        var startVerb = isResumed ? ADL.verbs.resumed : ADL.verbs.initialized;
        // // Execute the statement
        sendSimpleStatement(startVerb);          
      });       
    }
  });
}

var getAgent = function(){
  return new ADL.XAPIStatement.Agent(ADL.XAPIWrapper.hash(user.username), user.firstName+" "+user.lastName);
}

var sendSimpleStatement = function(verb)
{
  var stmt = getBaseStatement();           
  stmt.verb = verb;
  console.log("sendSimpleStatement : " + verb);
  socket.emit('sendXapiStatement',stmt, function (data){
      //TODO: 500 error coming back from ADL LRS
      console.log("sendSimpleStatement - sendXapiStatement");
      console.log(data.resp.statusCode);
      console.log(data.bdy);  
  });

}

var getBaseStatement = function()
{
  var emptyVerb = {verb:{}};
  var stmt =  new ADL.XAPIStatement(
      new ADL.XAPIStatement.Agent(ADL.XAPIWrapper.hash(user.username), user.firstName+" "+user.lastName),
      emptyVerb,
      new ADL.XAPIStatement.Activity(currentLesson.path, currentLesson.name, currentLesson.name + ' lesson')
  );
  stmt.generateId();
  //stmt.generateRegistration(); 
  stmt.object.definition.type = 'http://adlnet.gov/expapi/activities/lesson';
  stmt.context = {
        "contextActivities":{
           "grouping":[
              {
                 "id": currentLesson.parentDir,
                 "definition":{
                    "name":{
                       "en-US": currentLesson.parent.name
                    },
                    "description":{
                       "en-US":"The activity representing the course " + currentLesson.parent.name
                    },
                    "type": "http://adlnet.gov/expapi/activities/course"
                 }
              },
              {
                 "id": currentLesson.path + "?attemptId="+ attemptId,
                 "definition":{
                    "name":{
                       "en-US":"Attempt of " + currentLesson.name
                    },
                    "description":{
                       "en-US":"The activity representing an attempt of "+currentLesson.name+" in the course " + currentLesson.parent.name
                    },
                    "type": "http://adlnet.gov/expapi/activities/attempt"
                 }
              }
           ],
           "category": [
              {
                 "id": "https://w3id.org/xapi/adl/profiles/scorm"
              }
           ]
        }
    };   

    return stmt; 
}



