'use strict'

const stations = require('vbb-stations/full.json')
const fs       = require('fs')
const lines    = require('vbb-lines')
const filter   = require('stream-filter')
const through  = require('through2')
const shorten  = require('vbb-short-station-name')

const _        = require('./helpers')
const renderer = require('./pdf-renderer')()



const all = {}
for (let stationId in stations) {
	const station = stations[stationId]

	all[station.id] = station
	if (station.stops) {
		for (let stop of station.stops) all[stop.id] = stop
	}
}



lines('all')
.pipe(filter.obj((l) => l.type === 'subway'))
.on('data', (line) => {
	for (let variant of line.variants) {
		for (let i = 1; i < variant.length; i++) {
			const from = all[variant[i - 1]]
			const to   = all[variant[i]]
			renderer.segment(line, from, to)
		}
	}
})
.on('end', () => {
	renderer.data().pipe(fs.createWriteStream('rendered/all.pdf'))
	.on('finish', () => console.log('done'))
})
