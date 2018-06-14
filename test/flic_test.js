// flic_test.js
// Copyright (c) 2011 Carl Gorringe (carl.gorringe.org)
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license
// https://github.com/cgorringe/BinFileJS
// 3/31/2011
// works in Firefox 3.6 and Chrome 10
// doesn't work in IE or Opera

// @requires binfile.js

// --- Helper functions ---
function outSource(x) {
  if (x.toSource) { return x.toSource(); }
  else if (JSON && JSON.stringify) { return JSON.stringify(x); }
  else { return x.toString(); }
}

function printStructs() {
  document.getElementById('debug1').innerHTML = outSource(BinStruct.types);
}

function clearStructs() {
  document.getElementById('debug1').innerHTML = '';
}

function clearDebug() {
  document.getElementById('debug1').innerHTML = '';
  document.getElementById('debug2').innerHTML = '';
}

// draw colored blocks
function drawPalette() {
  var clr, html = '';
  for (var i=0; i < FLI_R.length; i++) {
    clr = 'rgb('+ FLI_R[i] +','+ FLI_G[i] +','+ FLI_B[i] +')';
    html += '<span class="colorBlock" style="background:'+ clr +'" title="'+ i + ' : ' + clr +'"></span> ';
    if (i % 16 == 15) { html += '<br/>'; }
  }
  document.getElementById('imgPalette').innerHTML = html;
}

// --- FLIC Player ---

