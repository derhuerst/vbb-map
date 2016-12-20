'use strict'

const stations = require('vbb-stations/full.json')
const lines    = require('vbb-lines')
const filter   = require('stream-filter')
const through  = require('through2')
const shorten  = require('vbb-short-station-name')
const shapes = require('vbb-shapes')
const fs = require('fs')
const path = require('path')

const _        = require('./helpers')
const renderer = require('./pdf-renderer')



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
	// .pipe(filter.obj((l) => l.type === 'subway'))
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

		if (line.type === 'bus' || line.type === 'regional' || line.type === 'express') return

		for (let i = 1; i < shape.points.length; i++) {
			const from = shape.points[i - 1]
			const to = shape.points[i]
			render.segment(line, from, to)
		}
	})
	.once('end', () => yay(render.data()))
}))

.then((pdf) => {
	pdf.pipe(fs.createWriteStream(path.join(__dirname, 'rendered/all.pdf')))
	.on('finish', () => console.log('done'))
})
