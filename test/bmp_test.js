// bmp_test.js
// Copyright (c) 2011 Carl Gorringe <car1@gorringe.org>
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license
// https://github.com/cgorringe/BinFileJS
// 4/2/2011

// @requires binfile.js

// --- Helper functions ---
function outSource(x) {
  if (x.toSource) { return x.toSource(); }
  else if (JSON && JSON.stringify) { return JSON.stringify(x); }
  else { return x.toString(); }
}

function printStructs() {
  var debug1 = document.getElementById('debug1');
  debug1.innerHTML = outSource(BinStruct.types);
}

function clearStructs() {
  document.getElementById('debug1').innerHTML = '';
}

function clearDebug() {
  document.getElementById('debug1').innerHTML = '';
  document.getElementById('debug2').innerHTML = '';
  document.getElementById('debug3').innerHTML = '';
  document.getElementById('debug4').innerHTML = '';
}

// draw colored blocks
function drawPalette(palette) {
  var clr, html = '';
  for (var i=0; i < palette.length; i++) {
    clr = 'rgb('+ palette[i].R +','+ palette[i].G +','+ palette[i].B +')';
    html += '<span class="colorBlock" style="background:'+ clr +'" title="'+ i + ' : ' + clr +'"></span> ';
    if (i % 16 == 15) { html += '<br/>'; }
  }
  document.getElementById('imgPalette').innerHTML = html;
}

// --- Test functions ---
function testSize(filename) {
  var fh = new BinFile();
  fh.open(filename);
  alert('file size of ' + filename + ' is ' + fh.size());
  fh.close();
}

function testBMP(filename) {
  var debug2 = document.getElementById('debug2');
  var debug3 = document.getElementById('debug3');
  var debug4 = document.getElementById('debug4');

  // define BMP format structs
  BinStruct.struct('bmp_head', [
    ['chars'  , 'magic'  , 2],
    ['uint32' , 'filesz'    ],
    ['uint16' , 'creator1'  ],
    ['uint16' , 'creator2'  ],
    ['uint32' , 'bmp_offset']
  ]);

  BinStruct.struct('bmp_info', [
    ['uint32' , 'header_sz'    ],
    ['int32'  , 'width'        ],
    ['int32'  , 'height'       ],
    ['uint16' , 'nplanes'      ],
    ['uint16' , 'bitspp'       ],
    ['uint32' , 'compress_type'],
    ['uint32' , 'bmp_bytesz'   ],
    ['int32'  , 'hres'         ],
    ['int32'  , 'vres'         ],
    ['uint32' , 'ncolors'      ],
    ['uint32' , 'nimpcolors'   ]
  ]);

  BinStruct.struct('bmp_color', [
    ['uint8' , 'B'],
    ['uint8' , 'G'],
    ['uint8' , 'R'],
    ['uint8' , 'A']
  ]);

  // show image
  var imgTitle = document.getElementById('imgTitle');
  var imgPix = document.getElementById('imgPix');
  imgTitle.innerHTML = filename;
  imgPix.src = filename;

  // open image file for binary reading
  var fh = new BinFile();
  fh.open(filename);

  var bmp_head = fh.read('bmp_head');
  debug2.innerHTML = '<br/><h3>bmp_head:</h3><br/>' + outSource(bmp_head);

  var bmp_info = fh.read('bmp_info');
  debug3.innerHTML = '<br/><h3>bmp_info:</h3><br/>' + outSource(bmp_info);

  // retrieve color palette, if present
  if (bmp_info.ncolors > 0) {
    var pos = BinStruct.sizeof('bmp_head') + bmp_info.header_sz;
    fh.seek(pos);

    var bmp_palette = fh.read('bmp_color', bmp_info.ncolors);
    debug4.innerHTML = '<br/><h3>bmp_palette:</h3><br/>' + outSource(bmp_palette);
    drawPalette(bmp_palette);
  }
  else {
    debug4.innerHTML = '';
    drawPalette([]);
  }

  fh.close();
}

