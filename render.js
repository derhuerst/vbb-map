'use strict'

const stations = require('vbb-stations/full.json')
const lines    = require('vbb-lines')
const filter   = require('stream-filter')
const through  = require('through2')
const shorten  = require('vbb-short-station-name')
const shapes = require('vbb-shapes')
const simplify = require('simplify-path')
const fs = require('fs')
const path = require('path')

const _        = require('./helpers')
const renderer = require('./pdf-renderer')

const showError = (err) => {
	console.error(err)
	process.exit(1)
}



const all = {}
for (let stationId in stations) {
	const station = stations[stationId]

	all[station.id] = station
	if (station.stops) {
		for (let stop of station.stops) all[stop.id] = stop
	}
}



new Promise((yay, nay) => {
	const data = {}

	lines('all')
	.pipe(filter.obj((l) => l.type === 'subway' || l.type === 'suburban' || l.type === 'tram'))
	.on('data', (line) => data[line.id] = line)
	.once('error', nay)
	.once('end', () => yay(data))
})

.then((lines) => new Promise((yay, nay) => {
	const render = renderer()

	shapes().once('error', nay)
	.on('data', (shape) => {
		const line = lines[shape.lineId]
		if (!line) return console.error('unknown line', shape.lineId)

		const points = simplify(shape.points, .0001)
		for (let i = 1; i < points.length; i++) {
			// todo: use simplify-path here
			const from = points[i - 1]
			const to = points[i]
			render.segment(line, from, to)
		}
	})
	.once('error', (e) => nay(e))
	.once('end', () => yay(render.data()))
}))

.then((pdf) => {
	pdf.pipe(fs.createWriteStream(path.join(__dirname, 'rendered/all.pdf')))
	.on('finish', () => console.log('done'))
})

.catch(showError)
