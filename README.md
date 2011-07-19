README
------

BinFileJS v0.01
by Carl Gorringe <car1@gorringe.org>
5/9/2011

BinFileJS is a JavaScript utility for reading binary files from within any web browser, including browsers from within the last few years.

Once it's completed, it will support multiple binary data types, including 8,16,32-bit signed and unsigned integers, 32,64-bit floats (IEEE 754), and fixed or variable-length strings.  One nice feature is that BinFileJS lets users create their own types, just like C-style structs.  This makes it very easy to port C data structures to Javascript.


Installation
------------

Download the `binfile.js` file and use like any other JavaScript program.  It should also work alongside other Javascript libraries such as jQuery, for example.

A minimized version will be available in the future.

Please do not link directly to the GitHub repository or my website, but instead copy the file locally to your own server.


How To Use
----------

Right now the utility is still a work in progress and so the interface may change at any time.  Features which are yet to be completed are listed in the TODO file.  

You can try out the test HTML files in the tests directory.  To view them, copy all of the files to a running web server's directory. (e.g. under /var/www using Apache in Linux on localhost).  Opening the files directly in a web browser will not work at this time, since the library uses AJAX calls which are performed using the http protocol.  This may be fixed in the future for browsers that have local file support using FileAPI.


