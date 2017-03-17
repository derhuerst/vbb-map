'use strict'

const pump = require('pump')
const filter = require('stream-filter')
const through  = require('through2')
const path = require('path')
const fs = require('fs')
const simplify = require('simplify-path')

const stations = require('vbb-stations/full.json')
const trips = require('vbb-trips')
const shapes = require('vbb-shapes')

const renderer = require('./pdf-renderer')

const showError = (err) => {
	if (!err) return
	console.error(err)
	process.exit(1)
}



// flatten stations & stops into an id map
const all = {}
for (let stationId in stations) {
	const station = stations[stationId]

	all[station.id] = station
	if (station.stops) {
		for (let stop of station.stops) all[stop.id] = stop
	}
}



trips.lines(true, 'all')
.then((lines) => lines.reduce((all, line) => {
	all[line.id] = line
	return all
}, {}))

.then((lines) => new Promise((yay, nay) => {

	const renderedShapes = {} // booleans by id
	const render = renderer()

	pump(
		trips.schedules('all'),
		filter.obj((sched) => {
			const line = sched.route && sched.route.line ? lines[sched.route.line] : null
			if (!line) return false
			sched.route.line = line

			if (!sched.shape) return false

			// These can be drawn reasonably.
			return line.product === 'subway' || line.product === 'suburban' || line.product === 'tram'
		}),
		filter.async.obj((sched, cb) => {
			if (renderedShapes[sched.shape]) return cb(false)
			renderedShapes[sched.shape] = true

			shapes(sched.shape)
			.then((shape) => {
				sched.shape = shape
				cb(null, true)
			})
			.catch(cb)
		}),
		showError
	)
	.on('data', (sched) => {
		const points = simplify(sched.shape, .0001)
		for (let i = 1; i < points.length; i++) {
			const from = points[i - 1]
			const to = points[i]
			render.segment(sched.route.line, from, to)
		}
	})
	.once('end', () => yay(render.data()))

}))

.then((pdf) => pdf.pipe(process.stdout))

.catch(showError)
