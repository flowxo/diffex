'use strict';

var _ = require('lodash'),
    DiffMatchPatch = require('./diff-match-patch.js').diff_match_patch;

var getDefaultOptions = function(options) {
  return _.defaults(options || {}, {
    open: '{{',
    close: '}}'
  });
};

var getMatchRegex = function(options, flags) {
  flags = flags || '';
  return new RegExp(options.open + '(\\S+)' + options.close, flags);
};

var getDiff = function(str, template, options) {
  var dmp = new DiffMatchPatch();
  dmp.Diff_Timeout = 0;
  dmp.Diff_EditCost = 4;

  var diff = dmp.diff_main(template, str);
  dmp.diff_cleanupEfficiency(diff);

  var removed, added, collectingCommon = false;

  // Combine any 'common' values,
  // and return an array of diff objects.
  return diff.reduce(function(rtn, item) {
    var code = item[0],
        value = item[1];

    switch(code) {
      case -1:
        var startsWithCurlys = value.trim().startsWith(options.open);
        var endsWithCurlys = value.trim().endsWith(options.close);

        if(startsWithCurlys && endsWithCurlys) {
          rtn.push({ removed: true, value: value });

        } else if(startsWithCurlys) {
          // Begin collection of common data.
          collectingCommon = true;
          removed = value;
          added = '';

        } else if(endsWithCurlys) {
          // End collection of common data.
          removed += value;
          rtn.push({ removed: true, value: removed });
          rtn.push({ added: true, value: added });

          collectingCommon = false;
          removed = null;
          added = null;

        } else {
          // just push as normal.
          rtn.push({ removed: true, value: value });
        }
      break;

      case 0:
        if(collectingCommon) {
          // Goes into both key and value.
          removed += value;
          added += value;
        } else {
          // Regular push.
          rtn.push({ value: value });
        }
      break;

      case 1:
        if(collectingCommon) {
          added += value;
        } else {
          rtn.push({ added: true, value: value });
        }
      break;
    }

    return rtn;
  }, []);
};

var composeParser = function(template, options) {
  return function(str) {
    if(!_.isString(str) || !_.isString(template)) {
      return {};
    }

    var diff = getDiff(str, template, options);
    if(!diff) {
      return {};
    }

    var key = null,
        val = null,
        runningVal = '',
        shouldTakeRunning = false,
        rtn = {};

    var matchRegex = getMatchRegex(options);

    diff.forEach(function(item) {
      item.value = item.value || '';
      runningVal += item.value;

      if(item.removed) {
        // Try an find an interpolation key.
        var matches = item.value.match(matchRegex);
        if(matches) {
          // matches array:
          // [0]: full value
          // [1]: text inside '{{ }}'
          key = matches[1].trim();
          runningVal = '';
          shouldTakeRunning = true;
        }

      } else if(item.added) {
        if(!shouldTakeRunning) {
          // Discard everything before this.
          val = item.value;
        } else {
          val = runningVal;
        }
        shouldTakeRunning = true;
      }

      if(key && val) {
        // Only store if we don't already have this key.
        if(!rtn[key]) {
          val = val.trim();
          if(val) {
            rtn[key] = val;
          }
        }
        key = null;
        val = null;
      }
    });

    return rtn;
  };
};

var composePlaceholders = function(template, options) {
  return function() {
    var placeholders = [];

    if(_.isString(template)) {
      var matchRegex = getMatchRegex(options, 'g');
      var p;
      while((p = matchRegex.exec(template))) {
        placeholders.push(p[1]);
      }
    }

    return placeholders;
  };
};

module.exports = function(template, options) {
  options = getDefaultOptions(options);
  return {
    parse: composeParser(template, options),
    placeholders: composePlaceholders(template, options)
  };
};
