// binfile.js
// Copyright (c) 2011 Carl Gorringe <car1@gorringe.org>
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license
// https://github.com/cgorringe/BinFileJS
// 1/25/2011 - 2/2/2011

function BinFile() {
  this.errno = 0;
  this._data = '';
  this._pos = 0;
  this._littleEndian = true;   // true = Intel byte order: 0x1234 stored as "34 12"
                              // false = Network byte order
};

BinFile.prototype = {

  open: function(url, byteOrder) {  
    // TODO: redo as async

    // optional: byteOrder = {"little", "big"}  default = "little" (Intel byte order)
    if (typeof byteOrder !== 'undefined') { this.setByteOrder(byteOrder); }
    else { this.setByteOrder('little'); }

    var req = new XMLHttpRequest();
    req.open('GET', url, false);
    req.overrideMimeType('text/plain; charset=x-user-defined');
    req.send(null);
    this.errno = req.status;
    if (req.status != 200) {
      this._data = '';
			// throw new Error("Can't open file");
      return false;
    }
    this._data = req.responseText;
    return true;
  },

  // TODO: what to do if out of range? (0..length-1)
  seek:   function(pos) { this._pos = pos; },
  rewind: function()    { this._pos = 0; },

  setByteOrder: function(byteOrder) {
    // byteOrder: 'little' = little-endian (Intel byte order)
    //            'big'    = big-endian    (Network byte order)
    this._littleEndian = (byteOrder == 'big') ? false : true; 

  },

  // TODO: keep only one of these?
  getPos: function() { return this._pos; },
  tell: function() { return this._pos; },
  size: function() { return (this._data) ? this._data.length : 0; },

  // TODO: slice() method (see FileAPI)
  // blob = slice(startbyte, endbyte, "mimetype")

  close: function() {
    // clears data buffer and resets object properties.
    this._data = '';
    this._pos = 0;
    this._littleEndian = true;
    this.errno = 0;
  },

  // TODO: rename?
  getc: function() {
    // not tested
		var b = this._data.charCodeAt(this._pos) & 0xff;
    this._pos++;
    return b;
  },

  read: function(type, count) {
    if (typeof type === 'undefined')  { return null; }    // "type" is a primitive or custom type (mandatory)
    if (typeof count === 'undefined') { var count = 1; }  // "count" is optional, default = 1
    var obj = BinStruct.extract(this._data, this._pos, type, count, this._littleEndian);
    this._pos += BinStruct.sizeof(type) * count;  // TODO: variable-length types
    return obj;
  }
};

