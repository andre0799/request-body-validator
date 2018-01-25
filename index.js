var cleanupArray = function(arr) {
  if (!Array.isArray(arr)) {
    console.warn('cleanupArray received an object that is not an array')
    return
  }

  var res = []

  if (!arr.length) return true
  for (var i = 0; i < arr.length; i++) {
    if ((Array.isArray(arr[i]) && arr[i].length) ||
      (typeof arr[i] == 'object' && !Array.isArray(arr[i]) && Object.keys(arr[i]).length > 0) ||
      (typeof arr[i] == 'string' && arr[i])) {
      // index has a value
      res.push(arr[i])
    }
  }

  return res
}

var isArrayEmpty = function(arr) {
  if (!Array.isArray(arr)) {
    console.warn('isArrayEmpty received an object that is not an array')
    return
  }

  if (!arr.length) return true
  for (var i = 0; i < arr.length; i++) {
    if ((Array.isArray(arr[i]) && arr[i].length) ||
      (typeof arr[i] == 'object' && !Array.isArray(arr[i]) && Object.keys(arr[i]).length > 0) ||
      (typeof arr[i] == 'string' && arr[i])) {
      return false
    }
  }

  return true
}

var bodyValidator = function(obj, requiredProps, optionalProps, shouldReturnValidKeys) {
  var _this = this
  var validateObj = Object.assign({}, obj)
  var validatedObj = {}
  var validKeys = {}

  var validated = true

  var checkNesting = function(prop, isRequired, validationFunction) {
    // debugger;
    var currentNesting = validateObj
    var currentValidatedObjNesting = validatedObj
    var currentInvalidObjNesting = validKeys
    for (var j = 0; j < prop.length; j++) {
      var propKey = prop[j] // 'title' || 'localization' || 'city'

      var nextPropValue = currentNesting[propKey]
      if (typeof nextPropValue == 'string' && nextPropValue.length > 0) nextPropValue = nextPropValue.trim()
      currentNesting = nextPropValue

      if (shouldReturnValidKeys) {
        if (typeof currentNesting == 'object' && !Array.isArray(currentNesting)) {
          if (currentInvalidObjNesting[propKey] === undefined) {
            currentInvalidObjNesting[propKey] = Object.assign({}, currentNesting)
          }
          currentInvalidObjNesting = currentInvalidObjNesting[propKey]
        } else {
          if ((currentNesting === null ||
              currentNesting === undefined ||
              currentNesting === "" ||
              (Array.isArray(currentNesting) && isArrayEmpty(currentNesting)) ||
              (validationFunction ? !validationFunction(currentNesting) : false)) &&
            isRequired
          ) {
            currentInvalidObjNesting[propKey] = false
          } else {
            currentInvalidObjNesting[propKey] = true
          }
        }
      }

      if (currentNesting === false && propKey != 'active') console.log('Property values that equal \'false\' are considered as they are not there, therefore don\'t pass validation. Beaware for: ' + propKey)
      if (propKey == 'active') console.log('Property with key "active" are always validated as true')
      if (currentNesting === null ||
        currentNesting === undefined ||
        (currentNesting === "" && isRequired) ||
        (Array.isArray(currentNesting) && isArrayEmpty(currentNesting)) ||
        (isRequired && (typeof currentNesting != 'object' || Array.isArray(currentNesting)) && validationFunction ? !validationFunction(currentNesting) : false) ||
        (isRequired && currentNesting === false && propKey != "active")
      ) {
        delete currentValidatedObjNesting[propKey]
        return false
      } else {
        // this adds all validated values to the validatedObj which will be returned
        if (typeof currentNesting == 'object' && !Array.isArray(currentNesting) && currentValidatedObjNesting[propKey] === undefined) {
          currentValidatedObjNesting[propKey] = {}
        } else if (currentValidatedObjNesting[propKey] === undefined) {
          if (Array.isArray(currentNesting)) currentValidatedObjNesting[propKey] = cleanupArray(currentNesting)
          else currentValidatedObjNesting[propKey] = currentNesting
        }
        currentValidatedObjNesting = currentValidatedObjNesting[propKey]
      }
    }

    return true
  }

  // Loop through requiredProps
  for (var i = 0; i < requiredProps.length; i++) {
    var prop = requiredProps[i] // ['title']

    if (Array.isArray(prop)) {
      if (!checkNesting(prop, true)) {
        validated = false
      }

    } else {
      if (prop.conditions) {
        var conditions = prop.conditions // [['localization','city'],['localization','state']] || [['localization','zipcode']]
          // debugger;
        var anyIsTrue = conditions.reduce(function(anyIs, conditionalProp) {
          // debugger;
          var allAreTrue = true
          for (var c = 0; c < conditionalProp.length; c++) {
            if (Array.isArray(conditionalProp[c])) {
              if (!checkNesting(conditionalProp[c], true)) {
                allAreTrue = false
              }
            } else if (typeof conditionalProp[c] == 'object' && conditionalProp[c].validation && typeof conditionalProp[c].validation == "function") {
              if (!checkNesting(conditionalProp[c].props, true, conditionalProp[c].validation)) {
                allAreTrue = false
              }
            }
          }

          if (allAreTrue) return true
          else return anyIs
        }, false)

        if (!anyIsTrue) {
          validated = false
        }
      } else if (prop.props && Array.isArray(prop.props) && prop.validation && typeof prop.validation == 'function') {
        if (!checkNesting(prop.props, true, prop.validation)) validated = false
      }
    }
  }

  // Loop through optionalProps
  for (var i = 0; i < optionalProps.length; i++) {
    var prop = optionalProps[i] // ['title']
    checkNesting(prop, false)
  }

  var res = {
    validated: validated,
    validatedObj: validatedObj,
    validKeys: validKeys
  }

  return res
}


module.exports = bodyValidator
