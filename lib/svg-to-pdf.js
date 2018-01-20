const SVGtoPDF = require('svg-to-pdfkit')
const PDFDocument = require('pdfkit')
const base64 = require('base64-stream')


/**
 * Converts a base64 representation of an SVG into a base64 representation of the same file as PDF.
 */
module.exports = input => new Promise(resolve => {
  // Extract the SVG
  let svg = new Buffer(input, 'base64').toString('ascii')

  // Convert to a PDF document
  let doc = new PDFDocument()
  let pdf = SVGtoPDF(doc, svg, 24, 24)

  // Create a base64 output stream of the PDF
  let stream = doc.pipe(base64.encode())
  doc.end()

  // Collect the base64 string from the stream and resolve the result
  let finalString = ''
  stream.on('data', chunk => { finalString += chunk })
  stream.on('end', () => resolve(finalString))
})
