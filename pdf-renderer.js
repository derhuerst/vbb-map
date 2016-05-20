'use strict'

const PDF     = require('pdfkit')
const shorten = require('vbb-short-station-name')

const _ = require('./helpers')



const renderer = () => {
	const pdf = new PDF()
	pdf.lineCap('round'); pdf.lineJoin('round')

	const renderedSegments = {}
	const stationsToRender = {}

	const draw = {
		  line: (width, color, x1, y1, x2, y2) => {
			pdf.lineWidth(width); pdf.strokeColor(color)
			pdf.moveTo(x1, y1); pdf.lineTo(x2, y2); pdf.stroke()
		}
		, circle: (x, y, r, c) => {
			pdf.lineWidth(r/5); pdf.fillColor(c)
			pdf.circle(x, y, r); pdf.fill()
		}
		, text: (x, y, t, s, c) => {
			pdf.fontSize(s); pdf.fillColor(c)
			pdf.text(t, x, y)
		}
	}

	return {

		segment: (line, from, to) => {
			if (!renderedSegments[from.id + '-' + to.id]) {
				renderedSegments[from.id + '-' + to.id] = true
				const x1 = _.translate.x(from.longitude)
				const y1 = _.translate.y(from.latitude)
				const x2 = _.translate.x(to.longitude)
				const y2 = _.translate.y(to.latitude)
				draw.line(.5, _.color(line.name), x1, y1, x2, y2)
			}

			stationsToRender[from.id] = from
			stationsToRender[to.id]   = to
		},

		data: () => {
			for (let id in stationsToRender) {
				const station = stationsToRender[id]
				const x = _.translate.x(station.longitude)
				const y = _.translate.y(station.latitude)
				draw.circle(x, y, .5, '#000000')
				draw.text(x + 1, y, shorten(station.name), 2, '#000000')
			}
			pdf.end()
			return pdf
		}
	}
}

module.exports = renderer
