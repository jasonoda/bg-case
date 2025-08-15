/**
 * This function should return an object that looks like this:
 *
 * {
 *   isValid: true | false,
 *   reasons: [] // an array of strings
 * }
 *
 * @param initialGameData This is the same data structure passed to the iFrame using the window.CG_API.InitGame message
 * @param breadcrumbs This is an array of breadcrumb objects received from the game using the window.GC_API.BreadCrumb message
 * @param finalGameData This is the final score object sent from the game using the window.GC_API.FinalScores message
 */

const validateGameDataCode = 
`
function validateGameData(initialGameData, breadcrumbs, finalGameData) {

  // add final breadcrumb

  breadcrumbs.push(finalGameData.metadata.breadcrumb);

  console.log("validate game data");
  
  var isValid = true;
  var reasons = [];

  console.log("---------------------------------------");

  for(var i=0; i<breadcrumbs.length; i++){

    console.log(i);
    console.log(breadcrumbs[i]);

  }

  console.log("---------------------------------------");

  console.log(finalGameData);

  console.log("---------------------------------------");

  // ---------------------------------------------------------------------------------------------
  // check score
  // ---------------------------------------------------------------------------------------------

  this.scoreCheck = 0;

  for(var i=0; i<breadcrumbs.length; i++){

    var b = breadcrumbs[i]
    if(b.levelScore!==undefined){
         this.scoreCheck+=b.levelScore;
    }
   
  }

  if(this.scoreCheck!==finalGameData.score){
    
    reasons.push("SCORE DID NOT ADD UP "+this.scoreCheck+" / "+finalGameData.score);
    isValid=false;

  }
  
  // ---------------------------------------------------------------------------------------------
  // check level times
  // ---------------------------------------------------------------------------------------------

   for(var i=0; i<breadcrumbs.length; i++){

    if(breadcrumbs[i].levelTime>17.5){
            
        reasons.push("OVER TIME LIMIT "+breadcrumbs[i].levelTime);
        isValid=false;

    }
   
  }

  // ---------------------------------------------------------------------------------------------
  // check game scores
  // ---------------------------------------------------------------------------------------------

  this.scoreCheck = 0;

  console.log(finalGameData.gameScores.length);

  for(var i=0; i<finalGameData.gameScores.length; i++){

    var b = finalGameData.gameScores[i]
    if(b!==undefined){
         this.scoreCheck+=b;
    }

  }

  if(this.scoreCheck!==finalGameData.score){
    
    reasons.push("GAME SCORES DID NOT ADD UP "+this.scoreCheck+" / "+finalGameData.score);
    isValid=false;

  }
  
  // ---------------------------------------------------------------------------------------------
  // check if extra breadcrumbs were added
  // ---------------------------------------------------------------------------------------------

  if( breadcrumbs.length > finalGameData.level){

    reasons.push("TOO MANY BREADCRUMBS "+breadcrumbs.length+" / "+finalGameData.level);
    isValid=false;

  }
  
  // ---------------------------------------------------------------------------------------------
  // end
  // ---------------------------------------------------------------------------------------------

  console.log("---------------------------------------");

  console.log(isValid);

  for(var i=0; i<reasons.length; i++){

    console.log( reasons[i] );

  }

  console.log("---------------------------------------");

  var status = {
    isValid: isValid,
    reasons: reasons
  }

  return status

}
`