'use strict'

const PDF     = require('pdfkit')
const shorten = require('vbb-short-station-name')

const _ = require('./helpers')



const renderer = () => {
	const pdf = new PDF()
	pdf.addPage({margin: 50, size: [_.translate.w, _.translate.h]})
	pdf.lineCap('round')
	pdf.lineJoin('round')

	const renderedSegments = {}
	const stationsToRender = {}

	const drawLine = (width, color, x1, y1, x2, y2) => {
		pdf.lineWidth(width); pdf.strokeColor(color)
		pdf.moveTo(x1, y1); pdf.lineTo(x2, y2); pdf.stroke()
	}
	const drawCircle = (x, y, r, c) => {
		pdf.lineWidth(r/5); pdf.fillColor(c)
		pdf.circle(x, y, r); pdf.fill()
	}
	const drawText = (x, y, t, s, c) => {
		pdf.fontSize(s); pdf.fillColor(c)
		pdf.text(t, x, y)
	}

	const segment = (line, from, to) => {
		if (renderedSegments[from.id + '-' + to.id]) return
		renderedSegments[from.id + '-' + to.id] = true

		const {x: x1, y: y1} = _.translate(from.latitude, from.longitude)
		const {x: x2, y: y2} = _.translate(to.latitude, to.longitude)

		if (Math.max(x1, x2) <= _.translate.w && Math.min(x1, x2) >= 0
		 && Math.max(y1, y2) <= _.translate.h && Math.min(y1, y2) >= 0)
			drawLine(.5, _.color(line.name), x1, y1, x2, y2)

		stationsToRender[from.id] = from
		stationsToRender[to.id]   = to
	}

	const data = () => {
		for (let id in stationsToRender) {
			const station = stationsToRender[id]
			const {x, y} = _.translate(station.latitude, station.longitude)
			if (x <= _.translate.w && x >= 0
			 && y <= _.translate.h && y >= 0) {
				drawCircle(x, y, .5, '#000000')
				drawText(x + 2, y, shorten(station.name), 2, '#000000')
			}
		}
		pdf.end()
		return pdf
	}

	return {segment, data}
}

module.exports = renderer
