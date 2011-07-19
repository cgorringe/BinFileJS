// unit_test.js
// Copyright (c) 2011 Carl Gorringe <car1@gorringe.org>
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license
// https://github.com/cgorringe/BinFileJS
// 3/28/2011

// @requires binfile.js

function outSource(x) {
  if (x.toSource) { return x.toSource(); }
  else if (JSON && JSON.stringify) { return JSON.stringify(x); }
  else { return x.toString(); }
}

function init() {
  var uagent = document.getElementById('uagent');
  uagent.innerHTML = navigator.userAgent;
  printStructs();
}

function tempNums() {
    document.write(Number.MIN_VALUE + '<br/>');
    document.write(Number.MAX_VALUE + '<br/>');
    document.write(Number.NEGATIVE_INFINITY + '<br/>');
    document.write(Number.POSITIVE_INFINITY + '<br/>');
    document.write(Number.NaN + '<br/>');
}

function printStructs() {
  var debug1 = document.getElementById('debug1');
  debug1.innerHTML = outSource(BinStruct.types);
}

function fillTable(tableID, data, idCol, testCol, readCol) {
  var tbl = document.getElementById(tableID);
  var tbody = tbl.getElementsByTagName("tbody")[0];
  var rows = tbody.getElementsByTagName("tr");
  for (i=0; i < rows.length; i++) {
    var id = rows[i].getElementsByTagName("td")[idCol];
    var ts = rows[i].getElementsByTagName("td")[testCol];
    var rd = rows[i].getElementsByTagName("td")[readCol];
    var txt = data[id.innerHTML].toString();
    txt = txt.replace(/\,/g , ', ');  // add a space after any commas for wrapping
    rd.innerHTML = txt;
    rd.className = (ts.innerHTML == rd.innerHTML) ? "passed" : "failed";
  }
}

function runUnitTests(filename) {

  BinStruct.struct('UnitTestStruct', [
    ['int32',  'magic' ],
    // 8-bit ints
    ['int8',   'a1'    ],
    ['int8',   'a2'    ],
    ['int8',   'a3'    ],
    ['int8',   'a4'    ],
    ['uint8',  'a5'    ],
    ['uint8',  'a6'    ],
    ['int8',   'a7', 4 ],
    // 16-bit ints
    ['int16',  'b1'    ],
    ['int16',  'b2'    ],
    ['int16',  'b3'    ],
    ['int16',  'b4'    ],
    ['uint16', 'b5'    ],
    ['uint16', 'b6'    ],
    ['int16',  'b7', 4 ],
    // 32-bit ints
    ['int32',  'c1'    ],
    ['int32',  'c2'    ],
    ['int32',  'c3'    ],
    ['int32',  'c4'    ],
    ['uint32', 'c5'    ],
    ['uint32', 'c6'    ],
    ['int32',  'c7', 4 ],
    // 32-bit floats
    ['float',  'd1'    ],
    ['float',  'd2'    ],
    ['float',  'd3'    ],
    ['float',  'd4'    ],
    ['float',  'd5'    ],
    ['float',  'd6'    ],
    ['float',  'd7'    ],
    ['float',  'd8'    ],
    ['float',  'd9'    ],
    // 64-bit doubles
    ['double', 'e1'    ],
    ['double', 'e2'    ],
    ['double', 'e3'    ],
    ['double', 'e4'    ],
    ['double', 'e5'    ],
    ['double', 'e6'    ],
    ['double', 'e7'    ],
    ['double', 'e8'    ],
    ['double', 'e9'    ]
  ]);
  printStructs();

  // open & read unit test binary file
  var fh = new BinFile();
  if(!fh.open(filename)) {
    alert("Couldn't open " + filename);
    return;
  }
  var littleData = fh.read('UnitTestStruct');

  // now re-read as big-endian
  fh.rewind();
  fh.setByteOrder('big');
  var bigData = fh.read('UnitTestStruct');

  // output JSON
  document.getElementById('debug2').innerHTML = outSource(littleData);
  document.getElementById('debug3').innerHTML = outSource(bigData);

  // output to table
  fillTable('int_table',   littleData, 1, 2, 3);
  fillTable('int_table',   bigData,    1, 4, 5);
  fillTable('float_table', littleData, 1, 2, 3);

  fh.close();
}

