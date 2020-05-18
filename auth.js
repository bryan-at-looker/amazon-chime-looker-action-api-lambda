const generatePolicy = function(principalId, effect, resource) {
  const authResponse = {};
  authResponse.principalId = principalId;
  if (effect && resource) {
    const policyDocument = {};
    policyDocument.Version = '2012-10-17';
    policyDocument.Statement = [];
    const statementOne = {};
    statementOne.Action = 'execute-api:Invoke';
    statementOne.Effect = effect;
    statementOne.Resource = resource;
    policyDocument.Statement[0] = statementOne;
    authResponse.policyDocument = policyDocument;
  }
  return authResponse;
};

module.exports.auth = (event, context, callback) => {
  
  var token = (event.authorizationToken) ? event.authorizationToken : '';
  var looker_auth = 'Token token="' + process.env.LOOKER_AUTHORIZATION + '"';
  

  // In this example, the token is treated as the status for simplicity.
  switch (token === looker_auth) {
    case true:
      callback(null, generatePolicy('user', 'Allow', event.methodArn));
      break;
    case false:
      callback('Unauthorized');
      break;
    default:
      callback('Error');
  }
};