var BinStruct = {
  littleEndian : true,
  types: {
    'byte'    : [1],
    'int8'    : [1],  // 8-bit signed int
    'uint8'   : [1],  // 8-but unsigned int
    'short'   : [2],
    'int16'   : [2],  // 16-bit signed int
    'uint16'  : [2],  // 16-bit unsigned int
    'int'     : [4],
    'int32'   : [4],  // 32-bit signed int
    'uint32'  : [4],  // 32-bit unsigned int
    'float'   : [4],  // 32-bit IEEE 754 float
    'double'  : [8],  // 64-bit IEEE 754 double float
    'char'    : [1],  // 8-bit US-ASCII character? (ISO-8859-1)?
    'wchar'   : [2],  // 16-bit unicode character
    'chars'   : []    // special string type based on 'char'
  },

  // returns number of bytes in type
  sizeof: function(type) {
    var t = this.types[type];
    if (t) {
      if (t.length > 0) {
        return t[0];
      }
      else {
        // special variable length type (e.g. "chars") TODO: revisit
        return 1;
      }
    }
    else { return 0; }
  },


  // Define a new data type structure.
  //   def = [ ["type1","id1",count1], ["type2","id2",count2], ...]
  //   counts are optional, default = 1
  // TODO: prevent redefining already-defined types?

  struct: function(newtype, def) {
    var st = [];
    var s_type, s_count, size = 0;
    st[0] = 0;
    for (var i=0; i < def.length; i++) {
      s_type  = def[i][0];
      if (!this.types[s_type]) {
        alert('Unrecognized data type "'+ s_type +'" in new struct "'+ newtype +'"');   // TEST
        continue;
      }
      s_count = (def[i][2]) ? def[i][2] : 1;    // TODO: char as count for var-length strings
      def[i][2] = s_count;
      size += this.sizeof(s_type) * s_count;
      st.push(def[i]);
    }
    st[0] = size;
    this.types[newtype] = st;
  },


  // Define a new bitfield structure. (NOT TESTED)
  // Bitfields are allocated from LSB (i.e. starting at bit 0) to MSB.
  //   size = num of bytes in bitfield OR datatype (uses sizeof(datatype))
  //   def = [ ["id1", numbits1], ["id2", numbits2], ...]
  // TODO: assumes valid input. Also needs testing.

  bitfield: function(newtype, size, def) {
    var st = [];
    if (typeof size === 'number') { st[0] = size; }
    else { st[0] = this.sizeof(size); }
    for (var i=0; i < def.length; i++) {
      st.push( ['bit', def[i][0], def[i][1]] );
    }
    this.types[newtype] = st;
  },


  extract: function(data, pos, type, count, lendian) {
    if (typeof count === 'undefined')   { var count = 1; } // optional: default = 1
    if (typeof lendian !== 'undefined') { this.littleEndian = lendian; } // optional: true, false
    var o, r;
    if (o = this.types[type]) {
      var result = [];
      var size = this.sizeof(type);      
      if (o.length == 1) {
        // primitive type
        for (var i=0; i < count; i++) {
          r = this['get_'+type](data, pos);
          pos += size;
          result.push(r);
        }
      }
      else if (o.length == 0) {
        // special variable length type (e.g. "chars") TODO: revisit
        r = this['get_'+type](data, pos, count);
        pos += size * count;
        result.push(r);
      }
      else {
        // struct type
        // [ size, ["type1", "id1", count1], ["type2", "id2", count2], ... ]
        var s_id, s_type, s_count;
        for (var i=0; i < count; i++) {
          r = {};
          for (var j=1; j < o.length; j++) {
            s_type  = o[j][0];
            s_id    = o[j][1];
            s_count = o[j][2];
            r[s_id] = this.extract(data, pos, s_type, s_count);  // extract structure recursively
            // TODO: BUG? Incr pos twice here (other time in recursive call)??
            pos += this.sizeof(s_type) * s_count;
          }
          result.push(r);
        }
      }
      if (result.length == 1) { result = result[0]; }  // strip off array if only one item
      return result;
    }
    else {
      // type not found
      return null;
    }
  },


  // TODO: NOT DONE, NOT USED YET
  // only works with 8-bits for now (NOT TESTED)
  getBits: function(data, pos, bpos, numbits) {
    var b = this.get_uint8(data, pos);
    return ( (b >>> bpos) & (0xFF >>> (8 - numbits)) );
  },

  // Byte
  get_uint8: function(data, pos) {
    // TODO: override this function for IE version?
    return data.charCodeAt(pos) & 0xff;
  },
  get_int8: function(data, pos) {
    var n = this.get_uint8(data, pos);
    return ((n < 0x80) ? n : (n - 0x100))
  },
  get_byte: function(data, pos) {
    return this.get_int8(data, pos);
  },

  // Short
  get_uint16: function(data, pos) {
    var n;
    if (this.littleEndian) {
      n = this.get_uint8(data,pos) + (this.get_uint8(data,pos+1) << 8);
    }
    else {
      n = this.get_uint8(data,pos+1) + (this.get_uint8(data,pos) << 8);
    }
    return n;
  },
  get_int16: function(data, pos) {
    var n = this.get_uint16(data, pos);
    return ((n < 0x8000) ? n : (n - 0x10000));
  },
  get_short: function(data, pos) {
    return this.get_int16(data, pos);
  },

  // Integer
  get_uint32: function(data, pos) {
    var n, msb;
    if (this.littleEndian) {
      msb = this.get_uint8(data,pos+3);
      if ((msb & 0x80) == 0) {
        // high-order bit is 0, no worries about sign bit
        n = this.get_uint8(data,pos) + (this.get_uint8(data,pos+1) << 8) + 
            (this.get_uint8(data,pos+2) << 16) + (msb << 24);
      }
      else {
        // high-order bit is 1, so must treat sign-bit as non-signed
        n = this.get_uint8(data,pos) + (this.get_uint8(data,pos+1) << 8) + 
            (this.get_uint8(data,pos+2) << 16);
        n += (msb * 16777216);  // same as: msb * 2^24 or << 24
      }
    }
    else {
      msb = this.get_uint8(data,pos);
      if ((msb & 0x80) == 0) {
        // high-order bit is 0, no worries about sign bit
        n = this.get_uint8(data,pos+3) + (this.get_uint8(data,pos+2) << 8) + 
            (this.get_uint8(data,pos+1) << 16) + (msb << 24);
      }
      else {
        // high-order bit is 1, so must treat sign-bit as non-signed
        n = this.get_uint8(data,pos+3) + (this.get_uint8(data,pos+2) << 8) + 
            (this.get_uint8(data,pos+1) << 16);
        n += (msb * 16777216);  // same as: msb * 2^24 or << 24
      }
    }
    return n;
  },
  get_int32: function(data, pos) {
    var n = this.get_uint32(data, pos); 
    return ((n < 0x80000000) ? n : (n - 0x100000000));
  },
  get_int: function(data, pos) {
    return this.get_int32(data, pos);
  },


  // Floating-Point

  // 32-bit: sign:1, exp:8, frac:23 (TODO: NOT DONE)
  get_float: function(data, pos) {
    // TODO: NOT DONE
    var num = this.get_uint32(data, pos);
    var f = (num & 0x07FFFFF);
    var e = ((num >>> 23) & 0xFF) -127;  // -127 is the bias
    var s = ((num >>> 31) & 0x01);
    var result = ' s='+s +' e='+e +' f='+f;  // TEST

    if (e == -127) {  // zero or denormalized number
      if (f == 0) { result = 0; }
      else {
        // TODO: denormalized numbers not tested in Unit Tests.
        // instead we just round to 0 since it's very close
        result = 0;
        //result = 'd:'+result;  // TEST
      }
    }
    else if (e == 128) { // Infinity or NaN
      result = (f == 0) ? ((s) ? -Infinity : Infinity) : NaN;
    }
    else {  // normalized number
      result = 'n:'+result;  // TEST
    }
    //result = (e == 128) ? ((f == 0) ? ((s) ? -Infinity : Infinity) : NaN) : text;
    return result;
  },

  // 64-bit: sign:1, exp:11, frac:52
  // NOTE: Can't work with 64-bit ints directly!
  get_double: function(data, pos) {
    // TODO
    return 0;
  },

  // Characters
  get_char: function(data, pos) {
    return data.substr(pos, 1);
  },
  get_wchar: function(data, pos) {
    // TODO
    return '';
  },

  // Special Variable-length types?
  get_chars: function(data, pos, count) {
    return data.substr(pos, count);
  },

};

