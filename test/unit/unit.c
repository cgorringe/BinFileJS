// unit.c
// Copyright (c) 2011 by Carl Gorringe <car1@gorringe.org>
// Licensed under the MIT license: http://www.opensource.org/licenses/mit-license
// https://github.com/cgorringe/BinFileJS
// 3/13/2011
//
// Creates a binary file for use with the
// BinFile.js Unit Test.
//
// Usage: unit filename.bin

#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <math.h>
#include <float.h>

#pragma pack(push)  // push current alignment to stack 
#pragma pack(1)     // set alignment to 1 byte boundary 

// Unit Test Structure
typedef struct { 
  int32_t magic;

  // 8-bit ints
  int8_t  a1;
  int8_t  a2;
  int8_t  a3;
  int8_t  a4;
  uint8_t a5;
  uint8_t a6;
  int8_t  a7[4];

  // 16-bit ints
  int16_t  b1;
  int16_t  b2;
  int16_t  b3;
  int16_t  b4;
  uint16_t b5;
  uint16_t b6;
  int16_t  b7[4];

  // 32-bit ints
  int32_t  c1;
  int32_t  c2;
  int32_t  c3;
  int32_t  c4;
  uint32_t c5;
  uint32_t c6;
  int32_t  c7[4];

  // 32-bit IEEE 754 float
  float d1;
  float d2;
  float d3;
  float d4;
  float d5;
  float d6;
  float d7;
  float d8;
  float d9;

  // 64-bit IEEE 754 float
  double e1;
  double e2;
  double e3;
  double e4;
  double e5;
  double e6;
  double e7;
  double e8;
  double e9;

  // nested struct?

  // wchar_t
  // chars

} UnitTestStruct;

#pragma pack(pop)   // restore original alignment from stack 

// ----------------------------------------------------------------------------
void die(char* errtext)
{
  perror(errtext);
  exit(EXIT_FAILURE);
}

// ----------------------------------------------------------------------------
int main(int argc, char *argv[])
{
  if (argc != 2) {
    printf("Creates a binary file for use with the BinFile.js Unit Test.\n");
    printf("Copyright (c) 2011 Carl Gorringe <car1@gorringe.org>\n\n");
    printf("Usage: %s outfile.bin\n\n", argv[0]);
    return EXIT_FAILURE;
  }

  printf("Creating Unit Test file: %s \n", argv[1]);
  FILE *OUT;
  if ((OUT = fopen(argv[1], "wb")) == NULL) die("Cannot open output file");

  UnitTestStruct *data;
  data = (UnitTestStruct *) calloc(1, sizeof(UnitTestStruct));

  // ---- Test Data ----
  data->magic = 0x1234;  // = 4660

  // 8-bit ints
  data->a1 =    1;
  data->a2 =   -1;
  data->a3 = -128;
  data->a4 =  127;
  data->a5 =    0;
  data->a6 =  255;
  data->a7[0] = 1;
  data->a7[1] = 2;
  data->a7[2] = 3;
  data->a7[3] = 4;

  // 16-bit ints
  data->b1 =      1;
  data->b2 =     -1;
  data->b3 = -32768;
  data->b4 =  32767;
  data->b5 =      0;
  data->b6 = 0xFFFF;  // = 65535
  data->b7[0] =   5;
  data->b7[1] =   6;
  data->b7[2] =   7;
  data->b7[3] =   8;

  // 32-bit ints
  data->c1 =  1;
  data->c2 = -1;
  data->c3 = -2147483647-1;  // to avoid compiler warning
  data->c4 = 2147483647;
  data->c5 = 0;
  data->c6 = 0xFFFFFFFF;  // = 4294967295
  data->c7[0] =  9;
  data->c7[1] = 10;
  data->c7[2] = 11;
  data->c7[3] = 12;

  // 32-bit floats
  data->d1 =  0;
  data->d2 = -1;
  data->d3 =  1.23456E+10;  // normalized
  data->d4 =  5.88E-39;    // denormalized  
  data->d5 =  FLT_MIN;    // 1.175494e-38  normalized
  data->d6 =  FLT_MAX;    // 3.402823e+38  normalized
  data->d7 = -INFINITY;
  data->d8 = +INFINITY;
  data->d9 =  NAN;        // QNaN

  // 64-bit doubles
  data->e1 =  0;
  data->e2 = -1;
  data->e3 =  1.23456E+10;  // normalized
  data->e4 =  5.88E-39;    // denormalized  (TODO: replace number)
  data->e5 =  DBL_MIN;    // 2.225074e-308
  data->e6 =  DBL_MAX;    // 1.797693e+308   1.7976931348623157e+308
  data->e7 = -INFINITY;
  data->e8 = +INFINITY;
  data->e9 =  NAN;        // QNaN

  // chars & strings
  // TODO


  if (fwrite(data, sizeof(UnitTestStruct), 1, OUT) != 1) {
    fprintf(stderr, "ERROR Writing Structure!\n");
  }

  // cleaning up
  free(data);
  data = NULL;
  if (fclose(OUT) != 0) die("Cannot close output file");
  printf("Done.\n");
  return EXIT_SUCCESS;
}

