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

    var matchRegex = getMatchRegex(options);

    var removed = '', added = '', rtn = {};

    // Track the most recently removed and added.
    // When we get to another removed block,
    // parse the previous added/removed.
    var process = function() {
      var matches = removed.match(matchRegex);
      if(matches && added) {
        var key = matches[1].trim();
        if(key && !rtn[key]) {
          rtn[key] = added.trim();
        }
      }

      removed = '';
      added = '';
    };


    diff.forEach(function(item) {
      item.value = item.value || '';
      if(item.removed) {
        process();
        removed += item.value;
      } else if(item.added) {
        added += item.value;
      }
    });

    process();

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
