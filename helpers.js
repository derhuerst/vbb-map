'use strict'

const bbox     = require('german-states-bbox').BE // Berlin
const parse    = require('vbb-parse-line')
const colors   = require('vbb-util/lines/colors')
const map      = require('through2-map')



const left   = bbox[1]
const top    = bbox[0]
const right  = bbox[3]
const bottom = bbox[2]
const translate = {
	  x: (x) => (x - left) / (right - left) * 600
	, y: (y) => (y - top)  / (bottom - top) * 600
}

const color = (line) => {
	line = parse(line)
	if (colors[line.type] && colors[line.type][line._])
		return colors[line.type][line._].bg
	return '#333'
}

const round = (x) => Math.round(x * 10000) / 10000

const relative = (translate) => {
	let previous = {x: 0, y: 0}
	return map({objectMode: true}, (node) => {
		const x = translate.x(node.longitude)
		const y = translate.y(node.latitude)
		const delta = {dx: x - previous.x, dy: y - previous.y}
		previous = {x, y}
		return delta
	})
}



module.exports = {translate, color, round, relative}
