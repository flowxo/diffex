'use strict';

var chai = require('chai'),
    expect = chai.expect,
    diffex = require('../lib/index.js');

describe('Parse', function() {
  var runTest = function(template, input, expected) {
    var actual = diffex(template).parse(input);
    expect(actual).to.eql(expected);
  };

  it('should get a single variable from a template', function() {
    var template = 'Hello, {{name}}';
    var input = 'Hello, Bob';
    var expected = {
      name: 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should get multiple variables from a template', function() {
    var template = 'Hello, {{name}} it\'s {{now}} today.';
    var input = 'Hello, Bob it\'s Saturday today.';
    var expected = {
      name: 'Bob',
      now: 'Saturday'
    };

    runTest(template, input, expected);
  });

  it('should support a variable name containing an underscore', function() {
    var template = 'Hello, {{first_name}}';
    var input = 'Hello, Bob';
    var expected = {
      'first_name': 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should support a variable name containing a hyphen', function() {
    var template = 'Hello, {{first-name}}';
    var input = 'Hello, Bob';
    var expected = {
      'first-name': 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should support a variable name which is an absolute subset of the received value', function() {
    var template = 'Today is {{day}}';
    var input = 'Today is Saturday';
    var expected = {
      'day': 'Saturday'
    };

    runTest(template, input, expected);
  });

  it('should support a variable name which is a partial subset of the received value', function() {
    var template = 'Today is {{todayyy}}';
    var input = 'Today is Saturday';
    var expected = {
      'todayyy': 'Saturday'
    };

    runTest(template, input, expected);
  });

  it('should support a value with a space', function() {
    var template = 'Hello, {{name}}';
    var input = 'Hello, Bob Bobson';
    var expected = {
      name: 'Bob Bobson'
    };

    runTest(template, input, expected);
  });

  it('should support a variable in the middle of a word', function() {
    var template = 'Heading is "{{heading}}"';
    var input = 'Heading is "nice"';
    var expected = {
      'heading': 'nice'
    };

    runTest(template, input, expected);
  });

  it('should not support a template key with a space', function() {
    // This test would actually run if we relaxed
    // the interpolation, but we need more logic
    // to handle a template key and a value with spaces,
    // as our diffing algorithm would count the two
    // spaces as unchanged text.
    var template = 'Hello, {{full name}}';
    var input = 'Hello, Bob';
    var expected = {};

    runTest(template, input, expected);
  });

  it('should not support a template key and a value with a space', function() {
    var template = 'Hello, {{full name}}';
    var input = 'Hello, Bob Bob Bobson';
    var expected = {};

    runTest(template, input, expected);
  });

  it('should support line breaks', function() {
    var template = 'Hello, \n{{name}}';
    var input = 'Hello, \nBob';
    var expected = {
      'name': 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should support line breaks in different places, #1', function() {
    // This is to support email clients who add a
    // newline at specific intervals in the text.
    // We could therefore end up with the template
    // and the actual email containing the same data,
    // but with text wrapped at different stages.
    // eg: https://mathiasbynens.be/notes/gmail-plain-text
    var template = 'Hello, \n{{name}} how are you today?\n';
    var input = 'Hello, Bob \nhow are \nyou today?';
    var expected = {
      'name': 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should support line breaks in different places, #2', function() {
    // This is to support email clients who add a
    // newline at specific intervals in the text.
    // We could therefore end up with the template
    // and the actual email containing the same data,
    // but with text wrapped at different stages.
    // eg: https://mathiasbynens.be/notes/gmail-plain-text
    var template = 'Hello, {{name}} \nhow are you today?\n';
    var input = 'Hello, \nBob how are \nyou today?';
    var expected = {
      'name': 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should support line breaks inside the value', function() {
    var template = 'Hello, {{name}}';
    var input = 'Hello, Bob\nBobson';
    var expected = {
      'name': 'Bob\nBobson'
    };

    runTest(template, input, expected);
  });

  it('should support blank values', function() {
    var template = 'Hello, {{name}} it\'s {{now}} today.';
    var input = 'Hello,  it\'s Saturday today.';
    var expected = {
      now: 'Saturday'
    };

    runTest(template, input, expected);
  });

  it('should take the first non-empty value in the template', function() {
    var template = 'Hello, {{name}}. I am {{name}}.';
    var input = 'Hello, Bob. I am Jim.';
    var expected = {
      'name': 'Bob'
    };

    runTest(template, input, expected);
  });

  it('should take the first non-empty value in the template', function() {
    var template = 'Hello, {{name}}. I am {{name}}.';
    var input = 'Hello, . I am Jim.';
    var expected = {
      'name': 'Jim'
    };

    runTest(template, input, expected);
  });

  it('should parse a real-world example', function() {
    var template = 'The direct debit of customer {{name}} at {{company}} for £{{amount}} on {{date}} has failed.';
    var input = 'The direct debit of customer John Doe at ABC Limited for £60 on 07/10/2015 has failed.';
    var expected = {
      name: 'John Doe',
      company: 'ABC Limited',
      amount: '60',
      date: '07/10/2015'
    };

    runTest(template, input, expected);
  });

  it('should parse a real-world (difficult) example', function() {
    var template = 'The direct debit of customer {{name}} at {{company}} for £{{amount}} on {{date}} has failed.';
    var input = 'The direct debit of customer John at Doe at ABC for Limited for £60 on 07/10/2015 has failed.';
    var expected = {
      name: 'John at Doe',
      company: 'ABC for Limited',
      amount: '60',
      date: '07/10/2015'
    };

    runTest(template, input, expected);
  });

  it('should parse a real-world (difficult) example with pesky line breaks', function() {
    var template = 'The direct debit of customer {{name}} at {{company}} \nfor £{{amount}} on {{date}} has failed.';
    var input = 'The direct debit of customer John at Doe at ABC \nfor Limited for £60 on 07/10/2015 has failed.';
    var expected = {
      name: 'John at Doe',
      company: 'ABC \nfor Limited',
      amount: '60',
      date: '07/10/2015'
    };

    runTest(template, input, expected);
  });
});

describe('Placeholder', function() {
  var runTest = function(template, expected) {
    var actual = diffex(template).placeholders();
    expect(actual).to.eql(expected);
  };

  it('should return an array of placeholder names', function() {
    var template = 'Hi there {{name}}, today is {{today}} and tomorrow is {{tomorrow}}.';
    var expected = ['name', 'today', 'tomorrow'];
    runTest(template, expected);
  });

  it('should return an empty array if there are no placeholders', function() {
    var template = 'No placeholders here!';
    var expected = [];
    runTest(template, expected);
  });

  it('should return an empty array if the template is not a string', function() {
    var template = null;
    var expected = [];
    runTest(template, expected);
  });
});
