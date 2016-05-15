'use strict'

const parse    = require('vbb-parse-line')
const colors   = require('vbb-util/lines/colors')
const map      = require('through2-map')



// Berlin bounding box
const left   = 13.0882097323
const top    = 52.6697240587
const right  = 13.7606105539
const bottom = 52.3418234221
const translate = {
	  x: (x) => (x - left) / (right - left) * 100
	, y: (y) => (y - top)  / (bottom - top) * 100
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