var FLIfile, FLIhead, FLIcanvas, FLIg, FLIimg, FLIi;
var FLI_R, FLI_G, FLI_B;  // color palette
var FLIframeNum;
var FLItimer, FLIpause, FLIplaying, FLIframe1pos;

  function initFLI() {
    // TODO: resize canvas using FLIhead.width & FLIhead.height?
    FLIcanvas = document.getElementById('FLIcanvas');
    if (!FLIcanvas) { alert('FLIcanvas is missing!'); return; }
    FLIg = FLIcanvas.getContext('2d');
    FLIg.clearRect(0, 0, FLIcanvas.width, FLIcanvas.height);    // clear canvas
    document.getElementById('imgPalette').innerHTML = '';       // clear palette
    document.getElementById('FLIcount').innerHTML = '0/' + FLIhead.frames;

    FLIimg = FLIg.createImageData(FLIhead.width, FLIhead.height);
    FLIi = FLIg.createImageData(FLIhead.width / 4, FLIhead.height);  // 1/4th size holds indexed color values
    FLIframeNum = 1;
    FLIplaying = false;

    if (FLIhead.magic == 0xAF11) {
      FLIpause = Math.round(FLIhead.speed * 1000 / 70);    // FLI file (1/70 sec convert to msec)
    }
    else if (FLIhead.magic == 0xAF12) {
      FLIpause = FLIhead.speed;    // FLC file (speed in 1/1000 sec)
    }
    if (FLIpause == 0) { FLIpause = 50; }  // add default delay if zero (not in spec)
    //console.log("speed:" + FLIhead.speed + " pause:" + FLIpause + " ms");

    // setup 256 color palette
    FLI_R = new Array(256);
    FLI_G = new Array(256);
    FLI_B = new Array(256);
    for (var i=0; i < 256; i++) {
      FLI_R[i] = 0;
      FLI_G[i] = 0;
      FLI_B[i] = 0;
    }
  }

  function loadFLI(filename) {
    var debug2 = document.getElementById('debug2');

    // if FLI is playing, stop playing and reset Play button
    if(FLIplaying) { 
      playOrStop();
    }

    // define FLI format structs
    BinStruct.struct('fli_head', [
      ['uint32', 'size'     ],
      ['uint16', 'magic'    ],   // 0xAF11 = FLI, 0xAF12 = FLC
      ['uint16', 'frames'   ],
      ['uint16', 'width'    ],
      ['uint16', 'height'   ],
      ['uint16', 'depth'    ],   // 8 colorbits
      ['uint16', 'flags'    ],
      ['uint32', 'speed'    ],   // FLI:x/70 sec, FLC:x/1000 sec pause between frames
      ['uint16', 'reserved' ],
      ['uint32', 'created'  ],
      ['uint32', 'creator'  ],
      ['uint32', 'updated'  ],
      ['uint32', 'updater'  ],
      ['uint16', 'aspectx'  ],
      ['uint16', 'aspecty'  ],
      ['byte'  , 'reserved1', 38 ],
      ['uint32', 'oframe1'  ],
      ['uint32', 'oframe2'  ],
      ['byte'  , 'reserved2', 40 ],
    ]);

    BinStruct.struct('fli_frame', [
      ['uint32', 'size'     ],
      ['uint16', 'type'     ],   // always 0xF1FA
      ['uint16', 'chunks'   ],
      ['byte'  , 'reserved', 8 ]
    ]);

    BinStruct.struct('fli_data', [
      ['uint32', 'size'],
      ['uint16', 'type']
    ]);

    // show filename
    var imgTitle = document.getElementById('imgTitle');
    imgTitle.innerHTML = filename;

    // open file for binary reading
    //debug2.innerHTML = '<h3>Loading...</h3>';
    FLIfile = new BinFile();
    FLIfile.open(filename);

    FLIhead = FLIfile.read('fli_head');
    debug2.innerHTML = '<h3>fli_head:</h3><br/>' + outSource(FLIhead);

    // check for valid magic code
    if ((FLIhead.magic != 0xAF11) && (FLIhead.magic != 0xAF12)) {
      alert('Not an FLI/FLC file!'); return; 
    }

    // store pos of first frame
    if (FLIhead.oframe1 > 0) {
      FLIframe1pos = FLIhead.oframe1;
      FLIfile.seek(FLIframe1pos);
    }
    else {
      FLIframe1pos = FLIfile.getPos();  
    }

    initFLI();
  }


  // plays or continues playing FLI file to canvas
  function playFLI() {
    if (!(FLIfile && FLIhead)) { alert('Must open FLI first!'); return false; }
    FLIplaying = true;

    if (FLIframeNum < FLIhead.frames) {
      // draw next frame
      drawFLIframe();
    }
    else {
      // start again from first frame
      FLIframeNum = 1;
      FLIfile.seek(FLIframe1pos);
      drawFLIframe();
    }
    return true;
  }

  function stopFLI() {
    window.clearTimeout(FLItimer);
    FLIplaying = false;
    //alert('FLI stopped');
  }

  function resetFLI() {
    if (FLIfile && FLIhead && FLIcanvas && FLIg) {
      document.getElementById('FLIcount').innerHTML = '0/' + FLIhead.frames;
      FLIg.clearRect(0, 0, FLIcanvas.width, FLIcanvas.height);    // clear canvas
      FLIframeNum = 1;
      FLIfile.seek(FLIframe1pos);
    }
  }

  function playOrStop() {
    var playstop = document.getElementById('playstop');
    if (FLIplaying) {
      stopFLI();
      playstop.innerHTML = 'Play';
    }
    else {
      if (playFLI()) {
        playstop.innerHTML = 'Stop';
      }
    }
  }

  // Converts indexed to 24-bit image using palette, then updates canvas
  function updateCanvas() {
    var numpix = FLIi.data.length;
    for (var i=0; i < numpix; i++) {
      FLIimg.data[i*4  ] = FLI_R[ FLIi.data[i] ];
      FLIimg.data[i*4+1] = FLI_G[ FLIi.data[i] ];
      FLIimg.data[i*4+2] = FLI_B[ FLIi.data[i] ];
      FLIimg.data[i*4+3] = 255;
    }
    FLIg.putImageData(FLIimg, 0, 0);
  }

  // Draws 1 FLI frame, then setTimeout() to next frame
  function drawFLIframe() {
    var i, j, x, y, c, n, idx;
    var skip, chng, size, red, green, blue;
    var linepos, startline, numlines, start, pak, word, wordt, lastp, p1, p2;

    // setup timer for next frame
    if (FLIframeNum <= FLIhead.frames) {
      FLItimer = window.setTimeout(drawFLIframe, FLIpause);
    }
    else {
      // last frame, so prepare stop
      //playOrStop();
    }

    // draw frame
    var framePos = FLIfile.getPos();
    var frameChunk = FLIfile.read('fli_frame');

    if (frameChunk.type == 0xF1FA) {
      // loop thru all chunks in a frame
      for (c=0; c < frameChunk.chunks; c++) {
        var dataPos = FLIfile.getPos();
        var dataChunk = FLIfile.read('fli_data');

        //alert('f=' + FLIframeNum + ' chunk: '+ outSource(dataChunk) );   // TEST

        switch (dataChunk.type) {
          case 4:     // FLI_COLOR256 - 256-level color palette info
          case 11:    // FLI_COLOR     - 64-level color palette info
            //alert('f=' + FLIframeNum + ' chunk: '+ outSource(dataChunk) );   // TEST
            idx = 0;
            n = FLIfile.read('int16');
            for (i=0; i < n; i++) {
              skip = FLIfile.read('uint8');
              chng = FLIfile.read('uint8');
              idx += skip;
              if (chng == 0) { chng = 256; }
              for (j=0; j < chng; j++) {
                red   = FLIfile.read('uint8');
                green = FLIfile.read('uint8');
                blue  = FLIfile.read('uint8');
                if (dataChunk.type == 4) {
                  FLI_R[idx] = red;
                  FLI_G[idx] = green;
                  FLI_B[idx] = blue;
                }
                else {
                  FLI_R[idx] = (red << 2) & 0xff;
                  FLI_G[idx] = (green << 2) & 0xff;
                  FLI_B[idx] = (blue << 2) & 0xff;
                }
                idx++;
              }
            }
            drawPalette();  // TEST
            break;

          case 7:     // FLI_SS2 - Word-oriented delta compression (FLC)
            //alert('f=' + FLIframeNum + ' chunk: '+ outSource(dataChunk) );   // TEST

            linepos = 0;
            pak = 0;
            numlines = FLIfile.read('int16');
            for (y=0; y < numlines; y++) {
              do {
                word = FLIfile.read('uint16');
                wordt = (word & 0xC000);
                switch (wordt) {
                  case 0: pak = word; break;
                  case 0x8000: lastp = (word & 0xFF); break;
                  case 0xC000: linepos += ((0x10000 - word) * FLIhead.width); break;
                }
              } while (wordt != 0);
              x = 0;
              for (i=0; i < pak; i++) {
                skip = FLIfile.read('uint8');
                size = FLIfile.read('int8');
                x += skip;
                if (size < 0) {
                  size = -size;
                  p1 = FLIfile.read('uint8');
                  p2 = FLIfile.read('uint8');
                  for (j=0; j < size; j++) {
                    FLIi.data[linepos + x] = p1;
                    FLIi.data[linepos + x + 1] = p2;
                    x += 2;
                  }
                }
                else {
                  for (j=0; j < size; j++) {
                    p1 = FLIfile.read('uint8');
                    p2 = FLIfile.read('uint8');
                    FLIi.data[linepos + x] = p1;
                    FLIi.data[linepos + x + 1] = p2;
                    x += 2;
                  }
                }
              }
              linepos += FLIhead.width;
            }
            break;

          case 12:    // FLI_LC - Byte-oriented delta compression

            startline = FLIfile.read('int16');
            numlines = FLIfile.read('uint8');
            linepos = startline * FLIhead.width;
            start = FLIfile.read('uint8');
            for (y=0; y < numlines; y++) {
              pak = FLIfile.read('uint8');
              x = start;
              for (i=0; i < pak; i++) {
                skip = FLIfile.read('uint8');
                size = FLIfile.read('int8');
                x += skip;
                if (size < 0) {
                  size = -size;
                  n = FLIfile.read('uint8');
                  for (j=0; j < size; j++) {
                    FLIi.data[linepos + x] = n;
                    x++;
                  }
                }
                else {
                  for (j=0; j < size; j++) {
                    FLIi.data[linepos + x] = FLIfile.read('uint8');
                    x++;
                  }
                }
              }
              linepos += FLIhead.width;
            }
            break;

          case 13:    // FLI_BLACK - Entire frame is color index 0

            //alert('f=' + FLIframeNum + ' (FLI_BLACK) chunk: '+ outSource(dataChunk) );   // TEST
            for (i=0; i < FLIi.data.length; i++) {
              FLIi.data[i] = 0;
            }
            break;

          case 15:    // FLI_BRUN - Byte run length compression

            linepos = 0;
            for (y=0; y < FLIhead.height; y++) {
              FLIfile.read('int8');    // first byte ignored
              var x=0;
              while (x < FLIhead.width) {
                size = FLIfile.read('int8');   // does 'byte' return correct value?
                if (size < 0) {
                  size = -size;
                  for (i=0; i < size; i++) {
                    FLIi.data[linepos + x] = FLIfile.read('uint8');
                    x++;
                  }
                }
                else {
                  n = FLIfile.read('uint8');
                  for (i=0; i < size; i++) {
                    FLIi.data[linepos + x] = n;
                    x++;
                  }
                }
              }
              linepos += FLIhead.width;
            }
            break;

          case 16:    // TODO: FLI_COPY - No compression

            //alert('f=' + FLIframeNum + ' (FLI_COPY) chunk: '+ outSource(dataChunk) );   // TEST
            break;

          case 18:    // FLI_PSTAMP - Postage stamp sized image (SKIP)

            //alert('f=' + FLIframeNum + ' (FLI_PSTAMP) chunk: '+ outSource(dataChunk) );   // TEST
            break;

          default:    // Unknown
            //alert('f=' + FLIframeNum + ' ('+ dataChunk.type +') chunk: '+ outSource(dataChunk) );   // TEST
        }
        FLIfile.seek(dataPos + dataChunk.size);
      } // next c
    }
    else {
      // Unknown frame chunk type
      //alert('unknown frame type: '+ outSource(frameChunk) );   // TEST
    }
    FLIfile.seek(framePos + frameChunk.size);

    document.getElementById('FLIcount').innerHTML = FLIframeNum + '/' + FLIhead.frames;
    FLIframeNum++;

    if (FLIframeNum > FLIhead.frames) {
      //alert('done');  // TEST
      // start again from first frame
      FLIframeNum = 1;
      FLIfile.seek(FLIframe1pos);
    }

    // draw the image to canvas context
    updateCanvas();

  } // end drawFLIframe()

