'use strict'

const stations = require('vbb-stations')
const fs       = require('fs')
const lines    = require('vbb-lines')
const filter   = require('stream-filter')
const through  = require('through2')
const shorten  = require('vbb-short-station-name')

const _        = require('./helpers')
const renderer = require('./pdf-renderer')



const all = {}
stations('all').on('error', console.error)
.on('data', (station) => {all[station.id] = station})
.on('end', () => {

	const render = renderer()
	lines('all')
	.pipe(filter((l) => l.type === 'subway'))
	.on('data', (line) => {
		for (let variant of line.variants) {
			for (let i = 1; i < variant.length; i++) {
				const from = all[variant[i - 1]]
				const to   = all[variant[i]]
				render.segment(line, from, to)
			}
		}
	})
	.on('end', () => {
		render.data().pipe(fs.createWriteStream('rendered/all.pdf'))
		.on('finish', () => console.log('done'))
	})
})
