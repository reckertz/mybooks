# mybooks
scan books with barcode for isbn, get information with node-isbn, store in sqlite3 database

## usage
You can enter the isbn of a book with a scanner or you can enter the isbn with the keyboard or with voice input.
Voice input is supported and tested on Chrome and Edge.

The scan-Input is checked as ISBN-10 or ISBN-13, if valid the ISBN is processed.
If the ISBN is not readable or not visible, you can search the books by title.

The title is queried against openlibrary.org via ajax from node.js.
Book-Data are retieved by npm module node-isbn.

The user can enter a box-id for the location of a book and a comment regarding the book.

## installation

Installation requirements are node.js and windows (so far), test on Ubuntu coming soon.

After installing mybooks from github npm install, sqlite3 has to be installed additionally
with npm install sqlite3.

node.js server.js is the starting js module.

Usage in the browser on port 3000, so far localhost is recommended, https will be added soon.
