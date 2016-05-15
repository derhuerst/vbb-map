'use strict'

const stations = require('vbb-stations')
const PDF      = require('pdfkit')
const fs       = require('fs')
const lines    = require('vbb-lines')
const filter   = require('stream-filter')
const through  = require('through2')
const shorten  = require('vbb-short-station-name')

const _ = require('./helpers')



const all = {}
stations('all').on('error', console.error)
.on('data', (station) => {all[station.id] = station})
.on('end', () => {

	const pdf = new PDF()
	pdf.lineCap('round'); pdf.lineJoin('round')
	pdf.fontSize(1); pdf.lineWidth(.5)
	pdf.pipe(fs.createWriteStream('rendered/all.pdf'))

	lines('all')
	.pipe(filter((l) => l.type === 'subway'))
	.pipe(through.obj(function (line, _, next) {
		const self = this
		line.variants = line.variants.map((stations) => {
			const enriched = stations.map((id) => all[id])
			enriched.line = line.name
			self.push(enriched)
		})
		next()
	}))

	.on('error', console.error)
	.on('end', () => pdf.end())
	.on('data', (variant) => {

		let first = true
		for (let station of variant) {
			if (!station) continue
			const x = _.translate.x(station.longitude)
			const y = _.translate.y(station.latitude)
			if (first) {first = false; pdf.moveTo(x, y)}
			else pdf.lineTo(x, y)
			pdf.text(shorten(station.name), x + 1, y)
		}
		pdf.strokeColor(_.color(variant.line))
		pdf.stroke()

	})
})
